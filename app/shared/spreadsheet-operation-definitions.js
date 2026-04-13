import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`spreadsheet-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const SPREADSHEET_OP_DEFS_VERSION = "1.1.0";
export const SPREADSHEET_TARGET_METHOD = "write";
// COVERAGE GAP: spreadsheet.template not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: documents.document not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const SPREADSHEET_COVERAGE_GAP_MODELS = Object.freeze(["spreadsheet.template", "documents.document"]);
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
function addSpreadsheetDefinition(map, checkpoint_id) { const metadata = SPREADSHEET_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: SPREADSHEET_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleSpreadsheetOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addSpreadsheetDefinition(map, "checkpoint-spreadsheet-template-baseline");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addSpreadsheetDefinition(map, "checkpoint-spreadsheet-data-sources");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addSpreadsheetDefinition(map, "checkpoint-spreadsheet-access-policy");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addSpreadsheetDefinition(map, "checkpoint-spreadsheet-dashboard");
  return map; }
