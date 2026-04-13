import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`expenses-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const EXPENSES_OP_DEFS_VERSION = "1.1.0";
export const EXPENSES_TARGET_METHOD = "write";
// COVERAGE GAP: hr.expense not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: hr.expense.sheet not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const EXPENSES_COVERAGE_GAP_MODELS = Object.freeze(["hr.expense", "hr.expense.sheet"]);
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
function addExpensesDefinition(map, checkpoint_id) { const metadata = EXPENSES_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: EXPENSES_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleExpensesOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addExpensesDefinition(map, "checkpoint-expenses-policy");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addExpensesDefinition(map, "checkpoint-expenses-approval-workflow");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addExpensesDefinition(map, "checkpoint-expenses-accounting-linkage");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addExpensesDefinition(map, "checkpoint-expenses-receipt-requirements");
  return map; }
