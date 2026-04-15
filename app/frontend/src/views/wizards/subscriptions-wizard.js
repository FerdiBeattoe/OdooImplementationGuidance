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
        label: "First subscription plan name",
        type: "text",
        required: true,
        placeholder: "Monthly",
      },
      {
        name: "billing_recurrence",
        label: "Billing recurrence",
        type: "select",
        required: true,
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "annual", label: "Annual" },
        ],
      },
      {
        name: "renewal_mode",
        label: "Renewal mode",
        type: "select",
        required: true,
        options: [
          { value: "automatic", label: "Automatic (charge stored token)" },
          { value: "manual_confirmation", label: "Manual customer confirmation" },
        ],
      },
      {
        name: "dunning_steps_days",
        label: "Dunning reminder days past due",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 6,
        placeholder: "e.g. 3",
        addLabel: "Add reminder",
        helpText: "Reminder cadence in days past due (for example 3, 7, 14) before auto-cancel.",
      },
      {
        name: "payment_provider_ready",
        label: "Tokenised payment provider ready",
        type: "checkbox",
        checkboxLabel: "Stripe / Adyen / Authorize.Net supports stored-token charging",
      },
      {
        name: "mrr_reporting_enabled",
        label: "Share MRR / churn reporting with leadership",
        type: "checkbox",
        checkboxLabel: "Publish the Subscriptions reporting dashboards after go-live",
      },
    ],
    getCapture(values) {
      return {
        plan_name: values.plan_name,
        billing_recurrence: values.billing_recurrence,
        renewal_mode: values.renewal_mode,
        dunning_steps_days: values.dunning_steps_days,
        payment_provider_ready: values.payment_provider_ready,
        mrr_reporting_enabled: values.mrr_reporting_enabled,
      };
    },
  });
}
