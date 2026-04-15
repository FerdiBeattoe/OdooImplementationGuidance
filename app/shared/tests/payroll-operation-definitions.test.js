import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import { assemblePayrollOperationDefinitions, PAYROLL_CHECKPOINT_METADATA, PAYROLL_COVERAGE_GAP_MODELS, PAYROLL_TARGET_METHOD } from "../payroll-operation-definitions.js";
import { assertDefinitionMetadata, assertDefinitionsUseAllowedModels, assertPlainObject, makeDiscoveryAnswers, makeTargetContext } from "./operation-definitions-test-helpers.js";
describe("assemblePayrollOperationDefinitions", () => {
  it("1. assembles one definition per metadata entry", () => { assert.equal(Object.keys(assemblePayrollOperationDefinitions(null, null)).length, Object.keys(PAYROLL_CHECKPOINT_METADATA).length); });
  it("2. every assembled definition carries the required metadata fields", () => { assertDefinitionMetadata(assemblePayrollOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), PAYROLL_CHECKPOINT_METADATA, PAYROLL_TARGET_METHOD); });
  it("3. intended_changes is null when wizard captures absent", () => { const defs = assemblePayrollOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()); for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null); });
  it("4. coverage gaps are documented", () => { assert.ok(Array.isArray(PAYROLL_COVERAGE_GAP_MODELS)); });
  it("5. return is a plain object", () => { assertPlainObject(assemblePayrollOperationDefinitions(null, null)); });
  it("6. all assembled target_models are in ALLOWED_APPLY_MODELS", () => { assertDefinitionsUseAllowedModels(assemblePayrollOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers()), ALLOWED_APPLY_MODELS); });
  it("7. intended_changes remain honest-null even with wizard_captures (structure/employee many2ones unresolved)", () => {
    const captures = { payroll: { country_localisation: "United Kingdom", pay_frequency: "monthly", default_salary_structure: "Standard Employee", parallel_run_period: "2026-03 pay period", attendance_integration: true, finance_sign_off_obtained: true } };
    const defs = assemblePayrollOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    for (const k of Object.keys(defs)) assert.equal(defs[k].intended_changes, null);
  });
});
