// ---------------------------------------------------------------------------
// Manufacturing Operation Definitions Tests
// Tests for: app/shared/manufacturing-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional Manufacturing definitions assembled (2 with null inputs)
//   2.  Conditional Manufacturing definitions assembled when all compatible gates are active
//   3.  Every assembled definition carries the required operation-definition fields
//   4.  No Manufacturing definition references a model outside ALLOWED_APPLY_MODELS
//   5.  intended_changes is null for every Manufacturing definition — honest-null behavior
//   6.  Coverage gaps are documented
//   7.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleManufacturingOperationDefinitions,
  MANUFACTURING_CHECKPOINT_METADATA,
  MANUFACTURING_COVERAGE_GAP_MODELS,
  MANUFACTURING_TARGET_METHOD,
} from "../manufacturing-operation-definitions.js";
import { CHECKPOINT_IDS } from "../checkpoint-engine.js";
import {
  assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleManufacturingOperationDefinitions", () => {
  it("1. assembles 2 unconditional Manufacturing definitions with null inputs", () => {
    const defs = assembleManufacturingOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 2, "expected 2 unconditional Manufacturing definitions");
    assert.ok(defs[CHECKPOINT_IDS.MRP_DREQ_001]);
    assert.ok(defs[CHECKPOINT_IDS.MRP_DREQ_002]);
  });

  it("2. assembles 7 Manufacturing definitions when all compatible gates are active", () => {
    const defs = assembleManufacturingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "MF-02": "Multi-level",
        "MF-03": true,
        "MF-04": true,
        "FC-01": "Full accounting",
      })
    );
    assert.equal(Object.keys(defs).length, 7, "expected 7 Manufacturing definitions with compatible conditionals");
    assert.ok(defs[CHECKPOINT_IDS.MRP_DREQ_003]);
    assert.ok(defs[CHECKPOINT_IDS.MRP_DREQ_005]);
    assert.ok(defs[CHECKPOINT_IDS.MRP_DREQ_006]);
    assert.ok(defs[CHECKPOINT_IDS.MRP_DREQ_007]);
    assert.ok(defs[CHECKPOINT_IDS.MRP_DREQ_008]);
    assert.equal(defs[CHECKPOINT_IDS.MRP_DREQ_004], undefined, "MRP-DREQ-004 must be absent when MF-02='Multi-level'");
  });

  it("3. every assembled Manufacturing definition carries the required metadata fields", () => {
    const defs = assembleManufacturingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "MF-02": "Phantom",
        "MF-03": "Yes",
        "MF-04": "Yes",
      })
    );
    assertDefinitionMetadata(defs, MANUFACTURING_CHECKPOINT_METADATA, MANUFACTURING_TARGET_METHOD);
  });

  it("4. no Manufacturing definition references a model outside ALLOWED_APPLY_MODELS", () => {
    const defs = assembleManufacturingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "MF-02": "Multi-level",
        "MF-03": true,
        "MF-04": true,
        "FC-01": "Full accounting",
      })
    );
    assertDefinitionsUseAllowedModels(defs, ALLOWED_APPLY_MODELS);
  });

  it("5. intended_changes is null for every Manufacturing definition — honest-null behavior", () => {
    const defs = assembleManufacturingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "MF-02": "Phantom",
        "MF-03": true,
        "MF-04": true,
      })
    );
    for (const key of Object.keys(defs)) {
      assert.equal(defs[key].intended_changes, null, `${key} intended_changes must be null`);
    }
  });

  it("6. coverage gaps are documented for requested non-allowed Manufacturing models", () => {
    assert.deepEqual(MANUFACTURING_COVERAGE_GAP_MODELS, ["mrp.bom", "mrp.routing"]);
  });

  it("7. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleManufacturingOperationDefinitions(null, null));
  });
});
