// ---------------------------------------------------------------------------
// Accounting Reports Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Accounting Reports domain
//   Executable checkpoints. Accounting Reports currently has no governed-apply
//   operation definitions because the requested target models are outside the
//   allowed apply surface.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (account.report and
//     account.financial.html.report are not in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateAccountingReportsCheckpoints
//
// Hard rules:
//   R1  Only Accounting Reports domain checkpoints are considered here. Never other domains.
//   R2  No Accounting Reports operation definitions are emitted. account.report
//       and account.financial.html.report are documented coverage gaps.
//   R3  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R4  Non-Accounting Reports checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `accounting-reports-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import { createOperationDefinitionsMap } from "./runtime-state-contract.js";

// COVERAGE GAP: account.report not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: account.financial.html.report not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS = Object.freeze([
  "account.report",
  "account.financial.html.report",
]);

export const ACCOUNTING_REPORTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);
export const ACCOUNTING_REPORTS_OP_DEFS_VERSION = "1.0.0";

export function assembleAccountingReportsOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  return createOperationDefinitionsMap();
}
