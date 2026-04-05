// ---------------------------------------------------------------------------
// Pipeline Orchestrator — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Wires the shared engines in governed pipeline order and returns the full
//   runtime state object in contract shape. Owns call order, pass-through
//   assembly, and final output packaging only.
//
// Governing constraints:
//   - specs/runtime_state_contract.md (contract shape authority)
//   - specs/checkpoint_engine.md, specs/domain_activation_engine.md,
//     specs/stage_routing_engine.md (engine authority for their fields)
//
// Hard rules:
//   R1  No business logic. No inference. No field recomputation.
//   R2  Call each engine exactly once, in governed order (§ Pipeline Order).
//   R3  Pass engine outputs through without mutation.
//   R4  Compose final runtime state from engine outputs and explicit inputs only.
//   R5  Missing upstream input → downstream outputs bounded by engine refusal rules.
//   R6  No UI-only fields. No secret persistence. No side effects.
//   R7  audit_refs and resume_context emitted as contract-shape stubs (no engine
//       computes them in this pipeline version).
//   R8  Output shape must match runtime contract shape exactly.
//
// Pipeline order:
//   1.  domain activation
//   2.  checkpoints
//   3.  validation
//   4.  blockers
//   5.  stage routing
//   6.  go-live readiness
//   7.  previews
//   8.  execution eligibility
//   9.  execution approvals
//   10. execution records
//   11. project state composition
//   12. final runtime state assembly
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `pipeline-orchestrator: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { computeActivatedDomains } from "./domain-activation-engine.js";
import { computeCheckpoints } from "./checkpoint-engine.js";
import { computeValidation } from "./validation-engine.js";
import { computeBlockers } from "./blocker-engine.js";
import { computeStageRouting } from "./stage-routing-engine.js";
import { computeGoLiveReadiness } from "./golive-readiness-engine.js";
import { computePreviews } from "./governed-preview-engine.js";
import { computeExecutionEligibility } from "./governed-execution-eligibility-engine.js";
import { computeExecutionApprovals } from "./governed-execution-approval-engine.js";
import { computeExecutionRecords } from "./governed-execution-record-engine.js";
import { composeProjectState } from "./project-state-composer.js";

// ---------------------------------------------------------------------------
// Orchestrator version — increment on any pipeline-order or assembly change
// ---------------------------------------------------------------------------

export const PIPELINE_ORCHESTRATOR_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Audit refs stub shape (R7)
// Populated by StageRoutingEngine in a future pipeline version.
// Emitted here as nulled contract-shape to satisfy R8 (omit nothing).
// ---------------------------------------------------------------------------

const AUDIT_REFS_STUB = Object.freeze({
  by_checkpoint: null,
  by_decision:   null,
  by_preview:    null,
  by_execution:  null,
});

// ---------------------------------------------------------------------------
// Resume context stub shape (R7)
// Populated by StageRoutingEngine in a future pipeline version.
// Emitted here as nulled contract-shape to satisfy R8 (omit nothing).
// ---------------------------------------------------------------------------

const RESUME_CONTEXT_STUB = Object.freeze({
  current_stages:                 [],
  resume_target_type:             null,
  resume_target_checkpoint_id:    null,
  resume_target_domain_id:        null,
  resume_target_stage_id:         null,
  resume_context_message:         null,
  stale_state_alerts:             [],
  highest_priority_blocker:       null,
  next_required_action:           null,
  secondary_action_queue:         [],
});

// ---------------------------------------------------------------------------
// Internal: build upstream project state proxy
//
// Provides a minimal project_state object for engines 6–10 that need access
// to target_context, deferments, stage_state, and discovery_answers.
// Does NOT invent values — absent inputs remain absent.
// ---------------------------------------------------------------------------

function buildUpstreamProjectState(
  project_identity,
  target_context,
  discovery_answers,
  workflow_state
) {
  return {
    project_identity:  project_identity  ?? null,
    target_context:    target_context    ?? null,
    discovery_answers: discovery_answers ?? null,
    deferments:  Array.isArray(workflow_state?.deferments)  ? workflow_state.deferments  : [],
    stage_state: Array.isArray(workflow_state?.stage_state) ? workflow_state.stage_state : [],
  };
}

// ---------------------------------------------------------------------------
// VALID_CARRYOVER_STATUSES — the only status values accepted via checkpoint_statuses.
// Silently ignored if the carried-over value is not in this set.
// ---------------------------------------------------------------------------

const VALID_CARRYOVER_STATUSES = new Set([
  "Not_Started",
  "In_Progress",
  "Ready_For_Review",
  "Complete",
  "Deferred",
]);

// ---------------------------------------------------------------------------
// runPipeline — deterministic full pipeline run
//
// @param {object} project_identity  — project_identity persisted record
// @param {object} discovery_answers — createDiscoveryAnswers() shape
// @param {object} environment_context — optional environment overrides
// @param {object} target_context    — createTargetContext() shape or null
// @param {object} connection_state  — connection state or null
// @param {object} workflow_state    — { stage_state, deferments } persisted or null
// @param {object} training_state    — training state or null
// @param {Array}  decision_links    — decisions array or null
// @param {object} approval_context   — { approval_granted_by } or null
// @param {object} execution_result   — { result_status } or null
// @param {object} operation_definitions — plain object keyed by checkpoint_id,
//                                         each value a createOperationDefinition() record;
//                                         null if no definitions supplied (Gate 6 blocks all
//                                         Executable checkpoints in governed-preview-engine)
// @param {object|null} checkpoint_statuses — optional plain object keyed by checkpoint_id,
//                                            values are status strings; used to restore proven
//                                            prior checkpoint statuses across pipeline runs.
//                                            Applied after Step 2 (computeCheckpoints).
//                                            Only values in VALID_CARRYOVER_STATUSES are applied;
//                                            invalid values and nonexistent ids are silently ignored.
//
// @returns {object} full runtime state in contract shape
// ---------------------------------------------------------------------------

export function runPipeline({
  project_identity      = null,
  discovery_answers,
  environment_context   = null,
  target_context        = null,
  connection_state      = null,
  workflow_state        = null,
  training_state        = null,
  decision_links        = null,
  approval_context      = null,
  execution_result      = null,
  operation_definitions = null,
  checkpoint_statuses   = null,
} = {}) {
  const orchestratedAt = new Date().toISOString();

  // ── Step 1: Domain activation ─────────────────────────────────────────────
  const activatedDomains = computeActivatedDomains(discovery_answers);

  // ── Step 2: Checkpoints ───────────────────────────────────────────────────
  const checkpointsOutput = computeCheckpoints(activatedDomains, discovery_answers);
  const checkpoints = checkpointsOutput.records;

  // ── Step 2a: Checkpoint status carry-over ─────────────────────────────────
  // Restore proven prior checkpoint statuses from a previous pipeline run.
  // Only runs when checkpoint_statuses is a non-null plain object.
  // Only VALID_CARRYOVER_STATUSES values are applied; all others are silently ignored.
  // Nonexistent checkpoint_ids in checkpoint_statuses produce no effect.
  if (checkpoint_statuses !== null && typeof checkpoint_statuses === "object" && !Array.isArray(checkpoint_statuses)) {
    for (const cp of checkpoints) {
      if (Object.prototype.hasOwnProperty.call(checkpoint_statuses, cp.checkpoint_id)) {
        const carried = checkpoint_statuses[cp.checkpoint_id];
        if (VALID_CARRYOVER_STATUSES.has(carried)) {
          cp.status = carried;
        }
      }
    }
  }

  // ── Step 3: Validation ────────────────────────────────────────────────────
  const validatedCheckpoints = computeValidation(checkpoints, discovery_answers);

  // ── Step 4: Blockers ──────────────────────────────────────────────────────
  const blockers = computeBlockers(checkpoints, validatedCheckpoints);

  // ── Step 5: Stage routing ─────────────────────────────────────────────────
  const stageRouting = computeStageRouting(
    activatedDomains,
    checkpoints,
    validatedCheckpoints,
    blockers,
    discovery_answers
  );

  // Upstream project state proxy — shared across steps 6–10
  const upstreamProjectState = buildUpstreamProjectState(
    project_identity,
    target_context,
    discovery_answers,
    workflow_state
  );

  // ── Step 6: Go-live readiness ─────────────────────────────────────────────
  const readinessState = computeGoLiveReadiness(
    checkpoints,
    validatedCheckpoints,
    blockers,
    stageRouting,
    upstreamProjectState
  );

  // ── Step 7: Previews ──────────────────────────────────────────────────────
  const previewEngineOutput = computePreviews(
    checkpoints,
    validatedCheckpoints,
    blockers,
    upstreamProjectState,
    target_context,
    connection_state,
    operation_definitions
  );

  // ── Step 8: Execution eligibility ─────────────────────────────────────────
  const eligibilityOutput = computeExecutionEligibility(
    checkpoints,
    validatedCheckpoints,
    blockers,
    previewEngineOutput,
    upstreamProjectState,
    target_context,
    connection_state
  );

  // ── Step 9: Execution approvals ───────────────────────────────────────────
  const approvalsOutput = computeExecutionApprovals(
    eligibilityOutput.execution_candidates,
    checkpoints,
    blockers,
    previewEngineOutput,
    upstreamProjectState,
    target_context,
    connection_state,
    approval_context
  );

  // ── Step 10: Execution records ────────────────────────────────────────────
  const recordsOutput = computeExecutionRecords(
    approvalsOutput.execution_approvals,
    eligibilityOutput.execution_candidates,
    previewEngineOutput,
    checkpoints,
    upstreamProjectState,
    target_context,
    connection_state,
    execution_result
  );

  // ── Step 11: Project state composition ───────────────────────────────────
  const composedState = composeProjectState({
    project_identity,
    environment_context,
    workflow_state,
    activated_domains:     activatedDomains,
    checkpoints,
    validated_checkpoints: validatedCheckpoints,
    blockers,
    stage_routing:         stageRouting,
    readiness:             readinessState,
    connection_state,
    training_state,
    target_context,
    decision_links,
  });

  // ── Step 12: Final runtime state assembly ─────────────────────────────────
  //
  // Persisted fields come from composeProjectState.
  // previews and executions are overridden with engine outputs (composer
  // emits [] for both per its R8 rule; orchestrator populates from engines).
  // Computed objects are placed at top level per contract §1.8, §1.9, §1.14, §1.16.
  // Engine outputs are preserved under _engine_outputs for traceability (R3).
  return {
    // ── Persisted fields (from composeProjectState) ──────────────────────
    project_identity:    composedState.project_identity,
    target_context:      composedState.target_context,
    discovery_answers:   discovery_answers,
    activated_domains:   composedState.activated_domains,
    checkpoints:         composedState.checkpoints,
    decisions:           composedState.decisions,
    stage_state:         composedState.stage_state,
    deferments:          composedState.deferments,

    // ── Previews and executions from engine outputs ───────────────────────
    previews:            previewEngineOutput.previews,
    executions:          recordsOutput.executions,

    // ── Composer-owned persisted extensions ──────────────────────────────
    connection_state:    composedState.connection_state,
    training_state:      composedState.training_state,
    readiness_summary:   composedState.readiness_summary,
    composer_version:    composedState.composer_version,
    composed_at:         composedState.composed_at,

    // ── Computed objects (contract §1.8, §1.9, §1.14, §1.16) ─────────────
    readiness_state:     readinessState,
    blockers:            blockers,
    audit_refs:          { ...AUDIT_REFS_STUB },
    resume_context:      { ...RESUME_CONTEXT_STUB },

    // ── Engine outputs for traceability (R3, not persisted) ───────────────
    _engine_outputs: {
      checkpoints_output:    checkpointsOutput,
      validated_checkpoints: validatedCheckpoints,
      stage_routing:         stageRouting,
      preview_engine_output: previewEngineOutput,
      execution_eligibility: eligibilityOutput,
      execution_approvals:   approvalsOutput,
      execution_records:     recordsOutput,
    },

    // ── Orchestrator metadata ─────────────────────────────────────────────
    orchestrator_version: PIPELINE_ORCHESTRATOR_VERSION,
    orchestrated_at:      orchestratedAt,
  };
}
