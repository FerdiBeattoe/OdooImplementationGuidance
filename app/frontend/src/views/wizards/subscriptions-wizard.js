import { createGovernedWizardView } from "./shared.js";

export function renderSubscriptionsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "subscriptions-setup",
    domainId: "subscriptions",
    title: "Subscriptions Setup",
    subtitleDomain: "subscriptions",
    onCancel,
    fields: [
      {
        name: "plan_name",
        label: "Plan name",
        type: "text",
        required: true,
        placeholder: "Monthly",
      },
      {
        name: "billing_period",
        label: "Billing period",
        type: "select",
        required: true,
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "annual", label: "Annual" },
        ],
      },
    ],
    getCapture(values) {
      return {
        plan_name: values.plan_name,
        billing_period: values.billing_period,
      };
    },
  });
}
