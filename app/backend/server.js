#!/usr/bin/env node

import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Catch unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

import { normalizeProjectStorePayload } from "../shared/project-store.js";
import { normalizeProjectState } from "../shared/project-state.js";
import { normalizeAuditLog } from "../shared/audit-log.js";
import { normalizePreviewState } from "../shared/preview-engine.js";
import { normalizeInspectionState } from "../shared/inspection-model.js";
import {
  buildConnectionAuditEntry,
  connectProject,
  disconnectProject,
  inspectDomain,
  previewDomain,
  validateConnection,
  registerPipelineConnection,
} from "./engine.js";
import { runPipelineService } from "./pipeline-service.js";
import { assembleFoundationOperationDefinitions } from "../shared/foundation-operation-definitions.js";
import { assembleUsersRolesOperationDefinitions } from "../shared/users-roles-operation-definitions.js";
import { assembleAccountingOperationDefinitions } from "../shared/accounting-operation-definitions.js";
import { assembleMasterDataOperationDefinitions } from "../shared/master-data-operation-definitions.js";
import { assembleCrmOperationDefinitions } from "../shared/crm-operation-definitions.js";
import { assembleSalesOperationDefinitions } from "../shared/sales-operation-definitions.js";
import { assemblePurchaseOperationDefinitions } from "../shared/purchase-operation-definitions.js";
import { assembleInventoryOperationDefinitions } from "../shared/inventory-operation-definitions.js";
import { assembleManufacturingOperationDefinitions } from "../shared/manufacturing-operation-definitions.js";
import { assemblePlmOperationDefinitions } from "../shared/plm-operation-definitions.js";
import { assemblePosOperationDefinitions } from "../shared/pos-operation-definitions.js";
import { assembleWebsiteEcommerceOperationDefinitions } from "../shared/website-ecommerce-operation-definitions.js";
import { assembleProjectsOperationDefinitions } from "../shared/projects-operation-definitions.js";
import { assembleHrOperationDefinitions } from "../shared/hr-operation-definitions.js";
import { assembleQualityOperationDefinitions } from "../shared/quality-operation-definitions.js";
import { assembleMaintenanceOperationDefinitions } from "../shared/maintenance-operation-definitions.js";
import { assembleRepairsOperationDefinitions } from "../shared/repairs-operation-definitions.js";
import { assembleDocumentsOperationDefinitions } from "../shared/documents-operation-definitions.js";
import { assembleSignOperationDefinitions } from "../shared/sign-operation-definitions.js";
import { assembleApprovalsOperationDefinitions } from "../shared/approvals-operation-definitions.js";
import { assembleSubscriptionsOperationDefinitions } from "../shared/subscriptions-operation-definitions.js";
import { assembleRentalOperationDefinitions } from "../shared/rental-operation-definitions.js";
import { assembleFieldServiceOperationDefinitions } from "../shared/field-service-operation-definitions.js";
import { applyGoverned } from "./governed-odoo-apply-service.js";
import * as authService from "./auth-service.js";
import {
  loadRuntimeState,
  resumeRuntimeState,
  saveRuntimeState,
} from "./runtime-state-persistence-service.js";
import {
  FOUNDATION_DOMAINS,
  getDomainIdFromCheckpointId,
  getLicenceConfig,
  getLicenceStatus,
  getPrice,
  getRemainingEarlyAdopterSlots,
  isDomainUnlocked,
  isEarlyAdopter,
} from "./licence-service.js";
import {
  createPaymentIntent,
  handleWebhook as handleStripeWebhook,
} from "./stripe-service.js";
import {
  getIndustryDomainHints,
  computeActivatedDomains,
} from "../shared/domain-activation-engine.js";
import { getIndustryTemplate } from "../shared/industry-templates.js";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB limit
const requestLog = new Map();
const REQUEST_LOG_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(clientId, maxRequests = RATE_LIMIT_MAX_REQUESTS) {
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
  
  if (clientRequests >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 1000) };
  }
  
  // Log this request
  requestLog.set(`${clientId}:${now}`, now);
  return { allowed: true };
}

async function jwtMiddleware(req, res) {
  // Skip auth enforcement when Supabase is not configured (dev / test mode)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { id: 'dev', email: 'dev@local' };
  }
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    sendJson(res, 401, { error: 'Missing or invalid Authorization header' });
    return null;
  }
  const { user, error } = await authService.verifyToken(token);
  if (error || !user) {
    sendJson(res, 401, { error: 'Invalid or expired token' });
    return null;
  }
  return user;
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
    console.log(`Project Odoo running at http://${host}:${port}`);
  });
}

