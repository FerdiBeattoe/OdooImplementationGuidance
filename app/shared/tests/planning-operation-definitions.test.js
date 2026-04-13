import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assemblePlanningOperationDefinitions, PLANNING_CHECKPOINT_METADATA, PLANNING_COVERAGE_GAP_MODELS, PLANNING_TARGET_METHOD } from "../planning-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assemblePlanningOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assemblePlanningOperationDefinitions(null, null)).length, Object.keys(PLANNING_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assemblePlanningOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), PLANNING_CHECKPOINT_METADATA, PLANNING_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assemblePlanningOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(PLANNING_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assemblePlanningOperationDefinitions(null, null)); });
});
