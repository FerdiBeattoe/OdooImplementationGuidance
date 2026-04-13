import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleSubscriptionsOperationDefinitions, SUBSCRIPTIONS_CHECKPOINT_METADATA, SUBSCRIPTIONS_COVERAGE_GAP_MODELS, SUBSCRIPTIONS_TARGET_METHOD } from "../subscriptions-operation-definitions.js";
import { assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";
describe("assembleSubscriptionsOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleSubscriptionsOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleSubscriptionsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), SUBSCRIPTIONS_CHECKPOINT_METADATA, SUBSCRIPTIONS_TARGET_METHOD); });
  it("3. intended_changes is null", () => { const defs = assembleSubscriptionsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. all definitions use allowed target models", () => { assertDefinitionsUseAllowedModels(assembleSubscriptionsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), ALLOWED_APPLY_MODELS); });
  it("5. coverage gaps are documented", () => { assert.ok(Array.isArray(SUBSCRIPTIONS_COVERAGE_GAP_MODELS)); });
  it("6. return is a plain object", () => { assertPlainObject(assembleSubscriptionsOperationDefinitions(null, null)); });
});
