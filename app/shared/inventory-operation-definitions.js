// ---------------------------------------------------------------------------
// Inventory Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Inventory domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Inventory previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (stock.warehouse and stock.picking.type
//     are in ALLOWED_APPLY_MODELS; stock.location is not)
//   - checkpoint-engine.js generateInventoryCheckpoints (checkpoint IDs,
//     validation_source, execution_relevance, safety_class, and gates)
//   - domain-capabilities.js inventory summary (bounded warehouse and
//     operation-type scaffolding)
//
// Hard rules:
//   R1  Only Inventory domain checkpoints are assembled here. Never other domains.
//   R2  Foundational Inventory checkpoints target "stock.warehouse". Domain_Required
//       Inventory checkpoints target "stock.picking.type" in the current governed
//       apply surface. "stock.location" is a documented coverage gap.
//   R3  method is always "write". target_operation mirrors method for governed
//       preview/apply compatibility.
//   R4  intended_changes defaults to null. Wizard captures may supply explicit
//       values for executable checkpoints (e.g. reception/delivery step plans).
//   R5  INV-GL-001 and INV-GL-002 are non-Executable (execution_relevance: None,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R6  INV-DREQ-003 is conditional: only assembled when OP-02 >= 2.
//   R7  INV-DREQ-004 is conditional: only assembled when PI-03 = "2 steps".
//   R8  INV-DREQ-005 is conditional: only assembled when PI-03 = "3 steps".
//   R9  INV-DREQ-006 is conditional: only assembled when PI-05 = true or "Yes".
//   R10 INV-DREQ-007 is conditional: only assembled when FC-02 = "AVCO" or "FIFO".
//   R11 INV-DREQ-008 is conditional: only assembled when MF-01 = true or "Yes".
//   R12 INV-DREQ-009 is conditional: only assembled when RM-04 = true or "Yes".
//   R13 The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R14 Non-Inventory checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `inventory-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const INVENTORY_OP_DEFS_VERSION = "1.0.0";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export const INVENTORY_WAREHOUSE_MODEL = "stock.warehouse";
export const INVENTORY_PICKING_TYPE_MODEL = "stock.picking.type";
export const INVENTORY_TARGET_METHOD = "write";

// COVERAGE GAP: stock.location not in ALLOWED_APPLY_MODELS
// Must be added to governed-odoo-apply-service.js before
// this checkpoint can have governed-apply execution
export const INVENTORY_COVERAGE_GAP_MODELS = Object.freeze(["stock.location"]);

export const INVENTORY_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.INV_FOUND_001,
  CHECKPOINT_IDS.INV_FOUND_002,
  CHECKPOINT_IDS.INV_FOUND_003,
  CHECKPOINT_IDS.INV_DREQ_001,
  CHECKPOINT_IDS.INV_DREQ_002,
  // INV_DREQ_003 added conditionally when OP-02 >= 2 (R6)
  // INV_DREQ_004 added conditionally when PI-03 = "2 steps" (R7)
  // INV_DREQ_005 added conditionally when PI-03 = "3 steps" (R8)
  // INV_DREQ_006 added conditionally when PI-05 = Yes (R9)
  // INV_DREQ_007 added conditionally when FC-02 = AVCO or FIFO (R10)
  // INV_DREQ_008 added conditionally when MF-01 = Yes (R11)
  // INV_DREQ_009 added conditionally when RM-04 = Yes (R12)
]);

export const INVENTORY_CHECKPOINT_METADATA = Object.freeze({
  [CHECKPOINT_IDS.INV_FOUND_001]: Object.freeze({
    target_model: INVENTORY_WAREHOUSE_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.INV_FOUND_002]: Object.freeze({
    target_model: INVENTORY_WAREHOUSE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.INV_FOUND_003]: Object.freeze({
    target_model: INVENTORY_WAREHOUSE_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.INV_DREQ_001]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    validation_source: "User_Confirmed",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.INV_DREQ_002]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.INV_DREQ_003]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.INV_DREQ_004]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.INV_DREQ_005]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.INV_DREQ_006]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.INV_DREQ_007]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Conditional",
  }),
  [CHECKPOINT_IDS.INV_DREQ_008]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    validation_source: "Both",
    execution_relevance: "Executable",
    safety_class: "Safe",
  }),
  [CHECKPOINT_IDS.INV_DREQ_009]: Object.freeze({
    target_model: INVENTORY_PICKING_TYPE_MODEL,
    // DL-033: Both/Executable/Conditional → User_Confirmed/Informational/Not_Applicable (R4 honest-null).
    validation_source: "User_Confirmed",
    execution_relevance: "Informational",
    safety_class: "Not_Applicable",
  }),
});

