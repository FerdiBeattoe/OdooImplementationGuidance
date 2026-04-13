import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`email-marketing-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const EMAIL_MARKETING_OP_DEFS_VERSION = "1.1.0";
export const EMAIL_MARKETING_TARGET_METHOD = "write";
// COVERAGE GAP: mailing.list not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: mailing.mailing not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const EMAIL_MARKETING_COVERAGE_GAP_MODELS = Object.freeze(["mailing.list", "mailing.mailing"]);
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
function addEmailMarketingDefinition(map, checkpoint_id) { const metadata = EMAIL_MARKETING_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: EMAIL_MARKETING_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleEmailMarketingOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addEmailMarketingDefinition(map, "checkpoint-email-marketing-mailing-list");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addEmailMarketingDefinition(map, "checkpoint-email-marketing-sender-configuration");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addEmailMarketingDefinition(map, "checkpoint-email-marketing-unsubscribe-policy");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addEmailMarketingDefinition(map, "checkpoint-email-marketing-campaign-baseline");
  return map; }
