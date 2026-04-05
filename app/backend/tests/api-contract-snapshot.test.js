// ---------------------------------------------------------------------------
// Backend API Contract Snapshot Harness
// app/backend/tests/api-contract-snapshot.test.js
// ---------------------------------------------------------------------------
//
// Purpose:
//   Freezes route response shapes and failure envelopes for the three
//   governed pipeline routes. Fails loudly on any contract drift.
//
// Routes in scope:
//   POST /api/pipeline/run
//   POST /api/pipeline/state/load
//   POST /api/pipeline/state/resume
//
// Invariants enforced throughout:
//   C1  Success envelopes have exactly the declared key set — no extras, no gaps.
//   C2  Failure envelopes have exactly { ok, error } — no extras, no gaps.
//   C3  Not-found envelopes have exactly { ok, error, not_found } — no extras.
//   C4  runtime_state top-level key set is frozen: drift is a hard failure.
//   C5  runtime_state loaded from /load or /resume never carries computed keys.
//   C6  Fully deterministic sub-objects (audit_refs, resume_context, blockers
//       on empty input) are asserted via deepStrictEqual — no tolerance.
//   C7  Volatile fields (timestamps, version strings) are typed-asserted only.
//   C8  discovery_answers passes through /run unchanged.
//   C9  No business inference. No side effects. Deterministic inputs only.
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

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

let server;
let serverPort;

