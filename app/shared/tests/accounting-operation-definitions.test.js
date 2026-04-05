// ---------------------------------------------------------------------------
// Accounting Operation Definitions Tests
// Tests for: app/shared/accounting-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  ACCT-FOUND-001/002 and ACCT-DREQ-001/002/003/004 excluded (DL-018 through DL-023)
//   2.  No unconditional definitions assembled — all reclassified
//   3.  ACCT-FOUND-003 excluded — Blocked safety class, definition withheld
//   4.  ACCT-DREQ-005 assembled only when BM-04 = true
//   5.  ACCT-DREQ-005 assembled only when BM-04 = "Yes"
//   6.  ACCT-DREQ-005 NOT assembled when BM-04 = false
//   7.  ACCT-DREQ-005 NOT assembled when BM-04 absent
//   8.  ACCT-DREQ-006 assembled only when FC-02 = "AVCO"
//   9.  ACCT-DREQ-006 assembled only when FC-02 = "FIFO"
//   10. ACCT-DREQ-006 NOT assembled when FC-02 = "Standard Price"
//   11. ACCT-DREQ-006 NOT assembled when FC-02 absent
//   12. ACCT-DREQ-007 assembled only when FC-02 = "Standard Price"
//   13. ACCT-DREQ-007 NOT assembled when FC-02 = "AVCO"
//   14. ACCT-DREQ-007 NOT assembled when FC-02 = "FIFO"
//   15. ACCT-DREQ-007 NOT assembled when FC-02 absent
//   16. ACCT-DREQ-006 and ACCT-DREQ-007 never both assembled simultaneously
//   17. target_model is correct per conditional checkpoint
//   18. target_operation is "write" for every assembled definition
//   19. intended_changes is null for all definitions — honest missing-input behavior
//   20. Non-ACCT checkpoint IDs not added to the map
//   21. Return is a plain object — never null, never array
//   22. null inputs: no definitions returned (all unconditionals reclassified)
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assembleAccountingOperationDefinitions,
  ACCOUNTING_JOURNAL_MODEL,
  ACCOUNTING_TAX_MODEL,
  ACCOUNTING_ACCOUNT_MODEL,
  ACCOUNTING_TARGET_OPERATION,
  ACCOUNTING_EXECUTABLE_CHECKPOINT_IDS,
  ACCOUNTING_OP_DEFS_VERSION,
} from "../accounting-operation-definitions.js";