function addInventoryDefinition(map, checkpoint_id, overrides = {}) {
  const metadata = INVENTORY_CHECKPOINT_METADATA[checkpoint_id];
  if (!metadata) return;
  map[checkpoint_id] = createOperationDefinition({
    checkpoint_id,
    target_model: metadata.target_model,
    method: INVENTORY_TARGET_METHOD,
    intended_changes:
      overrides && Object.prototype.hasOwnProperty.call(overrides, "intended_changes")
        ? overrides.intended_changes
        : null,
    safety_class: metadata.safety_class,
    execution_relevance: metadata.execution_relevance,
    validation_source: metadata.validation_source,
  });
}

export function assembleInventoryOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();

  addInventoryDefinition(map, CHECKPOINT_IDS.INV_FOUND_001);
  addInventoryDefinition(map, CHECKPOINT_IDS.INV_FOUND_002);
  addInventoryDefinition(map, CHECKPOINT_IDS.INV_FOUND_003);
  addInventoryDefinition(map, CHECKPOINT_IDS.INV_DREQ_001);
  addInventoryDefinition(map, CHECKPOINT_IDS.INV_DREQ_002);

  const answers = discovery_answers?.answers ?? {};
  const op02 = Number(answers["OP-02"]);
  if (!Number.isNaN(op02) && op02 >= 2) {
    addInventoryDefinition(map, CHECKPOINT_IDS.INV_DREQ_003);
  }

  const wizardData = extractInventoryWizardData(wizard_captures);
  const pi03 = answers["PI-03"];
  if (pi03 === "2 steps") {
    addInventoryDefinition(
      map,
      CHECKPOINT_IDS.INV_DREQ_004,
      buildDefinitionOptions(wizardData, "two_steps")
    );
  }
  if (pi03 === "3 steps") {
    addInventoryDefinition(
      map,
      CHECKPOINT_IDS.INV_DREQ_005,
      buildDefinitionOptions(wizardData, "three_steps")
    );
  }

  const pi05 = answers["PI-05"];
  if (pi05 === true || pi05 === "Yes") {
    addInventoryDefinition(map, CHECKPOINT_IDS.INV_DREQ_006);
  }

  const fc02 = answers["FC-02"];
  if (fc02 === "AVCO" || fc02 === "FIFO") {
    addInventoryDefinition(map, CHECKPOINT_IDS.INV_DREQ_007);
  }

  const mf01 = answers["MF-01"];
  if (mf01 === true || mf01 === "Yes") {
    addInventoryDefinition(map, CHECKPOINT_IDS.INV_DREQ_008);
  }

  const rm04 = answers["RM-04"];
  if (rm04 === true || rm04 === "Yes") {
    addInventoryDefinition(map, CHECKPOINT_IDS.INV_DREQ_009);
  }

  return map;
}

function extractInventoryWizardData(wizardSource) {
  if (!isPlainObject(wizardSource)) {
    return null;
  }
  if (isPlainObject(wizardSource.inventory)) {
    return wizardSource.inventory;
  }
  return wizardSource;
}

function buildDefinitionOptions(wizardData, expectedReceptionSteps) {
  const intendedChanges = buildReceptionIntendedChanges(
    wizardData,
    expectedReceptionSteps
  );
  return intendedChanges ? { intended_changes: intendedChanges } : undefined;
}

function buildReceptionIntendedChanges(wizardData, expectedReceptionSteps) {
  if (!isPlainObject(wizardData)) {
    return null;
  }
  if (typeof expectedReceptionSteps === "string") {
    if (wizardData.reception_steps !== expectedReceptionSteps) {
      return null;
    }
  }

  const changes = {};
  if (typeof wizardData.reception_steps === "string") {
    changes.reception_steps = wizardData.reception_steps;
  }
  if (typeof wizardData.delivery_steps === "string") {
    changes.delivery_steps = wizardData.delivery_steps;
  } else if (
    expectedReceptionSteps === "three_steps" &&
    !changes.delivery_steps
  ) {
    changes.delivery_steps = "pick_pack_ship";
  }
  if (
    typeof wizardData.warehouse_name === "string" &&
    wizardData.warehouse_name.trim() !== ""
  ) {
    changes.warehouse_name = wizardData.warehouse_name.trim();
  }

  return Object.keys(changes).length > 0 ? changes : null;
}
