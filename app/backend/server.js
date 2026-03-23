import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeProjectStorePayload } from "../shared/project-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const frontendRoot = path.resolve(repoRoot, "app", "frontend");
const sharedRoot = path.resolve(repoRoot, "app", "shared");
const dataRoot = path.resolve(repoRoot, "app", "backend", "data");
const projectStorePath = path.resolve(dataRoot, "projects.json");
const port = Number(process.env.PORT || 4174);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

await ensureDataStore();

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    const pathname = requestUrl.pathname;

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

    if (pathname.startsWith("/shared/") && req.method === "GET") {
      return serveStatic(res, path.resolve(sharedRoot, `.${pathname.replace("/shared", "")}`), sharedRoot);
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

server.listen(port, () => {
  console.log(`Implementation Control Platform running at http://127.0.0.1:${port}`);
});

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

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
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
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}
