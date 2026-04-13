import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleVoipOperationDefinitions, VOIP_CHECKPOINT_METADATA, VOIP_COVERAGE_GAP_MODELS, VOIP_TARGET_METHOD } from "../voip-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleVoipOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleVoipOperationDefinitions(null, null)).length, Object.keys(VOIP_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), VOIP_CHECKPOINT_METADATA, VOIP_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(VOIP_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleVoipOperationDefinitions(null, null)); });
});
