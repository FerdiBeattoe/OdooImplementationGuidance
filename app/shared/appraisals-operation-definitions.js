// ---------------------------------------------------------------------------
// Appraisals Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Appraisals domain
//   Executable checkpoints. Appraisals currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (hr.appraisal and
//     hr.appraisal.goal are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateAppraisalsCheckpoints
//
// Hard rules:
//   R1  Only Appraisals domain checkpoints are considered here. Never other domains.
//   R2  No Appraisals operation definitions are emitted. hr.appraisal
//       and hr.appraisal.goal are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Appraisals checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `appraisals-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: hr.appraisal not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: hr.appraisal.goal not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const APPRAISALS_COVERAGE_GAP_MODELS = Object.freeze([
  "hr.appraisal",
  "hr.appraisal.goal",
]);

export const APPRAISALS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const APPRAISALS_OP_DEFS_VERSION = "1.0.0";

export function assembleAppraisalsOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
