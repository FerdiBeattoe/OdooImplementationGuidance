import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`fleet-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const FLEET_OP_DEFS_VERSION = "1.1.0";
export const FLEET_TARGET_METHOD = "write";
// COVERAGE GAP: fleet.vehicle not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: fleet.vehicle.model not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const FLEET_COVERAGE_GAP_MODELS = Object.freeze(["fleet.vehicle", "fleet.vehicle.model"]);
export const FLEET_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-fleet-vehicle-registry"]: Object.freeze({
    target_model: "fleet.vehicle",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-fleet-driver-assignment"]: Object.freeze({
    target_model: "fleet.vehicle",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-fleet-service-schedule"]: Object.freeze({
    target_model: "fleet.vehicle",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-fleet-fuel-tracking"]: Object.freeze({
    target_model: "fleet.vehicle.model",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const FLEET_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(FLEET_CHECKPOINT_METADATA));
function addFleetDefinition(map, checkpoint_id) { const metadata = FLEET_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: FLEET_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleFleetOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addFleetDefinition(map, "checkpoint-fleet-vehicle-registry");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addFleetDefinition(map, "checkpoint-fleet-driver-assignment");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addFleetDefinition(map, "checkpoint-fleet-service-schedule");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addFleetDefinition(map, "checkpoint-fleet-fuel-tracking");
  return map; }
