import { createGovernedWizardView } from "./shared.js";

export function renderProjectsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "projects-setup",
    domainId: "projects",
    title: "Projects Setup",
    subtitleDomain: "projects",
    onCancel,
    fields: [
      {
        name: "project_name",
        label: "Default project name",
        type: "text",
        required: true,
        placeholder: "Implementation Project",
      },
      {
        name: "task_stage_names",
        label: "Task stage names",
        type: "repeater",
        required: true,
        minItems: 2,
        placeholder: "Stage name",
        addLabel: "Add stage",
      },
    ],
    getCapture(values) {
      return {
        project_name: values.project_name,
        task_stage_names: values.task_stage_names,
      };
    },
  });
}
