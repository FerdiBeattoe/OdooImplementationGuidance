import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleRentalOperationDefinitions, RENTAL_CHECKPOINT_METADATA, RENTAL_COVERAGE_GAP_MODELS, RENTAL_TARGET_METHOD } from "../rental-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleRentalOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleRentalOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleRentalOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})), RENTAL_CHECKPOINT_METADATA, RENTAL_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleRentalOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(RENTAL_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleRentalOperationDefinitions(null, null)); });
  it("6. sale.order remains outside ALLOWED_APPLY_MODELS (coverage gap)", () => {
    const allowed = new Set(ALLOWED_APPLY_MODELS);
    for (const gap of RENTAL_COVERAGE_GAP_MODELS) assert.ok(!allowed.has(gap), `${gap} should not yet be in allowlist`);
  });
  it("7. product.template-backed checkpoints use an allowlisted target_model", () => {
    const defs = assembleRentalOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    const allowed = new Set(ALLOWED_APPLY_MODELS);
    const gap = new Set(RENTAL_COVERAGE_GAP_MODELS);
    for (const def of Object.values(defs)) {
      if (gap.has(def.target_model)) continue;
      assert.ok(allowed.has(def.target_model), `${def.target_model} must be in ALLOWED_APPLY_MODELS`);
    }
  });
  it("8. intended_changes stay null even with wizard_captures (no record name seed)", () => {
    const captures = { rental: { tracking_mode: "serial", rate_schedules: ["day"], rental_location_name: "Rental Stock", late_fee_percent: 5, damage_charge_enabled: true } };
    const defs = assembleRentalOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
