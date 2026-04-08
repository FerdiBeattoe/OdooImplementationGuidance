// ---------------------------------------------------------------------------
// Lunch Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Lunch domain
//   Executable checkpoints. Lunch currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (lunch.supplier and
//     lunch.product are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateLunchCheckpoints
//
// Hard rules:
//   R1  Only Lunch domain checkpoints are considered here. Never other domains.
//   R2  No Lunch operation definitions are emitted. lunch.supplier
//       and lunch.product are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Lunch checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `lunch-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: lunch.supplier not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: lunch.product not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const LUNCH_COVERAGE_GAP_MODELS = Object.freeze([
  "lunch.supplier",
  "lunch.product",
]);

export const LUNCH_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const LUNCH_OP_DEFS_VERSION = "1.0.0";

export function assembleLunchOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
