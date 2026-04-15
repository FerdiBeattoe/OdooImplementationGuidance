import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`loyalty-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const LOYALTY_OP_DEFS_VERSION = "1.2.0";
export const LOYALTY_TARGET_METHOD = "write";
// loyalty.program and loyalty.reward are in ALLOWED_APPLY_MODELS.
export const LOYALTY_COVERAGE_GAP_MODELS = Object.freeze([]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addLoyaltyDefinition(map, checkpoint_id, intended_changes) { const metadata = LOYALTY_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: LOYALTY_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
const PROGRAM_TYPE_MAP = Object.freeze({
  loyalty_points: "loyalty",
  gift_cards: "gift_card",
  promotions_only: "promotion",
});
function extractProgramSetupChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // loyalty.program.program_type selection=[coupons,gift_card,loyalty,promotion,ewallet,
  // promo_code,buy_x_get_y,next_order_coupons]. Wizard "both" requires two records and cannot
  // be represented as a single write — honest-null for that case.
  const mapped = PROGRAM_TYPE_MAP[capture.program_type];
  if (!mapped) return null;
  return { program_type: mapped };
}
function extractPosEcommerceChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // loyalty.program.pos_ok is the "Point of Sale" boolean. Only set when the wizard captured
  // an explicit value so we don't flip a config the user hasn't confirmed.
  if (typeof capture.pos_enabled !== "boolean") return null;
  return { pos_ok: capture.pos_enabled };
}
export function assembleLoyaltyOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (loyalty-wizard.js): {program_type (loyalty_points|gift_cards|both|
  // promotions_only), points_earn_rate, points_value, expiry_months, liability_account_name,
  // pos_enabled}.
  const capture = isPlainObject(wizard_captures?.loyalty) ? wizard_captures.loyalty : null;
  // checkpoint-loyalty-program-setup → loyalty.program.program_type.
  addLoyaltyDefinition(map, "checkpoint-loyalty-program-setup", extractProgramSetupChanges(capture));
  // checkpoint-loyalty-reward-rules → loyalty.reward.
  // honest-null: loyalty.reward requires {program_id (many2one), description, reward_type,
  // discount_mode}. points_earn_rate / points_value are loyalty.rule fields (not reward), and
  // program_id must resolve to a specific program record that the wizard has not identified.
  addLoyaltyDefinition(map, "checkpoint-loyalty-reward-rules", null);
  // checkpoint-loyalty-expiry-policy → loyalty.program. execution_relevance "None" — no write.
  addLoyaltyDefinition(map, "checkpoint-loyalty-expiry-policy", null);
  // checkpoint-loyalty-pos-ecommerce → loyalty.program.pos_ok.
  addLoyaltyDefinition(map, "checkpoint-loyalty-pos-ecommerce", extractPosEcommerceChanges(capture));
  return map;
}
