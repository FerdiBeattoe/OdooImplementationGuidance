import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`incoming-mail-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const INCOMING_MAIL_OP_DEFS_VERSION = "1.2.0";
export const INCOMING_MAIL_TARGET_METHOD = "write";
// fetchmail.server and mail.alias are in ALLOWED_APPLY_MODELS (added 2026-04-15).
export const INCOMING_MAIL_COVERAGE_GAP_MODELS = Object.freeze([]);
export const INCOMING_MAIL_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-incoming-mail-server-setup"]: Object.freeze({
    target_model: "fetchmail.server",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-incoming-mail-catchall-address"]: Object.freeze({
    target_model: "mail.alias",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-incoming-mail-alias-mapping"]: Object.freeze({
    target_model: "mail.alias",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-incoming-mail-routing-rules"]: Object.freeze({
    target_model: "mail.alias",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const INCOMING_MAIL_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(INCOMING_MAIL_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addIncomingMailDefinition(map, checkpoint_id, intended_changes) { const metadata = INCOMING_MAIL_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: INCOMING_MAIL_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractServerSetupChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // fetchmail.server required fields: name (char), server_type (selection).
  // Wizard fetching_method captures {catchall_forward, imap, pop}; only imap/pop map to a
  // fetchmail record. catchall_forward means no fetchmail server is needed (MX routes direct).
  const method = capture.fetching_method;
  if (method === "imap" || method === "pop") {
    return { name: method.toUpperCase() + " fetcher", server_type: method };
  }
  return null;
}
export function assembleIncomingMailOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (incoming-mail-wizard.js): {alias_domain, fetching_method
  // (catchall_forward|imap|pop), routed_aliases (repeater), bounce_address,
  // mx_forwarding_verified}.
  const capture = isPlainObject(wizard_captures?.["incoming-mail"]) ? wizard_captures["incoming-mail"] : null;
  // checkpoint-incoming-mail-server-setup → fetchmail.server.
  addIncomingMailDefinition(map, "checkpoint-incoming-mail-server-setup", extractServerSetupChanges(capture));
  // checkpoint-incoming-mail-catchall-address → mail.alias.
  // honest-null: catchall and bounce addresses are system-level (ir.config_parameter
  // mail.catchall.alias / mail.bounce.alias), not rows on mail.alias. The wizard's
  // alias_domain also maps to mail.alias.domain (a different model) rather than mail.alias itself.
  addIncomingMailDefinition(map, "checkpoint-incoming-mail-catchall-address", null);
  // checkpoint-incoming-mail-alias-mapping → mail.alias. execution_relevance "None".
  addIncomingMailDefinition(map, "checkpoint-incoming-mail-alias-mapping", null);
  // checkpoint-incoming-mail-routing-rules → mail.alias.
  // honest-null: routed_aliases is free-text ("sales@ — CRM leads") and cannot be parsed into
  // the required {alias_name, alias_model_id (many2one), alias_contact} shape without
  // fabricating the target model reference.
  addIncomingMailDefinition(map, "checkpoint-incoming-mail-routing-rules", null);
  return map;
}
