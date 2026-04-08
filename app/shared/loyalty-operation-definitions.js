// ---------------------------------------------------------------------------
// Loyalty Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Loyalty domain
//   Executable checkpoints. Loyalty currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (loyalty.program and
//     loyalty.reward are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateLoyaltyCheckpoints
//
// Hard rules:
//   R1  Only Loyalty domain checkpoints are considered here. Never other domains.
//   R2  No Loyalty operation definitions are emitted. loyalty.program
//       and loyalty.reward are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Loyalty checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `loyalty-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: loyalty.program not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: loyalty.reward not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const LOYALTY_COVERAGE_GAP_MODELS = Object.freeze([
  "loyalty.program",
  "loyalty.reward",
]);

export const LOYALTY_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const LOYALTY_OP_DEFS_VERSION = "1.0.0";

export function assembleLoyaltyOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
