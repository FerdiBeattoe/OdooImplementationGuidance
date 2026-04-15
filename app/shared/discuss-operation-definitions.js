import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`discuss-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const DISCUSS_OP_DEFS_VERSION = "1.2.0";
export const DISCUSS_TARGET_METHOD = "write";
// discuss.channel is in ALLOWED_APPLY_MODELS (Odoo 19 canonical; mail.channel was renamed).
export const DISCUSS_COVERAGE_GAP_MODELS = Object.freeze([]);
export const DISCUSS_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-discuss-channel-structure"]: Object.freeze({
    target_model: "discuss.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-discuss-messaging-policy"]: Object.freeze({
    target_model: "discuss.channel",
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
    target_model: "discuss.channel",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const DISCUSS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(DISCUSS_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addDiscussDefinition(map, checkpoint_id, intended_changes) { const metadata = DISCUSS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: DISCUSS_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractChannelStructureChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // discuss.channel required fields: name (char), channel_type (selection). Wizard repeater
  // captures a list of channel names; we seed the first one as a concrete create target.
  // channel_type "channel" is the public/team-channel variant (vs chat/group/ai_chat/etc.).
  const channels = Array.isArray(capture.default_channels) ? capture.default_channels : null;
  if (!channels || channels.length === 0) return null;
  const firstRaw = channels[0];
  const name = typeof firstRaw === "string" ? firstRaw.trim() : "";
  if (!name) return null;
  return { name, channel_type: "channel" };
}
export function assembleDiscussOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (discuss-wizard.js): {default_channels (repeater, required min 1),
  // default_channel_visibility (public|private), notification_default (all_messages|
  // mentions_only), use_video_calls (bool)}.
  const capture = isPlainObject(wizard_captures?.discuss) ? wizard_captures.discuss : null;
  // checkpoint-discuss-channel-structure → discuss.channel (name + channel_type).
  addDiscussDefinition(map, "checkpoint-discuss-channel-structure", extractChannelStructureChanges(capture));
  // checkpoint-discuss-messaging-policy → discuss.channel.
  // honest-null: default_channel_visibility would map to group_public_id (many2one to res.groups);
  // the wizard stores a public|private string, not a group id, so we cannot resolve it here
  // without fabricating a group reference.
  addDiscussDefinition(map, "checkpoint-discuss-messaging-policy", null);
  // checkpoint-discuss-notification-rules → res.users. execution_relevance "None" — no write.
  addDiscussDefinition(map, "checkpoint-discuss-notification-rules", null);
  // checkpoint-discuss-external-email → discuss.channel.
  // honest-null: the wizard has no external-email field; the use_video_calls/notification_default
  // captures are company-level policies (res.config.settings), not channel-level.
  addDiscussDefinition(map, "checkpoint-discuss-external-email", null);
  return map;
}
