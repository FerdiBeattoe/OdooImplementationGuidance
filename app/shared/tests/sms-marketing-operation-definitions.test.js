import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleSmsMarketingOperationDefinitions,
  SMS_MARKETING_COVERAGE_GAP_MODELS,
} from "../sms-marketing-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleSmsMarketingOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleSmsMarketingOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "SMS Marketing must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleSmsMarketingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "SM-01": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "SMS Marketing must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(SMS_MARKETING_COVERAGE_GAP_MODELS, ["sms.sms", "mailing.mailing"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleSmsMarketingOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleSmsMarketingOperationDefinitions(null, null));
  });
});
