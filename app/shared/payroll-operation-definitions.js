// ---------------------------------------------------------------------------
// Payroll Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Payroll domain
//   Executable checkpoints. Payroll currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (hr.payslip and
//     hr.salary.rule are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generatePayrollCheckpoints
//
// Hard rules:
//   R1  Only Payroll domain checkpoints are considered here. Never other domains.
//   R2  No Payroll operation definitions are emitted. hr.payslip
//       and hr.salary.rule are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Payroll checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `payroll-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: hr.payslip not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: hr.salary.rule not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const PAYROLL_COVERAGE_GAP_MODELS = Object.freeze([
  "hr.payslip",
  "hr.salary.rule",
]);

export const PAYROLL_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const PAYROLL_OP_DEFS_VERSION = "1.0.0";

export function assemblePayrollOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
