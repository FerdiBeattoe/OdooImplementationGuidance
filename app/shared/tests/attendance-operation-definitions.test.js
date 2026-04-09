import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleAttendanceOperationDefinitions,
  ATTENDANCE_COVERAGE_GAP_MODELS,
} from "../attendance-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleAttendanceOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleAttendanceOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Attendance must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleAttendanceOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "AT-01": "Manual entry", "AT-02": "Yes" })
    );
    assert.equal(Object.keys(defs).length, 0, "Attendance must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(ATTENDANCE_COVERAGE_GAP_MODELS, ["hr.attendance", "res.company"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleAttendanceOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleAttendanceOperationDefinitions(null, null));
  });
});
