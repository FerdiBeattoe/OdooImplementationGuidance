// ---------------------------------------------------------------------------
// Purchase Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Purchase domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Purchase previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (res.company is in ALLOWED_APPLY_MODELS)
//   - governed-odoo-apply-service.js S12 (target_model must match preview at apply)
//
// Hard rules:
//   R1  Only Purchase domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "res.company" for all Executable Purchase checkpoints.
//       Odoo 19 purchase configuration is done through res.config.settings which
//       writes to res.company fields (e.g., po_double_validation_amount, po_lock,
//       purchase_receipt_reminder). res.company is confirmed in ALLOWED_APPLY_MODELS.
//   R3  target_operation is always "write" — no create, unlink, or other operations.
//   R4  intended_changes remains null unless a value is directly derivable from
//       target_context or discovery_answers with a confirmed Odoo 19 field
//       reference already present in repo evidence. Currently only
//       PUR-DREQ-004 qualifies:
//       - PI-02 indicates all purchase orders require approval → res.company.po_double_validation = "always"
//         (field name confirmed in this file; value token confirmed by
//          app/frontend/src/wizards/operations/PurchaseWizard.js purchaseTerms.double_validation)
//       All other Purchase checkpoints remain null — required business values are
//       not present at assembly time.
//   R5  PUR-FOUND-001 is Informational (execution_relevance: Informational,
//       safety_class: Not_Applicable). Intentionally excluded — Gate 6 does not
//       apply to Informational checkpoints.
//   R6  PUR-GL-001 is non-Executable (execution_relevance: None,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R7  PUR-DREQ-003 is conditional: only assembled when PI-02 indicates the
//       threshold approval policy (long-form onboarding answer or short
//       pipeline label). Gate confirmed in checkpoint-engine.js
//       generatePurchaseCheckpoints.
//   R8  PUR-DREQ-004 is conditional: only assembled when PI-02 indicates all
//       purchase orders require approval (long-form or short label). Gate
//       confirmed in checkpoint-engine.js generatePurchaseCheckpoints.
//   R9  PUR-DREQ-003 and PUR-DREQ-004 are MUTUALLY EXCLUSIVE — PI-02 can only
//       hold one value. Both can never be assembled simultaneously.
//   R10 PUR-DREQ-005 is conditional: only assembled when FC-03 = true or "Yes".
//       Gate confirmed in checkpoint-engine.js generatePurchaseCheckpoints.
//   R11 PUR-DREQ-006 is conditional: only assembled when MF-04 = true or "Yes".
//       Gate confirmed in checkpoint-engine.js generatePurchaseCheckpoints.
//   R12 PUR-DREQ-007 is conditional: only assembled when PI-05 = true or "Yes".
//       Gate confirmed in checkpoint-engine.js generatePurchaseCheckpoints.
//   R13 The returned map is always a plain object (createOperationDefinitionsMap shape).
//       Never null, never an array.
//   R14 Non-Purchase checkpoint IDs are never added to the returned map.
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
import {
  isPi02AllOrders,
  isPi02Threshold,
} from "./purchase-question-helpers.js";

// ---------------------------------------------------------------------------
// Module version — increment on any rule change
// ---------------------------------------------------------------------------

export const PURCHASE_OP_DEFS_VERSION = "1.1.0";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Target model for all Purchase Executable checkpoints.
// Odoo 19 purchase configuration writes to res.company via res.config.settings.
// Confirmed present in governed-odoo-apply-service.js ALLOWED_APPLY_MODELS.
export const PURCHASE_COMPANY_MODEL = "res.company";

// Target operation for all Purchase Executable checkpoints.
export const PURCHASE_TARGET_OPERATION = "write";

// Purchase Executable checkpoint IDs covered by this assembler (unconditional only).
// PUR-FOUND-001 intentionally excluded (Informational / Not_Applicable — R5).
// PUR-GL-001 intentionally excluded (execution_relevance: None — R6).
// PUR-DREQ-003 added conditionally (PI-02 threshold policy — R7).
// PUR-DREQ-004 added conditionally (PI-02 all-orders policy — R8).
// PUR-DREQ-005 added conditionally (FC-03=Yes — R10).
// PUR-DREQ-006 added conditionally (MF-04=Yes — R11).
// PUR-DREQ-007 added conditionally (PI-05=Yes — R12).
export const PURCHASE_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.PUR_DREQ_001, // Unconditional, Conditional
  CHECKPOINT_IDS.PUR_DREQ_002, // Unconditional, Safe
  // PUR_DREQ_003 added conditionally when PI-02 indicates threshold policy (R7)
  // PUR_DREQ_004 added conditionally when PI-02 indicates all orders policy (R8)
  // PUR_DREQ_005 added conditionally when FC-03=Yes (R10)
  // PUR_DREQ_006 added conditionally when MF-04=Yes (R11)
  // PUR_DREQ_007 added conditionally when PI-05=Yes (R12)
]);

// ---------------------------------------------------------------------------
// Main export: assemblePurchaseOperationDefinitions
// ---------------------------------------------------------------------------

