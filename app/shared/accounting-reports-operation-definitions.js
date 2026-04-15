import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`accounting-reports-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const ACCOUNTING_REPORTS_OP_DEFS_VERSION = "1.2.0";
export const ACCOUNTING_REPORTS_TARGET_METHOD = "write";
// account.report was added to ALLOWED_APPLY_MODELS on 2026-04-15 (live-confirmed 49 fields).
// COVERAGE GAP: account.financial.html.report is the legacy Odoo ≤17 report model that was
// replaced by account.report in Odoo 18+. It is intentionally left outside ALLOWED_APPLY_MODELS;
// the checkpoint referencing it must remain honest-null until the metadata is migrated to
// account.report.
export const ACCOUNTING_REPORTS_COVERAGE_GAP_MODELS = Object.freeze(["account.financial.html.report"]);
export const ACCOUNTING_REPORTS_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-accounting-reports-financial-baseline"]: Object.freeze({
    target_model: "account.report",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-accounting-reports-tax-mapping"]: Object.freeze({
    target_model: "account.financial.html.report",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-accounting-reports-custom-structure"]: Object.freeze({
    target_model: "account.report",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-accounting-reports-fiscal-year"]: Object.freeze({
    target_model: "account.report",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const ACCOUNTING_REPORTS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(ACCOUNTING_REPORTS_CHECKPOINT_METADATA));
function addAccountingReportsDefinition(map, checkpoint_id) { const metadata = ACCOUNTING_REPORTS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: ACCOUNTING_REPORTS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleAccountingReportsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (accounting-reports-wizard.js): {primary_report_use, statutory_format,
  // management_pack_cadence, custom_report_names}.
  // honest-null across all four:
  //   - financial-baseline: statutory_format ("IFRS", "US GAAP") is an accounting-framework
  //     label, not an account.report.name. account.report.chart_template is a country-coded
  //     selection ("uk", "us", "fr_comp", ...) seeded by the localisation module, not by this
  //     wizard; primary_report_use ("statutory_only" | "management_only" | "both") does not map
  //     to any account.report boolean.
  //   - tax-mapping: target_model account.financial.html.report is the legacy Odoo ≤17 model,
  //     intentionally outside ALLOWED_APPLY_MODELS in Odoo 19 (coverage gap).
  //   - custom-structure: execution_relevance "None". Although custom_report_names could seed
  //     account.report.name records, execution_relevance "None" forbids writes from this
  //     checkpoint by contract.
  //   - fiscal-year: fiscal year configuration lives on res.company.fiscalyear_last_day and
  //     res.company.fiscalyear_last_month, not on any account.report field. No wizard capture
  //     maps to an account.report writable field.
  void wizard_captures;
  addAccountingReportsDefinition(map, "checkpoint-accounting-reports-financial-baseline");
  addAccountingReportsDefinition(map, "checkpoint-accounting-reports-tax-mapping");
  addAccountingReportsDefinition(map, "checkpoint-accounting-reports-custom-structure");
  addAccountingReportsDefinition(map, "checkpoint-accounting-reports-fiscal-year");
  return map;
}
