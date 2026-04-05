// ---------------------------------------------------------------------------
// Accounting Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Accounting domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Accounting previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (account.journal, account.tax,
//     account.account are in ALLOWED_APPLY_MODELS)
//   - governed-odoo-apply-service.js S12 (target_model must match preview at apply)
//
// Hard rules:
//   R1  Only Accounting domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "account.journal", "account.tax", or "account.account"
//       per checkpoint purpose. See per-checkpoint comments for exact assignment.
//   R3  target_operation is always "write" — no create, unlink, or other operations.
//   R4  intended_changes is null for all checkpoints — Accounting configuration data
//       (journal names, tax codes, account codes) is not available in target_context
//       or discovery_answers at assembly time. Null is honest (no fabrication).
//   R5  ACCT-FOUND-003 (safety_class: "Blocked") NEVER receives a definition.
//       Its Blocked class signals it must not proceed to preview or execution.
//       Confirmed in checkpoint-engine.js generateAccountingCheckpoints line 1501.
//   R6  ACCT-DREQ-005 is conditional: only assembled when discovery_answers
//       contains BM-04 = true or "Yes". Gate confirmed in checkpoint-engine.js line 1576.
//   R7  ACCT-DREQ-006 is conditional: only assembled when FC-02 = "AVCO" or "FIFO".
//       Gate confirmed in checkpoint-engine.js line 1589.
//   R8  ACCT-DREQ-007 is conditional: only assembled when FC-02 = "Standard Price".
//       Gate confirmed in checkpoint-engine.js line 1602.
//   R9  The returned map is always a plain object (createOperationDefinitionsMap shape).
//       Never null, never an array.
//   R10 Non-Accounting checkpoint IDs are never added to the returned map.
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

// ---------------------------------------------------------------------------
// Module version — increment on any rule change
// ---------------------------------------------------------------------------

export const ACCOUNTING_OP_DEFS_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Target models for Accounting Executable checkpoints.
// All confirmed present in governed-odoo-apply-service.js ALLOWED_APPLY_MODELS.
export const ACCOUNTING_JOURNAL_MODEL = "account.journal";
export const ACCOUNTING_TAX_MODEL     = "account.tax";
export const ACCOUNTING_ACCOUNT_MODEL = "account.account";

// Target operation for all Accounting Executable checkpoints.
export const ACCOUNTING_TARGET_OPERATION = "write";

// Accounting Executable checkpoint IDs covered by this assembler.
// ACCT-FOUND-001 intentionally excluded — reclassified to Informational /
//   User_Confirmed / Not_Applicable. No truthful governed write target exists —
//   account.journal baseline established by Odoo 19 localization. Confirm route only.
//   Bounded semantic correction (DL-018).
// ACCT-FOUND-002 intentionally excluded — reclassified to Informational /
//   User_Confirmed / Not_Applicable. No truthful governed write target exists —
//   account.account baseline established by Odoo 19 localization. Confirm route only.
//   Bounded semantic correction (DL-019).
// ACCT-FOUND-003 intentionally excluded (safety_class: "Blocked" — R5).
// ACCT-DREQ-001 intentionally excluded — reclassified to Informational /
//   User_Confirmed / Not_Applicable. No truthful governed write target exists —
//   account.journal baseline established by Odoo 19 localization. Confirm route only.
//   Bounded semantic correction (DL-020).
// ACCT-DREQ-002 intentionally excluded — reclassified to Informational /
//   User_Confirmed / Not_Applicable. No truthful governed write target exists —
//   account.tax baseline established by Odoo 19 localization. Confirm route only.
//   Bounded semantic correction (DL-021).
// ACCT-DREQ-003 intentionally excluded — reclassified to Informational /
//   User_Confirmed / Not_Applicable. No truthful governed write target exists —
//   account.account baseline established by Odoo 19 localization. Confirm route only.
//   Bounded semantic correction (DL-022).
// ACCT-DREQ-004 intentionally excluded — reclassified to Informational /
//   User_Confirmed / Not_Applicable. No truthful governed write target exists —
//   account.journal baseline established by Odoo 19 localization. Confirm route only.
//   Bounded semantic correction (DL-023).
// ACCT-DREQ-005 added conditionally (BM-04=Yes — R6).
// ACCT-DREQ-006 added conditionally (FC-02=AVCO or FIFO — R7).
// ACCT-DREQ-007 added conditionally (FC-02=Standard Price — R8).
export const ACCOUNTING_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  // No unconditional entries — all unconditional Accounting checkpoints
  // (ACCT-FOUND-001/002, ACCT-DREQ-001/002/003/004) are reclassified to
  // Informational (DL-018 through DL-023).
  // ACCT_FOUND_003 excluded: Blocked (R5)
  // ACCT_DREQ_005 added conditionally when BM-04=Yes (R6)
  // ACCT_DREQ_006 added conditionally when FC-02=AVCO or FIFO (R7)
  // ACCT_DREQ_007 added conditionally when FC-02=Standard Price (R8)
]);

