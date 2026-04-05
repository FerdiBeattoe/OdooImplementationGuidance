// ---------------------------------------------------------------------------
// Quality Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Quality domain
//   checkpoints that target quality.point. These definitions document the
//   governed application-layer target now that quality.point is approved in
//   governed-odoo-apply-service.js.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6
//   - governed-odoo-apply-service.js S4 (quality.point is in
//     ALLOWED_APPLY_MODELS; quality.alert is not)
//   - checkpoint-engine.js generateQualityCheckpoints
//
// Hard rules:
//   R1  Only Quality domain checkpoints are considered here. Never other domains.
//   R2  target_model is "quality.point" for every assembled Quality checkpoint.
//       quality.alert remains a documented coverage gap.
//   R3  method is always "write". target_operation mirrors method for governed
//       preview/apply compatibility.
//   R4  intended_changes is null for all checkpoints. Control-point specifics
//       are not derivable from target_context or discovery_answers alone.
//       Null is honest.
//   R5  The assembler mirrors checkpoint-engine metadata exactly for
//       QUA-FOUND-001, QUA-DREQ-001, QUA-DREQ-002, and QUA-DREQ-003:
//       validation_source "User_Confirmed", execution_relevance "Informational",
//       safety_class "Not_Applicable".
//   R6  QUA-DREQ-001 is conditional: only assembled when MF-06 includes "Receipt".
//   R7  QUA-DREQ-002 is conditional: only assembled when MF-06 includes "In-process".
//   R8  QUA-DREQ-003 is conditional: only assembled when MF-06 includes "Finished goods".
//   R9  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R10 Non-Quality checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `quality-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const QUALITY_OP_DEFS_VERSION = "1.1.0";
export const QUALITY_POINT_MODEL = "quality.point";
export const QUALITY_TARGET_METHOD = "write";

// COVERAGE GAP: quality.alert not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const QUALITY_COVERAGE_GAP_MODELS = Object.freeze(["quality.alert"]);

// Historical export name retained for compatibility. These are the checkpoint
// IDs covered by this assembler even though checkpoint-engine currently marks
// them Informational / Not_Applicable.
export const QUALITY_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.QUA_FOUND_001,
  // QUA_DREQ_001 / QUA_DREQ_002 / QUA_DREQ_003 added conditionally by MF-06 gates
]);

export const QUALITY_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.QUA_FOUND_001]: Object.freeze({
    target_model: QUALITY_POINT_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.QUA_DREQ_001]: Object.freeze({
    target_model: QUALITY_POINT_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.QUA_DREQ_002]: Object.freeze({
    target_model: QUALITY_POINT_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
  [CHECKPOINT_IDS.QUA_DREQ_003]: Object.freeze({
    target_model: QUALITY_POINT_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
});

function addQualityDefinition(map, checkpoint_id) {
  const metadata = QUALITY_CHECKPOINT_METADATA[checkpoint_id];
  if (!metadata) return;
  map[checkpoint_id] = createOperationDefinition({
    checkpoint_id,
    target_model: metadata.target_model,
    method: QUALITY_TARGET_METHOD,
    intended_changes: null,
    safety_class: metadata.safety_class,
    execution_relevance: metadata.execution_relevance,
    validation_source: metadata.validation_source,
  });
}

export function assembleQualityOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const mf06 = Array.isArray(answers["MF-06"]) ? answers["MF-06"] : [];

  // QUA-FOUND-001: quality.point foundational readiness check
  addQualityDefinition(map, CHECKPOINT_IDS.QUA_FOUND_001);

  // QUA-DREQ-001: quality.point control point configuration
  if (mf06.includes("Receipt")) {
    addQualityDefinition(map, CHECKPOINT_IDS.QUA_DREQ_001);
  }

  // QUA-DREQ-002: manufacturing quality gate (depends on MRP-DREQ-005 in checkpoint-engine)
  if (mf06.includes("In-process")) {
    addQualityDefinition(map, CHECKPOINT_IDS.QUA_DREQ_002);
  }

  // QUA-DREQ-003: quality.point standalone quality rules
  if (mf06.includes("Finished goods")) {
    addQualityDefinition(map, CHECKPOINT_IDS.QUA_DREQ_003);
  }

  return map;
}
