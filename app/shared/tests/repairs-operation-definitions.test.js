// ---------------------------------------------------------------------------
// Repairs Operation Definitions Tests
// Tests for: app/shared/repairs-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Repairs assembler returns zero definitions with null inputs
//   2.  Repairs assembler still returns zero definitions when gates are active
//   3.  Coverage gaps are documented
//   4.  No Repairs definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleRepairsOperationDefinitions,
  REPAIRS_COVERAGE_GAP_MODELS,
} from "../repairs-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleRepairsOperationDefinitions", () => {
  it("1. returns zero Repairs definitions with null inputs", () => {
    const defs = assembleRepairsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Repairs must currently emit zero definitions");
  });

  it("2. still returns zero Repairs definitions when gates are active", () => {
    const defs = assembleRepairsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-01": true, "RM-01": ["One-time service delivery"], "OP-05": true })
    );
    assert.equal(Object.keys(defs).length, 0, "Repairs must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(REPAIRS_COVERAGE_GAP_MODELS, ["repair.order"]);
  });

  it("4. no Repairs definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleRepairsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleRepairsOperationDefinitions(null, null));
  });
});
