import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`payroll-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const PAYROLL_OP_DEFS_VERSION = "1.2.0";
export const PAYROLL_TARGET_METHOD = "write";
// hr.salary.rule and hr.payslip are in ALLOWED_APPLY_MODELS.
export const PAYROLL_COVERAGE_GAP_MODELS = Object.freeze([]);
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
export function assemblePayrollOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (payroll-wizard.js): {country_localisation, pay_frequency,
  // default_salary_structure, parallel_run_period, attendance_integration,
  // finance_sign_off_obtained}.
  // honest-null across the board:
  //   - hr.salary.rule requires {name, code, struct_id (many2one to hr.payroll.structure),
  //     sequence, condition_select, condition_python, amount_select}. default_salary_structure
  //     is a structure label, not a rule — target_model mismatch. country_localisation is a
  //     free-text country name rather than a res.country reference.
  //   - hr.payslip requires {name, employee_id, date_from, date_to, company_id} per-record;
  //     parallel_run_period is a single label ("2026-03 pay period"), not a date range pair,
  //     and employee_id must resolve per payslip.
  void wizard_captures;
  addPayrollDefinition(map, "checkpoint-payroll-structure-setup");
  addPayrollDefinition(map, "checkpoint-payroll-salary-rules");
  // execution_relevance "None" — no write.
  addPayrollDefinition(map, "checkpoint-payroll-payslip-workflow");
  addPayrollDefinition(map, "checkpoint-payroll-accounting-linkage");
  return map;
}
