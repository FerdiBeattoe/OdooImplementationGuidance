import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleFleetOperationDefinitions, FLEET_CHECKPOINT_METADATA, FLEET_COVERAGE_GAP_MODELS, FLEET_TARGET_METHOD } from "../fleet-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleFleetOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleFleetOperationDefinitions(null, null)).length, Object.keys(FLEET_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), FLEET_CHECKPOINT_METADATA, FLEET_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleFleetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(FLEET_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleFleetOperationDefinitions(null, null)); });
});
