import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleIotOperationDefinitions, IOT_CHECKPOINT_METADATA, IOT_COVERAGE_GAP_MODELS, IOT_TARGET_METHOD } from "../iot-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleIotOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleIotOperationDefinitions(null, null)).length, Object.keys(IOT_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), IOT_CHECKPOINT_METADATA, IOT_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleIotOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(IOT_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleIotOperationDefinitions(null, null)); });
});
