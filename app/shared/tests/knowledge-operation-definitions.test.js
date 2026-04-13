import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleKnowledgeOperationDefinitions, KNOWLEDGE_CHECKPOINT_METADATA, KNOWLEDGE_COVERAGE_GAP_MODELS, KNOWLEDGE_TARGET_METHOD } from "../knowledge-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleKnowledgeOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleKnowledgeOperationDefinitions(null, null)).length, Object.keys(KNOWLEDGE_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), KNOWLEDGE_CHECKPOINT_METADATA, KNOWLEDGE_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleKnowledgeOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(KNOWLEDGE_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleKnowledgeOperationDefinitions(null, null)); });
});
