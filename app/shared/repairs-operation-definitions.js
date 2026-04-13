import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`repairs-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const REPAIRS_OP_DEFS_VERSION = "1.1.0";
export const REPAIRS_TARGET_METHOD = "write";
// COVERAGE GAP: repair.order not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const REPAIRS_COVERAGE_GAP_MODELS = Object.freeze(["repair.order"]);
export const REPAIRS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.REP_FOUND_001]: Object.freeze({
    target_model: "repair.order",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.REP_DREQ_001]: Object.freeze({
    target_model: "repair.order",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.REP_DREQ_002]: Object.freeze({
    target_model: "repair.order",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.REP_REC_001]: Object.freeze({
    target_model: "repair.order",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
  }),
});
export const REPAIRS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(REPAIRS_CHECKPOINT_METADATA));
function addRepairsDefinition(map, checkpoint_id) { const metadata = REPAIRS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: REPAIRS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleRepairsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addRepairsDefinition(map, CHECKPOINT_IDS.REP_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addRepairsDefinition(map, CHECKPOINT_IDS.REP_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addRepairsDefinition(map, CHECKPOINT_IDS.REP_DREQ_002);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addRepairsDefinition(map, CHECKPOINT_IDS.REP_REC_001);
  return map; }
