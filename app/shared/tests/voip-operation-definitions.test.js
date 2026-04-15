import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleVoipOperationDefinitions, VOIP_CHECKPOINT_METADATA, VOIP_COVERAGE_GAP_MODELS, VOIP_TARGET_METHOD } from "../voip-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleVoipOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleVoipOperationDefinitions(null, null)).length, Object.keys(VOIP_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), VOIP_CHECKPOINT_METADATA, VOIP_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(VOIP_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleVoipOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. provider-connection maps axivox to name=Axivox", () => {
    const defs = assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { voip: { sip_provider: "axivox" } });
    assert.deepEqual(defs["checkpoint-voip-provider-connection"].intended_changes, { name: "Axivox" });
  });
  it("8. provider-connection maps onsip to name=OnSIP", () => {
    const defs = assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { voip: { sip_provider: "onsip" } });
    assert.deepEqual(defs["checkpoint-voip-provider-connection"].intended_changes, { name: "OnSIP" });
  });
  it("9. provider-connection null for other_sip or unknown", () => {
    for (const sip_provider of ["other_sip", undefined, "bogus"]) {
      const defs = assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { voip: { sip_provider } });
      assert.equal(defs["checkpoint-voip-provider-connection"].intended_changes, null);
    }
  });
  it("10. extension-assignment, call-logging, crm-integration remain honest-null", () => {
    const captures = { voip: { sip_provider: "axivox", websocket_server: "wss://x", sip_domain: "x.example", recording_policy: "consented_only", enterprise_instance_confirmed: true, pilot_user_name: "Jane Smith" } };
    const defs = assembleVoipOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-voip-extension-assignment"].intended_changes, null);
    assert.equal(defs["checkpoint-voip-call-logging"].intended_changes, null);
    assert.equal(defs["checkpoint-voip-crm-integration"].intended_changes, null);
  });
});
