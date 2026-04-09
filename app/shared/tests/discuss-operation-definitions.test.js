import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleDiscussOperationDefinitions,
  DISCUSS_COVERAGE_GAP_MODELS,
} from "../discuss-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleDiscussOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleDiscussOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Discuss must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleDiscussOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "DI-01": "Yes" })
    );
    assert.equal(Object.keys(defs).length, 0, "Discuss must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(DISCUSS_COVERAGE_GAP_MODELS, ["mail.channel", "res.users"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleDiscussOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleDiscussOperationDefinitions(null, null));
  });
});
