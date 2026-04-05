// ---------------------------------------------------------------------------
// Foundation Operation Definitions Tests
// Tests for: app/shared/foundation-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional Foundation definitions assembled (FND-FOUND-001/002, FND-DREQ-001/002)
//   2.  Definitions keyed by correct Foundation checkpoint IDs
//   3.  FND-FOUND-003 excluded — Blocked safety class, definition withheld
//   4.  FND-DREQ-003 assembled only when BM-04 = true
//   5.  FND-DREQ-003 assembled only when BM-04 = "Yes"
//   6.  FND-DREQ-003 NOT assembled when BM-04 = false
//   7.  FND-DREQ-003 NOT assembled when BM-04 absent
//   8.  target_model is "res.company" for every assembled definition
//   9.  target_operation is "write" for every assembled definition
//   10. intended_changes sourced from target_context.primary_country (FND-FOUND-001)
//   11. intended_changes sourced from target_context.primary_country (FND-FOUND-002)
//   12. intended_changes is null for FND-DREQ-001 (fiscal year data not in target_context)
//   13. intended_changes sourced from target_context.primary_currency (FND-DREQ-002)
//   14. null target_context produces honest null intended_changes
//   15. Non-Foundation checkpoint IDs not added to the map
//   16. Return is a plain object (never null, never array)
//   17. Preview generation for Foundation Executable checkpoints unblocked by supplied defs
//   18. Non-Foundation checkpoints unaffected when Foundation defs supplied
//   19. Missing Foundation inputs handled honestly — no fabrication
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assembleFoundationOperationDefinitions,
  FOUNDATION_TARGET_MODEL,
  FOUNDATION_TARGET_OPERATION,
  FOUNDATION_EXECUTABLE_CHECKPOINT_IDS,
  FOUNDATION_OP_DEFS_VERSION,
} from "../foundation-operation-definitions.js";

import { CHECKPOINT_IDS } from "../checkpoint-engine.js";
import { computePreviews } from "../governed-preview-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTargetContext({
  primary_country  = "AU",
  primary_currency = "AUD",
  deployment_type  = "on_premise",
  edition          = "enterprise",
} = {}) {
  return {
    odoo_version:              "19",
    edition,
    deployment_type,
    primary_country,
    primary_currency,
    multi_company:             false,
    multi_currency:            false,
    odoosh_branch_target:      null,
    odoosh_environment_type:   null,
    connection_mode:           null,
    connection_status:         null,
    connection_target_id:      null,
    connection_capability_note: null,
  };
}

function makeDiscoveryAnswers(overrides = {}) {
  return {
    answers: { ...overrides },
    answered_at: {},
    conditional_questions_skipped: [],
    framework_version: "1.0",
    confirmed_by: null,
    confirmed_at: null,
  };
}

/**
 * Builds a minimal Foundation Executable checkpoint record for preview integration tests.
 */
