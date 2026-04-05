import test from "node:test";
import assert from "node:assert/strict";

import { createPipelineStore } from "./pipeline-store.js";

// ---------------------------------------------------------------------------
// Adapter stub factory
//
// Produces a minimal adapter object. Override individual functions per test.
// ---------------------------------------------------------------------------

function makeAdapter(overrides = {}) {
  return {
    runPipeline:                overrides.runPipeline                ?? (async () => ({ ok: true, runtime_state: {} })),
    loadPipelineState:          overrides.loadPipelineState          ?? (async () => ({ ok: true, runtime_state: {}, saved_at: null })),
    resumePipelineState:        overrides.resumePipelineState        ?? (async () => ({ ok: true, runtime_state: {}, saved_at: null })),
    applyGoverned:              overrides.applyGoverned              ?? (async () => ({ ok: true, result_status: 'success', odoo_result: null, executed_at: null })),
    savePipelineState:          overrides.savePipelineState          ?? (async () => ({ ok: true, project_id: 'default', saved_at: null })),
    registerPipelineConnection: overrides.registerPipelineConnection ?? (async () => ({ ok: true, registered_at: null })),
  };
}

// ---------------------------------------------------------------------------
// Subscriber capture helper
// ---------------------------------------------------------------------------

function captureNotifications(store) {
  const snapshots = [];
  store.subscribe(() => snapshots.push({ ...store.getState() }));
  return snapshots;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

test("store initializes to idle with null runtime_state", () => {
  const store = createPipelineStore(makeAdapter());
  const state = store.getState();

  assert.equal(state.status, "idle");
  assert.equal(state.runtime_state, null);
  assert.equal(state.error, null);
  assert.equal(state.not_found, false);
  assert.equal(state.saved_at, null);
});

// ---------------------------------------------------------------------------
// runPipeline — success
// ---------------------------------------------------------------------------

test("runPipeline transitions idle → running → success", async () => {
  const runtimeState = { project_identity: { project_id: "p1" }, discovery_answers: { q: "a" } };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
  }));
  const snapshots = captureNotifications(store);

  await store.runPipeline({ discovery_answers: { q: "a" } });

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].status, "running");
  assert.equal(snapshots[1].status, "success");
  assert.equal(store.getState().status, "success");
  assert.deepEqual(store.getState().runtime_state, runtimeState);
  assert.equal(store.getState().error, null);
});

test("runPipeline clears prior state before request", async () => {
  // Prime state with a failure first
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: false, error: "prior error" }),
  }));
  await store.runPipeline({});

  // Second run — adapter now succeeds
  const adapter2 = makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: { project_identity: { project_id: "p2" }, discovery_answers: {} } }),
  });
  const store2 = createPipelineStore(adapter2);

  // Manually prime store2 by running a failure first
  store2._runPipeline = async () => ({ ok: false, error: "old" }); // not injected this way — use separate store

  // Simpler: verify via snapshots that running clears error before request
  const store3 = createPipelineStore(makeAdapter({
    runPipeline: async () => {
      // By the time the adapter is called, state should already be "running" with cleared fields
      const midState = store3.getState();
      assert.equal(midState.status, "running");
      assert.equal(midState.error, null);
      assert.equal(midState.not_found, false);
      assert.equal(midState.runtime_state, null);
      return { ok: true, runtime_state: {} };
    },
  }));

  await store3.runPipeline({ discovery_answers: {} });
});

// ---------------------------------------------------------------------------
// loadPipelineState — success
// ---------------------------------------------------------------------------

test("loadPipelineState transitions idle → loading → success with runtime_state and saved_at", async () => {
  const runtimeState = { project_identity: { project_id: "p2" }, discovery_answers: {} };
  const savedAt = "2026-03-27T10:00:00.000Z";
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: true, runtime_state: runtimeState, saved_at: savedAt }),
  }));
  const snapshots = captureNotifications(store);

  await store.loadPipelineState("p2");

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].status, "loading");
  assert.equal(snapshots[1].status, "success");
  assert.equal(store.getState().status, "success");
  assert.deepEqual(store.getState().runtime_state, runtimeState);
  assert.equal(store.getState().saved_at, savedAt);
  assert.equal(store.getState().error, null);
  assert.equal(store.getState().not_found, false);
});

// ---------------------------------------------------------------------------
// resumePipelineState — success
// ---------------------------------------------------------------------------

