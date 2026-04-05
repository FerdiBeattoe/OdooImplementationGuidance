// ---------------------------------------------------------------------------
// HR Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for HR domain Executable
//   checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking HR previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (hr.department, hr.job, and res.company
//     are in ALLOWED_APPLY_MODELS)
//   - checkpoint-engine.js generateHRCheckpoints (checkpoint IDs,
//     validation_source, execution_relevance, safety_class, and gates)
//   - hr-domain.js and guidance.js (employee/department structure and approval
//     relationship scope)
//
// Hard rules:
//   R1  Only HR domain checkpoints are assembled here. Never other domains.
//   R2  HR foundational and structure checkpoints target "hr.department". Job
//       structure checkpoints target "hr.job". HR settings checkpoints target
//       "res.company".
//   R3  method is always "write". target_operation mirrors method for governed
//       preview/apply compatibility.
//   R4  intended_changes is null for all checkpoints. Department, job, and HR
//       settings specifics are not derivable from checkpoint metadata or
//       discovery answers alone. Null is honest.
//   R5  HR-DREQ-003 is conditional: only assembled when TA-03 includes "HR leave".
//   R6  HR-DREQ-004 is conditional: only assembled when RM-02 = true or "Yes".
//   R7  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R8  Non-HR checkpoint IDs are never added to the returned map.
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

export const HR_OP_DEFS_VERSION = "1.0.0";

export const HR_DEPARTMENT_MODEL = "hr.department";
export const HR_JOB_MODEL = "hr.job";
export const HR_COMPANY_MODEL = "res.company";
export const HR_TARGET_METHOD = "write";

export const HR_COVERAGE_GAP_MODELS = Object.freeze([]);

export const HR_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.HR_FOUND_001,
  CHECKPOINT_IDS.HR_DREQ_001,
  CHECKPOINT_IDS.HR_DREQ_002,
  // HR_DREQ_003 added conditionally when TA-03 includes HR leave (R5)
  // HR_DREQ_004 added conditionally when RM-02 = Yes (R6)
]);

export const HR_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.HR_FOUND_001]: Object.freeze({
    target_model: HR_DEPARTMENT_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.HR_DREQ_001]: Object.freeze({
    target_model: HR_DEPARTMENT_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.HR_DREQ_002]: Object.freeze({
    target_model: HR_JOB_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.HR_DREQ_003]: Object.freeze({
    target_model: HR_COMPANY_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.HR_DREQ_004]: Object.freeze({
    target_model: HR_COMPANY_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});

function addHrDefinition(map, checkpoint_id) {
  const metadata = HR_CHECKPOINT_METADATA[checkpoint_id];
  if (!metadata) return;
  map[checkpoint_id] = createOperationDefinition({
    checkpoint_id,
    target_model: metadata.target_model,
    method: HR_TARGET_METHOD,
    intended_changes: null,
    safety_class: metadata.safety_class,
    execution_relevance: metadata.execution_relevance,
    validation_source: metadata.validation_source,
  });
}

export function assembleHrOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const ta03 = Array.isArray(answers["TA-03"]) ? answers["TA-03"] : [];

  addHrDefinition(map, CHECKPOINT_IDS.HR_FOUND_001);
  addHrDefinition(map, CHECKPOINT_IDS.HR_DREQ_001);
  addHrDefinition(map, CHECKPOINT_IDS.HR_DREQ_002);

  if (ta03.includes("HR leave")) {
    addHrDefinition(map, CHECKPOINT_IDS.HR_DREQ_003);
  }

  const rm02 = answers["RM-02"];
  if (rm02 === true || rm02 === "Yes") {
    addHrDefinition(map, CHECKPOINT_IDS.HR_DREQ_004);
  }

  return map;
}
