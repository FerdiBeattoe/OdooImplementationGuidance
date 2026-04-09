import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleReferralsOperationDefinitions,
  REFERRALS_COVERAGE_GAP_MODELS,
} from "../referrals-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleReferralsOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleReferralsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Referrals must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleReferralsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "RF-01": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "Referrals must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(REFERRALS_COVERAGE_GAP_MODELS, ["hr.referral.stage", "hr.referral"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleReferralsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleReferralsOperationDefinitions(null, null));
  });
});
