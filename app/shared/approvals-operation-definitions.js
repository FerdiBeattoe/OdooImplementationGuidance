import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`approvals-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const APPROVALS_OP_DEFS_VERSION = "1.1.0";
export const APPROVALS_TARGET_METHOD = "write";

export const APPROVALS_COVERAGE_GAP_MODELS = Object.freeze([]);
export const APPROVALS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.APR_FOUND_001]: Object.freeze({
    target_model: "approval.category",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.APR_DREQ_001]: Object.freeze({
    target_model: "approval.category",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.APR_DREQ_002]: Object.freeze({
    target_model: "approval.category",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.APR_DREQ_003]: Object.freeze({
    target_model: "approval.category",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.APR_DREQ_004]: Object.freeze({
    target_model: "approval.category",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.APR_DREQ_005]: Object.freeze({
    target_model: "approval.category",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.APR_DREQ_006]: Object.freeze({
    target_model: "approval.category",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.APR_DREQ_007]: Object.freeze({
    target_model: "approval.category",
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});
export const APPROVALS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(APPROVALS_CHECKPOINT_METADATA));
function addApprovalsDefinition(map, checkpoint_id) { const metadata = APPROVALS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: APPROVALS_TARGET_METHOD, intended_changes: null, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleApprovalsOperationDefinitions(target_context = null, discovery_answers = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {};
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_FOUND_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_001);
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_002);
  if ((Array.isArray(answers["TA-03"]) ? answers["TA-03"] : []).includes("Inventory adjustments")) {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_003);
  }
  if ((Array.isArray(answers["TA-03"]) ? answers["TA-03"] : []).includes("Expenses")) {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_004);
  }
  if ((Array.isArray(answers["TA-03"]) ? answers["TA-03"] : []).includes("Manufacturing order")) {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_005);
  }
  if ((Array.isArray(answers["TA-03"]) ? answers["TA-03"] : []).includes("HR leave")) {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_006);
  }
  if ((Array.isArray(answers["TA-03"]) ? answers["TA-03"] : []).includes("Document signing")) {
    // honest-null: truthful intended_changes cannot be derived from target_context, discovery_answers, or wizard_captures without fabrication.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_007);
  }
  return map; }
