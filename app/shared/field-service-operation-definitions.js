// ---------------------------------------------------------------------------
// Field Service Operation Definitions - Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `field-service-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const FIELD_SERVICE_OP_DEFS_VERSION = "1.1.0";
export const FIELD_SERVICE_EMPLOYEE_MODEL = "hr.employee";
export const FIELD_SERVICE_TARGET_METHOD = "write";
export const FIELD_SERVICE_COVERAGE_GAP_MODELS = Object.freeze(["project.task"]);
export const FIELD_SERVICE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.FSV_FOUND_001,
  CHECKPOINT_IDS.FSV_DREQ_001,
  CHECKPOINT_IDS.FSV_DREQ_002,
]);
export const FIELD_SERVICE_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.FSV_FOUND_001]: Object.freeze({ target_model: FIELD_SERVICE_EMPLOYEE_MODEL, validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.FSV_DREQ_001]: Object.freeze({ target_model: FIELD_SERVICE_EMPLOYEE_MODEL, validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Safe" }),
  [CHECKPOINT_IDS.FSV_DREQ_002]: Object.freeze({ target_model: FIELD_SERVICE_EMPLOYEE_MODEL, validation_source: "User_Confirmed", execution_relevance: "Executable", safety_class: "Conditional" }),
  [CHECKPOINT_IDS.FSV_DREQ_003]: Object.freeze({ target_model: FIELD_SERVICE_EMPLOYEE_MODEL, validation_source: "Both", execution_relevance: "Executable", safety_class: "Conditional" }),
});
function isPlainObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function extractFieldServiceCapture(wizard_captures) { if (!isPlainObject(wizard_captures)) return null; return isPlainObject(wizard_captures["field-service"]) ? wizard_captures["field-service"] : null; }
function buildEmployeeChanges(capture) { if (!isPlainObject(capture)) return null; const name = typeof capture.technician_name === "string" ? capture.technician_name.trim() : ""; return name ? { name, job_id: null } : null; }
function addFieldServiceDefinition(map, checkpoint_id, intended_changes) { const metadata = FIELD_SERVICE_CHECKPOINT_METADATA[checkpoint_id]; if (!metadata) return; map[checkpoint_id] = createOperationDefinition({ checkpoint_id, target_model: metadata.target_model, method: FIELD_SERVICE_TARGET_METHOD, intended_changes, safety_class: metadata.safety_class, execution_relevance: metadata.execution_relevance, validation_source: metadata.validation_source }); }
export function assembleFieldServiceOperationDefinitions(target_context = null, discovery_answers = null, wizard_captures = null) { const map = createOperationDefinitionsMap(); const answers = discovery_answers?.answers ?? {}; const employeeChanges = buildEmployeeChanges(extractFieldServiceCapture(wizard_captures));
  addFieldServiceDefinition(map, CHECKPOINT_IDS.FSV_FOUND_001, employeeChanges);
  addFieldServiceDefinition(map, CHECKPOINT_IDS.FSV_DREQ_001, employeeChanges);
  addFieldServiceDefinition(map, CHECKPOINT_IDS.FSV_DREQ_002, employeeChanges);
  const op01 = answers["OP-01"];
  if (op01 === true || op01 === "Yes") {
    addFieldServiceDefinition(map, CHECKPOINT_IDS.FSV_DREQ_003, employeeChanges);
  }
  return map;
}
