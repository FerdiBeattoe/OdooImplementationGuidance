import { createGovernedWizardView } from "./shared.js";

export function renderSignWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "sign-setup",
    domainId: "sign",
    title: "Sign Setup",
    subtitleDomain: "sign",
    onCancel,
    fields: [
      {
        name: "template_name",
        label: "Template name",
        type: "text",
        required: true,
        placeholder: "Master Service Agreement",
      },
      {
        name: "template_type",
        label: "Template type",
        type: "select",
        required: true,
        options: [
          { value: "contract", label: "Contract" },
          { value: "nda", label: "NDA" },
          { value: "purchase_order", label: "Purchase Order" },
          { value: "custom", label: "Custom" },
        ],
      },
    ],
    getCapture(values) {
      return {
        template_name: values.template_name,
        template_type: values.template_type,
      };
    },
  });
}
