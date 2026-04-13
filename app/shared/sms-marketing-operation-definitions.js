import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`sms-marketing-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const SMS_MARKETING_OP_DEFS_VERSION = "1.1.0";
export const SMS_MARKETING_TARGET_METHOD = "write";
// COVERAGE GAP: sms.sms not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: mailing.mailing not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const SMS_MARKETING_COVERAGE_GAP_MODELS = Object.freeze(["sms.sms", "mailing.mailing"]);
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
export function assembleSmsMarketingOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addSmsMarketingDefinition(map, "checkpoint-sms-marketing-provider-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addSmsMarketingDefinition(map, "checkpoint-sms-marketing-sender-id");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addSmsMarketingDefinition(map, "checkpoint-sms-marketing-optout-compliance");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addSmsMarketingDefinition(map, "checkpoint-sms-marketing-campaign-baseline");
  return map; }
