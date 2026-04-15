import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleOutgoingMailOperationDefinitions, OUTGOING_MAIL_CHECKPOINT_METADATA, OUTGOING_MAIL_COVERAGE_GAP_MODELS, OUTGOING_MAIL_TARGET_METHOD } from "../outgoing-mail-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleOutgoingMailOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleOutgoingMailOperationDefinitions(null, null)).length, Object.keys(OUTGOING_MAIL_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), OUTGOING_MAIL_CHECKPOINT_METADATA, OUTGOING_MAIL_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(OUTGOING_MAIL_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleOutgoingMailOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. smtp-configuration maps google_workspace+oauth2 to smtp_authentication=gmail", () => {
    const defs = assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { "outgoing-mail": { smtp_provider: "google_workspace", auth_mode: "oauth2" } });
    assert.deepEqual(defs["checkpoint-outgoing-mail-smtp-configuration"].intended_changes, { smtp_authentication: "gmail" });
  });
  it("8. smtp-configuration maps microsoft_365+oauth2 to smtp_authentication=outlook", () => {
    const defs = assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { "outgoing-mail": { smtp_provider: "microsoft_365", auth_mode: "oauth2" } });
    assert.deepEqual(defs["checkpoint-outgoing-mail-smtp-configuration"].intended_changes, { smtp_authentication: "outlook" });
  });
  it("9. smtp-configuration maps custom/odoo_default to smtp_authentication=login regardless of auth_mode", () => {
    for (const smtp_provider of ["custom_smtp", "odoo_default"]) {
      const defs = assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { "outgoing-mail": { smtp_provider, auth_mode: "smtp_basic" } });
      assert.deepEqual(defs["checkpoint-outgoing-mail-smtp-configuration"].intended_changes, { smtp_authentication: "login" });
    }
  });
  it("10. smtp-configuration maps google/microsoft with non-OAuth auth to smtp_authentication=login", () => {
    for (const auth_mode of ["app_password", "smtp_basic", "api_key"]) {
      const defs = assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { "outgoing-mail": { smtp_provider: "google_workspace", auth_mode } });
      assert.deepEqual(defs["checkpoint-outgoing-mail-smtp-configuration"].intended_changes, { smtp_authentication: "login" });
    }
  });
  it("11. smtp-configuration null for unknown combinations", () => {
    const defs = assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { "outgoing-mail": { smtp_provider: "google_workspace" } });
    assert.equal(defs["checkpoint-outgoing-mail-smtp-configuration"].intended_changes, null);
  });
  it("12. sender-address, alias-setup, deliverability, test-send remain honest-null", () => {
    const captures = { "outgoing-mail": { smtp_provider: "google_workspace", auth_mode: "oauth2", default_from_address: "noreply@company.com", spf_dkim_dmarc_published: true, per_department_senders: false, department_from_addresses: [] } };
    const defs = assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-outgoing-mail-sender-address"].intended_changes, null);
    assert.equal(defs["checkpoint-outgoing-mail-alias-setup"].intended_changes, null);
    assert.equal(defs["checkpoint-outgoing-mail-deliverability"].intended_changes, null);
    assert.equal(defs["checkpoint-outgoing-mail-test-send"].intended_changes, null);
  });
});
