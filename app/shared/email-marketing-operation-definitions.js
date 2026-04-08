// ---------------------------------------------------------------------------
// Email Marketing Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Email Marketing domain
//   Executable checkpoints. Email Marketing currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (mailing.mailing and
//     mailing.list are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateEmailMarketingCheckpoints
//
// Hard rules:
//   R1  Only Email Marketing domain checkpoints are considered here. Never other domains.
//   R2  No Email Marketing operation definitions are emitted. mailing.mailing
//       and mailing.list are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Email Marketing checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `email-marketing-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: mailing.mailing not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: mailing.list not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const EMAIL_MARKETING_COVERAGE_GAP_MODELS = Object.freeze([
  "mailing.mailing",
  "mailing.list",
]);

export const EMAIL_MARKETING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const EMAIL_MARKETING_OP_DEFS_VERSION = "1.0.0";

export function assembleEmailMarketingOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
