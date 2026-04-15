import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`sms-marketing-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const SMS_MARKETING_OP_DEFS_VERSION = "1.2.0";
export const SMS_MARKETING_TARGET_METHOD = "write";
// sms.sms and mailing.mailing are in ALLOWED_APPLY_MODELS. The wizard captures are
// provider-level / policy-level settings that don't target individual message records.
export const SMS_MARKETING_COVERAGE_GAP_MODELS = Object.freeze([]);
export const SMS_MARKETING_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-sms-marketing-provider-setup"]: Object.freeze({
    target_model: "sms.sms",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-sms-marketing-sender-id"]: Object.freeze({
    target_model: "sms.sms",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-sms-marketing-optout-compliance"]: Object.freeze({
    target_model: "sms.sms",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-sms-marketing-campaign-baseline"]: Object.freeze({
    target_model: "mailing.mailing",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const SMS_MARKETING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(SMS_MARKETING_CHECKPOINT_METADATA));
function addSmsMarketingDefinition(map, checkpoint_id) { const metadata = SMS_MARKETING_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: SMS_MARKETING_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleSmsMarketingOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (sms-marketing-wizard.js): {sending_mode, sender_id, opt_in_source,
  // initial_list_name, seed_test_number, coordinate_with_email}.
  // honest-null across all four:
  //   - provider-setup and sender-id concern IAP credit wiring / gateway credentials, which
  //     live on iap.account / ir.config_parameter, not on per-message sms.sms records (which
  //     hold {number, body, partner_id, state}).
  //   - optout-compliance is execution_relevance None.
  //   - campaign-baseline targets mailing.mailing, which requires {subject, schedule_type,
  //     state, mailing_type, mailing_model_id (ir.model many2one)} per campaign; the wizard
  //     gives only an initial_list_name (targets mailing.list, a different model).
  void wizard_captures;
  addSmsMarketingDefinition(map, "checkpoint-sms-marketing-provider-setup");
  addSmsMarketingDefinition(map, "checkpoint-sms-marketing-sender-id");
  addSmsMarketingDefinition(map, "checkpoint-sms-marketing-optout-compliance");
  addSmsMarketingDefinition(map, "checkpoint-sms-marketing-campaign-baseline");
  return map;
}
