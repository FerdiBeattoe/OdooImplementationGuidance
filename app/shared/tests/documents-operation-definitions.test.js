import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleDocumentsOperationDefinitions, DOCUMENTS_CHECKPOINT_METADATA, DOCUMENTS_COVERAGE_GAP_MODELS, DOCUMENTS_TARGET_METHOD } from "../documents-operation-definitions.js";
import { assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";
describe("assembleDocumentsOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleDocumentsOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleDocumentsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), DOCUMENTS_CHECKPOINT_METADATA, DOCUMENTS_TARGET_METHOD); });
  it("3. intended_changes is null", () => { const defs = assembleDocumentsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. all definitions use allowed target models", () => { assertDefinitionsUseAllowedModels(assembleDocumentsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), ALLOWED_APPLY_MODELS); });
  it("5. coverage gaps are documented", () => { assert.ok(Array.isArray(DOCUMENTS_COVERAGE_GAP_MODELS)); });
  it("6. return is a plain object", () => { assertPlainObject(assembleDocumentsOperationDefinitions(null, null)); });
});
