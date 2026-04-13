import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleSignOperationDefinitions, SIGN_CHECKPOINT_METADATA, SIGN_COVERAGE_GAP_MODELS, SIGN_TARGET_METHOD } from "../sign-operation-definitions.js";
import { assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";
describe("assembleSignOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleSignOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleSignOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), SIGN_CHECKPOINT_METADATA, SIGN_TARGET_METHOD); });
  it("3. intended_changes is null", () => { const defs = assembleSignOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. all definitions use allowed target models", () => { assertDefinitionsUseAllowedModels(assembleSignOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), ALLOWED_APPLY_MODELS); });
  it("5. coverage gaps are documented", () => { assert.ok(Array.isArray(SIGN_COVERAGE_GAP_MODELS)); });
  it("6. return is a plain object", () => { assertPlainObject(assembleSignOperationDefinitions(null, null)); });
});
