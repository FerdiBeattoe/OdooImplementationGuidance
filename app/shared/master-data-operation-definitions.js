// ---------------------------------------------------------------------------
// Master Data Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Master Data domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Master Data previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (product.category, res.partner.category,
//     and uom.category are in ALLOWED_APPLY_MODELS)
//   - governed-odoo-apply-service.js S12 (target_model must match preview at apply)
//
// Hard rules:
//   R1  Only Master Data domain checkpoints are assembled here. Never other domains.
//   R2  target_model is "product.category" or "res.partner.category"
//       per checkpoint purpose. See per-checkpoint comments for exact assignment.
//   R3  target_operation is always "write" — no create, unlink, or other operations.
//   R4  intended_changes is null for all checkpoints — Master Data category scaffolding
//       data (category lists, hierarchies, UOM structures) is not available in
//       target_context or discovery_answers at assembly time. Null is honest (no fabrication).
//   R5  MAS-FOUND-001 and MAS-FOUND-002 are intentionally excluded — both are
//       validation_source: User_Confirmed and are closed via the confirm route only.
//       Gate 6 does not apply to their confirm-route path.
//   R6  MAS-DREQ-004 is intentionally excluded — Informational (safety_class: Not_Applicable).
//       Gate 6 does not apply to Informational checkpoints.
//   R7  MAS-DREQ-005 is conditional: only assembled when discovery_answers
//       contains OP-01 = true or "Yes". Gate ID OP-01 confirmed in
//       checkpoint-engine.js generateMasterDataCheckpoints.
//   R8  MAS-DREQ-006 is conditional: only assembled when discovery_answers
//       contains MF-01 = true or "Yes". Gate ID MF-01 confirmed in
//       checkpoint-engine.js generateMasterDataCheckpoints.
//   R9  MAS-DREQ-007 is conditional: only assembled when discovery_answers
//       contains PI-04 answered and != "None". Gate ID PI-04 confirmed in
//       checkpoint-engine.js generateMasterDataCheckpoints.
//   R10 The returned map is always a plain object (createOperationDefinitionsMap shape).
//       Never null, never an array.
//   R11 Non-Master Data checkpoint IDs are never added to the returned map.
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

// ---------------------------------------------------------------------------
// Module version — increment on any rule change
// ---------------------------------------------------------------------------

export const MASTER_DATA_OP_DEFS_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Target models for Master Data Executable checkpoints.
// All confirmed present in governed-odoo-apply-service.js ALLOWED_APPLY_MODELS.
export const MASTER_DATA_CATEGORY_MODEL         = "product.category";
export const MASTER_DATA_PARTNER_CATEGORY_MODEL = "res.partner.category";
export const MASTER_DATA_UOM_CATEGORY_MODEL     = "uom.category";

// Target operation for all Master Data Executable checkpoints.
export const MASTER_DATA_TARGET_OPERATION = "write";

// Master Data Executable checkpoint IDs covered by this assembler.
// MAS-FOUND-001 and MAS-FOUND-002 intentionally excluded (User_Confirmed confirm route — R5).
// MAS-DREQ-001 intentionally excluded — readiness-verification checkpoint reclassified to
//   Informational / User_Confirmed / Not_Applicable. No truthful governed write target exists
//   for product category readiness on test236 (data is genuinely flat). Confirm route only.
//   This is a bounded semantic correction specific to MAS-DREQ-001 (see DL-013).
// MAS-DREQ-002 intentionally excluded — readiness-verification checkpoint reclassified to
//   Informational / User_Confirmed / Not_Applicable. No truthful governed write target exists
//   for partner category readiness. Confirm route only. Bounded semantic correction (DL-014).
// MAS-DREQ-003 intentionally excluded — readiness-verification checkpoint reclassified to
//   Informational / User_Confirmed / Not_Applicable. No truthful governed write target exists
//   for customer record readiness (uom.category target was semantically invalid). Confirm
//   route only. Bounded semantic correction specific to MAS-DREQ-003 (see DL-015).
// MAS-DREQ-004 intentionally excluded (Informational / Not_Applicable — R6).
// MAS-DREQ-005 added conditionally when OP-01=Yes (R7).
// MAS-DREQ-006 added conditionally when MF-01=Yes (R8).
// MAS-DREQ-007 added conditionally when PI-04 != None (R9).
export const MASTER_DATA_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  // No unconditional entries — all unconditional Master Data checkpoints (MAS-DREQ-001/002/003)
  // are readiness-verification checkpoints reclassified to Informational (DL-013/014/015).
  // MAS_DREQ_005 added conditionally when OP-01=Yes (R7)
  // MAS_DREQ_006 added conditionally when MF-01=Yes (R8)
  // MAS_DREQ_007 added conditionally when PI-04 != None (R9)
]);

// ---------------------------------------------------------------------------
// Main export: assembleMasterDataOperationDefinitions
// ---------------------------------------------------------------------------