export function createAppServer({ rateLimitMaxRequests = RATE_LIMIT_MAX_REQUESTS } = {}) {
  return createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
      const pathname = requestUrl.pathname;

      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
          "Access-Control-Max-Age": "86400"
        });
        res.end();
        return;
      }

      // Rate limiting — only apply to API routes
      if (pathname.startsWith("/api/")) {
        const clientId = req.socket.remoteAddress || 'unknown';
        const rateCheck = checkRateLimit(clientId, rateLimitMaxRequests);

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
        return await handleConnectionConnect(req, res);
      }

      if (pathname === "/api/connection/disconnect" && req.method === "POST") {
        return await handleConnectionDisconnect(req, res);
      }

      if (pathname === "/api/connection/validate" && req.method === "POST") {
        return await handleConnectionValidate(req, res);
      }

      if (pathname === "/api/domain/inspect" && req.method === "POST") {
        return await handleDomainInspect(req, res);
      }

      if (pathname === "/api/domain/preview" && req.method === "POST") {
        return await handleDomainPreview(req, res);
      }

      if (pathname === "/api/pipeline/run" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handlePipelineRun(req, res);
      }

      if (pathname === "/api/pipeline/apply" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handlePipelineApply(req, res);
      }

      if (pathname === "/api/pipeline/state/load" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handlePipelineStateLoad(req, res);
      }

      if (pathname === "/api/pipeline/state/resume" && req.method === "POST") {
        return await handlePipelineStateResume(req, res);
      }

      if (pathname === "/api/pipeline/state/save" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handlePipelineStateSave(req, res);
      }

      if (pathname === "/api/pipeline/connection/register" && req.method === "POST") {
        return await handlePipelineConnectionRegister(req, res);
      }

      if (pathname === "/api/pipeline/checkpoint/confirm" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handleCheckpointConfirm(req, res);
      }

      if (pathname === "/api/pipeline/industry/select" && req.method === "POST") {
        return await handleIndustrySelect(req, res);
      }

      if (pathname === "/api/licence/pricing" && req.method === "GET") {
        return await handleLicencePricing(req, res);
      }

      if (pathname.startsWith("/api/licence/status/") && req.method === "GET") {
        return await handleLicenceStatus(req, res, pathname);
      }

      if (pathname === "/api/licence/create-payment-intent" && req.method === "POST") {
        return await handleLicenceCreatePaymentIntent(req, res);
      }

      if (pathname === "/api/licence/webhook" && req.method === "POST") {
        return await handleLicenceWebhook(req, res);
      }

      if (pathname.startsWith("/api/licence/check-domain/") && req.method === "GET") {
        return await handleLicenceCheckDomain(req, res, pathname);
      }

      if (pathname === "/api/odoo/detect-databases" && req.method === "POST") {
        return await handleDetectDatabases(req, res);
      }

      if (pathname === "/api/auth/signup" && req.method === "POST") {
        return await handleAuthSignup(req, res);
      }

      if (pathname === "/api/auth/signin" && req.method === "POST") {
        return await handleAuthSignin(req, res);
      }

      if (pathname === "/api/auth/verify" && req.method === "POST") {
        return await handleAuthVerify(req, res);
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

      if ((pathname === "/landing" || pathname === "/landing.html") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, "landing.html"), frontendRoot);
      }

      return sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      console.error("Unhandled route error:", error);
      return sendJson(res, 500, {
        error: "Internal server error"
      });
    }
  });
}

async function handleConnectionConnect(req, res) {
  console.log('[CONNECT] Starting connection request');
  let payload, project;
  try {
    payload = await readJsonBody(req);
    console.log('[CONNECT] Payload received');
    project = normalizeProjectState(payload.project);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  try {
    console.log('[CONNECT] Calling connectProject...');
    const connectionState = await connectProject(project, payload.credentials);
    console.log('[CONNECT] connectProject succeeded');
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
    console.error('[CONNECT] connectProject failed:', error.message, '| code:', error.code, '| cause:', error.cause);
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
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }
  const project = normalizeProjectState(payload.project);
  const connectionState = await disconnectProject(project);
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

async function handleConnectionValidate(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }
  const project = normalizeProjectState(payload.project);

  try {
    const result = await validateConnection(project);
    if (result.valid) {
      return sendJson(res, 200, { valid: true, project });
    } else {
      // Connection is stale — return disconnected state
      const nextProject = normalizeProjectState({
        ...project,
        connectionState: {
          ...project.connectionState,
          status: "not_connected",
          capabilityLevel: "manual-only",
          lastError: result.reason,
          lastErrorAt: new Date().toISOString(),
          availableFeatures: { inspect: false, preview: false, execute: false }
        }
      });
      return sendJson(res, 200, { valid: false, reason: result.reason, project: nextProject });
    }
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Validation failed." });
  }
}

async function handleDomainInspect(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }
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
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }
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

