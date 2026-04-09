import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleEmailMarketingOperationDefinitions,
  EMAIL_MARKETING_COVERAGE_GAP_MODELS,
} from "../email-marketing-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleEmailMarketingOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleEmailMarketingOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Email Marketing must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleEmailMarketingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "EM-01": "No", "EM-02": "Yes" })
    );
    assert.equal(Object.keys(defs).length, 0, "Email Marketing must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(EMAIL_MARKETING_COVERAGE_GAP_MODELS, ["mailing.mailing", "mailing.list"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleEmailMarketingOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleEmailMarketingOperationDefinitions(null, null));
  });
});
