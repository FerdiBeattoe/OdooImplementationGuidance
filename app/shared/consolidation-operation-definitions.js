import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`consolidation-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
export const CONSOLIDATION_OP_DEFS_VERSION = "1.2.0";
export const CONSOLIDATION_TARGET_METHOD = "write";
// COVERAGE GAP: consolidation.company not in ALLOWED_APPLY_MODELS.
// COVERAGE GAP: consolidation.period not in ALLOWED_APPLY_MODELS.
// Intended changes for these models must remain null until the write gate expands.
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
export function assembleConsolidationOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) {
  const map = createOperationDefinitionsMap();
  // Wizard capture shape (consolidation-wizard.js): {consolidation_currency, default_fx_method,
  // subsidiary_count, intercompany_elimination_required, dry_run_period}. All map to consolidation
  // chart-of-accounts / group-structure models (consolidation.chart, consolidation.company),
  // none of which are in ALLOWED_APPLY_MODELS yet — intended_changes must stay null here
  // regardless of wizard completion.
  void wizard_captures;
  addConsolidationDefinition(map, "checkpoint-consolidation-company-setup");
  addConsolidationDefinition(map, "checkpoint-consolidation-period-baseline");
  // execution_relevance "None" — no write.
  addConsolidationDefinition(map, "checkpoint-consolidation-elimination-rules");
  addConsolidationDefinition(map, "checkpoint-consolidation-intercompany-policy");
  return map;
}