async function handlePipelineRun(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  // Fallback: if discovery_answers is absent from the payload (not present as a key),
  // attempt to load it from persisted runtime state for the project_id.
  // If neither source has discovery_answers, return 400.
  if (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    !Object.prototype.hasOwnProperty.call(payload, "discovery_answers")
  ) {
    const projectId =
      payload.project_id ??
      payload.project_identity?.project_id ??
      null;
    if (projectId) {
      const persistedResult = await loadRuntimeState(projectId);
      if (
        persistedResult.ok &&
        persistedResult.runtime_state &&
        persistedResult.runtime_state.discovery_answers !== undefined
      ) {
        payload = { ...payload, discovery_answers: persistedResult.runtime_state.discovery_answers };
      }
    }
    // If still no discovery_answers after fallback attempt, return 400.
    if (!Object.prototype.hasOwnProperty.call(payload, "discovery_answers")) {
      return sendJson(res, 400, {
        ok: false,
        error: "discovery_answers required: not in payload and not in persisted state",
      });
    }
  }

  // Inject all domain operation definitions when not caller-supplied.
  // Unblocks Gate 6 in governed-preview-engine for all Executable checkpoints
  // across all governed domain assemblers currently registered on the server.
  // Caller-supplied operation_definitions (non-null) are passed through unchanged.
  if (payload && typeof payload === "object" && !Array.isArray(payload) && !payload.operation_definitions) {
    const tc = payload.target_context ?? null;
    const da = payload.discovery_answers ?? null;
    payload = {
      ...payload,
      operation_definitions: {
        ...assembleFoundationOperationDefinitions(tc, da),
        ...assembleUsersRolesOperationDefinitions(tc, da),
        ...assembleAccountingOperationDefinitions(tc, da),
        ...assembleMasterDataOperationDefinitions(tc, da),
        ...assembleCrmOperationDefinitions(tc, da),
        ...assembleSalesOperationDefinitions(tc, da),
        ...assemblePurchaseOperationDefinitions(tc, da),
        ...assembleInventoryOperationDefinitions(tc, da),
        ...assembleManufacturingOperationDefinitions(tc, da),
        ...assemblePlmOperationDefinitions(tc, da),
        ...assemblePosOperationDefinitions(tc, da),
        ...assembleWebsiteEcommerceOperationDefinitions(tc, da),
        ...assembleProjectsOperationDefinitions(tc, da),
        ...assembleHrOperationDefinitions(tc, da),
        ...assembleQualityOperationDefinitions(tc, da),
        ...assembleMaintenanceOperationDefinitions(tc, da),
        ...assembleRepairsOperationDefinitions(tc, da),
        ...assembleDocumentsOperationDefinitions(tc, da),
        ...assembleSignOperationDefinitions(tc, da),
        ...assembleApprovalsOperationDefinitions(tc, da),
        ...assembleSubscriptionsOperationDefinitions(tc, da),
        ...assembleRentalOperationDefinitions(tc, da),
        ...assembleFieldServiceOperationDefinitions(tc, da),
      },
    };
  }

  const result = runPipelineService(payload);
  return sendJson(res, result.ok ? 200 : 400, result);
}

async function handlePipelineStateLoad(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  if (typeof payload.project_id !== "string" || payload.project_id.trim() === "") {
    return sendJson(res, 400, { ok: false, error: "project_id must be a non-empty string." });
  }

  const result = await loadRuntimeState(payload.project_id);

  if (result.ok) {
    return sendJson(res, 200, { ok: true, runtime_state: result.runtime_state, saved_at: result.saved_at });
  }

  if (result.not_found) {
    return sendJson(res, 404, { ok: false, error: result.error, not_found: true });
  }

  return sendJson(res, 400, { ok: false, error: result.error });
}

async function handlePipelineStateResume(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  if (typeof payload.project_id !== "string" || payload.project_id.trim() === "") {
    return sendJson(res, 400, { ok: false, error: "project_id must be a non-empty string." });
  }

  const result = await resumeRuntimeState(payload.project_id);

  if (result.ok) {
    return sendJson(res, 200, { ok: true, runtime_state: result.runtime_state, saved_at: result.saved_at });
  }

  if (result.not_found) {
    return sendJson(res, 404, { ok: false, error: result.error, not_found: true });
  }

  return sendJson(res, 400, { ok: false, error: result.error });
}

