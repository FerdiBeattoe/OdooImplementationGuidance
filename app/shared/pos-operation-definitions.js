// ---------------------------------------------------------------------------
// POS Operation Definitions - Odoo 19 Implementation Control Platform
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

export const POS_OP_DEFS_VERSION = "1.1.0";
export const POS_PAYMENT_METHOD_MODEL = "pos.payment.method";
export const POS_TARGET_METHOD = "write";
export const POS_COVERAGE_GAP_MODELS = Object.freeze(["pos.config"]);

export const POS_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.POS_FOUND_001,
  CHECKPOINT_IDS.POS_DREQ_001,
  CHECKPOINT_IDS.POS_DREQ_002,
  CHECKPOINT_IDS.POS_DREQ_003,
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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractPosCapture(wizard_captures) {
  if (!isPlainObject(wizard_captures)) {
    return null;
  }
  return isPlainObject(wizard_captures.pos) ? wizard_captures.pos : null;
}

function buildPaymentMethodChanges(posCapture) {
  if (!isPlainObject(posCapture)) {
    return null;
  }

  const changes = [];
  if (posCapture.accept_cash === true) {
    changes.push({ name: "Cash", is_cash_count: true });
  }
  if (posCapture.accept_card === true) {
    changes.push({ name: "Card", is_cash_count: false });
  }

  return changes.length > 0 ? changes : null;
}

function addPosDefinition(map, checkpoint_id, intended_changes) {
  const metadata = POS_CHECKPOINT_METADATA[checkpoint_id];
  if (!metadata) return;
  map[checkpoint_id] = createOperationDefinition({
    checkpoint_id,
    target_model: metadata.target_model,
    method: POS_TARGET_METHOD,
    intended_changes,
    safety_class: metadata.safety_class,
    execution_relevance: metadata.execution_relevance,
    validation_source: metadata.validation_source,
  });
}

export function assemblePosOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const paymentMethodChanges = buildPaymentMethodChanges(extractPosCapture(wizard_captures));

  addPosDefinition(map, CHECKPOINT_IDS.POS_FOUND_001, paymentMethodChanges);
  addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_001, paymentMethodChanges);
  addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_002, paymentMethodChanges);
  addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_003, paymentMethodChanges);

  if (answers["FC-01"] === "Full accounting") {
    addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_004, paymentMethodChanges);
  }

  const op01 = answers["OP-01"];
  if (op01 === true || op01 === "Yes") {
    addPosDefinition(map, CHECKPOINT_IDS.POS_DREQ_005, paymentMethodChanges);
  }

  return map;
}
