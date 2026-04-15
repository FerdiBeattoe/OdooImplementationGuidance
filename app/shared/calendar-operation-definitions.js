import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`calendar-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const CALENDAR_OP_DEFS_VERSION = "1.2.0";
export const CALENDAR_TARGET_METHOD = "write";
// calendar.event is in ALLOWED_APPLY_MODELS.
export const CALENDAR_COVERAGE_GAP_MODELS = Object.freeze([]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addCalendarDefinition(map, checkpoint_id, intended_changes) { const metadata = CALENDAR_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: CALENDAR_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractScopePolicyChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // res.users confirmed boolean: google_synchronization_stopped ("Google Synchronization stopped").
  // sync_provider in {google, both} with oauth_client_ready → sync enabled → stopped=false.
  // sync_provider in {microsoft, none} → Google sync off → stopped=true.
  const provider = capture.sync_provider;
  if (provider === "google" || provider === "both") {
    if (capture.oauth_client_ready === true) return { google_synchronization_stopped: false };
    return null; // OAuth not confirmed ready — do not enable sync without it (honest-null).
  }
  if (provider === "microsoft" || provider === "none") {
    return { google_synchronization_stopped: true };
  }
  return null;
}
export function assembleCalendarOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (calendar-wizard.js): {sync_provider, oauth_client_ready,
  // sync_activities_from_crm, source_of_truth_policy}.
  const capture = isPlainObject(wizard_captures?.calendar) ? wizard_captures.calendar : null;
  // checkpoint-calendar-sync-setup → calendar.event.
  // honest-null: sync policy is user/company-level (google_synchronization_stopped on res.users,
  // not need_sync on calendar.event — the latter is a per-event status flag, not a config).
  addCalendarDefinition(map, "checkpoint-calendar-sync-setup", null);
  // checkpoint-calendar-meeting-type → calendar.event.
  // honest-null: calendar.event.videocall_source exists but the wizard does not capture it.
  // Source-of-truth policy is a res.config.settings notion, not a calendar.event field.
  addCalendarDefinition(map, "checkpoint-calendar-meeting-type", null);
  // checkpoint-calendar-availability-rules → res.users. execution_relevance "None".
  addCalendarDefinition(map, "checkpoint-calendar-availability-rules", null);
  // checkpoint-calendar-scope-policy → res.users (google_synchronization_stopped).
  addCalendarDefinition(map, "checkpoint-calendar-scope-policy", extractScopePolicyChanges(capture));
  return map;
}
