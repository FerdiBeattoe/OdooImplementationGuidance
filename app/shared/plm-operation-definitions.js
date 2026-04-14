import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`plm-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const PLM_OP_DEFS_VERSION = "1.2.0";
export const PLM_TARGET_METHOD = "write";
export const PLM_COVERAGE_GAP_MODELS = Object.freeze(["mrp.eco"]);
export const PLM_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.PLM_FOUND_001]: Object.freeze({ target_model: "mrp.eco.type", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.PLM_DREQ_001]: Object.freeze({ target_model: "mrp.eco.type", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.PLM_DREQ_002]: Object.freeze({ target_model: "mrp.eco.type", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.PLM_REC_001]: Object.freeze({ target_model: "mrp.eco.type", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
});
export const PLM_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(PLM_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractPlmCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures.plm) ? wizard_captures.plm : null; }
function addPlmDefinition(map, checkpoint_id, intended_changes) { const metadata = PLM_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: PLM_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assemblePlmOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) { const map = createOperationDefinitionsMap(); const capture = extractPlmCapture(wizard_captures); void capture;
    // honest-null: mrp.eco.type is not confirmed in scripts/odoo-confirmed-fields.json, so intended_changes must remain null.
    addPlmDefinition(map, CHECKPOINT_IDS.PLM_FOUND_001, null);
    addPlmDefinition(map, CHECKPOINT_IDS.PLM_DREQ_001, null);
    addPlmDefinition(map, CHECKPOINT_IDS.PLM_DREQ_002, null);
    addPlmDefinition(map, CHECKPOINT_IDS.PLM_REC_001, null);
  return map; }
