// ---------------------------------------------------------------------------
// Sales Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Sales domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Sales previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (product.pricelist is in
//     ALLOWED_APPLY_MODELS)
//   - governed-odoo-apply-service.js S12 (target_model must match preview at apply)
//
// Hard rules:
//   R1  Only Sales domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "product.pricelist" for all Executable Sales checkpoints.
//       Only one Sales model is present in governed-odoo-apply-service.js
//       ALLOWED_APPLY_MODELS. Confirmed present.
//   R3  target_operation is always "write" — no create, unlink, or other operations.
//   R4  intended_changes is null for all checkpoints except SAL-FOUND-002.
//       Exception: SAL-FOUND-002 emits { currency_id } sourced directly from
//       target_context.primary_currency — the pricelist currency must match the
//       company primary currency. Same derivation pattern as FND-DREQ-002
//       (res.company.currency_id). Null when primary_currency is not supplied.
//       All other checkpoints remain null — pricelist names, pricing rules, and
//       quotation templates are not available in target_context or discovery_answers
//       at assembly time. Null is honest (no fabrication).
//   R5  SAL-FOUND-001 is Informational (execution_relevance: Informational,
//       safety_class: Not_Applicable). Intentionally excluded — Gate 6 does not
//       apply to Informational checkpoints.
//   R6  SAL-GL-001 is non-Executable (execution_relevance: None,
//       safety_class: Not_Applicable). Intentionally excluded.
//   R7  SAL-DREQ-003 is conditional: only assembled when SC-02 = true or "Yes".
//       Gate confirmed in checkpoint-engine.js generateSalesCheckpoints.
//   R8  SAL-DREQ-004 is conditional: only assembled when SC-03 = true or "Yes".
//       Gate confirmed in checkpoint-engine.js generateSalesCheckpoints.
//   R9  SAL-DREQ-005 is conditional: only assembled when SC-04 = "Manager approval"
//       (exact string match, NOT boolean). Gate confirmed in checkpoint-engine.js
//       generateSalesCheckpoints.
//   R10 SAL-DREQ-006 is conditional: only assembled when FC-06 = true or "Yes".
//       Gate confirmed in checkpoint-engine.js generateSalesCheckpoints.
//   R11 SAL-DREQ-007 is conditional: only assembled when PI-05 = true or "Yes".
//       Gate confirmed in checkpoint-engine.js generateSalesCheckpoints.
//   R12 The returned map is always a plain object (createOperationDefinitionsMap shape).
//       Never null, never an array.
//   R13 Non-Sales checkpoint IDs are never added to the returned map.
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

// ---------------------------------------------------------------------------
// Module version — increment on any rule change
// ---------------------------------------------------------------------------

export const SALES_OP_DEFS_VERSION = "1.1.0";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Target model for all Sales Executable checkpoints.
// Confirmed present in governed-odoo-apply-service.js ALLOWED_APPLY_MODELS.
// Only one Sales model is in ALLOWED_APPLY_MODELS (R2).
export const SALES_PRICELIST_MODEL = "product.pricelist";

// Target operation for all Sales Executable checkpoints.
export const SALES_TARGET_OPERATION = "write";

// Sales unconditional Executable checkpoint IDs covered by this assembler.
// SAL-FOUND-001 intentionally excluded (Informational / Not_Applicable — R5).
// SAL-GL-001 intentionally excluded (execution_relevance: None — R6).
// SAL-DREQ-003 added conditionally (SC-02=Yes — R7).
// SAL-DREQ-004 added conditionally (SC-03=Yes — R8).
// SAL-DREQ-005 added conditionally (SC-04="Manager approval" — R9).
// SAL-DREQ-006 added conditionally (FC-06=Yes — R10).
// SAL-DREQ-007 added conditionally (PI-05=Yes — R11).
export const SALES_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.SAL_FOUND_002, // Unconditional, Safe
  CHECKPOINT_IDS.SAL_DREQ_001,  // Unconditional, Conditional
  CHECKPOINT_IDS.SAL_DREQ_002,  // Unconditional, Safe
  // SAL_DREQ_003 added conditionally when SC-02=Yes (R7)
  // SAL_DREQ_004 added conditionally when SC-03=Yes (R8)
  // SAL_DREQ_005 added conditionally when SC-04="Manager approval" (R9)
  // SAL_DREQ_006 added conditionally when FC-06=Yes (R10)
  // SAL_DREQ_007 added conditionally when PI-05=Yes (R11)
]);

// ---------------------------------------------------------------------------
// Main export: assembleSalesOperationDefinitions
// ---------------------------------------------------------------------------

/**
 * Assembles the operation_definitions map for Sales Executable checkpoints.
 *
 * Unconditional definitions returned (keyed by checkpoint_id):
 *   SAL-FOUND-002  Sales module configuration foundation      intended_changes: { currency_id }
 *   SAL-DREQ-001   Quotation-to-order baseline / commercial policy  intended_changes: null
 *   SAL-DREQ-002   Pricing baseline                           intended_changes: null
 *
 * Conditional definitions:
 *   SAL-DREQ-003   Pricelist discount rules                   target_model: product.pricelist  (SC-02=Yes)
 *   SAL-DREQ-004   Quotation template configuration           target_model: product.pricelist  (SC-03=Yes)
 *   SAL-DREQ-005   Manager approval pricing                   target_model: product.pricelist  (SC-04="Manager approval")
 *   SAL-DREQ-006   Invoicing policy linkage                   target_model: product.pricelist  (FC-06=Yes)
 *   SAL-DREQ-007   Dropship/delivery pricing                  target_model: product.pricelist  (PI-05=Yes)
 *
 * Always excluded:
 *   SAL-FOUND-001  Informational (execution_relevance: Informational, safety_class: Not_Applicable) — R5
 *   SAL-GL-001     Non-Executable (execution_relevance: None, safety_class: Not_Applicable) — R6
 *
 * SAL-FOUND-002 emits { currency_id } sourced from target_context.primary_currency.
 * All other checkpoints have null intended_changes — Sales configuration data is not
 * available in target_context or discovery_answers at assembly time (R4).
 *
 * @param {object|null} target_context      — createTargetContext() shape or null
 * @param {object|null} discovery_answers   — createDiscoveryAnswers() shape or null
 * @returns {{ [checkpoint_id: string]: object }} operation_definitions map (never null)
 */
