import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleLiveChatOperationDefinitions, LIVE_CHAT_CHECKPOINT_METADATA, LIVE_CHAT_COVERAGE_GAP_MODELS, LIVE_CHAT_TARGET_METHOD } from "../live-chat-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleLiveChatOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleLiveChatOperationDefinitions(null, null)).length, Object.keys(LIVE_CHAT_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), LIVE_CHAT_CHECKPOINT_METADATA, LIVE_CHAT_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(LIVE_CHAT_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleLiveChatOperationDefinitions(null, null)); });
});
