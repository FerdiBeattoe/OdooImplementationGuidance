import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleFleetOperationDefinitions,
  FLEET_COVERAGE_GAP_MODELS,
} from "../fleet-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleFleetOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleFleetOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Fleet must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleFleetOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "FL-01": "No", "FL-02": "Yes" })
    );
    assert.equal(Object.keys(defs).length, 0, "Fleet must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(FLEET_COVERAGE_GAP_MODELS, ["fleet.vehicle", "fleet.vehicle.model"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleFleetOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleFleetOperationDefinitions(null, null));
  });
});
