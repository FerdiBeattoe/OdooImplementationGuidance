import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleCalendarOperationDefinitions, CALENDAR_CHECKPOINT_METADATA, CALENDAR_COVERAGE_GAP_MODELS, CALENDAR_TARGET_METHOD } from "../calendar-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleCalendarOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleCalendarOperationDefinitions(null, null)).length, Object.keys(CALENDAR_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), CALENDAR_CHECKPOINT_METADATA, CALENDAR_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(CALENDAR_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleCalendarOperationDefinitions(null, null)); });
});
