// ---------------------------------------------------------------------------
// Foundation Operation Definitions — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Assembles caller-supplied operation definitions for Foundation domain
//   Executable checkpoints. Provides the operation_definitions map consumed by
//   governed-preview-engine.js Gate 6, unblocking Foundation previews.
//
// Governing constraints:
//   - specs/runtime_state_contract.md §1 (operation_definition shape)
//   - governed-preview-engine.js R15 / Gate 6 (Executable checkpoints require
//     a matching operation_definition keyed by checkpoint_id)
//   - governed-odoo-apply-service.js S4 (res.company is in ALLOWED_APPLY_MODELS)
//   - governed-odoo-apply-service.js S12 (target_model must match preview at apply)
//
// Hard rules:
//   R1  Only Foundation domain checkpoints are assembled here. Never other domains.
//   R2  target_model is always "res.company" for Foundation Executable checkpoints.
//   R3  target_operation is always "write" — no create, unlink, or other operations.
//   R4  intended_changes is sourced exclusively from target_context and
//       discovery_answers inputs. No inferred, guessed, or fabricated values.
//       Fields not available in the supplied inputs are represented as null.
//   R5  FND-FOUND-003 (Informational / User_Confirmed / Not_Applicable after DL-016)
//       NEVER receives an operation definition. No governed write is appropriate —
//       FND-DREQ-002 completed the actual currency write; FND-FOUND-003 evidence
//       requirements are user confirmations only. Confirm route completes it.
//   R6  FND-DREQ-003 is conditional: only assembled when discovery_answers
//       contains BM-04 = true or "Yes". Absent or false answer → not assembled.
//   R7  When target_context is null, country_id and currency_id in
//       intended_changes are null. This is honest — data is unavailable.
//   R8  The returned map is always a plain object (createOperationDefinitionsMap
//       shape). Never null, never an array.
//   R9  Non-Foundation checkpoint IDs are never added to the returned map.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `foundation-operation-definitions: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
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

export const FOUNDATION_OP_DEFS_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Target model for all Foundation Executable checkpoints.
// Confirmed present in governed-odoo-apply-service.js ALLOWED_APPLY_MODELS.
export const FOUNDATION_TARGET_MODEL = "res.company";

// Target operation for all Foundation Executable checkpoints.
export const FOUNDATION_TARGET_OPERATION = "write";

// Foundation Executable checkpoint IDs covered by this assembler.
// FND-FOUND-003 is intentionally excluded (Informational/User_Confirmed/Not_Applicable after DL-016 — R5).
export const FOUNDATION_EXECUTABLE_CHECKPOINT_IDS = Object.freeze([
  CHECKPOINT_IDS.FND_FOUND_001, // Unconditional, Safe
  CHECKPOINT_IDS.FND_FOUND_002, // Unconditional, Conditional
  CHECKPOINT_IDS.FND_DREQ_001,  // Unconditional, Safe
  CHECKPOINT_IDS.FND_DREQ_002,  // Unconditional, Safe
  // FND_DREQ_003 added conditionally when BM-04=Yes (R6)
]);

// ---------------------------------------------------------------------------
// Main export: assembleFoundationOperationDefinitions
// ---------------------------------------------------------------------------

/**
 * Assembles the operation_definitions map for Foundation Executable checkpoints.
 *
 * Unconditional definitions returned (keyed by checkpoint_id):
 *   FND-FOUND-001  Company country configuration      intended_changes: { country_id }
 *   FND-FOUND-002  Localization configuration          intended_changes: { country_id }
 *   FND-DREQ-001   Fiscal year configuration           intended_changes: null (data unavailable)
 *   FND-DREQ-002   Currency configuration              intended_changes: { currency_id }
 *
 * Conditional definition (added only when BM-04 = true or "Yes"):
 *   FND-DREQ-003   Multi-currency activation           intended_changes: { currency_id }
 *
 * Always excluded (R5):
 *   FND-FOUND-003  Informational / User_Confirmed / Not_Applicable (DL-016) — no operation definition appropriate;
 *                  FND-DREQ-002 completed the actual currency write; confirm route only
 *
 * @param {object|null} target_context      — createTargetContext() shape or null
 * @param {object|null} discovery_answers   — createDiscoveryAnswers() shape or null
 * @returns {{ [checkpoint_id: string]: object }} operation_definitions map (never null)
 */
