// ---------------------------------------------------------------------------
// Manufacturing Operation Definitions - Odoo 19 Implementation Control Platform
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

export const MANUFACTURING_OP_DEFS_VERSION = "1.1.0";
export const MANUFACTURING_WORKCENTER_MODEL = "mrp.workcenter";
export const MANUFACTURING_TARGET_METHOD = "write";
export const MANUFACTURING_COVERAGE_GAP_MODELS = Object.freeze([
  "mrp.bom",
  "mrp.routing",
]);

export const MANUFACTURING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.MRP_DREQ_001,
  CHECKPOINT_IDS.MRP_DREQ_002,
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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractManufacturingCapture(wizard_captures) {
  if (!isPlainObject(wizard_captures)) {
    return null;
  }
  return isPlainObject(wizard_captures.manufacturing) ? wizard_captures.manufacturing : null;
}

function buildWorkcenterChanges(manufacturingCapture) {
  if (!isPlainObject(manufacturingCapture)) {
    return null;
  }

  const name = typeof manufacturingCapture.workcenter_name === "string"
    ? manufacturingCapture.workcenter_name.trim()
    : "";
  const code = typeof manufacturingCapture.workcenter_code === "string"
    ? manufacturingCapture.workcenter_code.trim()
    : "";
  const rawEfficiency = typeof manufacturingCapture.time_efficiency === "string"
    ? manufacturingCapture.time_efficiency.trim()
    : "";
  const timeEfficiency = rawEfficiency === "" ? null : Number(rawEfficiency);

  if (!name && !code && !Number.isFinite(timeEfficiency)) {
    return null;
  }

  return {
    name: name || null,
    code: code || null,
    time_efficiency: Number.isFinite(timeEfficiency) ? timeEfficiency : null,
  };
}

function addManufacturingDefinition(map, checkpoint_id, intended_changes) {
  const metadata = MANUFACTURING_CHECKPOINT_METADATA[checkpoint_id];
  if (!metadata) return;
  map[checkpoint_id] = createOperationDefinition({
    checkpoint_id,
    target_model: metadata.target_model,
    method: MANUFACTURING_TARGET_METHOD,
    intended_changes,
    safety_class: metadata.safety_class,
    execution_relevance: metadata.execution_relevance,
    validation_source: metadata.validation_source,
  });
}

export function assembleManufacturingOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const workcenterChanges = buildWorkcenterChanges(extractManufacturingCapture(wizard_captures));

  addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_001, workcenterChanges);
  addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_002, workcenterChanges);

  const mf02 = answers["MF-02"];
  if (mf02 === "Multi-level") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_003, workcenterChanges);
  }
  if (mf02 === "Phantom") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_004, workcenterChanges);
  }

  const mf03 = answers["MF-03"];
  if (mf03 === true || mf03 === "Yes") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_005, workcenterChanges);
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_006, workcenterChanges);
  }

  const mf04 = answers["MF-04"];
  if (mf04 === true || mf04 === "Yes") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_007, workcenterChanges);
  }

  if (answers["FC-01"] === "Full accounting" && mf02 === "Multi-level") {
    addManufacturingDefinition(map, CHECKPOINT_IDS.MRP_DREQ_008, workcenterChanges);
  }

  return map;
}
