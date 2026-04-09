import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleIncomingMailOperationDefinitions,
  INCOMING_MAIL_COVERAGE_GAP_MODELS,
} from "../incoming-mail-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleIncomingMailOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleIncomingMailOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Incoming Mail must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleIncomingMailOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "IM-01": "Yes", "IM-02": ["sales@  CRM leads"] })
    );
    assert.equal(Object.keys(defs).length, 0, "Incoming Mail must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(INCOMING_MAIL_COVERAGE_GAP_MODELS, ["fetchmail.server", "mail.alias"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleIncomingMailOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleIncomingMailOperationDefinitions(null, null));
  });
});
