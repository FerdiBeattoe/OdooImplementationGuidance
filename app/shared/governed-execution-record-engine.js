// ---------------------------------------------------------------------------
// Governed Execution Record Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Execution-state recording layer. Produces execution records ONLY when
//   explicit execution result inputs are present alongside a valid approval.
//   THIS IS NOT EXECUTION. No state is mutated. No execution is performed.
//   An execution record does not imply future or ongoing execution.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1.5 (checkpoints: safety_class,
//     execution_relevance, preview_required)
//   - governed-execution-approval-engine.js (execution_approval shape;
//     approval_id, candidate_id, checkpoint_id, preview_id mandatory)
//   - governed-execution-eligibility-engine.js (execution_candidate shape;
//     candidate_id, checkpoint_id, preview_id mandatory)
//   - governed-preview-engine.js (preview record shape; preview_id mandatory)
//
// Hard rules:
//   R1  Inputs: execution_approvals, execution_candidates, previews,
//       checkpoints, project_state, target_context (optional),
//       connection_state (optional), execution_result (optional).
//       Output: executions container. No other state mutation.
//   R2  An execution record is generated ONLY when ALL of the following are
//       present: a valid approval record, a valid candidate record, a valid
//       preview record, a resolvable checkpoint, AND explicit execution_result
//       input. Missing any one produces no record.
//   R3  Gate 1 — Approval required: approval must be a valid execution_approval
//       record with a non-empty approval_id. No approval means no record.
//   R4  Gate 2 — Candidate linkage: approval.candidate_id must resolve to a
//       valid execution_candidate record in execution_candidates. Unresolvable
//       candidate produces no record.
//   R5  Gate 3 — Preview linkage: approval.preview_id must resolve to a valid
//       preview record in previews. Unresolvable preview produces no record.
//   R6  Gate 4 — Checkpoint linkage: approval.checkpoint_id must resolve to a
//       checkpoint record in checkpoints. Unresolvable checkpoint produces no record.
//   R7  Gate 5 — Execution result required: execution_result must be provided
//       and must contain a non-empty result_status string. Absent or empty
//       execution result input produces no record.
//   R8  execution_record_type is ALWAYS "recorded". This field is hardcoded;
//       it is never an input and cannot be overridden by caller.
//   R9  Every execution record carries full traceability: execution_id,
//       approval_id, candidate_id, preview_id, checkpoint_id, safety_class,
//       execution_source_inputs, execution_decision_path, recorded_at.
//   R10 execution_decision_path records the exact gates that were satisfied,
//       in evaluation order. This is a pipe-separated string of gate tokens.
//       It traces WHY the record was created, not why it was refused.
//   R11 No execution performed. No status mutation. No approval recomputation.
//       No eligibility recomputation. No blocker re-derivation. No readiness
//       recomputation. No remediation. No scope widening.
//   R12 Output is deterministic: same inputs always produce the same records.
//       recorded_at is a single timestamp shared by all records in one run.
//   R13 result_status is taken verbatim from execution_result.result_status.
//       No success or failure is invented. No outcome is inferred.
//   R14 target_context is recorded as provided; no scope widening occurs.
//       When absent, target fields in execution record are null.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `governed-execution-record-engine: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const EXECUTION_RECORD_ENGINE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constant enumerations
// ---------------------------------------------------------------------------

// Gate tokens written into execution_decision_path (R10).
export const EXECUTION_RECORD_GATE_TOKEN = Object.freeze({
  APPROVAL_PRESENT:     "approval_present",
  CANDIDATE_LINKED:     "candidate_linked",
  PREVIEW_LINKED:       "preview_linked",
  CHECKPOINT_LINKED:    "checkpoint_linked",
  EXECUTION_RESULT_PRESENT: "execution_result_present",
});

// ---------------------------------------------------------------------------
// Output factories
// ---------------------------------------------------------------------------

