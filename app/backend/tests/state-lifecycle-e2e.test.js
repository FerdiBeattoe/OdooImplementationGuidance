// ---------------------------------------------------------------------------
// Backend End-to-End State Lifecycle Tests
// Tests for: POST /api/pipeline/run → save → load/resume lifecycle
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  run → save → load full happy path
//   2.  run → save → resume full happy path
//   3.  persisted load lacks computed fields by design
//   4.  rerun restores computed fields
//   5.  route envelopes do not mutate runtime payloads
//   6.  malformed lifecycle requests fail truthfully
//   7.  missing record lifecycle requests fail truthfully
//   8.  deterministic repeated lifecycle runs
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import path from "node:path";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createAppServer } from "../server.js";
import { saveRuntimeState } from "../runtime-state-persistence-service.js";
import { getComputedObjectNames } from "../../shared/runtime-state-contract.js";

// ---------------------------------------------------------------------------
// Computed object names from contract (authoritative source)
// ---------------------------------------------------------------------------

const COMPUTED_OBJECT_NAMES = getComputedObjectNames();

// Engine-derived keys that are also never persisted
const NEVER_PERSISTED_KEYS = [...COMPUTED_OBJECT_NAMES, "_engine_outputs"];

// Orchestrator metadata keys that are runtime-only
const ORCHESTRATOR_METADATA_KEYS = [
  "orchestrator_version",
  "orchestrated_at",
  "composer_version",
  "composed_at",
];

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

let server;
let serverPort;

before(async () => {
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
  await cleanupTestFiles();
});

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_RUN_ID = `e2e_lifecycle_${Date.now()}`;
const _createdProjectIds = new Set();

function makeProjectId(label) {
  return `${TEST_RUN_ID}_${label}`;
}