before(async () => {
  server = createAppServer();
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
// File cleanup tracking
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const TEST_RUN_ID        = `snapshot_${Date.now()}`;
const _createdProjectIds = new Set();

function makeProjectId(label) {
  return `${TEST_RUN_ID}_${label}`;
}

async function cleanupTestFiles() {
  const storeDir = path.resolve(__dirname, "..", "data", "runtime-states");
  for (const projectId of _createdProjectIds) {
    const safe     = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const filePath = path.join(storeDir, `${safe}.json`);
    try {
      await rm(filePath, { force: true });
    } catch {
      // best-effort cleanup
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function postJson(routePath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: "127.0.0.1",
      port:     serverPort,
      path:     routePath,
      method:   "POST",
      headers:  {
        "Content-Type":   "application/json",
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
// Assertion helpers
// ---------------------------------------------------------------------------

/**
 * Asserts obj has exactly the declared keys — no more, no fewer.
 * Sorted for stable comparison regardless of insertion order.
 */
function assertExactKeySet(obj, expectedKeys, contextLabel) {
  const actual   = Object.keys(obj).sort();
  const expected = [...expectedKeys].sort();
  assert.deepStrictEqual(
    actual,
    expected,
    `${contextLabel}: key set drift detected.\n  actual:   ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}`
  );
}

// ---------------------------------------------------------------------------
// Frozen contract constants
// ---------------------------------------------------------------------------

// Exact top-level keys in runtime_state from POST /api/pipeline/run.
// Any addition, removal, or rename is a contract violation.
const RUNTIME_STATE_RUN_KEYS = Object.freeze([
  "_engine_outputs",
  "activated_domains",
  "audit_refs",
  "blockers",
  "checkpoints",
  "composed_at",
  "composer_version",
  "connection_state",
  "decisions",
  "deferments",
  "discovery_answers",
  "executions",
  "orchestrated_at",
  "orchestrator_version",
  "previews",
  "project_identity",
  "readiness_state",
  "readiness_summary",
  "resume_context",
  "stage_state",
  "target_context",
  "training_state",
]);

// Exact top-level keys in runtime_state returned by /load and /resume.
// Computed objects must be absent. Orchestrator metadata must be absent.
const RUNTIME_STATE_PERSISTED_KEYS = Object.freeze([
  "activated_domains",
  "checkpoints",
  "connection_state",
  "decisions",
  "deferments",
  "discovery_answers",
  "executions",
  "previews",
  "project_identity",
  "readiness_summary",
  "stage_state",
  "target_context",
  "training_state",
]);

// Computed keys that must NOT appear in a loaded/resumed runtime_state.
const COMPUTED_KEYS_FORBIDDEN_IN_PERSISTED = Object.freeze([
  "readiness_state",
  "blockers",
  "audit_refs",
  "resume_context",
  "_engine_outputs",
  "orchestrator_version",
  "orchestrated_at",
  "composer_version",
  "composed_at",
]);

// Exact keys in the _engine_outputs object.
const ENGINE_OUTPUTS_KEYS = Object.freeze([
  "checkpoints_output",
  "execution_approvals",
  "execution_eligibility",
  "execution_records",
  "preview_engine_output",
  "stage_routing",
  "validated_checkpoints",
]);

// Exact keys in the blockers object (from createBlockers()).
const BLOCKERS_KEYS = Object.freeze([
  "active_blockers",
  "by_domain",
  "by_severity",
  "by_stage",
  "highest_priority_blocker",
  "total_count",
]);

// Exact keys in the readiness_state object (from createReadinessState()).
const READINESS_STATE_KEYS = Object.freeze([
  "blocked_checkpoints",
  "deferred_checkpoints",
  "go_live_readiness",
  "incomplete_critical_checkpoints",
  "readiness_reason",
  "recommendation_issued",
  "recommendation_issued_at",
  "recommendation_issued_by",
  "recommendation_withheld_reason",
  "training_status",
  "unresolved_warnings",
]);

// Exact keys in the activated_domains object.
const ACTIVATED_DOMAINS_KEYS = Object.freeze([
  "activated_at",
  "activation_engine_version",
  "domains",
]);

// Fully deterministic audit_refs stub — zero tolerance for drift.
const AUDIT_REFS_STUB = Object.freeze({
  by_checkpoint: null,
  by_decision:   null,
  by_execution:  null,
  by_preview:    null,
});

// Fully deterministic resume_context stub — zero tolerance for drift.
const RESUME_CONTEXT_STUB = Object.freeze({
  current_stages:                [],
  highest_priority_blocker:      null,
  next_required_action:          null,
  resume_context_message:        null,
  resume_target_checkpoint_id:   null,
  resume_target_domain_id:       null,
  resume_target_stage_id:        null,
  resume_target_type:            null,
  secondary_action_queue:        [],
  stale_state_alerts:            [],
});


// ---------------------------------------------------------------------------
// Deterministic /run payload fixture
// ---------------------------------------------------------------------------

const FIXED_DISCOVERY_ANSWERS = Object.freeze({
  answers:                        {},
  answered_at:                    {},
  conditional_questions_skipped:  [],
  framework_version:              null,
  confirmed_by:                   null,
  confirmed_at:                   null,
});

const RUN_PAYLOAD = Object.freeze({
  discovery_answers: FIXED_DISCOVERY_ANSWERS,
});

// ---------------------------------------------------------------------------
// Deterministic /load + /resume fixture
// ---------------------------------------------------------------------------

function makePersistedRuntimeState(projectId) {
  _createdProjectIds.add(projectId);
  return {
    project_identity: {
      project_id:           projectId,
      project_name:         "Snapshot Fixture",
      created_at:           "2026-01-01T00:00:00.000Z",
      last_modified_at:     "2026-01-01T00:00:00.000Z",
      customer_entity:      null,
      project_owner:        null,
      implementation_lead:  null,
      project_mode:         null,
    },
    target_context: {
      odoo_version:               "19",
      edition:                    "enterprise",
      deployment_type:            "online",
      primary_country:            null,
      primary_currency:           null,
      multi_company:              false,
      multi_currency:             false,
      odoosh_branch_target:       null,
      odoosh_environment_type:    null,
      connection_mode:            null,
      connection_status:          null,
      connection_target_id:       null,
      connection_capability_note: null,
    },
    discovery_answers: {
      answers:                       { Q001: "yes" },
      answered_at:                   {},
      conditional_questions_skipped: [],
      framework_version:             null,
      confirmed_by:                  null,
      confirmed_at:                  null,
    },
    activated_domains: {
      domains:                   [],
      activation_engine_version: null,
      activated_at:              null,
    },
    checkpoints:       [],
    decisions:         [],
    stage_state:       [],
    deferments:        [],
    previews:          [],
    executions:        [],
    connection_state:  null,
    training_state:    null,
    readiness_summary: null,
  };
}

// ---------------------------------------------------------------------------
// Section 1 — POST /api/pipeline/run — success contract shape
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/run — success contract shape", () => {
  let res;

  before(async () => {
    res = await postJson("/api/pipeline/run", RUN_PAYLOAD);
  });

  test("returns HTTP 200", () => {
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
  });

  test("envelope has exactly { ok, runtime_state } — no extras, no gaps (C1)", () => {
    assertExactKeySet(res.body, ["ok", "runtime_state"], "run success envelope");
  });

  test("ok is true", () => {
    assert.strictEqual(res.body.ok, true);
  });

  test("runtime_state is a non-null plain object", () => {
    const rs = res.body.runtime_state;
    assert.ok(rs !== null && typeof rs === "object" && !Array.isArray(rs),
      "runtime_state must be a non-null plain object");
  });

  test("runtime_state has exactly the frozen key set — no extras, no gaps (C4)", () => {
    assertExactKeySet(res.body.runtime_state, RUNTIME_STATE_RUN_KEYS, "runtime_state[run]");
  });

  test("audit_refs matches stub exactly — zero tolerance (C6)", () => {
    assert.deepStrictEqual(res.body.runtime_state.audit_refs, AUDIT_REFS_STUB,
      "audit_refs drifted from stub");
  });

  test("resume_context matches stub exactly — zero tolerance (C6)", () => {
    assert.deepStrictEqual(res.body.runtime_state.resume_context, RESUME_CONTEXT_STUB,
      "resume_context drifted from stub");
  });

  test("blockers has exactly the frozen key set (C4)", () => {
    assertExactKeySet(res.body.runtime_state.blockers, BLOCKERS_KEYS, "blockers");
  });

  test("readiness_state has exactly the frozen key set (C4)", () => {
    assertExactKeySet(res.body.runtime_state.readiness_state, READINESS_STATE_KEYS, "readiness_state");
  });

  test("activated_domains has exactly the frozen key set (C4)", () => {
    assertExactKeySet(res.body.runtime_state.activated_domains, ACTIVATED_DOMAINS_KEYS, "activated_domains");
  });

  test("_engine_outputs has exactly the frozen key set (C4)", () => {
    assertExactKeySet(res.body.runtime_state._engine_outputs, ENGINE_OUTPUTS_KEYS, "_engine_outputs");
  });

  test("discovery_answers passes through unchanged (C8)", () => {
    assert.deepStrictEqual(
      res.body.runtime_state.discovery_answers,
      FIXED_DISCOVERY_ANSWERS,
      "discovery_answers was mutated in transit"
    );
  });

  test("null fields are null: project_identity, target_context, connection_state, training_state", () => {
    const rs = res.body.runtime_state;
    assert.strictEqual(rs.project_identity,  null, "project_identity must be null when not provided");
    assert.strictEqual(rs.target_context,    null, "target_context must be null when not provided");
    assert.strictEqual(rs.connection_state,  null, "connection_state must be null when not provided");
    assert.strictEqual(rs.training_state,    null, "training_state must be null when not provided");
  });

  test("array fields are arrays: checkpoints, decisions, stage_state, deferments, previews, executions", () => {
    const rs = res.body.runtime_state;
    for (const key of ["checkpoints", "decisions", "stage_state", "deferments", "previews", "executions"]) {
      assert.ok(Array.isArray(rs[key]), `runtime_state.${key} must be an array`);
    }
  });

  test("composer_version is a non-empty string (C7)", () => {
    assert.strictEqual(typeof res.body.runtime_state.composer_version, "string");
    assert.ok(res.body.runtime_state.composer_version.length > 0, "composer_version must not be empty");
  });

  test("orchestrator_version is a non-empty string (C7)", () => {
    assert.strictEqual(typeof res.body.runtime_state.orchestrator_version, "string");
    assert.ok(res.body.runtime_state.orchestrator_version.length > 0, "orchestrator_version must not be empty");
  });

  test("composed_at is a valid ISO 8601 string (C7)", () => {
    const ts = res.body.runtime_state.composed_at;
    assert.strictEqual(typeof ts, "string", "composed_at must be a string");
    assert.ok(!Number.isNaN(Date.parse(ts)), "composed_at must parse as valid date");
  });

  test("orchestrated_at is a valid ISO 8601 string (C7)", () => {
    const ts = res.body.runtime_state.orchestrated_at;
    assert.strictEqual(typeof ts, "string", "orchestrated_at must be a string");
    assert.ok(!Number.isNaN(Date.parse(ts)), "orchestrated_at must parse as valid date");
  });

  test("activated_domains.domains is an array", () => {
    assert.ok(Array.isArray(res.body.runtime_state.activated_domains.domains),
      "activated_domains.domains must be an array");
  });

  test("readiness_state array fields are arrays", () => {
    const rs = res.body.runtime_state.readiness_state;
    for (const key of [
      "incomplete_critical_checkpoints",
      "blocked_checkpoints",
      "deferred_checkpoints",
      "unresolved_warnings",
    ]) {
      assert.ok(Array.isArray(rs[key]), `readiness_state.${key} must be an array`);
    }
  });

  test("readiness_state.recommendation_issued is boolean", () => {
    assert.strictEqual(typeof res.body.runtime_state.readiness_state.recommendation_issued, "boolean");
  });
});

// ---------------------------------------------------------------------------
// Section 2 — POST /api/pipeline/run — malformed failure contract shape
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/run — malformed failure contract shape", () => {
  test("missing discovery_answers: HTTP 400 (C2)", async () => {
    const res = await postJson("/api/pipeline/run", {});
    assert.strictEqual(res.status, 400);
  });

  test("missing discovery_answers: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/run", {});
    assertExactKeySet(res.body, ["ok", "error"], "run malformed envelope (missing discovery_answers)");
  });

  test("missing discovery_answers: ok is false", async () => {
    const res = await postJson("/api/pipeline/run", {});
    assert.strictEqual(res.body.ok, false);
  });

  test("missing discovery_answers: error is a non-empty string", async () => {
    const res = await postJson("/api/pipeline/run", {});
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0, "error must not be empty string");
  });

  test("missing discovery_answers: no runtime_state in failure envelope (C2)", async () => {
    const res = await postJson("/api/pipeline/run", {});
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"),
      "failure envelope must not contain runtime_state");
  });

  test("null discovery_answers: HTTP 400", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: null });
    assert.strictEqual(res.status, 400);
  });

  test("null discovery_answers: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: null });
    assertExactKeySet(res.body, ["ok", "error"], "run malformed envelope (null discovery_answers)");
  });

  test("null discovery_answers: ok is false", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: null });
    assert.strictEqual(res.body.ok, false);
  });

  test("array discovery_answers: HTTP 400", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: [] });
    assert.strictEqual(res.status, 400);
  });

  test("array discovery_answers: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: [] });
    assertExactKeySet(res.body, ["ok", "error"], "run malformed envelope (array discovery_answers)");
  });

  test("array discovery_answers: ok is false", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: [] });
    assert.strictEqual(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// Section 3 — POST /api/pipeline/state/load — success contract shape
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/load — success contract shape", () => {
  let res;
  let projectId;
  let savedState;

  before(async () => {
    projectId  = makeProjectId("load_ok");
    savedState = makePersistedRuntimeState(projectId);
    await saveRuntimeState(savedState);
    res = await postJson("/api/pipeline/state/load", { project_id: projectId });
  });

  test("returns HTTP 200", () => {
    assert.strictEqual(res.status, 200);
  });

  test("envelope has exactly { ok, runtime_state, saved_at } (C1)", () => {
    assertExactKeySet(res.body, ["ok", "runtime_state", "saved_at"], "load success envelope");
  });

  test("ok is true", () => {
    assert.strictEqual(res.body.ok, true);
  });

  test("runtime_state is a non-null plain object", () => {
    const rs = res.body.runtime_state;
    assert.ok(rs !== null && typeof rs === "object" && !Array.isArray(rs));
  });

  test("runtime_state has exactly the persisted key set — no computed keys (C5)", () => {
    assertExactKeySet(res.body.runtime_state, RUNTIME_STATE_PERSISTED_KEYS, "runtime_state[load]");
  });

  test("runtime_state contains none of the computed/metadata keys (C5)", () => {
    const rs = res.body.runtime_state;
    for (const key of COMPUTED_KEYS_FORBIDDEN_IN_PERSISTED) {
      assert.ok(!Object.prototype.hasOwnProperty.call(rs, key),
        `Loaded runtime_state must not contain computed key "${key}"`);
    }
  });

  test("saved_at is a valid ISO 8601 string", () => {
    assert.strictEqual(typeof res.body.saved_at, "string");
    assert.ok(!Number.isNaN(Date.parse(res.body.saved_at)), "saved_at must parse as valid date");
  });

  test("runtime_state.project_identity.project_id matches requested project_id", () => {
    assert.strictEqual(res.body.runtime_state.project_identity.project_id, projectId);
  });

  test("discovery_answers round-trips without drift", () => {
    assert.deepStrictEqual(
      res.body.runtime_state.discovery_answers,
      savedState.discovery_answers
    );
  });

  test("activated_domains round-trips without drift", () => {
    assert.deepStrictEqual(
      res.body.runtime_state.activated_domains,
      savedState.activated_domains
    );
  });
});

