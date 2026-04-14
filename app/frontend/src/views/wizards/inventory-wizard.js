import { createGovernedWizardView } from "./shared.js";

export function renderInventoryWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "inventory-setup",
    domainId: "inventory",
    title: "Inventory Setup",
    subtitleDomain: "inventory",
    onCancel,
    fields: [
      {
        name: "warehouse_name",
        label: "Warehouse name",
        type: "text",
        required: true,
        placeholder: "Main Warehouse",
      },
      {
        name: "warehouse_code",
        label: "Warehouse short code",
        type: "text",
        required: true,
        maxLength: 5,
        placeholder: "MAIN",
      },
      {
        name: "reception_steps",
        label: "Number of steps for incoming",
        type: "select",
        required: true,
        options: [
          { value: "one_step", label: "1" },
          { value: "two_steps", label: "2" },
          { value: "three_steps", label: "3" },
        ],
      },
      {
        name: "delivery_steps",
        label: "Number of steps for outgoing",
        type: "select",
        required: true,
        options: [
          { value: "ship_only", label: "1" },
          { value: "pick_ship", label: "2" },
          { value: "pick_pack_ship", label: "3" },
        ],
      },
    ],
    getCapture(values) {
      return {
        warehouse_name: values.warehouse_name,
        warehouse_code: values.warehouse_code,
        reception_steps: values.reception_steps,
        delivery_steps: values.delivery_steps,
      };
    },
  });
}
