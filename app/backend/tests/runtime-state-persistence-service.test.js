// ---------------------------------------------------------------------------
// Runtime State Persistence Service Tests — Odoo 19 Implementation Control
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  saveRuntimeState,
  loadRuntimeState,
  resumeRuntimeState,
  RUNTIME_STATE_PERSISTENCE_SERVICE_VERSION,
} from "../runtime-state-persistence-service.js";

// ---------------------------------------------------------------------------
// Test isolation: redirect store dir by patching RUNTIME_STATE_STORE_DIR.
//
// The service writes to app/backend/data/runtime-states/.
// We create a sibling test-data directory and clean it after each suite.
// Because the service uses its own __dirname-resolved path, we run tests
// against real I/O in the actual store dir and clean up by project_id.
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Unique prefix for all test project_ids in this run to avoid collisions.
const TEST_RUN_ID = `test_${Date.now()}`;

function makeProjectId(label) {
  return `${TEST_RUN_ID}_${label}`;
}

// ---------------------------------------------------------------------------
// Minimal valid runtime_state fixture.
//
// Contains only the persisted fields the persistence service requires.
// Deliberately includes a computed key and _engine_outputs to verify stripping.
// ---------------------------------------------------------------------------

function makeRuntimeState(overrides = {}) {
  const project_id = overrides.project_id ?? makeProjectId("default");
  return {
    project_identity: {
      project_id,
      project_name: "Test Project",
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
      answers: { Q001: "yes" },
      answered_at: {},
      conditional_questions_skipped: [],
      framework_version: null,
      confirmed_by: null,
      confirmed_at: null,
    },
    activated_domains: { domains: [], activation_engine_version: null, activated_at: null },
    checkpoints: [],
    decisions: [],
    stage_state: [],
    deferments: [],
    previews: [],
    executions: [],
    connection_state: null,
    training_state: null,
    readiness_summary: null,
    // Computed objects — must be stripped before save
    readiness_state: { go_live_readiness: null },
    blockers: { active_blockers: [] },
    audit_refs: { by_checkpoint: null },
    resume_context: { current_stages: [] },
    // Engine outputs — must be stripped before save
    _engine_outputs: { checkpoints_output: {} },
    // Orchestrator metadata — must be stripped before save
    orchestrator_version: "1.0.0",
    orchestrated_at: "2026-01-01T00:00:00.000Z",
    composer_version: "1.0.0",
    composed_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Cleanup helper — removes test files created during this run
// ---------------------------------------------------------------------------

const _createdProjectIds = new Set();

async function cleanupTestFiles() {
  // Import service internals are not exposed, so we build the path directly
  // using the same logic as the service (UUID-safe sanitise + .json suffix).
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

after(cleanupTestFiles);

// ---------------------------------------------------------------------------
// Helper: save with cleanup tracking
// ---------------------------------------------------------------------------

async function trackedSave(runtimeState) {
  const projectId = runtimeState?.project_identity?.project_id;
  if (typeof projectId === "string") {
    _createdProjectIds.add(projectId);
  }
  return saveRuntimeState(runtimeState);
}

// ---------------------------------------------------------------------------
// 1. Service version export
// ---------------------------------------------------------------------------

describe("RUNTIME_STATE_PERSISTENCE_SERVICE_VERSION", () => {
  test("is a non-empty string", () => {
    assert.strictEqual(typeof RUNTIME_STATE_PERSISTENCE_SERVICE_VERSION, "string");
    assert.ok(RUNTIME_STATE_PERSISTENCE_SERVICE_VERSION.trim().length > 0);
  });
});

// ---------------------------------------------------------------------------
// 2. saveRuntimeState — valid input
// ---------------------------------------------------------------------------

describe("saveRuntimeState — valid input", () => {
  test("returns ok: true on valid runtime_state", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("save_valid") });
    const result = await trackedSave(state);
    assert.strictEqual(result.ok, true);
  });

  test("returns project_id matching project_identity.project_id", async () => {
    const projectId = makeProjectId("save_pid");
    const state = makeRuntimeState({ project_id: projectId });
    const result = await trackedSave(state);
    assert.strictEqual(result.project_id, projectId);
  });

  test("returns saved_at as an ISO 8601 timestamp string", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("save_ts") });
    const result = await trackedSave(state);
    assert.strictEqual(typeof result.saved_at, "string");
    assert.ok(!Number.isNaN(Date.parse(result.saved_at)));
  });
});

