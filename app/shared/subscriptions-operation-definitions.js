import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`subscriptions-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const SUBSCRIPTIONS_OP_DEFS_VERSION = "1.2.0";
export const SUBSCRIPTIONS_TARGET_METHOD = "write";
export const SUBSCRIPTIONS_COVERAGE_GAP_MODELS = Object.freeze(["product.template"]);
export const SUBSCRIPTIONS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.SUB_FOUND_001]: Object.freeze({ target_model: "sale.subscription.plan", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.SUB_DREQ_001]: Object.freeze({ target_model: "sale.subscription.plan", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.SUB_DREQ_002]: Object.freeze({ target_model: "sale.subscription.plan", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.SUB_DREQ_003]: Object.freeze({ target_model: "account.journal", validation_source: "User_Confirmed", execution_relevance: "Informational", safety_class: "Not_Applicable" }),
  [CHECKPOINT_IDS.SUB_GL_001]: Object.freeze({ target_model: "sale.subscription.plan", validation_source: "User_Confirmed", execution_relevance: "None", safety_class: "Not_Applicable" }),
});
export const SUBSCRIPTIONS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(SUBSCRIPTIONS_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractSubscriptionsCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures.subscriptions) ? wizard_captures.subscriptions : null; }
function addSubscriptionsDefinition(map, checkpoint_id, intended_changes) { const metadata = SUBSCRIPTIONS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: SUBSCRIPTIONS_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleSubscriptionsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  // Assembler alignment with subscriptions-wizard.js capture: { plan_name, billing_period }.
  const subsCapture = isPlainObject(wizard_captures?.subscriptions) ? wizard_captures.subscriptions : {};
  const planName = typeof subsCapture.plan_name === "string" && subsCapture.plan_name.trim() ? subsCapture.plan_name.trim() : null;
  void planName;
  // honest-null: sale.subscription.plan is not present in scripts/odoo-confirmed-fields.json — no field (including `name`)
  // is confirmed for this model. Per HARD RULES (only use confirmed field names; never fabricate),
  // intended_changes must remain null until odoo-confirmed-fields.json is extended to cover sale.subscription.plan.
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_FOUND_001, null);
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_001, null);
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_002, null);
  if (answers["FC-01"] === "Full accounting") {
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_003, null);
  }
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_GL_001, null);
  return map; }
