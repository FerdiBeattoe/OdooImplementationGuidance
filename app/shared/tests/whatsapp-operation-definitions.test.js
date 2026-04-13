import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleWhatsappOperationDefinitions, WHATSAPP_CHECKPOINT_METADATA, WHATSAPP_COVERAGE_GAP_MODELS, WHATSAPP_TARGET_METHOD } from "../whatsapp-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleWhatsappOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleWhatsappOperationDefinitions(null, null)).length, Object.keys(WHATSAPP_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleWhatsappOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), WHATSAPP_CHECKPOINT_METADATA, WHATSAPP_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleWhatsappOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(WHATSAPP_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleWhatsappOperationDefinitions(null, null)); });
});
