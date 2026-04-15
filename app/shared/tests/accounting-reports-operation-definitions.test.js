import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assembleAccountingReportsOperationDefinitions, ACCOUNTING_REPORTS_CHECKPOINT_METADATA, ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS, ACCOUNTING_REPORTS_TARGET_METHOD } from "../accounting-reports-operation-definitions.js";
import { assertDefinitionMetadata, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assembleAccountingReportsOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assembleAccountingReportsOperationDefinitions(null, null)).length, Object.keys(ACCOUNTING_REPORTS_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assembleAccountingReportsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ACCOUNTING_REPORTS_CHECKPOINT_METADATA, ACCOUNTING_REPORTS_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assembleAccountingReportsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assembleAccountingReportsOperationDefinitions(null, null)); });
  it("6. account.financial.html.report remains outside ALLOWED_APPLY_MODELS (legacy coverage gap)", () => {
    const allowed = new Set(ALLOWED_APPLY_MODELS);
    for (const gap of ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS) assert.ok(!allowed.has(gap), `${gap} should not be in allowlist (Odoo 19 replaced it with account.report)`);
  });
  it("7. account.report-backed checkpoints use an allowlisted target_model", () => {
    const defs = assembleAccountingReportsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    const allowed = new Set(ALLOWED_APPLY_MODELS);
    const gap = new Set(ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS);
    for (const def of Object.values(defs)) {
      if (gap.has(def.target_model)) continue;
      assert.ok(allowed.has(def.target_model), `${def.target_model} must be in ALLOWED_APPLY_MODELS`);
    }
  });
  it("8. intended_changes stay null even with wizard_captures (framework labels, not field values)", () => {
    const captures = { "accounting-reports": { primary_report_use: "both", statutory_format: "IFRS", management_pack_cadence: "monthly", custom_report_names: ["Branch P&L", "Region Cashflow"] } };
    const defs = assembleAccountingReportsOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
