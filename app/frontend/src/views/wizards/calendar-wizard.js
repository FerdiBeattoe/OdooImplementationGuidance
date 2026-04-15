import { createGovernedWizardView } from "./shared.js";

export function renderCalendarWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "calendar-setup",
    domainId: "calendar",
    title: "Calendar Setup",
    subtitleDomain: "calendar",
    onCancel,
    fields: [
      {
        name: "sync_provider",
        label: "External calendar provider",
        type: "select",
        required: true,
        options: [
          { value: "google", label: "Google Calendar" },
          { value: "microsoft", label: "Microsoft Outlook / 365" },
          { value: "both", label: "Both Google and Microsoft" },
          { value: "none", label: "Odoo-native calendar only" },
        ],
      },
      {
        name: "oauth_client_ready",
        label: "OAuth client credentials ready",
        type: "checkbox",
        checkboxLabel: "Client ID and Secret are registered with the provider",
      },
      {
        name: "sync_activities_from_crm",
        label: "Sync CRM and Helpdesk activities as events",
        type: "checkbox",
        checkboxLabel: "Convert activities raised on records into calendar events",
      },
      {
        name: "source_of_truth_policy",
        label: "Source-of-truth calendar",
        type: "select",
        required: true,
        options: [
          { value: "odoo", label: "Odoo" },
          { value: "external", label: "External provider" },
          { value: "two_way", label: "Two-way sync, no single source" },
        ],
      },
    ],
    getCapture(values) {
      return {
        sync_provider: values.sync_provider,
        oauth_client_ready: values.oauth_client_ready,
        sync_activities_from_crm: values.sync_activities_from_crm,
        source_of_truth_policy: values.source_of_truth_policy,
      };
    },
  });
}
