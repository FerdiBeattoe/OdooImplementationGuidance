import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleOutgoingMailOperationDefinitions,
  OUTGOING_MAIL_COVERAGE_GAP_MODELS,
} from "../outgoing-mail-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleOutgoingMailOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleOutgoingMailOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Outgoing Mail must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleOutgoingMailOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OM-01": "Gmail / Google Workspace", "OM-02": "Yes" })
    );
    assert.equal(Object.keys(defs).length, 0, "Outgoing Mail must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(OUTGOING_MAIL_COVERAGE_GAP_MODELS, ["ir.mail_server", "ir.config_parameter"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleOutgoingMailOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleOutgoingMailOperationDefinitions(null, null));
  });
});
