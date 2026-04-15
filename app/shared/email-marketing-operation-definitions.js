import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`email-marketing-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const EMAIL_MARKETING_OP_DEFS_VERSION = "1.2.0";
export const EMAIL_MARKETING_TARGET_METHOD = "write";
// No coverage gaps — mailing.list and mailing.mailing were promoted into ALLOWED_APPLY_MODELS 2026-04-15.
export const EMAIL_MARKETING_COVERAGE_GAP_MODELS = Object.freeze([]);
export const EMAIL_MARKETING_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-email-marketing-mailing-list"]: Object.freeze({
    target_model: "mailing.list",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-email-marketing-sender-configuration"]: Object.freeze({
    target_model: "mailing.mailing",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-email-marketing-unsubscribe-policy"]: Object.freeze({
    target_model: "mailing.mailing",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-email-marketing-campaign-baseline"]: Object.freeze({
    target_model: "mailing.mailing",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const EMAIL_MARKETING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(EMAIL_MARKETING_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addEmailMarketingDefinition(map, checkpoint_id, intended_changes) { const metadata = EMAIL_MARKETING_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: EMAIL_MARKETING_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleEmailMarketingOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (email-marketing-wizard.js): {sending_domain, spf_dkim_dmarc_verified,
  // initial_mailing_list_name, blacklist_enabled, seed_test_address}.
  const capture = isPlainObject(wizard_captures?.["email-marketing"]) ? wizard_captures["email-marketing"] : {};
  // checkpoint-email-marketing-mailing-list → mailing.list.
  // Confirmed writable field on mailing.list (scripts/odoo-confirmed-fields.json): `name` (char, required).
  // wizard_captures.email-marketing.initial_mailing_list_name → mailing.list.name. Non-null only when captured.
  const listName = typeof capture.initial_mailing_list_name === "string" && capture.initial_mailing_list_name.trim() ? capture.initial_mailing_list_name.trim() : null;
  const mailingListChanges = listName ? { name: listName } : null;
  addEmailMarketingDefinition(map, "checkpoint-email-marketing-mailing-list", mailingListChanges);
  // checkpoint-email-marketing-sender-configuration → mailing.mailing.
  // honest-null: sending_domain and spf_dkim_dmarc_verified are domain-level DNS/auth state,
  // not per-record fields on mailing.mailing (no matching confirmed fields). Left null to avoid fabrication.
  addEmailMarketingDefinition(map, "checkpoint-email-marketing-sender-configuration", null);
  // checkpoint-email-marketing-unsubscribe-policy → mailing.mailing. execution_relevance: "None".
  // No governed write occurs; unsubscribe/blacklist policy lives on res.config.settings / ir.config_parameter.
  addEmailMarketingDefinition(map, "checkpoint-email-marketing-unsubscribe-policy", null);
  // checkpoint-email-marketing-campaign-baseline → mailing.mailing.
  // honest-null: wizard does not capture per-campaign subject or mailing_model_id (mailing.mailing requires both).
  // seed_test_address is routing policy, not a confirmed field on mailing.mailing.
  addEmailMarketingDefinition(map, "checkpoint-email-marketing-campaign-baseline", null);
  return map;
}