// ---------------------------------------------------------------------------
// 3. saveRuntimeState — malformed input rejected
// ---------------------------------------------------------------------------

describe("saveRuntimeState — malformed input rejected", () => {
  test("returns ok: false for null payload", async () => {
    const result = await saveRuntimeState(null);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(typeof result.error, "string");
  });

  test("returns ok: false for non-object payload", async () => {
    const result = await saveRuntimeState("bad");
    assert.strictEqual(result.ok, false);
  });

  test("returns ok: false for array payload", async () => {
    const result = await saveRuntimeState([]);
    assert.strictEqual(result.ok, false);
  });

  test("returns ok: false when project_identity is missing", async () => {
    const { project_identity: _omit, ...noIdentity } = makeRuntimeState({ project_id: makeProjectId("no_pid") });
    const result = await saveRuntimeState(noIdentity);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /project_identity/i);
  });

  test("returns ok: false when project_id is empty string", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("empty_pid") });
    state.project_identity.project_id = "";
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /project_id/i);
  });

  test("returns ok: false when project_id is whitespace only", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("ws_pid") });
    state.project_identity.project_id = "   ";
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /project_id/i);
  });

  test("returns ok: false when discovery_answers is missing", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("no_da") });
    delete state.discovery_answers;
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /discovery_answers/i);
  });

  test("returns ok: false when discovery_answers is not a plain object", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("bad_da") });
    state.discovery_answers = "not-an-object";
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /discovery_answers/i);
  });
});

// ---------------------------------------------------------------------------
// 4. saveRuntimeState — secrets rejected
// ---------------------------------------------------------------------------

describe("saveRuntimeState — secrets rejected", () => {
  test("returns ok: false when target_context contains 'password'", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("secret_pw") });
    state.target_context = { ...state.target_context, password: "hunter2" };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /secret|password/i);
  });

  test("returns ok: false when target_context contains 'token'", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("secret_tk") });
    state.target_context = { ...state.target_context, token: "abc123" };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /secret|token/i);
  });

  test("returns ok: false when target_context contains 'api_key'", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("secret_ak") });
    state.target_context = { ...state.target_context, api_key: "xyz" };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /secret|api_key/i);
  });

  test("returns ok: false when target_context contains nested secret", async () => {
    const state = makeRuntimeState({ project_id: makeProjectId("secret_nested") });
    state.target_context = { ...state.target_context, db: { password: "nested" } };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /secret|password/i);
  });
});

// ---------------------------------------------------------------------------
// 5. loadRuntimeState — valid round-trip
// ---------------------------------------------------------------------------

