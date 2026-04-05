// ---------------------------------------------------------------------------
// Sign Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Sign domain Executable
//   checkpoints. Sign currently has no governed-apply operation definitions
//   because the requested target model is outside the allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (sign.template is not in
//     ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateSignCheckpoints
//
// Hard rules:
//   R1  Only Sign domain checkpoints are considered here. Never other domains.
//   R2  No Sign operation definitions are emitted. sign.template is a
//       documented coverage gap.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Sign checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `sign-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: sign.template not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const SIGN_COVERAGE_GAP_MODELS = Object.freeze(["sign.template"]);

export const SIGN_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const SIGN_OP_DEFS_VERSION = "1.0.0";

export function assembleSignOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
