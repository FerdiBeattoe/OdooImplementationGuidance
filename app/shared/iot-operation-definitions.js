import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`iot-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const IOT_OP_DEFS_VERSION = "1.2.0";
export const IOT_TARGET_METHOD = "write";
// iot.device and pos.config are in ALLOWED_APPLY_MODELS.
export const IOT_COVERAGE_GAP_MODELS = Object.freeze([]);
export const IOT_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-iot-box-registration"]: Object.freeze({
    target_model: "iot.device",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-iot-device-assignment"]: Object.freeze({
    target_model: "iot.device",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-iot-pos-hardware"]: Object.freeze({
    target_model: "pos.config",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-iot-network-configuration"]: Object.freeze({
    target_model: "iot.device",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const IOT_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(IOT_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addIotDefinition(map, checkpoint_id, intended_changes) { const metadata = IOT_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: IOT_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
const DEVICE_TYPE_MAP = Object.freeze({
  receipt_printer: { type: "printer", subtype: "receipt_printer" },
  label_printer: { type: "printer", subtype: "label_printer" },
  barcode_scanner: { type: "scanner" },
  scale: { type: "scale" },
  payment_terminal: { type: "payment" },
});
function extractDeviceAssignmentChanges(capture) {
  if (!isPlainObject(capture)) return null;
  // iot.device confirmed fields: name, type (selection), subtype (selection), iot_id (required
  // many2one — must be resolved at apply time; the IoT box isn't an ORM record we own pre-pair).
  // first_device_type cash_drawer and measurement_tool have no clean 1:1 in iot.device.type
  // selection [printer,camera,keyboard,scanner,device,payment,scale,display,fiscal_data_module,
  // unsupported] — honest-null rather than picking "device" as a guess.
  const mapping = DEVICE_TYPE_MAP[capture.first_device_type];
  if (!mapping) return null;
  const pilotLocation = typeof capture.pilot_location === "string" ? capture.pilot_location.trim() : "";
  if (!pilotLocation) return null;
  return { name: pilotLocation, ...mapping };
}
export function assembleIotOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (iot-wizard.js): {box_provisioning (odoo_hardware|raspberry_pi_image|
  // virtual_image), network_connection (wired|wifi), first_device_type, pilot_location,
  // vlan_can_reach_odoo}.
  const capture = isPlainObject(wizard_captures?.iot) ? wizard_captures.iot : null;
  // checkpoint-iot-box-registration → iot.device.
  // honest-null: box provisioning is a pairing flow (URL + token) that produces the iot.box
  // record, not iot.device. box_provisioning captures the hardware source (Odoo-sold vs
  // self-built Pi vs VM), which is not a field on iot.device.
  addIotDefinition(map, "checkpoint-iot-box-registration", null);
  // checkpoint-iot-device-assignment → iot.device.
  addIotDefinition(map, "checkpoint-iot-device-assignment", extractDeviceAssignmentChanges(capture));
  // checkpoint-iot-pos-hardware → pos.config. execution_relevance "None" — no write.
  addIotDefinition(map, "checkpoint-iot-pos-hardware", null);
  // checkpoint-iot-network-configuration → iot.device.
  // honest-null: network_connection (wired|wifi) is an attribute of the IoT box's network stack,
  // not iot.device.connection (which enumerates how a device attaches to the box:
  // network|direct|bluetooth|serial|hdmi). wired vs wifi both present as "network" attach.
  addIotDefinition(map, "checkpoint-iot-network-configuration", null);
  return map;
}