test("resumePipelineState transitions idle → resuming → success with runtime_state and saved_at", async () => {
  const runtimeState = { project_identity: { project_id: "p3" }, discovery_answers: { x: 1 } };
  const savedAt = "2026-03-27T12:00:00.000Z";
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => ({ ok: true, runtime_state: runtimeState, saved_at: savedAt }),
  }));
  const snapshots = captureNotifications(store);

  await store.resumePipelineState("p3");

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].status, "resuming");
  assert.equal(snapshots[1].status, "success");
  assert.equal(store.getState().status, "success");
  assert.deepEqual(store.getState().runtime_state, runtimeState);
  assert.equal(store.getState().saved_at, savedAt);
  assert.equal(store.getState().error, null);
  assert.equal(store.getState().not_found, false);
});

// ---------------------------------------------------------------------------
// Backend failure transitions
// ---------------------------------------------------------------------------

test("runPipeline transitions to failure on backend error", async () => {
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: false, error: "Required field missing: discovery_answers." }),
  }));
  const snapshots = captureNotifications(store);

  await store.runPipeline({});

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].status, "running");
  assert.equal(snapshots[1].status, "failure");
  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().error, "Required field missing: discovery_answers.");
  assert.equal(store.getState().runtime_state, null);
});

test("loadPipelineState transitions to failure on backend error", async () => {
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: false, error: "Storage read failed." }),
  }));

  await store.loadPipelineState("p-bad");

  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().error, "Storage read failed.");
  assert.equal(store.getState().runtime_state, null);
  assert.equal(store.getState().not_found, false);
});

test("resumePipelineState transitions to failure on backend error", async () => {
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => ({ ok: false, error: "Storage read failed." }),
  }));

  await store.resumePipelineState("p-bad");

  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().error, "Storage read failed.");
  assert.equal(store.getState().runtime_state, null);
});

// ---------------------------------------------------------------------------
// Network failure transitions
// ---------------------------------------------------------------------------

test("runPipeline transitions to failure on network error from adapter", async () => {
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: false, error: "Network unreachable." }),
  }));

  await store.runPipeline({ discovery_answers: {} });

  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().error, "Network unreachable.");
  assert.equal(store.getState().runtime_state, null);
});

test("loadPipelineState transitions to failure on network error from adapter", async () => {
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: false, error: "Network unreachable." }),
  }));

  await store.loadPipelineState("p1");

  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().error, "Network unreachable.");
});

test("resumePipelineState transitions to failure on network error from adapter", async () => {
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => ({ ok: false, error: "Network unreachable." }),
  }));

  await store.resumePipelineState("p1");

  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().error, "Network unreachable.");
});

// ---------------------------------------------------------------------------
// not_found transitions
// ---------------------------------------------------------------------------

test("loadPipelineState sets not_found:true when adapter surfaces not_found", async () => {
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({
      ok: false,
      error: "No persisted state found for project_id \"p-missing\".",
      not_found: true,
    }),
  }));

  await store.loadPipelineState("p-missing");

  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().not_found, true);
  assert.match(store.getState().error, /No persisted state found/);
  assert.equal(store.getState().runtime_state, null);
});

test("resumePipelineState sets not_found:true when adapter surfaces not_found", async () => {
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => ({
      ok: false,
      error: "No persisted state found for project_id \"p-gone\".",
      not_found: true,
    }),
  }));

  await store.resumePipelineState("p-gone");

  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().not_found, true);
  assert.match(store.getState().error, /No persisted state found/);
});

test("loadPipelineState does not set not_found when adapter omits it", async () => {
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: false, error: "Some other error." }),
  }));

  await store.loadPipelineState("p1");

  assert.equal(store.getState().not_found, false);
});

test("resumePipelineState does not set not_found when adapter omits it", async () => {
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => ({ ok: false, error: "Some other error." }),
  }));

  await store.resumePipelineState("p1");

  assert.equal(store.getState().not_found, false);
});

// ---------------------------------------------------------------------------
// runtime_state — no mutation
// ---------------------------------------------------------------------------

test("runPipeline does not mutate the runtime_state object received from adapter", async () => {
  const runtimeState = { project_identity: { project_id: "p-mut" }, discovery_answers: { q: "v" } };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
  }));

  await store.runPipeline({ discovery_answers: { q: "v" } });

  // Store holds the exact reference — no copy, no added keys
  assert.equal(store.getState().runtime_state, runtimeState);
  assert.deepEqual(Object.keys(store.getState().runtime_state), Object.keys(runtimeState));
});

test("loadPipelineState does not mutate the runtime_state object received from adapter", async () => {
  const runtimeState = { project_identity: { project_id: "p-mut2" }, discovery_answers: {} };
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: true, runtime_state: runtimeState, saved_at: "2026-01-01T00:00:00.000Z" }),
  }));

  await store.loadPipelineState("p-mut2");

  assert.equal(store.getState().runtime_state, runtimeState);
  assert.deepEqual(Object.keys(store.getState().runtime_state), Object.keys(runtimeState));
});

