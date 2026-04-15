import { createGovernedWizardView } from "./shared.js";

export function renderExpensesWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "expenses-setup",
    domainId: "expenses",
    title: "Expenses Setup",
    subtitleDomain: "expenses",
    onCancel,
    fields: [
      {
        name: "reimbursement_method",
        label: "Reimbursement method",
        type: "select",
        required: true,
        options: [
          { value: "separate_payment", label: "Paid separately (own run)" },
          { value: "payroll_addon", label: "Added to payslip" },
        ],
      },
      {
        name: "default_category_name",
        label: "First expense category name",
        type: "text",
        required: true,
        placeholder: "Travel",
      },
      {
        name: "mileage_rate",
        label: "Default mileage rate (per km/mile)",
        type: "number",
        required: true,
        min: "0",
        step: "0.01",
        placeholder: "0.45",
      },
      {
        name: "receipts_mandatory",
        label: "Receipts mandatory on every claim",
        type: "checkbox",
        checkboxLabel: "Block submission if no receipt is attached",
      },
      {
        name: "approval_chain",
        label: "Approval chain",
        type: "select",
        required: true,
        options: [
          { value: "manager_only", label: "Manager only" },
          { value: "manager_plus_finance", label: "Manager + finance for high-value" },
        ],
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.mileage_rate))) {
        errors.mileage_rate = "Mileage rate must be a valid number.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        reimbursement_method: values.reimbursement_method,
        default_category_name: values.default_category_name,
        mileage_rate: values.mileage_rate,
        receipts_mandatory: values.receipts_mandatory,
        approval_chain: values.approval_chain,
      };
    },
  });
}
