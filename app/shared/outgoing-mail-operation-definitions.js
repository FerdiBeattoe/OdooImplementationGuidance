import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`outgoing-mail-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const OUTGOING_MAIL_OP_DEFS_VERSION = "1.1.0";
export const OUTGOING_MAIL_TARGET_METHOD = "write";
// COVERAGE GAP: ir.mail_server not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: ir.config_parameter not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const OUTGOING_MAIL_COVERAGE_GAP_MODELS = Object.freeze(["ir.mail_server", "ir.config_parameter"]);
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
function addOutgoingMailDefinition(map, checkpoint_id) { const metadata = OUTGOING_MAIL_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: OUTGOING_MAIL_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleOutgoingMailOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-smtp-configuration");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-sender-address");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-alias-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-deliverability");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addOutgoingMailDefinition(map, "checkpoint-outgoing-mail-test-send");
  return map; }
