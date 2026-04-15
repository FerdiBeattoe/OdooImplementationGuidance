import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`rental-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const RENTAL_OP_DEFS_VERSION = "1.2.0";
export const RENTAL_TARGET_METHOD = "write";
// COVERAGE GAP: sale.order not in ALLOWED_APPLY_MODELS.
// product.template IS in ALLOWED_APPLY_MODELS, but the rental wizard does not capture a product
// name, so no clean record seed can be built from its captures.
export const RENTAL_COVERAGE_GAP_MODELS = Object.freeze(["sale.order"]);
export const RENTAL_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.RNT_FOUND_001]: Object.freeze({
    target_model: "product.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.RNT_DREQ_001]: Object.freeze({
    target_model: "product.template",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.RNT_DREQ_002]: Object.freeze({
    target_model: "sale.order",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.RNT_GL_001]: Object.freeze({
    target_model: "sale.order",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
  }),
});
export const RENTAL_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(RENTAL_CHECKPOINT_METADATA));
function addRentalDefinition(map, checkpoint_id) { const metadata = RENTAL_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: RENTAL_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleRentalOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (rental-wizard.js): {tracking_mode (serial|lot|none), rate_schedules
  // (repeater), rental_location_name, late_fee_percent, damage_charge_enabled}.
  // honest-null across all four:
  //   - tracking_mode has the exact selection values as product.template.tracking, but no
  //     product name is captured; seeding a product.template record with {tracking} and no
  //     {name} would produce a nameless row. Bulk updates to existing products require record
  //     identity that intended_changes does not carry.
  //   - rental_location_name targets stock.location (different model) and requires usage /
  //     company_id that the wizard does not supply.
  //   - rate_schedules map to rental.pricing, not product.template; each row needs
  //     product_template_id and price many2ones we cannot resolve.
  //   - RNT_DREQ_002 is Informational and RNT_GL_001 is execution_relevance None.
  void wizard_captures;
  addRentalDefinition(map, CHECKPOINT_IDS.RNT_FOUND_001);
  addRentalDefinition(map, CHECKPOINT_IDS.RNT_DREQ_001);
  addRentalDefinition(map, CHECKPOINT_IDS.RNT_DREQ_002);
  addRentalDefinition(map, CHECKPOINT_IDS.RNT_GL_001);
  return map;
}
