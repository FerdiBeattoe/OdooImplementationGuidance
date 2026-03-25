#!/usr/bin/env node

import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeProjectStorePayload } from "../shared/project-store.js";
import { normalizeProjectState } from "../shared/project-state.js";
import { normalizeAuditLog } from "../shared/audit-log.js";
import { normalizePreviewState } from "../shared/preview-engine.js";
import { normalizeExecutionState } from "../shared/execution-engine.js";
import { normalizeInspectionState } from "../shared/inspection-model.js";
import {
  buildConnectionAuditEntry,
  connectProject,
  disconnectProject,
  executePreview,
  inspectDomain,
  previewDomain
} from "./engine.js";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB limit
const requestLog = new Map();
const REQUEST_LOG_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(clientId) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  
  // Clean old entries
  for (const [key, timestamp] of requestLog) {
    if (timestamp < windowStart) {
      requestLog.delete(key);
    }
  }
  
  // Count requests in current window
  const clientRequests = Array.from(requestLog.entries())
    .filter(([key, timestamp]) => key.startsWith(`${clientId}:`) && timestamp >= windowStart)
    .length;
  
  if (clientRequests >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 1000) };
  }
  
  // Log this request
  requestLog.set(`${clientId}:${now}`, now);
  return { allowed: true };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const frontendRoot = path.resolve(repoRoot, "app", "frontend");
const sharedRoot = path.resolve(repoRoot, "app", "shared");
const dataRoot = path.resolve(repoRoot, "app", "backend", "data");
const projectStorePath = path.resolve(dataRoot, "projects.json");
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || "0.0.0.0";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

await ensureDataStore();

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const server = createAppServer();
  server.listen(port, host, () => {
    console.log(`Odoo Implementation Platform running at http://${host}:${port}`);
  });
}

export function createAppServer() {
  return createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
      const pathname = requestUrl.pathname;

      // Rate limiting — only apply to API routes
      if (pathname.startsWith("/api/")) {
        const clientId = req.socket.remoteAddress || 'unknown';
        const rateCheck = checkRateLimit(clientId);

        if (!rateCheck.allowed) {
          res.writeHead(429, {
            "Content-Type": "application/json; charset=utf-8",
            "Retry-After": rateCheck.retryAfter
          });
          res.end(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", retryAfter: rateCheck.retryAfter }));
          return;
        }
      }

      if (pathname === "/api/health" && req.method === "GET") {
        return sendJson(res, 200, { ok: true, service: "implementation-control-platform" });
      }

      if (pathname === "/api/projects" && req.method === "GET") {
        return sendJson(res, 200, await readProjectStore());
      }

      if (pathname === "/api/projects" && req.method === "PUT") {
        const payload = await readJsonBody(req);
        const normalized = await writeProjectStore(payload);
        return sendJson(res, 200, normalized);
      }

      if (pathname === "/api/connection/connect" && req.method === "POST") {
        return handleConnectionConnect(req, res);
      }

      if (pathname === "/api/connection/disconnect" && req.method === "POST") {
        return handleConnectionDisconnect(req, res);
      }

      if (pathname === "/api/domain/inspect" && req.method === "POST") {
        return handleDomainInspect(req, res);
      }

      if (pathname === "/api/domain/preview" && req.method === "POST") {
        return handleDomainPreview(req, res);
      }

      if (pathname === "/api/domain/execute" && req.method === "POST") {
        return handleDomainExecute(req, res);
      }

      if (pathname.startsWith("/shared/") && req.method === "GET") {
        return serveStatic(res, path.resolve(sharedRoot, `.${pathname.replace("/shared", "")}`), sharedRoot);
      }

      if (pathname.startsWith("/src/styles/") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, `.${pathname}`), frontendRoot);
      }

      if (pathname.startsWith("/styles/") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, `.${pathname}`), frontendRoot);
      }

      if (pathname.startsWith("/src/") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, `.${pathname}`), frontendRoot);
      }

      if ((pathname === "/" || pathname === "/index.html") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, "index.html"), frontendRoot);
      }

      return sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      return sendJson(res, 500, {
        error: "Server error",
        detail: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

async function handleConnectionConnect(req, res) {
  const payload = await readJsonBody(req);
  const project = normalizeProjectState(payload.project);

  try {
    const connectionState = await connectProject(project, payload.credentials);
    const nextProject = normalizeProjectState({
      ...project,
      connectionState,
      auditLog: normalizeAuditLog([
        ...(project.auditLog || []),
        buildConnectionAuditEntry(project, "connect", "Live Odoo connection established.")
      ])
    });

    return sendJson(res, 200, { project: nextProject });
  } catch (error) {
    const nextProject = normalizeProjectState({
      ...project,
      auditLog: normalizeAuditLog([
        ...(project.auditLog || []),
        buildConnectionAuditEntry(
          project,
          "connect",
          "Live Odoo connection failed.",
          error instanceof Error ? error.message : "Connection failed."
        )
      ])
    });

    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Connection failed.",
      project: nextProject
    });
  }
}

