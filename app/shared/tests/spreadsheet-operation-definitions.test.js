import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleSpreadsheetOperationDefinitions, SPREADSHEET_CHECKPOINT_METADATA, SPREADSHEET_COVERAGE_GAP_MODELS, SPREADSHEET_TARGET_METHOD } from "../spreadsheet-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleSpreadsheetOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleSpreadsheetOperationDefinitions(null, null)).length, Object.keys(SPREADSHEET_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleSpreadsheetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), SPREADSHEET_CHECKPOINT_METADATA, SPREADSHEET_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleSpreadsheetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(SPREADSHEET_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleSpreadsheetOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleSpreadsheetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. template-baseline derives name from first core_templates entry", () => {
    const defs = assembleSpreadsheetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { spreadsheet: { core_templates: ["Weekly sales dashboard", "Monthly close"], template_owner: "Finance Ops" } });
    assert.deepEqual(defs["checkpoint-spreadsheet-template-baseline"].intended_changes, { name: "Weekly sales dashboard" });
  });
  it("8. template-baseline null when core_templates missing/empty/blank", () => {
    for (const core_templates of [undefined, [], [""], ["   "]]) {
      const defs = assembleSpreadsheetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { spreadsheet: { core_templates } });
      assert.equal(defs["checkpoint-spreadsheet-template-baseline"].intended_changes, null);
    }
  });
  it("9. data-sources, access-policy, dashboard remain honest-null", () => {
    const captures = { spreadsheet: { core_templates: ["Weekly sales dashboard"], template_owner: "Finance Ops", refresh_cadence: "scheduled_daily", retire_external_excel: true, restricted_workspaces: ["Finance leadership"] } };
    const defs = assembleSpreadsheetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-spreadsheet-data-sources"].intended_changes, null);
    assert.equal(defs["checkpoint-spreadsheet-access-policy"].intended_changes, null);
    assert.equal(defs["checkpoint-spreadsheet-dashboard"].intended_changes, null);
  });
});
