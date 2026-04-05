import test from "node:test";
import assert from "node:assert/strict";

import { getPipelineViewModel } from "./pipeline-view-model.js";
import { createPipelineStore } from "../state/pipeline-store.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function idleState() {
  return { status: "idle", runtime_state: null, error: null, not_found: false, saved_at: null };
}

function makeAdapter(overrides = {}) {
  return {
    runPipeline:        overrides.runPipeline        ?? (async () => ({ ok: true, runtime_state: {} })),
    loadPipelineState:  overrides.loadPipelineState  ?? (async () => ({ ok: true, runtime_state: {}, saved_at: null })),
    resumePipelineState: overrides.resumePipelineState ?? (async () => ({ ok: true, runtime_state: {}, saved_at: null })),
  };
}

// ---------------------------------------------------------------------------
// getPipelineViewModel — pure model derivation
// ---------------------------------------------------------------------------

test("getPipelineViewModel: idle state sets isIdle true, all others false", () => {
  const model = getPipelineViewModel(idleState());
  assert.equal(model.status, "idle");
  assert.equal(model.isIdle, true);
  assert.equal(model.isRunning, false);
  assert.equal(model.isLoading, false);
  assert.equal(model.isResuming, false);
  assert.equal(model.isInProgress, false);
  assert.equal(model.isSuccess, false);
  assert.equal(model.isFailure, false);
  assert.equal(model.isNotFound, false);
  assert.equal(model.runtime_state, null);
  assert.equal(model.error, null);
  assert.equal(model.saved_at, null);
});

test("getPipelineViewModel: running status sets isRunning and isInProgress true", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "running" });
  assert.equal(model.isRunning, true);
  assert.equal(model.isInProgress, true);
  assert.equal(model.isIdle, false);
  assert.equal(model.isSuccess, false);
});

test("getPipelineViewModel: loading status sets isLoading and isInProgress true", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "loading" });
  assert.equal(model.isLoading, true);
  assert.equal(model.isInProgress, true);
  assert.equal(model.isRunning, false);
});

test("getPipelineViewModel: resuming status sets isResuming and isInProgress true", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "resuming" });
  assert.equal(model.isResuming, true);
  assert.equal(model.isInProgress, true);
  assert.equal(model.isLoading, false);
});

test("getPipelineViewModel: success status sets isSuccess true with runtime_state and saved_at", () => {
  const runtimeState = { project_identity: { project_id: "p1" }, discovery_answers: {} };
  const model = getPipelineViewModel({
    status: "success",
    runtime_state: runtimeState,
    error: null,
    not_found: false,
    saved_at: "2026-03-27T10:00:00.000Z"
  });
  assert.equal(model.isSuccess, true);
  assert.equal(model.isFailure, false);
  assert.equal(model.isNotFound, false);
  assert.equal(model.runtime_state, runtimeState);
  assert.equal(model.saved_at, "2026-03-27T10:00:00.000Z");
});

test("getPipelineViewModel: failure without not_found sets isFailure true, isNotFound false", () => {
  const model = getPipelineViewModel({
    status: "failure",
    runtime_state: null,
    error: "Storage read failed.",
    not_found: false,
    saved_at: null
  });
  assert.equal(model.isFailure, true);
  assert.equal(model.isNotFound, false);
  assert.equal(model.error, "Storage read failed.");
});

test("getPipelineViewModel: failure with not_found:true sets isNotFound true", () => {
  const model = getPipelineViewModel({
    status: "failure",
    runtime_state: null,
    error: "No persisted state found.",
    not_found: true,
    saved_at: null
  });
  assert.equal(model.isFailure, true);
  assert.equal(model.isNotFound, true);
  assert.equal(model.error, "No persisted state found.");
});

test("getPipelineViewModel: runtime_state passed through as exact reference, not mutated", () => {
  const runtimeState = { project_identity: { project_id: "p-ref" }, discovery_answers: { q: "v" } };
  const model = getPipelineViewModel({ status: "success", runtime_state: runtimeState, error: null, not_found: false, saved_at: null });
  assert.equal(model.runtime_state, runtimeState);
  assert.deepEqual(Object.keys(model.runtime_state), Object.keys(runtimeState));
});

