// ---------------------------------------------------------------------------
// Maintenance Operation Definitions Tests
// Tests for: app/shared/maintenance-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Maintenance assembler returns zero definitions with null inputs
//   2.  Maintenance assembler still returns zero definitions when gates are active
//   3.  Coverage gaps are documented
//   4.  No Maintenance definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleMaintenanceOperationDefinitions,
  MAINTENANCE_COVERAGE_GAP_MODELS,
} from "../maintenance-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleMaintenanceOperationDefinitions", () => {
  it("1. returns zero Maintenance definitions with null inputs", () => {
    const defs = assembleMaintenanceOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Maintenance must currently emit zero definitions");
  });

  it("2. still returns zero Maintenance definitions when gates are active", () => {
    const defs = assembleMaintenanceOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "MF-03": true, "MF-07": true })
    );
    assert.equal(Object.keys(defs).length, 0, "Maintenance must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(MAINTENANCE_COVERAGE_GAP_MODELS, ["maintenance.equipment", "maintenance.request"]);
  });

  it("4. no Maintenance definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleMaintenanceOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleMaintenanceOperationDefinitions(null, null));
  });
});
