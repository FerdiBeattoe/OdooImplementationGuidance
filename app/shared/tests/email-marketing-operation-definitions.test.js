import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleEmailMarketingOperationDefinitions, EMAIL_MARKETING_CHECKPOINT_METADATA, EMAIL_MARKETING_COVERAGE_GAP_MODELS, EMAIL_MARKETING_TARGET_METHOD } from "../email-marketing-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleEmailMarketingOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleEmailMarketingOperationDefinitions(null, null)).length, Object.keys(EMAIL_MARKETING_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleEmailMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), EMAIL_MARKETING_CHECKPOINT_METADATA, EMAIL_MARKETING_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleEmailMarketingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(EMAIL_MARKETING_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleEmailMarketingOperationDefinitions(null, null)); });
});
