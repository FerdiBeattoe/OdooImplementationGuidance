// ---------------------------------------------------------------------------
// PLM Operation Definitions Tests
// Tests for: app/shared/plm-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  PLM assembler returns zero definitions with null inputs
//   2.  PLM assembler still returns zero definitions when gates are active
//   3.  Coverage gaps are documented
//   4.  No PLM definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assemblePlmOperationDefinitions,
  PLM_COVERAGE_GAP_MODELS,
} from "../plm-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assemblePlmOperationDefinitions", () => {
  it("1. returns zero PLM definitions with null inputs", () => {
    const defs = assemblePlmOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "PLM must currently emit zero definitions");
  });

  it("2. still returns zero PLM definitions when gates are active", () => {
    const defs = assemblePlmOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "MF-01": true, "MF-05": true })
    );
    assert.equal(Object.keys(defs).length, 0, "PLM must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(PLM_COVERAGE_GAP_MODELS, ["mrp.eco.type", "mrp.eco"]);
  });

  it("4. no PLM definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assemblePlmOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assemblePlmOperationDefinitions(null, null));
  });
});
