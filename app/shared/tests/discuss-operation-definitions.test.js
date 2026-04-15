import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleDiscussOperationDefinitions, DISCUSS_CHECKPOINT_METADATA, DISCUSS_COVERAGE_GAP_MODELS, DISCUSS_TARGET_METHOD } from "../discuss-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleDiscussOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleDiscussOperationDefinitions(null, null)).length, Object.keys(DISCUSS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), DISCUSS_CHECKPOINT_METADATA, DISCUSS_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(DISCUSS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleDiscussOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. channel-structure seeds first default channel name with channel_type=channel", () => {
    const captures = { discuss: { default_channels: ["general", "announcements"], default_channel_visibility: "public", notification_default: "mentions_only", use_video_calls: true } };
    const defs = assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-discuss-channel-structure"].intended_changes, { name: "general", channel_type: "channel" });
  });
  it("8. channel-structure trims whitespace on first channel name", () => {
    const captures = { discuss: { default_channels: ["  general  "] } };
    const defs = assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-discuss-channel-structure"].intended_changes, { name: "general", channel_type: "channel" });
  });
  it("9. channel-structure null when default_channels is empty", () => {
    const captures = { discuss: { default_channels: [] } };
    const defs = assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-discuss-channel-structure"].intended_changes, null);
  });
  it("10. channel-structure null when first channel is blank", () => {
    const captures = { discuss: { default_channels: ["   "] } };
    const defs = assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-discuss-channel-structure"].intended_changes, null);
  });
  it("11. messaging-policy, notification-rules, external-email remain honest-null", () => {
    const captures = { discuss: { default_channels: ["general"], default_channel_visibility: "private", notification_default: "all_messages", use_video_calls: false } };
    const defs = assembleDiscussOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-discuss-messaging-policy"].intended_changes, null);
    assert.equal(defs["checkpoint-discuss-notification-rules"].intended_changes, null);
    assert.equal(defs["checkpoint-discuss-external-email"].intended_changes, null);
  });
});
