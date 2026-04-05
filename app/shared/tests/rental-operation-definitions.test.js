// ---------------------------------------------------------------------------
// Rental Operation Definitions Tests
// Tests for: app/shared/rental-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Rental assembler returns zero definitions with null inputs
//   2.  Rental assembler still returns zero definitions when gates are active
//   3.  Coverage gaps are documented
//   4.  No Rental definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleRentalOperationDefinitions,
  RENTAL_COVERAGE_GAP_MODELS,
} from "../rental-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleRentalOperationDefinitions", () => {
  it("1. returns zero Rental definitions with null inputs", () => {
    const defs = assembleRentalOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Rental must currently emit zero definitions");
  });

  it("2. still returns zero Rental definitions when gates are active", () => {
    const defs = assembleRentalOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "RM-04": true, "RM-01": ["Rental of assets or equipment"] })
    );
    assert.equal(Object.keys(defs).length, 0, "Rental must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(RENTAL_COVERAGE_GAP_MODELS, ["sale.order", "product.template"]);
  });

  it("4. no Rental definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleRentalOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleRentalOperationDefinitions(null, null));
  });
});
