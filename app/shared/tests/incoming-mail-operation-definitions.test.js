import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleIncomingMailOperationDefinitions, INCOMING_MAIL_CHECKPOINT_METADATA, INCOMING_MAIL_COVERAGE_GAP_MODELS, INCOMING_MAIL_TARGET_METHOD } from "../incoming-mail-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleIncomingMailOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleIncomingMailOperationDefinitions(null, null)).length, Object.keys(INCOMING_MAIL_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), INCOMING_MAIL_CHECKPOINT_METADATA, INCOMING_MAIL_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(INCOMING_MAIL_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleIncomingMailOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. server-setup maps imap fetching_method to fetchmail.server seed", () => {
    const captures = { "incoming-mail": { fetching_method: "imap" } };
    const defs = assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-incoming-mail-server-setup"].intended_changes, { name: "IMAP fetcher", server_type: "imap" });
  });
  it("8. server-setup maps pop fetching_method to fetchmail.server seed", () => {
    const captures = { "incoming-mail": { fetching_method: "pop" } };
    const defs = assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-incoming-mail-server-setup"].intended_changes, { name: "POP fetcher", server_type: "pop" });
  });
  it("9. server-setup null when fetching_method=catchall_forward (no fetchmail needed)", () => {
    const captures = { "incoming-mail": { fetching_method: "catchall_forward" } };
    const defs = assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-incoming-mail-server-setup"].intended_changes, null);
  });
  it("10. catchall-address, alias-mapping, routing-rules remain honest-null", () => {
    const captures = { "incoming-mail": { alias_domain: "company.com", fetching_method: "imap", routed_aliases: ["sales@ - CRM"], bounce_address: "bounce@company.com", mx_forwarding_verified: true } };
    const defs = assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-incoming-mail-catchall-address"].intended_changes, null);
    assert.equal(defs["checkpoint-incoming-mail-alias-mapping"].intended_changes, null);
    assert.equal(defs["checkpoint-incoming-mail-routing-rules"].intended_changes, null);
  });
});