async function cleanupTestFiles() {
  const storeDir = path.resolve(__dirname, "..", "data", "runtime-states");
  for (const projectId of _createdProjectIds) {
    const safe = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const filePath = path.join(storeDir, `${safe}.json`);
    try {
      await rm(filePath, { force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function trackedSave(runtimeState) {
  const projectId = runtimeState?.project_identity?.project_id;
  if (typeof projectId === "string") {
    _createdProjectIds.add(projectId);
  }
  return saveRuntimeState(runtimeState);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function postJson(routePath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: "127.0.0.1",
      port: serverPort,
      path: routePath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    };

    const req = httpRequest(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          parsed = null;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProjectIdentity(projectId) {
  return {
    project_id: projectId,
    project_name: "E2E Lifecycle Test Project",
    customer_entity: "ACME Corp",
    project_owner: "owner@example.com",
    implementation_lead: "lead@example.com",
    project_mode: "full",
    created_at: "2026-01-01T00:00:00.000Z",
    last_modified_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeDiscoveryAnswers() {
  return {
    answers: {
      "BM-01": "Services only",
      "BM-02": false,
      "BM-03": "AU",
      "BM-04": false,
      "BM-05": 5,
      "RM-01": ["One-time service delivery"],
      "RM-02": false,
      "RM-03": false,
      "RM-04": false,
      "OP-01": false,
      "OP-03": false,
      "OP-04": false,
      "OP-05": false,
      "SC-01": false,
      "SC-02": false,
      "SC-03": false,
      "SC-04": "Discounting is not permitted",
      "PI-01": false,
      "PI-05": false,
      "FC-01": "Not using Odoo for financials",
      "FC-04": false,
      "FC-05": false,
      "FC-06": false,
      "TA-01": ["System Administrator (separate from all operational roles)"],
      "TA-02": false,
      "TA-03": ["None — standard module approvals are sufficient"],
      "TA-04": "Jane Smith, IT Manager",
    },
    answered_at: {},
    conditional_questions_skipped: [],
    framework_version: "1.0",
    confirmed_by: null,
    confirmed_at: null,
  };
}

// Run the pipeline via the real HTTP route and track the project_id for cleanup
async function runPipeline(projectId) {
  _createdProjectIds.add(projectId);
  const res = await postJson("/api/pipeline/run", {
    project_identity: makeProjectIdentity(projectId),
    discovery_answers: makeDiscoveryAnswers(),
  });
  return res;
}

// ---------------------------------------------------------------------------
// 1. run → save → load full happy path
// ---------------------------------------------------------------------------

describe("run → save → load full happy path", () => {
  test("POST /api/pipeline/run returns ok: true with runtime_state", async () => {
    const projectId = makeProjectId("run_ok");
    const res = await runPipeline(projectId);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.ok(res.body.runtime_state !== null && typeof res.body.runtime_state === "object");
  });

  test("saveRuntimeState succeeds after pipeline run", async () => {
    const projectId = makeProjectId("save_after_run");
    const runRes = await runPipeline(projectId);
    assert.strictEqual(runRes.body.ok, true);

    const saveResult = await trackedSave(runRes.body.runtime_state);
    assert.strictEqual(saveResult.ok, true);
    assert.strictEqual(saveResult.project_id, projectId);
  });

  test("POST /api/pipeline/state/load returns HTTP 200 and ok: true after run → save", async () => {
    const projectId = makeProjectId("load_after_save");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(loadRes.status, 200);
    assert.strictEqual(loadRes.body.ok, true);
  });

  test("loaded runtime_state.project_identity.project_id matches original project_id", async () => {
    const projectId = makeProjectId("load_pid_e2e");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(loadRes.body.runtime_state.project_identity.project_id, projectId);
  });

  test("loaded discovery_answers round-trips without drift", async () => {
    const projectId = makeProjectId("load_da_e2e");
    const runRes = await runPipeline(projectId);
    const runState = runRes.body.runtime_state;
    await trackedSave(runState);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.deepStrictEqual(
      loadRes.body.runtime_state.discovery_answers,
      runState.discovery_answers
    );
  });

  test("load response includes saved_at as a valid ISO 8601 string", async () => {
    const projectId = makeProjectId("load_saved_at_e2e");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(typeof loadRes.body.saved_at, "string");
    assert.ok(!Number.isNaN(Date.parse(loadRes.body.saved_at)));
  });
});

// ---------------------------------------------------------------------------
// 2. run → save → resume full happy path
// ---------------------------------------------------------------------------

describe("run → save → resume full happy path", () => {
  test("POST /api/pipeline/state/resume returns HTTP 200 and ok: true after run → save", async () => {
    const projectId = makeProjectId("resume_after_save");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const resumeRes = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.strictEqual(resumeRes.status, 200);
    assert.strictEqual(resumeRes.body.ok, true);
  });

  test("resumed runtime_state.project_identity.project_id matches original project_id", async () => {
    const projectId = makeProjectId("resume_pid_e2e");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const resumeRes = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.strictEqual(resumeRes.body.runtime_state.project_identity.project_id, projectId);
  });

  test("resume and load return identical runtime_state for the same lifecycle", async () => {
    const projectId = makeProjectId("resume_eq_load_e2e");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const resumeRes = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.deepStrictEqual(loadRes.body.runtime_state, resumeRes.body.runtime_state);
  });

  test("resumed discovery_answers match original run output", async () => {
    const projectId = makeProjectId("resume_da_e2e");
    const runRes = await runPipeline(projectId);
    const runState = runRes.body.runtime_state;
    await trackedSave(runState);

    const resumeRes = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.deepStrictEqual(
      resumeRes.body.runtime_state.discovery_answers,
      runState.discovery_answers
    );
  });
});

// ---------------------------------------------------------------------------
// 3. persisted load lacks computed fields by design
// ---------------------------------------------------------------------------

describe("persisted load lacks computed fields by design", () => {
  test("pipeline run produces readiness_state in runtime_state", async () => {
    const projectId = makeProjectId("computed_present_run");
    const runRes = await runPipeline(projectId);
    assert.ok("readiness_state" in runRes.body.runtime_state,
      "readiness_state must be present in pipeline run output");
  });

  test("pipeline run produces blockers in runtime_state", async () => {
    const projectId = makeProjectId("blockers_present_run");
    const runRes = await runPipeline(projectId);
    assert.ok("blockers" in runRes.body.runtime_state,
      "blockers must be present in pipeline run output");
  });

  test("pipeline run produces audit_refs in runtime_state", async () => {
    const projectId = makeProjectId("audit_refs_present_run");
    const runRes = await runPipeline(projectId);
    assert.ok("audit_refs" in runRes.body.runtime_state,
      "audit_refs must be present in pipeline run output");
  });

  test("pipeline run produces resume_context in runtime_state", async () => {
    const projectId = makeProjectId("resume_ctx_present_run");
    const runRes = await runPipeline(projectId);
    assert.ok("resume_context" in runRes.body.runtime_state,
      "resume_context must be present in pipeline run output");
  });

  test("pipeline run produces _engine_outputs in runtime_state", async () => {
    const projectId = makeProjectId("eo_present_run");
    const runRes = await runPipeline(projectId);
    assert.ok("_engine_outputs" in runRes.body.runtime_state,
      "_engine_outputs must be present in pipeline run output");
  });

  test("readiness_state is absent from loaded payload after run → save → load", async () => {
    const projectId = makeProjectId("no_readiness_after_load");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("readiness_state" in loadRes.body.runtime_state),
      "readiness_state must not appear in loaded payload");
  });

  test("blockers is absent from loaded payload after run → save → load", async () => {
    const projectId = makeProjectId("no_blockers_after_load");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("blockers" in loadRes.body.runtime_state),
      "blockers must not appear in loaded payload");
  });

  test("audit_refs is absent from loaded payload after run → save → load", async () => {
    const projectId = makeProjectId("no_audit_refs_after_load");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("audit_refs" in loadRes.body.runtime_state),
      "audit_refs must not appear in loaded payload");
  });

  test("resume_context is absent from loaded payload after run → save → load", async () => {
    const projectId = makeProjectId("no_resume_ctx_after_load");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("resume_context" in loadRes.body.runtime_state),
      "resume_context must not appear in loaded payload");
  });

  test("_engine_outputs is absent from loaded payload after run → save → load", async () => {
    const projectId = makeProjectId("no_eo_after_load");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("_engine_outputs" in loadRes.body.runtime_state),
      "_engine_outputs must not appear in loaded payload");
  });

  test("orchestrator_version is absent from loaded payload after run → save → load", async () => {
    const projectId = makeProjectId("no_orch_ver_after_load");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("orchestrator_version" in loadRes.body.runtime_state),
      "orchestrator_version must not appear in loaded payload");
  });

  test("all contract-specified computed object names are absent from loaded payload", async () => {
    const projectId = makeProjectId("no_computed_keys_after_load");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const loadedState = loadRes.body.runtime_state;

    for (const key of COMPUTED_OBJECT_NAMES) {
      assert.ok(!(key in loadedState),
        `Computed key "${key}" must not appear in loaded payload`);
    }
  });

  test("all never-persisted keys are absent from resumed payload after run → save → resume", async () => {
    const projectId = makeProjectId("no_never_persisted_resume");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const resumeRes = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    const resumedState = resumeRes.body.runtime_state;

    for (const key of NEVER_PERSISTED_KEYS) {
      assert.ok(!(key in resumedState),
        `Never-persisted key "${key}" must not appear in resumed payload`);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. rerun restores computed fields
// ---------------------------------------------------------------------------

describe("rerun restores computed fields", () => {
  test("feeding loaded discovery_answers back into POST /api/pipeline/run restores readiness_state", async () => {
    const projectId = makeProjectId("rerun_readiness");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const loadedState = loadRes.body.runtime_state;

    // Verify readiness_state is absent in loaded payload
    assert.ok(!("readiness_state" in loadedState));

    // Rerun with loaded persisted state
    const rerunRes = await postJson("/api/pipeline/run", {
      project_identity: loadedState.project_identity,
      discovery_answers: loadedState.discovery_answers,
    });

    assert.strictEqual(rerunRes.body.ok, true);
    assert.ok("readiness_state" in rerunRes.body.runtime_state,
      "readiness_state must be restored after rerun");
  });

  test("rerun after load restores blockers", async () => {
    const projectId = makeProjectId("rerun_blockers");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("blockers" in loadRes.body.runtime_state));

    const rerunRes = await postJson("/api/pipeline/run", {
      project_identity: loadRes.body.runtime_state.project_identity,
      discovery_answers: loadRes.body.runtime_state.discovery_answers,
    });

    assert.strictEqual(rerunRes.body.ok, true);
    assert.ok("blockers" in rerunRes.body.runtime_state,
      "blockers must be restored after rerun");
  });

  test("rerun after load restores audit_refs", async () => {
    const projectId = makeProjectId("rerun_audit_refs");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("audit_refs" in loadRes.body.runtime_state));

    const rerunRes = await postJson("/api/pipeline/run", {
      project_identity: loadRes.body.runtime_state.project_identity,
      discovery_answers: loadRes.body.runtime_state.discovery_answers,
    });

    assert.strictEqual(rerunRes.body.ok, true);
    assert.ok("audit_refs" in rerunRes.body.runtime_state,
      "audit_refs must be restored after rerun");
  });

  test("rerun after load restores resume_context", async () => {
    const projectId = makeProjectId("rerun_resume_ctx");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("resume_context" in loadRes.body.runtime_state));

    const rerunRes = await postJson("/api/pipeline/run", {
      project_identity: loadRes.body.runtime_state.project_identity,
      discovery_answers: loadRes.body.runtime_state.discovery_answers,
    });

    assert.strictEqual(rerunRes.body.ok, true);
    assert.ok("resume_context" in rerunRes.body.runtime_state,
      "resume_context must be restored after rerun");
  });

  test("rerun after load restores _engine_outputs", async () => {
    const projectId = makeProjectId("rerun_eo");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("_engine_outputs" in loadRes.body.runtime_state));

    const rerunRes = await postJson("/api/pipeline/run", {
      project_identity: loadRes.body.runtime_state.project_identity,
      discovery_answers: loadRes.body.runtime_state.discovery_answers,
    });

    assert.strictEqual(rerunRes.body.ok, true);
    assert.ok("_engine_outputs" in rerunRes.body.runtime_state,
      "_engine_outputs must be restored after rerun");
  });

  test("rerun from loaded state produces structurally equal activated_domains to original run", async () => {
    const projectId = makeProjectId("rerun_activated_domains");
    const runRes = await runPipeline(projectId);
    const originalState = runRes.body.runtime_state;
    await trackedSave(originalState);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const rerunRes = await postJson("/api/pipeline/run", {
      project_identity: loadRes.body.runtime_state.project_identity,
      discovery_answers: loadRes.body.runtime_state.discovery_answers,
    });

    assert.strictEqual(
      rerunRes.body.runtime_state.activated_domains.domains.length,
      originalState.activated_domains.domains.length
    );
  });

  test("rerun from loaded state produces structurally equal checkpoints count to original run", async () => {
    const projectId = makeProjectId("rerun_checkpoints");
    const runRes = await runPipeline(projectId);
    const originalState = runRes.body.runtime_state;
    await trackedSave(originalState);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const rerunRes = await postJson("/api/pipeline/run", {
      project_identity: loadRes.body.runtime_state.project_identity,
      discovery_answers: loadRes.body.runtime_state.discovery_answers,
    });

    assert.strictEqual(
      rerunRes.body.runtime_state.checkpoints.length,
      originalState.checkpoints.length
    );
  });

  test("load alone does NOT silently restore computed fields — pipeline rerun is required", async () => {
    const projectId = makeProjectId("no_silent_restore");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });

    // Computed fields must NOT be present after load alone
    for (const key of COMPUTED_OBJECT_NAMES) {
      assert.ok(!(key in loadRes.body.runtime_state),
        `load must not silently restore computed field "${key}"`);
    }
    assert.ok(!("_engine_outputs" in loadRes.body.runtime_state),
      "load must not silently restore _engine_outputs");
  });
});

// ---------------------------------------------------------------------------
// 5. route envelopes do not mutate runtime payloads
// ---------------------------------------------------------------------------

describe("route envelopes do not mutate runtime payloads", () => {
  test("POST /api/pipeline/run response envelope keys are exactly ok and runtime_state", async () => {
    const projectId = makeProjectId("run_envelope_keys");
    const res = await runPipeline(projectId);
    assert.strictEqual(res.body.ok, true);
    const keys = Object.keys(res.body).sort();
    assert.deepStrictEqual(keys, ["ok", "runtime_state"]);
  });

  test("POST /api/pipeline/state/load response envelope keys are exactly ok, runtime_state, saved_at", async () => {
    const projectId = makeProjectId("load_envelope_keys_e2e");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const keys = Object.keys(loadRes.body).sort();
    assert.deepStrictEqual(keys, ["ok", "runtime_state", "saved_at"]);
  });

  test("POST /api/pipeline/state/resume response envelope keys are exactly ok, runtime_state, saved_at", async () => {
    const projectId = makeProjectId("resume_envelope_keys_e2e");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const resumeRes = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    const keys = Object.keys(resumeRes.body).sort();
    assert.deepStrictEqual(keys, ["ok", "runtime_state", "saved_at"]);
  });

  test("run runtime_state is not double-wrapped in a nested runtime_state", async () => {
    const projectId = makeProjectId("run_no_double_wrap");
    const res = await runPipeline(projectId);
    assert.ok(!("runtime_state" in res.body.runtime_state),
      "run runtime_state must not be double-wrapped");
  });

  test("load runtime_state is not double-wrapped in a nested runtime_state", async () => {
    const projectId = makeProjectId("load_no_double_wrap_e2e");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("runtime_state" in loadRes.body.runtime_state),
      "loaded runtime_state must not be double-wrapped");
  });

  test("run route does not add extra fields to runtime_state beyond pipeline output", async () => {
    const projectId = makeProjectId("run_no_extra_fields");
    const res = await runPipeline(projectId);
    // The envelope has only ok and runtime_state — no extra top-level injections
    assert.ok(!("project_id" in res.body),
      "run route must not inject project_id into envelope");
    assert.ok(!("saved_at" in res.body),
      "run route must not inject saved_at into envelope");
  });

  test("load route does not add extra keys to runtime_state beyond persisted payload", async () => {
    const projectId = makeProjectId("load_no_extra_rs_keys");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const rs = loadRes.body.runtime_state;

    // None of the envelope keys should appear inside runtime_state
    assert.ok(!("ok" in rs), "runtime_state must not contain envelope 'ok' field");
    assert.ok(!("saved_at" in rs), "runtime_state must not contain envelope 'saved_at' field");
  });
});

// ---------------------------------------------------------------------------
// 6. malformed lifecycle requests fail truthfully
// ---------------------------------------------------------------------------

describe("malformed lifecycle requests fail truthfully", () => {
  // POST /api/pipeline/run — malformed
  test("run route returns HTTP 400 and ok: false for missing discovery_answers", async () => {
    const res = await postJson("/api/pipeline/run", {
      project_identity: makeProjectIdentity(makeProjectId("run_no_da")),
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(typeof res.body.error === "string" && res.body.error.length > 0);
  });

  test("run route returns HTTP 400 and ok: false for null discovery_answers", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: null });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("run route returns HTTP 400 and ok: false for array discovery_answers", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: [] });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("run route rejection does not include runtime_state", async () => {
    const res = await postJson("/api/pipeline/run", {});
    assert.ok(!("runtime_state" in res.body));
  });

  // POST /api/pipeline/state/load — malformed
  test("load route returns HTTP 400 and ok: false for missing project_id", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(typeof res.body.error === "string" && res.body.error.length > 0);
  });

  test("load route returns HTTP 400 and ok: false for null project_id", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: null });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("load route returns HTTP 400 and ok: false for empty string project_id", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: "" });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("load route returns HTTP 400 and ok: false for numeric project_id", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: 99 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("load route malformed rejection does not include runtime_state", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.ok(!("runtime_state" in res.body));
  });

  // POST /api/pipeline/state/resume — malformed
  test("resume route returns HTTP 400 and ok: false for missing project_id", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(typeof res.body.error === "string" && res.body.error.length > 0);
  });

  test("resume route returns HTTP 400 and ok: false for null project_id", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: null });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("resume route returns HTTP 400 and ok: false for empty string project_id", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: "" });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("resume route malformed rejection does not include runtime_state", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.ok(!("runtime_state" in res.body));
  });
});

