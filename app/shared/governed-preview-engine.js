// ---------------------------------------------------------------------------
// Governed Preview Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   First-pass preview record generation from governed checkpoint state.
//   Produces preview records only for checkpoints that are explicitly
//   previewable under governed eligibility rules. This is NOT execution.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1.5 (checkpoints: preview_required,
//     safety_class, execution_relevance, downstream_impact_summary, dependencies)
//   - specs/runtime_state_contract.md §1.9 (blockers: active_blockers shape)
//   - specs/checkpoint_engine.md §2 (checkpoint_class, status, execution_relevance)
//
// Hard rules:
//   R1  Inputs: checkpoints, validated_checkpoints, blockers, project_state,
//       target_context (optional), connection_state (optional).
//       Output: previews container. No other state mutation.
//   R2  A preview record is generated ONLY when all eligibility gates pass.
//       A failing gate silently omits the checkpoint — no partial record is emitted.
//   R3  Gate 1 — Scope: checkpoint.preview_required must be explicitly true.
//       Checkpoints without preview_required=true are outside preview scope.
//   R4  Gate 2 — Blocked refusal: checkpoints with an active blocker record
//       (matched by checkpoint_id in blockers.active_blockers) produce no
//       preview record. Blocked paths must not produce executable-looking output.
//   R5  Gate 3 — Target-context required: checkpoints with execution_relevance
//       "Executable" require a non-null target_context with a non-null
//       deployment_type. Absence prevents a truthful preview record.
//   R6  Gate 4 — Branch/environment required: when target_context.deployment_type
//       is "odoosh" and checkpoint.execution_relevance is "Executable",
//       target_context.odoosh_branch_target must be non-null. Deployment-sensitive
//       previews require explicit branch context for truthfulness.
//   R7  Gate 5 — Safety class required: checkpoint.safety_class must be non-null.
//       A preview record must carry a truthful safety class; absent class prevents
//       record generation.
//   R8  execution_approval_implied is ALWAYS false. Preview generation does not
//       imply execution approval. This field is hardcoded; it is not an input.
//   R9  Every preview record carries full traceability: checkpoint_id,
//       checkpoint_class, safety_class, intended_operation_class,
//       deployment_target, branch_context, prerequisite_snapshot,
//       downstream_impact_summary.
//   R10 prerequisite_snapshot is a frozen copy of checkpoint.dependencies at
//       the time of preview generation. It does NOT evaluate those dependencies.
//   R11 connection_state is accepted as an input parameter but is NOT used to
//       widen preview scope, invent connection support, or alter eligibility.
//   R12 validated_checkpoints is accepted as an input parameter. First-pass
//       eligibility relies on the blocker index (R4) rather than re-deriving
//       validation state. This avoids dual-computation of the same gate.
//   R13 No readiness computation. No status mutation. No blocker re-derivation.
//       No model name inference. No field change inference.
//   R14 Output is deterministic: same inputs always produce the same previews.
//       generated_at is a single timestamp shared by all records in one run.
//   R15 Gate 6 — Operation definition required for Executable checkpoints.
//       operation_definitions is a caller-supplied plain object keyed by
//       checkpoint_id. Absence (null or missing key) blocks the checkpoint
//       by omission — no partial record is emitted. Non-Executable checkpoints
//       are unaffected. target_model, target_operation, intended_changes are
//       NEVER inferred — they come exclusively from the supplied definition.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `governed-preview-engine: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const GOVERNED_PREVIEW_ENGINE_VERSION = "1.1.0";

// ---------------------------------------------------------------------------
// Constant enumerations
// ---------------------------------------------------------------------------

// Deployment types that require an explicit branch target for executable previews.
export const BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES = Object.freeze(["odoosh"]);

// Execution relevance values that require target_context for a truthful preview.
export const TARGET_CONTEXT_REQUIRED_RELEVANCE = Object.freeze(["Executable"]);

// ---------------------------------------------------------------------------
// Output factories
// ---------------------------------------------------------------------------

/**
 * Creates a single preview record.
 * execution_approval_implied is hardcoded false per R8 — never accept as input.
 *
 * @param {object} params
 * @param {string}        params.preview_id
 * @param {string}        params.checkpoint_id
 * @param {string|null}   params.checkpoint_class
 * @param {string|null}   params.safety_class
 * @param {string|null}   params.intended_operation_class
 * @param {string|null}   params.deployment_target
 * @param {string|null}   params.branch_context
 * @param {string[]}      params.prerequisite_snapshot
 * @param {string|null}   params.downstream_impact_summary
 * @param {string}        params.generated_at
 * @param {string|null}   params.target_model       — from operation_definition; null for non-Executable
 * @param {string|null}   params.target_operation   — from operation_definition; null for non-Executable
 * @param {*|null}        params.intended_changes   — from operation_definition; null for non-Executable
 * @returns {object}  preview_record
 */
