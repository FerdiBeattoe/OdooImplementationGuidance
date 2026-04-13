import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`planning-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const PLANNING_OP_DEFS_VERSION = "1.1.0";
export const PLANNING_TARGET_METHOD = "write";
// COVERAGE GAP: planning.role not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: planning.slot not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const PLANNING_COVERAGE_GAP_MODELS = Object.freeze(["planning.role", "planning.slot"]);
export const PLANNING_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-planning-role-setup"]: Object.freeze({
    target_model: "planning.role",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-planning-shift-template"]: Object.freeze({
    target_model: "planning.slot",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-planning-resource-allocation"]: Object.freeze({
    target_model: "planning.slot",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-planning-publish-workflow"]: Object.freeze({
    target_model: "planning.slot",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const PLANNING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(PLANNING_CHECKPOINT_METADATA));
function addPlanningDefinition(map, checkpoint_id) { const metadata = PLANNING_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: PLANNING_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assemblePlanningOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addPlanningDefinition(map, "checkpoint-planning-role-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addPlanningDefinition(map, "checkpoint-planning-shift-template");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addPlanningDefinition(map, "checkpoint-planning-resource-allocation");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addPlanningDefinition(map, "checkpoint-planning-publish-workflow");
  return map; }
