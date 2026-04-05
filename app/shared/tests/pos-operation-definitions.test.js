// ---------------------------------------------------------------------------
// POS Operation Definitions Tests
// Tests for: app/shared/pos-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional POS definitions assembled (4 with null inputs)
//   2.  Conditional POS definitions assembled when all compatible gates are active
//   3.  Every assembled definition carries the required operation-definition fields
//   4.  No POS definition references a model outside ALLOWED_APPLY_MODELS
//   5.  intended_changes is null for every POS definition — honest-null behavior
//   6.  Coverage gaps are documented
//   7.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assemblePosOperationDefinitions,
  POS_CHECKPOINT_METADATA,
  POS_COVERAGE_GAP_MODELS,
  POS_TARGET_METHOD,
} from "../pos-operation-definitions.js";
import { CHECKPOINT_IDS } from "../checkpoint-engine.js";
import {
  assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assemblePosOperationDefinitions", () => {
  it("1. assembles 4 unconditional POS definitions with null inputs", () => {
    const defs = assemblePosOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 4, "expected 4 unconditional POS definitions");
    assert.ok(defs[CHECKPOINT_IDS.POS_FOUND_001]);
    assert.ok(defs[CHECKPOINT_IDS.POS_DREQ_001]);
    assert.ok(defs[CHECKPOINT_IDS.POS_DREQ_002]);
    assert.ok(defs[CHECKPOINT_IDS.POS_DREQ_003]);
  });

  it("2. assembles 6 POS definitions when all compatible gates are active", () => {
    const defs = assemblePosOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "FC-01": "Full accounting",
        "OP-01": true,
      })
    );
    assert.equal(Object.keys(defs).length, 6, "expected 6 POS definitions with compatible conditionals");
    assert.ok(defs[CHECKPOINT_IDS.POS_DREQ_004]);
    assert.ok(defs[CHECKPOINT_IDS.POS_DREQ_005]);
  });

  it("3. every assembled POS definition carries the required metadata fields", () => {
    const defs = assemblePosOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "FC-01": "Full accounting",
        "OP-01": "Yes",
      })
    );
    assertDefinitionMetadata(defs, POS_CHECKPOINT_METADATA, POS_TARGET_METHOD);
  });

  it("4. no POS definition references a model outside ALLOWED_APPLY_MODELS", () => {
    const defs = assemblePosOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "FC-01": "Full accounting",
        "OP-01": true,
      })
    );
    assertDefinitionsUseAllowedModels(defs, ALLOWED_APPLY_MODELS);
  });

  it("5. intended_changes is null for every POS definition — honest-null behavior", () => {
    const defs = assemblePosOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "FC-01": "Full accounting",
        "OP-01": true,
      })
    );
    for (const key of Object.keys(defs)) {
      assert.equal(defs[key].intended_changes, null, `${key} intended_changes must be null`);
    }
  });

  it("6. coverage gaps are documented", () => {
    assert.deepEqual(POS_COVERAGE_GAP_MODELS, ["pos.config"]);
  });

  it("7. return is a plain object — never null, never array", () => {
    assertPlainObject(assemblePosOperationDefinitions(null, null));
  });
});
