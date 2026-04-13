import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`voip-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const VOIP_OP_DEFS_VERSION = "1.1.0";
export const VOIP_TARGET_METHOD = "write";
// COVERAGE GAP: voip.provider not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const VOIP_COVERAGE_GAP_MODELS = Object.freeze(["voip.provider"]);
export const VOIP_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-voip-provider-connection"]: Object.freeze({
    target_model: "voip.provider",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-voip-extension-assignment"]: Object.freeze({
    target_model: "res.users",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-voip-call-logging"]: Object.freeze({
    target_model: "voip.provider",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-voip-crm-integration"]: Object.freeze({
    target_model: "voip.provider",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const VOIP_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(VOIP_CHECKPOINT_METADATA));
function addVoipDefinition(map, checkpoint_id) { const metadata = VOIP_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: VOIP_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleVoipOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addVoipDefinition(map, "checkpoint-voip-provider-connection");
  // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
  addVoipDefinition(map, "checkpoint-voip-extension-assignment");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addVoipDefinition(map, "checkpoint-voip-call-logging");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addVoipDefinition(map, "checkpoint-voip-crm-integration");
  return map; }
