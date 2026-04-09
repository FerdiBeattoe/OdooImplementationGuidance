import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleKnowledgeOperationDefinitions,
  KNOWLEDGE_COVERAGE_GAP_MODELS,
} from "../knowledge-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleKnowledgeOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleKnowledgeOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Knowledge must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleKnowledgeOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "KN-01": "Yes" })
    );
    assert.equal(Object.keys(defs).length, 0, "Knowledge must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(KNOWLEDGE_COVERAGE_GAP_MODELS, ["knowledge.article"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleKnowledgeOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleKnowledgeOperationDefinitions(null, null));
  });
});
