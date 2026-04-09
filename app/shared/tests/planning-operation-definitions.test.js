import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assemblePlanningOperationDefinitions,
  PLANNING_COVERAGE_GAP_MODELS,
} from "../planning-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assemblePlanningOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assemblePlanningOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Planning must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assemblePlanningOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "PL-01": "No", "PL-02": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "Planning must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(PLANNING_COVERAGE_GAP_MODELS, ["planning.slot", "planning.role"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assemblePlanningOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assemblePlanningOperationDefinitions(null, null));
  });
});
