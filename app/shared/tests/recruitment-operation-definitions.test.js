import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleRecruitmentOperationDefinitions, RECRUITMENT_CHECKPOINT_METADATA, RECRUITMENT_COVERAGE_GAP_MODELS, RECRUITMENT_TARGET_METHOD } from "../recruitment-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleRecruitmentOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleRecruitmentOperationDefinitions(null, null)).length, Object.keys(RECRUITMENT_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleRecruitmentOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), RECRUITMENT_CHECKPOINT_METADATA, RECRUITMENT_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleRecruitmentOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(RECRUITMENT_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleRecruitmentOperationDefinitions(null, null)); });
});
