import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`maintenance-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const MAINTENANCE_OP_DEFS_VERSION = "1.2.0";
export const MAINTENANCE_TARGET_METHOD = "write";
// maintenance.equipment and maintenance.request are in ALLOWED_APPLY_MODELS.
export const MAINTENANCE_COVERAGE_GAP_MODELS = Object.freeze([]);
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
export function assembleMaintenanceOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (maintenance-wizard.js): {team_name, team_lead, equipment_categories
  // (repeater), default_pm_frequency_days, linked_to_manufacturing, initial_asset_count}.
  // honest-null across the board: the wizard captures team- and category-level policy, plus
  // a COUNT of initial assets — never a specific equipment/request record. maintenance.equipment
  // requires {name, effective_date, equipment_assign_to} per-record, and maintenance.request
  // requires equipment_id (many2one). Neither resolves from wizard text.
  void wizard_captures;
  // MNT_FOUND_001 → maintenance.equipment. execution_relevance "Informational" — no write.
  addMaintenanceDefinition(map, CHECKPOINT_IDS.MNT_FOUND_001);
  // MNT_DREQ_001 → maintenance.equipment (equipment registration).
  addMaintenanceDefinition(map, CHECKPOINT_IDS.MNT_DREQ_001);
  // MNT_DREQ_002 → maintenance.request (request lifecycle baseline).
  addMaintenanceDefinition(map, CHECKPOINT_IDS.MNT_DREQ_002);
  // MNT_REC_001 → maintenance.request (preventive maintenance schedule).
  addMaintenanceDefinition(map, CHECKPOINT_IDS.MNT_REC_001);
  return map;
}
