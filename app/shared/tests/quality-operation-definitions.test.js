// ---------------------------------------------------------------------------
// Quality Operation Definitions Tests
// Tests for: app/shared/quality-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  quality.point is present in ALLOWED_APPLY_MODELS and the assembler
//       returns the unconditional Quality definition with null inputs
//   2.  Conditional Quality definitions assemble only when MF-06 selections
//       activate them
//   3.  Every assembled definition carries the required operation-definition fields
//   4.  No Quality definition references a model outside ALLOWED_APPLY_MODELS
//   5.  intended_changes is null for every Quality definition — honest-null behavior
//   6.  Remaining coverage gaps are documented
//   7.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleQualityOperationDefinitions,
  QUALITY_CHECKPOINT_METADATA,
  QUALITY_COVERAGE_GAP_MODELS,
  QUALITY_POINT_MODEL,
  QUALITY_TARGET_METHOD,
} from "../quality-operation-definitions.js";
import { CHECKPOINT_IDS } from "../checkpoint-engine.js";
import {
  assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleQualityOperationDefinitions", () => {
  it("1. assembles the unconditional Quality definition once quality.point is in ALLOWED_APPLY_MODELS", () => {
    assert.ok(
      ALLOWED_APPLY_MODELS.includes(QUALITY_POINT_MODEL),
      "quality.point must be present in ALLOWED_APPLY_MODELS"
    );

    const defs = assembleQualityOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 1, "expected 1 unconditional Quality definition");
    assert.ok(defs[CHECKPOINT_IDS.QUA_FOUND_001]);
    assert.equal(defs[CHECKPOINT_IDS.QUA_DREQ_001], undefined);
    assert.equal(defs[CHECKPOINT_IDS.QUA_DREQ_002], undefined);
    assert.equal(defs[CHECKPOINT_IDS.QUA_DREQ_003], undefined);
  });

  it("2. assembles the conditional Quality definitions only when MF-06 selections are active", () => {
    const defs = assembleQualityOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "MF-06": ["Receipt", "In-process", "Finished goods"] })
    );

    assert.equal(Object.keys(defs).length, 4, "expected 4 Quality definitions with all gates active");
    assert.ok(defs[CHECKPOINT_IDS.QUA_DREQ_001]);
    assert.ok(defs[CHECKPOINT_IDS.QUA_DREQ_002]);
    assert.ok(defs[CHECKPOINT_IDS.QUA_DREQ_003]);

    const partialDefs = assembleQualityOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "MF-06": ["Receipt"] })
    );

    assert.ok(partialDefs[CHECKPOINT_IDS.QUA_DREQ_001]);
    assert.equal(partialDefs[CHECKPOINT_IDS.QUA_DREQ_002], undefined);
    assert.equal(partialDefs[CHECKPOINT_IDS.QUA_DREQ_003], undefined);
  });

  it("3. every assembled Quality definition carries the required metadata fields", () => {
    const defs = assembleQualityOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "MF-06": ["Receipt", "In-process", "Finished goods"] })
    );
    assertDefinitionMetadata(defs, QUALITY_CHECKPOINT_METADATA, QUALITY_TARGET_METHOD);
  });

  it("4. no Quality definition references a model outside ALLOWED_APPLY_MODELS", () => {
    const defs = assembleQualityOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "MF-06": ["Receipt", "In-process", "Finished goods"] })
    );
    assertDefinitionsUseAllowedModels(defs, ALLOWED_APPLY_MODELS);
  });

  it("5. intended_changes is null for every Quality definition — honest-null behavior", () => {
    const defs = assembleQualityOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "MF-06": ["Receipt", "In-process", "Finished goods"] })
    );
    for (const key of Object.keys(defs)) {
      assert.equal(defs[key].intended_changes, null, `${key} intended_changes must be null`);
    }
  });

  it("6. remaining coverage gaps are documented", () => {
    assert.deepEqual(QUALITY_COVERAGE_GAP_MODELS, ["quality.alert"]);
  });

  it("7. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleQualityOperationDefinitions(null, null));
  });
});
