import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleTimesheetsOperationDefinitions, TIMESHEETS_CHECKPOINT_METADATA, TIMESHEETS_COVERAGE_GAP_MODELS, TIMESHEETS_TARGET_METHOD } from "../timesheets-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleTimesheetsOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleTimesheetsOperationDefinitions(null, null)).length, Object.keys(TIMESHEETS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleTimesheetsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), TIMESHEETS_CHECKPOINT_METADATA, TIMESHEETS_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleTimesheetsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(TIMESHEETS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleTimesheetsOperationDefinitions(null, null)); });
});
