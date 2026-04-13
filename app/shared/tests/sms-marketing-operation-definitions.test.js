import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleSmsMarketingOperationDefinitions, SMS_MARKETING_CHECKPOINT_METADATA, SMS_MARKETING_COVERAGE_GAP_MODELS, SMS_MARKETING_TARGET_METHOD } from "../sms-marketing-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleSmsMarketingOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleSmsMarketingOperationDefinitions(null, null)).length, Object.keys(SMS_MARKETING_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleSmsMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), SMS_MARKETING_CHECKPOINT_METADATA, SMS_MARKETING_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleSmsMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(SMS_MARKETING_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleSmsMarketingOperationDefinitions(null, null)); });
});
