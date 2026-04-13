import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`studio-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const STUDIO_OP_DEFS_VERSION = "1.1.0";
export const STUDIO_TARGET_METHOD = "write";
// COVERAGE GAP: ir.model not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: ir.ui.view not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const STUDIO_COVERAGE_GAP_MODELS = Object.freeze(["ir.model", "ir.ui.view"]);
export const STUDIO_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-studio-field-governance"]: Object.freeze({
    target_model: "ir.model",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-studio-view-modification"]: Object.freeze({
    target_model: "ir.ui.view",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-studio-report-customisation"]: Object.freeze({
    target_model: "ir.ui.view",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-studio-access-control"]: Object.freeze({
    target_model: "ir.model",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const STUDIO_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(STUDIO_CHECKPOINT_METADATA));
function addStudioDefinition(map, checkpoint_id) { const metadata = STUDIO_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: STUDIO_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleStudioOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addStudioDefinition(map, "checkpoint-studio-field-governance");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addStudioDefinition(map, "checkpoint-studio-view-modification");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addStudioDefinition(map, "checkpoint-studio-report-customisation");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addStudioDefinition(map, "checkpoint-studio-access-control");
  return map; }
