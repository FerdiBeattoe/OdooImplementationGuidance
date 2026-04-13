import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleApprovalsOperationDefinitions, APPROVALS_CHECKPOINT_METADATA, APPROVALS_COVERAGE_GAP_MODELS, APPROVALS_TARGET_METHOD } from "../approvals-operation-definitions.js";
import { assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";
describe("assembleApprovalsOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleApprovalsOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleApprovalsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), APPROVALS_CHECKPOINT_METADATA, APPROVALS_TARGET_METHOD); });
  it("3. intended_changes is null", () => { const defs = assembleApprovalsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. all definitions use allowed target models", () => { assertDefinitionsUseAllowedModels(assembleApprovalsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), ALLOWED_APPLY_MODELS); });
  it("5. coverage gaps are documented", () => { assert.ok(Array.isArray(APPROVALS_COVERAGE_GAP_MODELS)); });
  it("6. return is a plain object", () => { assertPlainObject(assembleApprovalsOperationDefinitions(null, null)); });
});
