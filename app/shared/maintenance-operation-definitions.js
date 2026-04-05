// ---------------------------------------------------------------------------
// Maintenance Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Maintenance domain
//   Executable checkpoints. Maintenance currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (maintenance.equipment and
//     maintenance.request are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateMaintenanceCheckpoints
//
// Hard rules:
//   R1  Only Maintenance domain checkpoints are considered here. Never other domains.
//   R2  No Maintenance operation definitions are emitted. maintenance.equipment
//       and maintenance.request are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Maintenance checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `maintenance-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: maintenance.equipment not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: maintenance.request not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const MAINTENANCE_COVERAGE_GAP_MODELS = Object.freeze([
  "maintenance.equipment",
  "maintenance.request",
]);

export const MAINTENANCE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const MAINTENANCE_OP_DEFS_VERSION = "1.0.0";

export function assembleMaintenanceOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
