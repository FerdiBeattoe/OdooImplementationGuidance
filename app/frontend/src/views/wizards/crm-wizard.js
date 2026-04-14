import { createGovernedWizardView } from "./shared.js";

export function renderCrmWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "crm-setup",
    domainId: "crm",
    title: "CRM Setup",
    subtitleDomain: "crm",
    onCancel,
    fields: [
      {
        name: "stage_names",
        label: "Sales pipeline stages",
        type: "repeater",
        required: true,
        minItems: 2,
        maxItems: 7,
        placeholder: "Stage name",
        addLabel: "Add stage",
        helpText: "Enter between 2 and 7 pipeline stages.",
      },
      {
        name: "team_name",
        label: "Sales team name",
        type: "text",
        required: true,
        placeholder: "Sales Team",
      },
      {
        name: "team_leader_name",
        label: "Team leader name",
        type: "text",
        required: true,
        placeholder: "Team leader",
      },
    ],
    getCapture(values) {
      return {
        stage_names: values.stage_names,
        team_name: values.team_name,
        team_leader_name: values.team_leader_name,
      };
    },
  });
}
