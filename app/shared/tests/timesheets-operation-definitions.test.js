import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleTimesheetsOperationDefinitions, TIMESHEETS_CHECKPOINT_METADATA, TIMESHEETS_COVERAGE_GAP_MODELS, TIMESHEETS_TARGET_METHOD } from "../timesheets-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleTimesheetsOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleTimesheetsOperationDefinitions(null, null)).length, Object.keys(TIMESHEETS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleTimesheetsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), TIMESHEETS_CHECKPOINT_METADATA, TIMESHEETS_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleTimesheetsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(TIMESHEETS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleTimesheetsOperationDefinitions(null, null)); });
  it("6. hr.timesheet remains outside ALLOWED_APPLY_MODELS (coverage gap)", () => {
    const allowed = new Set(ALLOWED_APPLY_MODELS);
    for (const gap of TIMESHEETS_COVERAGE_GAP_MODELS) assert.ok(!allowed.has(gap), `${gap} should not yet be in allowlist`);
  });
  it("7. project.task-backed checkpoints use an allowlisted target_model", () => {
    const defs = assembleTimesheetsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    const allowed = new Set(ALLOWED_APPLY_MODELS);
    const gap = new Set(TIMESHEETS_COVERAGE_GAP_MODELS);
    for (const def of Object.values(defs)) {
      if (gap.has(def.target_model)) continue;
      assert.ok(allowed.has(def.target_model), `${def.target_model} must be in ALLOWED_APPLY_MODELS`);
    }
  });
  it("8. intended_changes stay null even with wizard_captures (policy-level captures only)", () => {
    const captures = { timesheets: { submission_cadence: "weekly", approval_chain: "manager_only", billing_link_enabled: true, rounding_minutes: 15, reminder_schedule: "End of day" } };
    const defs = assembleTimesheetsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
