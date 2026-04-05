// ---------------------------------------------------------------------------
// Documents Operation Definitions Tests
// Tests for: app/shared/documents-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Documents assembler returns zero definitions with null inputs
//   2.  Documents assembler still returns zero definitions when gates are active
//   3.  Coverage gaps are documented
//   4.  No Documents definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleDocumentsOperationDefinitions,
  DOCUMENTS_COVERAGE_GAP_MODELS,
} from "../documents-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleDocumentsOperationDefinitions", () => {
  it("1. returns zero Documents definitions with null inputs", () => {
    const defs = assembleDocumentsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Documents must currently emit zero definitions");
  });

  it("2. still returns zero Documents definitions when gates are active", () => {
    const defs = assembleDocumentsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "BM-05": 100, "MF-05": true, "TA-03": ["Contract or document signing"] })
    );
    assert.equal(Object.keys(defs).length, 0, "Documents must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(DOCUMENTS_COVERAGE_GAP_MODELS, ["documents.folder", "documents.share"]);
  });

  it("4. no Documents definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleDocumentsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleDocumentsOperationDefinitions(null, null));
  });
});
