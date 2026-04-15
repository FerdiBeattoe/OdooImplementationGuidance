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
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleSubscriptionsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. all definitions use allowed target models", () => { assertDefinitionsUseAllowedModels(assembleSubscriptionsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"TA-03":["Expenses"],"FC-01":"Full accounting"})), ALLOWED_APPLY_MODELS); });
  it("5. coverage gaps are documented", () => { assert.ok(Array.isArray(SUBSCRIPTIONS_COVERAGE_GAP_MODELS)); });
  it("6. return is a plain object", () => { assertPlainObject(assembleSubscriptionsOperationDefinitions(null, null)); });
  it("7. SUB_FOUND_001 derives name from plan_name", () => {
    const defs = assembleSubscriptionsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"FC-01":"Full accounting"}), { subscriptions: { plan_name: "Monthly Pro", billing_recurrence: "monthly" } });
    assert.deepEqual(defs["SUB-FOUND-001"].intended_changes, { name: "Monthly Pro" });
  });
  it("8. SUB_FOUND_001 null when plan_name missing/blank", () => {
    for (const plan_name of [undefined, "", "   "]) {
      const defs = assembleSubscriptionsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"FC-01":"Full accounting"}), { subscriptions: { plan_name } });
      assert.equal(defs["SUB-FOUND-001"].intended_changes, null);
    }
  });
  it("9. DREQ checkpoints remain honest-null even with wizard_captures", () => {
    const captures = { subscriptions: { plan_name: "Monthly Pro", billing_recurrence: "monthly", renewal_mode: "automatic", dunning_steps_days: ["3","7","14"], payment_provider_ready: true, mrr_reporting_enabled: true } };
    const defs = assembleSubscriptionsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"FC-01":"Full accounting"}), captures);
    assert.equal(defs["SUB-DREQ-001"].intended_changes, null);
    assert.equal(defs["SUB-DREQ-002"].intended_changes, null);
    assert.equal(defs["SUB-DREQ-003"].intended_changes, null);
    assert.equal(defs["SUB-GL-001"].intended_changes, null);
  });
});
