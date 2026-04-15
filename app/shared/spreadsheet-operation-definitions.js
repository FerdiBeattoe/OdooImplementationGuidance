import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`spreadsheet-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const SPREADSHEET_OP_DEFS_VERSION = "1.2.0";
export const SPREADSHEET_TARGET_METHOD = "write";
// spreadsheet.template and documents.document are in ALLOWED_APPLY_MODELS.
export const SPREADSHEET_COVERAGE_GAP_MODELS = Object.freeze([]);
export const SPREADSHEET_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-spreadsheet-template-baseline"]: Object.freeze({
    target_model: "spreadsheet.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-spreadsheet-data-sources"]: Object.freeze({
    target_model: "documents.document",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-spreadsheet-access-policy"]: Object.freeze({
    target_model: "spreadsheet.template",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-spreadsheet-dashboard"]: Object.freeze({
    target_model: "spreadsheet.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const SPREADSHEET_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(SPREADSHEET_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addSpreadsheetDefinition(map, checkpoint_id, intended_changes) { const metadata = SPREADSHEET_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: SPREADSHEET_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractTemplateBaselineChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // spreadsheet.template.name is the sole required char field (the rest of the schema is the
  // binary template body).
  const templates = Array.isArray(capture.core_templates) ? capture.core_templates : null;
  if (!templates || templates.length === 0) return null;
  const first = typeof templates[0] === "string" ? templates[0].trim() : "";
  if (!first) return null;
  return { name: first };
}
export function assembleSpreadsheetOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (spreadsheet-wizard.js): {core_templates (repeater), template_owner,
  // refresh_cadence, retire_external_excel, restricted_workspaces (repeater)}.
  const capture = isPlainObject(wizard_captures?.spreadsheet) ? wizard_captures.spreadsheet : null;
  // checkpoint-spreadsheet-template-baseline → spreadsheet.template (name seed from first core template).
  addSpreadsheetDefinition(map, "checkpoint-spreadsheet-template-baseline", extractTemplateBaselineChanges(capture));
  // checkpoint-spreadsheet-data-sources → documents.document.
  // honest-null: documents.document requires {type, document_token, access_via_link,
  // access_internal} per record and the wizard does not supply any of these — data sources are
  // configured inside the spreadsheet body, not as document records.
  addSpreadsheetDefinition(map, "checkpoint-spreadsheet-data-sources", null);
  // checkpoint-spreadsheet-access-policy → spreadsheet.template. execution_relevance "None".
  addSpreadsheetDefinition(map, "checkpoint-spreadsheet-access-policy", null);
  // checkpoint-spreadsheet-dashboard → spreadsheet.template.
  // honest-null: the wizard captures a single list of "core templates" without distinguishing
  // a dashboard from a template; seeding a second record with the same name source would be
  // arbitrary.
  addSpreadsheetDefinition(map, "checkpoint-spreadsheet-dashboard", null);
  return map;
}