async function handlePipelineStateSave(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: 'Request body must be a non-null plain object.' });
  }

  const result = await saveRuntimeState(payload);
  return sendJson(res, result.ok ? 200 : 400, result);
}

async function handlePipelineConnectionRegister(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const projectId   = typeof payload.project_id === 'string' ? payload.project_id.trim() : null;
  const credentials = payload.credentials;

  if (!projectId) {
    return sendJson(res, 400, { ok: false, error: 'project_id must be a non-empty string.' });
  }
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    return sendJson(res, 400, { ok: false, error: 'credentials must be a non-null plain object.' });
  }

  try {
    const result = await registerPipelineConnection(projectId, credentials);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Pipeline connection registration failed.' });
  }
}

async function handleCheckpointConfirm(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  // ── Input validation ────────────────────────────────────────────────────────
  const project_id   = typeof payload.project_id   === "string" ? payload.project_id.trim()   : null;
  const checkpoint_id = typeof payload.checkpoint_id === "string" ? payload.checkpoint_id.trim() : null;
  const status        = payload.status;
  const evidence      = payload.evidence;
  const actor         = payload.actor;

  if (!project_id) {
    return sendJson(res, 400, { ok: false, error: "project_id is required." });
  }
  if (!checkpoint_id) {
    return sendJson(res, 400, { ok: false, error: "checkpoint_id is required." });
  }
  if (status !== "Complete") {
    return sendJson(res, 400, { ok: false, error: "status must equal \"Complete\"." });
  }
  if (typeof evidence !== "string" || evidence.trim() === "") {
    return sendJson(res, 400, { ok: false, error: "evidence must be a non-empty string." });
  }
  if (typeof actor !== "string" || actor.trim() === "") {
    return sendJson(res, 400, { ok: false, error: "actor must be a non-empty string." });
  }

  // ── Load persisted runtime state ────────────────────────────────────────────
  const loadResult = await loadRuntimeState(project_id);
  if (!loadResult.ok) {
    if (loadResult.not_found) {
      return sendJson(res, 404, { ok: false, error: loadResult.error, not_found: true });
    }
    return sendJson(res, 400, { ok: false, error: loadResult.error });
  }

  const runtime_state = loadResult.runtime_state;

  // ── Locate checkpoint record ────────────────────────────────────────────────
  // Search in checkpoints.records (persisted container) then fall back to the
  // top-level checkpoints array if the state was stored with a flat shape.
  let checkpointRecord = null;

  const checkpointsContainer = runtime_state.checkpoints;
  if (checkpointsContainer !== null && typeof checkpointsContainer === "object" && !Array.isArray(checkpointsContainer)) {
    // Standard shape: { records: [...], engine_version, generated_at }
    const records = Array.isArray(checkpointsContainer.records) ? checkpointsContainer.records : [];
    checkpointRecord = records.find((r) => r && r.checkpoint_id === checkpoint_id) ?? null;
  } else if (Array.isArray(checkpointsContainer)) {
    // Flat array shape (legacy / direct save)
    checkpointRecord = checkpointsContainer.find((r) => r && r.checkpoint_id === checkpoint_id) ?? null;
  }

  if (!checkpointRecord) {
    return sendJson(res, 400, { ok: false, error: `checkpoint_id "${checkpoint_id}" not found in project state.` });
  }

  const licenceRequiredResponse = await maybeBuildLicenceRequiredResponse(
    project_id,
    checkpoint_id,
    checkpointRecord.domain
  );
  if (licenceRequiredResponse) {
    return sendJson(res, 402, licenceRequiredResponse);
  }

  // ── Governance gate — only User_Confirmed checkpoints ──────────────────────
  if (checkpointRecord.validation_source !== "User_Confirmed") {
    return sendJson(res, 400, {
      ok: false,
      error: `checkpoint "${checkpoint_id}" has validation_source "${checkpointRecord.validation_source}". Only User_Confirmed checkpoints may use this route.`,
    });
  }

  // ── Mutate checkpoint_statuses (carry-over map) ─────────────────────────────
  if (runtime_state.checkpoint_statuses === null || typeof runtime_state.checkpoint_statuses !== "object" || Array.isArray(runtime_state.checkpoint_statuses)) {
    runtime_state.checkpoint_statuses = {};
  }
  runtime_state.checkpoint_statuses[checkpoint_id] = "Complete";

  // ── Record confirmation metadata (smallest safe addition) ──────────────────
  if (runtime_state.checkpoint_confirmations === null || typeof runtime_state.checkpoint_confirmations !== "object" || Array.isArray(runtime_state.checkpoint_confirmations)) {
    runtime_state.checkpoint_confirmations = {};
  }
  runtime_state.checkpoint_confirmations[checkpoint_id] = {
    evidence:     evidence.trim(),
    actor:        actor.trim(),
    confirmed_at: new Date().toISOString(),
  };

  // ── Persist updated state ───────────────────────────────────────────────────
  const saveResult = await saveRuntimeState(runtime_state);
  if (!saveResult.ok) {
    return sendJson(res, 400, { ok: false, error: saveResult.error });
  }

  return sendJson(res, 200, { ok: true, runtime_state });
}

