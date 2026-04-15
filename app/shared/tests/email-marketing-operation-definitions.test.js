import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleEmailMarketingOperationDefinitions, EMAIL_MARKETING_CHECKPOINT_METADATA, EMAIL_MARKETING_COVERAGE_GAP_MODELS, EMAIL_MARKETING_TARGET_METHOD } from "../email-marketing-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleEmailMarketingOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleEmailMarketingOperationDefinitions(null, null)).length, Object.keys(EMAIL_MARKETING_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleEmailMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), EMAIL_MARKETING_CHECKPOINT_METADATA, EMAIL_MARKETING_TARGET_METHOD); });
  it("3. intended_changes is null for every definition when wizard captures absent", () => { const defs = assembleEmailMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(EMAIL_MARKETING_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleEmailMarketingOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleEmailMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. mailing-list intended_changes populated from wizard capture", () => {
    const captures = { "email-marketing": { initial_mailing_list_name: "General Newsletter" } };
    const defs = assembleEmailMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-email-marketing-mailing-list"].intended_changes, { name: "General Newsletter" });
  });
  it("8. mailing-list intended_changes null when capture is empty string", () => {
    const captures = { "email-marketing": { initial_mailing_list_name: "  " } };
    const defs = assembleEmailMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-email-marketing-mailing-list"].intended_changes, null);
  });
  it("9. sender/unsubscribe/campaign remain honest-null even with captures", () => {
    const captures = { "email-marketing": { initial_mailing_list_name: "X", sending_domain: "company.com", blacklist_enabled: true } };
    const defs = assembleEmailMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-email-marketing-sender-configuration"].intended_changes, null);
    assert.equal(defs["checkpoint-email-marketing-unsubscribe-policy"].intended_changes, null);
    assert.equal(defs["checkpoint-email-marketing-campaign-baseline"].intended_changes, null);
  });
});