describe("loadRuntimeState — valid round-trip", () => {
  test("saves then loads successfully", async () => {
    const projectId = makeProjectId("rt_load");
    const state = makeRuntimeState({ project_id: projectId });
    const saveResult = await trackedSave(state);
    assert.strictEqual(saveResult.ok, true);

    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(loadResult.ok, true);
  });

  test("loaded runtime_state.project_identity.project_id matches saved", async () => {
    const projectId = makeProjectId("rt_pid_match");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(loadResult.runtime_state.project_identity.project_id, projectId);
  });

  test("loaded runtime_state.discovery_answers round-trips without drift", async () => {
    const projectId = makeProjectId("rt_da_rt");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.deepStrictEqual(
      loadResult.runtime_state.discovery_answers,
      state.discovery_answers
    );
  });

  test("loaded runtime_state preserves all persisted fields present in save input", async () => {
    const projectId = makeProjectId("rt_fields");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    const loaded = loadResult.runtime_state;

    // All explicitly persisted fields must round-trip
    const persistedKeys = [
      "project_identity",
      "target_context",
      "discovery_answers",
      "activated_domains",
      "checkpoints",
      "decisions",
      "stage_state",
      "deferments",
      "previews",
      "executions",
      "connection_state",
      "training_state",
      "readiness_summary",
    ];
    for (const key of persistedKeys) {
      assert.ok(key in loaded, `Expected persisted key "${key}" to be present after load`);
    }
  });

  test("returns saved_at as a valid ISO 8601 string on load", async () => {
    const projectId = makeProjectId("rt_saved_at");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(typeof loadResult.saved_at, "string");
    assert.ok(!Number.isNaN(Date.parse(loadResult.saved_at)));
  });
});

// ---------------------------------------------------------------------------
// 6. saveRuntimeState — computed keys stripped on save
// ---------------------------------------------------------------------------

describe("saveRuntimeState — computed keys stripped on save", () => {
  test("readiness_state is absent from loaded payload", async () => {
    const projectId = makeProjectId("strip_rs");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.ok(
      !("readiness_state" in loadResult.runtime_state),
      "readiness_state must not appear in persisted payload"
    );
  });

  test("blockers is absent from loaded payload", async () => {
    const projectId = makeProjectId("strip_bl");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.ok(
      !("blockers" in loadResult.runtime_state),
      "blockers must not appear in persisted payload"
    );
  });

  test("audit_refs is absent from loaded payload", async () => {
    const projectId = makeProjectId("strip_ar");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.ok(
      !("audit_refs" in loadResult.runtime_state),
      "audit_refs must not appear in persisted payload"
    );
  });

  test("resume_context is absent from loaded payload", async () => {
    const projectId = makeProjectId("strip_rc");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.ok(
      !("resume_context" in loadResult.runtime_state),
      "resume_context must not appear in persisted payload"
    );
  });

  test("_engine_outputs is absent from loaded payload", async () => {
    const projectId = makeProjectId("strip_eo");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.ok(
      !("_engine_outputs" in loadResult.runtime_state),
      "_engine_outputs must not appear in persisted payload"
    );
  });

  test("orchestrator_version is absent from loaded payload", async () => {
    const projectId = makeProjectId("strip_ov");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.ok(
      !("orchestrator_version" in loadResult.runtime_state),
      "orchestrator_version must not appear in persisted payload"
    );
  });

  test("orchestrated_at is absent from loaded payload", async () => {
    const projectId = makeProjectId("strip_oa");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult = await loadRuntimeState(projectId);
    assert.ok(
      !("orchestrated_at" in loadResult.runtime_state),
      "orchestrated_at must not appear in persisted payload"
    );
  });
});

// ---------------------------------------------------------------------------
// 7. saveRuntimeState — does not mutate input
// ---------------------------------------------------------------------------

describe("saveRuntimeState — no mutation of input", () => {
  test("runtime_state object is not mutated by save", async () => {
    const projectId = makeProjectId("no_mut");
    const state = makeRuntimeState({ project_id: projectId });
    const before = JSON.stringify(state);

    await trackedSave(state);

    const after = JSON.stringify(state);
    assert.strictEqual(before, after, "saveRuntimeState must not mutate the input runtime_state");
  });
});

// ---------------------------------------------------------------------------
// 8. loadRuntimeState — missing record fails truthfully
// ---------------------------------------------------------------------------

