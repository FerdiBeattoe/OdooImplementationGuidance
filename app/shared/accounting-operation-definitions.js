// ---------------------------------------------------------------------------
// Accounting Operation Definitions - Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `accounting-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

import {
  createOperationDefinition,
  createOperationDefinitionsMap,
} from "./runtime-state-contract.js";

import { CHECKPOINT_IDS } from "./checkpoint-engine.js";

export const ACCOUNTING_OP_DEFS_VERSION = "1.1.0";

export const ACCOUNTING_JOURNAL_MODEL = "account.journal";
export const ACCOUNTING_TAX_MODEL = "account.tax";
export const ACCOUNTING_ACCOUNT_MODEL = "account.account";
export const ACCOUNTING_TARGET_OPERATION = "write";

export const ACCOUNTING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractAccountingCapture(wizard_captures) {
  if (!isPlainObject(wizard_captures)) {
    return null;
  }
  return isPlainObject(wizard_captures.accounting) ? wizard_captures.accounting : null;
}

function buildJournalChanges(accountingCapture) {
  if (!isPlainObject(accountingCapture)) {
    return null;
  }

  const salesJournalName = typeof accountingCapture.sales_journal_name === "string"
    ? accountingCapture.sales_journal_name.trim()
    : "";
  const purchaseJournalName = typeof accountingCapture.purchase_journal_name === "string"
    ? accountingCapture.purchase_journal_name.trim()
    : "";

  const changes = [];
  if (salesJournalName) {
    changes.push({ name: salesJournalName, type: "sale" });
  }
  if (purchaseJournalName) {
    changes.push({ name: purchaseJournalName, type: "purchase" });
  }

  return changes.length > 0 ? changes : null;
}

function normalizeTaxType(value) {
  if (value === "sale" || value === "purchase" || value === "both") {
    return value;
  }
  return null;
}

function buildTaxChanges(accountingCapture) {
  if (!isPlainObject(accountingCapture)) {
    return null;
  }

  const rawRate = typeof accountingCapture.tax_rate === "string"
    ? accountingCapture.tax_rate.trim()
    : "";
  const rate = rawRate === "" ? null : Number(rawRate);
  const taxType = normalizeTaxType(accountingCapture.tax_type);

  if (!Number.isFinite(rate) || !taxType) {
    return null;
  }

  const changes = [];
  if (taxType === "sale" || taxType === "both") {
    changes.push({
      name: `${rawRate}% Sales Tax`,
      amount: rate,
      type_tax_use: "sale",
    });
  }
  if (taxType === "purchase" || taxType === "both") {
    changes.push({
      name: `${rawRate}% Purchase Tax`,
      amount: rate,
      type_tax_use: "purchase",
    });
  }

  return changes.length > 0 ? changes : null;
}

export function assembleAccountingOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
) {
  const map = createOperationDefinitionsMap();
  const answers = discovery_answers?.answers ?? {};
  const accountingCapture = extractAccountingCapture(wizard_captures);
  const journalChanges = buildJournalChanges(accountingCapture);
  const taxChanges = buildTaxChanges(accountingCapture);

  // ACCT-FOUND-001/002 and ACCT-DREQ-001/002/003/004 remain excluded.
  // They were reclassified to Informational or Blocked in checkpoint-engine.js.

  const bm04 = answers["BM-04"];
  if (bm04 === true || bm04 === "Yes") {
    map[CHECKPOINT_IDS.ACCT_DREQ_005] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.ACCT_DREQ_005,
      target_model: ACCOUNTING_JOURNAL_MODEL,
      target_operation: ACCOUNTING_TARGET_OPERATION,
      intended_changes: journalChanges,
    });
  }

  const fc02 = answers["FC-02"];
  if (fc02 === "AVCO" || fc02 === "FIFO") {
    map[CHECKPOINT_IDS.ACCT_DREQ_006] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.ACCT_DREQ_006,
      target_model: ACCOUNTING_ACCOUNT_MODEL,
      target_operation: ACCOUNTING_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  if (fc02 === "Standard Price") {
    map[CHECKPOINT_IDS.ACCT_DREQ_007] = createOperationDefinition({
      checkpoint_id: CHECKPOINT_IDS.ACCT_DREQ_007,
      target_model: ACCOUNTING_ACCOUNT_MODEL,
      target_operation: ACCOUNTING_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  return map;
}
