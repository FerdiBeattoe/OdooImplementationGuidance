import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleEventsOperationDefinitions, EVENTS_CHECKPOINT_METADATA, EVENTS_COVERAGE_GAP_MODELS, EVENTS_TARGET_METHOD } from "../events-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleEventsOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleEventsOperationDefinitions(null, null)).length, Object.keys(EVENTS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleEventsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), EVENTS_CHECKPOINT_METADATA, EVENTS_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleEventsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(EVENTS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleEventsOperationDefinitions(null, null)); });
});
