// ---------------------------------------------------------------------------
// Purchase Operation Definitions Tests
// Tests for: app/shared/purchase-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional PUR definitions assembled (DREQ-001, DREQ-002)
//   2.  Definitions keyed by correct PUR checkpoint IDs
//   3.  PUR-FOUND-001 excluded — Informational, no definition needed
//   4.  PUR-GL-001 excluded — execution_relevance None, no definition needed
//   5.  PUR-DREQ-003 assembled when PI-02 = "Threshold"
//   6.  PUR-DREQ-003 NOT assembled when PI-02 = "All orders"
//   7.  PUR-DREQ-003 NOT assembled when PI-02 is absent
//   8.  PUR-DREQ-004 assembled when PI-02 = "All orders" with derived intended_changes
//   8a. PUR-DREQ-004 intended_changes matches res.company.po_double_validation = "always"
//   9.  PUR-DREQ-004 NOT assembled when PI-02 = "Threshold"
//   10. PUR-DREQ-004 NOT assembled when PI-02 is absent
//   11. PUR-DREQ-003 and PUR-DREQ-004 mutually exclusive — never both present
//   12. PUR-DREQ-005 assembled when FC-03 = true
//   13. PUR-DREQ-005 assembled when FC-03 = "Yes"
//   14. PUR-DREQ-005 NOT assembled when FC-03 is absent
//   15. PUR-DREQ-006 assembled when MF-04 = true
//   16. PUR-DREQ-006 assembled when MF-04 = "Yes"
//   17. PUR-DREQ-006 NOT assembled when MF-04 is absent
//   18. PUR-DREQ-007 assembled when PI-05 = true
//   19. PUR-DREQ-007 assembled when PI-05 = "Yes"
//   20. PUR-DREQ-007 NOT assembled when PI-05 is absent
//   21. target_model is res.company for every assembled definition
//   22. target_operation is "write" for every assembled definition
//   23. intended_changes stays null except for truthful PUR-DREQ-004 derivation
//   24. Non-PUR checkpoint IDs not added to the map
//   25. Return is a plain object — never null, never array
//   26. null inputs: only unconditionals returned (2 definitions)
//   27. All conditionals assembled when all applicable gates active (max 6 total)
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assemblePurchaseOperationDefinitions,
  PURCHASE_COMPANY_MODEL,
  PURCHASE_TARGET_OPERATION,
  PURCHASE_EXECUTABLE_CHECKPOINT_IDS,
  PURCHASE_OP_DEFS_VERSION,
} from "../purchase-operation-definitions.js";

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