function makeFoundationCheckpoint(checkpoint_id, safety_class = "Safe") {
  return {
    checkpoint_id,
    domain: "foundation",
    checkpoint_class: "Foundational",
    validation_source: "Both",
    status: "Not_Started",
    execution_relevance: "Executable",
    safety_class,
    dependencies: [],
    preview_required: true,
    downstream_impact_summary: null,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("assembleFoundationOperationDefinitions", () => {

  // ── Test 1: Unconditional definitions assembled ─────────────────────────

  it("1. assembles unconditional Foundation definitions (FND-FOUND-001/002, FND-DREQ-001/002)", () => {
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.ok(defs[CHECKPOINT_IDS.FND_FOUND_001], "FND-FOUND-001 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.FND_FOUND_002], "FND-FOUND-002 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.FND_DREQ_001],  "FND-DREQ-001 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.FND_DREQ_002],  "FND-DREQ-002 must be assembled");
  });

  // ── Test 2: Keyed by correct checkpoint IDs ─────────────────────────────

  it("2. definitions keyed by exact Foundation checkpoint IDs", () => {
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.FND_FOUND_001].checkpoint_id,
      CHECKPOINT_IDS.FND_FOUND_001
    );
    assert.equal(
      defs[CHECKPOINT_IDS.FND_DREQ_002].checkpoint_id,
      CHECKPOINT_IDS.FND_DREQ_002
    );
  });

  // ── Test 3: FND-FOUND-003 excluded (Blocked) ────────────────────────────

  it("3. FND-FOUND-003 excluded — Blocked safety class, definition intentionally withheld", () => {
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.FND_FOUND_003],
      undefined,
      "FND-FOUND-003 must NOT have a definition (safety_class: Blocked)"
    );
  });

  // ── Test 4: FND-DREQ-003 assembled when BM-04 = true ───────────────────

  it("4. FND-DREQ-003 assembled when BM-04 = true", () => {
    const answers = makeDiscoveryAnswers({ "BM-04": true });
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.FND_DREQ_003], "FND-DREQ-003 must be assembled when BM-04=true");
    assert.equal(defs[CHECKPOINT_IDS.FND_DREQ_003].checkpoint_id, CHECKPOINT_IDS.FND_DREQ_003);
  });

  // ── Test 5: FND-DREQ-003 assembled when BM-04 = "Yes" ───────────────────

  it('5. FND-DREQ-003 assembled when BM-04 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "BM-04": "Yes" });
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.FND_DREQ_003], 'FND-DREQ-003 must be assembled when BM-04="Yes"');
  });

  // ── Test 6: FND-DREQ-003 NOT assembled when BM-04 = false ───────────────

  it("6. FND-DREQ-003 NOT assembled when BM-04 = false", () => {
    const answers = makeDiscoveryAnswers({ "BM-04": false });
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.FND_DREQ_003],
      undefined,
      "FND-DREQ-003 must NOT be assembled when BM-04=false"
    );
  });

  // ── Test 7: FND-DREQ-003 NOT assembled when BM-04 absent ────────────────

  it("7. FND-DREQ-003 NOT assembled when BM-04 is absent", () => {
    const answers = makeDiscoveryAnswers({});
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.FND_DREQ_003],
      undefined,
      "FND-DREQ-003 must NOT be assembled when BM-04 is absent"
    );
  });

  // ── Test 8: target_model is "res.company" ───────────────────────────────

  it("8. target_model is \"res.company\" for every assembled definition", () => {
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({ "BM-04": true }));
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_model,
        FOUNDATION_TARGET_MODEL,
        `${key} target_model must be res.company`
      );
    }
  });

  // ── Test 9: target_operation is "write" ─────────────────────────────────

  it("9. target_operation is \"write\" for every assembled definition", () => {
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers({ "BM-04": true }));
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_operation,
        FOUNDATION_TARGET_OPERATION,
        `${key} target_operation must be write`
      );
    }
  });

  // ── Test 10: intended_changes.country_id from primary_country (FND-FOUND-001) ─

  it("10. FND-FOUND-001 intended_changes.country_id sourced from target_context.primary_country", () => {
    const defs = assembleFoundationOperationDefinitions(
      makeTargetContext({ primary_country: "GB" }),
      makeDiscoveryAnswers()
    );
    assert.deepEqual(
      defs[CHECKPOINT_IDS.FND_FOUND_001].intended_changes,
      { country_id: "GB" }
    );
  });

  // ── Test 11: intended_changes.country_id from primary_country (FND-FOUND-002) ─

  it("11. FND-FOUND-002 intended_changes.country_id sourced from target_context.primary_country", () => {
    const defs = assembleFoundationOperationDefinitions(
      makeTargetContext({ primary_country: "US" }),
      makeDiscoveryAnswers()
    );
    assert.deepEqual(
      defs[CHECKPOINT_IDS.FND_FOUND_002].intended_changes,
      { country_id: "US" }
    );
  });

  // ── Test 12: intended_changes is null for FND-DREQ-001 ──────────────────

  it("12. FND-DREQ-001 intended_changes is null — fiscal year data not in target_context", () => {
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.FND_DREQ_001].intended_changes,
      null,
      "FND-DREQ-001 intended_changes must be null (fiscal year data unavailable)"
    );
  });

  // ── Test 13: intended_changes.currency_id from primary_currency (FND-DREQ-002) ─

  it("13. FND-DREQ-002 intended_changes.currency_id sourced from target_context.primary_currency", () => {
    const defs = assembleFoundationOperationDefinitions(
      makeTargetContext({ primary_currency: "EUR" }),
      makeDiscoveryAnswers()
    );
    assert.deepEqual(
      defs[CHECKPOINT_IDS.FND_DREQ_002].intended_changes,
      { currency_id: "EUR" }
    );
  });

  // ── Test 14: null target_context yields honest null intended_changes ─────

  it("14. null target_context produces honest null country_id and currency_id", () => {
    const defs = assembleFoundationOperationDefinitions(null, makeDiscoveryAnswers());
    assert.deepEqual(
      defs[CHECKPOINT_IDS.FND_FOUND_001].intended_changes,
      { country_id: null },
      "FND-FOUND-001 country_id must be null when target_context is null"
    );
    assert.deepEqual(
      defs[CHECKPOINT_IDS.FND_DREQ_002].intended_changes,
      { currency_id: null },
      "FND-DREQ-002 currency_id must be null when target_context is null"
    );
    // FND-DREQ-001 is always null regardless
    assert.equal(defs[CHECKPOINT_IDS.FND_DREQ_001].intended_changes, null);
  });

  // ── Test 15: Non-Foundation checkpoint IDs not added ────────────────────

  it("15. non-Foundation checkpoint IDs are not in the assembled map", () => {
    const defs = assembleFoundationOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    const keys = Object.keys(defs);
    for (const key of keys) {
      assert.ok(
        key.startsWith("FND-"),
        `Unexpected non-Foundation key in map: ${key}`
      );
    }
  });

  // ── Test 16: Return is a plain object ───────────────────────────────────

  it("16. return is a plain object — never null, never array", () => {
    const defs = assembleFoundationOperationDefinitions(null, null);
    assert.ok(defs !== null, "result must not be null");
    assert.ok(!Array.isArray(defs), "result must not be an array");
    assert.equal(typeof defs, "object");
  });

  // ── Test 17: Preview generation unblocked for Foundation Executables ─────
  //
  // Integration test: supply Foundation operation definitions to computePreviews
  // and verify that Foundation Executable checkpoints produce preview records
  // (Gate 6 no longer blocks them).

  it("17. preview generation for Foundation Executable checkpoints unblocked when definitions supplied", () => {
    const tc = makeTargetContext({ deployment_type: "on_premise" });
    const da = makeDiscoveryAnswers();
    const defs = assembleFoundationOperationDefinitions(tc, da);

    // Build checkpoints for the unconditional Foundation Executables
    const checkpoints = [
      makeFoundationCheckpoint(CHECKPOINT_IDS.FND_FOUND_001, "Safe"),
      makeFoundationCheckpoint(CHECKPOINT_IDS.FND_FOUND_002, "Conditional"),
      makeFoundationCheckpoint(CHECKPOINT_IDS.FND_DREQ_001,  "Safe"),
      makeFoundationCheckpoint(CHECKPOINT_IDS.FND_DREQ_002,  "Safe"),
    ];

    const output = computePreviews(
      checkpoints,
      null,           // validated_checkpoints
      null,           // blockers
      null,           // project_state
      tc,             // target_context (required for Executable Gate 3)
      null,           // connection_state
      defs            // operation_definitions — Foundation definitions supplied
    );

    assert.equal(
      output.previews.length,
      4,
      "All 4 unconditional Foundation Executable checkpoints must produce preview records"
    );

    // Verify each preview carries correct target_model and target_operation
    for (const preview of output.previews) {
      assert.equal(preview.target_model, FOUNDATION_TARGET_MODEL,
        `preview.target_model must be ${FOUNDATION_TARGET_MODEL}`);
      assert.equal(preview.target_operation, FOUNDATION_TARGET_OPERATION,
        `preview.target_operation must be ${FOUNDATION_TARGET_OPERATION}`);
      assert.ok(preview.preview_id, "preview_id must be present");
      assert.equal(preview.execution_approval_implied, false,
        "execution_approval_implied must be false");
    }
  });

  // ── Test 18: Non-Foundation checkpoints unaffected ──────────────────────

  it("18. non-Foundation checkpoints unaffected when Foundation definitions supplied", () => {
    const tc = makeTargetContext({ deployment_type: "on_premise" });
    const da = makeDiscoveryAnswers();
    const defs = assembleFoundationOperationDefinitions(tc, da);

    // Mix Foundation + non-Foundation checkpoints
    const nonFoundationCheckpoint = {
      checkpoint_id:    "ACCT-FOUND-001",
      domain:           "accounting",
      checkpoint_class: "Foundational",
      validation_source: "Both",
      status:           "Not_Started",
      execution_relevance: "Executable",
      safety_class:     "Safe",
      dependencies:     [],
      preview_required: true,
      downstream_impact_summary: null,
    };

    const checkpoints = [
      makeFoundationCheckpoint(CHECKPOINT_IDS.FND_FOUND_001, "Safe"),
      nonFoundationCheckpoint,
    ];

    const output = computePreviews(
      checkpoints,
      null, null, null, tc, null,
      defs
    );

    // Foundation checkpoint previews — present
    const foundationPreviews = output.previews.filter(p => p.checkpoint_id === CHECKPOINT_IDS.FND_FOUND_001);
    assert.equal(foundationPreviews.length, 1, "Foundation checkpoint must produce a preview");

    // Non-Foundation checkpoint — no definition supplied → Gate 6 blocks it
    const nonFoundationPreviews = output.previews.filter(p => p.checkpoint_id === "ACCT-FOUND-001");
    assert.equal(nonFoundationPreviews.length, 0,
      "Non-Foundation checkpoint without a definition must be blocked by Gate 6"
    );
  });

  // ── Test 19: Missing inputs handled honestly, no fabrication ────────────

  it("19. missing Foundation inputs produce null intended_changes — no fabrication", () => {
    // Both target_context and discovery_answers absent
    const defs = assembleFoundationOperationDefinitions(null, null);

    // country-based fields must be null (not a fabricated country string)
    assert.equal(
      defs[CHECKPOINT_IDS.FND_FOUND_001].intended_changes?.country_id,
      null,
      "country_id must be null when primary_country is unavailable"
    );
    assert.equal(
      defs[CHECKPOINT_IDS.FND_FOUND_002].intended_changes?.country_id,
      null,
      "country_id must be null when primary_country is unavailable"
    );

    // currency-based fields must be null
    assert.equal(
      defs[CHECKPOINT_IDS.FND_DREQ_002].intended_changes?.currency_id,
      null,
      "currency_id must be null when primary_currency is unavailable"
    );

    // FND-DREQ-003 must NOT be assembled (no discovery_answers, BM-04 absent)
    assert.equal(
      defs[CHECKPOINT_IDS.FND_DREQ_003],
      undefined,
      "FND-DREQ-003 must not be assembled when BM-04 is absent"
    );
  });

});
