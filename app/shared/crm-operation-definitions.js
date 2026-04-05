// ---------------------------------------------------------------------------
// CRM Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for CRM domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking CRM previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (crm.stage and crm.team are in
//     ALLOWED_APPLY_MODELS)
//   - governed-odoo-apply-service.js S12 (target_model must match preview at apply)
//
// Hard rules:
//   R1  Only CRM domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "crm.stage" or "crm.team" per checkpoint purpose.
//       See per-checkpoint comments for exact assignment.
//   R3  target_operation is always "write" — no create, unlink, or other operations.
//   R4  intended_changes is null for all checkpoints — CRM configuration data
//       (pipeline stages, team assignments, lead rules) is not available in
//       target_context or discovery_answers at assembly time. Null is honest
//       (no fabrication).
//   R5  CRM-DREQ-004 is conditional: only assembled when discovery_answers
//       contains TA-02 = true or "Yes". Gate confirmed in checkpoint-engine.js
//       generateCRMCheckpoints line 854.
//   R6  The returned map is always a plain object (createOperationDefinitionsMap shape).
//       Never null, never an array.
//   R7  Non-CRM checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `crm-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

// ---------------------------------------------------------------------------
// Module version — increment on any rule change
// ---------------------------------------------------------------------------

export const CRM_OP_DEFS_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Target models for CRM Executable checkpoints.
// All confirmed present in governed-odoo-apply-service.js ALLOWED_APPLY_MODELS.
export const CRM_STAGE_MODEL = "crm.stage";
export const CRM_TEAM_MODEL  = "crm.team";

// Target operation for all CRM Executable checkpoints.
export const CRM_TARGET_OPERATION = "write";

// CRM Executable checkpoint IDs covered by this assembler (unconditional only).
// CRM-DREQ-004 added conditionally (TA-02=Yes — R5).
export const CRM_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.CRM_FOUND_001, // Unconditional, Safe
  CHECKPOINT_IDS.CRM_FOUND_002, // Unconditional, Safe
  CHECKPOINT_IDS.CRM_DREQ_001,  // Unconditional, Safe
  CHECKPOINT_IDS.CRM_DREQ_002,  // Unconditional, Safe
  CHECKPOINT_IDS.CRM_DREQ_003,  // Unconditional, Safe
  CHECKPOINT_IDS.CRM_REC_001,   // Unconditional, Safe
  // CRM_DREQ_004 added conditionally when TA-02=Yes (R5)
]);

// ---------------------------------------------------------------------------
// Main export: assembleCrmOperationDefinitions
// ---------------------------------------------------------------------------

/**
 * Assembles the operation_definitions map for CRM Executable checkpoints.
 *
 * Unconditional definitions returned (keyed by checkpoint_id):
 *   CRM-FOUND-001  CRM pipeline/stage activation foundation  target_model: crm.stage
 *   CRM-FOUND-002  CRM team/user assignment foundation       target_model: crm.team
 *   CRM-DREQ-001   Pipeline stage configuration              target_model: crm.stage
 *   CRM-DREQ-002   Lead assignment rules                     target_model: crm.team
 *   CRM-DREQ-003   Activity/pipeline discipline              target_model: crm.stage
 *   CRM-REC-001    Reporting/team readiness                  target_model: crm.team
 *
 * Conditional definition (added only when TA-02 = true or "Yes"):
 *   CRM-DREQ-004   Team activity tracking (TA-02=Yes)        target_model: crm.team
 *
 * intended_changes is null for all entries — CRM configuration data is not
 * available in target_context or discovery_answers at assembly time (R4).
 *
 * @param {object|null} target_context      — createTargetContext() shape or null
 * @param {object|null} discovery_answers   — createDiscoveryAnswers() shape or null
 * @returns {{ [checkpoint_id: string]: object }} operation_definitions map (never null)
 */
export function assembleCrmOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();

  // ── CRM-FOUND-001: CRM pipeline/stage activation foundation (Safe, unconditional) ──
  // Activates the CRM pipeline and establishes the foundational stage structure.
  // intended_changes is null — stage configuration data not available at assembly time (R4).
  map[CHECKPOINT_IDS.CRM_FOUND_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.CRM_FOUND_001,
    target_model:     CRM_STAGE_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── CRM-FOUND-002: CRM team/user assignment foundation (Safe, unconditional) ────────
  // Establishes the foundational CRM team and user assignment configuration.
  // intended_changes is null — team assignment data not available at assembly time (R4).
  map[CHECKPOINT_IDS.CRM_FOUND_002] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.CRM_FOUND_002,
    target_model:     CRM_TEAM_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── CRM-DREQ-001: Pipeline stage configuration (Safe, unconditional) ─────────────────
  // Configures the CRM pipeline stages in crm.stage.
  // intended_changes is null — stage configuration data not available at assembly time (R4).
  map[CHECKPOINT_IDS.CRM_DREQ_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.CRM_DREQ_001,
    target_model:     CRM_STAGE_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── CRM-DREQ-002: Lead assignment rules (Safe, unconditional) ────────────────────────
  // Configures lead assignment rules on crm.team.
  // intended_changes is null — lead assignment configuration not available at assembly time (R4).
  map[CHECKPOINT_IDS.CRM_DREQ_002] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.CRM_DREQ_002,
    target_model:     CRM_TEAM_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── CRM-DREQ-003: Activity/pipeline discipline (Safe, unconditional) ─────────────────
  // Configures activity types and pipeline discipline rules in crm.stage.
  // intended_changes is null — activity configuration not available at assembly time (R4).
  map[CHECKPOINT_IDS.CRM_DREQ_003] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.CRM_DREQ_003,
    target_model:     CRM_STAGE_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── CRM-REC-001: Reporting/team readiness (Safe, unconditional) ──────────────────────
  // Configures CRM team reporting readiness in crm.team.
  // intended_changes is null — reporting configuration not available at assembly time (R4).
  map[CHECKPOINT_IDS.CRM_REC_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.CRM_REC_001,
    target_model:     CRM_TEAM_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── Conditional definitions ────────────────────────────────────────────────────────────

  const answers = discovery_answers?.answers ?? {};

  // ── CRM-DREQ-004: Team activity tracking (Conditional, TA-02=Yes) ────────────────────
  // Configures team activity tracking in crm.team.
  // Only assembled when TA-02 (technical administrator required) is explicitly Yes (R5).
  // Gate confirmed: checkpoint-engine.js generateCRMCheckpoints line 854.
  const ta02 = answers["TA-02"];
  if (ta02 === true || ta02 === "Yes") {
    map[CHECKPOINT_IDS.CRM_DREQ_004] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.CRM_DREQ_004,
      target_model:     CRM_TEAM_MODEL,
      target_operation: CRM_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  return map;
}
