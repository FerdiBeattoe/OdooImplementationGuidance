import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleTimesheetsOperationDefinitions,
  TIMESHEETS_COVERAGE_GAP_MODELS,
} from "../timesheets-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleTimesheetsOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleTimesheetsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Timesheets must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleTimesheetsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "TS-01": "Yes", "TS-02": "Yes, approval required" })
    );
    assert.equal(Object.keys(defs).length, 0, "Timesheets must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(TIMESHEETS_COVERAGE_GAP_MODELS, ["hr.timesheet", "project.task"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleTimesheetsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleTimesheetsOperationDefinitions(null, null));
  });
});
