import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`repairs-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const REPAIRS_OP_DEFS_VERSION = "1.2.0";
export const REPAIRS_TARGET_METHOD = "write";
// repair.order is in ALLOWED_APPLY_MODELS, but it requires a long chain of many2ones
// (company_id, picking_type_id, location_id, product_location_src_id, product_location_dest_id,
// location_dest_id, parts_location_id, recycle_location_id) plus schedule_date per record. The
// wizard captures are policy-level labels that cannot resolve those identities.
export const REPAIRS_COVERAGE_GAP_MODELS = Object.freeze([]);
export const REPAIRS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.REP_FOUND_001]: Object.freeze({
    target_model: "repair.order",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.REP_DREQ_001]: Object.freeze({
    target_model: "repair.order",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.REP_DREQ_002]: Object.freeze({
    target_model: "repair.order",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.REP_REC_001]: Object.freeze({
    target_model: "repair.order",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Not_Applicable",
  }),
});
export const REPAIRS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(REPAIRS_CHECKPOINT_METADATA));
function addRepairsDefinition(map, checkpoint_id) { const metadata = REPAIRS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: REPAIRS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleRepairsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (repairs-wizard.js): {repair_location_name, invoicing_policy,
  // warranty_behavior, consume_components_from_inventory, field_service_split_rule}.
  // honest-null across all four:
  //   - repair_location_name targets stock.location, not repair.order.
  //   - invoicing_policy / warranty_behavior / field_service_split_rule are policy labels that
  //     do not map to individual repair.order fields (invoicing/warranty map to per-order
  //     sale_order_id and under_warranty flags that require per-repair context).
  //   - REP_FOUND_001 is Informational; REP_REC_001 is execution_relevance None.
  void wizard_captures;
  addRepairsDefinition(map, CHECKPOINT_IDS.REP_FOUND_001);
  addRepairsDefinition(map, CHECKPOINT_IDS.REP_DREQ_001);
  addRepairsDefinition(map, CHECKPOINT_IDS.REP_DREQ_002);
  addRepairsDefinition(map, CHECKPOINT_IDS.REP_REC_001);
  return map;
}
