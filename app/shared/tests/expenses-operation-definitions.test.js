import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleExpensesOperationDefinitions, EXPENSES_CHECKPOINT_METADATA, EXPENSES_COVERAGE_GAP_MODELS, EXPENSES_TARGET_METHOD } from "../expenses-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleExpensesOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleExpensesOperationDefinitions(null, null)).length, Object.keys(EXPENSES_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleExpensesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), EXPENSES_CHECKPOINT_METADATA, EXPENSES_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleExpensesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(EXPENSES_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleExpensesOperationDefinitions(null, null)); });
});
