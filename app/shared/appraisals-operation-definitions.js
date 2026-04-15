import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`appraisals-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const APPRAISALS_OP_DEFS_VERSION = "1.2.0";
export const APPRAISALS_TARGET_METHOD = "write";
// hr.appraisal and hr.appraisal.goal are in ALLOWED_APPLY_MODELS.
export const APPRAISALS_COVERAGE_GAP_MODELS = Object.freeze([]);
export const APPRAISALS_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-appraisals-cycle-setup"]: Object.freeze({
    target_model: "hr.appraisal",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-appraisals-goal-template"]: Object.freeze({
    target_model: "hr.appraisal.goal",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-appraisals-rating-scale"]: Object.freeze({
    target_model: "hr.appraisal",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-appraisals-manager-access"]: Object.freeze({
    target_model: "hr.appraisal",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const APPRAISALS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(APPRAISALS_CHECKPOINT_METADATA));
function addAppraisalsDefinition(map, checkpoint_id, intended_changes) { const metadata = APPRAISALS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: APPRAISALS_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleAppraisalsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (appraisals-wizard.js): {cycle_cadence, pilot_department,
  // feedback_template_name, includes_360_feedback}. All four captures are program/template
  // policy — they live on hr.appraisal.plan / hr.appraisal.template / res.config.settings.
  // None map to per-record fields on hr.appraisal or hr.appraisal.goal (employee_id and
  // date_close are required on hr.appraisal; name is required on hr.appraisal.goal but
  // feedback_template_name is the wrong semantic target for a goal record).
  void wizard_captures;
  addAppraisalsDefinition(map, "checkpoint-appraisals-cycle-setup", null);
  addAppraisalsDefinition(map, "checkpoint-appraisals-goal-template", null);
  // execution_relevance "None" — no write.
  addAppraisalsDefinition(map, "checkpoint-appraisals-rating-scale", null);
  addAppraisalsDefinition(map, "checkpoint-appraisals-manager-access", null);
  return map;
}
