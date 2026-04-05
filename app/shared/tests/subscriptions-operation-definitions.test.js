// ---------------------------------------------------------------------------
// Subscriptions Operation Definitions Tests
// Tests for: app/shared/subscriptions-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Subscriptions assembler returns zero definitions with null inputs
//   2.  Subscriptions assembler still returns zero definitions when gates are active
//   3.  Coverage gaps are documented
//   4.  No Subscriptions definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleSubscriptionsOperationDefinitions,
  SUBSCRIPTIONS_COVERAGE_GAP_MODELS,
} from "../subscriptions-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleSubscriptionsOperationDefinitions", () => {
  it("1. returns zero Subscriptions definitions with null inputs", () => {
    const defs = assembleSubscriptionsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Subscriptions must currently emit zero definitions");
  });

  it("2. still returns zero Subscriptions definitions when gates are active", () => {
    const defs = assembleSubscriptionsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "RM-03": true, "RM-01": ["Recurring subscriptions or contracts"], "FC-01": "Full accounting" })
    );
    assert.equal(Object.keys(defs).length, 0, "Subscriptions must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(SUBSCRIPTIONS_COVERAGE_GAP_MODELS, ["sale.subscription.plan", "product.template"]);
  });

  it("4. no Subscriptions definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleSubscriptionsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleSubscriptionsOperationDefinitions(null, null));
  });
});