describe("assemblePurchaseOperationDefinitions", () => {

  // ── Test 1: Unconditional definitions assembled ─────────────────────────

  it("1. assembles unconditional PUR definitions (DREQ-001, DREQ-002)", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_001], "PUR-DREQ-001 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_002], "PUR-DREQ-002 must be assembled");
  });

  // ── Test 2: Keyed by correct checkpoint IDs ─────────────────────────────

  it("2. definitions keyed by exact PUR checkpoint IDs", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_001].checkpoint_id, CHECKPOINT_IDS.PUR_DREQ_001);
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_002].checkpoint_id, CHECKPOINT_IDS.PUR_DREQ_002);
  });

  // ── Test 3: PUR-FOUND-001 excluded (Informational) ──────────────────────

  it("3. PUR-FOUND-001 excluded — Informational, no definition needed", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_FOUND_001],
      undefined,
      "PUR-FOUND-001 must NOT have a definition (execution_relevance: Informational)"
    );
  });

  // ── Test 4: PUR-GL-001 excluded (execution_relevance: None) ─────────────

  it("4. PUR-GL-001 excluded — execution_relevance None, no definition needed", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_GL_001],
      undefined,
      "PUR-GL-001 must NOT have a definition (execution_relevance: None)"
    );
  });

  // ── Test 5: PUR-DREQ-003 assembled when PI-02 = "Threshold" ────────────

  it('5. PUR-DREQ-003 assembled when PI-02 = "Threshold"', () => {
    const answers = makeDiscoveryAnswers({ "PI-02": "Threshold" });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_003], 'PUR-DREQ-003 must be assembled when PI-02="Threshold"');
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_003].checkpoint_id, CHECKPOINT_IDS.PUR_DREQ_003);
  });

  // ── Test 6: PUR-DREQ-003 NOT assembled when PI-02 = "All orders" ────────

  it('6. PUR-DREQ-003 NOT assembled when PI-02 = "All orders"', () => {
    const answers = makeDiscoveryAnswers({ "PI-02": "All orders" });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_DREQ_003],
      undefined,
      'PUR-DREQ-003 must NOT be assembled when PI-02="All orders"'
    );
  });

  // ── Test 7: PUR-DREQ-003 NOT assembled when PI-02 absent ────────────────

  it("7. PUR-DREQ-003 NOT assembled when PI-02 is absent", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_DREQ_003],
      undefined,
      "PUR-DREQ-003 must NOT be assembled when PI-02 is absent"
    );
  });

  // ── Test 8: PUR-DREQ-004 assembled when PI-02 = "All orders" ────────────

  it('8. PUR-DREQ-004 assembled when PI-02 = "All orders" with derived intended_changes', () => {
    const answers = makeDiscoveryAnswers({ "PI-02": "All orders" });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_004], 'PUR-DREQ-004 must be assembled when PI-02="All orders"');
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_004].checkpoint_id, CHECKPOINT_IDS.PUR_DREQ_004);
    assert.deepEqual(
      defs[CHECKPOINT_IDS.PUR_DREQ_004].intended_changes,
      { po_double_validation: "always" },
      'PUR-DREQ-004 must derive res.company.po_double_validation="always" from PI-02="All orders"'
    );
  });

  it('8a. PUR-DREQ-004 intended_changes matches res.company.po_double_validation = "always"', () => {
    const answers = makeDiscoveryAnswers({ "PI-02": "All orders" });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    const changes = defs[CHECKPOINT_IDS.PUR_DREQ_004].intended_changes;

    assert.deepEqual(
      Object.keys(changes).sort(),
      ["po_double_validation"],
      "PUR-DREQ-004 intended_changes must contain exactly the confirmed Odoo 19 field"
    );
    assert.deepEqual(
      changes,
      { po_double_validation: "always" },
      'PUR-DREQ-004 intended_changes must exactly match { po_double_validation: "always" }'
    );
  });

  // ── Test 9: PUR-DREQ-004 NOT assembled when PI-02 = "Threshold" ─────────

  it('9. PUR-DREQ-004 NOT assembled when PI-02 = "Threshold"', () => {
    const answers = makeDiscoveryAnswers({ "PI-02": "Threshold" });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_DREQ_004],
      undefined,
      'PUR-DREQ-004 must NOT be assembled when PI-02="Threshold"'
    );
  });

  // ── Test 10: PUR-DREQ-004 NOT assembled when PI-02 absent ───────────────

  it("10. PUR-DREQ-004 NOT assembled when PI-02 is absent", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_DREQ_004],
      undefined,
      "PUR-DREQ-004 must NOT be assembled when PI-02 is absent"
    );
  });

  // ── Test 11: PUR-DREQ-003 and PUR-DREQ-004 mutually exclusive ───────────

  it("11. PUR-DREQ-003 and PUR-DREQ-004 are mutually exclusive — never both present", () => {
    // Threshold: 003 present, 004 absent
    const defsThreshold = assemblePurchaseOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "PI-02": "Threshold" })
    );
    assert.ok(defsThreshold[CHECKPOINT_IDS.PUR_DREQ_003], "PUR-DREQ-003 present for Threshold");
    assert.equal(defsThreshold[CHECKPOINT_IDS.PUR_DREQ_004], undefined, "PUR-DREQ-004 absent for Threshold");

    // All orders: 004 present, 003 absent
    const defsAllOrders = assemblePurchaseOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "PI-02": "All orders" })
    );
    assert.equal(defsAllOrders[CHECKPOINT_IDS.PUR_DREQ_003], undefined, "PUR-DREQ-003 absent for All orders");
    assert.ok(defsAllOrders[CHECKPOINT_IDS.PUR_DREQ_004], "PUR-DREQ-004 present for All orders");
  });

  // ── Test 12: PUR-DREQ-005 assembled when FC-03 = true ───────────────────

  it("12. PUR-DREQ-005 assembled when FC-03 = true", () => {
    const answers = makeDiscoveryAnswers({ "FC-03": true });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_005], "PUR-DREQ-005 must be assembled when FC-03=true");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_005].checkpoint_id, CHECKPOINT_IDS.PUR_DREQ_005);
  });

  // ── Test 13: PUR-DREQ-005 assembled when FC-03 = "Yes" ──────────────────

  it('13. PUR-DREQ-005 assembled when FC-03 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "FC-03": "Yes" });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_005], 'PUR-DREQ-005 must be assembled when FC-03="Yes"');
  });

  // ── Test 14: PUR-DREQ-005 NOT assembled when FC-03 absent ───────────────

  it("14. PUR-DREQ-005 NOT assembled when FC-03 is absent", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_DREQ_005],
      undefined,
      "PUR-DREQ-005 must NOT be assembled when FC-03 is absent"
    );
  });

  // ── Test 15: PUR-DREQ-006 assembled when MF-04 = true ───────────────────

  it("15. PUR-DREQ-006 assembled when MF-04 = true", () => {
    const answers = makeDiscoveryAnswers({ "MF-04": true });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_006], "PUR-DREQ-006 must be assembled when MF-04=true");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_006].checkpoint_id, CHECKPOINT_IDS.PUR_DREQ_006);
  });

  // ── Test 16: PUR-DREQ-006 assembled when MF-04 = "Yes" ──────────────────

  it('16. PUR-DREQ-006 assembled when MF-04 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "MF-04": "Yes" });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_006], 'PUR-DREQ-006 must be assembled when MF-04="Yes"');
  });

  // ── Test 17: PUR-DREQ-006 NOT assembled when MF-04 absent ───────────────

  it("17. PUR-DREQ-006 NOT assembled when MF-04 is absent", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_DREQ_006],
      undefined,
      "PUR-DREQ-006 must NOT be assembled when MF-04 is absent"
    );
  });

  // ── Test 18: PUR-DREQ-007 assembled when PI-05 = true ───────────────────

  it("18. PUR-DREQ-007 assembled when PI-05 = true", () => {
    const answers = makeDiscoveryAnswers({ "PI-05": true });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_007], "PUR-DREQ-007 must be assembled when PI-05=true");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_007].checkpoint_id, CHECKPOINT_IDS.PUR_DREQ_007);
  });

  // ── Test 19: PUR-DREQ-007 assembled when PI-05 = "Yes" ──────────────────

  it('19. PUR-DREQ-007 assembled when PI-05 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "PI-05": "Yes" });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_007], 'PUR-DREQ-007 must be assembled when PI-05="Yes"');
  });

  // ── Test 20: PUR-DREQ-007 NOT assembled when PI-05 absent ───────────────

  it("20. PUR-DREQ-007 NOT assembled when PI-05 is absent", () => {
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.PUR_DREQ_007],
      undefined,
      "PUR-DREQ-007 must NOT be assembled when PI-05 is absent"
    );
  });

  // ── Test 21: target_model is res.company for every definition ────────────

  it("21. target_model is res.company for every assembled definition", () => {
    const answers = makeDiscoveryAnswers({
      "PI-02": "All orders",
      "FC-03": true,
      "MF-04": true,
      "PI-05": true,
    });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_model,
        PURCHASE_COMPANY_MODEL,
        `${key} target_model must be res.company`
      );
    }
  });

  // ── Test 22: target_operation is "write" for every assembled definition ──

  it('22. target_operation is "write" for every assembled definition', () => {
    const answers = makeDiscoveryAnswers({
      "PI-02": "All orders",
      "FC-03": "Yes",
      "MF-04": "Yes",
      "PI-05": "Yes",
    });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_operation,
        PURCHASE_TARGET_OPERATION,
        `${key} target_operation must be write`
      );
    }
  });

  // ── Test 23: intended_changes is null for all definitions ───────────────

  it("23. intended_changes is null for all assembled definitions — honest missing-input behavior", () => {
    const answers = makeDiscoveryAnswers({
      "PI-02": "Threshold",
      "FC-03": true,
      "MF-04": true,
      "PI-05": true,
    });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      if (key === CHECKPOINT_IDS.PUR_DREQ_004) {
        assert.deepEqual(
          defs[key].intended_changes,
          { po_double_validation: "always" },
          "PUR-DREQ-004 must retain its truthful derived intended_changes"
        );
        continue;
      }
      assert.equal(
        defs[key].intended_changes,
        null,
        `${key} intended_changes must remain null (purchase data not available at assembly time)`
      );
    }
  });

  // ── Test 24: Non-PUR checkpoint IDs not added ────────────────────────────

  it("24. non-PUR checkpoint IDs are not in the assembled map", () => {
    const answers = makeDiscoveryAnswers({
      "PI-02": "Threshold",
      "FC-03": true,
      "MF-04": true,
      "PI-05": true,
    });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);
    const keys = Object.keys(defs);
    for (const key of keys) {
      assert.ok(
        key.startsWith("PUR-"),
        `Unexpected non-PUR key in map: ${key}`
      );
    }
  });

  // ── Test 25: Return is a plain object ────────────────────────────────────

  it("25. return is a plain object — never null, never array", () => {
    const defs = assemblePurchaseOperationDefinitions(null, null);
    assert.ok(defs !== null, "result must not be null");
    assert.ok(!Array.isArray(defs), "result must not be an array");
    assert.equal(typeof defs, "object");
  });

  // ── Test 26: null inputs: only unconditionals returned ───────────────────

  it("26. null target_context and null discovery_answers: only unconditional definitions returned (2)", () => {
    const defs = assemblePurchaseOperationDefinitions(null, null);
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_001], "PUR-DREQ-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_002], "PUR-DREQ-002 must be present");
    assert.equal(defs[CHECKPOINT_IDS.PUR_FOUND_001], undefined, "PUR-FOUND-001 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.PUR_GL_001],    undefined, "PUR-GL-001 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_003],  undefined, "PUR-DREQ-003 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_004],  undefined, "PUR-DREQ-004 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_005],  undefined, "PUR-DREQ-005 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_006],  undefined, "PUR-DREQ-006 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_007],  undefined, "PUR-DREQ-007 must be absent");
    assert.equal(Object.keys(defs).length, 2, "exactly 2 definitions with null inputs");
  });

  // ── Test 27: All conditionals assembled when all applicable gates active ─
  // PUR-DREQ-003 and PUR-DREQ-004 are mutually exclusive (R9). Max = 6 total:
  // 2 unconditional + PUR-DREQ-003 (or 004) + PUR-DREQ-005 + PUR-DREQ-006 + PUR-DREQ-007.

  it("27. all conditionals assembled when all applicable gates active (max 6 total — PUR-DREQ-003/004 mutually exclusive)", () => {
    // Using PI-02="Threshold": activates DREQ-003, blocks DREQ-004
    const answers = makeDiscoveryAnswers({
      "PI-02": "Threshold",
      "FC-03": true,
      "MF-04": true,
      "PI-05": true,
    });
    const defs = assemblePurchaseOperationDefinitions(makeTargetContext(), answers);

    // 2 unconditional
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_001], "PUR-DREQ-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_002], "PUR-DREQ-002 must be present");
    // Threshold conditional
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_003], "PUR-DREQ-003 must be present (PI-02=Threshold)");
    assert.equal(defs[CHECKPOINT_IDS.PUR_DREQ_004], undefined, "PUR-DREQ-004 must be absent (mutually exclusive)");
    // Other conditionals
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_005], "PUR-DREQ-005 must be present (FC-03=true)");
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_006], "PUR-DREQ-006 must be present (MF-04=true)");
    assert.ok(defs[CHECKPOINT_IDS.PUR_DREQ_007], "PUR-DREQ-007 must be present (PI-05=true)");
    assert.equal(Object.keys(defs).length, 6, "exactly 6 definitions when all applicable gates active");
  });

});
