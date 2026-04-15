import { createGovernedWizardView } from "./shared.js";

export function renderAccountingReportsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "accounting-reports-setup",
    domainId: "accounting-reports",
    title: "Accounting Reports Setup",
    subtitleDomain: "accounting reports",
    onCancel,
    fields: [
      {
        name: "primary_report_use",
        label: "Primary report use",
        type: "select",
        required: true,
        options: [
          { value: "statutory_only", label: "Statutory filings only" },
          { value: "management_only", label: "Management reporting only" },
          { value: "both", label: "Both statutory and management" },
        ],
      },
      {
        name: "statutory_format",
        label: "Statutory P&L / Balance Sheet format",
        type: "text",
        required: true,
        placeholder: "e.g. IFRS, US GAAP, UK FRS 102",
      },
      {
        name: "management_pack_cadence",
        label: "Management pack cadence",
        type: "select",
        required: true,
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "none", label: "Not needed" },
        ],
      },
      {
        name: "custom_report_names",
        label: "Custom management report names",
        type: "repeater",
        required: false,
        minItems: 0,
        maxItems: 10,
        placeholder: "e.g. Branch P&L",
        addLabel: "Add report",
        helpText: "Optional — list custom report names you want designed beyond Odoo standard.",
      },
    ],
    getCapture(values) {
      return {
        primary_report_use: values.primary_report_use,
        statutory_format: values.statutory_format,
        management_pack_cadence: values.management_pack_cadence,
        custom_report_names: values.custom_report_names,
      };
    },
  });
}
