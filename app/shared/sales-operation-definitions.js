// ---------------------------------------------------------------------------
// Sales Operation Definitions - Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Sales domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Sales previews.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `sales-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const SALES_OP_DEFS_VERSION = "1.1.0";
export const SALES_PRICELIST_MODEL = "product.pricelist";
export const SALES_TARGET_OPERATION = "write";

export const SALES_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.SAL_FOUND_002,
  CHECKPOINT_IDS.SAL_DREQ_001,
  CHECKPOINT_IDS.SAL_DREQ_002,
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractSalesCapture(wizard_captures) {
  if (!isPlainObject(wizard_captures)) {
    return null;
  }
  return isPlainObject(wizard_captures.sales) ? wizard_captures.sales : null;
}

function buildPricelistChanges(salesCapture) {
  if (!isPlainObject(salesCapture)) {
    return null;
  }

  const name = typeof salesCapture.pricelist_name === "string" ? salesCapture.pricelist_name.trim() : "";
  const currencyId = typeof salesCapture.currency_id === "string" ? salesCapture.currency_id.trim() : "";
  const hasActive = typeof salesCapture.active === "boolean";

  if (!name && !currencyId && !hasActive) {
    return null;
  }

  return {
    name: name || null,
    currency_id: currencyId || null,
    active: hasActive ? salesCapture.active : null,
  };
}

export function assembleSalesOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const pricelistChanges = buildPricelistChanges(extractSalesCapture(wizard_captures));

  map[CHECKPOINT_IDS.SAL_FOUND_002] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.SAL_FOUND_002,
    target_model: SALES_PRICELIST_MODEL,
    target_operation: SALES_TARGET_OPERATION,
    intended_changes: pricelistChanges,
  });

  map[CHECKPOINT_IDS.SAL_DREQ_001] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.SAL_DREQ_001,
    target_model: SALES_PRICELIST_MODEL,
    target_operation: SALES_TARGET_OPERATION,
    intended_changes: pricelistChanges,
  });

  map[CHECKPOINT_IDS.SAL_DREQ_002] = createOperationDefinition({
    checkpoint_id: CHECKPOINT_IDS.SAL_DREQ_002,
    target_model: SALES_PRICELIST_MODEL,
    target_operation: SALES_TARGET_OPERATION,
    intended_changes: pricelistChanges,
  });

  if (answers["SC-02"] === true || answers["SC-02"] === "Yes") {
    map[CHECKPOINT_IDS.SAL_DREQ_003] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.SAL_DREQ_003,
      target_model: SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: pricelistChanges,
    });
  }

  if (answers["SC-03"] === true || answers["SC-03"] === "Yes") {
    map[CHECKPOINT_IDS.SAL_DREQ_004] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.SAL_DREQ_004,
      target_model: SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: pricelistChanges,
    });
  }

  if (answers["SC-04"] === "Manager approval") {
    map[CHECKPOINT_IDS.SAL_DREQ_005] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.SAL_DREQ_005,
      target_model: SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: pricelistChanges,
    });
  }

  if (answers["FC-06"] === true || answers["FC-06"] === "Yes") {
    map[CHECKPOINT_IDS.SAL_DREQ_006] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.SAL_DREQ_006,
      target_model: SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: pricelistChanges,
    });
  }

  if (answers["PI-05"] === true || answers["PI-05"] === "Yes") {
    map[CHECKPOINT_IDS.SAL_DREQ_007] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.SAL_DREQ_007,
      target_model: SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: pricelistChanges,
    });
  }

  return map;
}