// ---------------------------------------------------------------------------
// Industry selection pre-population mapping
//
// Maps each industry's recommendedDomains to the discovery question IDs and
// values that activate those domains via the domain-activation-engine rules.
// Only question IDs from the discovery framework are used.
// Source: "industry_default" — distinguishes from user-provided answers.
// ---------------------------------------------------------------------------

const VALID_INDUSTRY_IDS = ["manufacturing", "retail", "distribution", "services"];

/**
 * Returns discovery answers that activate the domains recommended for the
 * given industry template.
 *
 * Mapping rationale (domain → gate question → value):
 *   manufacturing: MF-01=Yes, BM-01=Physical, PI-01=Yes, OP-01=Yes,
 *                  RM-01=[One-time product sales], FC-01=Full accounting,
 *                  MF-06=[In-process quality checks]
 *   retail:        OP-03=Yes, OP-01=Yes, OP-04=Yes, SC-01=Yes,
 *                  RM-01=[One-time product sales], FC-01=Full accounting,
 *                  BM-01=Physical products only
 *   distribution:  PI-01=Yes, OP-01=Yes, SC-01=Yes,
 *                  RM-01=[One-time product sales], FC-01=Full accounting,
 *                  BM-01=Physical products only
 *   services:      RM-02=Yes, SC-01=Yes,
 *                  RM-01=[One-time service delivery], FC-01=Full accounting,
 *                  BM-01=Services only, BM-05=15
 *
 * Returns: { answers: { [questionId]: value, ... }, sources: { [questionId]: "industry_default" } }
 */
function buildIndustryDiscoveryAnswers(industryId) {
  const base = {};

  if (industryId === "manufacturing") {
    // Business model — physical production
    base["BM-01"] = "Physical products only";
    // Manufacturing gate (R6 — sole gate)
    base["MF-01"] = "Yes";
    // Purchase (PI-01=Yes)
    base["PI-01"] = "Yes";
    // Inventory (OP-01=Yes)
    base["OP-01"] = "Yes";
    // Sales (RM-01 includes One-time product sales)
    base["RM-01"] = ["One-time product sales"];
    // Accounting
    base["FC-01"] = "Full accounting";
    // Quality (MF-06 has non-None value — manufacturing-specific)
    base["MF-06"] = ["In-process quality checks"];
  } else if (industryId === "retail") {
    // Business model — physical products
    base["BM-01"] = "Physical products only";
    // POS
    base["OP-03"] = "Yes";
    // Inventory
    base["OP-01"] = "Yes";
    // Website/ecommerce
    base["OP-04"] = "Yes";
    // CRM
    base["SC-01"] = "Yes";
    // Sales
    base["RM-01"] = ["One-time product sales"];
    // Accounting
    base["FC-01"] = "Full accounting";
  } else if (industryId === "distribution") {
    // Business model — physical products, no manufacturing
    base["BM-01"] = "Physical products only";
    // Purchase
    base["PI-01"] = "Yes";
    // Inventory
    base["OP-01"] = "Yes";
    // CRM
    base["SC-01"] = "Yes";
    // Sales
    base["RM-01"] = ["One-time product sales"];
    // Accounting
    base["FC-01"] = "Full accounting";
  } else if (industryId === "services") {
    // Business model — services
    base["BM-01"] = "Services only";
    // Projects (RM-02=Yes is the primary projects gate)
    base["RM-02"] = "Yes";
    // CRM
    base["SC-01"] = "Yes";
    // Sales (service delivery)
    base["RM-01"] = ["One-time service delivery"];
    // Accounting
    base["FC-01"] = "Full accounting";
    // HR (BM-05 > 10)
    base["BM-05"] = 15;
  }

  // Build sources map — every pre-populated answer is tagged industry_default
  const sources = {};
  for (const key of Object.keys(base)) {
    sources[key] = "industry_default";
  }

  return { answers: base, sources };
}

/**
 * Returns the list of question IDs that are not covered by the industry
 * pre-population mapping but have domain-activation consequences.
 *
 * These are questions that remain unanswered after industry pre-population
 * and for which the engine would return "missing_required_input".
 * The deferred answer rule: activate more not less — callers who need a
 * fully-resolved activation surface must supply these answers or accept
 * the missing_required_input result for those domains.
 *
 * Returns: string[]
 */
