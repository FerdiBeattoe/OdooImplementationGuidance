import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`maintenance-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const MAINTENANCE_OP_DEFS_VERSION = "1.1.0";
export const MAINTENANCE_TARGET_METHOD = "write";
// COVERAGE GAP: maintenance.equipment not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: maintenance.request not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const MAINTENANCE_COVERAGE_GAP_MODELS = Object.freeze(["maintenance.equipment", "maintenance.request"]);
export const MAINTENANCE_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.MNT_FOUND_001]: Object.freeze({
    target_model: "maintenance.equipment",
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.MNT_DREQ_001]: Object.freeze({
    target_model: "maintenance.equipment",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.MNT_DREQ_002]: Object.freeze({
    target_model: "maintenance.request",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.MNT_REC_001]: Object.freeze({
    target_model: "maintenance.request",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
});
export const MAINTENANCE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(MAINTENANCE_CHECKPOINT_METADATA));
function addMaintenanceDefinition(map, checkpoint_id) { const metadata = MAINTENANCE_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: MAINTENANCE_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleMaintenanceOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addMaintenanceDefinition(map, CHECKPOINT_IDS.MNT_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addMaintenanceDefinition(map, CHECKPOINT_IDS.MNT_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addMaintenanceDefinition(map, CHECKPOINT_IDS.MNT_DREQ_002);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addMaintenanceDefinition(map, CHECKPOINT_IDS.MNT_REC_001);
  return map; }
