import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assemblePayrollOperationDefinitions,
  PAYROLL_COVERAGE_GAP_MODELS,
} from "../payroll-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assemblePayrollOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assemblePayrollOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Payroll must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assemblePayrollOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "PY-01": "Yes", "PY-02": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "Payroll must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(PAYROLL_COVERAGE_GAP_MODELS, ["hr.payslip", "hr.salary.rule"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assemblePayrollOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assemblePayrollOperationDefinitions(null, null));
  });
});
