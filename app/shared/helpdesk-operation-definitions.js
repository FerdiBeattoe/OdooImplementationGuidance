import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`helpdesk-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const HELPDESK_OP_DEFS_VERSION = "1.1.0";
export const HELPDESK_TARGET_METHOD = "write";
// COVERAGE GAP: helpdesk.team not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: helpdesk.ticket not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const HELPDESK_COVERAGE_GAP_MODELS = Object.freeze(["helpdesk.team", "helpdesk.ticket"]);
export const HELPDESK_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-helpdesk-team-setup"]: Object.freeze({
    target_model: "helpdesk.team",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-helpdesk-ticket-stages"]: Object.freeze({
    target_model: "helpdesk.ticket",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-helpdesk-sla-policy"]: Object.freeze({
    target_model: "helpdesk.ticket",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-helpdesk-escalation-rules"]: Object.freeze({
    target_model: "helpdesk.ticket",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const HELPDESK_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(HELPDESK_CHECKPOINT_METADATA));
function addHelpdeskDefinition(map, checkpoint_id) { const metadata = HELPDESK_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: HELPDESK_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleHelpdeskOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addHelpdeskDefinition(map, "checkpoint-helpdesk-team-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addHelpdeskDefinition(map, "checkpoint-helpdesk-ticket-stages");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addHelpdeskDefinition(map, "checkpoint-helpdesk-sla-policy");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addHelpdeskDefinition(map, "checkpoint-helpdesk-escalation-rules");
  return map; }
