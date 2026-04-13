import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`knowledge-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const KNOWLEDGE_OP_DEFS_VERSION = "1.1.0";
export const KNOWLEDGE_TARGET_METHOD = "write";
// COVERAGE GAP: knowledge.article not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const KNOWLEDGE_COVERAGE_GAP_MODELS = Object.freeze(["knowledge.article"]);
export const KNOWLEDGE_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-knowledge-base-structure"]: Object.freeze({
    target_model: "knowledge.article",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-knowledge-article-template"]: Object.freeze({
    target_model: "knowledge.article",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-knowledge-access-rights"]: Object.freeze({
    target_model: "knowledge.article",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-knowledge-scope"]: Object.freeze({
    target_model: "knowledge.article",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const KNOWLEDGE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(KNOWLEDGE_CHECKPOINT_METADATA));
function addKnowledgeDefinition(map, checkpoint_id) { const metadata = KNOWLEDGE_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: KNOWLEDGE_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleKnowledgeOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addKnowledgeDefinition(map, "checkpoint-knowledge-base-structure");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addKnowledgeDefinition(map, "checkpoint-knowledge-article-template");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addKnowledgeDefinition(map, "checkpoint-knowledge-access-rights");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addKnowledgeDefinition(map, "checkpoint-knowledge-scope");
  return map; }
