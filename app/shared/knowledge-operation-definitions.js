import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`knowledge-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const KNOWLEDGE_OP_DEFS_VERSION = "1.2.0";
export const KNOWLEDGE_TARGET_METHOD = "write";
// knowledge.article is in ALLOWED_APPLY_MODELS.
export const KNOWLEDGE_COVERAGE_GAP_MODELS = Object.freeze([]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addKnowledgeDefinition(map, checkpoint_id, intended_changes) { const metadata = KNOWLEDGE_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: KNOWLEDGE_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractBaseStructureChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // knowledge.article fields: name (char, Title), category (selection [workspace,private,shared]).
  // top_level_workspaces is a repeater of workspace names; the first one seeds a root article
  // in the "workspace" category (the shared/team variant, vs "private" personal articles).
  const workspaces = Array.isArray(capture.top_level_workspaces) ? capture.top_level_workspaces : null;
  if (!workspaces || workspaces.length === 0) return null;
  const firstRaw = workspaces[0];
  const name = typeof firstRaw === "string" ? firstRaw.trim() : "";
  if (!name) return null;
  return { name, category: "workspace" };
}
const ACCESS_TO_INTERNAL_PERMISSION = Object.freeze({
  company: "read",   // everyone in the company can read
  restricted: "none", // no internal access by default — explicit grants only
});
function extractScopeChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // knowledge.article.internal_permission selection=[write,read,none]. default_access "public"
  // is about external/website publishing (is_published) which is a different axis — honest-null
  // rather than conflating "public" with any internal_permission value.
  const mapped = ACCESS_TO_INTERNAL_PERMISSION[capture.default_access];
  if (!mapped) return null;
  return { internal_permission: mapped };
}
export function assembleKnowledgeOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (knowledge-wizard.js): {top_level_workspaces (repeater), workspace_owner,
  // default_access (public|company|restricted), helpdesk_linkage, migrate_existing_wiki}.
  const capture = isPlainObject(wizard_captures?.knowledge) ? wizard_captures.knowledge : null;
  // checkpoint-knowledge-base-structure → knowledge.article (seed first workspace).
  addKnowledgeDefinition(map, "checkpoint-knowledge-base-structure", extractBaseStructureChanges(capture));
  // checkpoint-knowledge-article-template → knowledge.article.
  // honest-null: template creation requires a template body which the wizard does not capture.
  addKnowledgeDefinition(map, "checkpoint-knowledge-article-template", null);
  // checkpoint-knowledge-access-rights → knowledge.article. execution_relevance "None" — no write.
  addKnowledgeDefinition(map, "checkpoint-knowledge-access-rights", null);
  // checkpoint-knowledge-scope → knowledge.article.internal_permission.
  addKnowledgeDefinition(map, "checkpoint-knowledge-scope", extractScopeChanges(capture));
  return map;
}
