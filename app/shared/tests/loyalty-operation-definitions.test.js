import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleLoyaltyOperationDefinitions,
  LOYALTY_COVERAGE_GAP_MODELS,
} from "../loyalty-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleLoyaltyOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleLoyaltyOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Loyalty must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleLoyaltyOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "LY-01": "Neither" })
    );
    assert.equal(Object.keys(defs).length, 0, "Loyalty must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(LOYALTY_COVERAGE_GAP_MODELS, ["loyalty.program", "loyalty.reward"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleLoyaltyOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleLoyaltyOperationDefinitions(null, null));
  });
});
