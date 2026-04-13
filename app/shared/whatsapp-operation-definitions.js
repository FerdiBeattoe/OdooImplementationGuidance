import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`whatsapp-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const WHATSAPP_OP_DEFS_VERSION = "1.1.0";
export const WHATSAPP_TARGET_METHOD = "write";
// COVERAGE GAP: whatsapp.account not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: whatsapp.template not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const WHATSAPP_COVERAGE_GAP_MODELS = Object.freeze(["whatsapp.account", "whatsapp.template"]);
export const WHATSAPP_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-whatsapp-account-connection"]: Object.freeze({
    target_model: "whatsapp.account",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-whatsapp-message-template"]: Object.freeze({
    target_model: "whatsapp.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-whatsapp-optin-policy"]: Object.freeze({
    target_model: "whatsapp.template",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-whatsapp-document-triggers"]: Object.freeze({
    target_model: "whatsapp.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const WHATSAPP_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(WHATSAPP_CHECKPOINT_METADATA));
function addWhatsappDefinition(map, checkpoint_id) { const metadata = WHATSAPP_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: WHATSAPP_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleWhatsappOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addWhatsappDefinition(map, "checkpoint-whatsapp-account-connection");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addWhatsappDefinition(map, "checkpoint-whatsapp-message-template");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addWhatsappDefinition(map, "checkpoint-whatsapp-optin-policy");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addWhatsappDefinition(map, "checkpoint-whatsapp-document-triggers");
  return map; }
