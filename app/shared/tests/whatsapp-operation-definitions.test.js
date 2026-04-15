import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleWhatsappOperationDefinitions, WHATSAPP_CHECKPOINT_METADATA, WHATSAPP_COVERAGE_GAP_MODELS, WHATSAPP_TARGET_METHOD } from "../whatsapp-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleWhatsappOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleWhatsappOperationDefinitions(null, null)).length, Object.keys(WHATSAPP_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleWhatsappOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), WHATSAPP_CHECKPOINT_METADATA, WHATSAPP_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleWhatsappOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(WHATSAPP_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleWhatsappOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleWhatsappOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. account-connection maps phone_number_id and business_account_id", () => {
    const defs = assembleWhatsappOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { whatsapp: { phone_number_id: "1234567890", business_account_id: "9876543210" } });
    assert.deepEqual(defs["checkpoint-whatsapp-account-connection"].intended_changes, { phone_uid: "1234567890", account_uid: "9876543210" });
  });
  it("8. account-connection null when either id missing/blank", () => {
    for (const capture of [{}, { phone_number_id: "1234" }, { business_account_id: "9876" }, { phone_number_id: "   ", business_account_id: "9876" }]) {
      const defs = assembleWhatsappOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { whatsapp: capture });
      assert.equal(defs["checkpoint-whatsapp-account-connection"].intended_changes, null);
    }
  });
  it("9. message-template, optin-policy, document-triggers remain honest-null", () => {
    const captures = { whatsapp: { meta_verified_number: "+442071234567", phone_number_id: "1234567890", business_account_id: "9876543210", webhook_verify_token: "tok", first_template_names: ["order_confirmation"], enterprise_instance_confirmed: true, routes_to_helpdesk: true } };
    const defs = assembleWhatsappOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-whatsapp-message-template"].intended_changes, null);
    assert.equal(defs["checkpoint-whatsapp-optin-policy"].intended_changes, null);
    assert.equal(defs["checkpoint-whatsapp-document-triggers"].intended_changes, null);
  });
});
