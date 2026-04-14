import { ODOO_VERSION } from "./constants.js";
if (ODOO_VERSION !== "19") throw new Error(`approvals-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}".`);
import { createOperationDefinition, createOperationDefinitionsMap } from "./runtime-state-contract.js";
import { CHECKPOINT_IDS } from "./checkpoint-engine.js";
export const APPROVALS_OP_DEFS_VERSION = "1.2.0";
export const APPROVALS_TARGET_METHOD = "write";
export const APPROVALS_COVERAGE_GAP_MODELS = Object.freeze([]);
export const APPROVALS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.APR_FOUND_001]: Object.freeze({ target_model: "approval.category", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.APR_DREQ_001]: Object.freeze({ target_model: "approval.category", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.APR_DREQ_002]: Object.freeze({ target_model: "approval.category", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.APR_DREQ_003]: Object.freeze({ target_model: "approval.category", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.APR_DREQ_004]: Object.freeze({ target_model: "approval.category", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.APR_DREQ_005]: Object.freeze({ target_model: "approval.category", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.APR_DREQ_006]: Object.freeze({ target_model: "approval.category", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.APR_DREQ_007]: Object.freeze({ target_model: "approval.category", validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
});
export const APPROVALS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze(Object.keys(APPROVALS_CHECKPOINT_METADATA));
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractApprovalsCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures.approvals) ? wizard_captures.approvals : null; }
function addApprovalsDefinition(map, checkpoint_id, intended_changes) { const metadata = APPROVALS_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: APPROVALS_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleApprovalsOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {}; const ta03 = Array.isArray(answers["TA-03"]) ? answers["TA-03"] : []; const capture = extractApprovalsCapture(wizard_captures); void capture;
    // honest-null: approval.category is not confirmed in scripts/odoo-confirmed-fields.json, so intended_changes must remain null.
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_FOUND_001, null);
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_001, null);
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_002, null);
  if (ta03.includes("Inventory adjustments")) {
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_003, null);
  }
  if (ta03.includes("Expenses")) {
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_004, null);
  }
  if (ta03.includes("Manufacturing order")) {
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_005, null);
  }
  if (ta03.includes("HR leave")) {
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_006, null);
  }
  if (ta03.includes("Document signing")) {
    addApprovalsDefinition(map, CHECKPOINT_IDS.APR_DREQ_007, null);
  }
  return map; }
