import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleLunchOperationDefinitions, LUNCH_CHECKPOINT_METADATA, LUNCH_COVERAGE_GAP_MODELS, LUNCH_TARGET_METHOD } from "../lunch-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleLunchOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleLunchOperationDefinitions(null, null)).length, Object.keys(LUNCH_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), LUNCH_CHECKPOINT_METADATA, LUNCH_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(LUNCH_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleLunchOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. supplier-setup writes vendor_name to lunch.supplier.name", () => {
    const defs = assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { lunch: { vendor_name: "Bistro Central" } });
    assert.deepEqual(defs["checkpoint-lunch-supplier-setup"].intended_changes, { name: "Bistro Central" });
  });
  it("8. supplier-setup trims and null for blank", () => {
    const trimmed = assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { lunch: { vendor_name: "  Bistro  " } });
    assert.deepEqual(trimmed["checkpoint-lunch-supplier-setup"].intended_changes, { name: "Bistro" });
    const blank = assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { lunch: { vendor_name: "   " } });
    assert.equal(blank["checkpoint-lunch-supplier-setup"].intended_changes, null);
  });
  it("9. product-catalogue, cash-move-policy, employee-access remain honest-null", () => {
    const captures = { lunch: { vendor_name: "X", vendor_delivery_days: "Mon-Fri", order_cutoff_time: "10:30", repayment_model: "wallet_topup", lunch_manager: "Manager" } };
    const defs = assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-lunch-product-catalogue"].intended_changes, null);
    assert.equal(defs["checkpoint-lunch-cash-move-policy"].intended_changes, null);
    assert.equal(defs["checkpoint-lunch-employee-access"].intended_changes, null);
  });
});
