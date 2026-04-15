import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`whatsapp-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const WHATSAPP_OP_DEFS_VERSION = "1.2.0";
export const WHATSAPP_TARGET_METHOD = "write";
// whatsapp.account and whatsapp.template are both in ALLOWED_APPLY_MODELS.
export const WHATSAPP_COVERAGE_GAP_MODELS = Object.freeze([]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addWhatsappDefinition(map, checkpoint_id, intended_changes) { const metadata = WHATSAPP_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: WHATSAPP_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractAccountConnectionChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // whatsapp.account.phone_uid (char) and .account_uid (char) are required and map directly to
  // the Meta "Phone Number ID" and "WhatsApp Business Account ID" fields the wizard captures.
  // The remaining required fields (app_uid, app_secret, token, notify_user_ids) are secret
  // credentials the wizard does not collect.
  const phone_uid = typeof capture.phone_number_id === "string" ? capture.phone_number_id.trim() : "";
  const account_uid = typeof capture.business_account_id === "string" ? capture.business_account_id.trim() : "";
  if (!phone_uid || !account_uid) return null;
  return { phone_uid, account_uid };
}
export function assembleWhatsappOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (whatsapp-wizard.js): {meta_verified_number, phone_number_id,
  // business_account_id, webhook_verify_token, first_template_names, enterprise_instance_confirmed,
  // routes_to_helpdesk}.
  const capture = isPlainObject(wizard_captures?.whatsapp) ? wizard_captures.whatsapp : null;
  // checkpoint-whatsapp-account-connection → whatsapp.account ({phone_uid, account_uid}).
  addWhatsappDefinition(map, "checkpoint-whatsapp-account-connection", extractAccountConnectionChanges(capture));
  // checkpoint-whatsapp-message-template → whatsapp.template.
  // honest-null: whatsapp.template requires {sequence, model_id (ir.model m2o), phone_field,
  // lang_code, template_type} per record. The wizard's first_template_names are free-text
  // template names without any of these bindings.
  addWhatsappDefinition(map, "checkpoint-whatsapp-message-template", null);
  // checkpoint-whatsapp-optin-policy → whatsapp.template. execution_relevance "None".
  addWhatsappDefinition(map, "checkpoint-whatsapp-optin-policy", null);
  // checkpoint-whatsapp-document-triggers → whatsapp.template.
  // honest-null: document triggers require model_id + phone_field bindings that the wizard
  // does not capture.
  addWhatsappDefinition(map, "checkpoint-whatsapp-document-triggers", null);
  return map;
}