export function assembleSalesOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();

  // Extract truthful currency input — null when unavailable (R4).
  const primaryCurrency = target_context?.primary_currency ?? null;

  // ── SAL-FOUND-001: Intentionally excluded (R5) ───────────────────────────────────────
  // Informational (execution_relevance: Informational, safety_class: Not_Applicable).
  // Gate 6 does not apply to Informational checkpoints.

  // ── SAL-FOUND-002: Sales module configuration foundation (Safe, unconditional) ────────
  // Establishes the sales module foundational pricelist configuration.
  // intended_changes: { currency_id } sourced from target_context.primary_currency.
  // The default pricelist currency must match the company primary currency.
  // Derivation pattern: identical to FND-DREQ-002 (res.company.currency_id).
  // Null when primary_currency is not supplied — honest (R4).
  map[CHECKPOINT_IDS.SAL_FOUND_002] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.SAL_FOUND_002,
    target_model:     SALES_PRICELIST_MODEL,
    target_operation: SALES_TARGET_OPERATION,
    intended_changes: { currency_id: primaryCurrency },
  });

  // ── SAL-DREQ-001: Quotation-to-order baseline / commercial policy (Conditional, unconditional) ──
  // Configures the quotation-to-order workflow and commercial policy on product.pricelist.
  // intended_changes is null — commercial policy data not available at assembly time (R4).
  map[CHECKPOINT_IDS.SAL_DREQ_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.SAL_DREQ_001,
    target_model:     SALES_PRICELIST_MODEL,
    target_operation: SALES_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── SAL-DREQ-002: Pricing baseline (Safe, unconditional) ─────────────────────────────
  // Configures the pricing baseline on product.pricelist.
  // intended_changes is null — pricing data not available at assembly time (R4).
  map[CHECKPOINT_IDS.SAL_DREQ_002] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.SAL_DREQ_002,
    target_model:     SALES_PRICELIST_MODEL,
    target_operation: SALES_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── Conditional definitions ────────────────────────────────────────────────────────────

  const answers = discovery_answers?.answers ?? {};

  // ── SAL-DREQ-003: Pricelist discount rules (Conditional, SC-02=Yes) ──────────────────
  // Configures pricelist discount rules on product.pricelist.
  // Only assembled when SC-02 (discount on sales order lines) is explicitly Yes (R7).
  // Gate confirmed: checkpoint-engine.js generateSalesCheckpoints.
  const sc02 = answers["SC-02"];
  if (sc02 === true || sc02 === "Yes") {
    map[CHECKPOINT_IDS.SAL_DREQ_003] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.SAL_DREQ_003,
      target_model:     SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── SAL-DREQ-004: Quotation template configuration (Conditional, SC-03=Yes) ──────────
  // Configures quotation templates on product.pricelist.
  // Only assembled when SC-03 (quotation templates enabled) is explicitly Yes (R8).
  // Gate confirmed: checkpoint-engine.js generateSalesCheckpoints.
  const sc03 = answers["SC-03"];
  if (sc03 === true || sc03 === "Yes") {
    map[CHECKPOINT_IDS.SAL_DREQ_004] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.SAL_DREQ_004,
      target_model:     SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── SAL-DREQ-005: Manager approval pricing (Conditional, SC-04="Manager approval") ───
  // Configures manager approval pricing workflow on product.pricelist.
  // Only assembled when SC-04 = "Manager approval" (exact string match, NOT boolean — R9).
  // Gate confirmed: checkpoint-engine.js generateSalesCheckpoints.
  const sc04 = answers["SC-04"];
  if (sc04 === "Manager approval") {
    map[CHECKPOINT_IDS.SAL_DREQ_005] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.SAL_DREQ_005,
      target_model:     SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── SAL-DREQ-006: Invoicing policy linkage (Conditional, FC-06=Yes) ──────────────────
  // Configures the invoicing policy linkage on product.pricelist.
  // Only assembled when FC-06 (fiscal position / invoicing policy) is explicitly Yes (R10).
  // Gate confirmed: checkpoint-engine.js generateSalesCheckpoints.
  const fc06 = answers["FC-06"];
  if (fc06 === true || fc06 === "Yes") {
    map[CHECKPOINT_IDS.SAL_DREQ_006] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.SAL_DREQ_006,
      target_model:     SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── SAL-DREQ-007: Dropship/delivery pricing (Conditional, PI-05=Yes) ────────────────
  // Configures dropship and delivery pricing on product.pricelist.
  // Only assembled when PI-05 (dropshipping enabled) is explicitly Yes (R11).
  // Gate confirmed: checkpoint-engine.js generateSalesCheckpoints.
  const pi05 = answers["PI-05"];
  if (pi05 === true || pi05 === "Yes") {
    map[CHECKPOINT_IDS.SAL_DREQ_007] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.SAL_DREQ_007,
      target_model:     SALES_PRICELIST_MODEL,
      target_operation: SALES_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── SAL-GL-001: Intentionally excluded (R6) ──────────────────────────────────────────
  // Non-Executable (execution_relevance: None, safety_class: Not_Applicable).
  // No definition needed or permitted.

  return map;
}