export function assembleFoundationOperationDefinitions(
  target_context = null,
  discovery_answers = null
) {
  // Extract truthful inputs — null where unavailable (R4, R7).
  const primaryCountry  = target_context?.primary_country  ?? null;
  const primaryCurrency = target_context?.primary_currency ?? null;

  const map = createOperationDefinitionsMap();

  // ── FND-FOUND-001: Company country configuration (Safe, unconditional) ──────
  // Writes the primary operating country onto the company record.
  // Intended change: country_id sourced from target_context.primary_country.
  // null when primary_country is not yet supplied — honest (R4, R7).
  map[CHECKPOINT_IDS.FND_FOUND_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.FND_FOUND_001,
    target_model:     FOUNDATION_TARGET_MODEL,
    target_operation: FOUNDATION_TARGET_OPERATION,
    intended_changes: { country_id: primaryCountry },
  });

  // ── FND-FOUND-002: Localization configuration (Conditional, unconditional) ───
  // Applies the country-appropriate localization package (chart of accounts,
  // tax baseline, fiscal position) to the company.
  // Intended change: country_id drives localization package selection in Odoo 19.
  // null when primary_country is not yet supplied — honest (R4, R7).
  map[CHECKPOINT_IDS.FND_FOUND_002] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.FND_FOUND_002,
    target_model:     FOUNDATION_TARGET_MODEL,
    target_operation: FOUNDATION_TARGET_OPERATION,
    intended_changes: { country_id: primaryCountry },
  });

  // ── FND-FOUND-003: Intentionally excluded (R5, DL-016) ──────────────────────
  // Informational / User_Confirmed / Not_Applicable after DL-016. No governed write
  // is appropriate. FND-DREQ-002 completed the actual currency write. Completion
  // is through confirm route only. Gate 6 does not need to block it by omission
  // because execution_relevance is now Informational — but no definition is provided.

  // ── FND-DREQ-001: Fiscal year configuration (Safe, unconditional) ────────────
  // Configures the company fiscal year (start/end dates, reporting calendar).
  // Fiscal year dates are not available in target_context or discovery_answers
  // at this stage — intended_changes is null (honest missing-input behavior, R4).
  map[CHECKPOINT_IDS.FND_DREQ_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.FND_DREQ_001,
    target_model:     FOUNDATION_TARGET_MODEL,
    target_operation: FOUNDATION_TARGET_OPERATION,
    intended_changes: null,
  });

  // ── FND-DREQ-002: Currency configuration (Safe, unconditional) ───────────────
  // Sets the primary operating currency on the company record.
  // Intended change: currency_id sourced from target_context.primary_currency.
  // null when primary_currency is not yet supplied — honest (R4, R7).
  map[CHECKPOINT_IDS.FND_DREQ_002] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.FND_DREQ_002,
    target_model:     FOUNDATION_TARGET_MODEL,
    target_operation: FOUNDATION_TARGET_OPERATION,
    intended_changes: { currency_id: primaryCurrency },
  });

  // ── FND-DREQ-003: Multi-currency activation (Conditional, BM-04=Yes) ─────────
  // Activates Odoo 19 multi-currency accounting on the company.
  // Only assembled when BM-04 (multi-currency operations) is explicitly Yes (R6).
  const answers = discovery_answers?.answers ?? {};
  const bm04    = answers["BM-04"];
  if (bm04 === true || bm04 === "Yes") {
    map[CHECKPOINT_IDS.FND_DREQ_003] = createOperationDefinition({
      checkpoint_id:    CHECKPOINT_IDS.FND_DREQ_003,
      target_model:     FOUNDATION_TARGET_MODEL,
      target_operation: FOUNDATION_TARGET_OPERATION,
      intended_changes: { currency_id: primaryCurrency },
    });
  }

  return map;
}
