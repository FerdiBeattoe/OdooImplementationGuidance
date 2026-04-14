import { COMMON_LANGUAGE_OPTIONS, createGovernedWizardView } from "./shared.js";

export function renderWebsiteEcommerceWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "website-setup",
    domainId: "website-ecommerce",
    title: "Website & eCommerce Setup",
    subtitleDomain: "website and ecommerce",
    onCancel,
    fields: [
      {
        name: "website_name",
        label: "Website name",
        type: "text",
        required: true,
        placeholder: "My Website",
      },
      {
        name: "default_language",
        label: "Default language",
        type: "select",
        required: true,
        options: COMMON_LANGUAGE_OPTIONS,
      },
      {
        name: "delivery_carrier_name",
        label: "Delivery carrier name",
        type: "text",
        required: true,
        placeholder: "Standard Delivery",
      },
      {
        name: "carrier_type",
        label: "Carrier type",
        type: "select",
        required: true,
        options: [
          { value: "fixed", label: "Fixed price" },
          { value: "base_on_rule", label: "Based on rules" },
        ],
      },
    ],
    getCapture(values) {
      return {
        website_name: values.website_name,
        default_language: values.default_language,
        delivery_carrier_name: values.delivery_carrier_name,
        carrier_type: values.carrier_type,
      };
    },
  });
}
