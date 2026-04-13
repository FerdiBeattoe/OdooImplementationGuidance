import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleRepairsOperationDefinitions, REPAIRS_CHECKPOINT_METADATA, REPAIRS_COVERAGE_GAP_MODELS, REPAIRS_TARGET_METHOD } from "../repairs-operation-definitions.js";
import { assertDefinitionMetadata,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";
describe("assembleRepairsOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleRepairsOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleRepairsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})), REPAIRS_CHECKPOINT_METADATA, REPAIRS_TARGET_METHOD); });
  it("3. intended_changes is null", () => { const defs = assembleRepairsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(REPAIRS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleRepairsOperationDefinitions(null, null)); });
});
