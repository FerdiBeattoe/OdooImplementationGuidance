import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`loyalty-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const LOYALTY_OP_DEFS_VERSION = "1.1.0";
export const LOYALTY_TARGET_METHOD = "write";
// COVERAGE GAP: loyalty.program not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: loyalty.reward not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const LOYALTY_COVERAGE_GAP_MODELS = Object.freeze(["loyalty.program", "loyalty.reward"]);
export const LOYALTY_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-loyalty-program-setup"]: Object.freeze({
    target_model: "loyalty.program",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-loyalty-reward-rules"]: Object.freeze({
    target_model: "loyalty.reward",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-loyalty-expiry-policy"]: Object.freeze({
    target_model: "loyalty.program",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-loyalty-pos-ecommerce"]: Object.freeze({
    target_model: "loyalty.program",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const LOYALTY_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(LOYALTY_CHECKPOINT_METADATA));
function addLoyaltyDefinition(map, checkpoint_id) { const metadata = LOYALTY_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: LOYALTY_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleLoyaltyOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLoyaltyDefinition(map, "checkpoint-loyalty-program-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLoyaltyDefinition(map, "checkpoint-loyalty-reward-rules");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLoyaltyDefinition(map, "checkpoint-loyalty-expiry-policy");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addLoyaltyDefinition(map, "checkpoint-loyalty-pos-ecommerce");
  return map; }
