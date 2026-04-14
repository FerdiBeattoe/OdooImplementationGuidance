import { createGovernedWizardView } from "./shared.js";

export function renderApprovalsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "approvals-setup",
    domainId: "approvals",
    title: "Approvals Setup",
    subtitleDomain: "approvals",
    onCancel,
    fields: [
      {
        name: "approval_category_name",
        label: "Approval category name",
        type: "text",
        required: true,
        placeholder: "Purchase Approval",
      },
      {
        name: "approval_type",
        label: "Approval type",
        type: "select",
        required: true,
        options: [
          { value: "no_validation", label: "No validation" },
          { value: "approved_by_one", label: "Approved by one" },
          { value: "approved_by_all", label: "Approved by all" },
        ],
      },
    ],
    getCapture(values) {
      return {
        approval_category_name: values.approval_category_name,
        approval_type: values.approval_type,
      };
    },
  });
}
