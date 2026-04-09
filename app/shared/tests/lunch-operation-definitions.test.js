import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleLunchOperationDefinitions,
  LUNCH_COVERAGE_GAP_MODELS,
} from "../lunch-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleLunchOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleLunchOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Lunch must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleLunchOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({})
    );
    assert.equal(Object.keys(defs).length, 0, "Lunch must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(LUNCH_COVERAGE_GAP_MODELS, ["lunch.supplier", "lunch.product"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleLunchOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleLunchOperationDefinitions(null, null));
  });
});