// ---------------------------------------------------------------------------
// 7. missing record lifecycle requests fail truthfully
// ---------------------------------------------------------------------------

describe("missing record lifecycle requests fail truthfully", () => {
  test("load returns HTTP 404 for project_id with no saved record", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_never_saved"),
    });
    assert.strictEqual(res.status, 404);
  });

  test("load returns ok: false for project_id with no saved record", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_never_saved_ok"),
    });
    assert.strictEqual(res.body.ok, false);
  });

  test("load returns not_found: true for project_id with no saved record", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_never_saved_nf"),
    });
    assert.strictEqual(res.body.not_found, true);
  });

  test("load not-found response includes a non-empty error string", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_err_msg"),
    });
    assert.ok(typeof res.body.error === "string" && res.body.error.length > 0);
  });

  test("load not-found response does not include runtime_state", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_no_rs_404"),
    });
    assert.ok(!("runtime_state" in res.body));
  });

  test("resume returns HTTP 404 for project_id with no saved record", async () => {
    const res = await postJson("/api/pipeline/state/resume", {
      project_id: makeProjectId("resume_never_saved"),
    });
    assert.strictEqual(res.status, 404);
  });

  test("resume returns ok: false for project_id with no saved record", async () => {
    const res = await postJson("/api/pipeline/state/resume", {
      project_id: makeProjectId("resume_never_saved_ok"),
    });
    assert.strictEqual(res.body.ok, false);
  });

  test("resume returns not_found: true for project_id with no saved record", async () => {
    const res = await postJson("/api/pipeline/state/resume", {
      project_id: makeProjectId("resume_never_saved_nf"),
    });
    assert.strictEqual(res.body.not_found, true);
  });

  test("resume not-found response does not include runtime_state", async () => {
    const res = await postJson("/api/pipeline/state/resume", {
      project_id: makeProjectId("resume_no_rs_404"),
    });
    assert.ok(!("runtime_state" in res.body));
  });

  test("load after run but without save returns HTTP 404", async () => {
    // Run pipeline but deliberately skip save — load must fail truthfully
    const projectId = makeProjectId("run_no_save_then_load");
    _createdProjectIds.add(projectId); // register for cleanup even though nothing saved
    await postJson("/api/pipeline/run", {
      project_identity: makeProjectIdentity(projectId),
      discovery_answers: makeDiscoveryAnswers(),
    });

    // Do not save — load must return 404
    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(loadRes.status, 404);
    assert.strictEqual(loadRes.body.ok, false);
    assert.strictEqual(loadRes.body.not_found, true);
  });
});

