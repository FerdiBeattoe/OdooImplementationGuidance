import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`planning-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const PLANNING_OP_DEFS_VERSION = "1.2.0";
export const PLANNING_TARGET_METHOD = "write";
// planning.role and planning.slot are in ALLOWED_APPLY_MODELS.
export const PLANNING_COVERAGE_GAP_MODELS = Object.freeze([]);
export const PLANNING_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-planning-role-setup"]: Object.freeze({
    target_model: "planning.role",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-planning-shift-template"]: Object.freeze({
    target_model: "planning.slot",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-planning-resource-allocation"]: Object.freeze({
    target_model: "planning.slot",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-planning-publish-workflow"]: Object.freeze({
    target_model: "planning.slot",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const PLANNING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(PLANNING_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addPlanningDefinition(map, checkpoint_id, intended_changes) { const metadata = PLANNING_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: PLANNING_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractRoleSetupChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // planning.role.name is the required char field that labels a role.
  const roles = Array.isArray(capture.planning_roles) ? capture.planning_roles : null;
  if (!roles || roles.length === 0) return null;
  const first = typeof roles[0] === "string" ? roles[0].trim() : "";
  if (!first) return null;
  return { name: first };
}
export function assemblePlanningOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (planning-wizard.js): {planning_roles (repeater), shift_template_names
  // (repeater), publish_cadence (weekly|fortnightly|monthly), self_service_claims,
  // link_to_timesheets}.
  const capture = isPlainObject(wizard_captures?.planning) ? wizard_captures.planning : null;
  // checkpoint-planning-role-setup → planning.role (name seed from first role label).
  addPlanningDefinition(map, "checkpoint-planning-role-setup", extractRoleSetupChanges(capture));
  // checkpoint-planning-shift-template → planning.slot.
  // honest-null: planning.slot requires company_id (many2one) and in practice start_datetime /
  // end_datetime per record; shift_template_names are free-text labels like "Morning
  // (07:00-15:00)" that we cannot parse into a datetime pair, and templates actually live on
  // planning.slot.template (a separate model) rather than on planning.slot itself.
  addPlanningDefinition(map, "checkpoint-planning-shift-template", null);
  // checkpoint-planning-resource-allocation → planning.slot. execution_relevance "None".
  addPlanningDefinition(map, "checkpoint-planning-resource-allocation", null);
  // checkpoint-planning-publish-workflow → planning.slot.
  // honest-null: publish_cadence selects weekly/fortnightly/monthly, but there is no single
  // planning.slot cadence field — publishing is an action on a date range of slots, not a
  // field write.
  addPlanningDefinition(map, "checkpoint-planning-publish-workflow", null);
  return map;
}