async function handleConnectionDisconnect(req, res) {
  const payload = await readJsonBody(req);
  const project = normalizeProjectState(payload.project);
  const connectionState = disconnectProject(project);
  const nextProject = normalizeProjectState({
    ...project,
    connectionState,
    auditLog: normalizeAuditLog([
      ...(project.auditLog || []),
      buildConnectionAuditEntry(project, "disconnect", "Live Odoo connection removed.")
    ])
  });
  return sendJson(res, 200, { project: nextProject });
}

async function handleDomainInspect(req, res) {
  const payload = await readJsonBody(req);
  const project = normalizeProjectState(payload.project);

  try {
    const inspection = await inspectDomain(project, payload.domainId);
    const nextProject = normalizeProjectState({
      ...project,
      inspectionState: normalizeInspectionState({
        domains: {
          ...(project.inspectionState?.domains || {}),
          [payload.domainId]: inspection
        }
      }),
      auditLog: normalizeAuditLog([
        ...(project.auditLog || []),
        buildConnectionAuditEntry(project, "inspect", `Inspection completed for ${payload.domainId}.`)
      ])
    });

    return sendJson(res, 200, { project: nextProject, inspection });
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Inspection failed." });
  }
}

async function handleDomainPreview(req, res) {
  const payload = await readJsonBody(req);
  const project = normalizeProjectState(payload.project);

  try {
    const result = await previewDomain(project, payload.domainId);
    const nextProject = normalizeProjectState({
      ...project,
      inspectionState: normalizeInspectionState({
        domains: {
          ...(project.inspectionState?.domains || {}),
          [payload.domainId]: result.inspection
        }
      }),
      previewState: normalizePreviewState({
        previews: [...(project.previewState?.previews || []), ...result.previews]
      }),
      auditLog: normalizeAuditLog([...(project.auditLog || []), ...result.auditEntries])
    });

    return sendJson(res, 200, {
      project: nextProject,
      previews: result.previews,
      inspection: result.inspection
    });
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Preview failed." });
  }
}

async function handleDomainExecute(req, res) {
  const payload = await readJsonBody(req);
  const project = normalizeProjectState(payload.project);

  try {
    const outcome = await executePreview(project, payload.preview, payload.options || {});
    const nextProject = normalizeProjectState({
      ...project,
      executionState: normalizeExecutionState({
        executions: [...(project.executionState?.executions || []), outcome.execution]
      }),
      auditLog: normalizeAuditLog([...(project.auditLog || []), outcome.auditEntry])
    });

    return sendJson(res, outcome.execution.status === "succeeded" ? 200 : 400, {
      project: nextProject,
      execution: outcome.execution
    });
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Execution failed." });
  }
}

async function ensureDataStore() {
  await mkdir(dataRoot, { recursive: true });
  try {
    await stat(projectStorePath);
  } catch {
    await writeProjectStore({ projects: [], savedAt: null });
  }
}

async function readProjectStore() {
  const raw = await readFile(projectStorePath, "utf8");
  return normalizeProjectStorePayload(JSON.parse(raw));
}

async function writeProjectStore(payload) {
  const normalized = {
    ...normalizeProjectStorePayload(payload),
    savedAt: new Date().toISOString()
  };

  await writeFile(projectStorePath, JSON.stringify(normalized, null, 2));
  return normalized;
}

async function readJsonBody(req) {
  const chunks = [];
  let totalSize = 0;

  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > MAX_BODY_SIZE) {
      throw new Error("Request body exceeds 10MB limit");
    }
    chunks.push(Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (e) {
    throw new Error("Invalid JSON in request body");
  }
}

async function serveStatic(res, requestedPath, allowedRoot) {
  const normalizedAllowedRoot = path.resolve(allowedRoot);
  const normalizedRequestedPath = path.resolve(requestedPath);

  if (!normalizedRequestedPath.startsWith(normalizedAllowedRoot)) {
    return sendJson(res, 403, { error: "Forbidden" });
  }

  try {
    const file = await readFile(normalizedRequestedPath);
    const extension = path.extname(normalizedRequestedPath);

    res.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(file);
  } catch {
    return sendJson(res, 404, { error: "Not found" });
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function cleanupStaleRequestLogEntries() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  for (const [key, timestamp] of requestLog.entries()) {
    if (timestamp < windowStart) {
      requestLog.delete(key);
    }
  }
}

const _requestLogTimer = setInterval(cleanupStaleRequestLogEntries, REQUEST_LOG_CLEANUP_INTERVAL_MS);
_requestLogTimer.unref();
