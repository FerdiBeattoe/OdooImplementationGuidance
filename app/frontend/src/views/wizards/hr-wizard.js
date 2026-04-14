import { createGovernedWizardView } from "./shared.js";

export function renderHrWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "hr-setup",
    domainId: "hr",
    title: "HR Setup",
    subtitleDomain: "hr",
    onCancel,
    fields: [
      {
        name: "department_name",
        label: "Department name",
        type: "text",
        required: true,
        placeholder: "Operations",
      },
      {
        name: "job_name",
        label: "Job position name",
        type: "text",
        required: true,
        placeholder: "Operations Manager",
      },
      {
        name: "manager_name",
        label: "Manager name",
        type: "text",
        required: true,
        placeholder: "Jane Smith",
      },
    ],
    getCapture(values) {
      return {
        department_name: values.department_name,
        job_name: values.job_name,
        manager_name: values.manager_name,
      };
    },
  });
}
