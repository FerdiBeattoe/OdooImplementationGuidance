import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`lunch-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const LUNCH_OP_DEFS_VERSION = "1.2.0";
export const LUNCH_TARGET_METHOD = "write";
// lunch.supplier and lunch.product are in ALLOWED_APPLY_MODELS.
export const LUNCH_COVERAGE_GAP_MODELS = Object.freeze([]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addLunchDefinition(map, checkpoint_id, intended_changes) { const metadata = LUNCH_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: LUNCH_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractSupplierSetupChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // lunch.supplier.name is the label for the supplier record. partner_id (many2one, required)
  // must be resolved at apply time — the wizard captures a free-text vendor_name, not a
  // res.partner reference, so we only seed the display name here.
  const name = typeof capture.vendor_name === "string" ? capture.vendor_name.trim() : "";
  if (!name) return null;
  return { name };
}
export function assembleLunchOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (lunch-wizard.js): {vendor_name, vendor_delivery_days, order_cutoff_time,
  // repayment_model (wallet_topup|payroll_deduction), lunch_manager}.
  const capture = isPlainObject(wizard_captures?.lunch) ? wizard_captures.lunch : null;
  // checkpoint-lunch-supplier-setup → lunch.supplier (seed vendor name).
  addLunchDefinition(map, "checkpoint-lunch-supplier-setup", extractSupplierSetupChanges(capture));
  // checkpoint-lunch-product-catalogue → lunch.product.
  // honest-null: lunch.product requires {name, category_id (many2one), price, supplier_id
  // (many2one)}; the wizard captures no product-level info, only supplier-level.
  addLunchDefinition(map, "checkpoint-lunch-product-catalogue", null);
  // checkpoint-lunch-cash-move-policy → lunch.product. execution_relevance "None" — no write.
  addLunchDefinition(map, "checkpoint-lunch-cash-move-policy", null);
  // checkpoint-lunch-employee-access → lunch.product.
  // honest-null: lunch_manager is a human name and repayment_model is company policy; neither
  // maps to a lunch.product field.
  addLunchDefinition(map, "checkpoint-lunch-employee-access", null);
  return map;
}
