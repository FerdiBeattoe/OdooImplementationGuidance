// ---------------------------------------------------------------------------
// HR Operation Definitions - Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `hr-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const HR_OP_DEFS_VERSION = "1.1.0";
export const HR_DEPARTMENT_MODEL = "hr.department";
export const HR_JOB_MODEL = "hr.job";
export const HR_COMPANY_MODEL = "res.company";
export const HR_TARGET_METHOD = "write";
export const HR_COVERAGE_GAP_MODELS = Object.freeze([]);
export const HR_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.HR_FOUND_001,
  CHECKPOINT_IDS.HR_DREQ_001,
  CHECKPOINT_IDS.HR_DREQ_002,
]);
export const HR_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.HR_FOUND_001]: Object.freeze({ target_model: HR_DEPARTMENT_MODEL, validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.HR_DREQ_001]: Object.freeze({ target_model: HR_DEPARTMENT_MODEL, validation_source: "Both", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.HR_DREQ_002]: Object.freeze({ target_model: HR_JOB_MODEL, validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.HR_DREQ_003]: Object.freeze({ target_model: HR_COMPANY_MODEL, validation_source: "Both", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.HR_DREQ_004]: Object.freeze({ target_model: HR_COMPANY_MODEL, validation_source: "Both", execution_relevance: "Executable", safety_class: "Conditional" }),
});
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractHrCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures.hr) ? wizard_captures.hr : null; }
function buildDepartmentChanges(capture) {
  if (!isPlainObject(capture)) return null;
  const departmentName = typeof capture.department_name === "string" ? capture.department_name.trim() : "";
  const managerName = typeof capture.manager_name === "string" ? capture.manager_name.trim() : "";
  if (!departmentName && !managerName) return null;
  return { name: departmentName || null, manager_id: managerName ? null : null };
}
function buildJobChanges(capture) {
  if (!isPlainObject(capture)) return null;
  const jobName = typeof capture.job_name === "string" ? capture.job_name.trim() : "";
  return jobName ? { name: jobName, department_id: null } : null;
}
function addHrDefinition(map, checkpoint_id, intended_changes) { const metadata = HR_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: HR_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleHrOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {}; const ta03 = Array.isArray(answers["TA-03"]) ? answers["TA-03"] : []; const capture = extractHrCapture(wizard_captures); const departmentChanges = buildDepartmentChanges(capture); const jobChanges = buildJobChanges(capture);
  addHrDefinition(map, CHECKPOINT_IDS.HR_FOUND_001, departmentChanges);
  addHrDefinition(map, CHECKPOINT_IDS.HR_DREQ_001, departmentChanges);
  // NOTE: hr.job write/create may fail with AccessError if the connected Odoo user (e.g. uid=2)
  // lacks HR Officer/Manager rights. This is an instance configuration issue on the Odoo side
  // (e.g. majestic.odoo.com), not an assembler defect. The admin user must be granted
  // group_hr_manager or group_hr_user before hr.job operations will succeed at runtime.
  addHrDefinition(map, CHECKPOINT_IDS.HR_DREQ_002, jobChanges);
  if (ta03.includes("HR leave")) {
    addHrDefinition(map, CHECKPOINT_IDS.HR_DREQ_003, null);
  }
  const rm02 = answers["RM-02"];
  if (rm02 === true || rm02 === "Yes") {
    addHrDefinition(map, CHECKPOINT_IDS.HR_DREQ_004, null);
  }
  return map;
}
