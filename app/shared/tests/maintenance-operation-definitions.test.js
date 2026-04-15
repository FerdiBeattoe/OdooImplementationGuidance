import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleMaintenanceOperationDefinitions, MAINTENANCE_CHECKPOINT_METADATA, MAINTENANCE_COVERAGE_GAP_MODELS, MAINTENANCE_TARGET_METHOD } from "../maintenance-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleMaintenanceOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleMaintenanceOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleMaintenanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})), MAINTENANCE_CHECKPOINT_METADATA, MAINTENANCE_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleMaintenanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(MAINTENANCE_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleMaintenanceOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleMaintenanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. intended_changes remain honest-null even with wizard_captures (team/category policy)", () => {
    const captures = { maintenance: { team_name: "Facilities", team_lead: "John", equipment_categories: ["Production"], default_pm_frequency_days: 90, linked_to_manufacturing: true, initial_asset_count: 10 } };
    const defs = assembleMaintenanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