// ---------------------------------------------------------------------------
// Section 4 — POST /api/pipeline/state/load — malformed failure contract shape
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/load — malformed failure contract shape", () => {
  test("missing project_id: HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.strictEqual(res.status, 400);
  });

  test("missing project_id: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assertExactKeySet(res.body, ["ok", "error"], "load malformed envelope (missing project_id)");
  });

  test("missing project_id: ok is false", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.strictEqual(res.body.ok, false);
  });

  test("missing project_id: error is a non-empty string", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0);
  });

  test("missing project_id: no runtime_state in failure envelope", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"));
  });

  test("empty string project_id: HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: "" });
    assert.strictEqual(res.status, 400);
  });

  test("empty string project_id: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: "" });
    assertExactKeySet(res.body, ["ok", "error"], "load malformed envelope (empty project_id)");
  });

  test("empty string project_id: ok is false", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: "" });
    assert.strictEqual(res.body.ok, false);
  });

  test("numeric project_id: HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: 42 });
    assert.strictEqual(res.status, 400);
  });

  test("numeric project_id: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: 42 });
    assertExactKeySet(res.body, ["ok", "error"], "load malformed envelope (numeric project_id)");
  });

  test("numeric project_id: ok is false", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: 42 });
    assert.strictEqual(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// Section 5 — POST /api/pipeline/state/load — missing record failure contract shape
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/load — missing record contract shape", () => {
  const GHOST_ID = makeProjectId("load_ghost_never_saved");

  test("returns HTTP 404", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: GHOST_ID });
    assert.strictEqual(res.status, 404);
  });

  test("envelope has exactly { ok, error, not_found } (C3)", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: GHOST_ID });
    assertExactKeySet(res.body, ["ok", "error", "not_found"], "load not-found envelope");
  });

  test("ok is false", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: GHOST_ID });
    assert.strictEqual(res.body.ok, false);
  });

  test("not_found is exactly true", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: GHOST_ID });
    assert.strictEqual(res.body.not_found, true);
  });

  test("error is a non-empty string", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: GHOST_ID });
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0);
  });

  test("no runtime_state in not-found envelope", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: GHOST_ID });
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"));
  });
});

