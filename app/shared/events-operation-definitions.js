import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`events-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const EVENTS_OP_DEFS_VERSION = "1.1.0";
export const EVENTS_TARGET_METHOD = "write";
// COVERAGE GAP: event.tag not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: event.event not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const EVENTS_COVERAGE_GAP_MODELS = Object.freeze(["event.tag", "event.event"]);
export const EVENTS_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-events-type-configuration"]: Object.freeze({
    target_model: "event.tag",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-events-registration-workflow"]: Object.freeze({
    target_model: "event.event",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-events-communication-templates"]: Object.freeze({
    target_model: "event.event",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-events-reporting-baseline"]: Object.freeze({
    target_model: "event.event",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const EVENTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(EVENTS_CHECKPOINT_METADATA));
function addEventsDefinition(map, checkpoint_id) { const metadata = EVENTS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: EVENTS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleEventsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addEventsDefinition(map, "checkpoint-events-type-configuration");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addEventsDefinition(map, "checkpoint-events-registration-workflow");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addEventsDefinition(map, "checkpoint-events-communication-templates");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addEventsDefinition(map, "checkpoint-events-reporting-baseline");
  return map; }
