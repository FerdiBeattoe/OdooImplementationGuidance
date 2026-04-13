import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`sign-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const SIGN_OP_DEFS_VERSION = "1.1.0";
export const SIGN_TARGET_METHOD = "write";

export const SIGN_COVERAGE_GAP_MODELS = Object.freeze([]);
export const SIGN_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.SGN_FOUND_001]: Object.freeze({
    target_model: "sign.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.SGN_DREQ_001]: Object.freeze({
    target_model: "sign.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.SGN_DREQ_002]: Object.freeze({
    target_model: "sign.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
});
export const SIGN_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(SIGN_CHECKPOINT_METADATA));
function addSignDefinition(map, checkpoint_id) { const metadata = SIGN_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: SIGN_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleSignOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addSignDefinition(map, CHECKPOINT_IDS.SGN_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addSignDefinition(map, CHECKPOINT_IDS.SGN_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addSignDefinition(map, CHECKPOINT_IDS.SGN_DREQ_002);
  return map; }
