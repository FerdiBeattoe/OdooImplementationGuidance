import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`live-chat-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const LIVE_CHAT_OP_DEFS_VERSION = "1.1.0";
export const LIVE_CHAT_TARGET_METHOD = "write";
// COVERAGE GAP: im_livechat.channel not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const LIVE_CHAT_COVERAGE_GAP_MODELS = Object.freeze(["im_livechat.channel"]);
export const LIVE_CHAT_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-live-chat-channel-setup"]: Object.freeze({
    target_model: "im_livechat.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-live-chat-operator-assignment"]: Object.freeze({
    target_model: "res.users",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-live-chat-chatbot-baseline"]: Object.freeze({
    target_model: "im_livechat.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-live-chat-website-integration"]: Object.freeze({
    target_model: "im_livechat.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-live-chat-offline-policy"]: Object.freeze({
    target_model: "im_livechat.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const LIVE_CHAT_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(LIVE_CHAT_CHECKPOINT_METADATA));
function addLiveChatDefinition(map, checkpoint_id) { const metadata = LIVE_CHAT_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: LIVE_CHAT_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleLiveChatOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLiveChatDefinition(map, "checkpoint-live-chat-channel-setup");
  // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
  addLiveChatDefinition(map, "checkpoint-live-chat-operator-assignment");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLiveChatDefinition(map, "checkpoint-live-chat-chatbot-baseline");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLiveChatDefinition(map, "checkpoint-live-chat-website-integration");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLiveChatDefinition(map, "checkpoint-live-chat-offline-policy");
  return map; }
