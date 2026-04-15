import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleFleetOperationDefinitions, FLEET_CHECKPOINT_METADATA, FLEET_COVERAGE_GAP_MODELS, FLEET_TARGET_METHOD } from "../fleet-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleFleetOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleFleetOperationDefinitions(null, null)).length, Object.keys(FLEET_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), FLEET_CHECKPOINT_METADATA, FLEET_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(FLEET_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleFleetOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. vehicle-registry intended_changes populated with name and vin_sn from wizard", () => {
    const captures = { fleet: { first_vehicle_model: "Toyota Hilux 2.4", first_vehicle_vin: "WVWZZZ1JZXW000001" } };
    const defs = assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-fleet-vehicle-registry"].intended_changes, { name: "Toyota Hilux 2.4", vin_sn: "WVWZZZ1JZXW000001" });
  });
  it("8. vehicle-registry intended_changes only includes fields that are captured", () => {
    const captures = { fleet: { first_vehicle_model: "Ford Ranger" } };
    const defs = assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-fleet-vehicle-registry"].intended_changes, { name: "Ford Ranger" });
  });
  it("9. vehicle-registry intended_changes null when neither model nor vin captured", () => {
    const captures = { fleet: { contract_type: "leased" } };
    const defs = assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-fleet-vehicle-registry"].intended_changes, null);
  });
  it("10. driver-assignment / service-schedule / fuel-tracking remain honest-null", () => {
    const captures = { fleet: { first_vehicle_model: "X", first_vehicle_vin: "Y", first_vehicle_driver: "Jane Smith", renewal_reminder_days: 30 } };
    const defs = assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-fleet-driver-assignment"].intended_changes, null);
    assert.equal(defs["checkpoint-fleet-service-schedule"].intended_changes, null);
    assert.equal(defs["checkpoint-fleet-fuel-tracking"].intended_changes, null);
  });
});