/**
 * Creates a single execution record.
 * execution_record_type is hardcoded "recorded" per R8 — never accept as input.
 *
 * @param {object} params
 * @param {string}        params.execution_id
 * @param {string}        params.approval_id
 * @param {string}        params.candidate_id
 * @param {string}        params.preview_id
 * @param {string}        params.checkpoint_id
 * @param {string|null}   params.safety_class
 * @param {string|null}   params.result_status
 * @param {object}        params.execution_source_inputs
 * @param {string}        params.execution_decision_path
 * @param {string}        params.recorded_at
 * @param {string|null}   params.deployment_target
 * @param {string|null}   params.branch_context
 * @returns {object}  execution record
 */
export function createExecutionRecord({
  execution_id = null,
  approval_id = null,
  candidate_id = null,
  preview_id = null,
  checkpoint_id = null,
  safety_class = null,
  result_status = null,
  execution_source_inputs = null,
  execution_decision_path = null,
  recorded_at = null,
  deployment_target = null,
  branch_context = null,
} = {}) {
  return {
    execution_id: typeof execution_id === "string" && execution_id.trim() !== ""
      ? execution_id
      : crypto.randomUUID(),
    approval_id: approval_id ?? null,
    candidate_id: candidate_id ?? null,
    preview_id: preview_id ?? null,
    checkpoint_id: checkpoint_id ?? null,
    safety_class: safety_class ?? null,
    result_status: result_status ?? null,
    execution_source_inputs: execution_source_inputs ?? null,
    execution_decision_path: execution_decision_path ?? null,
    execution_record_type: "recorded", // R8: hardcoded, never an input
    recorded_at: recorded_at ?? null,
    deployment_target: deployment_target ?? null,
    branch_context: branch_context ?? null,
  };
}

/**
 * Creates the container returned by computeExecutionRecords().
 *
 * @param {object} params
 * @param {object[]}  params.executions
 * @param {string}    params.engine_version
 * @param {string}    params.generated_at
 * @returns {{ executions: object[], engine_version: string, generated_at: string }}
 */