function buildDeferredQuestions(industryId, populatedAnswers) {
  // Full question set used by the engine (all gate questions from domain-activation-engine.js)
  const ALL_GATE_QUESTIONS = [
    "BM-01", "BM-05",
    "RM-01", "RM-02", "RM-03", "RM-04",
    "SC-01", "SC-02", "SC-04",
    "PI-01", "PI-02", "PI-03", "PI-05",
    "OP-01", "OP-03", "OP-04", "OP-05",
    "MF-01", "MF-03", "MF-04", "MF-05", "MF-06", "MF-07",
    "FC-01",
    "TA-01", "TA-03",
  ];

  return ALL_GATE_QUESTIONS.filter((q) => !(q in populatedAnswers));
}

async function handleIndustrySelect(req, res) {
  // ── Parse request body ─────────────────────────────────────────────────────
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      ok: false,
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  // ── Validate project_id ────────────────────────────────────────────────────
  const project_id = typeof payload.project_id === "string" ? payload.project_id.trim() : null;
  if (!project_id) {
    return sendJson(res, 400, { ok: false, error: "project_id is required and must be a non-empty string." });
  }

  // ── Validate industry_id ───────────────────────────────────────────────────
  const industry_id = typeof payload.industry_id === "string" ? payload.industry_id.trim() : null;
  if (!industry_id) {
    return sendJson(res, 400, { ok: false, error: "industry_id is required and must be a non-empty string." });
  }
  if (!VALID_INDUSTRY_IDS.includes(industry_id)) {
    return sendJson(res, 400, {
      ok: false,
      error: `industry_id "${industry_id}" is not valid. Must be one of: ${VALID_INDUSTRY_IDS.join(", ")}.`,
    });
  }

  // ── Retrieve industry hints and template ───────────────────────────────────
  const hints = getIndustryDomainHints(industry_id);
  const template = getIndustryTemplate(industry_id);
  const industry_name = hints.industryName;

  // ── Build pre-populated answers ────────────────────────────────────────────
  const { answers: industryAnswers, sources: industrySources } = buildIndustryDiscoveryAnswers(industry_id);
  const deferred_questions = buildDeferredQuestions(industry_id, industryAnswers);

  // ── Load existing runtime state (if any) ──────────────────────────────────
  const loadResult = await loadRuntimeState(project_id);

  let runtime_state;

  if (loadResult.ok) {
    // Merge: industry answers do NOT overwrite existing user answers
    runtime_state = loadResult.runtime_state;

    const existingAnswers =
      runtime_state.discovery_answers &&
      typeof runtime_state.discovery_answers === "object" &&
      !Array.isArray(runtime_state.discovery_answers) &&
      runtime_state.discovery_answers.answers &&
      typeof runtime_state.discovery_answers.answers === "object" &&
      !Array.isArray(runtime_state.discovery_answers.answers)
        ? runtime_state.discovery_answers.answers
        : {};

    const existingSources =
      runtime_state.discovery_answers &&
      typeof runtime_state.discovery_answers.sources === "object" &&
      !Array.isArray(runtime_state.discovery_answers.sources) &&
      runtime_state.discovery_answers.sources !== null
        ? runtime_state.discovery_answers.sources
        : {};

    // Industry defaults fill gaps only — user answers (non-industry_default source) win
    const mergedAnswers = { ...industryAnswers };
    for (const [qid, val] of Object.entries(existingAnswers)) {
      mergedAnswers[qid] = val;
    }
    const mergedSources = { ...industrySources };
    for (const [qid, src] of Object.entries(existingSources)) {
      mergedSources[qid] = src;
    }

    runtime_state = {
      ...runtime_state,
      discovery_answers: {
        ...(runtime_state.discovery_answers || {}),
        answers: mergedAnswers,
        sources: mergedSources,
      },
      industry_selection: {
        industry_id,
        industry_name,
        selected_at: new Date().toISOString(),
      },
    };
  } else {
    // No existing state — create minimal valid runtime state
    runtime_state = {
      project_identity: { project_id },
      discovery_answers: {
        answers: industryAnswers,
        sources: industrySources,
      },
      industry_selection: {
        industry_id,
        industry_name,
        selected_at: new Date().toISOString(),
      },
    };
  }

  // ── Persist updated runtime state ──────────────────────────────────────────
  const saveResult = await saveRuntimeState(runtime_state);
  if (!saveResult.ok) {
    return sendJson(res, 400, { ok: false, error: saveResult.error });
  }

  // ── Compute activated_domains_preview ─────────────────────────────────────
  const finalAnswers = runtime_state.discovery_answers;
  const activatedDomainsResult = computeActivatedDomains(finalAnswers);
  const activated_domains_preview = activatedDomainsResult.domains
    .filter((d) => d.activated === true)
    .map((d) => d.domain_id);

  // ── Return response ────────────────────────────────────────────────────────
  return sendJson(res, 200, {
    ok: true,
    industry_id,
    industry_name,
    pre_populated_answers: industryAnswers,
    deferred_questions,
    activated_domains_preview,
    next_step: "wizard",
  });
}

