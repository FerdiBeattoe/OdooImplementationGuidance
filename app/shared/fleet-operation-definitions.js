import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`fleet-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const FLEET_OP_DEFS_VERSION = "1.2.0";
export const FLEET_TARGET_METHOD = "write";
// fleet.vehicle and fleet.vehicle.model are in ALLOWED_APPLY_MODELS (promoted 2026-04-15).
// Coverage gap: fleet.vehicle.category is not in the allowlist, so vehicle_categories
// repeater data cannot be materialised as records.
export const FLEET_COVERAGE_GAP_MODELS = Object.freeze(["fleet.vehicle.category"]);
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
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addFleetDefinition(map, checkpoint_id, intended_changes) { const metadata = FLEET_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: FLEET_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
function extractVehicleRegistryChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // fleet.vehicle confirmed fields (scripts/odoo-confirmed-fields.json): name (char), vin_sn (char — Chassis Number).
  const changes = {};
  const model = typeof capture.first_vehicle_model === "string" && capture.first_vehicle_model.trim() ? capture.first_vehicle_model.trim() : null;
  if (model) changes.name = model;
  const vin = typeof capture.first_vehicle_vin === "string" && capture.first_vehicle_vin.trim() ? capture.first_vehicle_vin.trim() : null;
  if (vin) changes.vin_sn = vin;
  return Object.keys(changes).length > 0 ? changes : null;
}
export function assembleFleetOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (fleet-wizard.js): {vehicle_categories[], first_vehicle_vin,
  // first_vehicle_model, first_vehicle_driver, contract_type, renewal_reminder_days}.
  const capture = isPlainObject(wizard_captures?.fleet) ? wizard_captures.fleet : null;
  // checkpoint-fleet-vehicle-registry → fleet.vehicle (name + vin_sn from wizard capture).
  addFleetDefinition(map, "checkpoint-fleet-vehicle-registry", extractVehicleRegistryChanges(capture));
  // checkpoint-fleet-driver-assignment → fleet.vehicle.
  // honest-null: driver_id is many2one (res.partner) — the wizard captures a text name only,
  // which cannot be resolved to a record ID without a lookup contract the wizard doesn't provide.
  addFleetDefinition(map, "checkpoint-fleet-driver-assignment", null);
  // checkpoint-fleet-service-schedule → fleet.vehicle. execution_relevance "None".
  // No governed write; renewal_reminder_days is scheduler policy, not a confirmed field on fleet.vehicle.
  addFleetDefinition(map, "checkpoint-fleet-service-schedule", null);
  // checkpoint-fleet-fuel-tracking → fleet.vehicle.model.
  // honest-null: wizard does not capture fuel_type / power; no source for confirmed fields on the model.
  addFleetDefinition(map, "checkpoint-fleet-fuel-tracking", null);
  return map;
}
