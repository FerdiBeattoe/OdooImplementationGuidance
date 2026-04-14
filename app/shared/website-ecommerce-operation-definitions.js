import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`website-ecommerce-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const WEBSITE_ECOMMERCE_OP_DEFS_VERSION = "1.2.0";
export const WEBSITE_ECOMMERCE_TARGET_METHOD = "write";
export const WEBSITE_ECOMMERCE_COVERAGE_GAP_MODELS = Object.freeze(["product.template"]);
export const WEBSITE_ECOMMERCE_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.WEB_FOUND_001]: Object.freeze({ target_model: "website", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.WEB_DREQ_001]: Object.freeze({ target_model: "website", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.WEB_DREQ_002]: Object.freeze({ target_model: "website", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.WEB_DREQ_003]: Object.freeze({ target_model: "payment.provider", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.WEB_DREQ_004]: Object.freeze({ target_model: "delivery.carrier", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.WEB_DREQ_005]: Object.freeze({ target_model: "payment.provider", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.WEB_GL_001]: Object.freeze({ target_model: "website", validation_source: "User_Confirmed", execution_relevance: "None", safety_class: "Not_Applicable" }),
});
export const WEBSITE_ECOMMERCE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(WEBSITE_ECOMMERCE_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractWebsiteEcommerceCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures["website-ecommerce"]) ? wizard_captures["website-ecommerce"] : null; }
function buildWebsiteChanges(capture) {
  if (!isPlainObject(capture)) return null;
  const name = typeof capture.website_name === "string" ? capture.website_name.trim() : "";
  const defaultLanguage = typeof capture.default_language === "string" ? capture.default_language.trim() : "";
  if (!name && !defaultLanguage) return null;
  return { name: name || null, default_lang_id: defaultLanguage ? null : null };
}
function buildCarrierChanges(capture) {
  if (!isPlainObject(capture)) return null;
  const name = typeof capture.delivery_carrier_name === "string" ? capture.delivery_carrier_name.trim() : "";
  const deliveryType = typeof capture.carrier_type === "string" ? capture.carrier_type.trim() : "";
  if (!name && !deliveryType) return null;
  return { name: name || null, delivery_type: deliveryType || null };
}
function addWebsiteEcommerceDefinition(map, checkpoint_id, intended_changes) { const metadata = WEBSITE_ECOMMERCE_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: WEBSITE_ECOMMERCE_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleWebsiteEcommerceOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {}; const capture = extractWebsiteEcommerceCapture(wizard_captures); const websiteChanges = buildWebsiteChanges(capture); const carrierChanges = buildCarrierChanges(capture);
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_FOUND_001, websiteChanges);
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_001, websiteChanges);
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_002, websiteChanges);
    // honest-null: payment.provider details are not collected by this wizard, so truthful intended_changes remain null.
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_003, null);
  if (answers["OP-01"] === true || answers["OP-01"] === "Yes") {
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_004, carrierChanges);
  }
  if (answers["SC-03"] === true || answers["SC-03"] === "Yes") {
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_DREQ_005, null);
  }
    addWebsiteEcommerceDefinition(map, CHECKPOINT_IDS.WEB_GL_001, websiteChanges);
  return map; }
