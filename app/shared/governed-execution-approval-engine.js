// ---------------------------------------------------------------------------
// Governed Execution Approval Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   First-pass approval determination for execution candidates.
//   Produces execution_approvals: records for candidates that satisfy all
//   governed approval gates from provided approval context inputs.
//   THIS IS NOT EXECUTION. No state is mutated. No execution is performed.
//   An approval record does not mean execution occurred.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1.5 (checkpoints: safety_class,
//     execution_relevance, preview_required)
//   - specs/runtime_state_contract.md §1.9 (blockers: active_blockers)
//   - governed-execution-eligibility-engine.js (execution_candidate shape;
//     candidate_id, checkpoint_id, preview_id, safety_class mandatory)
//   - governed-preview-engine.js (preview record shape; preview_id mandatory)
//   - connection-state.js (availableFeatures.execute, status enum)
//
// Hard rules:
//   R1  Inputs: execution_candidates, checkpoints, blockers, previews,
//       project_state, target_context (optional), connection_state (optional),
//       approval_context (optional).
//       Output: execution_approvals container. No other state mutation.
//   R2  An approval record is generated ONLY when all approval gates pass.
//       A failing gate produces no record — refusal is by omission.
//   R3  Gate 1 — Candidate required: input must be a valid execution_candidate
//       record with a non-empty candidate_id. Non-candidates produce no record.
//   R4  Gate 2 — Checkpoint linkage: candidate.checkpoint_id must resolve to a
//       checkpoint record in checkpoints. Unresolvable checkpoint produces no record.
//   R5  Gate 3 — Preview linkage: candidate.preview_id must resolve to a preview
//       record in previews. Unresolvable preview produces no record.
//   R6  Gate 4 — Blocked refusal: if the candidate's checkpoint_id has an active
//       blocker record in blockers.active_blockers, no approval record is produced.
//       Blocked checkpoints must never become approved.
//   R7  Gate 5 — Approval input required: approval_context must be provided and
//       must contain a non-empty approval_granted_by string. A candidate without
//       required approval inputs must not become approved.
//   R8  Gate 6 — Target context required: when checkpoint.execution_relevance is
//       "Executable", target_context must be non-null with a non-null
//       deployment_type. Absence prevents approval.
//   R9  Gate 7 — Branch target required: when target_context.deployment_type is
//       "odoosh" and checkpoint.execution_relevance is "Executable",
//       target_context.odoosh_branch_target must be non-null.
//   R10 Gate 8 — Connection support required: when target_context is present and
//       target_context.connection_mode is non-null, connection_state must be
//       provided AND connection_state.availableFeatures.execute must be
//       explicitly true. Missing connection support prevents approval.
//   R11 execution_occurred is ALWAYS false. An approval record does not imply
//       execution occurred. This field is hardcoded; it is never an input and
//       cannot be overridden by caller.
//   R12 Every approval record carries full traceability: approval_id,
//       candidate_id, checkpoint_id, preview_id, safety_class,
//       approval_source_inputs, approval_decision_path, approved_at.
//   R13 approval_decision_path records the exact gates that were satisfied,
//       in evaluation order. This is a pipe-separated string of gate tokens.
//       It traces WHY approval was granted, not why it was refused.
//   R14 No execution performed. No status mutation. No blocker re-derivation.
//       No validation recomputation. No readiness recomputation. No remediation.
//       No model name inference. No scope widening.
//   R15 Output is deterministic: same inputs always produce the same approvals.
//       approved_at is a single timestamp shared by all records in one run.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `governed-execution-approval-engine: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const EXECUTION_APPROVAL_ENGINE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constant enumerations
// ---------------------------------------------------------------------------

// Execution relevance values that require a truthful target_context for approval.
export const APPROVAL_TARGET_CONTEXT_REQUIRED_RELEVANCE = Object.freeze(["Executable"]);

// Deployment types that require an explicit odoosh_branch_target.
export const APPROVAL_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES = Object.freeze(["odoosh"]);

