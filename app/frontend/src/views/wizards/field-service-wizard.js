import { createGovernedWizardView } from "./shared.js";

export function renderFieldServiceWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "field-service-setup",
    domainId: "field-service",
    title: "Field Service Setup",
    subtitleDomain: "field service",
    onCancel,
    fields: [
      {
        name: "technician_name",
        label: "Primary technician name",
        type: "text",
        required: true,
        placeholder: "John Smith",
      },
    ],
    getCapture(values) {
      return {
        technician_name: values.technician_name,
      };
    },
  });
}
