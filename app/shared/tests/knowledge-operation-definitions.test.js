import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleKnowledgeOperationDefinitions, KNOWLEDGE_CHECKPOINT_METADATA, KNOWLEDGE_COVERAGE_GAP_MODELS, KNOWLEDGE_TARGET_METHOD } from "../knowledge-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleKnowledgeOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleKnowledgeOperationDefinitions(null, null)).length, Object.keys(KNOWLEDGE_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), KNOWLEDGE_CHECKPOINT_METADATA, KNOWLEDGE_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(KNOWLEDGE_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleKnowledgeOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. base-structure seeds first workspace name with category=workspace", () => {
    const captures = { knowledge: { top_level_workspaces: ["Operations", "Engineering"] } };
    const defs = assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.deepEqual(defs["checkpoint-knowledge-base-structure"].intended_changes, { name: "Operations", category: "workspace" });
  });
  it("8. base-structure null when workspaces empty or blank", () => {
    for (const workspaces of [[], [""], ["   "]]) {
      const defs = assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { knowledge: { top_level_workspaces: workspaces } });
      assert.equal(defs["checkpoint-knowledge-base-structure"].intended_changes, null);
    }
  });
  it("9. scope maps company to internal_permission=read", () => {
    const defs = assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { knowledge: { default_access: "company" } });
    assert.deepEqual(defs["checkpoint-knowledge-scope"].intended_changes, { internal_permission: "read" });
  });
  it("10. scope maps restricted to internal_permission=none", () => {
    const defs = assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { knowledge: { default_access: "restricted" } });
    assert.deepEqual(defs["checkpoint-knowledge-scope"].intended_changes, { internal_permission: "none" });
  });
  it("11. scope null for public default_access (is_published axis, not internal_permission)", () => {
    const defs = assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { knowledge: { default_access: "public" } });
    assert.equal(defs["checkpoint-knowledge-scope"].intended_changes, null);
  });
  it("12. article-template and access-rights remain honest-null", () => {
    const captures = { knowledge: { top_level_workspaces: ["Ops"], workspace_owner: "Head", default_access: "company", helpdesk_linkage: true, migrate_existing_wiki: false } };
    const defs = assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-knowledge-article-template"].intended_changes, null);
    assert.equal(defs["checkpoint-knowledge-access-rights"].intended_changes, null);
  });
});
