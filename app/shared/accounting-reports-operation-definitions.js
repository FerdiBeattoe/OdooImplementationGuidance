import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`accounting-reports-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const ACCOUNTING_REPORTS_OP_DEFS_VERSION = "1.1.0";
export const ACCOUNTING_REPORTS_TARGET_METHOD = "write";
// COVERAGE GAP: account.report not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: account.financial.html.report not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS = Object.freeze(["account.report", "account.financial.html.report"]);
export const ACCOUNTING_REPORTS_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-accounting-reports-financial-baseline"]: Object.freeze({
    target_model: "account.report",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-accounting-reports-tax-mapping"]: Object.freeze({
    target_model: "account.financial.html.report",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-accounting-reports-custom-structure"]: Object.freeze({
    target_model: "account.report",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-accounting-reports-fiscal-year"]: Object.freeze({
    target_model: "account.report",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const ACCOUNTING_REPORTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(ACCOUNTING_REPORTS_CHECKPOINT_METADATA));
function addAccountingReportsDefinition(map, checkpoint_id) { const metadata = ACCOUNTING_REPORTS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: ACCOUNTING_REPORTS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleAccountingReportsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAccountingReportsDefinition(map, "checkpoint-accounting-reports-financial-baseline");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAccountingReportsDefinition(map, "checkpoint-accounting-reports-tax-mapping");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAccountingReportsDefinition(map, "checkpoint-accounting-reports-custom-structure");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAccountingReportsDefinition(map, "checkpoint-accounting-reports-fiscal-year");
  return map; }
