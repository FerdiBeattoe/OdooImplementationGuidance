import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`timesheets-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const TIMESHEETS_OP_DEFS_VERSION = "1.1.0";
export const TIMESHEETS_TARGET_METHOD = "write";
// COVERAGE GAP: hr.timesheet not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: project.task not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const TIMESHEETS_COVERAGE_GAP_MODELS = Object.freeze(["hr.timesheet", "project.task"]);
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
export function assembleTimesheetsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addTimesheetsDefinition(map, "checkpoint-timesheets-policy-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addTimesheetsDefinition(map, "checkpoint-timesheets-project-tracking");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addTimesheetsDefinition(map, "checkpoint-timesheets-employee-submission");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addTimesheetsDefinition(map, "checkpoint-timesheets-manager-approval");
  return map; }
