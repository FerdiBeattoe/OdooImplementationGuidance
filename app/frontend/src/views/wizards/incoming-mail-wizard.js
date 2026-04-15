import { createGovernedWizardView } from "./shared.js";

export function renderIncomingMailWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "incoming-mail-setup",
    domainId: "incoming-mail",
    title: "Incoming Mail Setup",
    subtitleDomain: "incoming mail",
    onCancel,
    fields: [
      {
        name: "alias_domain",
        label: "Alias domain",
        type: "text",
        required: true,
        placeholder: "company.com",
        helpText: "The mail domain Odoo will match inbound messages against.",
      },
      {
        name: "fetching_method",
        label: "Inbound fetching method",
        type: "select",
        required: true,
        options: [
          { value: "catchall_forward", label: "Catch-all forward (DNS/MX routes to Odoo)" },
          { value: "imap", label: "IMAP fetch from dedicated mailbox" },
          { value: "pop", label: "POP fetch from dedicated mailbox" },
        ],
      },
      {
        name: "routed_aliases",
        label: "Routed aliases",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 10,
        placeholder: "e.g. sales@ — CRM leads",
        addLabel: "Add alias route",
        helpText: "One line per alias, with the target model (e.g. support@ — Helpdesk tickets).",
      },
      {
        name: "bounce_address",
        label: "Bounce / no-reply address",
        type: "text",
        required: true,
        placeholder: "bounce@company.com",
      },
      {
        name: "mx_forwarding_verified",
        label: "MX / DNS forwarding verified",
        type: "checkbox",
        checkboxLabel: "Confirmed the mail domain actually forwards to Odoo before creating aliases",
      },
    ],
    getCapture(values) {
      return {
        alias_domain: values.alias_domain,
        fetching_method: values.fetching_method,
        routed_aliases: values.routed_aliases,
        bounce_address: values.bounce_address,
        mx_forwarding_verified: values.mx_forwarding_verified,
      };
    },
  });
}