import { CHECKPOINT_IDS } from "../checkpoint-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTargetContext(overrides = {}) {
  return {
    odoo_version:               "19",
    edition:                    "enterprise",
    deployment_type:            "on_premise",
    primary_country:            "AU",
    primary_currency:           "AUD",
    multi_company:              false,
    multi_currency:             false,
    odoosh_branch_target:       null,
    odoosh_environment_type:    null,
    connection_mode:            null,
    connection_status:          null,
    connection_target_id:       null,
    connection_capability_note: null,
    ...overrides,
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

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("assembleAccountingOperationDefinitions", () => {

  // ── Test 1: Unconditional definitions assembled ─────────────────────────

  it("1. ACCT-FOUND-001/002 and ACCT-DREQ-001/002/003/004 excluded — reclassified to Informational (DL-018 through DL-023)", () => {
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(defs[CHECKPOINT_IDS.ACCT_FOUND_001], undefined, "ACCT-FOUND-001 must NOT be assembled (DL-018)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_FOUND_002], undefined, "ACCT-FOUND-002 must NOT be assembled (DL-019)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_001],  undefined, "ACCT-DREQ-001 must NOT be assembled (DL-020)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_002],  undefined, "ACCT-DREQ-002 must NOT be assembled (DL-021)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_003],  undefined, "ACCT-DREQ-003 must NOT be assembled (DL-022)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_004],  undefined, "ACCT-DREQ-004 must NOT be assembled (DL-023)");
  });

  // ── Test 2: Keyed by correct checkpoint IDs ─────────────────────────────

  it("2. no unconditional definitions assembled — all reclassified to Informational (DL-018 through DL-023)", () => {
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(Object.keys(defs).length, 0, "0 definitions expected when no conditionals activated");
  });

  // ── Test 3: ACCT-FOUND-003 excluded (Blocked) ───────────────────────────

  it("3. ACCT-FOUND-003 excluded — Blocked safety class, definition intentionally withheld", () => {
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.ACCT_FOUND_003],
      undefined,
      "ACCT-FOUND-003 must NOT have a definition (safety_class: Blocked)"
    );
  });

  // ── Test 4: ACCT-DREQ-005 assembled when BM-04 = true ───────────────────

  it("4. ACCT-DREQ-005 assembled when BM-04 = true", () => {
    const answers = makeDiscoveryAnswers({ "BM-04": true });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.ACCT_DREQ_005], "ACCT-DREQ-005 must be assembled when BM-04=true");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_005].checkpoint_id, CHECKPOINT_IDS.ACCT_DREQ_005);
  });

  // ── Test 5: ACCT-DREQ-005 assembled when BM-04 = "Yes" ──────────────────

  it('5. ACCT-DREQ-005 assembled when BM-04 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "BM-04": "Yes" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.ACCT_DREQ_005], 'ACCT-DREQ-005 must be assembled when BM-04="Yes"');
  });

  // ── Test 6: ACCT-DREQ-005 NOT assembled when BM-04 = false ──────────────

  it("6. ACCT-DREQ-005 NOT assembled when BM-04 = false", () => {
    const answers = makeDiscoveryAnswers({ "BM-04": false });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.ACCT_DREQ_005],
      undefined,
      "ACCT-DREQ-005 must NOT be assembled when BM-04=false"
    );
  });

  // ── Test 7: ACCT-DREQ-005 NOT assembled when BM-04 absent ───────────────

  it("7. ACCT-DREQ-005 NOT assembled when BM-04 is absent", () => {
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.ACCT_DREQ_005],
      undefined,
      "ACCT-DREQ-005 must NOT be assembled when BM-04 is absent"
    );
  });

  // ── Test 8: ACCT-DREQ-006 assembled when FC-02 = "AVCO" ─────────────────

  it('8. ACCT-DREQ-006 assembled when FC-02 = "AVCO"', () => {
    const answers = makeDiscoveryAnswers({ "FC-02": "AVCO" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.ACCT_DREQ_006], 'ACCT-DREQ-006 must be assembled when FC-02="AVCO"');
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_006].checkpoint_id, CHECKPOINT_IDS.ACCT_DREQ_006);
  });

  // ── Test 9: ACCT-DREQ-006 assembled when FC-02 = "FIFO" ─────────────────

  it('9. ACCT-DREQ-006 assembled when FC-02 = "FIFO"', () => {
    const answers = makeDiscoveryAnswers({ "FC-02": "FIFO" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.ACCT_DREQ_006], 'ACCT-DREQ-006 must be assembled when FC-02="FIFO"');
  });

  // ── Test 10: ACCT-DREQ-006 NOT assembled when FC-02 = "Standard Price" ───

  it('10. ACCT-DREQ-006 NOT assembled when FC-02 = "Standard Price"', () => {
    const answers = makeDiscoveryAnswers({ "FC-02": "Standard Price" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.ACCT_DREQ_006],
      undefined,
      'ACCT-DREQ-006 must NOT be assembled when FC-02="Standard Price"'
    );
  });

  // ── Test 11: ACCT-DREQ-006 NOT assembled when FC-02 absent ──────────────

  it("11. ACCT-DREQ-006 NOT assembled when FC-02 is absent", () => {
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.ACCT_DREQ_006],
      undefined,
      "ACCT-DREQ-006 must NOT be assembled when FC-02 is absent"
    );
  });

  // ── Test 12: ACCT-DREQ-007 assembled when FC-02 = "Standard Price" ───────

  it('12. ACCT-DREQ-007 assembled when FC-02 = "Standard Price"', () => {
    const answers = makeDiscoveryAnswers({ "FC-02": "Standard Price" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.ACCT_DREQ_007], 'ACCT-DREQ-007 must be assembled when FC-02="Standard Price"');
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_007].checkpoint_id, CHECKPOINT_IDS.ACCT_DREQ_007);
  });

  // ── Test 13: ACCT-DREQ-007 NOT assembled when FC-02 = "AVCO" ────────────

  it('13. ACCT-DREQ-007 NOT assembled when FC-02 = "AVCO"', () => {
    const answers = makeDiscoveryAnswers({ "FC-02": "AVCO" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.ACCT_DREQ_007],
      undefined,
      'ACCT-DREQ-007 must NOT be assembled when FC-02="AVCO"'
    );
  });

  // ── Test 14: ACCT-DREQ-007 NOT assembled when FC-02 = "FIFO" ────────────

  it('14. ACCT-DREQ-007 NOT assembled when FC-02 = "FIFO"', () => {
    const answers = makeDiscoveryAnswers({ "FC-02": "FIFO" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.ACCT_DREQ_007],
      undefined,
      'ACCT-DREQ-007 must NOT be assembled when FC-02="FIFO"'
    );
  });

  // ── Test 15: ACCT-DREQ-007 NOT assembled when FC-02 absent ──────────────

  it("15. ACCT-DREQ-007 NOT assembled when FC-02 is absent", () => {
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.ACCT_DREQ_007],
      undefined,
      "ACCT-DREQ-007 must NOT be assembled when FC-02 is absent"
    );
  });

  // ── Test 16: ACCT-DREQ-006 and ACCT-DREQ-007 never both assembled ────────

  it("16. ACCT-DREQ-006 and ACCT-DREQ-007 are mutually exclusive — never both present", () => {
    // AVCO: 006 present, 007 absent
    const defsAvco = assembleAccountingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "FC-02": "AVCO" })
    );
    assert.ok(defsAvco[CHECKPOINT_IDS.ACCT_DREQ_006], "ACCT-DREQ-006 present for AVCO");
    assert.equal(defsAvco[CHECKPOINT_IDS.ACCT_DREQ_007], undefined, "ACCT-DREQ-007 absent for AVCO");

    // Standard Price: 007 present, 006 absent
    const defsStd = assembleAccountingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "FC-02": "Standard Price" })
    );
    assert.equal(defsStd[CHECKPOINT_IDS.ACCT_DREQ_006], undefined, "ACCT-DREQ-006 absent for Standard Price");
    assert.ok(defsStd[CHECKPOINT_IDS.ACCT_DREQ_007], "ACCT-DREQ-007 present for Standard Price");
  });

  // ── Test 17: target_model correct per checkpoint ─────────────────────────

  it("17. target_model is correct per conditional checkpoint", () => {
    // AVCO path: ACCT-DREQ-005 (journal) + ACCT-DREQ-006 (account)
    const defsAvco = assembleAccountingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "BM-04": true, "FC-02": "AVCO" })
    );
    assert.equal(defsAvco[CHECKPOINT_IDS.ACCT_DREQ_005].target_model, ACCOUNTING_JOURNAL_MODEL,
      "ACCT-DREQ-005 must target account.journal");
    assert.equal(defsAvco[CHECKPOINT_IDS.ACCT_DREQ_006].target_model, ACCOUNTING_ACCOUNT_MODEL,
      "ACCT-DREQ-006 must target account.account");

    // Standard Price path: ACCT-DREQ-007 (account)
    const defsStd = assembleAccountingOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "FC-02": "Standard Price" })
    );
    assert.equal(defsStd[CHECKPOINT_IDS.ACCT_DREQ_007].target_model, ACCOUNTING_ACCOUNT_MODEL,
      "ACCT-DREQ-007 must target account.account");
  });

  // ── Test 18: target_operation is "write" for every assembled definition ──

  it("18. target_operation is \"write\" for every assembled definition", () => {
    const answers = makeDiscoveryAnswers({ "BM-04": true, "FC-02": "Standard Price" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_operation,
        ACCOUNTING_TARGET_OPERATION,
        `${key} target_operation must be write`
      );
    }
  });

  // ── Test 19: intended_changes is null for all definitions ───────────────

  it("19. intended_changes is null for all assembled definitions — honest missing-input behavior", () => {
    const answers = makeDiscoveryAnswers({ "BM-04": true, "FC-02": "FIFO" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].intended_changes,
        null,
        `${key} intended_changes must be null (accounting data not available at assembly time)`
      );
    }
  });

  // ── Test 20: Non-ACCT checkpoint IDs not added ───────────────────────────

  it("20. non-ACCT checkpoint IDs are not in the assembled map", () => {
    const answers = makeDiscoveryAnswers({ "BM-04": true, "FC-02": "AVCO" });
    const defs = assembleAccountingOperationDefinitions(makeTargetContext(), answers);
    const keys = Object.keys(defs);
    for (const key of keys) {
      assert.ok(
        key.startsWith("ACCT-"),
        `Unexpected non-ACCT key in map: ${key}`
      );
    }
  });

  // ── Test 21: Return is a plain object ────────────────────────────────────

  it("21. return is a plain object — never null, never array", () => {
    const defs = assembleAccountingOperationDefinitions(null, null);
    assert.ok(defs !== null, "result must not be null");
    assert.ok(!Array.isArray(defs), "result must not be an array");
    assert.equal(typeof defs, "object");
  });

  // ── Test 22: null inputs: only unconditionals returned ───────────────────

  it("22. null target_context and null discovery_answers: no definitions returned (all unconditionals reclassified)", () => {
    const defs = assembleAccountingOperationDefinitions(null, null);
    assert.equal(defs[CHECKPOINT_IDS.ACCT_FOUND_001], undefined, "ACCT-FOUND-001 must NOT be present (DL-018)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_FOUND_002], undefined, "ACCT-FOUND-002 must NOT be present (DL-019)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_001],  undefined, "ACCT-DREQ-001 must NOT be present (DL-020)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_002],  undefined, "ACCT-DREQ-002 must NOT be present (DL-021)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_003],  undefined, "ACCT-DREQ-003 must NOT be present (DL-022)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_004],  undefined, "ACCT-DREQ-004 must NOT be present (DL-023)");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_005], undefined, "ACCT-DREQ-005 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_006], undefined, "ACCT-DREQ-006 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.ACCT_DREQ_007], undefined, "ACCT-DREQ-007 must be absent");
    assert.equal(Object.keys(defs).length, 0, "0 definitions with null inputs — all unconditionals reclassified");
  });

});
