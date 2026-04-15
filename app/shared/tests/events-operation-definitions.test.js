import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleEventsOperationDefinitions, EVENTS_CHECKPOINT_METADATA, EVENTS_COVERAGE_GAP_MODELS, EVENTS_TARGET_METHOD } from "../events-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleEventsOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleEventsOperationDefinitions(null, null)).length, Object.keys(EVENTS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleEventsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), EVENTS_CHECKPOINT_METADATA, EVENTS_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleEventsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(EVENTS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleEventsOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleEventsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. type-configuration intended_changes populated from wizard event_type_name", () => {
    const captures = { events: { event_type_name: "Workshop" } };
    const defs = assembleEventsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-events-type-configuration"].intended_changes, { name: "Workshop" });
  });
  it("8. type-configuration intended_changes null when event_type_name is empty", () => {
    const captures = { events: { event_type_name: "" } };
    const defs = assembleEventsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-events-type-configuration"].intended_changes, null);
  });
  it("9. registration / communication / reporting remain honest-null", () => {
    const captures = { events: { event_type_name: "Conf", ticket_model: "paid", default_reminder_days: 3 } };
    const defs = assembleEventsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-events-registration-workflow"].intended_changes, null);
    assert.equal(defs["checkpoint-events-communication-templates"].intended_changes, null);
    assert.equal(defs["checkpoint-events-reporting-baseline"].intended_changes, null);
  });
});
