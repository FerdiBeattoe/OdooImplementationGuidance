// ---------------------------------------------------------------------------
// Sales Operation Definitions Tests
// Tests for: app/shared/sales-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional SAL definitions assembled (FOUND-002, DREQ-001, DREQ-002)
//   2.  Definitions keyed by correct SAL checkpoint IDs
//   3.  SAL-FOUND-001 excluded — Informational, execution_relevance: Informational
//   4.  SAL-GL-001 excluded — execution_relevance: None
//   5.  SAL-DREQ-003 assembled when SC-02 = true
//   6.  SAL-DREQ-003 assembled when SC-02 = "Yes"
//   7.  SAL-DREQ-003 NOT assembled when SC-02 = false
//   8.  SAL-DREQ-003 NOT assembled when SC-02 absent
//   9.  SAL-DREQ-004 assembled when SC-03 = true
//   10. SAL-DREQ-004 assembled when SC-03 = "Yes"
//   11. SAL-DREQ-004 NOT assembled when SC-03 absent
//   12. SAL-DREQ-005 assembled when SC-04 = "Manager approval"
//   13. SAL-DREQ-005 NOT assembled when SC-04 = "No approval"
//   14. SAL-DREQ-005 NOT assembled when SC-04 absent
//   15. SAL-DREQ-006 assembled when FC-06 = true
//   16. SAL-DREQ-006 assembled when FC-06 = "Yes"
//   17. SAL-DREQ-006 NOT assembled when FC-06 absent
//   18. SAL-DREQ-007 assembled when PI-05 = true
//   19. SAL-DREQ-007 assembled when PI-05 = "Yes"
//   20. SAL-DREQ-007 NOT assembled when PI-05 absent
//   21. target_model is product.pricelist for every definition
//   22. target_operation is "write" for every definition
//   23. all definitions except SAL-FOUND-002 have null intended_changes
//   24. Non-SAL checkpoint IDs not in the map
//   25. Return is plain object — never null, never array
//   26. null inputs: only unconditionals returned (3 definitions)
//   27. All conditionals assembled when all gates are true (3 unconditional + 5 conditional = 8 total)
//   28. SAL-FOUND-002 intended_changes.currency_id sourced from primary_currency ("USD")
//   29. SAL-FOUND-002 intended_changes.currency_id sourced from primary_currency ("EUR")
//   30. SAL-FOUND-002 intended_changes.currency_id is null when primary_currency is null
//   31. all other SAL definitions still have null intended_changes when primary_currency is known
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assembleSalesOperationDefinitions,
  SALES_PRICELIST_MODEL,
  SALES_TARGET_OPERATION,
  SALES_EXECUTABLE_CHECKPOINT_IDS,
  SALES_OP_DEFS_VERSION,
} from "../sales-operation-definitions.js";

