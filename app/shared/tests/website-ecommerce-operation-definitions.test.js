// ---------------------------------------------------------------------------
// Website/eCommerce Operation Definitions Tests
// Tests for: app/shared/website-ecommerce-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Website/eCommerce assembler returns zero definitions with null inputs
//   2.  Website/eCommerce assembler still returns zero definitions when conditional gates are active
//   3.  Coverage gaps are documented
//   4.  No Website/eCommerce definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleWebsiteEcommerceOperationDefinitions,
  WEBSITE_ECOMMERCE_COVERAGE_GAP_MODELS,
} from "../website-ecommerce-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleWebsiteEcommerceOperationDefinitions", () => {
  it("1. returns zero Website/eCommerce definitions with null inputs", () => {
    const defs = assembleWebsiteEcommerceOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Website/eCommerce must currently emit zero definitions");
  });

  it("2. still returns zero Website/eCommerce definitions when conditional gates are active", () => {
    const defs = assembleWebsiteEcommerceOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-01": true, "SC-03": true })
    );
    assert.equal(Object.keys(defs).length, 0, "Website/eCommerce must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(WEBSITE_ECOMMERCE_COVERAGE_GAP_MODELS, ["website", "payment.provider"]);
  });

  it("4. no Website/eCommerce definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleWebsiteEcommerceOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleWebsiteEcommerceOperationDefinitions(null, null));
  });
});
