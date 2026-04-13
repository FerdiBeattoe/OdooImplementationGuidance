import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleMaintenanceOperationDefinitions, MAINTENANCE_CHECKPOINT_METADATA, MAINTENANCE_COVERAGE_GAP_MODELS, MAINTENANCE_TARGET_METHOD } from "../maintenance-operation-definitions.js";
import { assertDefinitionMetadata,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";
describe("assembleMaintenanceOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleMaintenanceOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleMaintenanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})), MAINTENANCE_CHECKPOINT_METADATA, MAINTENANCE_TARGET_METHOD); });
  it("3. intended_changes is null", () => { const defs = assembleMaintenanceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(MAINTENANCE_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleMaintenanceOperationDefinitions(null, null)); });
});
