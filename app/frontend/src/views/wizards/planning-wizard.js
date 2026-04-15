import { createGovernedWizardView } from "./shared.js";

export function renderPlanningWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "planning-setup",
    domainId: "planning",
    title: "Planning Setup",
    subtitleDomain: "planning",
    onCancel,
    fields: [
      {
        name: "planning_roles",
        label: "Planning roles",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 15,
        placeholder: "e.g. Technician",
        addLabel: "Add role",
        helpText: "Roles drive availability, cost, and reporting. Define them before anyone drags a shift.",
      },
      {
        name: "shift_template_names",
        label: "Recurring shift templates",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 10,
        placeholder: "e.g. Morning (07:00–15:00)",
        addLabel: "Add template",
      },
      {
        name: "publish_cadence",
        label: "Plan publish cadence",
        type: "select",
        required: true,
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "fortnightly", label: "Fortnightly" },
          { value: "monthly", label: "Monthly" },
        ],
      },
      {
        name: "self_service_claims",
        label: "Allow employees to claim open shifts",
        type: "checkbox",
        checkboxLabel: "Enable open-shift self-service flow",
      },
      {
        name: "link_to_timesheets",
        label: "Link Planning to Timesheets",
        type: "checkbox",
        checkboxLabel: "Reconcile schedule and actuals on billable work",
      },
    ],
    getCapture(values) {
      return {
        planning_roles: values.planning_roles,
        shift_template_names: values.shift_template_names,
        publish_cadence: values.publish_cadence,
        self_service_claims: values.self_service_claims,
        link_to_timesheets: values.link_to_timesheets,
      };
    },
  });
}
