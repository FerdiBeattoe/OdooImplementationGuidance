import { createGovernedWizardView } from "./shared.js";

export function renderAccountingWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "accounting-setup",
    domainId: "accounting",
    title: "Accounting Setup",
    subtitleDomain: "accounting",
    onCancel,
    fields: [
      {
        name: "sales_journal_name",
        label: "Default sales journal name",
        type: "text",
        required: true,
        placeholder: "Customer Invoices",
      },
      {
        name: "purchase_journal_name",
        label: "Default purchase journal name",
        type: "text",
        required: true,
        placeholder: "Vendor Bills",
      },
      {
        name: "tax_rate",
        label: "Default tax rate (%)",
        type: "number",
        required: true,
        min: "0",
        step: "0.01",
        placeholder: "15",
      },
      {
        name: "tax_type",
        label: "Tax type",
        type: "select",
        required: true,
        options: [
          { value: "sale", label: "Sale" },
          { value: "purchase", label: "Purchase" },
          { value: "both", label: "Both" },
        ],
      },
    ],
    validate(values) {
      const errors = {};
      const rate = Number(values.tax_rate);
      if (!Number.isFinite(rate)) {
        errors.tax_rate = "Default tax rate (%) must be a valid number.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        sales_journal_name: values.sales_journal_name,
        purchase_journal_name: values.purchase_journal_name,
        tax_rate: values.tax_rate,
        tax_type: values.tax_type,
      };
    },
  });
}
