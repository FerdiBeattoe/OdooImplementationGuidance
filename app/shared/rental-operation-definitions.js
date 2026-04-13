import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`rental-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const RENTAL_OP_DEFS_VERSION = "1.1.0";
export const RENTAL_TARGET_METHOD = "write";
// COVERAGE GAP: product.template not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: sale.order not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const RENTAL_COVERAGE_GAP_MODELS = Object.freeze(["product.template", "sale.order"]);
export const RENTAL_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.RNT_FOUND_001]: Object.freeze({
    target_model: "product.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.RNT_DREQ_001]: Object.freeze({
    target_model: "product.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.RNT_DREQ_002]: Object.freeze({
    target_model: "sale.order",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.RNT_GL_001]: Object.freeze({
    target_model: "sale.order",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
  }),
});
export const RENTAL_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(RENTAL_CHECKPOINT_METADATA));
function addRentalDefinition(map, checkpoint_id) { const metadata = RENTAL_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: RENTAL_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleRentalOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addRentalDefinition(map, CHECKPOINT_IDS.RNT_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addRentalDefinition(map, CHECKPOINT_IDS.RNT_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addRentalDefinition(map, CHECKPOINT_IDS.RNT_DREQ_002);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addRentalDefinition(map, CHECKPOINT_IDS.RNT_GL_001);
  return map; }
