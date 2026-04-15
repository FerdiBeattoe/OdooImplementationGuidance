import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleCalendarOperationDefinitions, CALENDAR_CHECKPOINT_METADATA, CALENDAR_COVERAGE_GAP_MODELS, CALENDAR_TARGET_METHOD } from "../calendar-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleCalendarOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleCalendarOperationDefinitions(null, null)).length, Object.keys(CALENDAR_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), CALENDAR_CHECKPOINT_METADATA, CALENDAR_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(CALENDAR_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleCalendarOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. scope-policy enables Google sync when provider=google with oauth_client_ready", () => {
    const captures = { calendar: { sync_provider: "google", oauth_client_ready: true } };
    const defs = assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-calendar-scope-policy"].intended_changes, { google_synchronization_stopped: false });
  });
  it("8. scope-policy null when provider=google but oauth not ready", () => {
    const captures = { calendar: { sync_provider: "google", oauth_client_ready: false } };
    const defs = assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-calendar-scope-policy"].intended_changes, null);
  });
  it("9. scope-policy stops Google sync when provider=microsoft", () => {
    const captures = { calendar: { sync_provider: "microsoft" } };
    const defs = assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-calendar-scope-policy"].intended_changes, { google_synchronization_stopped: true });
  });
  it("10. scope-policy stops Google sync when provider=none", () => {
    const captures = { calendar: { sync_provider: "none" } };
    const defs = assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-calendar-scope-policy"].intended_changes, { google_synchronization_stopped: true });
  });
  it("11. sync-setup / meeting-type / availability-rules remain honest-null", () => {
    const captures = { calendar: { sync_provider: "google", oauth_client_ready: true, sync_activities_from_crm: true, source_of_truth_policy: "odoo" } };
    const defs = assembleCalendarOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-calendar-sync-setup"].intended_changes, null);
    assert.equal(defs["checkpoint-calendar-meeting-type"].intended_changes, null);
    assert.equal(defs["checkpoint-calendar-availability-rules"].intended_changes, null);
  });
});
