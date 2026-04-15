import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleSmsMarketingOperationDefinitions, SMS_MARKETING_CHECKPOINT_METADATA, SMS_MARKETING_COVERAGE_GAP_MODELS, SMS_MARKETING_TARGET_METHOD } from "../sms-marketing-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleSmsMarketingOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleSmsMarketingOperationDefinitions(null, null)).length, Object.keys(SMS_MARKETING_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleSmsMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), SMS_MARKETING_CHECKPOINT_METADATA, SMS_MARKETING_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleSmsMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(SMS_MARKETING_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleSmsMarketingOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleSmsMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. intended_changes stay null even with wizard_captures (provider/policy-level data)", () => {
    const captures = { "sms-marketing": { sending_mode: "iap_credits", sender_id: "+441234567890", opt_in_source: "website_checkbox", initial_list_name: "UK Customers", seed_test_number: "+441234567890", coordinate_with_email: true } };
    const defs = assembleSmsMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
