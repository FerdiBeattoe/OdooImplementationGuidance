import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`subscriptions-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const SUBSCRIPTIONS_OP_DEFS_VERSION = "1.2.0";
export const SUBSCRIPTIONS_TARGET_METHOD = "write";
// sale.subscription.plan and account.journal are both in ALLOWED_APPLY_MODELS.
export const SUBSCRIPTIONS_COVERAGE_GAP_MODELS = Object.freeze([]);
export const SUBSCRIPTIONS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.SUB_FOUND_001]: Object.freeze({ target_model: "sale.subscription.plan", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.SUB_DREQ_001]: Object.freeze({ target_model: "sale.subscription.plan", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.SUB_DREQ_002]: Object.freeze({ target_model: "sale.subscription.plan", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.SUB_DREQ_003]: Object.freeze({ target_model: "account.journal", validation_source: "User_Confirmed", execution_relevance: "Informational", safety_class: "Not_Applicable" }),
  [CHECKPOINT_IDS.SUB_GL_001]: Object.freeze({ target_model: "sale.subscription.plan", validation_source: "User_Confirmed", execution_relevance: "None", safety_class: "Not_Applicable" }),
});
export const SUBSCRIPTIONS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(SUBSCRIPTIONS_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addSubscriptionsDefinition(map, checkpoint_id, intended_changes) { const metadata = SUBSCRIPTIONS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: SUBSCRIPTIONS_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractPlanFoundationChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // sale.subscription.plan.name is a required char. Seed from wizard plan_name; partial against
  // the full required-field set (billing_period_value, billing_period_unit,
  // user_closable_options) is intentional — those are not policy-level wizard captures.
  const name = typeof capture.plan_name === "string" ? capture.plan_name.trim() : "";
  if (!name) return null;
  return { name };
}
export function assembleSubscriptionsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  // Wizard capture shape (subscriptions-wizard.js): {plan_name, billing_recurrence,
  // renewal_mode, dunning_steps_days, payment_provider_ready, mrr_reporting_enabled}.
  const capture = isPlainObject(wizard_captures?.subscriptions) ? wizard_captures.subscriptions : null;
  // SUB_FOUND_001 → sale.subscription.plan (name seed from plan_name).
  addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_FOUND_001, extractPlanFoundationChanges(capture));
  // SUB_DREQ_001 → sale.subscription.plan.
  // honest-null: billing_recurrence has four options (weekly/monthly/quarterly/annual) but the
  // Odoo field pair is {billing_period_value (int), billing_period_unit (week|month|year)} —
  // "quarterly" requires value=3/unit=month and no wizard-side guarantee that the mapping
  // matches how finance will actually configure the plan.
  addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_001, null);
  // SUB_DREQ_002 → sale.subscription.plan.
  // honest-null: renewal_mode (automatic|manual_confirmation) does not map to
  // user_closable_options (at_date|end_of_period); these answer different questions.
  addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_002, null);
  if (answers["FC-01"] === "Full accounting") {
    // SUB_DREQ_003 → account.journal. execution_relevance "Informational" — no write.
    addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_DREQ_003, null);
  }
  // SUB_GL_001 → sale.subscription.plan. execution_relevance "None".
  addSubscriptionsDefinition(map, CHECKPOINT_IDS.SUB_GL_001, null);
  return map;
}