// ---------------------------------------------------------------------------
// Main export: assembleAccountingOperationDefinitions
// ---------------------------------------------------------------------------

/**
 * Assembles the operation_definitions map for Accounting Executable checkpoints.
 *
 * No unconditional definitions remain — all unconditional Accounting checkpoints
 * (ACCT-FOUND-001/002, ACCT-DREQ-001/002/003/004) are reclassified to
 * Informational / User_Confirmed / Not_Applicable (DL-018 through DL-023).
 *
 * Conditional definitions (added only when discovery gates activate):
 *   ACCT-DREQ-005  Multi-currency accounting activation  target_model: account.journal  (BM-04=Yes)
 *   ACCT-DREQ-006  AVCO/FIFO stock valuation accounts    target_model: account.account  (FC-02=AVCO or FIFO)
 *   ACCT-DREQ-007  Standard price variance accounts      target_model: account.account  (FC-02=Standard Price)
 *
 * Always excluded:
 *   ACCT-FOUND-001  Informational / User_Confirmed / Not_Applicable — no definition needed (DL-018)
 *   ACCT-FOUND-002  Informational / User_Confirmed / Not_Applicable — no definition needed (DL-019)
 *   ACCT-FOUND-003  safety_class "Blocked" — definition intentionally withheld (R5)
 *   ACCT-DREQ-001   Informational / User_Confirmed / Not_Applicable — no definition needed (DL-020)
 *   ACCT-DREQ-002   Informational / User_Confirmed / Not_Applicable — no definition needed (DL-021)
 *   ACCT-DREQ-003   Informational / User_Confirmed / Not_Applicable — no definition needed (DL-022)
 *   ACCT-DREQ-004   Informational / User_Confirmed / Not_Applicable — no definition needed (DL-023)
 *
 * intended_changes is null for all entries — Accounting configuration data is not
 * available in target_context or discovery_answers at assembly time (R4).
 *
 * @param {object|null} target_context      — createTargetContext() shape or null
 * @param {object|null} discovery_answers   — createDiscoveryAnswers() shape or null
 * @returns {{ [checkpoint_id: string]: object }} operation_definitions map (never null)
 */
