import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`attendance-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const ATTENDANCE_OP_DEFS_VERSION = "1.1.0";
export const ATTENDANCE_TARGET_METHOD = "write";
// COVERAGE GAP: hr.attendance not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const ATTENDANCE_COVERAGE_GAP_MODELS = Object.freeze(["hr.attendance"]);
export const ATTENDANCE_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-attendance-mode-setup"]: Object.freeze({
    target_model: "res.company",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-attendance-overtime-policy"]: Object.freeze({
    target_model: "hr.attendance",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-attendance-reporting-baseline"]: Object.freeze({
    target_model: "hr.attendance",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
});
export const ATTENDANCE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(ATTENDANCE_CHECKPOINT_METADATA));
function addAttendanceDefinition(map, checkpoint_id) { const metadata = ATTENDANCE_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: ATTENDANCE_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleAttendanceOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
  addAttendanceDefinition(map, "checkpoint-attendance-mode-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAttendanceDefinition(map, "checkpoint-attendance-overtime-policy");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAttendanceDefinition(map, "checkpoint-attendance-reporting-baseline");
  return map; }