// ---------------------------------------------------------------------------
// Section 6 — POST /api/pipeline/state/resume — success contract shape
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/resume — success contract shape", () => {
  let res;
  let projectId;
  let savedState;

  before(async () => {
    projectId  = makeProjectId("resume_ok");
    savedState = makePersistedRuntimeState(projectId);
    await saveRuntimeState(savedState);
    res = await postJson("/api/pipeline/state/resume", { project_id: projectId });
  });

  test("returns HTTP 200", () => {
    assert.strictEqual(res.status, 200);
  });

  test("envelope has exactly { ok, runtime_state, saved_at } (C1)", () => {
    assertExactKeySet(res.body, ["ok", "runtime_state", "saved_at"], "resume success envelope");
  });

  test("ok is true", () => {
    assert.strictEqual(res.body.ok, true);
  });

  test("runtime_state is a non-null plain object", () => {
    const rs = res.body.runtime_state;
    assert.ok(rs !== null && typeof rs === "object" && !Array.isArray(rs));
  });

  test("runtime_state has exactly the persisted key set — no computed keys (C5)", () => {
    assertExactKeySet(res.body.runtime_state, RUNTIME_STATE_PERSISTED_KEYS, "runtime_state[resume]");
  });

  test("runtime_state contains none of the computed/metadata keys (C5)", () => {
    const rs = res.body.runtime_state;
    for (const key of COMPUTED_KEYS_FORBIDDEN_IN_PERSISTED) {
      assert.ok(!Object.prototype.hasOwnProperty.call(rs, key),
        `Resumed runtime_state must not contain computed key "${key}"`);
    }
  });

  test("saved_at is a valid ISO 8601 string", () => {
    assert.strictEqual(typeof res.body.saved_at, "string");
    assert.ok(!Number.isNaN(Date.parse(res.body.saved_at)));
  });

  test("runtime_state.project_identity.project_id matches requested project_id", () => {
    assert.strictEqual(res.body.runtime_state.project_identity.project_id, projectId);
  });

  test("discovery_answers round-trips without drift", () => {
    assert.deepStrictEqual(
      res.body.runtime_state.discovery_answers,
      savedState.discovery_answers
    );
  });

  test("activated_domains round-trips without drift", () => {
    assert.deepStrictEqual(
      res.body.runtime_state.activated_domains,
      savedState.activated_domains
    );
  });
});

