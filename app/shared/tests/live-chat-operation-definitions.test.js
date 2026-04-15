import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleLiveChatOperationDefinitions, LIVE_CHAT_CHECKPOINT_METADATA, LIVE_CHAT_COVERAGE_GAP_MODELS, LIVE_CHAT_TARGET_METHOD } from "../live-chat-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleLiveChatOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleLiveChatOperationDefinitions(null, null)).length, Object.keys(LIVE_CHAT_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), LIVE_CHAT_CHECKPOINT_METADATA, LIVE_CHAT_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(LIVE_CHAT_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleLiveChatOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. channel-setup writes the channel name from wizard capture", () => {
    const captures = { "live-chat": { channel_name: "Website support" } };
    const defs = assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-live-chat-channel-setup"].intended_changes, { name: "Website support" });
  });
  it("8. channel-setup trims whitespace and is null for blank name", () => {
    const trimmed = assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { "live-chat": { channel_name: "  Support  " } });
    assert.deepEqual(trimmed["checkpoint-live-chat-channel-setup"].intended_changes, { name: "Support" });
    const blank = assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { "live-chat": { channel_name: "   " } });
    assert.equal(blank["checkpoint-live-chat-channel-setup"].intended_changes, null);
  });
  it("9. operator-assignment, chatbot-baseline, website-integration, offline-policy remain honest-null", () => {
    const captures = { "live-chat": { channel_name: "X", operators: ["Jane"], coverage_hours: "Mon-Fri", fallback_mode: "chatbot", convert_to_ticket: true, widget_page_rule: "/pricing" } };
    const defs = assembleLiveChatOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-live-chat-operator-assignment"].intended_changes, null);
    assert.equal(defs["checkpoint-live-chat-chatbot-baseline"].intended_changes, null);
    assert.equal(defs["checkpoint-live-chat-website-integration"].intended_changes, null);
    assert.equal(defs["checkpoint-live-chat-offline-policy"].intended_changes, null);
  });
});