export function createExecutionRecordOutput({
  executions = [],
  engine_version = EXECUTION_RECORD_ENGINE_VERSION,
  generated_at = null,
} = {}) {
  return {
    executions: Array.isArray(executions) ? executions : [],
    engine_version: engine_version ?? EXECUTION_RECORD_ENGINE_VERSION,
    generated_at: generated_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds a Map of candidate_id → candidate record from execution_candidates array.
 *
 * @param {object[]|null} execution_candidates
 * @returns {Map<string, object>}
 */
function buildCandidateIndex(execution_candidates) {
  const index = new Map();
  if (!Array.isArray(execution_candidates)) return index;
  for (const c of execution_candidates) {
    if (c && typeof c.candidate_id === "string" && c.candidate_id.trim() !== "") {
      index.set(c.candidate_id, c);
    }
  }
  return index;
}

/**
 * Builds a Map of preview_id → preview record from previews container or array.
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

// ---------------------------------------------------------------------------
// Main export: computeExecutionRecords
// ---------------------------------------------------------------------------

/**
 * Produces execution records for approved candidates with explicit execution results.
 *
 * Recording gates (all must pass for an execution record to be emitted):
 *   Gate 1  Approval present — non-empty approval_id present in approval record
 *   Gate 2  Candidate linked — approval.candidate_id resolves in execution_candidates
 *   Gate 3  Preview linked — approval.preview_id resolves in previews
 *   Gate 4  Checkpoint linked — approval.checkpoint_id resolves in checkpoints
 *   Gate 5  Execution result present — execution_result.result_status non-empty string
 *
 * @param {object[]}             execution_approvals   — approval engine output records
 * @param {object[]}             execution_candidates  — eligibility engine output candidates
 * @param {object|object[]|null} previews              — preview engine output or array
 * @param {object[]}             checkpoints           — persisted checkpoint records
 * @param {object|null}          project_state         — persisted project state
 * @param {object|null}          [target_context]      — target_context (§1.3); optional
 * @param {object|null}          [connection_state]    — connection state; optional
 * @param {object|null}          [execution_result]    — explicit execution result inputs; must include result_status
 * @returns {{ executions: object[], engine_version: string, generated_at: string }}
 */
export function computeExecutionRecords(
  execution_approvals,
  execution_candidates,
  previews,
  checkpoints,
  project_state,
  target_context = null,
  connection_state = null,
  execution_result = null
) {
  if (!Array.isArray(execution_approvals)) {
    throw new Error(
      "computeExecutionRecords: execution_approvals must be an array."
    );
  }
  if (!Array.isArray(execution_candidates)) {
    throw new Error(
      "computeExecutionRecords: execution_candidates must be an array."
    );
  }
  if (!Array.isArray(checkpoints)) {
    throw new Error(
      "computeExecutionRecords: checkpoints must be an array."
    );
  }

  // Single timestamp shared by all records in this run (R12 determinism).
  const recordedAt = new Date().toISOString();

  // Build indexes once for O(1) gate lookups.
  const candidateIndex = buildCandidateIndex(execution_candidates);
  const previewIndex = buildPreviewIndex(previews);
  const checkpointIndex = buildCheckpointIndex(checkpoints);

  // Pre-resolve execution result input (R7).
  const resultStatus =
    execution_result &&
    typeof execution_result === "object" &&
    typeof execution_result.result_status === "string" &&
    execution_result.result_status.trim() !== ""
      ? execution_result.result_status.trim()
      : null;

  // Pre-resolve target context fields (R14).
  const deploymentTarget = target_context ? (target_context.deployment_type ?? null) : null;
  const branchContext = target_context ? (target_context.odoosh_branch_target ?? null) : null;

  const executions = [];

  for (const approval of execution_approvals) {
    // Gate 1 — Approval present (R3).
    if (
      !approval ||
      typeof approval !== "object" ||
      typeof approval.approval_id !== "string" ||
      approval.approval_id.trim() === ""
    ) {
      continue;
    }

    const approvalId = approval.approval_id;
    const candidateId = approval.candidate_id ?? null;
    const previewId = approval.preview_id ?? null;
    const checkpointId = approval.checkpoint_id ?? null;

    // Gate 2 — Candidate linked (R4).
    const candidate = candidateId ? candidateIndex.get(candidateId) : undefined;
    if (!candidate) {
      continue;
    }

    // Gate 3 — Preview linked (R5).
    const preview = previewId ? previewIndex.get(previewId) : undefined;
    if (!preview) {
      continue;
    }

    // Gate 4 — Checkpoint linked (R6).
    const checkpoint = checkpointId ? checkpointIndex.get(checkpointId) : undefined;
    if (!checkpoint) {
      continue;
    }

    // Gate 5 — Execution result required (R7).
    if (!resultStatus) {
      continue;
    }

    // All gates passed — build execution_decision_path (R10).
    const gatePath = [
      EXECUTION_RECORD_GATE_TOKEN.APPROVAL_PRESENT,
      EXECUTION_RECORD_GATE_TOKEN.CANDIDATE_LINKED,
      EXECUTION_RECORD_GATE_TOKEN.PREVIEW_LINKED,
      EXECUTION_RECORD_GATE_TOKEN.CHECKPOINT_LINKED,
      EXECUTION_RECORD_GATE_TOKEN.EXECUTION_RESULT_PRESENT,
    ];

    // Build execution_source_inputs (R9): record exactly what was used.
    const executionSourceInputs = {
      approval_id: approvalId,
      candidate_id: candidateId,
      preview_id: previewId,
      checkpoint_id: checkpointId,
      safety_class: approval.safety_class ?? candidate.safety_class ?? checkpoint.safety_class ?? null,
      result_status: resultStatus,
      deployment_target: deploymentTarget,
      branch_context: branchContext,
      connection_status: connection_state && typeof connection_state.status === "string"
        ? connection_state.status
        : null,
    };

    const record = createExecutionRecord({
      approval_id:              approvalId,
      candidate_id:             candidateId,
      preview_id:               previewId,
      checkpoint_id:            checkpointId,
      safety_class:             approval.safety_class ?? candidate.safety_class ?? checkpoint.safety_class ?? null,
      result_status:            resultStatus,
      execution_source_inputs:  executionSourceInputs,
      execution_decision_path:  gatePath.join("|"),
      recorded_at:              recordedAt,
      deployment_target:        deploymentTarget,
      branch_context:           branchContext,
    });

    executions.push(record);
  }

  return createExecutionRecordOutput({
    executions,
    engine_version: EXECUTION_RECORD_ENGINE_VERSION,
    generated_at: recordedAt,
  });
}
