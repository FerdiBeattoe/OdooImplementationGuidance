import { createGovernedWizardView } from "./shared.js";

export function renderHelpdeskWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "helpdesk-setup",
    domainId: "helpdesk",
    title: "Helpdesk Setup",
    subtitleDomain: "helpdesk",
    onCancel,
    fields: [
      {
        name: "team_name",
        label: "First helpdesk team name",
        type: "text",
        required: true,
        placeholder: "Customer Support",
      },
      {
        name: "team_alias_email",
        label: "Team email alias",
        type: "text",
        required: true,
        placeholder: "support@company.com",
        helpText: "Inbound email to this alias becomes tickets.",
      },
      {
        name: "assignment_rule",
        label: "Agent assignment rule",
        type: "select",
        required: true,
        options: [
          { value: "manual", label: "Manual (all members see queue)" },
          { value: "random", label: "Random" },
          { value: "balanced", label: "Balanced load" },
        ],
      },
      {
        name: "stages",
        label: "Ticket pipeline stages",
        type: "repeater",
        required: true,
        minItems: 2,
        maxItems: 8,
        placeholder: "e.g. New",
        addLabel: "Add stage",
        helpText: "A short, opinionated pipeline is better than one no-one uses.",
      },
      {
        name: "sla_response_hours",
        label: "Default SLA response time (hours)",
        type: "number",
        required: true,
        min: "0",
        step: "0.25",
        placeholder: "4",
      },
      {
        name: "sla_owner",
        label: "Named SLA owner",
        type: "text",
        required: true,
        placeholder: "Support team lead",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.sla_response_hours))) {
        errors.sla_response_hours = "SLA response must be a valid number of hours.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        team_name: values.team_name,
        team_alias_email: values.team_alias_email,
        assignment_rule: values.assignment_rule,
        stages: values.stages,
        sla_response_hours: values.sla_response_hours,
        sla_owner: values.sla_owner,
      };
    },
  });
}