async function handlePipelineApply(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      ok: false,
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  const approvalCheckpointId = resolveApprovalCheckpointId(
    payload.runtime_state ?? null,
    payload.approval_id ?? null
  );
  const licenceRequiredResponse = await maybeBuildLicenceRequiredResponse(
    payload.connection_context?.project_id ?? null,
    approvalCheckpointId
  );
  if (licenceRequiredResponse) {
    return sendJson(res, 402, licenceRequiredResponse);
  }

  const result = await applyGoverned({
    approval_id: payload.approval_id,
    runtime_state: payload.runtime_state,
    operation: payload.operation,
    connection_context: payload.connection_context,
  });

  return sendJson(res, result.ok ? 200 : 400, result);
}

async function handleLicencePricing(req, res) {
  void req;
  const config = await getLicenceConfig();
  return sendJson(res, 200, {
    price: await getPrice(),
    early_adopter_price: config.early_adopter_price,
    is_early_adopter: await isEarlyAdopter(),
    remaining_slots: await getRemainingEarlyAdopterSlots(),
    currency: config.currency,
    duration_days: config.duration_days,
  });
}

async function handleLicenceStatus(req, res, pathname) {
  void req;
  const match = pathname.match(/^\/api\/licence\/status\/([^/]+)$/);
  if (!match) {
    return sendJson(res, 404, { error: "Not found" });
  }

  return sendJson(res, 200, await getLicenceStatus(decodeURIComponent(match[1])));
}

async function handleLicenceCreatePaymentIntent(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  const projectId = typeof payload.project_id === "string" ? payload.project_id.trim() : "";
  if (projectId === "") {
    return sendJson(res, 400, { ok: false, error: "project_id is required." });
  }

  const result = await createPaymentIntent(projectId);
  return sendJson(res, 200, {
    client_secret: result.client_secret,
    price: result.price,
    early_adopter: result.early_adopter,
    remaining_slots: result.remaining_slots,
  });
}

async function handleLicenceWebhook(req, res) {
  let rawBody;
  try {
    rawBody = await readRequestBodyBuffer(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      ok: false,
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  try {
    const signatureHeader = req.headers["stripe-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const result = await handleStripeWebhook(rawBody, signature);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Webhook processing failed.",
    });
  }
}

async function handleLicenceCheckDomain(req, res, pathname) {
  void req;
  const match = pathname.match(/^\/api\/licence\/check-domain\/([^/]+)\/([^/]+)$/);
  if (!match) {
    return sendJson(res, 404, { error: "Not found" });
  }

  const projectId = decodeURIComponent(match[1]);
  const domainId = decodeURIComponent(match[2]);
  const normalizedDomainId = normalizeDomainId(domainId);
  const unlocked = await isDomainUnlocked(projectId, normalizedDomainId);

  let reason = "Paid licence active.";
  if (!normalizedDomainId) {
    reason = "Unknown domain.";
  } else if (FOUNDATION_DOMAINS.includes(normalizedDomainId)) {
    reason = "Foundation domains are always free.";
  } else if (!unlocked) {
    reason = "This domain requires a paid licence.";
  }

  return sendJson(res, 200, { unlocked, reason });
}

// ---------------------------------------------------------------------------
// handleDetectDatabases
//
// POST /api/odoo/detect-databases
// Body: { "url": "https://mycompany.odoo.com" }
//
// Calls the Odoo public database list endpoint with a 5000ms hard timeout.
// Never throws — always returns a response.
// No credentials are passed — this is a public endpoint.
// ---------------------------------------------------------------------------

async function handleDetectDatabases(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 200, { ok: false, databases: [], error: "Invalid request payload." });
  }

  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  if (!url) {
    return sendJson(res, 200, { ok: false, databases: [], error: "url is required." });
  }

  // Validate URL shape before making a network call
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return sendJson(res, 200, { ok: false, databases: [], error: "Invalid URL format." });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return sendJson(res, 200, { ok: false, databases: [], error: "URL must use http or https protocol." });
  }

  const targetUrl = `${parsed.protocol}//${parsed.host}/web/database/list`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return sendJson(res, 200, {
        ok: false,
        databases: [],
        error: `Odoo responded with HTTP ${response.status}`,
      });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return sendJson(res, 200, { ok: false, databases: [], error: "Invalid JSON from Odoo instance." });
    }

    // Odoo returns { result: [...] } or a plain array depending on version/endpoint
    let databases = [];
    if (Array.isArray(data)) {
      databases = data;
    } else if (data && Array.isArray(data.result)) {
      databases = data.result;
    }

    // Filter to strings only
    databases = databases.filter((d) => typeof d === "string");

    return sendJson(res, 200, { ok: true, databases });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err && (err.name === "AbortError" || err.code === "ABORT_ERR");
    return sendJson(res, 200, {
      ok: false,
      databases: [],
      error: isTimeout ? "Detection timed out — instance may be unreachable." : (err.message || "Unknown error"),
    });
  }
}

