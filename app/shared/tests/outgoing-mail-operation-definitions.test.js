import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleOutgoingMailOperationDefinitions, OUTGOING_MAIL_CHECKPOINT_METADATA, OUTGOING_MAIL_COVERAGE_GAP_MODELS, OUTGOING_MAIL_TARGET_METHOD } from "../outgoing-mail-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleOutgoingMailOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleOutgoingMailOperationDefinitions(null, null)).length, Object.keys(OUTGOING_MAIL_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), OUTGOING_MAIL_CHECKPOINT_METADATA, OUTGOING_MAIL_TARGET_METHOD); });
  it("3. intended_changes is null for every definition", () => { const defs = assembleOutgoingMailOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(OUTGOING_MAIL_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleOutgoingMailOperationDefinitions(null, null)); });
});