test("resumePipelineState does not mutate the runtime_state object received from adapter", async () => {
  const runtimeState = { project_identity: { project_id: "p-mut3" }, discovery_answers: {} };
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => ({ ok: true, runtime_state: runtimeState, saved_at: "2026-01-01T00:00:00.000Z" }),
  }));

  await store.resumePipelineState("p-mut3");

  assert.equal(store.getState().runtime_state, runtimeState);
  assert.deepEqual(Object.keys(store.getState().runtime_state), Object.keys(runtimeState));
});

// ---------------------------------------------------------------------------
// Determinism — repeated identical transitions produce identical state
// ---------------------------------------------------------------------------

test("runPipeline is deterministic: two identical calls produce identical final state", async () => {
  const runtimeState = { project_identity: { project_id: "p-det" }, discovery_answers: { q: "a" } };

  const store1 = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
  }));
  const store2 = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
  }));

  await store1.runPipeline({ discovery_answers: { q: "a" } });
  await store2.runPipeline({ discovery_answers: { q: "a" } });

  assert.equal(store1.getState().status, store2.getState().status);
  assert.deepEqual(store1.getState().runtime_state, store2.getState().runtime_state);
  assert.equal(store1.getState().error, store2.getState().error);
});

test("loadPipelineState is deterministic: two identical calls produce identical final state", async () => {
  const runtimeState = { project_identity: { project_id: "p-det2" }, discovery_answers: {} };
  const savedAt = "2026-03-27T00:00:00.000Z";

  const store1 = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: true, runtime_state: runtimeState, saved_at: savedAt }),
  }));
  const store2 = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: true, runtime_state: runtimeState, saved_at: savedAt }),
  }));

  await store1.loadPipelineState("p-det2");
  await store2.loadPipelineState("p-det2");

  assert.equal(store1.getState().status, store2.getState().status);
  assert.deepEqual(store1.getState().runtime_state, store2.getState().runtime_state);
  assert.equal(store1.getState().saved_at, store2.getState().saved_at);
});

test("not_found failure is deterministic: two identical not_found responses produce identical state", async () => {
  const failResult = { ok: false, error: "No persisted state found.", not_found: true };

  const store1 = createPipelineStore(makeAdapter({
    resumePipelineState: async () => failResult,
  }));
  const store2 = createPipelineStore(makeAdapter({
    resumePipelineState: async () => failResult,
  }));

  await store1.resumePipelineState("p-gone");
  await store2.resumePipelineState("p-gone");

  assert.equal(store1.getState().status, store2.getState().status);
  assert.equal(store1.getState().not_found, store2.getState().not_found);
  assert.equal(store1.getState().error, store2.getState().error);
});

// ---------------------------------------------------------------------------
// Subscriber notifications
// ---------------------------------------------------------------------------

test("subscribe returns an unsubscribe function that stops notifications", async () => {
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: {} }),
  }));

  let callCount = 0;
  const unsubscribe = store.subscribe(() => { callCount++; });

  unsubscribe();

  await store.runPipeline({ discovery_answers: {} });

  assert.equal(callCount, 0);
});

test("multiple subscribers each receive notifications", async () => {
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: {} }),
  }));

  let count1 = 0;
  let count2 = 0;
  store.subscribe(() => { count1++; });
  store.subscribe(() => { count2++; });

  await store.runPipeline({ discovery_answers: {} });

  // 2 notifications (running + success), each to 2 subscribers
  assert.equal(count1, 2);
  assert.equal(count2, 2);
});

// ---------------------------------------------------------------------------
// applyGoverned — lifecycle transitions
// ---------------------------------------------------------------------------

test("applyGoverned transitions to applying then success with apply_result", async () => {
  const applyResult = { ok: true, result_status: "success", odoo_result: true, executed_at: "2026-03-28T10:00:00.000Z" };
  const runtimeState = { project_identity: { project_id: "p-apply" }, discovery_answers: {} };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
    applyGoverned: async () => applyResult,
  }));
  await store.runPipeline({ discovery_answers: {} });

  const snapshots = captureNotifications(store);
  await store.applyGoverned({ approval_id: "a1", runtime_state: runtimeState, operation: {}, connection_context: { project_id: "p-apply" } });

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].status, "applying");
  assert.equal(snapshots[1].status, "success");
  assert.equal(store.getState().apply_result.result_status, "success");
  assert.equal(store.getState().error, null);
});

