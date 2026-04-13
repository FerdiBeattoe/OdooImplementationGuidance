import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleWebsiteEcommerceOperationDefinitions, WEBSITE_ECOMMERCE_CHECKPOINT_METADATA, WEBSITE_ECOMMERCE_COVERAGE_GAP_MODELS, WEBSITE_ECOMMERCE_TARGET_METHOD } from "../website-ecommerce-operation-definitions.js";
import { assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";
describe("assembleWebsiteEcommerceOperationDefinitions", () => {
  it("1. assembles definitions", () => { assert.ok(Object.keys(assembleWebsiteEcommerceOperationDefinitions(null, null)).length > 0); });
  it("2. metadata matches", () => { assertDefinitionMetadata(assembleWebsiteEcommerceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})), WEBSITE_ECOMMERCE_CHECKPOINT_METADATA, WEBSITE_ECOMMERCE_TARGET_METHOD); });
  it("3. intended_changes is null", () => { const defs = assembleWebsiteEcommerceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. all definitions use allowed target models", () => { assertDefinitionsUseAllowedModels(assembleWebsiteEcommerceOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({"OP-01":"Yes","SC-03":"Yes","RM-02":"Yes","FC-05":"Yes"})), ALLOWED_APPLY_MODELS); });
  it("5. coverage gaps are documented", () => { assert.ok(Array.isArray(WEBSITE_ECOMMERCE_COVERAGE_GAP_MODELS)); });
  it("6. return is a plain object", () => { assertPlainObject(assembleWebsiteEcommerceOperationDefinitions(null, null)); });
});
