// ---------------------------------------------------------------------------
// Manufacturing Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Manufacturing domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Manufacturing previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (mrp.workcenter is in
//     ALLOWED_APPLY_MODELS; mrp.bom and mrp.routing are not)
//   - checkpoint-engine.js generateManufacturingCheckpoints (checkpoint IDs,
//     validation_source, execution_relevance, safety_class, and gates)
//   - domain-capabilities.js "manufacturing-mrp" summary (bounded workcenter
//     scaffolding)
//
// Hard rules:
//   R1  Only Manufacturing domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "mrp.workcenter" for every assembled Manufacturing
//       checkpoint in the current governed apply surface. mrp.bom and mrp.routing
//       are documented coverage gaps.
//   R3  method is always "write". target_operation mirrors method for governed
//       preview/apply compatibility.
//   R4  intended_changes is null for all checkpoints. BOM, routing, and
//       workcenter specifics are not derivable from checkpoint metadata or
//       discovery answers alone. Null is honest.
//   R5  MRP-FOUND-001 is Informational (execution_relevance: Informational,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R6  MRP-GL-001 and MRP-GL-002 are non-Executable (execution_relevance: None,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R7  MRP-DREQ-003 is conditional: only assembled when MF-02 = "Multi-level".
//   R8  MRP-DREQ-004 is conditional: only assembled when MF-02 = "Phantom".
//   R9  MRP-DREQ-005 and MRP-DREQ-006 are conditional: only assembled when
//       MF-03 = true or "Yes".
//   R10 MRP-DREQ-007 is conditional: only assembled when MF-04 = true or "Yes".
//   R11 MRP-DREQ-008 is conditional: only assembled when FC-01 = "Full accounting"
//       and MF-02 = "Multi-level".
//   R12 The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R13 Non-Manufacturing checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `manufacturing-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const MANUFACTURING_OP_DEFS_VERSION = "1.0.0";

export const MANUFACTURING_WORKCENTER_MODEL = "mrp.workcenter";
export const MANUFACTURING_TARGET_METHOD = "write";

// COVERAGE GAP: mrp.bom not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
// COVERAGE GAP: mrp.routing not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const MANUFACTURING_COVERAGE_GAP_MODELS = Object.freeze([
  "mrp.bom",
  "mrp.routing",
]);

export const MANUFACTURING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.MRP_DREQ_001,
  CHECKPOINT_IDS.MRP_DREQ_002,
  // MRP_DREQ_003 added conditionally when MF-02 = "Multi-level" (R7)
  // MRP_DREQ_004 added conditionally when MF-02 = "Phantom" (R8)
  // MRP_DREQ_005 and MRP_DREQ_006 added conditionally when MF-03 = Yes (R9)
  // MRP_DREQ_007 added conditionally when MF-04 = Yes (R10)
  // MRP_DREQ_008 added conditionally when FC-01 = "Full accounting" and
  // MF-02 = "Multi-level" (R11)
]);

export const MANUFACTURING_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.MRP_DREQ_001]: Object.freeze({
    target_model: MANUFACTURING_WORKCENTER_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.MRP_DREQ_002]: Object.freeze({
    target_model: MANUFACTURING_WORKCENTER_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.MRP_DREQ_003]: Object.freeze({
    target_model: MANUFACTURING_WORKCENTER_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.MRP_DREQ_004]: Object.freeze({
    target_model: MANUFACTURING_WORKCENTER_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.MRP_DREQ_005]: Object.freeze({
    target_model: MANUFACTURING_WORKCENTER_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.MRP_DREQ_006]: Object.freeze({
    target_model: MANUFACTURING_WORKCENTER_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.MRP_DREQ_007]: Object.freeze({
    target_model: MANUFACTURING_WORKCENTER_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.MRP_DREQ_008]: Object.freeze({
    target_model: MANUFACTURING_WORKCENTER_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});

function addManufacturingDefinition(map, checkpoint_id) {
  const metadata = MANUFACTURING_CHECKPOINT_METADATA[checkpoint_id];
  if (!metadata) return;
  map[checkpoint_id] = createOperationDefinition({
    checkpoint_id,
    target_model: metadata.target_model,
    method: MANUFACTURING_TARGET_METHOD,
    intended_changes: null,
    safety_class: metadata.safety_class,
    execution_relevance: metadata.execution_relevance,
    validation_source: metadata.validation_source,
  });
}

export function assembleManufacturingOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};

  addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_001);
  addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_002);

  const mf02 = answers["MF-02"];
  if (mf02 === "Multi-level") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_003);
  }
  if (mf02 === "Phantom") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_004);
  }

  const mf03 = answers["MF-03"];
  if (mf03 === true || mf03 === "Yes") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_005);
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_006);
  }

  const mf04 = answers["MF-04"];
  if (mf04 === true || mf04 === "Yes") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_007);
  }

  if (answers["FC-01"] === "Full accounting" && mf02 === "Multi-level") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_008);
  }

  return map;
}
