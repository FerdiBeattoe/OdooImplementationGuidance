import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`timesheets-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const TIMESHEETS_OP_DEFS_VERSION = "1.2.0";
export const TIMESHEETS_TARGET_METHOD = "write";
// COVERAGE GAP: hr.timesheet not in ALLOWED_APPLY_MODELS (timesheet entries are stored in
// account.analytic.line, which also is not allowlisted).
// project.task IS in ALLOWED_APPLY_MODELS but the wizard captures are policy-level (cadence,
// approval chain, rounding) that do not map to per-task fields.
export const TIMESHEETS_COVERAGE_GAP_MODELS = Object.freeze(["hr.timesheet"]);
export const TIMESHEETS_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-timesheets-policy-setup"]: Object.freeze({
    target_model: "hr.timesheet",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-timesheets-project-tracking"]: Object.freeze({
    target_model: "project.task",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-timesheets-employee-submission"]: Object.freeze({
    target_model: "hr.timesheet",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-timesheets-manager-approval"]: Object.freeze({
    target_model: "project.task",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const TIMESHEETS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(TIMESHEETS_CHECKPOINT_METADATA));
function addTimesheetsDefinition(map, checkpoint_id) { const metadata = TIMESHEETS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: TIMESHEETS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleTimesheetsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (timesheets-wizard.js): {submission_cadence, approval_chain,
  // billing_link_enabled, rounding_minutes, reminder_schedule}. All policy-level.
  // honest-null across all four:
  //   - policy-setup and employee-submission target hr.timesheet which is not allowlisted.
  //   - project-tracking and manager-approval target project.task which requires name + state
  //     per record; the wizard does not produce task seeds.
  void wizard_captures;
  addTimesheetsDefinition(map, "checkpoint-timesheets-policy-setup");
  addTimesheetsDefinition(map, "checkpoint-timesheets-project-tracking");
  addTimesheetsDefinition(map, "checkpoint-timesheets-employee-submission");
  addTimesheetsDefinition(map, "checkpoint-timesheets-manager-approval");
  return map;
}