/**
 * Assembles the operation_definitions map for Purchase Executable checkpoints.
 *
 * Unconditional definitions returned (keyed by checkpoint_id):
 *   PUR-DREQ-001  RFQ-to-PO purchase policy settings       target_model: res.company
 *   PUR-DREQ-002  Vendor terms and pricing policy settings  target_model: res.company
 *
 * Conditional definitions:
 *   PUR-DREQ-003  Purchase approval threshold settings  target_model: res.company  (PI-02 threshold policy)
 *   PUR-DREQ-004  Purchase approval all-orders setting  target_model: res.company  (PI-02 all-orders policy)
 *   PUR-DREQ-005  Purchase-accounting linkage settings  target_model: res.company  (FC-03=Yes)
 *   PUR-DREQ-006  Subcontracting purchase settings      target_model: res.company  (MF-04=Yes)
 *   PUR-DREQ-007  Dropship purchase settings            target_model: res.company  (PI-05=Yes)
 *
 * Always excluded:
 *   PUR-FOUND-001  Informational (execution_relevance: Informational,
 *                  safety_class: Not_Applicable) — definition intentionally withheld (R5)
 *   PUR-GL-001     Non-Executable (execution_relevance: None,
 *                  safety_class: Not_Applicable) — definition intentionally withheld (R6)
 *
 * PUR-DREQ-003 and PUR-DREQ-004 are mutually exclusive (R9) — PI-02 can only
 * describe one approval policy (threshold or all orders), never both.
 *
 * intended_changes remains null unless directly derivable from discovery answers
 * with a confirmed Odoo 19 field reference already present in repo evidence.
 * Currently only PUR-DREQ-004 qualifies:
 *   PUR-DREQ-004  intended_changes: { po_double_validation: "always" }
 *
 * @param {object|null} target_context      — createTargetContext() shape or null
 * @param {object|null} discovery_answers   — createDiscoveryAnswers() shape or null
 * @returns {{ [checkpoint_id: string]: object }} operation_definitions map (never null)
 */
export function assemblePurchaseOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();

  // ── PUR-FOUND-001: Intentionally excluded (R5) ──────────────────────────────
  // Informational (execution_relevance: Informational, safety_class: Not_Applicable).
  // Gate 6 does not apply to Informational checkpoints.

  // ── PUR-DREQ-001: RFQ-to-PO purchase policy settings (Conditional, unconditional) ──
  // Configures purchase order policy settings on the company record via res.config.settings.
  // intended_changes is null — purchase policy configuration data not available at
  // assembly time (R4).
  map[CHECKPOINT_IDS.PUR_DREQ_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.PUR_DREQ_001,
    target_model:     PURCHASE_COMPANY_MODEL,
    target_operation: PURCHASE_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── PUR-DREQ-002: Vendor terms and pricing policy settings (Safe, unconditional) ──
  // Configures vendor lead times, pricing policies, and terms on the company record.
  // intended_changes is null — vendor terms and pricing data not available at
  // assembly time (R4).
  map[CHECKPOINT_IDS.PUR_DREQ_002] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.PUR_DREQ_002,
    target_model:     PURCHASE_COMPANY_MODEL,
    target_operation: PURCHASE_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── PUR-GL-001: Intentionally excluded (R6) ──────────────────────────────────
  // Non-Executable (execution_relevance: None, safety_class: Not_Applicable).
  // No definition required.

  // ── Conditional definitions ────────────────────────────────────────────────────

  const answers = discovery_answers?.answers ?? {};

  // ── PUR-DREQ-003: Purchase approval threshold (Conditional, PI-02 threshold) ──
  // Configures po_double_validation and po_double_validation_amount on res.company.
  // Only assembled when PI-02 (purchase approval policy) is exactly "Threshold" (R7).
  // PUR-DREQ-003 and PUR-DREQ-004 are mutually exclusive — PI-02 has a single value (R9).
  const pi02 = answers["PI-02"];
  if (isPi02Threshold(pi02)) {
    map[CHECKPOINT_IDS.PUR_DREQ_003] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.PUR_DREQ_003,
      target_model:     PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── PUR-DREQ-004: Purchase approval all orders (Conditional, PI-02 all-orders) ──
  // Configures po_double_validation for all purchase orders on res.company.
  // Only assembled when PI-02 (purchase approval policy) is exactly "All orders" (R8).
  // PUR-DREQ-003 and PUR-DREQ-004 are mutually exclusive — PI-02 has a single value (R9).
  // Derivation source:
  //   - discovery_answers["PI-02"] = "All orders"
  //   - res.company field name "po_double_validation" confirmed in this file
  //   - value token "always" confirmed by PurchaseWizard purchaseTerms.double_validation
  if (isPi02AllOrders(pi02)) {
    map[CHECKPOINT_IDS.PUR_DREQ_004] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.PUR_DREQ_004,
      target_model:     PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: { po_double_validation: "always" },
    });
  }

  // ── PUR-DREQ-005: Purchase-accounting linkage settings (Conditional, FC-03=Yes) ──
  // Configures purchase-accounting integration flags on res.company.
  // Only assembled when FC-03 (purchase-accounting linkage) is explicitly Yes (R10).
  const fc03 = answers["FC-03"];
  if (fc03 === true || fc03 === "Yes") {
    map[CHECKPOINT_IDS.PUR_DREQ_005] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.PUR_DREQ_005,
      target_model:     PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── PUR-DREQ-006: Subcontracting purchase settings (Conditional, MF-04=Yes) ────
  // Configures subcontracting purchase order settings on res.company.
  // Only assembled when MF-04 (subcontracting enabled) is explicitly Yes (R11).
  const mf04 = answers["MF-04"];
  if (mf04 === true || mf04 === "Yes") {
    map[CHECKPOINT_IDS.PUR_DREQ_006] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.PUR_DREQ_006,
      target_model:     PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── PUR-DREQ-007: Dropship purchase settings (Conditional, PI-05=Yes) ────────
  // Configures dropship purchase route and settings on res.company.
  // Only assembled when PI-05 (dropshipping enabled) is explicitly Yes (R12).
  const pi05 = answers["PI-05"];
  if (pi05 === true || pi05 === "Yes") {
    map[CHECKPOINT_IDS.PUR_DREQ_007] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.PUR_DREQ_007,
      target_model:     PURCHASE_COMPANY_MODEL,
      target_operation: PURCHASE_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  return map;
}