test("getPipelineViewModel is deterministic: same input always produces same output", () => {
  const storeState = { status: "success", runtime_state: { project_identity: { project_id: "p-det" }, discovery_answers: {} }, error: null, not_found: false, saved_at: "2026-01-01T00:00:00.000Z" };
  const m1 = getPipelineViewModel(storeState);
  const m2 = getPipelineViewModel(storeState);
  assert.equal(m1.status, m2.status);
  assert.equal(m1.isSuccess, m2.isSuccess);
  assert.equal(m1.runtime_state, m2.runtime_state);
  assert.equal(m1.saved_at, m2.saved_at);
});

// ---------------------------------------------------------------------------
// Integration: store → model — run action reaches success
// ---------------------------------------------------------------------------

test("run action: store reaches success; model reflects isSuccess with runtime_state", async () => {
  const runtimeState = { project_identity: { project_id: "p-run" }, discovery_answers: { q: "a" } };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
  }));

  await store.runPipeline({ discovery_answers: { q: "a" } });

  const model = getPipelineViewModel(store.getState());
  assert.equal(model.isSuccess, true);
  assert.equal(model.runtime_state, runtimeState);
  assert.equal(model.isNotFound, false);
  assert.equal(model.error, null);
});

test("run action: store reflects running during in-progress; model shows isInProgress", async () => {
  let capturedMidModel = null;
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => {
      capturedMidModel = getPipelineViewModel(store.getState());
      return { ok: true, runtime_state: {} };
    },
  }));

  await store.runPipeline({ discovery_answers: {} });

  assert.ok(capturedMidModel !== null);
  assert.equal(capturedMidModel.isInProgress, true);
  assert.equal(capturedMidModel.isRunning, true);
});

// ---------------------------------------------------------------------------
// Integration: store → model — load action reaches success
// ---------------------------------------------------------------------------

test("load action: store reaches success; model reflects isSuccess with runtime_state and saved_at", async () => {
  const runtimeState = { project_identity: { project_id: "p-load" }, discovery_answers: {} };
  const savedAt = "2026-03-27T11:00:00.000Z";
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: true, runtime_state: runtimeState, saved_at: savedAt }),
  }));

  await store.loadPipelineState("p-load");

  const model = getPipelineViewModel(store.getState());
  assert.equal(model.isSuccess, true);
  assert.equal(model.runtime_state, runtimeState);
  assert.equal(model.saved_at, savedAt);
  assert.equal(model.isNotFound, false);
});

test("load action: not_found response; model reflects isNotFound true", async () => {
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => ({ ok: false, error: "No persisted state found.", not_found: true }),
  }));

  await store.loadPipelineState("p-missing");

  const model = getPipelineViewModel(store.getState());
  assert.equal(model.isFailure, true);
  assert.equal(model.isNotFound, true);
  assert.match(model.error, /No persisted state found/);
  assert.equal(model.runtime_state, null);
});

// ---------------------------------------------------------------------------
// Integration: store → model — resume action reaches success
// ---------------------------------------------------------------------------

test("resume action: store reaches success; model reflects isSuccess with runtime_state and saved_at", async () => {
  const runtimeState = { project_identity: { project_id: "p-res" }, discovery_answers: { x: 1 } };
  const savedAt = "2026-03-27T12:00:00.000Z";
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => ({ ok: true, runtime_state: runtimeState, saved_at: savedAt }),
  }));

  await store.resumePipelineState("p-res");

  const model = getPipelineViewModel(store.getState());
  assert.equal(model.isSuccess, true);
  assert.equal(model.runtime_state, runtimeState);
  assert.equal(model.saved_at, savedAt);
});

test("resume action: not_found response; model reflects isNotFound true", async () => {
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => ({ ok: false, error: "No persisted state found.", not_found: true }),
  }));

  await store.resumePipelineState("p-gone");

  const model = getPipelineViewModel(store.getState());
  assert.equal(model.isFailure, true);
  assert.equal(model.isNotFound, true);
});

// ---------------------------------------------------------------------------
// Integration: error state
// ---------------------------------------------------------------------------

test("backend error: model reflects isFailure with error string, no not_found", async () => {
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: false, error: "Required field missing: discovery_answers." }),
  }));

  await store.runPipeline({});

  const model = getPipelineViewModel(store.getState());
  assert.equal(model.isFailure, true);
  assert.equal(model.isNotFound, false);
  assert.equal(model.error, "Required field missing: discovery_answers.");
  assert.equal(model.runtime_state, null);
});

test("network error: model reflects isFailure with network error string", async () => {
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: false, error: "Network unreachable." }),
  }));

  await store.runPipeline({ discovery_answers: {} });

  const model = getPipelineViewModel(store.getState());
  assert.equal(model.isFailure, true);
  assert.equal(model.error, "Network unreachable.");
});

