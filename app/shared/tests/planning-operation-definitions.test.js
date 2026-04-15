import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assemblePlanningOperationDefinitions, PLANNING_CHECKPOINT_METADATA, PLANNING_COVERAGE_GAP_MODELS, PLANNING_TARGET_METHOD } from "../planning-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assemblePlanningOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assemblePlanningOperationDefinitions(null, null)).length, Object.keys(PLANNING_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assemblePlanningOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), PLANNING_CHECKPOINT_METADATA, PLANNING_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assemblePlanningOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(PLANNING_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assemblePlanningOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assemblePlanningOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. role-setup derives name from first planning_roles entry", () => {
    const defs = assemblePlanningOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { planning: { planning_roles: ["Technician", "Manager"], shift_template_names: ["Morning"], publish_cadence: "weekly", self_service_claims: false, link_to_timesheets: true } });
    assert.deepEqual(defs["checkpoint-planning-role-setup"].intended_changes, { name: "Technician" });
  });
  it("8. role-setup null when planning_roles missing/empty/blank", () => {
    for (const planning_roles of [undefined, [], [""], ["   "]]) {
      const defs = assemblePlanningOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { planning: { planning_roles } });
      assert.equal(defs["checkpoint-planning-role-setup"].intended_changes, null);
    }
  });
  it("9. shift-template, resource-allocation, publish-workflow remain honest-null", () => {
    const captures = { planning: { planning_roles: ["Technician"], shift_template_names: ["Morning (07:00-15:00)"], publish_cadence: "weekly", self_service_claims: true, link_to_timesheets: true } };
    const defs = assemblePlanningOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-planning-shift-template"].intended_changes, null);
    assert.equal(defs["checkpoint-planning-resource-allocation"].intended_changes, null);
    assert.equal(defs["checkpoint-planning-publish-workflow"].intended_changes, null);
  });
});