export function createPreviewRecord({
  preview_id = null,
  checkpoint_id = null,
  checkpoint_class = null,
  safety_class = null,
  intended_operation_class = null,
  deployment_target = null,
  branch_context = null,
  prerequisite_snapshot = [],
  downstream_impact_summary = null,
  generated_at = null,
  target_model = null,
  target_operation = null,
  intended_changes = null,
} = {}) {
  return {
    preview_id: typeof preview_id === "string" && preview_id.trim() !== ""
      ? preview_id
      : crypto.randomUUID(),
    checkpoint_id: checkpoint_id ?? null,
    checkpoint_class: checkpoint_class ?? null,
    safety_class: safety_class ?? null,
    intended_operation_class: intended_operation_class ?? null,
    deployment_target: deployment_target ?? null,
    branch_context: branch_context ?? null,
    prerequisite_snapshot: Array.isArray(prerequisite_snapshot)
      ? Object.freeze([...prerequisite_snapshot])
      : Object.freeze([]),
    downstream_impact_summary: downstream_impact_summary ?? null,
    execution_approval_implied: false, // R8: hardcoded, never true
    stale: false,
    linked_execution_id: null,
    generated_at: generated_at ?? null,
    // Operation-binding fields — populated from caller-supplied operation_definition.
    // null for non-Executable checkpoints; null when no definition was provided (blocked
    // by Gate 6 before this point, so this field should never be null for Executable records).
    target_model: target_model ?? null,
    target_operation: target_operation ?? null,
    intended_changes: intended_changes !== undefined ? intended_changes : null,
  };
}

/**
 * Creates the container returned by computePreviews().
 *
 * @param {object} params
 * @param {object[]}  params.previews
 * @param {string}    params.engine_version
 * @param {string}    params.generated_at
 * @returns {{ previews: object[], engine_version: string, generated_at: string }}
 */
