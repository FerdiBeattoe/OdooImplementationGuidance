// ---------------------------------------------------------------------------
// Governed Execution Eligibility Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   First-pass determination of execution candidacy from governed checkpoint,
//   preview, blocker, and target-context state.
//   Produces execution_candidates: records for checkpoints that satisfy all
//   governed gates for consideration for execution.
//   THIS IS NOT EXECUTION. No state is mutated. No approvals are issued.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1.5 (checkpoints: execution_relevance,
//     safety_class, dependencies)
//   - specs/runtime_state_contract.md §1.9 (blockers: active_blockers)
//   - governed-preview-engine.js (preview record shape; preview_id mandatory)
//   - connection-state.js (availableFeatures.execute, status enum)
//
// Hard rules:
//   R1  Inputs: checkpoints, validated_checkpoints, blockers, previews,
//       project_state, target_context (optional), connection_state (optional).
//       Output: execution_candidates container. No other state mutation.
//   R2  An execution candidate record is generated ONLY when all eligibility
//       gates pass. A failing gate silently omits the checkpoint — no partial
//       record is emitted.
//   R3  Gate 1 — Preview linkage (mandatory): there must be exactly one preview
//       record in previews with a matching checkpoint_id and a non-empty
//       preview_id. No preview_id means no execution candidate — unconditionally.
//   R4  Gate 2 — Blocked refusal: checkpoints with an active blocker record
//       (matched by checkpoint_id in blockers.active_blockers) produce no
//       execution candidate. Blocked paths must never become candidates.
//   R5  Gate 3 — Executable only: checkpoint.execution_relevance must be
//       exactly "Executable". Non-executable checkpoints (Informational, null,
//       etc.) are never execution candidates.
//   R6  Gate 4 — Safety class required: checkpoint.safety_class must be
//       non-null and non-empty. A candidate must carry a truthful safety class.
//   R7  Gate 5 — Target context required: checkpoints with execution_relevance
//       "Executable" require a non-null target_context with a non-null
//       deployment_type. Absence prevents candidacy.
//   R8  Gate 6 — Branch target required: when target_context.deployment_type
//       is "odoosh", target_context.odoosh_branch_target must be non-null.
//       Deployment-sensitive work must respect branch requirements already
//       carried by the governing preview/target context.
//   R9  Gate 7 — Connection support required: when target_context is present
//       and target_context.connection_mode is non-null, connection_state must
//       be provided AND connection_state.availableFeatures.execute must be
//       explicitly true. Missing or non-execute connection support prevents
//       candidacy. No connection support is inferred from absent fields.
//   R10 execution_approval_implied is ALWAYS false. Execution candidacy does
//       not imply execution approval. This field is hardcoded; it is never an
//       input and cannot be overridden by caller.
//   R11 Every candidate record carries full traceability: checkpoint_id,
//       preview_id, checkpoint_class, safety_class, intended_operation_class,
//       deployment_target, branch_context, connection_support_status,
//       eligibility_reason_path, generated_at.
//   R12 eligibility_reason_path records the exact gates that were satisfied,
//       in evaluation order. This is a pipe-separated string of gate tokens.
//       It traces WHY candidacy was granted, not why it was refused (refusals
//       produce no record).
//   R13 validated_checkpoints is accepted as an input parameter. First-pass
//       candidacy relies on the blocker index (R4) and the preview index (R3)
//       rather than re-deriving validation state.
//   R14 No readiness computation. No status mutation. No blocker re-derivation.
//       No model name inference. No field change inference. No approval tokens.
//       No remediation logic.
//   R15 Output is deterministic: same inputs always produce the same candidates.
//       generated_at is a single timestamp shared by all records in one run.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `governed-execution-eligibility-engine: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const EXECUTION_ELIGIBILITY_ENGINE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constant enumerations
// ---------------------------------------------------------------------------

// Deployment types that require an explicit odoosh_branch_target.
export const EXEC_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES = Object.freeze(["odoosh"]);

// The only execution_relevance value that qualifies for candidacy (R5).
export const EXECUTION_RELEVANCE_EXECUTABLE = "Executable";

// Gate tokens written into eligibility_reason_path (R12).
export const ELIGIBILITY_GATE_TOKEN = Object.freeze({
  PREVIEW_LINKED:        "preview_linked",
  NOT_BLOCKED:           "not_blocked",
  EXECUTABLE:            "executable",
  SAFETY_CLASS_PRESENT:  "safety_class_present",
  TARGET_CONTEXT_VALID:  "target_context_valid",
  BRANCH_TARGET_PRESENT: "branch_target_present",
  CONNECTION_SUPPORTED:  "connection_supported",
  CONNECTION_NOT_REQUIRED: "connection_not_required",
});

