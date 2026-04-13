import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleRentalOperationDefinitions, RENTAL_CHECKPOINT_METADATA, RENTAL_COVERAGE_GAP_MODELS, RENTAL_TARGET_METHOD } from "../rental-operation-definitions.js";
import { assertDefinitionMetadata,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";
describe("assembleRentalOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleRentalOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleRentalOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})), RENTAL_CHECKPOINT_METADATA, RENTAL_TARGET_METHOD); });
  it("3. intended_changes is null", () => { const defs = assembleRentalOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(RENTAL_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleRentalOperationDefinitions(null, null)); });
});
