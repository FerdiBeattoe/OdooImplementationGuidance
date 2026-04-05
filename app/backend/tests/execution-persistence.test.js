// ---------------------------------------------------------------------------
// Execution Persistence Tests — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Proves that execution records (and checkpoint_confirmations,
// checkpoint_statuses) survive the save → load → pipeline-run → save cycle.
//
// Root cause addressed: pipeline-orchestrator.js Step 12, line 316
// unconditionally sets executions: recordsOutput.executions (which starts
// as [] on every fresh pipeline run). Without the P11 merge-on-save fix
// in the persistence service, prior execution records are overwritten.
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, after } from "node:test";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  saveRuntimeState,
  loadRuntimeState,
} from "../runtime-state-persistence-service.js";

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const TEST_RUN_ID = `execp_${Date.now()}`;
const _createdProjectIds = new Set();

function makeProjectId(label) {
  return `${TEST_RUN_ID}_${label}`;
}

function makeRuntimeState(overrides = {}) {
  const project_id = overrides.project_id ?? makeProjectId("default");
  return {
    project_identity: {
      project_id,
      project_name: "Exec Persistence Test",
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
    ...overrides,
  };
}

async function trackedSave(runtimeState) {
  const projectId = runtimeState?.project_identity?.project_id;
  if (typeof projectId === "string") _createdProjectIds.add(projectId);
  return saveRuntimeState(runtimeState);
}

after(async () => {
  const storeDir = path.resolve(__dirname, "..", "data", "runtime-states");
  for (const projectId of _createdProjectIds) {
    const safe = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
    try { await rm(path.join(storeDir, `${safe}.json`), { force: true }); } catch {}
  }
});

// ---------------------------------------------------------------------------
// 1. Executions survive save → load → pipeline-run → save cycle
// ---------------------------------------------------------------------------

describe("P11: execution records survive save → load → pipeline-run → save cycle", () => {

  test("executions from prior save are preserved when re-saved with empty executions", async () => {
    const projectId = makeProjectId("exec_survive");

    // Step 1: Save state with an execution record (simulates post-applyGoverned save)
    const stateWithExec = makeRuntimeState({ project_id: projectId });
    stateWithExec.executions = [
      {
        execution_id: "exec-aaa-111",
        checkpoint_id: "USR-FOUND-001",
        result_status: "success",
        executed_at: "2026-04-04T12:00:00.000Z",
        model: "res.users",
        method: "write",
      },
    ];
    const save1 = await trackedSave(stateWithExec);
    assert.strictEqual(save1.ok, true, "First save must succeed");

    // Step 2: Load and verify execution is present
    const load1 = await loadRuntimeState(projectId);
    assert.strictEqual(load1.ok, true);
    assert.strictEqual(load1.runtime_state.executions.length, 1);
    assert.strictEqual(load1.runtime_state.executions[0].execution_id, "exec-aaa-111");

    // Step 3: Simulate pipeline re-run — produces state with executions: []
    const pipelineState = makeRuntimeState({ project_id: projectId });
    pipelineState.executions = []; // This is what the orchestrator produces

    // Step 4: Save the pipeline-produced state
    const save2 = await trackedSave(pipelineState);
    assert.strictEqual(save2.ok, true, "Second save must succeed");

    // Step 5: Load and verify — execution record must still be present
    const load2 = await loadRuntimeState(projectId);
    assert.strictEqual(load2.ok, true);
    assert.strictEqual(load2.runtime_state.executions.length, 1, "Execution record must survive pipeline re-run save");
    assert.strictEqual(load2.runtime_state.executions[0].execution_id, "exec-aaa-111");
    assert.strictEqual(load2.runtime_state.executions[0].checkpoint_id, "USR-FOUND-001");
  });

  test("multiple execution records accumulate across saves", async () => {
    const projectId = makeProjectId("exec_accumulate");

    // Save with first execution
    const state1 = makeRuntimeState({ project_id: projectId });
    state1.executions = [
      { execution_id: "exec-001", checkpoint_id: "FND-FOUND-001", result_status: "success", executed_at: "2026-04-04T10:00:00Z" },
    ];
    await trackedSave(state1);

    // Save with second execution (simulates second applyGoverned)
    const state2 = makeRuntimeState({ project_id: projectId });
    state2.executions = [
      { execution_id: "exec-002", checkpoint_id: "FND-FOUND-002", result_status: "success", executed_at: "2026-04-04T11:00:00Z" },
    ];
    await trackedSave(state2);

    const load = await loadRuntimeState(projectId);
    assert.strictEqual(load.runtime_state.executions.length, 2, "Both executions must be present");
    const ids = load.runtime_state.executions.map((e) => e.execution_id).sort();
    assert.deepStrictEqual(ids, ["exec-001", "exec-002"]);
  });

  test("duplicate execution_ids are not created on re-save", async () => {
    const projectId = makeProjectId("exec_dedup");

    // Save with execution
    const state1 = makeRuntimeState({ project_id: projectId });
    state1.executions = [
      { execution_id: "exec-dedup-1", checkpoint_id: "USR-DREQ-001", result_status: "success", executed_at: "2026-04-04T12:00:00Z" },
    ];
    await trackedSave(state1);

    // Save again with SAME execution (simulates re-save of the same state)
    const state2 = makeRuntimeState({ project_id: projectId });
    state2.executions = [
      { execution_id: "exec-dedup-1", checkpoint_id: "USR-DREQ-001", result_status: "success", executed_at: "2026-04-04T12:00:00Z" },
    ];
    await trackedSave(state2);

    const load = await loadRuntimeState(projectId);
    assert.strictEqual(load.runtime_state.executions.length, 1, "No duplicates on re-save");
  });

  test("pipeline re-run with empty executions followed by another pipeline re-run preserves all records", async () => {
    const projectId = makeProjectId("exec_double_rerun");

    // Initial save with executions
    const state1 = makeRuntimeState({ project_id: projectId });
    state1.executions = [
      { execution_id: "exec-r1", checkpoint_id: "USR-FOUND-001", result_status: "success", executed_at: "2026-04-04T10:00:00Z" },
      { execution_id: "exec-r2", checkpoint_id: "USR-DREQ-001", result_status: "success", executed_at: "2026-04-04T11:00:00Z" },
    ];
    await trackedSave(state1);

    // Pipeline re-run 1 (empty executions)
    const rerun1 = makeRuntimeState({ project_id: projectId });
    rerun1.executions = [];
    await trackedSave(rerun1);

    // Pipeline re-run 2 (still empty executions)
    const rerun2 = makeRuntimeState({ project_id: projectId });
    rerun2.executions = [];
    await trackedSave(rerun2);

    const load = await loadRuntimeState(projectId);
    assert.strictEqual(load.runtime_state.executions.length, 2, "Both records survive two pipeline re-runs");
  });
});

// ---------------------------------------------------------------------------
// 2. Checkpoint confirmations survive re-save
// ---------------------------------------------------------------------------

describe("P11: checkpoint_confirmations survive pipeline re-save", () => {

  test("checkpoint_confirmations from prior save are preserved when re-saved without them", async () => {
    const projectId = makeProjectId("conf_survive");

    // Save with confirmation
    const state1 = makeRuntimeState({ project_id: projectId });
    state1.checkpoint_confirmations = {
      "FND-FOUND-003": {
        confirmed_at: "2026-04-04T18:01:00Z",
        evidence: "USD is base currency",
      },
    };
    await trackedSave(state1);

    // Pipeline re-run (no checkpoint_confirmations key)
    const rerunState = makeRuntimeState({ project_id: projectId });
    // Pipeline output does not include checkpoint_confirmations
    await trackedSave(rerunState);

    const load = await loadRuntimeState(projectId);
    assert.ok(load.runtime_state.checkpoint_confirmations, "checkpoint_confirmations must be preserved");
    assert.ok(load.runtime_state.checkpoint_confirmations["FND-FOUND-003"], "FND-FOUND-003 confirmation must survive");
  });
});

// ---------------------------------------------------------------------------
// 3. Checkpoint statuses survive re-save
// ---------------------------------------------------------------------------

describe("P11: checkpoint_statuses survive pipeline re-save", () => {

  test("checkpoint_statuses from prior save are preserved when re-saved without them", async () => {
    const projectId = makeProjectId("status_survive");

    // Save with statuses
    const state1 = makeRuntimeState({ project_id: projectId });
    state1.checkpoint_statuses = {
      "FND-FOUND-003": "Complete",
      "USR-FOUND-001": "Complete",
    };
    await trackedSave(state1);

    // Pipeline re-run (no checkpoint_statuses key)
    const rerunState = makeRuntimeState({ project_id: projectId });
    await trackedSave(rerunState);

    const load = await loadRuntimeState(projectId);
    assert.ok(load.runtime_state.checkpoint_statuses, "checkpoint_statuses must be preserved");
    assert.strictEqual(load.runtime_state.checkpoint_statuses["FND-FOUND-003"], "Complete");
    assert.strictEqual(load.runtime_state.checkpoint_statuses["USR-FOUND-001"], "Complete");
  });

  test("new checkpoint_statuses merge with prior values", async () => {
    const projectId = makeProjectId("status_merge");

    const state1 = makeRuntimeState({ project_id: projectId });
    state1.checkpoint_statuses = { "CP-001": "Complete" };
    await trackedSave(state1);

    const state2 = makeRuntimeState({ project_id: projectId });
    state2.checkpoint_statuses = { "CP-002": "Complete" };
    await trackedSave(state2);

    const load = await loadRuntimeState(projectId);
    assert.strictEqual(load.runtime_state.checkpoint_statuses["CP-001"], "Complete");
    assert.strictEqual(load.runtime_state.checkpoint_statuses["CP-002"], "Complete");
  });
});
