// ---------------------------------------------------------------------------
// Pipeline View Model — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Pure function. Derives the renderable model for the pipeline view from
//   pipeline store state. No business logic. No inference. No side effects.
//
// Hard rules:
//   M1  Pure function — same input always produces same output.
//   M2  No business logic. No inference. No derived semantic meaning.
//   M3  runtime_state is never mutated or re-shaped.
//   M4  All fields sourced directly from storeState — no silent fills.
//   M5  not_found surfaced truthfully: only true when store says so.
//   M6  Status booleans are derived mechanically from status string only.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// getPipelineViewModel
//
// @param {object} storeState — value of pipelineStore.getState()
// @returns {object}          — renderable model for the pipeline view
// ---------------------------------------------------------------------------

export function getPipelineViewModel(storeState) {
  const { status, runtime_state, error, not_found, saved_at, apply_result } = storeState;

  // ── Derived: unapplied approvals exist in runtime_state ──────────────────
  const approvals = runtime_state?._engine_outputs?.execution_approvals?.execution_approvals;
  const hasUnappliedApproval =
    Array.isArray(approvals) && approvals.some((a) => a?.execution_occurred === false);

  // ── Derived: first unapplied approval_id for apply payload construction ──
  const firstUnappliedApproval = Array.isArray(approvals)
    ? approvals.find((a) => a?.execution_occurred === false)
    : null;
  const firstUnappliedApprovalId = firstUnappliedApproval?.approval_id ?? null;

  // ── Derived: preview record for first unapplied approval ─────────────────
  // Traversal: firstUnappliedApproval.preview_id → runtime_state.previews[]
  const previewId = firstUnappliedApproval?.preview_id ?? null;
  const previews = runtime_state?.previews;
  let resolvedPreview = null;
  if (previewId && Array.isArray(previews)) {
    resolvedPreview = previews.find((p) => p?.preview_id === previewId) ?? null;
  }

  const previewTargetModel     = resolvedPreview?.target_model     ?? null;
  const previewTargetOperation = resolvedPreview?.target_operation ?? null;
  const previewIntendedChanges = resolvedPreview?.intended_changes ?? null;

  // previewResolutionError: non-null only when an unapplied approval exists but
  // preview resolution fails or required fields (target_model, target_operation) are null.
  let previewResolutionError = null;
  if (hasUnappliedApproval) {
    if (!previewId) {
      previewResolutionError = "Approval has no preview_id.";
    } else if (!Array.isArray(previews) || previews.length === 0) {
      previewResolutionError = "No previews in runtime state.";
    } else if (!resolvedPreview) {
      previewResolutionError = `Preview not found for preview_id: ${previewId}`;
    } else if (!previewTargetModel) {
      previewResolutionError = "Preview target_model is null.";
    } else if (!previewTargetOperation) {
      previewResolutionError = "Preview target_operation is null.";
    }
  }

  // ── Derived: project_id present in runtime_state ─────────────────────────
  const projectId = runtime_state?.project_identity?.project_id;
  const hasProjectIdentity = typeof projectId === 'string' && projectId.trim() !== '';

  return {
    // ── Lifecycle status (passed through unchanged) ───────────────────────
    status,

    // ── Status booleans — mechanical derivations from status string ───────
    isIdle:       status === 'idle',
    isRunning:    status === 'running',
    isLoading:    status === 'loading',
    isResuming:   status === 'resuming',
    isApplying:   status === 'applying',
    isSaving:     status === 'saving',
    isInProgress: status === 'running' || status === 'loading' || status === 'resuming' ||
                  status === 'applying' || status === 'saving',
    isSuccess:    status === 'success',
    isFailure:    status === 'failure',

    // ── not_found: true only when store explicitly sets it ────────────────
    isNotFound: status === 'failure' && not_found === true,

    // ── Readiness — mechanical derivations from status + runtime_state ────
    // canApply: ready only when last action succeeded, unapplied approvals exist,
    // and preview resolves with non-null target_model and target_operation.
    canApply: status === 'success' && hasUnappliedApproval && !!previewTargetModel && !!previewTargetOperation,
    // canSave: ready only when last action succeeded and project_id is present
    canSave: status === 'success' && hasProjectIdentity,

    // ── Payload fields — unmodified from store ────────────────────────────
    runtime_state,
    error,
    saved_at,
    apply_result: apply_result ?? null,

    // ── Apply-payload fields — deterministic derivations from runtime_state
    // firstUnappliedApprovalId: approval_id of the first approval where
    // execution_occurred === false. Used by the view to construct the apply
    // payload without applying any business logic.
    firstUnappliedApprovalId,

    // ── Preview-bound operation fields ────────────────────────────────────
    // Sourced exclusively from the preview record linked by
    // firstUnappliedApproval.preview_id. Never inferred.
    previewTargetModel,
    previewTargetOperation,
    previewIntendedChanges,

    // Non-null when an unapplied approval exists but preview resolution fails
    // or required fields are null. Null when preview is fully resolved.
    previewResolutionError,
  };
}
