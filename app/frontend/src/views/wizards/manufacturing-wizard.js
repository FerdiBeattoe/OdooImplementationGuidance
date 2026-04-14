import { createGovernedWizardView } from "./shared.js";

export function renderManufacturingWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "manufacturing-setup",
    domainId: "manufacturing",
    title: "Manufacturing Setup",
    subtitleDomain: "manufacturing",
    onCancel,
    fields: [
      {
        name: "workcenter_name",
        label: "Work center name",
        type: "text",
        required: true,
        placeholder: "Assembly Line 1",
      },
      {
        name: "workcenter_code",
        label: "Work center code",
        type: "text",
        required: true,
        placeholder: "WC01",
      },
      {
        name: "capacity",
        label: "Capacity",
        type: "number",
        required: true,
        min: "1",
        step: "1",
        placeholder: "1",
      },
      {
        name: "time_efficiency",
        label: "Time efficiency %",
        type: "number",
        required: true,
        min: "1",
        step: "1",
        defaultValue: "100",
        placeholder: "100",
      },
    ],
    getCapture(values) {
      return {
        workcenter_name: values.workcenter_name,
        workcenter_code: values.workcenter_code,
        capacity: values.capacity,
        time_efficiency: values.time_efficiency,
      };
    },
  });
}