import { CHECKPOINT_IDS } from "../checkpoint-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTargetContext(overrides = {}) {
  return {
    odoo_version:               "19",
    edition:                    "enterprise",
    deployment_type:            "on_premise",
    primary_country:            "US",
    primary_currency:           "USD",
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

describe("assembleSalesOperationDefinitions", () => {

  // ── Test 1: Unconditional definitions assembled ─────────────────────────

  it("1. assembles unconditional SAL definitions (FOUND-002, DREQ-001, DREQ-002)", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.ok(defs[CHECKPOINT_IDS.SAL_FOUND_002], "SAL-FOUND-002 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_001],  "SAL-DREQ-001 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_002],  "SAL-DREQ-002 must be assembled");
  });

  // ── Test 2: Keyed by correct checkpoint IDs ─────────────────────────────

  it("2. definitions keyed by exact SAL checkpoint IDs", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(defs[CHECKPOINT_IDS.SAL_FOUND_002].checkpoint_id, CHECKPOINT_IDS.SAL_FOUND_002);
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_001].checkpoint_id,  CHECKPOINT_IDS.SAL_DREQ_001);
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_002].checkpoint_id,  CHECKPOINT_IDS.SAL_DREQ_002);
  });

  // ── Test 3: SAL-FOUND-001 excluded — Informational ──────────────────────

  it("3. SAL-FOUND-001 excluded — Informational, execution_relevance: Informational", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_FOUND_001],
      undefined,
      "SAL-FOUND-001 must NOT have a definition (Informational / Not_Applicable)"
    );
  });

  // ── Test 4: SAL-GL-001 excluded — execution_relevance: None ─────────────

  it("4. SAL-GL-001 excluded — execution_relevance: None", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_GL_001],
      undefined,
      "SAL-GL-001 must NOT have a definition (execution_relevance: None)"
    );
  });

  // ── Test 5: SAL-DREQ-003 assembled when SC-02 = true ────────────────────

  it("5. SAL-DREQ-003 assembled when SC-02 = true", () => {
    const answers = makeDiscoveryAnswers({ "SC-02": true });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_003], "SAL-DREQ-003 must be assembled when SC-02=true");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_003].checkpoint_id, CHECKPOINT_IDS.SAL_DREQ_003);
  });

  // ── Test 6: SAL-DREQ-003 assembled when SC-02 = "Yes" ───────────────────

  it('6. SAL-DREQ-003 assembled when SC-02 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "SC-02": "Yes" });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_003], 'SAL-DREQ-003 must be assembled when SC-02="Yes"');
  });

  // ── Test 7: SAL-DREQ-003 NOT assembled when SC-02 = false ───────────────

  it("7. SAL-DREQ-003 NOT assembled when SC-02 = false", () => {
    const answers = makeDiscoveryAnswers({ "SC-02": false });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_DREQ_003],
      undefined,
      "SAL-DREQ-003 must NOT be assembled when SC-02=false"
    );
  });

  // ── Test 8: SAL-DREQ-003 NOT assembled when SC-02 absent ────────────────

  it("8. SAL-DREQ-003 NOT assembled when SC-02 is absent", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_DREQ_003],
      undefined,
      "SAL-DREQ-003 must NOT be assembled when SC-02 is absent"
    );
  });

  // ── Test 9: SAL-DREQ-004 assembled when SC-03 = true ────────────────────

  it("9. SAL-DREQ-004 assembled when SC-03 = true", () => {
    const answers = makeDiscoveryAnswers({ "SC-03": true });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_004], "SAL-DREQ-004 must be assembled when SC-03=true");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_004].checkpoint_id, CHECKPOINT_IDS.SAL_DREQ_004);
  });

  // ── Test 10: SAL-DREQ-004 assembled when SC-03 = "Yes" ──────────────────

  it('10. SAL-DREQ-004 assembled when SC-03 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "SC-03": "Yes" });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_004], 'SAL-DREQ-004 must be assembled when SC-03="Yes"');
  });

  // ── Test 11: SAL-DREQ-004 NOT assembled when SC-03 absent ───────────────

  it("11. SAL-DREQ-004 NOT assembled when SC-03 is absent", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_DREQ_004],
      undefined,
      "SAL-DREQ-004 must NOT be assembled when SC-03 is absent"
    );
  });

  // ── Test 12: SAL-DREQ-005 assembled when SC-04 = "Manager approval" ─────

  it('12. SAL-DREQ-005 assembled when SC-04 = "Manager approval"', () => {
    const answers = makeDiscoveryAnswers({ "SC-04": "Manager approval" });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_005], 'SAL-DREQ-005 must be assembled when SC-04="Manager approval"');
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_005].checkpoint_id, CHECKPOINT_IDS.SAL_DREQ_005);
  });

  // ── Test 13: SAL-DREQ-005 NOT assembled when SC-04 = "No approval" ──────

  it('13. SAL-DREQ-005 NOT assembled when SC-04 = "No approval"', () => {
    const answers = makeDiscoveryAnswers({ "SC-04": "No approval" });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_DREQ_005],
      undefined,
      'SAL-DREQ-005 must NOT be assembled when SC-04="No approval"'
    );
  });

  // ── Test 14: SAL-DREQ-005 NOT assembled when SC-04 absent ───────────────

  it("14. SAL-DREQ-005 NOT assembled when SC-04 is absent", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_DREQ_005],
      undefined,
      "SAL-DREQ-005 must NOT be assembled when SC-04 is absent"
    );
  });

  // ── Test 15: SAL-DREQ-006 assembled when FC-06 = true ───────────────────

  it("15. SAL-DREQ-006 assembled when FC-06 = true", () => {
    const answers = makeDiscoveryAnswers({ "FC-06": true });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_006], "SAL-DREQ-006 must be assembled when FC-06=true");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_006].checkpoint_id, CHECKPOINT_IDS.SAL_DREQ_006);
  });

  // ── Test 16: SAL-DREQ-006 assembled when FC-06 = "Yes" ──────────────────

  it('16. SAL-DREQ-006 assembled when FC-06 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "FC-06": "Yes" });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_006], 'SAL-DREQ-006 must be assembled when FC-06="Yes"');
  });

  // ── Test 17: SAL-DREQ-006 NOT assembled when FC-06 absent ───────────────

  it("17. SAL-DREQ-006 NOT assembled when FC-06 is absent", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_DREQ_006],
      undefined,
      "SAL-DREQ-006 must NOT be assembled when FC-06 is absent"
    );
  });

  // ── Test 18: SAL-DREQ-007 assembled when PI-05 = true ───────────────────

  it("18. SAL-DREQ-007 assembled when PI-05 = true", () => {
    const answers = makeDiscoveryAnswers({ "PI-05": true });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_007], "SAL-DREQ-007 must be assembled when PI-05=true");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_007].checkpoint_id, CHECKPOINT_IDS.SAL_DREQ_007);
  });

  // ── Test 19: SAL-DREQ-007 assembled when PI-05 = "Yes" ──────────────────

  it('19. SAL-DREQ-007 assembled when PI-05 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "PI-05": "Yes" });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_007], 'SAL-DREQ-007 must be assembled when PI-05="Yes"');
  });

  // ── Test 20: SAL-DREQ-007 NOT assembled when PI-05 absent ───────────────

  it("20. SAL-DREQ-007 NOT assembled when PI-05 is absent", () => {
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.SAL_DREQ_007],
      undefined,
      "SAL-DREQ-007 must NOT be assembled when PI-05 is absent"
    );
  });

  // ── Test 21: target_model is product.pricelist for every definition ──────

  it("21. target_model is product.pricelist for every assembled definition", () => {
    const answers = makeDiscoveryAnswers({
      "SC-02": true,
      "SC-03": true,
      "SC-04": "Manager approval",
      "FC-06": true,
      "PI-05": true,
    });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_model,
        SALES_PRICELIST_MODEL,
        `${key} target_model must be product.pricelist`
      );
    }
  });

  // ── Test 22: target_operation is "write" for every assembled definition ──

  it('22. target_operation is "write" for every assembled definition', () => {
    const answers = makeDiscoveryAnswers({
      "SC-02": true,
      "SC-03": true,
      "SC-04": "Manager approval",
      "FC-06": true,
      "PI-05": true,
    });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_operation,
        SALES_TARGET_OPERATION,
        `${key} target_operation must be write`
      );
    }
  });

  // ── Test 23: all definitions except SAL-FOUND-002 have null intended_changes ──
  // SAL-FOUND-002 emits { currency_id } from primary_currency — see tests 28–31.

  it("23. all SAL definitions except SAL-FOUND-002 have null intended_changes", () => {
    const answers = makeDiscoveryAnswers({
      "SC-02": true,
      "SC-03": true,
      "SC-04": "Manager approval",
      "FC-06": true,
      "PI-05": true,
    });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      if (key === CHECKPOINT_IDS.SAL_FOUND_002) continue;
      assert.equal(
        defs[key].intended_changes,
        null,
        `${key} intended_changes must be null (sales data not available at assembly time)`
      );
    }
  });

  // ── Test 24: Non-SAL checkpoint IDs not added ────────────────────────────

  it("24. non-SAL checkpoint IDs are not in the assembled map", () => {
    const answers = makeDiscoveryAnswers({
      "SC-02": true,
      "SC-03": true,
      "SC-04": "Manager approval",
      "FC-06": true,
      "PI-05": true,
    });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    const keys = Object.keys(defs);
    for (const key of keys) {
      assert.ok(
        key.startsWith("SAL-"),
        `Unexpected non-SAL key in map: ${key}`
      );
    }
  });

  // ── Test 25: Return is a plain object ────────────────────────────────────

  it("25. return is a plain object — never null, never array", () => {
    const defs = assembleSalesOperationDefinitions(null, null);
    assert.ok(defs !== null, "result must not be null");
    assert.ok(!Array.isArray(defs), "result must not be an array");
    assert.equal(typeof defs, "object");
  });

  // ── Test 26: null inputs: only unconditionals returned ───────────────────

  it("26. null target_context and null discovery_answers: only 3 unconditional definitions returned", () => {
    const defs = assembleSalesOperationDefinitions(null, null);
    assert.ok(defs[CHECKPOINT_IDS.SAL_FOUND_002], "SAL-FOUND-002 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_001],  "SAL-DREQ-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_002],  "SAL-DREQ-002 must be present");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_003], undefined, "SAL-DREQ-003 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_004], undefined, "SAL-DREQ-004 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_005], undefined, "SAL-DREQ-005 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_006], undefined, "SAL-DREQ-006 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.SAL_DREQ_007], undefined, "SAL-DREQ-007 must be absent");
    assert.equal(Object.keys(defs).length, 3, "exactly 3 definitions with null inputs");
  });

  // ── Test 27: All conditionals assembled when all gates are true ──────────

  it("27. all 8 definitions assembled when all conditional gates are true", () => {
    const answers = makeDiscoveryAnswers({
      "SC-02": true,
      "SC-03": true,
      "SC-04": "Manager approval",
      "FC-06": true,
      "PI-05": true,
    });
    const defs = assembleSalesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.SAL_FOUND_002], "SAL-FOUND-002 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_001],  "SAL-DREQ-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_002],  "SAL-DREQ-002 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_003],  "SAL-DREQ-003 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_004],  "SAL-DREQ-004 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_005],  "SAL-DREQ-005 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_006],  "SAL-DREQ-006 must be present");
    assert.ok(defs[CHECKPOINT_IDS.SAL_DREQ_007],  "SAL-DREQ-007 must be present");
    assert.equal(Object.keys(defs).length, 8, "exactly 8 definitions when all gates are true");
  });

  // ── Test 28: SAL-FOUND-002 currency_id from "USD" ────────────────────────

  it('28. SAL-FOUND-002 intended_changes is { currency_id: "USD" } when primary_currency="USD"', () => {
    const ctx = makeTargetContext({ primary_currency: "USD" });
    const defs = assembleSalesOperationDefinitions(ctx, makeDiscoveryAnswers());
    assert.deepEqual(
      defs[CHECKPOINT_IDS.SAL_FOUND_002].intended_changes,
      { currency_id: "USD" }
    );
  });

  // ── Test 29: SAL-FOUND-002 currency_id from "EUR" ────────────────────────

  it('29. SAL-FOUND-002 intended_changes is { currency_id: "EUR" } when primary_currency="EUR"', () => {
    const ctx = makeTargetContext({ primary_currency: "EUR" });
    const defs = assembleSalesOperationDefinitions(ctx, makeDiscoveryAnswers());
    assert.deepEqual(
      defs[CHECKPOINT_IDS.SAL_FOUND_002].intended_changes,
      { currency_id: "EUR" }
    );
  });

  // ── Test 30: SAL-FOUND-002 currency_id is null when primary_currency null ─

  it("30. SAL-FOUND-002 intended_changes.currency_id is null when primary_currency is null", () => {
    const ctx = makeTargetContext({ primary_currency: null });
    const defs = assembleSalesOperationDefinitions(ctx, makeDiscoveryAnswers());
    assert.deepEqual(
      defs[CHECKPOINT_IDS.SAL_FOUND_002].intended_changes,
      { currency_id: null }
    );
  });

  // ── Test 31: other SAL definitions null even with known currency ──────────

  it("31. all other SAL definitions still have null intended_changes when primary_currency is known", () => {
    const ctx = makeTargetContext({ primary_currency: "USD" });
    const answers = makeDiscoveryAnswers({ "SC-02": true, "BM-02": true });
    const defs = assembleSalesOperationDefinitions(ctx, answers);
    for (const key of Object.keys(defs)) {
      if (key === CHECKPOINT_IDS.SAL_FOUND_002) continue;
      assert.equal(
        defs[key].intended_changes,
        null,
        `${key} intended_changes must remain null`
      );
    }
  });

});
