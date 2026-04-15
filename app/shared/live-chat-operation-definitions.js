import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`live-chat-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const LIVE_CHAT_OP_DEFS_VERSION = "1.2.0";
export const LIVE_CHAT_TARGET_METHOD = "write";
// im_livechat.channel is in ALLOWED_APPLY_MODELS.
export const LIVE_CHAT_COVERAGE_GAP_MODELS = Object.freeze([]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addLiveChatDefinition(map, checkpoint_id, intended_changes) { const metadata = LIVE_CHAT_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: LIVE_CHAT_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractChannelSetupChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // im_livechat.channel.name is the required channel label.
  const name = typeof capture.channel_name === "string" ? capture.channel_name.trim() : "";
  if (!name) return null;
  return { name };
}
export function assembleLiveChatOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (live-chat-wizard.js): {channel_name, operators (repeater), coverage_hours,
  // fallback_mode (chatbot|offline_form|hide_widget), convert_to_ticket, widget_page_rule}.
  const capture = isPlainObject(wizard_captures?.["live-chat"]) ? wizard_captures["live-chat"] : null;
  // checkpoint-live-chat-channel-setup → im_livechat.channel (name seed).
  addLiveChatDefinition(map, "checkpoint-live-chat-channel-setup", extractChannelSetupChanges(capture));
  // checkpoint-live-chat-operator-assignment → res.users.
  // honest-null: operators is a repeater of human names (e.g. "Jane Smith"); we cannot resolve
  // these to res.users ids without a search query, and name collisions are common.
  addLiveChatDefinition(map, "checkpoint-live-chat-operator-assignment", null);
  // checkpoint-live-chat-chatbot-baseline → im_livechat.channel.
  // honest-null: chatbot flows live on im_livechat.chatbot.script (separate model with steps and
  // triggers), not on im_livechat.channel fields. fallback_mode="chatbot" gates the decision
  // but does not provide the script body.
  addLiveChatDefinition(map, "checkpoint-live-chat-chatbot-baseline", null);
  // checkpoint-live-chat-website-integration → im_livechat.channel. execution_relevance "None".
  addLiveChatDefinition(map, "checkpoint-live-chat-website-integration", null);
  // checkpoint-live-chat-offline-policy → im_livechat.channel.
  // honest-null: fallback_mode selects a policy (chatbot vs offline_form vs hide_widget); none
  // of these map to a single im_livechat.channel boolean. Offline forms are website-level
  // snippets and hide_widget is driven by coverage_hours (website.visitor schedule, not channel).
  addLiveChatDefinition(map, "checkpoint-live-chat-offline-policy", null);
  return map;
}
