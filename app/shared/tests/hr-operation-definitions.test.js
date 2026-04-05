// ---------------------------------------------------------------------------
// HR Operation Definitions Tests
// Tests for: app/shared/hr-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional HR definitions assembled (3 with null inputs)
//   2.  Conditional HR definitions assembled when all compatible gates are active
//   3.  Every assembled definition carries the required operation-definition fields
//   4.  No HR definition references a model outside ALLOWED_APPLY_MODELS
//   5.  intended_changes is null for every HR definition — honest-null behavior
//   6.  Coverage gaps are documented
//   7.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleHrOperationDefinitions,
  HR_CHECKPOINT_METADATA,
  HR_COVERAGE_GAP_MODELS,
  HR_TARGET_METHOD,
} from "../hr-operation-definitions.js";
import { CHECKPOINT_IDS } from "../checkpoint-engine.js";
import {
  assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleHrOperationDefinitions", () => {
  it("1. assembles 3 unconditional HR definitions with null inputs", () => {
    const defs = assembleHrOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 3, "expected 3 unconditional HR definitions");
    assert.ok(defs[CHECKPOINT_IDS.HR_FOUND_001]);
    assert.ok(defs[CHECKPOINT_IDS.HR_DREQ_001]);
    assert.ok(defs[CHECKPOINT_IDS.HR_DREQ_002]);
  });

  it("2. assembles 5 HR definitions when all compatible gates are active", () => {
    const defs = assembleHrOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "TA-03": ["HR leave"],
        "RM-02": true,
      })
    );
    assert.equal(Object.keys(defs).length, 5, "expected 5 HR definitions with compatible conditionals");
    assert.ok(defs[CHECKPOINT_IDS.HR_DREQ_003]);
    assert.ok(defs[CHECKPOINT_IDS.HR_DREQ_004]);
  });

  it("3. every assembled HR definition carries the required metadata fields", () => {
    const defs = assembleHrOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "TA-03": ["HR leave"],
        "RM-02": "Yes",
      })
    );
    assertDefinitionMetadata(defs, HR_CHECKPOINT_METADATA, HR_TARGET_METHOD);
  });

  it("4. no HR definition references a model outside ALLOWED_APPLY_MODELS", () => {
    const defs = assembleHrOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "TA-03": ["HR leave"],
        "RM-02": true,
      })
    );
    assertDefinitionsUseAllowedModels(defs, ALLOWED_APPLY_MODELS);
  });

  it("5. intended_changes is null for every HR definition — honest-null behavior", () => {
    const defs = assembleHrOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "TA-03": ["HR leave"],
        "RM-02": true,
      })
    );
    for (const key of Object.keys(defs)) {
      assert.equal(defs[key].intended_changes, null, `${key} intended_changes must be null`);
    }
  });

  it("6. coverage gaps are documented", () => {
    assert.deepEqual(HR_COVERAGE_GAP_MODELS, []);
  });

  it("7. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleHrOperationDefinitions(null, null));
  });
});