// ---------------------------------------------------------------------------
// Section 7 — POST /api/pipeline/state/resume — malformed failure contract shape
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/resume — malformed failure contract shape", () => {
  test("missing project_id: HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.strictEqual(res.status, 400);
  });

  test("missing project_id: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assertExactKeySet(res.body, ["ok", "error"], "resume malformed envelope (missing project_id)");
  });

  test("missing project_id: ok is false", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.strictEqual(res.body.ok, false);
  });

  test("missing project_id: error is a non-empty string", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0);
  });

  test("missing project_id: no runtime_state in failure envelope", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"));
  });

  test("empty string project_id: HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: "" });
    assert.strictEqual(res.status, 400);
  });

  test("empty string project_id: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: "" });
    assertExactKeySet(res.body, ["ok", "error"], "resume malformed envelope (empty project_id)");
  });

  test("empty string project_id: ok is false", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: "" });
    assert.strictEqual(res.body.ok, false);
  });

  test("numeric project_id: HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: 99 });
    assert.strictEqual(res.status, 400);
  });

  test("numeric project_id: envelope has exactly { ok, error } (C2)", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: 99 });
    assertExactKeySet(res.body, ["ok", "error"], "resume malformed envelope (numeric project_id)");
  });

  test("numeric project_id: ok is false", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: 99 });
    assert.strictEqual(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// Section 8 — POST /api/pipeline/state/resume — missing record failure contract shape
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/resume — missing record contract shape", () => {
  const GHOST_ID = makeProjectId("resume_ghost_never_saved");

  test("returns HTTP 404", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: GHOST_ID });
    assert.strictEqual(res.status, 404);
  });

  test("envelope has exactly { ok, error, not_found } (C3)", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: GHOST_ID });
    assertExactKeySet(res.body, ["ok", "error", "not_found"], "resume not-found envelope");
  });

  test("ok is false", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: GHOST_ID });
    assert.strictEqual(res.body.ok, false);
  });

  test("not_found is exactly true", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: GHOST_ID });
    assert.strictEqual(res.body.not_found, true);
  });

  test("error is a non-empty string", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: GHOST_ID });
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0);
  });

  test("no runtime_state in not-found envelope", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: GHOST_ID });
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"));
  });
});

