import { createGovernedWizardView } from "./shared.js";

export function renderIotWizard({ onCancel } = {}) {
  return createGovernedWizardView({
    wizardId: "iot-setup",
    domainId: "iot",
    title: "IoT Setup",
    subtitleDomain: "IoT devices",
    onCancel,
    fields: [
      {
        name: "box_provisioning",
        label: "IoT box provisioning",
        type: "select",
        required: true,
        options: [
          { value: "odoo_hardware", label: "Odoo-sold IoT Box hardware" },
          { value: "raspberry_pi_image", label: "Raspberry Pi image (self-hosted)" },
          { value: "virtual_image", label: "IoT virtual image on existing hardware" },
        ],
      },
      {
        name: "network_connection",
        label: "Network connection",
        type: "select",
        required: true,
        options: [
          { value: "wired", label: "Wired Ethernet (recommended)" },
          { value: "wifi", label: "WiFi" },
        ],
        helpText: "Wired is more reliable for receipt printers and scales.",
      },
      {
        name: "first_device_type",
        label: "First device to pilot",
        type: "select",
        required: true,
        options: [
          { value: "receipt_printer", label: "Receipt printer" },
          { value: "barcode_scanner", label: "Barcode scanner" },
          { value: "scale", label: "Weighing scale" },
          { value: "payment_terminal", label: "Payment terminal" },
          { value: "cash_drawer", label: "Cash drawer" },
          { value: "measurement_tool", label: "Measurement tool (work centre)" },
          { value: "label_printer", label: "Label printer" },
        ],
      },
      {
        name: "pilot_location",
        label: "Pilot location",
        type: "text",
        required: true,
        placeholder: "e.g. Store 1 front till",
      },
      {
        name: "vlan_can_reach_odoo",
        label: "Network can reach Odoo",
        type: "checkbox",
        checkboxLabel: "Confirmed the IoT Box is not on a segmented VLAN that blocks Odoo",
      },
    ],
    getCapture(values) {
      return {
        box_provisioning: values.box_provisioning,
        network_connection: values.network_connection,
        first_device_type: values.first_device_type,
        pilot_location: values.pilot_location,
        vlan_can_reach_odoo: values.vlan_can_reach_odoo,
      };
    },
  });
}
