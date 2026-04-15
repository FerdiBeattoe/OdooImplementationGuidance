import { createGovernedWizardView } from "./shared.js";

export function renderEventsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "events-setup",
    domainId: "events",
    title: "Events Setup",
    subtitleDomain: "events",
    onCancel,
    fields: [
      {
        name: "event_type_name",
        label: "Default event type name",
        type: "text",
        required: true,
        placeholder: "Workshop",
      },
      {
        name: "ticket_model",
        label: "Ticket model",
        type: "select",
        required: true,
        options: [
          { value: "free", label: "Free only" },
          { value: "paid", label: "Paid only" },
          { value: "both", label: "Mix of free and paid" },
        ],
      },
      {
        name: "payment_provider_ready",
        label: "Payment provider configured (for paid events)",
        type: "checkbox",
        checkboxLabel: "Stripe / PayPal / other payment provider is connected",
      },
      {
        name: "event_categories",
        label: "Event categories",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 10,
        placeholder: "e.g. Conference",
        addLabel: "Add category",
      },
      {
        name: "default_reminder_days",
        label: "Pre-event reminder lead (days)",
        type: "number",
        required: true,
        min: "0",
        step: "1",
        placeholder: "3",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.default_reminder_days))) {
        errors.default_reminder_days = "Reminder lead must be a valid number of days.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        event_type_name: values.event_type_name,
        ticket_model: values.ticket_model,
        payment_provider_ready: values.payment_provider_ready,
        event_categories: values.event_categories,
        default_reminder_days: values.default_reminder_days,
      };
    },
  });
}
