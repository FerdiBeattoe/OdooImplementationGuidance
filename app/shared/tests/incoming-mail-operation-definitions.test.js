import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleIncomingMailOperationDefinitions, INCOMING_MAIL_CHECKPOINT_METADATA, INCOMING_MAIL_COVERAGE_GAP_MODELS, INCOMING_MAIL_TARGET_METHOD } from "../incoming-mail-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleIncomingMailOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleIncomingMailOperationDefinitions(null, null)).length, Object.keys(INCOMING_MAIL_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), INCOMING_MAIL_CHECKPOINT_METADATA, INCOMING_MAIL_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleIncomingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(INCOMING_MAIL_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleIncomingMailOperationDefinitions(null, null)); });
});
