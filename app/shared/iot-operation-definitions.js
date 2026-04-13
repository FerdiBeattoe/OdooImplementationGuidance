import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`iot-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const IOT_OP_DEFS_VERSION = "1.1.0";
export const IOT_TARGET_METHOD = "write";
// COVERAGE GAP: iot.device not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const IOT_COVERAGE_GAP_MODELS = Object.freeze(["iot.device"]);
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
function addIotDefinition(map, checkpoint_id) { const metadata = IOT_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: IOT_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleIotOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addIotDefinition(map, "checkpoint-iot-box-registration");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addIotDefinition(map, "checkpoint-iot-device-assignment");
  // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
  addIotDefinition(map, "checkpoint-iot-pos-hardware");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addIotDefinition(map, "checkpoint-iot-network-configuration");
  return map; }
