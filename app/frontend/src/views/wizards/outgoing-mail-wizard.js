import { createGovernedWizardView } from "./shared.js";

export function renderOutgoingMailWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "outgoing-mail-setup",
    domainId: "outgoing-mail",
    title: "Outgoing Mail Setup",
    subtitleDomain: "outgoing mail",
    onCancel,
    fields: [
      {
        name: "smtp_provider",
        label: "SMTP provider",
        type: "select",
        required: true,
        options: [
          { value: "google_workspace", label: "Google Workspace (Gmail)" },
          { value: "microsoft_365", label: "Microsoft 365 / Outlook" },
          { value: "custom_smtp", label: "Custom SMTP provider" },
          { value: "odoo_default", label: "Odoo default relay (testing only)" },
        ],
      },
      {
        name: "auth_mode",
        label: "Authentication mode",
        type: "select",
        required: true,
        options: [
          { value: "oauth2", label: "OAuth 2.0 (recommended)" },
          { value: "app_password", label: "App password" },
          { value: "smtp_basic", label: "SMTP basic auth" },
          { value: "api_key", label: "Provider API key" },
        ],
      },
      {
        name: "default_from_address",
        label: "Default From address",
        type: "text",
        required: true,
        placeholder: "noreply@company.com",
      },
      {
        name: "spf_dkim_dmarc_published",
        label: "SPF, DKIM, and DMARC published on sending domain",
        type: "checkbox",
        checkboxLabel: "DNS records verified — without these, mail lands in spam",
      },
      {
        name: "per_department_senders",
        label: "Use per-department senders",
        type: "checkbox",
        checkboxLabel: "Separate Outgoing Mail server per From address (sales@, support@, invoices@)",
      },
      {
        name: "department_from_addresses",
        label: "Department From addresses",
        type: "repeater",
        required: false,
        minItems: 0,
        maxItems: 10,
        placeholder: "e.g. sales@company.com",
        addLabel: "Add sender",
        helpText: "Only used when per-department senders is enabled.",
      },
    ],
    getCapture(values) {
      return {
        smtp_provider: values.smtp_provider,
        auth_mode: values.auth_mode,
        default_from_address: values.default_from_address,
        spf_dkim_dmarc_published: values.spf_dkim_dmarc_published,
        per_department_senders: values.per_department_senders,
        department_from_addresses: values.department_from_addresses,
      };
    },
  });
}
