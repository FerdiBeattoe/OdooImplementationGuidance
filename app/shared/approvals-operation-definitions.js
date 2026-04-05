// ---------------------------------------------------------------------------
// Approvals Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Approvals domain
//   Executable checkpoints. Approvals currently has no governed-apply
//   operation definitions because the requested target model is outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (approval.category is not in
//     ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateApprovalsCheckpoints
//
// Hard rules:
//   R1  Only Approvals domain checkpoints are considered here. Never other domains.
//   R2  No Approvals operation definitions are emitted. approval.category is a
//       documented coverage gap.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Approvals checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `approvals-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: approval.category not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const APPROVALS_COVERAGE_GAP_MODELS = Object.freeze(["approval.category"]);

export const APPROVALS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const APPROVALS_OP_DEFS_VERSION = "1.0.0";

export function assembleApprovalsOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
