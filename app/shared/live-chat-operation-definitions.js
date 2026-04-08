// ---------------------------------------------------------------------------
// Live Chat Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Live Chat domain
//   Executable checkpoints. Live Chat currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (im_livechat.channel and
//     res.users are not in ALLOWED_APPLY_MODELS for live chat scope)
//   - checkpoint-engine.js generateLiveChatCheckpoints
//
// Hard rules:
//   R1  Only Live Chat domain checkpoints are considered here. Never other domains.
//   R2  No Live Chat operation definitions are emitted. im_livechat.channel
//       and res.users are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Live Chat checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `live-chat-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: im_livechat.channel not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: res.users not in ALLOWED_APPLY_MODELS for live chat scope
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const LIVE_CHAT_COVERAGE_GAP_MODELS = Object.freeze([
  "im_livechat.channel",
  "res.users",
]);

export const LIVE_CHAT_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const LIVE_CHAT_OP_DEFS_VERSION = "1.0.0";

export function assembleLiveChatOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
