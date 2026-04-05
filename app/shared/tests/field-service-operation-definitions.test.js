// ---------------------------------------------------------------------------
// Field Service Operation Definitions Tests
// Tests for: app/shared/field-service-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional Field Service definitions assembled (3 with null inputs)
//   2.  Conditional Field Service definitions assembled when gates are active
//   3.  Every assembled definition carries the required operation-definition fields
//   4.  No Field Service definition references a model outside ALLOWED_APPLY_MODELS
//   5.  intended_changes is null for every Field Service definition — honest-null behavior
//   6.  Coverage gaps are documented
//   7.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleFieldServiceOperationDefinitions,
  FIELD_SERVICE_CHECKPOINT_METADATA,
  FIELD_SERVICE_COVERAGE_GAP_MODELS,
  FIELD_SERVICE_TARGET_METHOD,
} from "../field-service-operation-definitions.js";
import { CHECKPOINT_IDS } from "../checkpoint-engine.js";
import {
  assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleFieldServiceOperationDefinitions", () => {
  it("1. assembles 3 unconditional Field Service definitions with null inputs", () => {
    const defs = assembleFieldServiceOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 3, "expected 3 unconditional Field Service definitions");
    assert.ok(defs[CHECKPOINT_IDS.FSV_FOUND_001]);
    assert.ok(defs[CHECKPOINT_IDS.FSV_DREQ_001]);
    assert.ok(defs[CHECKPOINT_IDS.FSV_DREQ_002]);
  });

  it("2. assembles 4 Field Service definitions when gates are active", () => {
    const defs = assembleFieldServiceOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-01": true })
    );
    assert.equal(Object.keys(defs).length, 4, "expected 4 Field Service definitions with OP-01 active");
    assert.ok(defs[CHECKPOINT_IDS.FSV_DREQ_003]);
  });

  it("3. every assembled Field Service definition carries the required metadata fields", () => {
    const defs = assembleFieldServiceOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-01": "Yes" })
    );
    assertDefinitionMetadata(defs, FIELD_SERVICE_CHECKPOINT_METADATA, FIELD_SERVICE_TARGET_METHOD);
  });

  it("4. no Field Service definition references a model outside ALLOWED_APPLY_MODELS", () => {
    const defs = assembleFieldServiceOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-01": true })
    );
    assertDefinitionsUseAllowedModels(defs, ALLOWED_APPLY_MODELS);
  });

  it("5. intended_changes is null for every Field Service definition — honest-null behavior", () => {
    const defs = assembleFieldServiceOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-01": true })
    );
    for (const key of Object.keys(defs)) {
      assert.equal(defs[key].intended_changes, null, `${key} intended_changes must be null`);
    }
  });

  it("6. coverage gaps are documented", () => {
    assert.deepEqual(FIELD_SERVICE_COVERAGE_GAP_MODELS, ["project.task"]);
  });

  it("7. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleFieldServiceOperationDefinitions(null, null));
  });
});
