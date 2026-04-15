import { createGovernedWizardView } from "./shared.js";

export function renderMaintenanceWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "maintenance-setup",
    domainId: "maintenance",
    title: "Maintenance Setup",
    subtitleDomain: "maintenance",
    onCancel,
    fields: [
      {
        name: "team_name",
        label: "First maintenance team name",
        type: "text",
        required: true,
        placeholder: "Facilities",
      },
      {
        name: "team_lead",
        label: "Team lead",
        type: "text",
        required: true,
        placeholder: "John Doe",
      },
      {
        name: "equipment_categories",
        label: "Equipment categories",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 10,
        placeholder: "e.g. Production",
        addLabel: "Add category",
      },
      {
        name: "default_pm_frequency_days",
        label: "Default preventive maintenance frequency (days)",
        type: "number",
        required: true,
        min: "1",
        step: "1",
        placeholder: "90",
      },
      {
        name: "linked_to_manufacturing",
        label: "Link to Manufacturing work centres",
        type: "checkbox",
        checkboxLabel: "Work centres share their Equipment record with Maintenance",
      },
      {
        name: "initial_asset_count",
        label: "Number of assets in the initial register",
        type: "number",
        required: true,
        min: "1",
        step: "1",
        placeholder: "10",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.default_pm_frequency_days))) {
        errors.default_pm_frequency_days = "PM frequency must be a valid number of days.";
      }
      if (!Number.isFinite(Number(values.initial_asset_count))) {
        errors.initial_asset_count = "Initial asset count must be a valid number.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        team_name: values.team_name,
        team_lead: values.team_lead,
        equipment_categories: values.equipment_categories,
        default_pm_frequency_days: values.default_pm_frequency_days,
        linked_to_manufacturing: values.linked_to_manufacturing,
        initial_asset_count: values.initial_asset_count,
      };
    },
  });
}
