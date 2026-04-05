// ---------------------------------------------------------------------------
// Approvals Operation Definitions Tests
// Tests for: app/shared/approvals-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Approvals assembler returns zero definitions with null inputs
//   2.  Approvals assembler still returns zero definitions when gates are active
//   3.  Coverage gaps are documented
//   4.  No Approvals definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleApprovalsOperationDefinitions,
  APPROVALS_COVERAGE_GAP_MODELS,
} from "../approvals-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleApprovalsOperationDefinitions", () => {
  it("1. returns zero Approvals definitions with null inputs", () => {
    const defs = assembleApprovalsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Approvals must currently emit zero definitions");
  });

  it("2. still returns zero Approvals definitions when gates are active", () => {
    const defs = assembleApprovalsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "TA-03": ["Inventory adjustments", "Document signing"], "BM-05": 100, "SC-02": true })
    );
    assert.equal(Object.keys(defs).length, 0, "Approvals must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(APPROVALS_COVERAGE_GAP_MODELS, ["approval.category"]);
  });

  it("4. no Approvals definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleApprovalsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleApprovalsOperationDefinitions(null, null));
  });
});
