"use strict";

import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import path from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createAppServer } from "../server.js";
import { loadRuntimeState, saveRuntimeState } from "../runtime-state-persistence-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_ROOT = path.resolve(__dirname, "tmp", `licence_routes_${Date.now()}`);
const DATA_DIR = path.resolve(TEST_ROOT, "data");
const CONFIG_PATH = path.resolve(DATA_DIR, "licence-config.json");
const STORE_DIR = path.resolve(DATA_DIR, "licences");

const CLEAN_CONFIG = Object.freeze({
  currency: "USD",
  duration_days: 365,
  early_adopter_price: 249.5,
  standard_price: 499,
  early_adopter_limit: 20,
  early_adopter_count: 0,
});

const CREATED_RUNTIME_PROJECT_IDS = new Set();

let server;
let serverPort;

before(async () => {
  process.env.LICENCE_DATA_DIR = DATA_DIR;
  process.env.LICENCE_CONFIG_PATH = CONFIG_PATH;
  process.env.LICENCE_STORE_DIR = STORE_DIR;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  await resetStorage();

  server = createAppServer({ rateLimitMaxRequests: Infinity });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      serverPort = server.address().port;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await cleanupRuntimeStateFiles();
  delete process.env.LICENCE_DATA_DIR;
  delete process.env.LICENCE_CONFIG_PATH;
  delete process.env.LICENCE_STORE_DIR;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  await rm(TEST_ROOT, { recursive: true, force: true });
});

beforeEach(async () => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  await resetStorage();
  await cleanupRuntimeStateFiles();
});

async function resetStorage() {
  await rm(TEST_ROOT, { recursive: true, force: true });
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(CLEAN_CONFIG, null, 2), "utf8");
}

async function cleanupRuntimeStateFiles() {
  for (const projectId of CREATED_RUNTIME_PROJECT_IDS) {
    const safeProjectId = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
    await rm(path.resolve(__dirname, "..", "data", "runtime-states", `${safeProjectId}.json`), {
      force: true,
    });
  }
  CREATED_RUNTIME_PROJECT_IDS.clear();
}

function getJson(routePath) {
  return requestJson(routePath, { method: "GET" });
}