// Gate tokens written into approval_decision_path (R13).
export const APPROVAL_GATE_TOKEN = Object.freeze({
  CANDIDATE_VALID:         "candidate_valid",
  CHECKPOINT_RESOLVED:     "checkpoint_resolved",
  PREVIEW_RESOLVED:        "preview_resolved",
  NOT_BLOCKED:             "not_blocked",
  APPROVAL_INPUT_PRESENT:  "approval_input_present",
  TARGET_CONTEXT_VALID:    "target_context_valid",
  BRANCH_TARGET_PRESENT:   "branch_target_present",
  CONNECTION_SUPPORTED:    "connection_supported",
  CONNECTION_NOT_REQUIRED: "connection_not_required",
});

// ---------------------------------------------------------------------------
// Output factories
// ---------------------------------------------------------------------------

/**
 * Creates a single execution_approval record.
 * execution_occurred is hardcoded false per R11 — never accept as input.
 *
 * @param {object} params
 * @param {string}        params.approval_id
 * @param {string}        params.candidate_id
 * @param {string}        params.checkpoint_id
 * @param {string}        params.preview_id
 * @param {string|null}   params.safety_class
 * @param {object}        params.approval_source_inputs
 * @param {string}        params.approval_decision_path
 * @param {string}        params.approved_at
 * @returns {object}  execution_approval record
 */
export function createExecutionApprovalRecord({
  approval_id = null,
  candidate_id = null,
  checkpoint_id = null,
  preview_id = null,
  safety_class = null,
  approval_source_inputs = null,
  approval_decision_path = null,
  approved_at = null,
} = {}) {
  return {
    approval_id: typeof approval_id === "string" && approval_id.trim() !== ""
      ? approval_id
      : crypto.randomUUID(),
    candidate_id: candidate_id ?? null,
    checkpoint_id: checkpoint_id ?? null,
    preview_id: preview_id ?? null,
    safety_class: safety_class ?? null,
    approval_source_inputs: approval_source_inputs ?? null,
    approval_decision_path: approval_decision_path ?? null,
    execution_occurred: false, // R11: hardcoded, never true
    approved_at: approved_at ?? null,
  };
}

/**
 * Creates the container returned by computeExecutionApprovals().
 *
 * @param {object} params
 * @param {object[]}  params.execution_approvals
 * @param {string}    params.engine_version
 * @param {string}    params.generated_at
 * @returns {{ execution_approvals: object[], engine_version: string, generated_at: string }}
 */
