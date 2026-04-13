import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`projects-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const PROJECTS_OP_DEFS_VERSION = "1.1.0";
export const PROJECTS_TARGET_METHOD = "write";

export const PROJECTS_COVERAGE_GAP_MODELS = Object.freeze([]);
export const PROJECTS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.PRJ_FOUND_001]: Object.freeze({
    target_model: "project.project",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.PRJ_DREQ_001]: Object.freeze({
    target_model: "project.project",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.PRJ_DREQ_002]: Object.freeze({
    target_model: "project.task.type",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.PRJ_DREQ_003]: Object.freeze({
    target_model: "project.task.type",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.PRJ_DREQ_004]: Object.freeze({
    target_model: "project.project",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.PRJ_GL_001]: Object.freeze({
    target_model: "project.project",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
  }),
});
export const PROJECTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(PROJECTS_CHECKPOINT_METADATA));
function addProjectsDefinition(map, checkpoint_id) { const metadata = PROJECTS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: PROJECTS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleProjectsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addProjectsDefinition(map, CHECKPOINT_IDS.PRJ_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addProjectsDefinition(map, CHECKPOINT_IDS.PRJ_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addProjectsDefinition(map, CHECKPOINT_IDS.PRJ_DREQ_002);
  if (answers["RM-02"] === true || answers["RM-02"] === "Yes") {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addProjectsDefinition(map, CHECKPOINT_IDS.PRJ_DREQ_003);
  }
  if (answers["FC-05"] === true || answers["FC-05"] === "Yes") {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addProjectsDefinition(map, CHECKPOINT_IDS.PRJ_DREQ_004);
  }
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addProjectsDefinition(map, CHECKPOINT_IDS.PRJ_GL_001);
  return map; }
