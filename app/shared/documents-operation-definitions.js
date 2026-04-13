import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`documents-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const DOCUMENTS_OP_DEFS_VERSION = "1.1.0";
export const DOCUMENTS_TARGET_METHOD = "write";
// COVERAGE GAP: documents.share not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const DOCUMENTS_COVERAGE_GAP_MODELS = Object.freeze(["documents.share"]);
export const DOCUMENTS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.DOC_FOUND_001]: Object.freeze({
    target_model: "documents.folder",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.DOC_DREQ_001]: Object.freeze({
    target_model: "documents.folder",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.DOC_REC_001]: Object.freeze({
    target_model: "documents.folder",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
});
export const DOCUMENTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(DOCUMENTS_CHECKPOINT_METADATA));
function addDocumentsDefinition(map, checkpoint_id) { const metadata = DOCUMENTS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: DOCUMENTS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleDocumentsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addDocumentsDefinition(map, CHECKPOINT_IDS.DOC_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addDocumentsDefinition(map, CHECKPOINT_IDS.DOC_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addDocumentsDefinition(map, CHECKPOINT_IDS.DOC_REC_001);
  return map; }
