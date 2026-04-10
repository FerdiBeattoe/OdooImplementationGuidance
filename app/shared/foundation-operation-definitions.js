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
//   R4  intended_changes is sourced exclusively from target_context,
//       discovery_answers, and wizard_captures inputs. No inferred, guessed, or
//       fabricated values. Fields not available in the supplied inputs are null.
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
//   R10 FND-DREQ-001 fiscal year intended_changes sourced from
//       wizard_captures.foundation.fiscal_year_end_month and
//       wizard_captures.foundation.fiscal_year_end_day. Both must be present and
//       valid to produce non-null intended_changes. fiscal_year_end_month must be
//       a string "1".."12"; fiscal_year_end_day must be an integer 1..31.
//       Partial or invalid captures produce null (honest — R4). No fabrication.
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

export const FOUNDATION_OP_DEFS_VERSION = "1.1.0";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Valid fiscalyear_last_month selection values (Odoo 19 res.company confirmed).
// Source: scripts/odoo-confirmed-fields.json — fiscalyear_last_month selection.
const VALID_FISCAL_MONTHS = new Set(["1","2","3","4","5","6","7","8","9","10","11","12"]);

/**
 * Extracts fiscal year end intended_changes from wizard_captures.
 *
 * Returns { fiscalyear_last_month, fiscalyear_last_day } when both are valid,
 * or null when captures are absent, partial, or invalid (R4, R10).
 *
 * @param {object|null} wizard_captures — full wizard_captures map or null
 * @returns {{ fiscalyear_last_month: string, fiscalyear_last_day: number }|null}
 */
function extractFiscalYearChanges(wizard_captures) {
  if (!isPlainObject(wizard_captures)) return null;

  const foundationCapture = wizard_captures.foundation;
  if (!isPlainObject(foundationCapture)) return null;

  const month = foundationCapture.fiscal_year_end_month;
  const day   = foundationCapture.fiscal_year_end_day;

  // Validate month: must be a string in "1".."12" (Odoo selection values — R10).
  if (typeof month !== "string" || !VALID_FISCAL_MONTHS.has(month)) return null;

  // Validate day: must be an integer 1..31 (R10).
  if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > 31) return null;

  return { fiscalyear_last_month: month, fiscalyear_last_day: day };
}

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
 *   FND-DREQ-001   Fiscal year configuration           intended_changes: { fiscalyear_last_month, fiscalyear_last_day }
 *                  when wizard_captures.foundation provides valid fiscal_year_end_month and
 *                  fiscal_year_end_day; null otherwise (honest — R4, R10)
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
 * @param {object|null} wizard_captures     — wizard_captures map from runtime state, or null
 * @returns {{ [checkpoint_id: string]: object }} operation_definitions map (never null)
 */
export function assembleFoundationOperationDefinitions(
  target_context = null,
  discovery_answers = null,
  wizard_captures = null
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
  // Configures the company fiscal year end (fiscalyear_last_month, fiscalyear_last_day)
  // on res.company.
  //
  // Fiscal year end data is collected via wizard capture (wizard_captures.foundation).
  // Fields confirmed from live Odoo 19 instance (scripts/odoo-confirmed-fields.json):
  //   fiscalyear_last_month — selection "1".."12" (required)
  //   fiscalyear_last_day   — integer 1..31
  //
  // intended_changes is non-null only when wizard_captures supplies valid
  // fiscal_year_end_month and fiscal_year_end_day (R4, R10).
  // null when captures are absent, partial, or invalid — honest (R4).
  const fiscalYearChanges = extractFiscalYearChanges(wizard_captures);
  map[CHECKPOINT_IDS.FND_DREQ_001] = createOperationDefinition({
    checkpoint_id:    CHECKPOINT_IDS.FND_DREQ_001,
    target_model:     FOUNDATION_TARGET_MODEL,
    target_operation: FOUNDATION_TARGET_OPERATION,
    intended_changes: fiscalYearChanges,
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
