// ---------------------------------------------------------------------------
// Users/Roles Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Users/Roles domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Users/Roles previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (res.users and res.groups are in
//     ALLOWED_APPLY_MODELS)
//   - governed-odoo-apply-service.js S12 (target_model must match preview at apply)
//
// Hard rules:
//   R1  Only Users/Roles domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "res.users" or "res.groups" per checkpoint purpose.
//       See per-checkpoint comments for exact assignment.
//   R3  target_operation is always "write" — no create, unlink, or other operations.
//   R4  intended_changes is null for all checkpoints — Users/Roles provisioning data
//       (user list, group assignments, access rights) is not available in target_context
//       or discovery_answers at assembly time. Null is honest (no fabrication).
//   R5  USR-FOUND-002 is Informational (safety_class: Not_Applicable) in checkpoint-engine.
//       It is intentionally excluded — Gate 6 does not apply to Informational checkpoints.
//   R6  USR-DREQ-003 through USR-DREQ-011 that are Informational (safety_class: Not_Applicable)
//       in checkpoint-engine are intentionally excluded.
//   R7  USR-DREQ-004 is conditional: only assembled when discovery_answers
//       contains TA-02 = true or "Yes". Gate ID TA-02 confirmed in checkpoint-engine.js line 571.
//   R8  USR-DREQ-005 is conditional: only assembled when discovery_answers
//       contains BM-02 = true or "Yes". Gate ID BM-02 confirmed in checkpoint-engine.js line 584.
//   R9  The returned map is always a plain object (createOperationDefinitionsMap shape).
//       Never null, never an array.
//   R10 Non-Users/Roles checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `users-roles-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
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

export const USERS_ROLES_OP_DEFS_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Target models for Users/Roles Executable checkpoints.
// Confirmed present in governed-odoo-apply-service.js ALLOWED_APPLY_MODELS.
export const USERS_ROLES_USER_MODEL  = "res.users";
export const USERS_ROLES_GROUP_MODEL = "res.groups";

// Target operation for all Users/Roles Executable checkpoints.
export const USERS_ROLES_TARGET_OPERATION = "write";

// Users/Roles Executable checkpoint IDs covered by this assembler.
// USR-FOUND-002 intentionally excluded (Informational / Not_Applicable — R5).
// USR-DREQ-004 added conditionally (TA-02=Yes — R7).
// USR-DREQ-005 added conditionally (BM-02=Yes — R8).
export const USERS_ROLES_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.USR_FOUND_001, // Unconditional, Conditional
  CHECKPOINT_IDS.USR_DREQ_001,  // Unconditional, Safe
  CHECKPOINT_IDS.USR_DREQ_002,  // Unconditional, Conditional
  // USR_DREQ_004 added conditionally when TA-02=Yes (R7)
  // USR_DREQ_005 added conditionally when BM-02=Yes (R8)
]);

// ---------------------------------------------------------------------------
// Main export: assembleUsersRolesOperationDefinitions
// ---------------------------------------------------------------------------

/**
 * Assembles the operation_definitions map for Users/Roles Executable checkpoints.
 *
 * Unconditional definitions returned (keyed by checkpoint_id):
 *   USR-FOUND-001  User account provisioning foundation  target_model: res.users
 *   USR-DREQ-001   User role baseline assignment         target_model: res.users
 *   USR-DREQ-002   Access rights group configuration     target_model: res.groups
 *
 * Conditional definition (added only when TA-02 = true or "Yes"):
 *   USR-DREQ-004   Technical administrator provisioning  target_model: res.users
 *
 * Conditional definition (added only when BM-02 = true or "Yes"):
 *   USR-DREQ-005   Multi-company access configuration    target_model: res.groups
 *
 * Always excluded:
 *   USR-FOUND-002  Informational (safety_class: Not_Applicable) — no definition needed
 *   USR-DREQ-003   Informational (safety_class: Not_Applicable) — no definition needed
 *   USR-DREQ-006 through USR-DREQ-011  Informational — no definition needed
 *
 * intended_changes is null for all entries — Users/Roles provisioning data is not
 * available in target_context or discovery_answers at assembly time (R4).
 *
 * @param {object|null} target_context      — createTargetContext() shape or null
 * @param {object|null} discovery_answers   — createDiscoveryAnswers() shape or null
 * @returns {{ [checkpoint_id: string]: object }} operation_definitions map (never null)
 */
export function assembleUsersRolesOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();

  // ── USR-FOUND-001: User account provisioning foundation (Conditional, unconditional) ──
  // Establishes the base user account configuration on res.users.
  // intended_changes is null — user list and provisioning data are not
  // available in target_context or discovery_answers at assembly time (R4).
  map[CHECKPOINT_IDS.USR_FOUND_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.USR_FOUND_001,
    target_model:     USERS_ROLES_USER_MODEL,
    target_operation: USERS_ROLES_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── USR-FOUND-002: Intentionally excluded (R5) ──────────────────────────────────────
  // Informational (safety_class: Not_Applicable) — Gate 6 does not apply.

  // ── USR-DREQ-001: User role baseline assignment (Safe, unconditional) ────────────────
  // Assigns baseline roles to provisioned users in res.users.
  // intended_changes is null — role assignment data is not available at assembly time (R4).
  map[CHECKPOINT_IDS.USR_DREQ_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.USR_DREQ_001,
    target_model:     USERS_ROLES_USER_MODEL,
    target_operation: USERS_ROLES_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── USR-DREQ-002: Access rights group configuration (Conditional, unconditional) ─────
  // Configures access rights groups on res.groups.
  // intended_changes is null — group configuration data is not available at assembly time (R4).
  map[CHECKPOINT_IDS.USR_DREQ_002] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.USR_DREQ_002,
    target_model:     USERS_ROLES_GROUP_MODEL,
    target_operation: USERS_ROLES_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── USR-DREQ-004: Technical administrator provisioning (Conditional, TA-02=Yes) ──────
  // Provisions the technical administrator user account on res.users.
  // Only assembled when TA-02 (technical administrator required) is explicitly Yes (R7).
  // Gate ID TA-02 confirmed in checkpoint-engine.js generateUsersRolesCheckpoints line 571.
  const answers = discovery_answers?.answers ?? {};
  const ta02 = answers["TA-02"];
  if (ta02 === true || ta02 === "Yes") {
    map[CHECKPOINT_IDS.USR_DREQ_004] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.USR_DREQ_004,
      target_model:     USERS_ROLES_USER_MODEL,
      target_operation: USERS_ROLES_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── USR-DREQ-005: Multi-company access configuration (Conditional, BM-02=Yes) ────────
  // Configures multi-company group access in res.groups.
  // Only assembled when BM-02 (multi-company operations) is explicitly Yes (R8).
  // Gate ID BM-02 confirmed in checkpoint-engine.js generateUsersRolesCheckpoints line 584.
  const bm02 = answers["BM-02"];
  if (bm02 === true || bm02 === "Yes") {
    map[CHECKPOINT_IDS.USR_DREQ_005] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.USR_DREQ_005,
      target_model:     USERS_ROLES_GROUP_MODEL,
      target_operation: USERS_ROLES_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  return map;
}
