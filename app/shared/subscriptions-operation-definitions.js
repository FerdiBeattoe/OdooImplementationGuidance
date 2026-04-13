import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`subscriptions-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const SUBSCRIPTIONS_OP_DEFS_VERSION = "1.1.0";
export const SUBSCRIPTIONS_TARGET_METHOD = "write";
// COVERAGE GAP: product.template not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const SUBSCRIPTIONS_COVERAGE_GAP_MODELS = Object.freeze(["product.template"]);
export const SUBSCRIPTIONS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.SUB_FOUND_001]: Object.freeze({
    target_model: "sale.subscription.plan",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.SUB_DREQ_001]: Object.freeze({
    target_model: "sale.subscription.plan",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.SUB_DREQ_002]: Object.freeze({
    target_model: "sale.subscription.plan",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.SUB_DREQ_003]: Object.freeze({
    target_model: "account.journal",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.SUB_GL_001]: Object.freeze({
    target_model: "sale.subscription.plan",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
  }),
});
export const SUBSCRIPTIONS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(SUBSCRIPTIONS_CHECKPOINT_METADATA));
function addSubscriptionsDefinition(map, checkpoint_id) { const metadata = SUBSCRIPTIONS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: SUBSCRIPTIONS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleSubscriptionsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_002);
  if (answers["FC-01"] === "Full accounting") {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_003);
  }
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_GL_001);
  return map; }
