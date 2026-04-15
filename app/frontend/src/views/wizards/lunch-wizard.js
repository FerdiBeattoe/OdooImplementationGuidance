import { createGovernedWizardView } from "./shared.js";

export function renderLunchWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "lunch-setup",
    domainId: "lunch",
    title: "Lunch Setup",
    subtitleDomain: "lunch",
    onCancel,
    fields: [
      {
        name: "vendor_name",
        label: "First vendor name",
        type: "text",
        required: true,
        placeholder: "Bistro Central",
      },
      {
        name: "vendor_delivery_days",
        label: "Vendor delivery days",
        type: "text",
        required: true,
        placeholder: "Mon–Fri",
      },
      {
        name: "order_cutoff_time",
        label: "Daily order cutoff (24h HH:MM)",
        type: "text",
        required: true,
        placeholder: "10:30",
        helpText: "The cutoff discipline is the whole point of moving off WhatsApp.",
      },
      {
        name: "repayment_model",
        label: "Repayment model",
        type: "select",
        required: true,
        options: [
          { value: "wallet_topup", label: "Employee wallet top-up" },
          { value: "payroll_deduction", label: "Payroll deduction" },
        ],
      },
      {
        name: "lunch_manager",
        label: "Named lunch manager",
        type: "text",
        required: true,
        placeholder: "Office manager",
      },
    ],
    getCapture(values) {
      return {
        vendor_name: values.vendor_name,
        vendor_delivery_days: values.vendor_delivery_days,
        order_cutoff_time: values.order_cutoff_time,
        repayment_model: values.repayment_model,
        lunch_manager: values.lunch_manager,
      };
    },
  });
}
