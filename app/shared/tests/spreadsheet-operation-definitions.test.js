import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleSpreadsheetOperationDefinitions,
  SPREADSHEET_COVERAGE_GAP_MODELS,
} from "../spreadsheet-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleSpreadsheetOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleSpreadsheetOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Spreadsheet must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleSpreadsheetOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "SP-01": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "Spreadsheet must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(SPREADSHEET_COVERAGE_GAP_MODELS, ["spreadsheet.template", "documents.document"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleSpreadsheetOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleSpreadsheetOperationDefinitions(null, null));
  });
});
