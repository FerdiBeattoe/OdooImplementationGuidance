import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleLoyaltyOperationDefinitions, LOYALTY_CHECKPOINT_METADATA, LOYALTY_COVERAGE_GAP_MODELS, LOYALTY_TARGET_METHOD } from "../loyalty-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleLoyaltyOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleLoyaltyOperationDefinitions(null, null)).length, Object.keys(LOYALTY_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), LOYALTY_CHECKPOINT_METADATA, LOYALTY_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleLoyaltyOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(LOYALTY_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleLoyaltyOperationDefinitions(null, null)); });
});
