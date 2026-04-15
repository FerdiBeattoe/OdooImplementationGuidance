import { createGovernedWizardView } from "./shared.js";

export function renderSmsMarketingWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "sms-marketing-setup",
    domainId: "sms-marketing",
    title: "SMS Marketing Setup",
    subtitleDomain: "SMS marketing",
    onCancel,
    fields: [
      {
        name: "sending_mode",
        label: "Sending mode",
        type: "select",
        required: true,
        options: [
          { value: "iap_credits", label: "Odoo IAP credits (simplest)" },
          { value: "external_gateway", label: "External SMS gateway (Twilio / Vonage)" },
        ],
        helpText: "IAP is fastest to set up; gateways give long-code / shortcode control.",
      },
      {
        name: "sender_id",
        label: "Sender ID / from-number",
        type: "text",
        required: true,
        placeholder: "e.g. +441234567890 or AcmeCo (alphanumeric where permitted)",
      },
      {
        name: "opt_in_source",
        label: "Opt-in source",
        type: "select",
        required: true,
        options: [
          { value: "website_checkbox", label: "Website / checkout consent checkbox" },
          { value: "loyalty_signup", label: "Loyalty sign-up consent" },
          { value: "import_with_proof", label: "Imported list with documented opt-in" },
        ],
        helpText: "Sending without consent breaches most local marketing laws.",
      },
      {
        name: "initial_list_name",
        label: "Initial mailing list name",
        type: "text",
        required: true,
        placeholder: "e.g. UK Customers — SMS Opt-In",
      },
      {
        name: "seed_test_number",
        label: "Seed test number",
        type: "text",
        required: true,
        placeholder: "+441234567890",
        helpText: "Each batch must send to this number first so delivery is verified.",
      },
      {
        name: "coordinate_with_email",
        label: "Coordinate with Email Marketing",
        type: "checkbox",
        checkboxLabel: "SMS and email campaigns share the same calendar to avoid over-messaging",
      },
    ],
    getCapture(values) {
      return {
        sending_mode: values.sending_mode,
        sender_id: values.sender_id,
        opt_in_source: values.opt_in_source,
        initial_list_name: values.initial_list_name,
        seed_test_number: values.seed_test_number,
        coordinate_with_email: values.coordinate_with_email,
      };
    },
  });
}