function postJson(routePath, body, headers = {}) {
  return requestJson(routePath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function requestJson(routePath, { method, headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const bodyBuffer = body === null ? null : Buffer.from(body, "utf8");
    const req = httpRequest(
      {
        hostname: "127.0.0.1",
        port: serverPort,
        path: routePath,
        method,
        headers: {
          ...headers,
          ...(bodyBuffer ? { "Content-Length": bodyBuffer.length } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode,
            body: raw ? JSON.parse(raw) : null,
          });
        });
      }
    );

    req.on("error", reject);
    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

function makeApplyPayload(projectId, checkpointId = "CRM-FOUND-001") {
  return {
    approval_id: "approval-licence-001",
    runtime_state: {
      previews: [
        {
          preview_id: "preview-licence-001",
          checkpoint_id: checkpointId,
          checkpoint_class: "Foundational",
          safety_class: "safe",
          execution_approval_implied: false,
        },
      ],
      executions: [],
      _engine_outputs: {
        execution_approvals: {
          execution_approvals: [
            {
              approval_id: "approval-licence-001",
              candidate_id: "candidate-licence-001",
              preview_id: "preview-licence-001",
              checkpoint_id: checkpointId,
              safety_class: "safe",
              execution_occurred: false,
            },
          ],
        },
        execution_eligibility: {
          execution_candidates: [
            {
              candidate_id: "candidate-licence-001",
              checkpoint_id: checkpointId,
              preview_id: "preview-licence-001",
              safety_class: "safe",
            },
          ],
        },
      },
    },
    operation: {
      model: "crm.stage",
      method: "create",
      values: { name: "New Stage" },
    },
    connection_context: {
      project_id: projectId,
    },
  };
}

function makeCheckpointRuntimeState(projectId, checkpointId = "CRM-FOUND-001") {
  return {
    project_identity: {
      project_id: projectId,
      project_name: "Licence Gate Test",
      created_at: "2026-01-01T00:00:00.000Z",
      last_modified_at: "2026-01-01T00:00:00.000Z",
      customer_entity: null,
      project_owner: null,
      implementation_lead: null,
      project_mode: null,
    },
    target_context: {
      odoo_version: "19",
      edition: "enterprise",
      deployment_type: "online",
      primary_country: null,
      primary_currency: null,
      multi_company: false,
      multi_currency: false,
      odoosh_branch_target: null,
      odoosh_environment_type: null,
      connection_mode: null,
      connection_status: null,
      connection_target_id: null,
      connection_capability_note: null,
    },
    discovery_answers: {
      answers: {},
      answered_at: {},
      conditional_questions_skipped: [],
      framework_version: "1.0",
      confirmed_by: null,
      confirmed_at: null,
    },
    checkpoints: {
      records: [
        {
          checkpoint_id: checkpointId,
          domain: "crm",
          checkpoint_class: "Foundational",
          validation_source: "User_Confirmed",
          status: "Not_Started",
          execution_relevance: "Executable",
          safety_class: "Safe",
          dependencies: [],
          preview_required: true,
          downstream_impact_summary: null,
        },
      ],
      engine_version: "1.0.0",
      generated_at: "2026-01-01T00:00:00.000Z",
    },
    checkpoint_statuses: null,
    checkpoint_confirmations: null,
    activated_domains: {
      domains: [],
      activation_engine_version: null,
      activated_at: null,
    },
    decisions: [],
    stage_state: [],
    deferments: [],
    previews: [],
    executions: [],
    connection_state: null,
    training_state: null,
    readiness_summary: null,
  };
}

describe("licence routes", () => {
  test("GET /api/licence/pricing returns the expected structure", async () => {
    const res = await getJson("/api/licence/pricing");

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, {
      price: 499,
      early_adopter_price: 249.5,
      is_early_adopter: true,
      remaining_slots: 20,
      currency: "USD",
      duration_days: 365,
    });
  });

  test("GET /api/licence/status/:projectId returns the default free status", async () => {
    const res = await getJson("/api/licence/status/test236");

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, {
      active: false,
      tier: "free",
      expires_at: null,
      price_paid: null,
      early_adopter: false,
      domains_unlocked: ["foundation", "users_roles", "master_data"],
    });
  });

  test("POST /api/licence/create-payment-intent returns mock Stripe data", async () => {
    const res = await postJson("/api/licence/create-payment-intent", {
      project_id: "test236",
    });

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, {
      client_secret: "mock_secret_test",
      price: 499,
      early_adopter: true,
      remaining_slots: 20,
    });
  });

  test("GET /api/licence/check-domain/:projectId/:domainId returns locked for an unpaid CRM domain", async () => {
    const res = await getJson("/api/licence/check-domain/test236/crm");

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, {
      unlocked: false,
      reason: "This domain requires a paid licence.",
    });
  });

  test("POST /api/licence/webhook creates a licence in mock mode", async () => {
    const res = await postJson("/api/licence/webhook", {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "mock_pi_test236",
          metadata: {
            project_id: "test236",
          },
        },
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.handled, true);

    const status = await getJson("/api/licence/status/test236");
    assert.strictEqual(status.body.active, true);
    assert.strictEqual(status.body.tier, "paid");
  });

  test("POST /api/pipeline/apply returns 402 for an unlicensed paid domain", async () => {
    const res = await postJson("/api/pipeline/apply", makeApplyPayload("proj-unlicensed"));

    assert.strictEqual(res.status, 402);
    assert.deepStrictEqual(res.body, {
      ok: false,
      error: "licence_required",
      message: "This domain requires a paid licence.",
      upgrade_url: "/upgrade",
      current_price: 499,
      early_adopter: true,
      remaining_slots: 20,
    });
  });

  test("POST /api/pipeline/checkpoint/confirm returns 402 for an unlicensed paid domain", async () => {
    const projectId = "proj-confirm-unlicensed";
    CREATED_RUNTIME_PROJECT_IDS.add(projectId);
    await saveRuntimeState(makeCheckpointRuntimeState(projectId));

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id: projectId,
      checkpoint_id: "CRM-FOUND-001",
      status: "Complete",
      evidence: "User confirmed CRM setup.",
      actor: "qa@example.com",
    });

    assert.strictEqual(res.status, 402);
    assert.deepStrictEqual(res.body, {
      ok: false,
      error: "licence_required",
      message: "This domain requires a paid licence.",
      upgrade_url: "/upgrade",
      current_price: 499,
      early_adopter: true,
      remaining_slots: 20,
    });

    const persisted = await loadRuntimeState(projectId);
    assert.strictEqual(persisted.ok, true);
    assert.strictEqual(persisted.runtime_state.checkpoint_statuses, null);
  });
});
