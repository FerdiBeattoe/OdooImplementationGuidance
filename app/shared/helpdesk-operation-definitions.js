import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`helpdesk-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const HELPDESK_OP_DEFS_VERSION = "1.2.0";
export const HELPDESK_TARGET_METHOD = "write";
// helpdesk.team and helpdesk.ticket are in ALLOWED_APPLY_MODELS.
// Coverage gap: helpdesk.stage and helpdesk.sla are not in the allowlist, so stages and SLA
// policy cannot be materialised by operation-definitions (pipeline stages and SLA policies
// are their own models, not fields on helpdesk.ticket).
export const HELPDESK_COVERAGE_GAP_MODELS = Object.freeze(["helpdesk.stage", "helpdesk.sla"]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addHelpdeskDefinition(map, checkpoint_id, intended_changes) { const metadata = HELPDESK_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: HELPDESK_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractTeamChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // helpdesk.team confirmed fields (scripts/odoo-confirmed-fields.json):
  //   name (char, required), alias_name (char), auto_assignment (bool),
  //   assign_method (selection [randomly, balanced, tags]).
  const changes = {};
  const teamName = typeof capture.team_name === "string" && capture.team_name.trim() ? capture.team_name.trim() : null;
  if (teamName) changes.name = teamName;
  // Derive alias_name from the local-part of team_alias_email (pre-@ segment).
  const aliasEmail = typeof capture.team_alias_email === "string" ? capture.team_alias_email.trim() : "";
  const atIdx = aliasEmail.indexOf("@");
  const aliasLocal = atIdx > 0 ? aliasEmail.slice(0, atIdx) : "";
  if (aliasLocal) changes.alias_name = aliasLocal;
  // assignment_rule: "manual" → auto_assignment false; "random" → randomly; "balanced" → balanced.
  if (capture.assignment_rule === "manual") {
    changes.auto_assignment = false;
  } else if (capture.assignment_rule === "random") {
    changes.auto_assignment = true;
    changes.assign_method = "randomly";
  } else if (capture.assignment_rule === "balanced") {
    changes.auto_assignment = true;
    changes.assign_method = "balanced";
  }
  return Object.keys(changes).length > 0 ? changes : null;
}
export function assembleHelpdeskOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (helpdesk-wizard.js): {team_name, team_alias_email, assignment_rule,
  // stages, sla_response_hours, sla_owner}.
  const capture = isPlainObject(wizard_captures?.helpdesk) ? wizard_captures.helpdesk : null;
  // checkpoint-helpdesk-team-setup → helpdesk.team (maps to name / alias_name / auto_assignment / assign_method).
  addHelpdeskDefinition(map, "checkpoint-helpdesk-team-setup", extractTeamChanges(capture));
  // checkpoint-helpdesk-ticket-stages → helpdesk.ticket.
  // honest-null: wizard.stages is pipeline configuration on helpdesk.stage (not in allowlist),
  // not per-ticket fields. No confirmed helpdesk.ticket field accepts a stage-name list.
  addHelpdeskDefinition(map, "checkpoint-helpdesk-ticket-stages", null);
  // checkpoint-helpdesk-sla-policy → helpdesk.ticket. execution_relevance "None".
  // SLA policies live on helpdesk.sla (not in allowlist); no governed write performed.
  addHelpdeskDefinition(map, "checkpoint-helpdesk-sla-policy", null);
  // checkpoint-helpdesk-escalation-rules → helpdesk.ticket.
  // honest-null: sla_response_hours / sla_owner are policy configuration, not confirmed fields
  // on helpdesk.ticket (response-hours fields on the ticket are computed/readonly metrics).
  addHelpdeskDefinition(map, "checkpoint-helpdesk-escalation-rules", null);
  return map;
}
