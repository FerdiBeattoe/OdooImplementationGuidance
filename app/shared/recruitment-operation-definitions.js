import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`recruitment-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const RECRUITMENT_OP_DEFS_VERSION = "1.1.0";
export const RECRUITMENT_TARGET_METHOD = "write";
// COVERAGE GAP: hr.applicant not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const RECRUITMENT_COVERAGE_GAP_MODELS = Object.freeze(["hr.applicant"]);
export const RECRUITMENT_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-recruitment-pipeline-stages"]: Object.freeze({
    target_model: "hr.applicant",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-recruitment-job-position"]: Object.freeze({
    target_model: "hr.job",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-recruitment-interview-process"]: Object.freeze({
    target_model: "hr.applicant",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-recruitment-offer-workflow"]: Object.freeze({
    target_model: "hr.applicant",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const RECRUITMENT_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(RECRUITMENT_CHECKPOINT_METADATA));
function addRecruitmentDefinition(map, checkpoint_id) { const metadata = RECRUITMENT_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: RECRUITMENT_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleRecruitmentOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addRecruitmentDefinition(map, "checkpoint-recruitment-pipeline-stages");
  // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
  addRecruitmentDefinition(map, "checkpoint-recruitment-job-position");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addRecruitmentDefinition(map, "checkpoint-recruitment-interview-process");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addRecruitmentDefinition(map, "checkpoint-recruitment-offer-workflow");
  return map; }
