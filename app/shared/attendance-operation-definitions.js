// ---------------------------------------------------------------------------
// Attendance Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Attendance domain
//   Executable checkpoints. Attendance currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (hr.attendance and
//     res.company are not in ALLOWED_APPLY_MODELS for attendance scope)
//   - checkpoint-engine.js generateAttendanceCheckpoints
//
// Hard rules:
//   R1  Only Attendance domain checkpoints are considered here. Never other domains.
//   R2  No Attendance operation definitions are emitted. hr.attendance
//       and res.company are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Attendance checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `attendance-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: hr.attendance not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: res.company not in ALLOWED_APPLY_MODELS for attendance scope
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const ATTENDANCE_COVERAGE_GAP_MODELS = Object.freeze([
  "hr.attendance",
  "res.company",
]);

export const ATTENDANCE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const ATTENDANCE_OP_DEFS_VERSION = "1.0.0";

export function assembleAttendanceOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