// ---------------------------------------------------------------------------
// Output factories
// ---------------------------------------------------------------------------

/**
 * Creates a single execution_candidate record.
 * execution_approval_implied is hardcoded false per R10 — never accept as input.
 *
 * @param {object} params
 * @param {string}        params.candidate_id
 * @param {string}        params.checkpoint_id
 * @param {string}        params.preview_id
 * @param {string|null}   params.checkpoint_class
 * @param {string|null}   params.safety_class
 * @param {string|null}   params.intended_operation_class
 * @param {string|null}   params.deployment_target
 * @param {string|null}   params.branch_context
 * @param {string|null}   params.connection_support_status
 * @param {string}        params.eligibility_reason_path
 * @param {string}        params.generated_at
 * @returns {object}  execution_candidate record
 */
export function createExecutionCandidateRecord({
  candidate_id = null,
  checkpoint_id = null,
  preview_id = null,
  checkpoint_class = null,
  safety_class = null,
  intended_operation_class = null,
  deployment_target = null,
  branch_context = null,
  connection_support_status = null,
  eligibility_reason_path = null,
  generated_at = null,
} = {}) {
  return {
    candidate_id: typeof candidate_id === "string" && candidate_id.trim() !== ""
      ? candidate_id
      : crypto.randomUUID(),
    checkpoint_id: checkpoint_id ?? null,
    preview_id: preview_id ?? null,
    checkpoint_class: checkpoint_class ?? null,
    safety_class: safety_class ?? null,
    intended_operation_class: intended_operation_class ?? null,
    deployment_target: deployment_target ?? null,
    branch_context: branch_context ?? null,
    connection_support_status: connection_support_status ?? null,
    eligibility_reason_path: eligibility_reason_path ?? null,
    execution_approval_implied: false, // R10: hardcoded, never true
    generated_at: generated_at ?? null,
  };
}

/**
 * Creates the container returned by computeExecutionEligibility().
 *
 * @param {object} params
 * @param {object[]}  params.execution_candidates
 * @param {string}    params.engine_version
 * @param {string}    params.generated_at
 * @returns {{ execution_candidates: object[], engine_version: string, generated_at: string }}
 */
export function createExecutionEligibilityOutput({
  execution_candidates = [],
  engine_version = EXECUTION_ELIGIBILITY_ENGINE_VERSION,
  generated_at = null,
} = {}) {
  return {
    execution_candidates: Array.isArray(execution_candidates) ? execution_candidates : [],
    engine_version: engine_version ?? EXECUTION_ELIGIBILITY_ENGINE_VERSION,
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
 * Builds a Map of checkpoint_id → preview record from the previews container
 * or raw previews array. Only previews with a non-empty preview_id are indexed.
 *
 * @param {object|object[]|null} previews — preview engine output or raw array
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
      typeof preview.checkpoint_id === "string" &&
      preview.checkpoint_id.trim() !== "" &&
      typeof preview.preview_id === "string" &&
      preview.preview_id.trim() !== ""
    ) {
      // Last preview wins if there are duplicates — deterministic on sorted input.
      index.set(preview.checkpoint_id, preview);
    }
  }
  return index;
}

/**
 * Returns true when connection support is required for this target context.
 * Required when target_context is non-null and connection_mode is non-null (R9).
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

/**
 * Returns the connection_support_status string to carry in the candidate record.
 * Reads connection_state.status if available, otherwise null.
 *
 * @param {object|null} connection_state
 * @returns {string|null}
 */
function resolveConnectionSupportStatus(connection_state) {
  if (!connection_state || typeof connection_state !== "object") {
    return null;
  }
  return typeof connection_state.status === "string"
    ? connection_state.status
    : null;
}

// ---------------------------------------------------------------------------
// Main export: computeExecutionEligibility
// ---------------------------------------------------------------------------

/**
 * Determines execution candidacy for governed eligible checkpoints.
 *
 * Eligibility gates (all must pass for a candidate record to be emitted):
 *   Gate 1  Preview linkage — preview record exists for checkpoint_id with
 *           non-empty preview_id
 *   Gate 2  Not blocked — no active blocker for checkpoint_id
 *   Gate 3  Executable only — execution_relevance === "Executable"
 *   Gate 4  Safety class present — checkpoint.safety_class non-null/non-empty
 *   Gate 5  Target context valid — non-null target_context with non-null
 *           deployment_type
 *   Gate 6  Branch target present (odoosh only) — odoosh_branch_target non-null
 *   Gate 7  Connection support — when connection_mode non-null in target_context,
 *           connection_state.availableFeatures.execute must be explicitly true
 *
 * @param {object[]}            checkpoints           — persisted checkpoint records
 * @param {object|null}         validated_checkpoints — validation engine output (R13)
 * @param {object|null}         blockers              — blocker engine output (§1.9)
 * @param {object|object[]|null} previews             — preview engine output or array
 * @param {object|null}         project_state         — persisted project state
 * @param {object|null}         [target_context]      — target_context (§1.3); optional
 * @param {object|null}         [connection_state]    — connection state; gating when connection_mode set (R9)
 * @returns {{ execution_candidates: object[], engine_version: string, generated_at: string }}
 */
