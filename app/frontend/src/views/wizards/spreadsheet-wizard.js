import { createGovernedWizardView } from "./shared.js";

export function renderSpreadsheetWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "spreadsheet-setup",
    domainId: "spreadsheet",
    title: "Spreadsheet Setup",
    subtitleDomain: "Odoo Spreadsheet",
    onCancel,
    fields: [
      {
        name: "core_templates",
        label: "Core templates to publish first",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 8,
        placeholder: "e.g. Weekly sales dashboard",
        addLabel: "Add template",
        helpText: "A template is a saved spreadsheet linked to live Odoo data.",
      },
      {
        name: "template_owner",
        label: "Template owner",
        type: "text",
        required: true,
        placeholder: "Finance Ops",
        helpText: "One accountable owner avoids orphan spreadsheets.",
      },
      {
        name: "refresh_cadence",
        label: "Data refresh cadence",
        type: "select",
        required: true,
        options: [
          { value: "on_open", label: "On open (live)" },
          { value: "scheduled_daily", label: "Scheduled daily refresh" },
          { value: "manual_only", label: "Manual refresh only" },
        ],
      },
      {
        name: "retire_external_excel",
        label: "Retire equivalent external Excel files",
        type: "checkbox",
        checkboxLabel: "Archive the old Excel/Google Sheet once the Odoo template ships",
      },
      {
        name: "restricted_workspaces",
        label: "Restricted workspaces (optional)",
        type: "repeater",
        minItems: 0,
        maxItems: 6,
        placeholder: "e.g. Finance leadership",
        addLabel: "Add workspace",
        helpText: "Workspaces whose spreadsheets must not be shared broadly.",
      },
    ],
    getCapture(values) {
      return {
        core_templates: values.core_templates,
        template_owner: values.template_owner,
        refresh_cadence: values.refresh_cadence,
        retire_external_excel: values.retire_external_excel,
        restricted_workspaces: values.restricted_workspaces,
      };
    },
  });
}
