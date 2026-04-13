import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`payroll-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const PAYROLL_OP_DEFS_VERSION = "1.1.0";
export const PAYROLL_TARGET_METHOD = "write";
// COVERAGE GAP: hr.salary.rule not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: hr.payslip not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const PAYROLL_COVERAGE_GAP_MODELS = Object.freeze(["hr.salary.rule", "hr.payslip"]);
export const PAYROLL_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-payroll-structure-setup"]: Object.freeze({
    target_model: "hr.salary.rule",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-payroll-salary-rules"]: Object.freeze({
    target_model: "hr.salary.rule",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-payroll-payslip-workflow"]: Object.freeze({
    target_model: "hr.payslip",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-payroll-accounting-linkage"]: Object.freeze({
    target_model: "hr.payslip",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const PAYROLL_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(PAYROLL_CHECKPOINT_METADATA));
function addPayrollDefinition(map, checkpoint_id) { const metadata = PAYROLL_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: PAYROLL_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assemblePayrollOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addPayrollDefinition(map, "checkpoint-payroll-structure-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addPayrollDefinition(map, "checkpoint-payroll-salary-rules");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addPayrollDefinition(map, "checkpoint-payroll-payslip-workflow");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addPayrollDefinition(map, "checkpoint-payroll-accounting-linkage");
  return map; }
