import { createGovernedWizardView } from "./shared.js";

export function renderRentalWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "rental-setup",
    domainId: "rental",
    title: "Rental Setup",
    subtitleDomain: "rental",
    onCancel,
    fields: [
      {
        name: "tracking_mode",
        label: "Rented asset tracking",
        type: "select",
        required: true,
        options: [
          { value: "serial", label: "Serial number (per-unit)" },
          { value: "lot", label: "Lot number" },
          { value: "none", label: "No tracking" },
        ],
        helpText: "Changing this after stock has moved is painful — pick before loading the catalogue.",
      },
      {
        name: "rate_schedules",
        label: "Rate schedules",
        type: "repeater",
        required: true,
        minItems: 1,
        maxItems: 6,
        placeholder: "e.g. day",
        addLabel: "Add schedule",
        helpText: "Rate units such as hour, day, week, month.",
      },
      {
        name: "rental_location_name",
        label: "Dedicated rental location name",
        type: "text",
        required: true,
        placeholder: "Rental stock",
      },
      {
        name: "late_fee_percent",
        label: "Late return fee (% per day)",
        type: "number",
        required: true,
        min: "0",
        step: "0.01",
        placeholder: "5",
      },
      {
        name: "damage_charge_enabled",
        label: "Damage charges on return inspection",
        type: "checkbox",
        checkboxLabel: "Allow additional charges to post on return",
      },
    ],
    validate(values) {
      const errors = {};
      if (!Number.isFinite(Number(values.late_fee_percent))) {
        errors.late_fee_percent = "Late fee must be a valid number.";
      }
      return errors;
    },
    getCapture(values) {
      return {
        tracking_mode: values.tracking_mode,
        rate_schedules: values.rate_schedules,
        rental_location_name: values.rental_location_name,
        late_fee_percent: values.late_fee_percent,
        damage_charge_enabled: values.damage_charge_enabled,
      };
    },
  });
}
