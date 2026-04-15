import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleRecruitmentOperationDefinitions, RECRUITMENT_CHECKPOINT_METADATA, RECRUITMENT_COVERAGE_GAP_MODELS, RECRUITMENT_TARGET_METHOD } from "../recruitment-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleRecruitmentOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleRecruitmentOperationDefinitions(null, null)).length, Object.keys(RECRUITMENT_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleRecruitmentOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), RECRUITMENT_CHECKPOINT_METADATA, RECRUITMENT_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleRecruitmentOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(RECRUITMENT_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleRecruitmentOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assembleRecruitmentOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. job-position derives name from first_role_title", () => {
    const defs = assembleRecruitmentOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { recruitment: { first_role_title: "Operations Manager", pipeline_stages: ["Applied", "Interview", "Offer"] } });
    assert.deepEqual(defs["checkpoint-recruitment-job-position"].intended_changes, { name: "Operations Manager" });
  });
  it("8. job-position null when first_role_title missing/blank", () => {
    for (const first_role_title of [undefined, "", "   "]) {
      const defs = assembleRecruitmentOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), { recruitment: { first_role_title } });
      assert.equal(defs["checkpoint-recruitment-job-position"].intended_changes, null);
    }
  });
  it("9. pipeline-stages, interview-process, offer-workflow remain honest-null", () => {
    const captures = { recruitment: { pipeline_stages: ["Applied", "Interview", "Offer"], first_role_title: "Ops Mgr", careers_page_published: true, jobs_alias_email: "jobs@co.com", interview_template_name: "First round" } };
    const defs = assembleRecruitmentOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(defs["checkpoint-recruitment-pipeline-stages"].intended_changes, null);
    assert.equal(defs["checkpoint-recruitment-interview-process"].intended_changes, null);
    assert.equal(defs["checkpoint-recruitment-offer-workflow"].intended_changes, null);
  });
});
