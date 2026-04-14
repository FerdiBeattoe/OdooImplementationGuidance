import { createGovernedWizardView } from "./shared.js";

export function renderPlmWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "plm-setup",
    domainId: "plm",
    title: "PLM Setup",
    subtitleDomain: "plm",
    onCancel,
    fields: [
      {
        name: "eco_type_name",
        label: "ECO type name",
        type: "text",
        required: true,
        placeholder: "Engineering Change Order",
      },
      {
        name: "approval_required",
        label: "Approval required",
        type: "checkbox",
        checkboxLabel: "Require approval for this ECO type",
      },
    ],
    getCapture(values) {
      return {
        eco_type_name: values.eco_type_name,
        approval_required: values.approval_required,
      };
    },
  });
}
