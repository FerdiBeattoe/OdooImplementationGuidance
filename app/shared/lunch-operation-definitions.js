import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`lunch-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const LUNCH_OP_DEFS_VERSION = "1.1.0";
export const LUNCH_TARGET_METHOD = "write";
// COVERAGE GAP: lunch.supplier not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: lunch.product not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const LUNCH_COVERAGE_GAP_MODELS = Object.freeze(["lunch.supplier", "lunch.product"]);
export const LUNCH_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-lunch-supplier-setup"]: Object.freeze({
    target_model: "lunch.supplier",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-lunch-product-catalogue"]: Object.freeze({
    target_model: "lunch.product",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-lunch-cash-move-policy"]: Object.freeze({
    target_model: "lunch.product",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-lunch-employee-access"]: Object.freeze({
    target_model: "lunch.product",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const LUNCH_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(LUNCH_CHECKPOINT_METADATA));
function addLunchDefinition(map, checkpoint_id) { const metadata = LUNCH_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: LUNCH_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleLunchOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLunchDefinition(map, "checkpoint-lunch-supplier-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLunchDefinition(map, "checkpoint-lunch-product-catalogue");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLunchDefinition(map, "checkpoint-lunch-cash-move-policy");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLunchDefinition(map, "checkpoint-lunch-employee-access");
  return map; }
