import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleLiveChatOperationDefinitions,
  LIVE_CHAT_COVERAGE_GAP_MODELS,
} from "../live-chat-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleLiveChatOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleLiveChatOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Live Chat must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleLiveChatOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "LC-01": "No", "LC-02": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "Live Chat must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(LIVE_CHAT_COVERAGE_GAP_MODELS, ["im_livechat.channel", "res.users"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleLiveChatOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleLiveChatOperationDefinitions(null, null));
  });
});
