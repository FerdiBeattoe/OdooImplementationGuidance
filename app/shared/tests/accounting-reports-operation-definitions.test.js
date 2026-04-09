import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleAccountingReportsOperationDefinitions,
  ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS,
} from "../accounting-reports-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleAccountingReportsOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleAccountingReportsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Accounting Reports must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleAccountingReportsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "AR-01": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "Accounting Reports must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS, ["account.report", "account.financial.html.report"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleAccountingReportsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleAccountingReportsOperationDefinitions(null, null));
  });
});