export function createPreviewEngineOutput({
  previews = [],
  engine_version = GOVERNED_PREVIEW_ENGINE_VERSION,
  generated_at = null,
} = {}) {
  return {
    previews: Array.isArray(previews) ? previews : [],
    engine_version: engine_version ?? GOVERNED_PREVIEW_ENGINE_VERSION,
    generated_at: generated_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds a Set of checkpoint_ids that have at least one active blocker record.
 * Used for O(1) blocked-checkpoint lookup in the eligibility loop.
 *
 * @param {object|null} blockers  — blockers container (§1.9)
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
 * Builds a Map keyed by checkpoint_id from caller-supplied operation_definitions.
 * Used for O(1) Gate-6 definition lookups.
 * Returns an empty Map if operation_definitions is null, non-object, or an array.
 *
 * @param {object|null} operation_definitions — plain object keyed by checkpoint_id
 * @returns {Map<string, object>}
 */
function buildDefinitionIndex(operation_definitions) {
  const index = new Map();
  if (
    !operation_definitions ||
    typeof operation_definitions !== "object" ||
    Array.isArray(operation_definitions)
  ) {
    return index;
  }
  for (const [key, def] of Object.entries(operation_definitions)) {
    if (def && typeof def === "object") {
      index.set(key, def);
    }
  }
  return index;
}

/**
 * Returns true if the checkpoint's execution_relevance requires a non-null
 * target_context.deployment_type for a truthful preview (R5, Gate 3).
 *
 * @param {string|null} executionRelevance
 * @returns {boolean}
 */
function requiresTargetContext(executionRelevance) {
  return TARGET_CONTEXT_REQUIRED_RELEVANCE.includes(executionRelevance);
}

/**
 * Returns true if the combination of deployment_type and execution_relevance
 * requires an explicit odoosh_branch_target (R6, Gate 4).
 *
 * @param {string|null} deploymentType
 * @param {string|null} executionRelevance
 * @returns {boolean}
 */
function requiresBranchTarget(deploymentType, executionRelevance) {
  return (
    BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES.includes(deploymentType) &&
    TARGET_CONTEXT_REQUIRED_RELEVANCE.includes(executionRelevance)
  );
}

// ---------------------------------------------------------------------------
// Main export: computePreviews
// ---------------------------------------------------------------------------

/**
 * Computes preview records for governed eligible checkpoints.
 *
 * Eligibility gates (all must pass for a preview record to be emitted):
 *   Gate 1  checkpoint.preview_required === true
 *   Gate 2  No active blocker for checkpoint_id in blockers.active_blockers
 *   Gate 3  execution_relevance "Executable" → target_context non-null with
 *           non-null deployment_type
 *   Gate 4  deployment_type "odoosh" + "Executable" → odoosh_branch_target
 *           non-null
 *   Gate 5  checkpoint.safety_class non-null
 *   Gate 6  execution_relevance "Executable" → a matching entry must exist in
 *           operation_definitions keyed on checkpoint_id. Absence is blocked
 *           by omission — no partial record is emitted (R15).
 *
 * @param {object[]}    checkpoints            — persisted checkpoint records
 * @param {object|null} validated_checkpoints  — validation engine output (R12)
 * @param {object|null} blockers               — blocker engine output (§1.9)
 * @param {object|null} project_state          — persisted project state
 * @param {object|null} [target_context]       — target_context (§1.3); optional
 * @param {object|null} [connection_state]     — connection state; accepted, not used (R11)
 * @param {object|null} [operation_definitions] — plain object keyed by checkpoint_id;
 *                                               each value is a createOperationDefinition()
 *                                               record. Null means no definitions supplied —
 *                                               all Executable checkpoints are blocked by
 *                                               omission (Gate 6). Non-Executable checkpoints
 *                                               are unaffected by this parameter.
 * @returns {{ previews: object[], engine_version: string, generated_at: string }}
 */
export function computePreviews(
  checkpoints,
  validated_checkpoints,
  blockers,
  project_state,
  target_context = null,
  connection_state = null,     // R11: accepted, not used to widen scope
  operation_definitions = null // Gate 6: caller-supplied; never inferred
) {
  if (!Array.isArray(checkpoints)) {
    throw new Error(
      "computePreviews: checkpoints must be an array."
    );
  }

  // Single timestamp shared by all records in this run (R14 determinism).
  const generatedAt = new Date().toISOString();

  // Build blocker index once for O(1) gate-2 lookups (R4).
  const blockerIndex = buildBlockerIndex(blockers);

  // Build definition index once for O(1) gate-6 lookups.
  const definitionIndex = buildDefinitionIndex(operation_definitions);

  const previews = [];

  for (const checkpoint of checkpoints) {
    // Gate 1 — Scope: preview_required must be explicitly true (R3).
    if (checkpoint.preview_required !== true) {
      continue;
    }

    // Gate 2 — Blocked refusal (R4).
    if (blockerIndex.has(checkpoint.checkpoint_id)) {
      continue;
    }

    const execRelevance = checkpoint.execution_relevance ?? null;

    // Gate 3 — Target-context required for Executable checkpoints (R5).
    if (requiresTargetContext(execRelevance)) {
      if (
        !target_context ||
        typeof target_context !== "object" ||
        !target_context.deployment_type
      ) {
        continue;
      }
    }

    // Gate 4 — Branch/environment required for odoosh Executable previews (R6).
    const deploymentType = target_context ? (target_context.deployment_type ?? null) : null;
    if (requiresBranchTarget(deploymentType, execRelevance)) {
      if (!target_context.odoosh_branch_target) {
        continue;
      }
    }

    // Gate 5 — Safety class must be present for truthful preview (R7).
    if (!checkpoint.safety_class) {
      continue;
    }

    // Gate 6 — Operation definition required for Executable checkpoints (R15).
    // Absent definition → blocked by omission. No partial record emitted.
    // Non-Executable checkpoints are unaffected by this gate.
    if (execRelevance === "Executable" && !definitionIndex.has(checkpoint.checkpoint_id)) {
      continue;
    }

    // All gates passed — resolve definition fields (null for non-Executable).
    const def = definitionIndex.get(checkpoint.checkpoint_id) ?? null;

    // Emit preview record with truthful operation-binding fields when definition present.
    const record = createPreviewRecord({
      checkpoint_id:            checkpoint.checkpoint_id ?? null,
      checkpoint_class:         checkpoint.checkpoint_class ?? null,
      safety_class:             checkpoint.safety_class,
      intended_operation_class: execRelevance,
      deployment_target:        deploymentType,
      branch_context:           target_context
        ? (target_context.odoosh_branch_target ?? null)
        : null,
      prerequisite_snapshot:    Array.isArray(checkpoint.dependencies)
        ? [...checkpoint.dependencies]
        : [],
      downstream_impact_summary: checkpoint.downstream_impact_summary ?? null,
      generated_at:             generatedAt,
      target_model:             def ? (def.target_model ?? null) : null,
      target_operation:         def ? ((def.target_operation ?? def.method) ?? null) : null,
      intended_changes:         def ? (def.intended_changes !== undefined ? def.intended_changes : null) : null,
    });

    previews.push(record);
  }

  return createPreviewEngineOutput({
    previews,
    engine_version: GOVERNED_PREVIEW_ENGINE_VERSION,
    generated_at: generatedAt,
  });
}
