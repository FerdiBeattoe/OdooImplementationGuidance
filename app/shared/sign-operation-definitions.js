import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`sign-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const SIGN_OP_DEFS_VERSION = "1.2.0";
export const SIGN_TARGET_METHOD = "write";
export const SIGN_COVERAGE_GAP_MODELS = Object.freeze([]);
export const SIGN_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.SGN_FOUND_001]: Object.freeze({ target_model: "sign.template", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.SGN_DREQ_001]: Object.freeze({ target_model: "sign.template", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.SGN_DREQ_002]: Object.freeze({ target_model: "sign.template", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
});
export const SIGN_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(SIGN_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractSignCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures.sign) ? wizard_captures.sign : null; }
function buildSignChanges(capture) { if (!isPlainObject(capture)) return null; const name = typeof capture.template_name === "string" ? capture.template_name.trim() : ""; return name ? { name } : null; }
function addSignDefinition(map, checkpoint_id, intended_changes) { const metadata = SIGN_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: SIGN_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleSignOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) { const map = createOperationDefinitionsMap(); const signChanges = buildSignChanges(extractSignCapture(wizard_captures));
    addSignDefinition(map, CHECKPOINT_IDS.SGN_FOUND_001, signChanges);
    addSignDefinition(map, CHECKPOINT_IDS.SGN_DREQ_001, signChanges);
    addSignDefinition(map, CHECKPOINT_IDS.SGN_DREQ_002, signChanges);
  return map; }