// ---------------------------------------------------------------------------
// Integration: loading state renders truthfully
// ---------------------------------------------------------------------------

test("loading state: model shows isLoading true during loadPipelineState", async () => {
  let capturedMidModel = null;
  const store = createPipelineStore(makeAdapter({
    loadPipelineState: async () => {
      capturedMidModel = getPipelineViewModel(store.getState());
      return { ok: true, runtime_state: {}, saved_at: null };
    },
  }));

  await store.loadPipelineState("p1");

  assert.ok(capturedMidModel !== null);
  assert.equal(capturedMidModel.isLoading, true);
  assert.equal(capturedMidModel.isInProgress, true);
});

test("resuming state: model shows isResuming true during resumePipelineState", async () => {
  let capturedMidModel = null;
  const store = createPipelineStore(makeAdapter({
    resumePipelineState: async () => {
      capturedMidModel = getPipelineViewModel(store.getState());
      return { ok: true, runtime_state: {}, saved_at: null };
    },
  }));

  await store.resumePipelineState("p1");

  assert.ok(capturedMidModel !== null);
  assert.equal(capturedMidModel.isResuming, true);
  assert.equal(capturedMidModel.isInProgress, true);
});

// ---------------------------------------------------------------------------
// Integration: runtime_state passed through without mutation
// ---------------------------------------------------------------------------

test("runtime_state is exact reference from adapter through store to model — no mutation", async () => {
  const runtimeState = { project_identity: { project_id: "p-mut" }, discovery_answers: { q: "v" } };
  const store = createPipelineStore(makeAdapter({
    runPipeline: async () => ({ ok: true, runtime_state: runtimeState }),
  }));

  await store.runPipeline({ discovery_answers: { q: "v" } });

  const model = getPipelineViewModel(store.getState());
  assert.equal(model.runtime_state, runtimeState);
  assert.deepEqual(Object.keys(model.runtime_state), Object.keys(runtimeState));
});

// ---------------------------------------------------------------------------
// Integration: deterministic repeated interactions
// ---------------------------------------------------------------------------

test("repeated run interactions are deterministic: same adapter result → same model", async () => {
  const runtimeState = { project_identity: { project_id: "p-det2" }, discovery_answers: { q: "a" } };

  const store1 = createPipelineStore(makeAdapter({ runPipeline: async () => ({ ok: true, runtime_state: runtimeState }) }));
  const store2 = createPipelineStore(makeAdapter({ runPipeline: async () => ({ ok: true, runtime_state: runtimeState }) }));

  await store1.runPipeline({ discovery_answers: { q: "a" } });
  await store2.runPipeline({ discovery_answers: { q: "a" } });

  const m1 = getPipelineViewModel(store1.getState());
  const m2 = getPipelineViewModel(store2.getState());

  assert.equal(m1.isSuccess, m2.isSuccess);
  assert.deepEqual(m1.runtime_state, m2.runtime_state);
  assert.equal(m1.error, m2.error);
  assert.equal(m1.isNotFound, m2.isNotFound);
});

test("repeated not_found interactions are deterministic", async () => {
  const failResult = { ok: false, error: "No persisted state found.", not_found: true };

  const store1 = createPipelineStore(makeAdapter({ loadPipelineState: async () => failResult }));
  const store2 = createPipelineStore(makeAdapter({ loadPipelineState: async () => failResult }));

  await store1.loadPipelineState("p-gone");
  await store2.loadPipelineState("p-gone");

  const m1 = getPipelineViewModel(store1.getState());
  const m2 = getPipelineViewModel(store2.getState());

  assert.equal(m1.isNotFound, m2.isNotFound);
  assert.equal(m1.isFailure, m2.isFailure);
  assert.equal(m1.error, m2.error);
});

// ---------------------------------------------------------------------------
// getPipelineViewModel — applying/saving status booleans
// ---------------------------------------------------------------------------

test("getPipelineViewModel: applying status sets isApplying true and isInProgress true", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "applying" });
  assert.equal(model.isApplying, true);
  assert.equal(model.isInProgress, true);
  assert.equal(model.isSaving, false);
  assert.equal(model.isIdle, false);
  assert.equal(model.isSuccess, false);
});

test("getPipelineViewModel: saving status sets isSaving true and isInProgress true", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "saving" });
  assert.equal(model.isSaving, true);
  assert.equal(model.isInProgress, true);
  assert.equal(model.isApplying, false);
  assert.equal(model.isIdle, false);
  assert.equal(model.isSuccess, false);
});

