import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleAttendanceOperationDefinitions, ATTENDANCE_CHECKPOINT_METADATA, ATTENDANCE_COVERAGE_GAP_MODELS, ATTENDANCE_TARGET_METHOD } from "../attendance-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleAttendanceOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleAttendanceOperationDefinitions(null, null)).length, Object.keys(ATTENDANCE_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleAttendanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ATTENDANCE_CHECKPOINT_METADATA, ATTENDANCE_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleAttendanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(ATTENDANCE_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleAttendanceOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleAttendanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. mode-setup intended_changes enables hr_presence_control_attendance when tracking_mode captured", () => {
    const captures = { attendance: { tracking_mode: "kiosk_badge" } };
    const defs = assembleAttendanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-attendance-mode-setup"].intended_changes, { hr_presence_control_attendance: true });
  });
  it("8. mode-setup intended_changes null for unrecognised tracking_mode", () => {
    const captures = { attendance: { tracking_mode: "face_recognition" } };
    const defs = assembleAttendanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-attendance-mode-setup"].intended_changes, null);
  });
  it("9. overtime-policy and reporting-baseline remain honest-null", () => {
    const captures = { attendance: { tracking_mode: "mobile_app", overtime_threshold_hours: 8, tolerance_minutes: 5 } };
    const defs = assembleAttendanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-attendance-overtime-policy"].intended_changes, null);
    assert.equal(defs["checkpoint-attendance-reporting-baseline"].intended_changes, null);
  });
});