describe("loadRuntimeState — missing record", () => {
  test("returns ok: false for unknown project_id", async () => {
    const result = await loadRuntimeState(makeProjectId("does_not_exist"));
    assert.strictEqual(result.ok, false);
  });

  test("returns not_found: true for unknown project_id", async () => {
    const result = await loadRuntimeState(makeProjectId("also_missing"));
    assert.strictEqual(result.not_found, true);
  });

  test("error message references the missing project_id", async () => {
    const projectId = makeProjectId("msg_check_missing");
    const result = await loadRuntimeState(projectId);
    assert.ok(result.error.includes(projectId) || result.error.toLowerCase().includes("not found") || result.error.toLowerCase().includes("no persisted"));
  });
});

// ---------------------------------------------------------------------------
// 9. loadRuntimeState — malformed input rejected
// ---------------------------------------------------------------------------

describe("loadRuntimeState — malformed input", () => {
  test("returns ok: false for null project_id", async () => {
    const result = await loadRuntimeState(null);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(typeof result.error, "string");
  });

  test("returns ok: false for empty string project_id", async () => {
    const result = await loadRuntimeState("");
    assert.strictEqual(result.ok, false);
  });

  test("returns ok: false for whitespace-only project_id", async () => {
    const result = await loadRuntimeState("   ");
    assert.strictEqual(result.ok, false);
  });

  test("returns ok: false for numeric project_id", async () => {
    const result = await loadRuntimeState(42);
    assert.strictEqual(result.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 10. resumeRuntimeState — behaves identically to loadRuntimeState
// ---------------------------------------------------------------------------

describe("resumeRuntimeState", () => {
  test("returns ok: true after saving valid state", async () => {
    const projectId = makeProjectId("resume_valid");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const result = await resumeRuntimeState(projectId);
    assert.strictEqual(result.ok, true);
  });

  test("resume result runtime_state matches load result runtime_state", async () => {
    const projectId = makeProjectId("resume_match");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const loadResult  = await loadRuntimeState(projectId);
    const resumeResult = await resumeRuntimeState(projectId);

    assert.deepStrictEqual(resumeResult.runtime_state, loadResult.runtime_state);
  });

  test("returns ok: false for missing project_id", async () => {
    const result = await resumeRuntimeState(makeProjectId("resume_missing"));
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.not_found, true);
  });

  test("returns ok: false for malformed project_id", async () => {
    const result = await resumeRuntimeState(null);
    assert.strictEqual(result.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 11. Deterministic identifier / overwrite behaviour
// ---------------------------------------------------------------------------

describe("deterministic identifier behaviour", () => {
  test("saving twice with same project_id overwrites — second load returns latest save", async () => {
    const projectId = makeProjectId("overwrite");

    const state1 = makeRuntimeState({ project_id: projectId });
    state1.discovery_answers = { ...state1.discovery_answers, answers: { Q001: "yes" } };
    await trackedSave(state1);

    const state2 = makeRuntimeState({ project_id: projectId });
    state2.discovery_answers = { ...state2.discovery_answers, answers: { Q001: "no", Q002: "yes" } };
    await trackedSave(state2);

    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(loadResult.ok, true);
    assert.deepStrictEqual(
      loadResult.runtime_state.discovery_answers.answers,
      { Q001: "no", Q002: "yes" }
    );
  });

  test("two distinct project_ids produce independent stored records", async () => {
    const projectId1 = makeProjectId("distinct_a");
    const projectId2 = makeProjectId("distinct_b");

    const state1 = makeRuntimeState({ project_id: projectId1 });
    state1.discovery_answers = { ...state1.discovery_answers, answers: { Q001: "alpha" } };
    await trackedSave(state1);

    const state2 = makeRuntimeState({ project_id: projectId2 });
    state2.discovery_answers = { ...state2.discovery_answers, answers: { Q001: "beta" } };
    await trackedSave(state2);

    const load1 = await loadRuntimeState(projectId1);
    const load2 = await loadRuntimeState(projectId2);

    assert.strictEqual(load1.runtime_state.discovery_answers.answers.Q001, "alpha");
    assert.strictEqual(load2.runtime_state.discovery_answers.answers.Q001, "beta");
  });
});
