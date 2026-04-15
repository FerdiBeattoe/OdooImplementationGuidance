import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleHelpdeskOperationDefinitions, HELPDESK_CHECKPOINT_METADATA, HELPDESK_COVERAGE_GAP_MODELS, HELPDESK_TARGET_METHOD } from "../helpdesk-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleHelpdeskOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleHelpdeskOperationDefinitions(null, null)).length, Object.keys(HELPDESK_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleHelpdeskOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), HELPDESK_CHECKPOINT_METADATA, HELPDESK_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleHelpdeskOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(HELPDESK_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleHelpdeskOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleHelpdeskOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. team-setup intended_changes includes name from wizard team_name", () => {
    const captures = { helpdesk: { team_name: "Customer Support", team_alias_email: "support@company.com", assignment_rule: "random" } };
    const defs = assembleHelpdeskOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-helpdesk-team-setup"].intended_changes, { name: "Customer Support", alias_name: "support", auto_assignment: true, assign_method: "randomly" });
  });
  it("8. team-setup auto_assignment false for manual assignment rule", () => {
    const captures = { helpdesk: { team_name: "Tier 1", team_alias_email: "tier1@company.com", assignment_rule: "manual" } };
    const defs = assembleHelpdeskOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-helpdesk-team-setup"].intended_changes, { name: "Tier 1", alias_name: "tier1", auto_assignment: false });
  });
  it("9. team-setup assign_method balanced for balanced rule", () => {
    const captures = { helpdesk: { team_name: "Escalation", team_alias_email: "esc@company.com", assignment_rule: "balanced" } };
    const defs = assembleHelpdeskOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-helpdesk-team-setup"].intended_changes.assign_method, "balanced");
  });
  it("10. stages / sla / escalation remain honest-null even with captures", () => {
    const captures = { helpdesk: { team_name: "X", team_alias_email: "x@y.com", stages: ["New", "In Progress"], sla_response_hours: 4, sla_owner: "Jane" } };
    const defs = assembleHelpdeskOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-helpdesk-ticket-stages"].intended_changes, null);
    assert.equal(defs["checkpoint-helpdesk-sla-policy"].intended_changes, null);
    assert.equal(defs["checkpoint-helpdesk-escalation-rules"].intended_changes, null);
  });
});
