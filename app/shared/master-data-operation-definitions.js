// ---------------------------------------------------------------------------
// Master Data Operation Definitions - Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `master-data-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const MASTER_DATA_OP_DEFS_VERSION = "1.1.0";
export const MASTER_DATA_CATEGORY_MODEL = "product.category";
export const MASTER_DATA_PARTNER_CATEGORY_MODEL = "res.partner.category";
export const MASTER_DATA_UOM_CATEGORY_MODEL = "uom.category";
export const MASTER_DATA_TARGET_OPERATION = "write";

export const MASTER_DATA_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function splitCommaSeparatedNames(value) {
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function extractMasterDataCapture(wizard_captures) {
  if (!isPlainObject(wizard_captures)) {
    return null;
  }
  return isPlainObject(wizard_captures["master-data"]) ? wizard_captures["master-data"] : null;
}

function buildProductCategoryChanges(masterDataCapture) {
  if (!isPlainObject(masterDataCapture)) {
    return null;
  }
  const name = typeof masterDataCapture.product_category_name === "string"
    ? masterDataCapture.product_category_name.trim()
    : "";
  return name ? { name } : null;
}

function buildPartnerCategoryChanges(masterDataCapture) {
  if (!isPlainObject(masterDataCapture)) {
    return null;
  }
  const changes = splitCommaSeparatedNames(masterDataCapture.customer_tag_names);
  return changes.length > 0 ? changes : null;
}

export function assembleMasterDataOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const masterDataCapture = extractMasterDataCapture(wizard_captures);
  const productCategoryChanges = buildProductCategoryChanges(masterDataCapture);
  const partnerCategoryChanges = buildPartnerCategoryChanges(masterDataCapture);

  // MAS-FOUND-001, MAS-FOUND-002, MAS-DREQ-001, MAS-DREQ-002, MAS-DREQ-003,
  // and MAS-DREQ-004 remain excluded. They were reclassified to confirm-only or
  // informational checkpoints in checkpoint-engine.js.
  // honest-null: uom.category is not confirmed in scripts/odoo-confirmed-fields.json,
  // and no executable Master Data checkpoint currently targets it.

  const op01 = answers["OP-01"];
  if (op01 === true || op01 === "Yes") {
    map[CHECKPOINT_IDS.MAS_DREQ_005] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.MAS_DREQ_005,
      target_model: MASTER_DATA_CATEGORY_MODEL,
      target_operation: MASTER_DATA_TARGET_OPERATION,
      intended_changes: productCategoryChanges,
    });
  }

  const mf01 = answers["MF-01"];
  if (mf01 === true || mf01 === "Yes") {
    map[CHECKPOINT_IDS.MAS_DREQ_006] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.MAS_DREQ_006,
      target_model: MASTER_DATA_CATEGORY_MODEL,
      target_operation: MASTER_DATA_TARGET_OPERATION,
      intended_changes: productCategoryChanges,
    });
  }

  const pi04 = answers["PI-04"];
  if (pi04 !== undefined && pi04 !== null && pi04 !== "None") {
    map[CHECKPOINT_IDS.MAS_DREQ_007] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.MAS_DREQ_007,
      target_model: MASTER_DATA_PARTNER_CATEGORY_MODEL,
      target_operation: MASTER_DATA_TARGET_OPERATION,
      intended_changes: partnerCategoryChanges,
    });
  }

  return map;
}
