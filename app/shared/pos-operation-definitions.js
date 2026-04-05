// ---------------------------------------------------------------------------
// POS Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for POS domain Executable
//   checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking POS previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (pos.payment.method is in
//     ALLOWED_APPLY_MODELS; pos.config is not)
//   - checkpoint-engine.js generatePOSCheckpoints (checkpoint IDs,
//     validation_source, execution_relevance, safety_class, and gates)
//   - preview-engine.js generatePosPreviews (bounded payment-method scaffolding)
//
// Hard rules:
//   R1  Only POS domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "pos.payment.method" for every assembled POS checkpoint
//       in the current governed apply surface. pos.config is a documented
//       coverage gap.
//   R3  method is always "write". target_operation mirrors method for governed
//       preview/apply compatibility.
//   R4  intended_changes is null for all checkpoints. POS session, cashier, and
//       accounting-linkage specifics are not derivable from checkpoint metadata
//       or discovery answers alone. Null is honest.
//   R5  POS-GL-001 is non-Executable (execution_relevance: None,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R6  POS-DREQ-004 is conditional: only assembled when FC-01 = "Full accounting".
//   R7  POS-DREQ-005 is conditional: only assembled when OP-01 = true or "Yes".
//   R8  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R9  Non-POS checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `pos-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const POS_OP_DEFS_VERSION = "1.0.0";
export const POS_PAYMENT_METHOD_MODEL = "pos.payment.method";
export const POS_TARGET_METHOD = "write";

// COVERAGE GAP: pos.config not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const POS_COVERAGE_GAP_MODELS = Object.freeze(["pos.config"]);

export const POS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.POS_FOUND_001,
  CHECKPOINT_IDS.POS_DREQ_001,
  CHECKPOINT_IDS.POS_DREQ_002,
  CHECKPOINT_IDS.POS_DREQ_003,
  // POS_DREQ_004 added conditionally when FC-01 = "Full accounting" (R6)
  // POS_DREQ_005 added conditionally when OP-01 = Yes (R7)
]);

export const POS_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.POS_FOUND_001]: Object.freeze({
    target_model: POS_PAYMENT_METHOD_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.POS_DREQ_001]: Object.freeze({
    target_model: POS_PAYMENT_METHOD_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.POS_DREQ_002]: Object.freeze({
    target_model: POS_PAYMENT_METHOD_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.POS_DREQ_003]: Object.freeze({
    target_model: POS_PAYMENT_METHOD_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.POS_DREQ_004]: Object.freeze({
    target_model: POS_PAYMENT_METHOD_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.POS_DREQ_005]: Object.freeze({
    target_model: POS_PAYMENT_METHOD_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
});

function addPosDefinition(map, checkpoint_id) {
  const metadata = POS_CHECKPOINT_METADATA[checkpoint_id];
  if (!metadata) return;
  map[checkpoint_id] = createOperationDefinition({
    checkpoint_id,
    target_model: metadata.target_model,
    method: POS_TARGET_METHOD,
    intended_changes: null,
    safety_class: metadata.safety_class,
    execution_relevance: metadata.execution_relevance,
    validation_source: metadata.validation_source,
  });
}

export function assemblePosOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};

  addPosDefinition(map, CHECKPOINT_IDS.POS_FOUND_001);
  addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_001);
  addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_002);
  addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_003);

  if (answers["FC-01"] === "Full accounting") {
    addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_004);
  }

  const op01 = answers["OP-01"];
  if (op01 === true || op01 === "Yes") {
    addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_005);
  }

  return map;
}
