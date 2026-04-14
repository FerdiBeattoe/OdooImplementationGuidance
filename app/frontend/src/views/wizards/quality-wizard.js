import { createGovernedWizardView } from "./shared.js";

export function renderQualityWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "quality-setup",
    domainId: "quality",
    title: "Quality Setup",
    subtitleDomain: "quality",
    onCancel,
    fields: [
      {
        name: "quality_check_title",
        label: "Quality check title",
        type: "text",
        required: true,
        placeholder: "Incoming Quality Check",
      },
      {
        name: "check_type",
        label: "Check type",
        type: "select",
        required: true,
        options: [
          { value: "instructions", label: "Instructions" },
          { value: "picture", label: "Take a Picture" },
          { value: "pass_fail", label: "Pass - Fail" },
          { value: "measure", label: "Measure" },
        ],
      },
    ],
    getCapture(values) {
      return {
        quality_check_title: values.quality_check_title,
        check_type: values.check_type,
      };
    },
  });
}
