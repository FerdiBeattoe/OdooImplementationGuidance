import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleRecruitmentOperationDefinitions,
  RECRUITMENT_COVERAGE_GAP_MODELS,
} from "../recruitment-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleRecruitmentOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleRecruitmentOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Recruitment must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleRecruitmentOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "RC-01": "Yes", "RC-02": "Yes" })
    );
    assert.equal(Object.keys(defs).length, 0, "Recruitment must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(RECRUITMENT_COVERAGE_GAP_MODELS, ["hr.applicant", "hr.job"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleRecruitmentOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleRecruitmentOperationDefinitions(null, null));
  });
});
