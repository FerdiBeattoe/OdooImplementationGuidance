import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`referrals-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const REFERRALS_OP_DEFS_VERSION = "1.2.0";
export const REFERRALS_TARGET_METHOD = "write";
// COVERAGE GAP: hr.referral.stage not in ALLOWED_APPLY_MODELS.
// COVERAGE GAP: hr.referral not in ALLOWED_APPLY_MODELS.
// Intended changes for these models must remain null until the write gate expands.
export const REFERRALS_COVERAGE_GAP_MODELS = Object.freeze(["hr.referral.stage", "hr.referral"]);
export const REFERRALS_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-referrals-stage-setup"]: Object.freeze({
    target_model: "hr.referral.stage",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-referrals-reward-policy"]: Object.freeze({
    target_model: "hr.referral",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-referrals-eligibility-rules"]: Object.freeze({
    target_model: "hr.referral",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-referrals-tracking-configuration"]: Object.freeze({
    target_model: "hr.referral",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const REFERRALS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(REFERRALS_CHECKPOINT_METADATA));
function addReferralsDefinition(map, checkpoint_id) { const metadata = REFERRALS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: REFERRALS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleReferralsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (referrals-wizard.js): {reward_trigger_stage, reward_type, reward_amount,
  // reward_currency, publicise_plan}. All target hr.referral.stage or hr.referral, neither of
  // which is in ALLOWED_APPLY_MODELS yet — intended_changes must stay null here regardless of
  // wizard completion.
  void wizard_captures;
  addReferralsDefinition(map, "checkpoint-referrals-stage-setup");
  addReferralsDefinition(map, "checkpoint-referrals-reward-policy");
  // execution_relevance "None" — no write.
  addReferralsDefinition(map, "checkpoint-referrals-eligibility-rules");
  addReferralsDefinition(map, "checkpoint-referrals-tracking-configuration");
  return map;
}