// ---------------------------------------------------------------------------
// Section 9 — POST /api/pipeline/apply — failure envelope contract shape
//
// C_A1  Failure envelope has exactly the declared key set — no extras, no gaps.
// C_A2  ok is false on all refusal paths.
// C_A3  result_status is "failure" on all refusal paths.
// C_A4  error is a non-empty string on all refusal paths.
// C_A5  executed_at is a non-empty string on all refusal paths.
// C_A6  odoo_result is null on all refusal paths.
// C_A7  execution_source_inputs is null on validation-failure paths.
// C_A8  No runtime_state in failure envelope (apply route does not return runtime_state).
// C_A9  Route never returns HTTP 500.
// ---------------------------------------------------------------------------

// Frozen key set for POST /api/pipeline/apply response envelope.
// Any addition, removal, or rename is a contract violation.
const APPLY_ENVELOPE_KEYS = Object.freeze([
  "error",
  "executed_at",
  "execution_source_inputs",
  "odoo_result",
  "ok",
  "result_status",
]);

// Shared apply fixture helpers (duplicated from route test to keep
// snapshot coverage self-contained).
function makeApplyApproval(overrides = {}) {
  return {
    approval_id: "snap-approval-001",
    candidate_id: "snap-candidate-001",
    preview_id: "snap-preview-001",
    checkpoint_id: "CMP-SNAP-001",
    safety_class: "safe",
    execution_occurred: false,
    ...overrides,
  };
}

