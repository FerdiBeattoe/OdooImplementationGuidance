// ---------------------------------------------------------------------------
// Purchase Operation Definitions - Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `purchase-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const PURCHASE_OP_DEFS_VERSION = "1.2.0";
export const PURCHASE_COMPANY_MODEL = "res.company";
export const PURCHASE_TARGET_OPERATION = "write";

export const PURCHASE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.PUR_DREQ_001,
  CHECKPOINT_IDS.PUR_DREQ_002,
]);

const PI02_THRESHOLD_VALUES = Object.freeze([
  "Threshold",
  "Approval required above a monetary threshold",
]);

const PI02_ALL_ORDERS_VALUES = Object.freeze([
  "All orders",
  "All purchase orders require manager approval",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractPurchaseCapture(wizard_captures) {
  if (!isPlainObject(wizard_captures)) {
    return null;
  }
  return isPlainObject(wizard_captures.purchase) ? wizard_captures.purchase : null;
}

function buildThresholdChanges(purchaseCapture) {
  if (!isPlainObject(purchaseCapture)) {
    return null;
  }

  const rawAmount = typeof purchaseCapture.approval_threshold_amount === "string"
    ? purchaseCapture.approval_threshold_amount.trim()
    : "";
  const amount = rawAmount === "" ? null : Number(rawAmount);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return {
    po_double_validation: "two_step",
    po_double_validation_amount: amount,
  };
}

function buildAllOrdersChanges() {
  return {
    po_double_validation: "always",
  };
}

export function assemblePurchaseOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const purchaseCapture = extractPurchaseCapture(wizard_captures);
  const thresholdChanges = buildThresholdChanges(purchaseCapture);

  map[CHECKPOINT_IDS.PUR_DREQ_001] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.PUR_DREQ_001,
    target_model: PURCHASE_COMPANY_MODEL,
    target_operation: PURCHASE_TARGET_OPERATION,
    intended_changes: null,
  });

  map[CHECKPOINT_IDS.PUR_DREQ_002] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.PUR_DREQ_002,
    target_model: PURCHASE_COMPANY_MODEL,
    target_operation: PURCHASE_TARGET_OPERATION,
    intended_changes: null,
  });

  if (PI02_THRESHOLD_VALUES.includes(answers["PI-02"])) {
    map[CHECKPOINT_IDS.PUR_DREQ_003] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.PUR_DREQ_003,
      target_model: PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: thresholdChanges,
    });
  }

  if (PI02_ALL_ORDERS_VALUES.includes(answers["PI-02"])) {
    map[CHECKPOINT_IDS.PUR_DREQ_004] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.PUR_DREQ_004,
      target_model: PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: buildAllOrdersChanges(),
    });
  }

  if (answers["FC-03"] === true || answers["FC-03"] === "Yes") {
    map[CHECKPOINT_IDS.PUR_DREQ_005] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.PUR_DREQ_005,
      target_model: PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: thresholdChanges,
    });
  }

  if (answers["MF-04"] === true || answers["MF-04"] === "Yes") {
    map[CHECKPOINT_IDS.PUR_DREQ_006] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.PUR_DREQ_006,
      target_model: PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: thresholdChanges,
    });
  }

  if (answers["PI-05"] === true || answers["PI-05"] === "Yes") {
    map[CHECKPOINT_IDS.PUR_DREQ_007] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.PUR_DREQ_007,
      target_model: PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: thresholdChanges,
    });
  }

  return map;
}