export function assembleAccountingOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();

  // ── ACCT-FOUND-001: EXCLUDED — reclassified checkpoint ──────────────────────────────
  // ACCT-FOUND-001 ("Accounting module activation foundation") is Informational /
  // User_Confirmed / Not_Applicable. No governed operation definition is appropriate.
  // account.journal baseline (8 records) established by Odoo 19 localization.
  // Bounded semantic correction specific to ACCT-FOUND-001 (see DL-018).

  // ── ACCT-FOUND-002: EXCLUDED — reclassified checkpoint ──────────────────────────────
  // ACCT-FOUND-002 ("Chart of accounts configuration") is Informational /
  // User_Confirmed / Not_Applicable. No governed operation definition is appropriate.
  // account.account baseline (124 records) established by Odoo 19 localization.
  // Bounded semantic correction specific to ACCT-FOUND-002 (see DL-019).

  // ── ACCT-FOUND-003: Intentionally excluded (R5) ──────────────────────────────────────
  // safety_class: "Blocked" — this checkpoint must never proceed to preview or execution.
  // Confirmed: checkpoint-engine.js generateAccountingCheckpoints line 1501.

  // ── ACCT-DREQ-001: EXCLUDED — reclassified checkpoint ───────────────────────────────
  // ACCT-DREQ-001 ("Journal configuration") is Informational / User_Confirmed /
  // Not_Applicable. No governed operation definition is appropriate. account.journal
  // baseline (8 records) established by Odoo 19 localization.
  // Bounded semantic correction specific to ACCT-DREQ-001 (see DL-020).

  // ── ACCT-DREQ-002: EXCLUDED — reclassified checkpoint ───────────────────────────────
  // ACCT-DREQ-002 ("Tax configuration baseline") is Informational / User_Confirmed /
  // Not_Applicable. No governed operation definition is appropriate. account.tax baseline
  // (16 records) established by Odoo 19 localization.
  // Bounded semantic correction specific to ACCT-DREQ-002 (see DL-021).

  // ── ACCT-DREQ-003: EXCLUDED — reclassified checkpoint ───────────────────────────────
  // ACCT-DREQ-003 ("Account code structure configuration") is Informational /
  // User_Confirmed / Not_Applicable. No governed operation definition is appropriate.
  // account.account baseline (124 records) established by Odoo 19 localization.
  // Bounded semantic correction specific to ACCT-DREQ-003 (see DL-022).

  // ── ACCT-DREQ-004: EXCLUDED — reclassified checkpoint ───────────────────────────────
  // ACCT-DREQ-004 ("Fiscal period configuration") is Informational / User_Confirmed /
  // Not_Applicable. No governed operation definition is appropriate. account.journal
  // baseline (8 records) established by Odoo 19 localization.
  // Bounded semantic correction specific to ACCT-DREQ-004 (see DL-023).

  // ── Conditional definitions ────────────────────────────────────────────────────────────

  const answers = discovery_answers?.answers ?? {};

  // ── ACCT-DREQ-005: Multi-currency accounting activation (Conditional, BM-04=Yes) ──────
  // Activates multi-currency accounting journals.
  // Only assembled when BM-04 (multi-currency operations) is explicitly Yes (R6).
  // Gate confirmed: checkpoint-engine.js generateAccountingCheckpoints line 1576.
  const bm04 = answers["BM-04"];
  if (bm04 === true || bm04 === "Yes") {
    map[CHECKPOINT_IDS.ACCT_DREQ_005] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.ACCT_DREQ_005,
      target_model:     ACCOUNTING_JOURNAL_MODEL,
      target_operation: ACCOUNTING_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── ACCT-DREQ-006: AVCO/FIFO stock valuation accounts (Conditional, FC-02=AVCO or FIFO) ─
  // Configures stock valuation accounts for AVCO or FIFO costing methods.
  // Only assembled when FC-02 = "AVCO" or "FIFO" (R7).
  // Gate confirmed: checkpoint-engine.js generateAccountingCheckpoints line 1589.
  const fc02 = answers["FC-02"];
  if (fc02 === "AVCO" || fc02 === "FIFO") {
    map[CHECKPOINT_IDS.ACCT_DREQ_006] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.ACCT_DREQ_006,
      target_model:     ACCOUNTING_ACCOUNT_MODEL,
      target_operation: ACCOUNTING_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── ACCT-DREQ-007: Standard price variance accounts (Conditional, FC-02=Standard Price) ─
  // Configures price variance accounts for Standard Price costing method.
  // Only assembled when FC-02 = "Standard Price" (R8).
  // Gate confirmed: checkpoint-engine.js generateAccountingCheckpoints line 1602.
  if (fc02 === "Standard Price") {
    map[CHECKPOINT_IDS.ACCT_DREQ_007] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.ACCT_DREQ_007,
      target_model:     ACCOUNTING_ACCOUNT_MODEL,
      target_operation: ACCOUNTING_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  return map;
}
