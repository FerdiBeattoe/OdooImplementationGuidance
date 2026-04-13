import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`appraisals-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const APPRAISALS_OP_DEFS_VERSION = "1.1.0";
export const APPRAISALS_TARGET_METHOD = "write";
// COVERAGE GAP: hr.appraisal not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: hr.appraisal.goal not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const APPRAISALS_COVERAGE_GAP_MODELS = Object.freeze(["hr.appraisal", "hr.appraisal.goal"]);
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
function addAppraisalsDefinition(map, checkpoint_id) { const metadata = APPRAISALS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: APPRAISALS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleAppraisalsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAppraisalsDefinition(map, "checkpoint-appraisals-cycle-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAppraisalsDefinition(map, "checkpoint-appraisals-goal-template");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAppraisalsDefinition(map, "checkpoint-appraisals-rating-scale");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addAppraisalsDefinition(map, "checkpoint-appraisals-manager-access");
  return map; }