export function createExecutionApprovalOutput({
  execution_approvals = [],
  engine_version = EXECUTION_APPROVAL_ENGINE_VERSION,
  generated_at = null,
} = {}) {
  return {
    execution_approvals: Array.isArray(execution_approvals) ? execution_approvals : [],
    engine_version: engine_version ?? EXECUTION_APPROVAL_ENGINE_VERSION,
    generated_at: generated_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds a Set of checkpoint_ids that have at least one active blocker record.
 *
 * @param {object|null} blockers — blockers container (§1.9)
 * @returns {Set<string>}
 */
function buildBlockerIndex(blockers) {
  const index = new Set();
  if (!blockers || !Array.isArray(blockers.active_blockers)) {
    return index;
  }
  for (const blocker of blockers.active_blockers) {
    if (blocker && typeof blocker.source_checkpoint_id === "string") {
      index.add(blocker.source_checkpoint_id);
    }
  }
  return index;
}

/**
 * Builds a Map of checkpoint_id → checkpoint record from a checkpoints array.
 *
 * @param {object[]|null} checkpoints
 * @returns {Map<string, object>}
 */
function buildCheckpointIndex(checkpoints) {
  const index = new Map();
  if (!Array.isArray(checkpoints)) return index;
  for (const cp of checkpoints) {
    if (cp && typeof cp.checkpoint_id === "string" && cp.checkpoint_id.trim() !== "") {
      index.set(cp.checkpoint_id, cp);
    }
  }
  return index;
}

/**
 * Builds a Map of preview_id → preview record from previews container or array.
 * Keyed by preview_id (not checkpoint_id) to resolve from candidate.preview_id.
 *
 * @param {object|object[]|null} previews
 * @returns {Map<string, object>}
 */
function buildPreviewIndex(previews) {
  const index = new Map();
  let records;

  if (Array.isArray(previews)) {
    records = previews;
  } else if (previews && Array.isArray(previews.previews)) {
    records = previews.previews;
  } else {
    return index;
  }

  for (const preview of records) {
    if (
      preview &&
      typeof preview.preview_id === "string" &&
      preview.preview_id.trim() !== ""
    ) {
      index.set(preview.preview_id, preview);
    }
  }
  return index;
}

/**
 * Returns true when connection support is required for this target context.
 * Required when target_context is non-null and connection_mode is non-null (R10).
 *
 * @param {object|null} target_context
 * @returns {boolean}
 */
function connectionSupportRequired(target_context) {
  return (
    target_context !== null &&
    typeof target_context === "object" &&
    target_context.connection_mode != null
  );
}

// ---------------------------------------------------------------------------
// Main export: computeExecutionApprovals
// ---------------------------------------------------------------------------

/**
 * Determines execution approval for governed execution candidates.
 *
 * Approval gates (all must pass for an approval record to be emitted):
 *   Gate 1  Candidate valid — non-empty candidate_id present in input record
 *   Gate 2  Checkpoint resolved — candidate.checkpoint_id resolves in checkpoints
 *   Gate 3  Preview resolved — candidate.preview_id resolves in previews
 *   Gate 4  Not blocked — no active blocker for checkpoint_id
 *   Gate 5  Approval input present — approval_context.approval_granted_by non-empty
 *   Gate 6  Target context valid (Executable only) — non-null target_context with
 *           non-null deployment_type
 *   Gate 7  Branch target present (odoosh only) — odoosh_branch_target non-null
 *   Gate 8  Connection support — when connection_mode non-null in target_context,
 *           connection_state.availableFeatures.execute must be explicitly true
 *
 * @param {object[]}             execution_candidates — eligibility engine output candidates
 * @param {object[]}             checkpoints          — persisted checkpoint records
 * @param {object|null}          blockers             — blocker engine output (§1.9)
 * @param {object|object[]|null} previews             — preview engine output or array
 * @param {object|null}          project_state        — persisted project state
 * @param {object|null}          [target_context]     — target_context (§1.3); optional
 * @param {object|null}          [connection_state]   — connection state; gating when connection_mode set
 * @param {object|null}          [approval_context]   — approval context inputs; must include approval_granted_by
 * @returns {{ execution_approvals: object[], engine_version: string, generated_at: string }}
 */
export function computeExecutionApprovals(
  execution_candidates,
  checkpoints,
  blockers,
  previews,
  project_state,
  target_context = null,
  connection_state = null,
  approval_context = null
) {
  if (!Array.isArray(execution_candidates)) {
    throw new Error(
      "computeExecutionApprovals: execution_candidates must be an array."
    );
  }
  if (!Array.isArray(checkpoints)) {
    throw new Error(
      "computeExecutionApprovals: checkpoints must be an array."
    );
  }

  // Single timestamp shared by all records in this run (R15 determinism).
  const approvedAt = new Date().toISOString();

  // Build indexes once for O(1) gate lookups.
  const blockerIndex = buildBlockerIndex(blockers);
  const checkpointIndex = buildCheckpointIndex(checkpoints);
  const previewIndex = buildPreviewIndex(previews);

  // Pre-resolve connection support facts (R10).
  const connRequired = connectionSupportRequired(target_context);
  const connExecuteAvailable =
    connection_state &&
    typeof connection_state === "object" &&
    connection_state.availableFeatures &&
    connection_state.availableFeatures.execute === true;

  // Pre-resolve approval input (R7).
  const approvalGrantedBy =
    approval_context &&
    typeof approval_context === "object" &&
    typeof approval_context.approval_granted_by === "string" &&
    approval_context.approval_granted_by.trim() !== ""
      ? approval_context.approval_granted_by.trim()
      : null;

  const execution_approvals = [];

  for (const candidate of execution_candidates) {
    // Gate 1 — Candidate valid (R3).
    if (
      !candidate ||
      typeof candidate !== "object" ||
      typeof candidate.candidate_id !== "string" ||
      candidate.candidate_id.trim() === ""
    ) {
      continue;
    }

    const candidateId = candidate.candidate_id;
    const checkpointId = candidate.checkpoint_id ?? null;
    const previewId = candidate.preview_id ?? null;

    // Gate 2 — Checkpoint resolved (R4).
    const checkpoint = checkpointId ? checkpointIndex.get(checkpointId) : undefined;
    if (!checkpoint) {
      continue;
    }

    // Gate 3 — Preview resolved (R5).
    const preview = previewId ? previewIndex.get(previewId) : undefined;
    if (!preview) {
      continue;
    }

    // Gate 4 — Blocked refusal (R6).
    if (checkpointId && blockerIndex.has(checkpointId)) {
      continue;
    }

    // Gate 5 — Approval input required (R7).
    if (!approvalGrantedBy) {
      continue;
    }

    // Gate 6 — Target context required for Executable (R8).
    const requiresTargetContext = APPROVAL_TARGET_CONTEXT_REQUIRED_RELEVANCE.includes(
      checkpoint.execution_relevance
    );
    if (requiresTargetContext) {
      if (
        !target_context ||
        typeof target_context !== "object" ||
        !target_context.deployment_type
      ) {
        continue;
      }
    }

    const deploymentType = target_context ? (target_context.deployment_type ?? null) : null;

    // Gate 7 — Branch target required for odoosh (R9).
    if (
      requiresTargetContext &&
      deploymentType &&
      APPROVAL_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES.includes(deploymentType) &&
      !target_context.odoosh_branch_target
    ) {
      continue;
    }

    // Gate 8 — Connection support required when connection_mode set (R10).
    if (connRequired && !connExecuteAvailable) {
      continue;
    }

    // All gates passed — build approval_decision_path (R13).
    const gatePath = [
      APPROVAL_GATE_TOKEN.CANDIDATE_VALID,
      APPROVAL_GATE_TOKEN.CHECKPOINT_RESOLVED,
      APPROVAL_GATE_TOKEN.PREVIEW_RESOLVED,
      APPROVAL_GATE_TOKEN.NOT_BLOCKED,
      APPROVAL_GATE_TOKEN.APPROVAL_INPUT_PRESENT,
    ];

    if (requiresTargetContext) {
      gatePath.push(APPROVAL_GATE_TOKEN.TARGET_CONTEXT_VALID);
    }

    if (
      requiresTargetContext &&
      deploymentType &&
      APPROVAL_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES.includes(deploymentType)
    ) {
      gatePath.push(APPROVAL_GATE_TOKEN.BRANCH_TARGET_PRESENT);
    }

    gatePath.push(
      connRequired
        ? APPROVAL_GATE_TOKEN.CONNECTION_SUPPORTED
        : APPROVAL_GATE_TOKEN.CONNECTION_NOT_REQUIRED
    );

    // Build approval_source_inputs (R12): record exactly what was used for approval.
    const approvalSourceInputs = {
      approval_granted_by: approvalGrantedBy,
      approval_granted_at: approvedAt,
      candidate_id: candidateId,
      checkpoint_id: checkpointId,
      preview_id: previewId,
      safety_class: candidate.safety_class ?? checkpoint.safety_class ?? null,
      deployment_target: deploymentType,
      branch_context: target_context ? (target_context.odoosh_branch_target ?? null) : null,
      connection_support_status: connRequired
        ? (connection_state && typeof connection_state.status === "string"
            ? connection_state.status
            : null)
        : null,
    };

    const record = createExecutionApprovalRecord({
      candidate_id:           candidateId,
      checkpoint_id:          checkpointId,
      preview_id:             previewId,
      safety_class:           candidate.safety_class ?? checkpoint.safety_class ?? null,
      approval_source_inputs: approvalSourceInputs,
      approval_decision_path: gatePath.join("|"),
      approved_at:            approvedAt,
    });

    execution_approvals.push(record);
  }

  return createExecutionApprovalOutput({
    execution_approvals,
    engine_version: EXECUTION_APPROVAL_ENGINE_VERSION,
    generated_at: approvedAt,
  });
}
