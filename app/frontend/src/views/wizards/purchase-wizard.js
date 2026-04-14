import { createGovernedWizardView } from "./shared.js";

export function renderPurchaseWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "purchase-setup",
    domainId: "purchase",
    title: "Purchase Setup",
    subtitleDomain: "purchase",
    onCancel,
    fields: [
      {
        name: "approval_threshold_amount",
        label: "Purchase approval threshold amount",
        type: "number",
        required: true,
        placeholder: "1000",
      },
      {
        name: "approval_currency",
        label: "Approval currency",
        type: "text",
        required: true,
        placeholder: "USD",
      },
      {
        name: "billing_policy",
        label: "Billing policy",
        type: "select",
        required: true,
        options: [
          { value: "ordered_quantity", label: "On ordered quantity" },
          { value: "received_quantity", label: "On received quantity" },
        ],
      },
    ],
    getCapture(values) {
      return {
        approval_threshold_amount: values.approval_threshold_amount,
        approval_currency: values.approval_currency,
        billing_policy: values.billing_policy,
      };
    },
  });
}
