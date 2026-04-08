// ---------------------------------------------------------------------------
// Discuss Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Discuss domain
//   Executable checkpoints. Discuss currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (mail.channel and
//     res.users are not in ALLOWED_APPLY_MODELS for discuss scope)
//   - checkpoint-engine.js generateDiscussCheckpoints
//
// Hard rules:
//   R1  Only Discuss domain checkpoints are considered here. Never other domains.
//   R2  No Discuss operation definitions are emitted. mail.channel
//       and res.users are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Discuss checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `discuss-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: mail.channel not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: res.users not in ALLOWED_APPLY_MODELS for discuss scope
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const DISCUSS_COVERAGE_GAP_MODELS = Object.freeze([
  "mail.channel",
  "res.users",
]);

export const DISCUSS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const DISCUSS_OP_DEFS_VERSION = "1.0.0";

export function assembleDiscussOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
