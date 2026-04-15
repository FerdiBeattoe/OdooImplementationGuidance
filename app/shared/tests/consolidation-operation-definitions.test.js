import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleConsolidationOperationDefinitions, CONSOLIDATION_CHECKPOINT_METADATA, CONSOLIDATION_COVERAGE_GAP_MODELS, CONSOLIDATION_TARGET_METHOD } from "../consolidation-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleConsolidationOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleConsolidationOperationDefinitions(null, null)).length, Object.keys(CONSOLIDATION_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleConsolidationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), CONSOLIDATION_CHECKPOINT_METADATA, CONSOLIDATION_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleConsolidationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(CONSOLIDATION_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleConsolidationOperationDefinitions(null, null)); });
  it("6. target models remain outside ALLOWED_APPLY_MODELS (coverage gap)", () => {
    const allowed = new Set(ALLOWED_APPLY_MODELS);
    for (const gap of CONSOLIDATION_COVERAGE_GAP_MODELS) assert.ok(!allowed.has(gap), `${gap} should not yet be in allowlist`);
  });
  it("7. intended_changes still null even when wizard_captures are supplied (coverage gap)", () => {
    const captures = { consolidation: { consolidation_currency: "EUR", default_fx_method: "closing", subsidiary_count: 3, intercompany_elimination_required: true, dry_run_period: "2025-Q4" } };
    const defs = assembleConsolidationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
