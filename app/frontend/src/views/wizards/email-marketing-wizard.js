import { createGovernedWizardView } from "./shared.js";

export function renderEmailMarketingWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "email-marketing-setup",
    domainId: "email-marketing",
    title: "Email Marketing Setup",
    subtitleDomain: "email marketing",
    onCancel,
    fields: [
      {
        name: "sending_domain",
        label: "Sending domain",
        type: "text",
        required: true,
        placeholder: "mail.company.com",
      },
      {
        name: "spf_dkim_dmarc_verified",
        label: "SPF, DKIM, and DMARC published",
        type: "checkbox",
        checkboxLabel: "DNS records verified before any real campaign runs",
      },
      {
        name: "initial_mailing_list_name",
        label: "First mailing list name",
        type: "text",
        required: true,
        placeholder: "Newsletter — all opted-in contacts",
      },
      {
        name: "blacklist_enabled",
        label: "Blacklist and unsubscribe handling enabled",
        type: "checkbox",
        checkboxLabel: "One-click unsubscribe works (GDPR, CAN-SPAM, POPIA)",
      },
      {
        name: "seed_test_address",
        label: "Internal seed address for pre-send tests",
        type: "text",
        required: true,
        placeholder: "seed-test@company.com",
      },
    ],
    getCapture(values) {
      return {
        sending_domain: values.sending_domain,
        spf_dkim_dmarc_verified: values.spf_dkim_dmarc_verified,
        initial_mailing_list_name: values.initial_mailing_list_name,
        blacklist_enabled: values.blacklist_enabled,
        seed_test_address: values.seed_test_address,
      };
    },
  });
}
