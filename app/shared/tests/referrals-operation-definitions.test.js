import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleReferralsOperationDefinitions, REFERRALS_CHECKPOINT_METADATA, REFERRALS_COVERAGE_GAP_MODELS, REFERRALS_TARGET_METHOD } from "../referrals-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleReferralsOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleReferralsOperationDefinitions(null, null)).length, Object.keys(REFERRALS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleReferralsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), REFERRALS_CHECKPOINT_METADATA, REFERRALS_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleReferralsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(REFERRALS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleReferralsOperationDefinitions(null, null)); });
  it("6. target models remain outside ALLOWED_APPLY_MODELS (coverage gap)", () => {
    const allowed = new Set(ALLOWED_APPLY_MODELS);
    for (const gap of REFERRALS_COVERAGE_GAP_MODELS) assert.ok(!allowed.has(gap), `${gap} should not yet be in allowlist`);
  });
  it("7. intended_changes still null even when wizard_captures are supplied (coverage gap)", () => {
    const captures = { referrals: { reward_trigger_stage: "hired", reward_type: "cash", reward_amount: 500, reward_currency: "USD", publicise_plan: true } };
    const defs = assembleReferralsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
