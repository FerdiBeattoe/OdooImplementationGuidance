import { createGovernedWizardView } from "./shared.js";

export function renderAppraisalsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "appraisals-setup",
    domainId: "appraisals",
    title: "Appraisals Setup",
    subtitleDomain: "appraisals",
    onCancel,
    fields: [
      {
        name: "cycle_cadence",
        label: "Appraisal cycle cadence",
        type: "select",
        required: true,
        options: [
          { value: "annual", label: "Annual" },
          { value: "biannual", label: "Biannual" },
          { value: "quarterly", label: "Quarterly" },
          { value: "probation_only", label: "Probation cycle only" },
        ],
      },
      {
        name: "pilot_department",
        label: "Pilot department",
        type: "text",
        required: true,
        placeholder: "Operations",
        helpText: "Run one department through a full cycle before rolling out company-wide.",
      },
      {
        name: "feedback_template_name",
        label: "Feedback template name",
        type: "text",
        required: true,
        placeholder: "Annual Review – All Staff",
      },
      {
        name: "includes_360_feedback",
        label: "Include 360 feedback (peers and reports)",
        type: "checkbox",
        checkboxLabel: "Enable 360 feedback collection",
      },
    ],
    getCapture(values) {
      return {
        cycle_cadence: values.cycle_cadence,
        pilot_department: values.pilot_department,
        feedback_template_name: values.feedback_template_name,
        includes_360_feedback: values.includes_360_feedback,
      };
    },
  });
}
