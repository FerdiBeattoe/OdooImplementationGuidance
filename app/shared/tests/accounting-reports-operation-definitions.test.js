import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleAccountingReportsOperationDefinitions, ACCOUNTING_REPORTS_CHECKPOINT_METADATA, ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS, ACCOUNTING_REPORTS_TARGET_METHOD } from "../accounting-reports-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleAccountingReportsOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleAccountingReportsOperationDefinitions(null, null)).length, Object.keys(ACCOUNTING_REPORTS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleAccountingReportsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ACCOUNTING_REPORTS_CHECKPOINT_METADATA, ACCOUNTING_REPORTS_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleAccountingReportsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleAccountingReportsOperationDefinitions(null, null)); });
});
