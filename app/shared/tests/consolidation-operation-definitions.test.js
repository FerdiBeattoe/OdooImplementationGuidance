import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleConsolidationOperationDefinitions,
  CONSOLIDATION_COVERAGE_GAP_MODELS,
} from "../consolidation-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleConsolidationOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleConsolidationOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Consolidation must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleConsolidationOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({})
    );
    assert.equal(Object.keys(defs).length, 0, "Consolidation must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(CONSOLIDATION_COVERAGE_GAP_MODELS, ["consolidation.company", "consolidation.period"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleConsolidationOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleConsolidationOperationDefinitions(null, null));
  });
});
