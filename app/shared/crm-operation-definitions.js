// ---------------------------------------------------------------------------
// CRM Operation Definitions - Odoo 19 Implementation Control Platform
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
//   R3  target_operation is always "write" - no create, unlink, or other operations.
//   R4  intended_changes is sourced only from wizard_captures.crm when present.
//       No invented fields or guessed IDs are permitted.
//   R5  CRM-DREQ-004 is conditional: only assembled when discovery_answers
//       contains TA-02 = true or "Yes". Gate confirmed in checkpoint-engine.js
//       generateCRMCheckpoints line 854.
//   R6  crm.stage changes may be expressed as an array of { name } objects to
//       preserve the truthful multi-stage capture supplied by the wizard.
//   R7  crm.team.user_id remains null when the wizard only supplies a leader
//       name. A truthful user ID cannot be derived from free text alone.
//   R8  The returned map is always a plain object (createOperationDefinitionsMap shape).
//       Never null, never an array.
//   R9  Non-CRM checkpoint IDs are never added to the returned map.
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

export const CRM_OP_DEFS_VERSION = "1.1.0";
export const CRM_STAGE_MODEL = "crm.stage";
export const CRM_TEAM_MODEL = "crm.team";
export const CRM_TARGET_OPERATION = "write";

export const CRM_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.CRM_FOUND_001,
  CHECKPOINT_IDS.CRM_FOUND_002,
  CHECKPOINT_IDS.CRM_DREQ_001,
  CHECKPOINT_IDS.CRM_DREQ_002,
  CHECKPOINT_IDS.CRM_DREQ_003,
  CHECKPOINT_IDS.CRM_REC_001,
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractCrmCapture(wizard_captures) {
  if (!isPlainObject(wizard_captures)) {
    return null;
  }
  return isPlainObject(wizard_captures.crm) ? wizard_captures.crm : null;
}

function buildStageIntendedChanges(crmCapture) {
  if (!isPlainObject(crmCapture) || !Array.isArray(crmCapture.stage_names)) {
    return null;
  }

  const stages = crmCapture.stage_names
    .filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  return stages.length >= 2 ? stages : null;
}

function buildTeamIntendedChanges(crmCapture) {
  if (!isPlainObject(crmCapture)) {
    return null;
  }

  const teamName = typeof crmCapture.team_name === "string" ? crmCapture.team_name.trim() : "";
  const leaderName = typeof crmCapture.team_leader_name === "string" ? crmCapture.team_leader_name.trim() : "";

  if (!teamName && !leaderName) {
    return null;
  }

  return {
    name: teamName || null,
    user_id: leaderName ? null : null,
  };
}

export function assembleCrmOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const crmCapture = extractCrmCapture(wizard_captures);
  const stageChanges = buildStageIntendedChanges(crmCapture);
  const teamChanges = buildTeamIntendedChanges(crmCapture);

  map[CHECKPOINT_IDS.CRM_FOUND_001] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.CRM_FOUND_001,
    target_model: CRM_STAGE_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: stageChanges,
  });

  map[CHECKPOINT_IDS.CRM_FOUND_002] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.CRM_FOUND_002,
    target_model: CRM_TEAM_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: teamChanges,
  });

  map[CHECKPOINT_IDS.CRM_DREQ_001] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.CRM_DREQ_001,
    target_model: CRM_STAGE_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: stageChanges,
  });

  map[CHECKPOINT_IDS.CRM_DREQ_002] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.CRM_DREQ_002,
    target_model: CRM_TEAM_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: teamChanges,
  });

  map[CHECKPOINT_IDS.CRM_DREQ_003] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.CRM_DREQ_003,
    target_model: CRM_STAGE_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: stageChanges,
  });

  map[CHECKPOINT_IDS.CRM_REC_001] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.CRM_REC_001,
    target_model: CRM_TEAM_MODEL,
    target_operation: CRM_TARGET_OPERATION,
    intended_changes: teamChanges,
  });

  if (answers["TA-02"] === true || answers["TA-02"] === "Yes") {
    map[CHECKPOINT_IDS.CRM_DREQ_004] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.CRM_DREQ_004,
      target_model: CRM_TEAM_MODEL,
      target_operation: CRM_TARGET_OPERATION,
      intended_changes: teamChanges,
    });
  }

  return map;
}
