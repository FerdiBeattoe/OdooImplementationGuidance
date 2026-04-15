import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`studio-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const STUDIO_OP_DEFS_VERSION = "1.2.0";
export const STUDIO_TARGET_METHOD = "write";
// COVERAGE GAP: ir.model not in ALLOWED_APPLY_MODELS.
// COVERAGE GAP: ir.ui.view not in ALLOWED_APPLY_MODELS.
// Intended changes for these models must remain null until the write gate expands — mutating
// Studio metadata at runtime is an intentional write-gate exclusion.
export const STUDIO_COVERAGE_GAP_MODELS = Object.freeze(["ir.model", "ir.ui.view"]);
export const STUDIO_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-studio-field-governance"]: Object.freeze({
    target_model: "ir.model",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-studio-view-modification"]: Object.freeze({
    target_model: "ir.ui.view",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-studio-report-customisation"]: Object.freeze({
    target_model: "ir.ui.view",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-studio-access-control"]: Object.freeze({
    target_model: "ir.model",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const STUDIO_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(STUDIO_CHECKPOINT_METADATA));
function addStudioDefinition(map, checkpoint_id) { const metadata = STUDIO_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: STUDIO_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleStudioOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (studio-wizard.js): {authorized_admins, change_control_policy_published,
  // staging_environment_exists, enterprise_instance_confirmed, customization_export_cadence}.
  // All four checkpoints target ir.model or ir.ui.view which are intentionally outside
  // ALLOWED_APPLY_MODELS — intended_changes must stay null.
  void wizard_captures;
  addStudioDefinition(map, "checkpoint-studio-field-governance");
  addStudioDefinition(map, "checkpoint-studio-view-modification");
  // execution_relevance "None" — no write.
  addStudioDefinition(map, "checkpoint-studio-report-customisation");
  addStudioDefinition(map, "checkpoint-studio-access-control");
  return map;
}
