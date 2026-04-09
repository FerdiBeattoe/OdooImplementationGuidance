import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleVoipOperationDefinitions,
  VOIP_COVERAGE_GAP_MODELS,
} from "../voip-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleVoipOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleVoipOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "VoIP must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleVoipOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({})
    );
    assert.equal(Object.keys(defs).length, 0, "VoIP must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(VOIP_COVERAGE_GAP_MODELS, ["voip.provider", "res.users"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleVoipOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleVoipOperationDefinitions(null, null));
  });
});
