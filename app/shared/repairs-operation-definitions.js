// ---------------------------------------------------------------------------
// Repairs Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Repairs domain
//   Executable checkpoints. Repairs currently has no governed-apply operation
//   definitions because the requested target model is outside the allowed
//   apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (repair.order is not in
//     ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateRepairsCheckpoints
//
// Hard rules:
//   R1  Only Repairs domain checkpoints are considered here. Never other domains.
//   R2  No Repairs operation definitions are emitted. repair.order is a
//       documented coverage gap.
//   R3  REP-FOUND-001 is Informational (execution_relevance: Informational,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R4  REP-REC-001 is non-Executable (execution_relevance: None,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R5  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R6  Non-Repairs checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `repairs-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: repair.order not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const REPAIRS_COVERAGE_GAP_MODELS = Object.freeze(["repair.order"]);

export const REPAIRS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const REPAIRS_OP_DEFS_VERSION = "1.0.0";

export function assembleRepairsOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
