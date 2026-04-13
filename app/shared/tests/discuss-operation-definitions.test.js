import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleDiscussOperationDefinitions, DISCUSS_CHECKPOINT_METADATA, DISCUSS_COVERAGE_GAP_MODELS, DISCUSS_TARGET_METHOD } from "../discuss-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleDiscussOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleDiscussOperationDefinitions(null, null)).length, Object.keys(DISCUSS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), DISCUSS_CHECKPOINT_METADATA, DISCUSS_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(DISCUSS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleDiscussOperationDefinitions(null, null)); });
});
