// ---------------------------------------------------------------------------
// Studio Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Studio domain
//   Executable checkpoints. Studio currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (ir.model and
//     ir.ui.view are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateStudioCheckpoints
//
// Hard rules:
//   R1  Only Studio domain checkpoints are considered here. Never other domains.
//   R2  No Studio operation definitions are emitted. ir.model
//       and ir.ui.view are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Studio checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `studio-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: ir.model not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: ir.ui.view not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const STUDIO_COVERAGE_GAP_MODELS = Object.freeze([
  "ir.model",
  "ir.ui.view",
]);

export const STUDIO_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const STUDIO_OP_DEFS_VERSION = "1.0.0";

export function assembleStudioOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
