import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleLoyaltyOperationDefinitions, LOYALTY_CHECKPOINT_METADATA, LOYALTY_COVERAGE_GAP_MODELS, LOYALTY_TARGET_METHOD } from "../loyalty-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleLoyaltyOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleLoyaltyOperationDefinitions(null, null)).length, Object.keys(LOYALTY_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), LOYALTY_CHECKPOINT_METADATA, LOYALTY_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(LOYALTY_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleLoyaltyOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. program-setup maps loyalty_points to program_type=loyalty", () => {
    const defs = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { loyalty: { program_type: "loyalty_points" } });
    assert.deepEqual(defs["checkpoint-loyalty-program-setup"].intended_changes, { program_type: "loyalty" });
  });
  it("8. program-setup maps gift_cards to program_type=gift_card", () => {
    const defs = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { loyalty: { program_type: "gift_cards" } });
    assert.deepEqual(defs["checkpoint-loyalty-program-setup"].intended_changes, { program_type: "gift_card" });
  });
  it("9. program-setup maps promotions_only to program_type=promotion", () => {
    const defs = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { loyalty: { program_type: "promotions_only" } });
    assert.deepEqual(defs["checkpoint-loyalty-program-setup"].intended_changes, { program_type: "promotion" });
  });
  it("10. program-setup null for 'both' (two records needed)", () => {
    const defs = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { loyalty: { program_type: "both" } });
    assert.equal(defs["checkpoint-loyalty-program-setup"].intended_changes, null);
  });
  it("11. pos-ecommerce sets pos_ok from pos_enabled boolean", () => {
    const enabled = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { loyalty: { pos_enabled: true } });
    assert.deepEqual(enabled["checkpoint-loyalty-pos-ecommerce"].intended_changes, { pos_ok: true });
    const disabled = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { loyalty: { pos_enabled: false } });
    assert.deepEqual(disabled["checkpoint-loyalty-pos-ecommerce"].intended_changes, { pos_ok: false });
  });
  it("12. pos-ecommerce null when pos_enabled is not boolean", () => {
    const defs = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { loyalty: { pos_enabled: "yes" } });
    assert.equal(defs["checkpoint-loyalty-pos-ecommerce"].intended_changes, null);
  });
  it("13. reward-rules and expiry-policy remain honest-null", () => {
    const captures = { loyalty: { program_type: "loyalty_points", points_earn_rate: 1, points_value: 0.01, expiry_months: 24, liability_account_name: "Loyalty Liability", pos_enabled: true } };
    const defs = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-loyalty-reward-rules"].intended_changes, null);
    assert.equal(defs["checkpoint-loyalty-expiry-policy"].intended_changes, null);
  });
});
