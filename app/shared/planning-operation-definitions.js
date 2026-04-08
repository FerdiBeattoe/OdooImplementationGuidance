// ---------------------------------------------------------------------------
// Planning Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Planning domain
//   Executable checkpoints. Planning currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (planning.slot and
//     planning.role are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generatePlanningCheckpoints
//
// Hard rules:
//   R1  Only Planning domain checkpoints are considered here. Never other domains.
//   R2  No Planning operation definitions are emitted. planning.slot
//       and planning.role are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Planning checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `planning-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: planning.slot not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: planning.role not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const PLANNING_COVERAGE_GAP_MODELS = Object.freeze([
  "planning.slot",
  "planning.role",
]);

export const PLANNING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const PLANNING_OP_DEFS_VERSION = "1.0.0";

export function assemblePlanningOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
