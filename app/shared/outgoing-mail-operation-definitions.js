import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`outgoing-mail-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const OUTGOING_MAIL_OP_DEFS_VERSION = "1.2.0";
export const OUTGOING_MAIL_TARGET_METHOD = "write";
// ir.mail_server and ir.config_parameter are in ALLOWED_APPLY_MODELS.
export const OUTGOING_MAIL_COVERAGE_GAP_MODELS = Object.freeze([]);
export const OUTGOING_MAIL_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-outgoing-mail-smtp-configuration"]: Object.freeze({
    target_model: "ir.mail_server",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-outgoing-mail-sender-address"]: Object.freeze({
    target_model: "ir.config_parameter",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-outgoing-mail-alias-setup"]: Object.freeze({
    target_model: "ir.config_parameter",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-outgoing-mail-deliverability"]: Object.freeze({
    target_model: "ir.mail_server",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-outgoing-mail-test-send"]: Object.freeze({
    target_model: "ir.mail_server",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const OUTGOING_MAIL_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(OUTGOING_MAIL_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addOutgoingMailDefinition(map, checkpoint_id, intended_changes) { const metadata = OUTGOING_MAIL_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: OUTGOING_MAIL_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function deriveSmtpAuthentication(smtp_provider, auth_mode) {
  // ir.mail_server.smtp_authentication selection=[login,certificate,cli,gmail,outlook].
  // OAuth2 + Gmail/Microsoft365 pick the provider-specific values; anything else falls back to
  // "login" (username+password or app password flows).
  if (auth_mode === "oauth2") {
    if (smtp_provider === "google_workspace") return "gmail";
    if (smtp_provider === "microsoft_365") return "outlook";
  }
  if (smtp_provider === "custom_smtp" || smtp_provider === "odoo_default") return "login";
  if (auth_mode === "app_password" || auth_mode === "smtp_basic" || auth_mode === "api_key") return "login";
  return null;
}
function extractSmtpConfigurationChanges(capture) {
  if (!isPlainObject(capture)) return null;
  const smtp_authentication = deriveSmtpAuthentication(capture.smtp_provider, capture.auth_mode);
  if (!smtp_authentication) return null;
  return { smtp_authentication };
}
export function assembleOutgoingMailOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (outgoing-mail-wizard.js): {smtp_provider, auth_mode,
  // default_from_address, spf_dkim_dmarc_published, per_department_senders,
  // department_from_addresses}.
  const capture = isPlainObject(wizard_captures?.["outgoing-mail"]) ? wizard_captures["outgoing-mail"] : null;
  // checkpoint-outgoing-mail-smtp-configuration → ir.mail_server.smtp_authentication.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-smtp-configuration", extractSmtpConfigurationChanges(capture));
  // checkpoint-outgoing-mail-sender-address → ir.config_parameter.
  // honest-null: ir.config_parameter writes are keyed (e.g. mail.default.from); the key
  // identifies the record, not a change to it. intended_changes=={value: X} alone is unsafe
  // because the target record identity must be chosen by the apply engine via key, and we
  // have no contract here for passing the key in intended_changes.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-sender-address", null);
  // checkpoint-outgoing-mail-alias-setup → ir.config_parameter. Same reasoning as above.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-alias-setup", null);
  // checkpoint-outgoing-mail-deliverability → ir.mail_server. execution_relevance "None".
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-deliverability", null);
  // checkpoint-outgoing-mail-test-send → ir.mail_server.
  // honest-null: test-send is an action (sending a probe email) rather than a field write.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-test-send", null);
  return map;
}
