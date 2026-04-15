import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`events-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const EVENTS_OP_DEFS_VERSION = "1.2.0";
export const EVENTS_TARGET_METHOD = "write";
// event.event and event.tag are in ALLOWED_APPLY_MODELS (promoted 2026-04-15).
export const EVENTS_COVERAGE_GAP_MODELS = Object.freeze([]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addEventsDefinition(map, checkpoint_id, intended_changes) { const metadata = EVENTS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: EVENTS_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleEventsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (events-wizard.js): {event_type_name, ticket_model, payment_provider_ready,
  // event_categories[], default_reminder_days}.
  const capture = isPlainObject(wizard_captures?.events) ? wizard_captures.events : {};
  // checkpoint-events-type-configuration → event.tag. Confirmed writable: name (char, required).
  // wizard.event_type_name → event.tag.name as a write against a pre-existing tag record.
  const typeName = typeof capture.event_type_name === "string" && capture.event_type_name.trim() ? capture.event_type_name.trim() : null;
  addEventsDefinition(map, "checkpoint-events-type-configuration", typeName ? { name: typeName } : null);
  // checkpoint-events-registration-workflow → event.event.
  // honest-null: event.event.name, date_begin, date_end, date_tz are all required and not captured
  // by the wizard (it configures ticket model and provider readiness, not specific event dates).
  addEventsDefinition(map, "checkpoint-events-registration-workflow", null);
  // checkpoint-events-communication-templates → event.event. execution_relevance "None". No write.
  addEventsDefinition(map, "checkpoint-events-communication-templates", null);
  // checkpoint-events-reporting-baseline → event.event.
  // honest-null: default_reminder_days is scheduler/mail-automation policy, not a confirmed field on event.event.
  addEventsDefinition(map, "checkpoint-events-reporting-baseline", null);
  return map;
}
