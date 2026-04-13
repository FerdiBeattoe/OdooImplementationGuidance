import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleStudioOperationDefinitions, STUDIO_CHECKPOINT_METADATA, STUDIO_COVERAGE_GAP_MODELS, STUDIO_TARGET_METHOD } from "../studio-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleStudioOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleStudioOperationDefinitions(null, null)).length, Object.keys(STUDIO_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleStudioOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), STUDIO_CHECKPOINT_METADATA, STUDIO_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleStudioOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(STUDIO_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleStudioOperationDefinitions(null, null)); });
});