function generateProjectId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'proj_';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function handleAuthSignup(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const { fullName, email, password, companyName } = payload || {};
  if (!fullName || !email || !password || !companyName) {
    return sendJson(res, 400, { error: 'fullName, email, password, and companyName are required.' });
  }

  const { user, session, error } = await authService.createAccount(fullName, email, password, companyName);
  if (error) {
    return sendJson(res, 400, { error });
  }

  const projectId = generateProjectId();
  await authService.createProject(user.id, projectId, null, null);

  return sendJson(res, 200, {
    user: { id: user.id, email: user.email, fullName, companyName },
    session,
    projectId,
  });
}

async function handleAuthSignin(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const { email, password } = payload || {};
  if (!email || !password) {
    return sendJson(res, 400, { error: 'email and password are required.' });
  }

  const { user, session, error } = await authService.signIn(email, password);
  if (error) {
    return sendJson(res, 401, { error });
  }

  const { projects } = await authService.getAccountProjects(user.id);

  return sendJson(res, 200, { user, session, projects: projects || [] });
}

async function handleAuthVerify(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const { token } = payload || {};
  if (!token) {
    return sendJson(res, 400, { error: 'token is required.' });
  }

  const { user, error } = await authService.verifyToken(token);
  if (error || !user) {
    return sendJson(res, 200, { valid: false, user: null });
  }

  return sendJson(res, 200, { valid: true, user });
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

async function readRequestBodyBuffer(req) {
  const chunks = [];
  let totalSize = 0;

  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > MAX_BODY_SIZE) {
      throw new Error("Request body exceeds 10MB limit");
    }
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const body = await readRequestBodyBuffer(req);

  if (!body.length) {
    return {};
  }

  try {
    return JSON.parse(body.toString("utf8"));
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
    "Content-Security-Policy": "default-src 'self'; script-src 'self'",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function normalizeDomainId(domainId) {
  if (typeof domainId !== "string") {
    return null;
  }

  const normalized = domainId.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized === "" ? null : normalized;
}

function resolveApprovalCheckpointId(runtimeState, approvalId) {
  if (typeof approvalId !== "string" || approvalId.trim() === "") {
    return null;
  }

  const approvals = runtimeState?._engine_outputs?.execution_approvals?.execution_approvals;
  if (!Array.isArray(approvals)) {
    return null;
  }

  const approval = approvals.find((candidate) => candidate?.approval_id === approvalId);
  return typeof approval?.checkpoint_id === "string" ? approval.checkpoint_id : null;
}

function resolveCheckpointDomainId(checkpointId, explicitDomainId = null) {
  return normalizeDomainId(explicitDomainId) ?? getDomainIdFromCheckpointId(checkpointId);
}

async function maybeBuildLicenceRequiredResponse(projectId, checkpointId, explicitDomainId = null) {
  if (typeof projectId !== "string" || projectId.trim() === "") {
    return null;
  }

  const domainId = resolveCheckpointDomainId(checkpointId, explicitDomainId);
  if (!domainId) {
    return null;
  }

  const unlocked = await isDomainUnlocked(projectId.trim(), domainId);
  if (unlocked) {
    return null;
  }

  return buildLicenceRequiredResponse();
}

async function buildLicenceRequiredResponse() {
  return {
    ok: false,
    error: "licence_required",
    message: "This domain requires a paid licence.",
    upgrade_url: "/upgrade",
    current_price: await getPrice(),
    early_adopter: await isEarlyAdopter(),
    remaining_slots: await getRemainingEarlyAdopterSlots(),
  };
}

function buildApplyFailureResponse(error) {
  return {
    ok: false,
    result_status: "failure",
    odoo_result: null,
    error,
    executed_at: new Date().toISOString(),
    execution_source_inputs: null,
  };
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
