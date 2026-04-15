import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`expenses-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const EXPENSES_OP_DEFS_VERSION = "1.2.0";
export const EXPENSES_TARGET_METHOD = "write";
// hr.expense and hr.expense.sheet are in ALLOWED_APPLY_MODELS (promoted 2026-04-15).
// hr.expense.sheet has no live-confirmed field catalogue (unresolved on majestic.odoo.com),
// so wizard-driven writes to it remain honest-null until fields_get succeeds at apply time (S13).
export const EXPENSES_COVERAGE_GAP_MODELS = Object.freeze([]);
export const EXPENSES_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-expenses-policy"]: Object.freeze({
    target_model: "hr.expense",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-expenses-approval-workflow"]: Object.freeze({
    target_model: "hr.expense.sheet",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-expenses-accounting-linkage"]: Object.freeze({
    target_model: "hr.expense.sheet",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-expenses-receipt-requirements"]: Object.freeze({
    target_model: "hr.expense",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const EXPENSES_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(EXPENSES_CHECKPOINT_METADATA));
function addExpensesDefinition(map, checkpoint_id, intended_changes) { const metadata = EXPENSES_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: EXPENSES_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleExpensesOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (expenses-wizard.js): {reimbursement_method, default_category_name,
  // mileage_rate, receipts_mandatory, approval_chain}. All are company-level expense POLICY
  // (settings stored on res.config.settings / ir.config_parameter or on hr.expense product
  // categories), not record-level fields on hr.expense or hr.expense.sheet.
  // checkpoint-expenses-policy → hr.expense. honest-null (policy, not record fields).
  addExpensesDefinition(map, "checkpoint-expenses-policy", null);
  // checkpoint-expenses-approval-workflow → hr.expense.sheet.
  // honest-null: approval_chain is a workflow policy; hr.expense.sheet has no live-confirmed
  // field catalogue on this instance, so we cannot stage a verified write.
  addExpensesDefinition(map, "checkpoint-expenses-approval-workflow", null);
  // checkpoint-expenses-accounting-linkage → hr.expense.sheet. execution_relevance "None".
  addExpensesDefinition(map, "checkpoint-expenses-accounting-linkage", null);
  // checkpoint-expenses-receipt-requirements → hr.expense.
  // honest-null: receipts_mandatory is a submission-policy flag (res.config.settings level),
  // not a per-expense field in the confirmed hr.expense surface.
  addExpensesDefinition(map, "checkpoint-expenses-receipt-requirements", null);
  return map;
}
