import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`discuss-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const DISCUSS_OP_DEFS_VERSION = "1.1.0";
export const DISCUSS_TARGET_METHOD = "write";
// COVERAGE GAP: mail.channel not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const DISCUSS_COVERAGE_GAP_MODELS = Object.freeze(["mail.channel"]);
export const DISCUSS_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-discuss-channel-structure"]: Object.freeze({
    target_model: "mail.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-discuss-messaging-policy"]: Object.freeze({
    target_model: "mail.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-discuss-notification-rules"]: Object.freeze({
    target_model: "res.users",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-discuss-external-email"]: Object.freeze({
    target_model: "mail.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const DISCUSS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(DISCUSS_CHECKPOINT_METADATA));
function addDiscussDefinition(map, checkpoint_id) { const metadata = DISCUSS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: DISCUSS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleDiscussOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addDiscussDefinition(map, "checkpoint-discuss-channel-structure");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addDiscussDefinition(map, "checkpoint-discuss-messaging-policy");
  // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
  addDiscussDefinition(map, "checkpoint-discuss-notification-rules");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addDiscussDefinition(map, "checkpoint-discuss-external-email");
  return map; }