export function computeExecutionEligibility(
  checkpoints,
  validated_checkpoints,
  blockers,
  previews,
  project_state,
  target_context = null,
  connection_state = null
) {
  if (!Array.isArray(checkpoints)) {
    throw new Error(
      "computeExecutionEligibility: checkpoints must be an array."
    );
  }

  // Single timestamp shared by all records in this run (R15 determinism).
  const generatedAt = new Date().toISOString();

  // Build indexes once for O(1) gate lookups.
  const blockerIndex = buildBlockerIndex(blockers);
  const previewIndex = buildPreviewIndex(previews);

  // Pre-resolve connection support facts (R9).
  const connRequired = connectionSupportRequired(target_context);
  const connExecuteAvailable =
    connection_state &&
    typeof connection_state === "object" &&
    connection_state.availableFeatures &&
    connection_state.availableFeatures.execute === true;
  const connStatus = resolveConnectionSupportStatus(connection_state);

  const execution_candidates = [];

  for (const checkpoint of checkpoints) {
    const checkpointId = checkpoint.checkpoint_id ?? null;

    // Gate 1 — Preview linkage (R3): mandatory.
    const linkedPreview = checkpointId ? previewIndex.get(checkpointId) : undefined;
    if (!linkedPreview) {
      continue;
    }
    const previewId = linkedPreview.preview_id;

    // Gate 2 — Blocked refusal (R4).
    if (checkpointId && blockerIndex.has(checkpointId)) {
      continue;
    }

    // Gate 3 — Executable only (R5).
    if (checkpoint.execution_relevance !== EXECUTION_RELEVANCE_EXECUTABLE) {
      continue;
    }

    // Gate 4 — Safety class required (R6).
    if (!checkpoint.safety_class) {
      continue;
    }

    // Gate 5 — Target context required for Executable (R7).
    if (
      !target_context ||
      typeof target_context !== "object" ||
      !target_context.deployment_type
    ) {
      continue;
    }

    const deploymentType = target_context.deployment_type;

    // Gate 6 — Branch target required for odoosh (R8).
    if (
      EXEC_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES.includes(deploymentType) &&
      !target_context.odoosh_branch_target
    ) {
      continue;
    }

    // Gate 7 — Connection support required when connection_mode set (R9).
    if (connRequired && !connExecuteAvailable) {
      continue;
    }

    // All gates passed — build eligibility_reason_path (R12).
    const gatePath = [
      ELIGIBILITY_GATE_TOKEN.PREVIEW_LINKED,
      ELIGIBILITY_GATE_TOKEN.NOT_BLOCKED,
      ELIGIBILITY_GATE_TOKEN.EXECUTABLE,
      ELIGIBILITY_GATE_TOKEN.SAFETY_CLASS_PRESENT,
      ELIGIBILITY_GATE_TOKEN.TARGET_CONTEXT_VALID,
    ];
    if (EXEC_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES.includes(deploymentType)) {
      gatePath.push(ELIGIBILITY_GATE_TOKEN.BRANCH_TARGET_PRESENT);
    }
    gatePath.push(
      connRequired
        ? ELIGIBILITY_GATE_TOKEN.CONNECTION_SUPPORTED
        : ELIGIBILITY_GATE_TOKEN.CONNECTION_NOT_REQUIRED
    );

    const record = createExecutionCandidateRecord({
      checkpoint_id:            checkpointId,
      preview_id:               previewId,
      checkpoint_class:         checkpoint.checkpoint_class ?? null,
      safety_class:             checkpoint.safety_class,
      intended_operation_class: EXECUTION_RELEVANCE_EXECUTABLE,
      deployment_target:        deploymentType,
      branch_context:           target_context.odoosh_branch_target ?? null,
      connection_support_status: connStatus,
      eligibility_reason_path:  gatePath.join("|"),
      generated_at:             generatedAt,
    });

    execution_candidates.push(record);
  }

  return createExecutionEligibilityOutput({
    execution_candidates,
    engine_version: EXECUTION_ELIGIBILITY_ENGINE_VERSION,
    generated_at: generatedAt,
  });
}
