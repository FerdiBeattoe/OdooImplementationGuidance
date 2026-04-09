import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleWhatsappOperationDefinitions,
  WHATSAPP_COVERAGE_GAP_MODELS,
} from "../whatsapp-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleWhatsappOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleWhatsappOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "WhatsApp must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleWhatsappOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "WA-01": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "WhatsApp must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(WHATSAPP_COVERAGE_GAP_MODELS, ["whatsapp.template", "whatsapp.account"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleWhatsappOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleWhatsappOperationDefinitions(null, null));
  });
});
