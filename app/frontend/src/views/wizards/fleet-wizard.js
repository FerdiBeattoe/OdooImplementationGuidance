import { createGovernedWizardView } from "./shared.js";

export function renderFleetWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "fleet-setup",
    domainId: "fleet",
    title: "Fleet Setup",
    subtitleDomain: "fleet",
    onCancel,
    fields: [
      {
        name: "vehicle_categories",
        label: "Vehicle categories",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 10,
        placeholder: "e.g. Sales",
        addLabel: "Add category",
        helpText: "Used for reporting (executive, operations, sales, etc.)",
      },
      {
        name: "first_vehicle_vin",
        label: "First vehicle VIN",
        type: "text",
        required: true,
        placeholder: "WVWZZZ1JZXW000001",
      },
      {
        name: "first_vehicle_model",
        label: "First vehicle make and model",
        type: "text",
        required: true,
        placeholder: "Toyota Hilux 2.4",
      },
      {
        name: "first_vehicle_driver",
        label: "Assigned driver (employee name)",
        type: "text",
        required: true,
        placeholder: "Jane Smith",
      },
      {
        name: "contract_type",
        label: "Primary contract type",
        type: "select",
        required: true,
        options: [
          { value: "owned", label: "Owned" },
          { value: "leased", label: "Leased" },
          { value: "mixed", label: "Mixed ownership and lease" },
        ],
      },
      {
        name: "renewal_reminder_days",
        label: "Renewal reminder lead (days)",
        type: "number",
        required: true,
        min: "0",
        step: "1",
        placeholder: "30",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.renewal_reminder_days))) {
        errors.renewal_reminder_days = "Reminder lead must be a valid number of days.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        vehicle_categories: values.vehicle_categories,
        first_vehicle_vin: values.first_vehicle_vin,
        first_vehicle_model: values.first_vehicle_model,
        first_vehicle_driver: values.first_vehicle_driver,
        contract_type: values.contract_type,
        renewal_reminder_days: values.renewal_reminder_days,
      };
    },
  });
}
