import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleAppraisalsOperationDefinitions,
  APPRAISALS_COVERAGE_GAP_MODELS,
} from "../appraisals-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleAppraisalsOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleAppraisalsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Appraisals must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleAppraisalsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "AP-01": "No", "AP-02": "Annually" })
    );
    assert.equal(Object.keys(defs).length, 0, "Appraisals must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(APPRAISALS_COVERAGE_GAP_MODELS, ["hr.appraisal", "hr.appraisal.goal"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleAppraisalsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleAppraisalsOperationDefinitions(null, null));
  });
});
