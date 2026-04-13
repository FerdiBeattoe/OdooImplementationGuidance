import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`incoming-mail-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const INCOMING_MAIL_OP_DEFS_VERSION = "1.1.0";
export const INCOMING_MAIL_TARGET_METHOD = "write";
// COVERAGE GAP: fetchmail.server not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: mail.alias not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const INCOMING_MAIL_COVERAGE_GAP_MODELS = Object.freeze(["fetchmail.server", "mail.alias"]);
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
function addIncomingMailDefinition(map, checkpoint_id) { const metadata = INCOMING_MAIL_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: INCOMING_MAIL_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleIncomingMailOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addIncomingMailDefinition(map, "checkpoint-incoming-mail-server-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addIncomingMailDefinition(map, "checkpoint-incoming-mail-catchall-address");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addIncomingMailDefinition(map, "checkpoint-incoming-mail-alias-mapping");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addIncomingMailDefinition(map, "checkpoint-incoming-mail-routing-rules");
  return map; }
