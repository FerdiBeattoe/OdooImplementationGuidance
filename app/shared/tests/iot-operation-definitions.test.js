import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleIotOperationDefinitions, IOT_CHECKPOINT_METADATA, IOT_COVERAGE_GAP_MODELS, IOT_TARGET_METHOD } from "../iot-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleIotOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleIotOperationDefinitions(null, null)).length, Object.keys(IOT_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), IOT_CHECKPOINT_METADATA, IOT_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(IOT_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleIotOperationDefinitions(null, null)); });
  it("6. device-assignment maps receipt_printer to type+subtype", () => {
    const captures = { iot: { first_device_type: "receipt_printer", pilot_location: "Store 1 front till" } };
    const defs = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-iot-device-assignment"].intended_changes, { name: "Store 1 front till", type: "printer", subtype: "receipt_printer" });
  });
  it("7. device-assignment maps label_printer to type+subtype", () => {
    const captures = { iot: { first_device_type: "label_printer", pilot_location: "Warehouse 2" } };
    const defs = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-iot-device-assignment"].intended_changes, { name: "Warehouse 2", type: "printer", subtype: "label_printer" });
  });
  it("8. device-assignment maps barcode_scanner / scale / payment_terminal to type only", () => {
    const base = { pilot_location: "X" };
    const scanner = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { iot: { ...base, first_device_type: "barcode_scanner" } });
    assert.deepEqual(scanner["checkpoint-iot-device-assignment"].intended_changes, { name: "X", type: "scanner" });
    const scale = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { iot: { ...base, first_device_type: "scale" } });
    assert.deepEqual(scale["checkpoint-iot-device-assignment"].intended_changes, { name: "X", type: "scale" });
    const payment = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { iot: { ...base, first_device_type: "payment_terminal" } });
    assert.deepEqual(payment["checkpoint-iot-device-assignment"].intended_changes, { name: "X", type: "payment" });
  });
  it("9. device-assignment null for cash_drawer and measurement_tool (no clean type mapping)", () => {
    for (const t of ["cash_drawer", "measurement_tool"]) {
      const defs = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { iot: { first_device_type: t, pilot_location: "X" } });
      assert.equal(defs["checkpoint-iot-device-assignment"].intended_changes, null);
    }
  });
  it("10. device-assignment null when pilot_location blank", () => {
    const defs = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { iot: { first_device_type: "scale", pilot_location: "   " } });
    assert.equal(defs["checkpoint-iot-device-assignment"].intended_changes, null);
  });
  it("11. box-registration, pos-hardware, network-configuration remain honest-null", () => {
    const captures = { iot: { box_provisioning: "odoo_hardware", network_connection: "wired", first_device_type: "scale", pilot_location: "X", vlan_can_reach_odoo: true } };
    const defs = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-iot-box-registration"].intended_changes, null);
    assert.equal(defs["checkpoint-iot-pos-hardware"].intended_changes, null);
    assert.equal(defs["checkpoint-iot-network-configuration"].intended_changes, null);
  });
  it("12. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
});