// ---------------------------------------------------------------------------
// canApply — readiness derived from runtime_state unapplied approvals
// ---------------------------------------------------------------------------

test("canApply is false when status is not success", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "idle" });
  assert.equal(model.canApply, false);
});

test("canApply is false when success but no runtime_state", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: null });
  assert.equal(model.canApply, false);
});

test("canApply is false when success but no execution_approvals", () => {
  const runtimeState = { project_identity: { project_id: "p1" }, discovery_answers: {}, _engine_outputs: {} };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, false);
});

test("canApply is false when all approvals have execution_occurred: true", () => {
  const runtimeState = {
    project_identity: { project_id: "p1" },
    discovery_answers: {},
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [{ approval_id: "a1", execution_occurred: true }]
      }
    }
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, false);
});

test("canApply is true when success, unapplied approval exists, and preview resolves with non-null model and operation", () => {
  const runtimeState = {
    project_identity: { project_id: "p1" },
    discovery_answers: {},
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [{ approval_id: "a1", execution_occurred: false, preview_id: "pv-1" }]
      }
    },
    previews: [{ preview_id: "pv-1", target_model: "res.company", target_operation: "write", intended_changes: null }],
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, true);
});

// ---------------------------------------------------------------------------
// canSave — readiness derived from runtime_state project_identity
// ---------------------------------------------------------------------------

test("canSave is false when status is not success", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "failure" });
  assert.equal(model.canSave, false);
});

test("canSave is false when success but no runtime_state", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: null });
  assert.equal(model.canSave, false);
});

test("canSave is false when success but project_id is empty string", () => {
  const runtimeState = { project_identity: { project_id: "  " }, discovery_answers: {} };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canSave, false);
});

test("canSave is true when success and project_identity.project_id is non-empty", () => {
  const runtimeState = { project_identity: { project_id: "p-valid" }, discovery_answers: {} };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canSave, true);
});

// ---------------------------------------------------------------------------
// apply_result passed through to model
// ---------------------------------------------------------------------------

test("getPipelineViewModel: apply_result passed through from store state", () => {
  const applyResult = { result_status: "success", odoo_result: true, executed_at: "2026-03-28T10:00:00.000Z" };
  const model = getPipelineViewModel({
    status: "success",
    runtime_state: null,
    error: null,
    not_found: false,
    saved_at: null,
    apply_result: applyResult,
  });
  assert.deepEqual(model.apply_result, applyResult);
});

test("getPipelineViewModel: apply_result defaults to null when absent from store state", () => {
  const model = getPipelineViewModel(idleState());
  assert.equal(model.apply_result, null);
});

// ---------------------------------------------------------------------------
// firstUnappliedApprovalId — apply payload construction support
// ---------------------------------------------------------------------------

test("firstUnappliedApprovalId is null when runtime_state is null", () => {
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: null });
  assert.equal(model.firstUnappliedApprovalId, null);
});

test("firstUnappliedApprovalId is null when _engine_outputs has no execution_approvals", () => {
  const runtimeState = { project_identity: { project_id: "p1" }, _engine_outputs: {} };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.firstUnappliedApprovalId, null);
});

test("firstUnappliedApprovalId is the approval_id of the first unapplied approval", () => {
  const runtimeState = {
    project_identity: { project_id: "p1" },
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [
          { approval_id: "ap-1", execution_occurred: false },
          { approval_id: "ap-2", execution_occurred: false },
        ]
      }
    }
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.firstUnappliedApprovalId, "ap-1");
});

test("firstUnappliedApprovalId skips approvals where execution_occurred is true", () => {
  const runtimeState = {
    project_identity: { project_id: "p1" },
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [
          { approval_id: "ap-done", execution_occurred: true },
          { approval_id: "ap-next", execution_occurred: false },
        ]
      }
    }
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.firstUnappliedApprovalId, "ap-next");
});

test("firstUnappliedApprovalId is null when all approvals have execution_occurred: true", () => {
  const runtimeState = {
    project_identity: { project_id: "p1" },
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [
          { approval_id: "ap-1", execution_occurred: true },
          { approval_id: "ap-2", execution_occurred: true },
        ]
      }
    }
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.firstUnappliedApprovalId, null);
});

test("firstUnappliedApprovalId is null when execution_approvals array is empty", () => {
  const runtimeState = {
    _engine_outputs: { execution_approvals: { execution_approvals: [] } }
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.firstUnappliedApprovalId, null);
});

