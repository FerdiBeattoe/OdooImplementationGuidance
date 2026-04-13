import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`calendar-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const CALENDAR_OP_DEFS_VERSION = "1.1.0";
export const CALENDAR_TARGET_METHOD = "write";
// COVERAGE GAP: calendar.event not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const CALENDAR_COVERAGE_GAP_MODELS = Object.freeze(["calendar.event"]);
export const CALENDAR_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-calendar-sync-setup"]: Object.freeze({
    target_model: "calendar.event",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-calendar-meeting-type"]: Object.freeze({
    target_model: "calendar.event",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-calendar-availability-rules"]: Object.freeze({
    target_model: "res.users",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-calendar-scope-policy"]: Object.freeze({
    target_model: "res.users",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const CALENDAR_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(CALENDAR_CHECKPOINT_METADATA));
function addCalendarDefinition(map, checkpoint_id) { const metadata = CALENDAR_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: CALENDAR_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleCalendarOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addCalendarDefinition(map, "checkpoint-calendar-sync-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addCalendarDefinition(map, "checkpoint-calendar-meeting-type");
  // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
  addCalendarDefinition(map, "checkpoint-calendar-availability-rules");
  // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
  addCalendarDefinition(map, "checkpoint-calendar-scope-policy");
  return map; }