// ---------------------------------------------------------------------------
// 8. deterministic repeated lifecycle runs
// ---------------------------------------------------------------------------

describe("deterministic repeated lifecycle runs", () => {
  test("two runs with identical inputs produce identical activated_domains domain count", async () => {
    const projectId1 = makeProjectId("det_run_a");
    const projectId2 = makeProjectId("det_run_b");

    const res1 = await runPipeline(projectId1);
    const res2 = await runPipeline(projectId2);

    assert.strictEqual(
      res1.body.runtime_state.activated_domains.domains.length,
      res2.body.runtime_state.activated_domains.domains.length
    );
  });

  test("two runs with identical inputs produce identical checkpoints count", async () => {
    const projectId1 = makeProjectId("det_ckpt_a");
    const projectId2 = makeProjectId("det_ckpt_b");

    const res1 = await runPipeline(projectId1);
    const res2 = await runPipeline(projectId2);

    assert.strictEqual(
      res1.body.runtime_state.checkpoints.length,
      res2.body.runtime_state.checkpoints.length
    );
  });

  test("two runs with identical inputs produce identical blockers total_count", async () => {
    const projectId1 = makeProjectId("det_bl_a");
    const projectId2 = makeProjectId("det_bl_b");

    const res1 = await runPipeline(projectId1);
    const res2 = await runPipeline(projectId2);

    assert.strictEqual(
      res1.body.runtime_state.blockers.total_count,
      res2.body.runtime_state.blockers.total_count
    );
  });

  test("two runs with identical inputs produce identical readiness go_live_readiness value", async () => {
    const projectId1 = makeProjectId("det_rs_a");
    const projectId2 = makeProjectId("det_rs_b");

    const res1 = await runPipeline(projectId1);
    const res2 = await runPipeline(projectId2);

    assert.strictEqual(
      res1.body.runtime_state.readiness_state.go_live_readiness,
      res2.body.runtime_state.readiness_state.go_live_readiness
    );
  });

  test("load → rerun produces identical activated_domains domain count to original run", async () => {
    const projectId = makeProjectId("det_load_rerun");
    const runRes = await runPipeline(projectId);
    const originalState = runRes.body.runtime_state;
    await trackedSave(originalState);

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const rerunRes = await postJson("/api/pipeline/run", {
      project_identity: loadRes.body.runtime_state.project_identity,
      discovery_answers: loadRes.body.runtime_state.discovery_answers,
    });

    assert.strictEqual(
      rerunRes.body.runtime_state.activated_domains.domains.length,
      originalState.activated_domains.domains.length
    );
  });

  test("save → load → save → load round-trip is stable (no drift between saves)", async () => {
    const projectId = makeProjectId("det_double_rt");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const load1 = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(load1.body.ok, true);

    // Save again from the loaded state (simulating a re-save)
    await trackedSave({ ...load1.body.runtime_state });

    const load2 = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(load2.body.ok, true);

    // Both loads must produce identical discovery_answers
    assert.deepStrictEqual(
      load1.body.runtime_state.discovery_answers,
      load2.body.runtime_state.discovery_answers
    );
  });

  test("repeated load for the same project_id returns consistent runtime_state each time", async () => {
    const projectId = makeProjectId("det_repeated_load");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const load1 = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const load2 = await postJson("/api/pipeline/state/load", { project_id: projectId });

    assert.deepStrictEqual(load1.body.runtime_state, load2.body.runtime_state);
  });

  test("repeated resume for the same project_id returns consistent runtime_state each time", async () => {
    const projectId = makeProjectId("det_repeated_resume");
    const runRes = await runPipeline(projectId);
    await trackedSave(runRes.body.runtime_state);

    const resume1 = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    const resume2 = await postJson("/api/pipeline/state/resume", { project_id: projectId });

    assert.deepStrictEqual(resume1.body.runtime_state, resume2.body.runtime_state);
  });
});