// ---------------------------------------------------------------------------
// Preview resolution — previewTargetModel / previewTargetOperation / previewIntendedChanges
// ---------------------------------------------------------------------------

function makePreviewRuntimeState({ approvalId = "a1", previewId = "pv-1", preview = null } = {}) {
  return {
    project_identity: { project_id: "p1" },
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [{ approval_id: approvalId, execution_occurred: false, preview_id: previewId }]
      }
    },
    previews: preview !== null ? [preview] : [],
  };
}

test("preview resolution: view model resolves preview via approval.preview_id", () => {
  const runtimeState = makePreviewRuntimeState({
    preview: { preview_id: "pv-1", target_model: "res.partner", target_operation: "create", intended_changes: { name: "ACME" } },
  });
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.previewTargetModel, "res.partner");
  assert.equal(model.previewTargetOperation, "create");
  assert.deepEqual(model.previewIntendedChanges, { name: "ACME" });
  assert.equal(model.previewResolutionError, null);
});

test("preview resolution: canApply true when preview fully resolved", () => {
  const runtimeState = makePreviewRuntimeState({
    preview: { preview_id: "pv-1", target_model: "res.company", target_operation: "write", intended_changes: null },
  });
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, true);
  assert.equal(model.previewResolutionError, null);
});

test("preview resolution: canApply false when approval has no preview_id", () => {
  const runtimeState = {
    project_identity: { project_id: "p1" },
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [{ approval_id: "a1", execution_occurred: false }]
      }
    },
    previews: [{ preview_id: "pv-1", target_model: "res.company", target_operation: "write", intended_changes: null }],
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, false);
  assert.equal(model.previewTargetModel, null);
  assert.equal(model.previewTargetOperation, null);
  assert.ok(model.previewResolutionError !== null);
  assert.match(model.previewResolutionError, /no preview_id/i);
});

test("preview resolution: canApply false when runtime_state has no previews array", () => {
  const runtimeState = {
    project_identity: { project_id: "p1" },
    _engine_outputs: {
      execution_approvals: {
        execution_approvals: [{ approval_id: "a1", execution_occurred: false, preview_id: "pv-1" }]
      }
    },
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, false);
  assert.ok(model.previewResolutionError !== null);
  assert.match(model.previewResolutionError, /No previews/);
});

test("preview resolution: canApply false when preview_id does not resolve to a preview", () => {
  const runtimeState = makePreviewRuntimeState({
    previewId: "pv-999",
    preview: { preview_id: "pv-1", target_model: "res.company", target_operation: "write", intended_changes: null },
  });
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, false);
  assert.equal(model.previewTargetModel, null);
  assert.ok(model.previewResolutionError !== null);
  assert.match(model.previewResolutionError, /Preview not found/);
});

test("preview resolution: canApply false when preview target_model is null", () => {
  const runtimeState = makePreviewRuntimeState({
    preview: { preview_id: "pv-1", target_model: null, target_operation: "write", intended_changes: null },
  });
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, false);
  assert.equal(model.previewTargetModel, null);
  assert.ok(model.previewResolutionError !== null);
  assert.match(model.previewResolutionError, /target_model is null/);
});

test("preview resolution: canApply false when preview target_operation is null", () => {
  const runtimeState = makePreviewRuntimeState({
    preview: { preview_id: "pv-1", target_model: "res.company", target_operation: null, intended_changes: null },
  });
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.canApply, false);
  assert.equal(model.previewTargetOperation, null);
  assert.ok(model.previewResolutionError !== null);
  assert.match(model.previewResolutionError, /target_operation is null/);
});

test("preview resolution: previewResolutionError is null when no unapplied approvals exist", () => {
  const runtimeState = {
    project_identity: { project_id: "p1" },
    _engine_outputs: {
      execution_approvals: { execution_approvals: [] }
    },
  };
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.previewResolutionError, null);
  assert.equal(model.previewTargetModel, null);
  assert.equal(model.previewTargetOperation, null);
  assert.equal(model.previewIntendedChanges, null);
});

test("preview resolution: previewIntendedChanges null when preview.intended_changes is null", () => {
  const runtimeState = makePreviewRuntimeState({
    preview: { preview_id: "pv-1", target_model: "res.company", target_operation: "write", intended_changes: null },
  });
  const model = getPipelineViewModel({ ...idleState(), status: "success", runtime_state: runtimeState });
  assert.equal(model.previewIntendedChanges, null);
});