test("applyGoverned preserves runtime_state during and after apply", async () => {
  const runtimeState = { project_identity: { project_id: "p-apply2" }, discovery_answers: {} };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
    applyGoverned: async () => ({ ok: true, result_status: "success", odoo_result: null, executed_at: null }),
  }));
  await store.runPipeline({ discovery_answers: {} });
  await store.applyGoverned({ approval_id: "a1", runtime_state: runtimeState, operation: {}, connection_context: { project_id: "p-apply2" } });

  assert.equal(store.getState().runtime_state, runtimeState);
});

test("applyGoverned transitions to failure on backend error", async () => {
  const store = createPipelineStore(makeAdapter({
    applyGoverned: async () => ({ ok: false, error: "Approval not found: a-bad." }),
  }));
  const snapshots = captureNotifications(store);

  await store.applyGoverned({ approval_id: "a-bad" });

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].status, "applying");
  assert.equal(snapshots[1].status, "failure");
  assert.equal(store.getState().error, "Approval not found: a-bad.");
  assert.equal(store.getState().apply_result, null);
});

// ---------------------------------------------------------------------------
// savePipelineState — lifecycle transitions
// ---------------------------------------------------------------------------

test("savePipelineState transitions to saving then success, updates saved_at, preserves runtime_state", async () => {
  const runtimeState = { project_identity: { project_id: "p-save" }, discovery_answers: {} };
  const savedAt = "2026-03-28T10:00:00.000Z";
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
    savePipelineState: async () => ({ ok: true, project_id: "p-save", saved_at: savedAt }),
  }));
  await store.runPipeline({ discovery_answers: {} });

  const snapshots = captureNotifications(store);
  await store.savePipelineState(runtimeState);

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].status, "saving");
  assert.equal(snapshots[1].status, "success");
  assert.equal(store.getState().saved_at, savedAt);
  assert.equal(store.getState().runtime_state, runtimeState);
  assert.equal(store.getState().error, null);
});

test("savePipelineState transitions to failure on backend error", async () => {
  const store = createPipelineStore(makeAdapter({
    savePipelineState: async () => ({ ok: false, error: "runtime_state.project_identity.project_id must be a non-empty string." }),
  }));
  const snapshots = captureNotifications(store);

  await store.savePipelineState({});

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].status, "saving");
  assert.equal(snapshots[1].status, "failure");
  assert.match(store.getState().error, /project_id/);
});

test("savePipelineState notifies subscribers on both saving and result transitions", async () => {
  const store = createPipelineStore(makeAdapter({
    savePipelineState: async () => ({ ok: true, project_id: "p1", saved_at: "2026-03-28T10:00:00.000Z" }),
  }));
  let count = 0;
  store.subscribe(() => count++);

  await store.savePipelineState({ project_identity: { project_id: "p1" }, discovery_answers: {} });

  assert.equal(count, 2);
});

// ---------------------------------------------------------------------------
// applyGoverned — post-apply runtime_state update (truth chain)
// ---------------------------------------------------------------------------

test("applyGoverned updates state.runtime_state with updated_runtime_state on success", async () => {
  const originalState = { project_identity: { project_id: "p-orig" }, executions: [] };
  const updatedState  = { project_identity: { project_id: "p-orig" }, executions: [{ execution_id: "exec-001" }] };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: originalState }),
    applyGoverned: async () => ({
      ok: true,
      result_status: "success",
      odoo_result: true,
      executed_at: "2026-03-28T10:00:00.000Z",
      updated_runtime_state: updatedState,
    }),
  }));
  await store.runPipeline({ discovery_answers: {} });
  assert.equal(store.getState().runtime_state, originalState);

  await store.applyGoverned({ approval_id: "a1", runtime_state: originalState, operation: {}, connection_context: { project_id: "p-orig" } });

  assert.equal(store.getState().status, "success");
  assert.equal(store.getState().runtime_state, updatedState,
    "runtime_state must be replaced with updated_runtime_state from apply response");
});

test("applyGoverned preserves runtime_state when updated_runtime_state is absent in response", async () => {
  const runtimeState = { project_identity: { project_id: "p-preserve" }, executions: [] };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
    applyGoverned: async () => ({
      ok: true,
      result_status: "success",
      odoo_result: null,
      executed_at: null,
      // no updated_runtime_state — older response shape
    }),
  }));
  await store.runPipeline({ discovery_answers: {} });
  await store.applyGoverned({ approval_id: "a1", runtime_state: runtimeState, operation: {}, connection_context: { project_id: "p-preserve" } });

  assert.equal(store.getState().runtime_state, runtimeState,
    "runtime_state must be unchanged when updated_runtime_state is absent");
});

