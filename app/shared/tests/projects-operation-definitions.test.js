// ---------------------------------------------------------------------------
// Projects Operation Definitions Tests
// Tests for: app/shared/projects-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Projects assembler returns zero definitions with null inputs
//   2.  Projects assembler still returns zero definitions when conditional gates are active
//   3.  Coverage gaps are documented
//   4.  No Projects definition references a model outside ALLOWED_APPLY_MODELS
//   5.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleProjectsOperationDefinitions,
  PROJECTS_COVERAGE_GAP_MODELS,
} from "../projects-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleProjectsOperationDefinitions", () => {
  it("1. returns zero Projects definitions with null inputs", () => {
    const defs = assembleProjectsOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Projects must currently emit zero definitions");
  });

  it("2. still returns zero Projects definitions when conditional gates are active", () => {
    const defs = assembleProjectsOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "RM-02": true, "FC-05": true })
    );
    assert.equal(Object.keys(defs).length, 0, "Projects must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(PROJECTS_COVERAGE_GAP_MODELS, ["project.project", "project.task.type"]);
  });

  it("4. no Projects definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleProjectsOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleProjectsOperationDefinitions(null, null));
  });
});
