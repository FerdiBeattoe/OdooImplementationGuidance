import { createGovernedWizardView } from "./shared.js";

export function renderWhatsappWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "whatsapp-setup",
    domainId: "whatsapp",
    title: "WhatsApp Setup",
    subtitleDomain: "WhatsApp messaging",
    onCancel,
    fields: [
      {
        name: "meta_verified_number",
        label: "Meta-verified business number",
        type: "text",
        required: true,
        placeholder: "+442071234567",
        helpText: "A dedicated number registered with the WhatsApp Business API.",
      },
      {
        name: "phone_number_id",
        label: "Phone Number ID",
        type: "text",
        required: true,
        placeholder: "From Meta Business Manager",
      },
      {
        name: "business_account_id",
        label: "WhatsApp Business Account ID",
        type: "text",
        required: true,
        placeholder: "From Meta Business Manager",
      },
      {
        name: "webhook_verify_token",
        label: "Webhook verify token",
        type: "text",
        required: true,
        placeholder: "Unique token Odoo shows when you register the webhook",
      },
      {
        name: "first_template_names",
        label: "First templates submitted to Meta",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 8,
        placeholder: "e.g. order_confirmation",
        addLabel: "Add template",
        helpText: "Approved templates are required for out-of-session messages.",
      },
      {
        name: "enterprise_instance_confirmed",
        label: "Enterprise instance confirmed",
        type: "checkbox",
        checkboxLabel: "The WhatsApp integration is Enterprise-only — this instance is Enterprise",
      },
      {
        name: "routes_to_helpdesk",
        label: "Route inbound messages to Helpdesk",
        type: "checkbox",
        checkboxLabel: "Inbound WhatsApp messages become Helpdesk tickets",
      },
    ],
    getCapture(values) {
      return {
        meta_verified_number: values.meta_verified_number,
        phone_number_id: values.phone_number_id,
        business_account_id: values.business_account_id,
        webhook_verify_token: values.webhook_verify_token,
        first_template_names: values.first_template_names,
        enterprise_instance_confirmed: values.enterprise_instance_confirmed,
        routes_to_helpdesk: values.routes_to_helpdesk,
      };
    },
  });
}