/**
 * Assembles the operation_definitions map for Master Data Executable checkpoints.
 *
 * No unconditional definitions remain — all unconditional Master Data checkpoints
 * (MAS-DREQ-001, MAS-DREQ-002, MAS-DREQ-003) are readiness-verification checkpoints
 * reclassified to Informational / User_Confirmed / Not_Applicable (DL-013/014/015).
 *
 * Conditional definition (added only when OP-01 = true or "Yes"):
 *   MAS-DREQ-005   Operations product category extension   target_model: product.category
 *
 * Conditional definition (added only when MF-01 = true or "Yes"):
 *   MAS-DREQ-006   Manufacturing product category config   target_model: product.category
 *
 * Conditional definition (added only when PI-04 is answered and != "None"):
 *   MAS-DREQ-007   Industry partner category scaffolding   target_model: res.partner.category
 *
 * Always excluded:
 *   MAS-FOUND-001  User_Confirmed confirm route only — Gate 6 does not apply (R5)
 *   MAS-FOUND-002  User_Confirmed confirm route only — Gate 6 does not apply (R5)
 *   MAS-DREQ-001   Informational / User_Confirmed / Not_Applicable — readiness-verification,
 *                   no truthful governed write target exists (DL-013)
 *   MAS-DREQ-002   Informational / User_Confirmed / Not_Applicable — readiness-verification,
 *                   no truthful governed write target exists (DL-014)
 *   MAS-DREQ-003   Informational / User_Confirmed / Not_Applicable — readiness-verification,
 *                   uom.category target was semantically invalid for customer-record readiness (DL-015)
 *   MAS-DREQ-004   Informational (safety_class: Not_Applicable) — no definition needed (R6)
 *
 * intended_changes is null for all entries — Master Data category scaffolding data is not
 * available in target_context or discovery_answers at assembly time (R4).
 *
 * @param {object|null} target_context      — createTargetContext() shape or null
 * @param {object|null} discovery_answers   — createDiscoveryAnswers() shape or null
 * @returns {{ [checkpoint_id: string]: object }} operation_definitions map (never null)
 */
export function assembleMasterDataOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  const map = createOperationDefinitionsMap();

  // ── MAS-DREQ-001: EXCLUDED — readiness-verification checkpoint ──
  // MAS-DREQ-001 ("Product Records Ready for Downstream Use") is Informational /
  // User_Confirmed / Not_Applicable. No governed operation definition is appropriate.
  // Readiness is verified through bounded inspection evidence and operator confirmation.
  // This is a bounded semantic correction specific to MAS-DREQ-001 (see DL-013).

  // ── MAS-DREQ-002: EXCLUDED — readiness-verification checkpoint ──
  // MAS-DREQ-002 ("Partner/Contact Category Scaffolding") is Informational /
  // User_Confirmed / Not_Applicable. No governed operation definition is appropriate.
  // Partner category baseline is verified through bounded inspection evidence and
  // operator confirmation. No discovery question supplies partner category data for
  // a truthful write. This is a bounded semantic correction specific to MAS-DREQ-002
  // (see DL-014). Does not apply to MAS-DREQ-003 without independent review.

  // ── MAS-DREQ-003: EXCLUDED — readiness-verification checkpoint ──
  // MAS-DREQ-003 ("Customer Records Ready for Downstream Use") is Informational /
  // User_Confirmed / Not_Applicable. No governed operation definition is appropriate.
  // The prior assignment to uom.category had no semantic connection to customer record
  // readiness. Readiness is verified through bounded inspection evidence and operator
  // confirmation. This is a bounded semantic correction specific to MAS-DREQ-003 (see DL-015).
  // Does not apply to any other checkpoint without independent review.

  const answers = discovery_answers?.answers ?? {};

  // ── MAS-DREQ-005: Operations product category extension (Conditional, OP-01=Yes) ──
  // Extends product categories for operations-specific structure in product.category.
  // Only assembled when OP-01 (operations module required) is explicitly Yes (R7).
  // Gate ID OP-01 confirmed in checkpoint-engine.js generateMasterDataCheckpoints.
  const op01 = answers["OP-01"];
  if (op01 === true || op01 === "Yes") {
    map[CHECKPOINT_IDS.MAS_DREQ_005] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.MAS_DREQ_005,
      target_model:     MASTER_DATA_CATEGORY_MODEL,
      target_operation: MASTER_DATA_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── MAS-DREQ-006: Manufacturing product category config (Conditional, MF-01=Yes) ──
  // Configures manufacturing-specific product categories in product.category.
  // Only assembled when MF-01 (manufacturing required) is explicitly Yes (R8).
  // Gate ID MF-01 confirmed in checkpoint-engine.js generateMasterDataCheckpoints.
  const mf01 = answers["MF-01"];
  if (mf01 === true || mf01 === "Yes") {
    map[CHECKPOINT_IDS.MAS_DREQ_006] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.MAS_DREQ_006,
      target_model:     MASTER_DATA_CATEGORY_MODEL,
      target_operation: MASTER_DATA_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  // ── MAS-DREQ-007: Industry partner category scaffolding (Conditional, PI-04 != None) ──
  // Scaffolds industry-specific partner categories in res.partner.category.
  // Only assembled when PI-04 (industry categorization) is answered and not "None" (R9).
  // Gate ID PI-04 confirmed in checkpoint-engine.js generateMasterDataCheckpoints.
  const pi04 = answers["PI-04"];
  if (pi04 !== undefined && pi04 !== null && pi04 !== "None") {
    map[CHECKPOINT_IDS.MAS_DREQ_007] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.MAS_DREQ_007,
      target_model:     MASTER_DATA_PARTNER_CATEGORY_MODEL,
      target_operation: MASTER_DATA_TARGET_OPERATION,
      intended_changes: null,
    });
  }

  return map;
}
