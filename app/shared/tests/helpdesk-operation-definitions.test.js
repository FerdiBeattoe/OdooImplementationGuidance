import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleHelpdeskOperationDefinitions,
  HELPDESK_COVERAGE_GAP_MODELS,
} from "../helpdesk-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleHelpdeskOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleHelpdeskOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Helpdesk must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleHelpdeskOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "HD-01": "Yes", "HD-02": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "Helpdesk must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(HELPDESK_COVERAGE_GAP_MODELS, ["helpdesk.ticket", "helpdesk.team"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleHelpdeskOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleHelpdeskOperationDefinitions(null, null));
  });
});
