// ---------------------------------------------------------------------------
// Field Service Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Field Service domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Field Service previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (hr.employee is in ALLOWED_APPLY_MODELS;
//     project.task is not)
//   - checkpoint-engine.js generateFieldServiceCheckpoints
//   - domain-capabilities.js hr executeSafeModels (bounded employee provisioning)
//
// Hard rules:
//   R1  Only Field Service domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "hr.employee" for every assembled Field Service
//       checkpoint in the current governed apply surface. project.task is a
//       documented coverage gap.
//   R3  method is always "write". target_operation mirrors method for governed
//       preview/apply compatibility.
//   R4  intended_changes is null for all checkpoints. Task dispatch and
//       technician assignment specifics are not derivable from checkpoint
//       metadata or discovery answers alone. Null is honest.
//   R5  FSV-GL-001 is non-Executable (execution_relevance: None,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R6  FSV-DREQ-003 is conditional: only assembled when OP-01 = true or "Yes".
//   R7  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R8  Non-Field Service checkpoint IDs are never added to the returned map.
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

export const FIELD_SERVICE_OP_DEFS_VERSION = "1.0.0";
export const FIELD_SERVICE_EMPLOYEE_MODEL = "hr.employee";
export const FIELD_SERVICE_TARGET_METHOD = "write";

// COVERAGE GAP: project.task not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const FIELD_SERVICE_COVERAGE_GAP_MODELS = Object.freeze(["project.task"]);

export const FIELD_SERVICE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.FSV_FOUND_001,
  CHECKPOINT_IDS.FSV_DREQ_001,
  CHECKPOINT_IDS.FSV_DREQ_002,
  // FSV_DREQ_003 added conditionally when OP-01 = Yes (R6)
]);

export const FIELD_SERVICE_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.FSV_FOUND_001]: Object.freeze({
    target_model: FIELD_SERVICE_EMPLOYEE_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.FSV_DREQ_001]: Object.freeze({
    target_model: FIELD_SERVICE_EMPLOYEE_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.FSV_DREQ_002]: Object.freeze({
    target_model: FIELD_SERVICE_EMPLOYEE_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.FSV_DREQ_003]: Object.freeze({
    target_model: FIELD_SERVICE_EMPLOYEE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});

function addFieldServiceDefinition(map, checkpoint_id) {
  const metadata = FIELD_SERVICE_CHECKPOINT_METADATA[checkpoint_id];
  if (!metadata) return;
  map[checkpoint_id] = createOperationDefinition({
    checkpoint_id,
    target_model: metadata.target_model,
    method: FIELD_SERVICE_TARGET_METHOD,
    intended_changes: null,
    safety_class: metadata.safety_class,
    execution_relevance: metadata.execution_relevance,
    validation_source: metadata.validation_source,
  });
}

export function assembleFieldServiceOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};

  addFieldServiceDefinition(map, CHECKPOINT_IDS.FSV_FOUND_001);
  addFieldServiceDefinition(map, CHECKPOINT_IDS.FSV_DREQ_001);
  addFieldServiceDefinition(map, CHECKPOINT_IDS.FSV_DREQ_002);

  const op01 = answers["OP-01"];
  if (op01 === true || op01 === "Yes") {
    addFieldServiceDefinition(map, CHECKPOINT_IDS.FSV_DREQ_003);
  }

  return map;
}
