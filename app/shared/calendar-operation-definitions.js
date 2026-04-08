// ---------------------------------------------------------------------------
// Calendar Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Calendar domain
//   Executable checkpoints. Calendar currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (calendar.event and
//     res.users are not in ALLOWED_APPLY_MODELS for calendar scope)
//   - checkpoint-engine.js generateCalendarCheckpoints
//
// Hard rules:
//   R1  Only Calendar domain checkpoints are considered here. Never other domains.
//   R2  No Calendar operation definitions are emitted. calendar.event
//       and res.users are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Calendar checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `calendar-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: calendar.event not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: res.users not in ALLOWED_APPLY_MODELS for calendar scope
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const CALENDAR_COVERAGE_GAP_MODELS = Object.freeze([
  "calendar.event",
  "res.users",
]);

export const CALENDAR_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const CALENDAR_OP_DEFS_VERSION = "1.0.0";

export function assembleCalendarOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
