import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleLunchOperationDefinitions, LUNCH_CHECKPOINT_METADATA, LUNCH_COVERAGE_GAP_MODELS, LUNCH_TARGET_METHOD } from "../lunch-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleLunchOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleLunchOperationDefinitions(null, null)).length, Object.keys(LUNCH_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), LUNCH_CHECKPOINT_METADATA, LUNCH_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleLunchOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(LUNCH_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleLunchOperationDefinitions(null, null)); });
});
