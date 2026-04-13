import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`website-ecommerce-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const WEBSITE_ECOMMERCE_OP_DEFS_VERSION = "1.1.0";
export const WEBSITE_ECOMMERCE_TARGET_METHOD = "write";
// COVERAGE GAP: product.template not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const WEBSITE_ECOMMERCE_COVERAGE_GAP_MODELS = Object.freeze(["product.template"]);
export const WEBSITE_ECOMMERCE_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.WEB_FOUND_001]: Object.freeze({
    target_model: "website",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.WEB_DREQ_001]: Object.freeze({
    target_model: "website",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.WEB_DREQ_002]: Object.freeze({
    target_model: "website",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.WEB_DREQ_003]: Object.freeze({
    target_model: "payment.provider",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.WEB_DREQ_004]: Object.freeze({
    target_model: "delivery.carrier",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.WEB_DREQ_005]: Object.freeze({
    target_model: "payment.provider",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.WEB_GL_001]: Object.freeze({
    target_model: "website",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
  }),
});
export const WEBSITE_ECOMMERCE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(WEBSITE_ECOMMERCE_CHECKPOINT_METADATA));
function addWebsiteEcommerceDefinition(map, checkpoint_id) { const metadata = WEBSITE_ECOMMERCE_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: WEBSITE_ECOMMERCE_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleWebsiteEcommerceOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_002);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_003);
  if (answers["OP-01"] === true || answers["OP-01"] === "Yes") {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_004);
  }
  if (answers["SC-03"] === true || answers["SC-03"] === "Yes") {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_005);
  }
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_GL_001);
  return map; }
