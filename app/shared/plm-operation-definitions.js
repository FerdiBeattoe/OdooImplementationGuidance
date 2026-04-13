import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`plm-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const PLM_OP_DEFS_VERSION = "1.1.0";
export const PLM_TARGET_METHOD = "write";
// COVERAGE GAP: mrp.eco not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const PLM_COVERAGE_GAP_MODELS = Object.freeze(["mrp.eco"]);
export const PLM_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.PLM_FOUND_001]: Object.freeze({
    target_model: "mrp.eco.type",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.PLM_DREQ_001]: Object.freeze({
    target_model: "mrp.eco.type",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.PLM_DREQ_002]: Object.freeze({
    target_model: "mrp.eco.type",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.PLM_REC_001]: Object.freeze({
    target_model: "mrp.eco.type",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
});
export const PLM_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(PLM_CHECKPOINT_METADATA));
function addPlmDefinition(map, checkpoint_id) { const metadata = PLM_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: PLM_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assemblePlmOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addPlmDefinition(map, CHECKPOINT_IDS.PLM_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addPlmDefinition(map, CHECKPOINT_IDS.PLM_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addPlmDefinition(map, CHECKPOINT_IDS.PLM_DREQ_002);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addPlmDefinition(map, CHECKPOINT_IDS.PLM_REC_001);
  return map; }