function makeApplyCandidate(overrides = {}) {
  return {
    candidate_id: "snap-candidate-001",
    checkpoint_id: "CMP-SNAP-001",
    preview_id: "snap-preview-001",
    safety_class: "safe",
    ...overrides,
  };
}

function makeApplyPreview(overrides = {}) {
  return {
    preview_id: "snap-preview-001",
    checkpoint_id: "CMP-SNAP-001",
    checkpoint_class: "Foundational",
    safety_class: "safe",
    execution_approval_implied: false,
    ...overrides,
  };
}

function makeApplyRuntimeState({
  approvals = [makeApplyApproval()],
  candidates = [makeApplyCandidate()],
  previews = [makeApplyPreview()],
} = {}) {
  return {
    previews,
    executions: [],
    _engine_outputs: {
      execution_approvals: { execution_approvals: approvals },
      execution_eligibility: { execution_candidates: candidates },
    },
  };
}

// Refusal path: approval_id missing — validation fails before Odoo client
describe("POST /api/pipeline/apply — contract snapshot: approval_id missing (C_A1–C_A9)", () => {
  let res;

  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      runtime_state: makeApplyRuntimeState(),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "snap-proj-001" },
    });
  });

  test("HTTP 400 (C_A9)", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exactly the frozen key set — no extras, no gaps (C_A1)", () => {
    assertExactKeySet(res.body, APPLY_ENVELOPE_KEYS, "apply failure envelope (missing approval_id)");
  });

  test("ok is false (C_A2)", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure' (C_A3)", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error is a non-empty string (C_A4)", () => {
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0);
  });

  test("executed_at is a non-empty string (C_A5)", () => {
    assert.strictEqual(typeof res.body.executed_at, "string");
    assert.ok(res.body.executed_at.length > 0);
  });

  test("odoo_result is null (C_A6)", () => {
    assert.strictEqual(res.body.odoo_result, null);
  });

  test("execution_source_inputs is null (C_A7)", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });

  test("no runtime_state in failure envelope (C_A8)", () => {
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"),
      "apply failure envelope must not contain runtime_state");
  });
});

// Refusal path: model outside allowlist — validation fails before Odoo client
describe("POST /api/pipeline/apply — contract snapshot: model outside allowlist (C_A1–C_A9)", () => {
  let res;

  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "snap-approval-001",
      runtime_state: makeApplyRuntimeState(),
      operation: { model: "res.partner", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "snap-proj-001" },
    });
  });

  test("HTTP 400 (C_A9)", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exactly the frozen key set — no extras, no gaps (C_A1)", () => {
    assertExactKeySet(res.body, APPLY_ENVELOPE_KEYS, "apply failure envelope (disallowed model)");
  });

  test("ok is false (C_A2)", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure' (C_A3)", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions disallowed model (C_A4)", () => {
    assert.ok(res.body.error.includes("res.partner"));
  });

  test("executed_at is a non-empty string (C_A5)", () => {
    assert.strictEqual(typeof res.body.executed_at, "string");
    assert.ok(res.body.executed_at.length > 0);
  });

  test("odoo_result is null (C_A6)", () => {
    assert.strictEqual(res.body.odoo_result, null);
  });

  test("execution_source_inputs is null (C_A7)", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });

  test("no runtime_state in failure envelope (C_A8)", () => {
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"));
  });
});

