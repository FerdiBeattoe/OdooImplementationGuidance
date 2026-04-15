import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleRepairsOperationDefinitions, REPAIRS_CHECKPOINT_METADATA, REPAIRS_COVERAGE_GAP_MODELS, REPAIRS_TARGET_METHOD } from "../repairs-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleRepairsOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleRepairsOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleRepairsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})), REPAIRS_CHECKPOINT_METADATA, REPAIRS_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleRepairsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(REPAIRS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleRepairsOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleRepairsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. intended_changes stay null even with wizard_captures (many2one chain unresolved)", () => {
    const captures = { repairs: { repair_location_name: "Workshop", invoicing_policy: "after_repair", warranty_behavior: "case_by_case", consume_components_from_inventory: true, field_service_split_rule: "workshop_repairs" } };
    const defs = assembleRepairsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
