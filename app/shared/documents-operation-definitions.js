import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`documents-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const DOCUMENTS_OP_DEFS_VERSION = "1.2.0";
export const DOCUMENTS_TARGET_METHOD = "write";
export const DOCUMENTS_COVERAGE_GAP_MODELS = Object.freeze(["documents.share"]);
export const DOCUMENTS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.DOC_FOUND_001]: Object.freeze({ target_model: "documents.folder", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.DOC_DREQ_001]: Object.freeze({ target_model: "documents.folder", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.DOC_REC_001]: Object.freeze({ target_model: "documents.folder", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
});
export const DOCUMENTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(DOCUMENTS_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractDocumentsCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures.documents) ? wizard_captures.documents : null; }
function addDocumentsDefinition(map, checkpoint_id, intended_changes) { const metadata = DOCUMENTS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: DOCUMENTS_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleDocumentsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Assembler alignment with documents-wizard.js capture: { root_folder_name, subfolder_names }.
  const docsCapture = isPlainObject(wizard_captures?.documents) ? wizard_captures.documents : {};
  const rootFolderName = typeof docsCapture.root_folder_name === "string" && docsCapture.root_folder_name.trim() ? docsCapture.root_folder_name.trim() : null;
  void rootFolderName;
  // honest-null: documents.folder is not present in scripts/odoo-confirmed-fields.json — no field (including `name`)
  // is confirmed for this model. Per HARD RULES (only use confirmed field names; never fabricate),
  // intended_changes must remain null until odoo-confirmed-fields.json is extended to cover documents.folder.
  addDocumentsDefinition(map, CHECKPOINT_IDS.DOC_FOUND_001, null);
  addDocumentsDefinition(map, CHECKPOINT_IDS.DOC_DREQ_001, null);
  addDocumentsDefinition(map, CHECKPOINT_IDS.DOC_REC_001, null);
  return map;
}
