import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleAppraisalsOperationDefinitions, APPRAISALS_CHECKPOINT_METADATA, APPRAISALS_COVERAGE_GAP_MODELS, APPRAISALS_TARGET_METHOD } from "../appraisals-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleAppraisalsOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleAppraisalsOperationDefinitions(null, null)).length, Object.keys(APPRAISALS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleAppraisalsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), APPRAISALS_CHECKPOINT_METADATA, APPRAISALS_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleAppraisalsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(APPRAISALS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleAppraisalsOperationDefinitions(null, null)); });
});
