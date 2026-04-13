import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleSpreadsheetOperationDefinitions, SPREADSHEET_CHECKPOINT_METADATA, SPREADSHEET_COVERAGE_GAP_MODELS, SPREADSHEET_TARGET_METHOD } from "../spreadsheet-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleSpreadsheetOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleSpreadsheetOperationDefinitions(null, null)).length, Object.keys(SPREADSHEET_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleSpreadsheetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), SPREADSHEET_CHECKPOINT_METADATA, SPREADSHEET_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleSpreadsheetOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(SPREADSHEET_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleSpreadsheetOperationDefinitions(null, null)); });
});