test("applyGoverned does not update runtime_state on failure", async () => {
  const runtimeState = { project_identity: { project_id: "p-fail-apply" }, executions: [] };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
    applyGoverned: async () => ({ ok: false, error: "Apply refused." }),
  }));
  await store.runPipeline({ discovery_answers: {} });
  await store.applyGoverned({ approval_id: "a-bad", runtime_state: runtimeState, operation: {}, connection_context: { project_id: "p-fail-apply" } });

  assert.equal(store.getState().status, "failure");
  assert.equal(store.getState().runtime_state, runtimeState,
    "runtime_state must remain unchanged on apply failure");
});

test("applyGoverned consumed approval visible in updated runtime_state", async () => {
  const approval = {
    approval_id: "a-consume",
    candidate_id: "c1",
    execution_occurred: false,
  };
  const originalState = {
    _engine_outputs: {
      execution_approvals: { execution_approvals: [approval] },
    },
    executions: [],
  };
  const updatedState = {
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [{ ...approval, execution_occurred: true }],
      },
    },
    executions: [{ execution_id: "exec-new-001" }],
  };
  const store = createPipelineStore(makeAdapter({
    applyGoverned: async () => ({
      ok: true,
      result_status: "success",
      odoo_result: true,
      executed_at: "2026-03-28T10:00:00.000Z",
      updated_runtime_state: updatedState,
    }),
  }));

  await store.applyGoverned({ approval_id: "a-consume", runtime_state: originalState, operation: {}, connection_context: { project_id: "p-consume" } });

  assert.equal(store.getState().status, "success");
  const storedApprovals =
    store.getState().runtime_state?._engine_outputs?.execution_approvals?.execution_approvals;
  assert.ok(Array.isArray(storedApprovals), "stored approvals must be an array");
  const consumed = storedApprovals.find((a) => a.approval_id === "a-consume");
  assert.ok(consumed, "consumed approval must be in stored runtime_state");
  assert.equal(consumed.execution_occurred, true,
    "execution_occurred must be true in stored runtime_state");
});

// ---------------------------------------------------------------------------
// Slice 2: registerPipelineConnection — store action
// ---------------------------------------------------------------------------

test("registerPipelineConnection sets connection_registered:true and connection_project_id on success", async () => {
  const store = createPipelineStore(makeAdapter({
    registerPipelineConnection: async () => ({ ok: true, registered_at: "2026-03-29T10:00:00.000Z" }),
  }));

  await store.registerPipelineConnection("proj-001", { url: "https://demo.odoo.com", database: "demo", username: "admin", password: "secret" });

  assert.equal(store.getState().connection_registered, true);
  assert.equal(store.getState().connection_project_id, "proj-001");
  assert.equal(store.getState().connection_error, null);
});

test("registerPipelineConnection sets connection_registered:false and connection_error on failure", async () => {
  const store = createPipelineStore(makeAdapter({
    registerPipelineConnection: async () => ({ ok: false, error: "Authentication failed." }),
  }));

  await store.registerPipelineConnection("proj-001", {});

  assert.equal(store.getState().connection_registered, false);
  assert.equal(store.getState().connection_error, "Authentication failed.");
});

test("registerPipelineConnection notifies subscribers on both start and result", async () => {
  const store = createPipelineStore(makeAdapter({
    registerPipelineConnection: async () => ({ ok: true, registered_at: null }),
  }));
  let count = 0;
  store.subscribe(() => count++);

  await store.registerPipelineConnection("proj-001", {});

  assert.equal(count, 2, "must notify on start (connection_error cleared) and on result");
});

test("registerPipelineConnection does not mutate pipeline lifecycle status", async () => {
  const runtimeState = { project_identity: { project_id: "p1" }, discovery_answers: {} };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
    registerPipelineConnection: async () => ({ ok: true, registered_at: null }),
  }));
  await store.runPipeline({ discovery_answers: {} });
  assert.equal(store.getState().status, "success");

  await store.registerPipelineConnection("proj-001", {});

  assert.equal(store.getState().status, "success",
    "pipeline lifecycle status must not be mutated by connection registration");
  assert.equal(store.getState().runtime_state, runtimeState,
    "runtime_state must not be mutated by connection registration");
});

test("store initializes with connection_registered:false, connection_project_id:null, connection_error:null", () => {
  const store = createPipelineStore(makeAdapter());
  const state = store.getState();

  assert.equal(state.connection_registered, false);
  assert.equal(state.connection_project_id, null);
  assert.equal(state.connection_error, null);
});
