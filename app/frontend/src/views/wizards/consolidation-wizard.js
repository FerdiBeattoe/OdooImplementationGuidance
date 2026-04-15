import { COMMON_CURRENCY_OPTIONS, createGovernedWizardView } from "./shared.js";

export function renderConsolidationWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "consolidation-setup",
    domainId: "consolidation",
    title: "Consolidation Setup",
    subtitleDomain: "consolidation",
    onCancel,
    fields: [
      {
        name: "consolidation_currency",
        label: "Consolidation currency",
        type: "select",
        required: true,
        options: COMMON_CURRENCY_OPTIONS,
      },
      {
        name: "default_fx_method",
        label: "Default FX translation method",
        type: "select",
        required: true,
        options: [
          { value: "closing", label: "Closing rate" },
          { value: "average", label: "Average rate" },
          { value: "historical", label: "Historical rate" },
        ],
        helpText: "Revenue accounts typically use average, balance sheet items use closing.",
      },
      {
        name: "subsidiary_count",
        label: "Number of subsidiaries to consolidate",
        type: "number",
        required: true,
        min: "1",
        step: "1",
        placeholder: "2",
      },
      {
        name: "intercompany_elimination_required",
        label: "Intercompany elimination required",
        type: "checkbox",
        checkboxLabel: "Eliminate AR/AP, loans, and revenue between subsidiaries",
      },
      {
        name: "dry_run_period",
        label: "Dry-run historical period",
        type: "text",
        required: true,
        placeholder: "e.g. 2025-Q4",
        helpText: "Period to reconcile against manual group statements before going live.",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isInteger(Number(values.subsidiary_count)) || Number(values.subsidiary_count) < 1) {
        errors.subsidiary_count = "Subsidiary count must be a whole number of 1 or more.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        consolidation_currency: values.consolidation_currency,
        default_fx_method: values.default_fx_method,
        subsidiary_count: values.subsidiary_count,
        intercompany_elimination_required: values.intercompany_elimination_required,
        dry_run_period: values.dry_run_period,
      };
    },
  });
}