// Refusal path: re-execution attempt (execution_occurred: true)
describe("POST /api/pipeline/apply — contract snapshot: re-execution attempt (C_A1–C_A9)", () => {
  let res;

  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "snap-approval-001",
      runtime_state: makeApplyRuntimeState({
        approvals: [makeApplyApproval({ execution_occurred: true })],
      }),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "snap-proj-001" },
    });
  });

  test("HTTP 400 (C_A9)", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exactly the frozen key set — no extras, no gaps (C_A1)", () => {
    assertExactKeySet(res.body, APPLY_ENVELOPE_KEYS, "apply failure envelope (re-execution)");
  });

  test("ok is false (C_A2)", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure' (C_A3)", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions execution_occurred (C_A4)", () => {
    assert.ok(res.body.error.includes("execution_occurred"));
  });

  test("executed_at is a non-empty string (C_A5)", () => {
    assert.strictEqual(typeof res.body.executed_at, "string");
    assert.ok(res.body.executed_at.length > 0);
  });

  test("odoo_result is null (C_A6)", () => {
    assert.strictEqual(res.body.odoo_result, null);
  });

  test("execution_source_inputs is null (C_A7)", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });

  test("no runtime_state in failure envelope (C_A8)", () => {
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"));
  });
});

// Refusal path: preview missing
describe("POST /api/pipeline/apply — contract snapshot: preview missing (C_A1–C_A9)", () => {
  let res;

  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "snap-approval-001",
      runtime_state: makeApplyRuntimeState({ previews: [] }),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "snap-proj-001" },
    });
  });

  test("HTTP 400 (C_A9)", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exactly the frozen key set — no extras, no gaps (C_A1)", () => {
    assertExactKeySet(res.body, APPLY_ENVELOPE_KEYS, "apply failure envelope (preview missing)");
  });

  test("ok is false (C_A2)", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure' (C_A3)", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions Preview (C_A4)", () => {
    assert.ok(res.body.error.includes("Preview"));
  });

  test("execution_source_inputs is null (C_A7)", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });
});

// Connection-absent path: all governance passes, Odoo client fails closed
describe("POST /api/pipeline/apply — contract snapshot: no live connection (C_A1–C_A9)", () => {
  let res;

  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "snap-approval-001",
      runtime_state: makeApplyRuntimeState(),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "ACME" } },
      connection_context: { project_id: "snap-proj-no-conn" },
    });
  });

  test("HTTP 400 — not 500 (C_A9)", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exactly the frozen key set — no extras, no gaps (C_A1)", () => {
    assertExactKeySet(res.body, APPLY_ENVELOPE_KEYS, "apply failure envelope (no connection)");
  });

  test("ok is false (C_A2)", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure' (C_A3)", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error is a non-empty string (C_A4)", () => {
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0);
  });

  test("executed_at is a non-empty string (C_A5)", () => {
    assert.strictEqual(typeof res.body.executed_at, "string");
    assert.ok(res.body.executed_at.length > 0);
  });

  test("odoo_result is null (C_A6)", () => {
    assert.strictEqual(res.body.odoo_result, null);
  });

  test("execution_source_inputs is null — client not reached (C_A7)", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });

  test("no runtime_state in failure envelope (C_A8)", () => {
    assert.ok(!Object.prototype.hasOwnProperty.call(res.body, "runtime_state"));
  });
});

// ---------------------------------------------------------------------------
// Removed bypass routes — must return 404 (governance bypass elimination)
// ---------------------------------------------------------------------------

describe("Removed bypass routes return 404", () => {
  test("POST /api/domain/execute returns 404", async () => {
    const res = await postJson("/api/domain/execute", {});
    assert.strictEqual(res.status, 404,
      `/api/domain/execute must be absent — got ${res.status}`);
  });

  test("POST /api/odoo/create returns 404", async () => {
    const res = await postJson("/api/odoo/create", {});
    assert.strictEqual(res.status, 404,
      `/api/odoo/create must be absent — got ${res.status}`);
  });
});
