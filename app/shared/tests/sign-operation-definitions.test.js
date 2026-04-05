// ---------------------------------------------------------------------------
// Sign Operation Definitions Tests
// Tests for: app/shared/sign-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Sign assembler returns zero definitions with null inputs
//   2.  Sign assembler still returns zero definitions when gates are active
//   3.  Coverage gaps are documented
//   4.  No Sign definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleSignOperationDefinitions,
  SIGN_COVERAGE_GAP_MODELS,
} from "../sign-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleSignOperationDefinitions", () => {
  it("1. returns zero Sign definitions with null inputs", () => {
    const defs = assembleSignOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Sign must currently emit zero definitions");
  });

  it("2. still returns zero Sign definitions when gates are active", () => {
    const defs = assembleSignOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "TA-03": ["Contract or document signing"] })
    );
    assert.equal(Object.keys(defs).length, 0, "Sign must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(SIGN_COVERAGE_GAP_MODELS, ["sign.template"]);
  });

  it("4. no Sign definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleSignOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleSignOperationDefinitions(null, null));
  });
});
