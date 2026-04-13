import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleAttendanceOperationDefinitions, ATTENDANCE_CHECKPOINT_METADATA, ATTENDANCE_COVERAGE_GAP_MODELS, ATTENDANCE_TARGET_METHOD } from "../attendance-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleAttendanceOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleAttendanceOperationDefinitions(null, null)).length, Object.keys(ATTENDANCE_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleAttendanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ATTENDANCE_CHECKPOINT_METADATA, ATTENDANCE_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleAttendanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(ATTENDANCE_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleAttendanceOperationDefinitions(null, null)); });
});
