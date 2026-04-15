import { createGovernedWizardView } from "./shared.js";

export function renderTimesheetsWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "timesheets-setup",
    domainId: "timesheets",
    title: "Timesheets Setup",
    subtitleDomain: "timesheets",
    onCancel,
    fields: [
      {
        name: "submission_cadence",
        label: "Submission cadence",
        type: "select",
        required: true,
        options: [
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "fortnightly", label: "Fortnightly" },
        ],
        helpText: "Without a deadline, compliance drops under 50% within a month.",
      },
      {
        name: "approval_chain",
        label: "Approval chain",
        type: "select",
        required: true,
        options: [
          { value: "manager_only", label: "Manager only" },
          { value: "manager_plus_pm", label: "Manager plus project manager" },
        ],
      },
      {
        name: "billing_link_enabled",
        label: "Feed billable hours to Sales invoicing",
        type: "checkbox",
        checkboxLabel: "Project billing method set to 'Based on Timesheets' on billable projects",
      },
      {
        name: "rounding_minutes",
        label: "Entry rounding (minutes)",
        type: "number",
        required: true,
        min: "0",
        step: "1",
        placeholder: "15",
      },
      {
        name: "reminder_schedule",
        label: "Late-submission reminder schedule",
        type: "text",
        required: true,
        placeholder: "e.g. End of day + day-after manager escalation",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.rounding_minutes))) {
        errors.rounding_minutes = "Rounding must be a valid number of minutes.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        submission_cadence: values.submission_cadence,
        approval_chain: values.approval_chain,
        billing_link_enabled: values.billing_link_enabled,
        rounding_minutes: values.rounding_minutes,
        reminder_schedule: values.reminder_schedule,
      };
    },
  });
}
