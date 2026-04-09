import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleExpensesOperationDefinitions,
  EXPENSES_COVERAGE_GAP_MODELS,
} from "../expenses-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleExpensesOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleExpensesOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Expenses must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleExpensesOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "EX-01": "Yes", "EX-02": "Direct manager" })
    );
    assert.equal(Object.keys(defs).length, 0, "Expenses must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(EXPENSES_COVERAGE_GAP_MODELS, ["hr.expense", "hr.expense.sheet"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleExpensesOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleExpensesOperationDefinitions(null, null));
  });
});
