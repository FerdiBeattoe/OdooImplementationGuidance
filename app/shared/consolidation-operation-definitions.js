import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`consolidation-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const CONSOLIDATION_OP_DEFS_VERSION = "1.1.0";
export const CONSOLIDATION_TARGET_METHOD = "write";
// COVERAGE GAP: consolidation.company not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
// COVERAGE GAP: consolidation.period not in ALLOWED_APPLY_MODELS
// Intended changes for this model must remain null until the write gate expands.
export const CONSOLIDATION_COVERAGE_GAP_MODELS = Object.freeze(["consolidation.company", "consolidation.period"]);
export const CONSOLIDATION_CHECKPOINT_METADATA = Object.freeze({
  ["checkpoint-consolidation-company-setup"]: Object.freeze({
    target_model: "consolidation.company",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-consolidation-period-baseline"]: Object.freeze({
    target_model: "consolidation.period",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  ["checkpoint-consolidation-elimination-rules"]: Object.freeze({
    target_model: "consolidation.company",
    validation_source: "User_Confirmed",
    execution_relevance: "None",
    safety_class: "Conditional",
  }),
  ["checkpoint-consolidation-intercompany-policy"]: Object.freeze({
    target_model: "consolidation.company",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const CONSOLIDATION_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(CONSOLIDATION_CHECKPOINT_METADATA));
function addConsolidationDefinition(map, checkpoint_id) { const metadata = CONSOLIDATION_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: CONSOLIDATION_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleConsolidationOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap();
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addConsolidationDefinition(map, "checkpoint-consolidation-company-setup");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addConsolidationDefinition(map, "checkpoint-consolidation-period-baseline");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addConsolidationDefinition(map, "checkpoint-consolidation-elimination-rules");
  // honest-null: target model is outside ALLOWED_APPLY_MODELS.
  addConsolidationDefinition(map, "checkpoint-consolidation-intercompany-policy");
  return map; }
