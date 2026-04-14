// ---------------------------------------------------------------------------
// Master Data Operation Definitions Tests
// Tests for: app/shared/master-data-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  No unconditional MAS definitions remain (DREQ-002 excluded DL-014, DREQ-003 excluded DL-015)
//   1b. MAS-DREQ-001 excluded — readiness-verification, Informational / Not_Applicable (DL-013)
//   1c. MAS-DREQ-003 excluded — readiness-verification, Informational / Not_Applicable (DL-015)
//   2.  Definitions keyed by correct MAS checkpoint IDs
//   3.  MAS-FOUND-001 excluded — User_Confirmed confirm route only (R5)
//   4.  MAS-FOUND-002 excluded — User_Confirmed confirm route only (R5)
//   5.  MAS-DREQ-004 excluded — Informational / Not_Applicable (R6)
//   6.  MAS-DREQ-005 assembled only when OP-01 = true
//   7.  MAS-DREQ-005 assembled only when OP-01 = "Yes"
//   8.  MAS-DREQ-005 NOT assembled when OP-01 = false
//   9.  MAS-DREQ-005 NOT assembled when OP-01 absent
//   10. MAS-DREQ-006 assembled only when MF-01 = true
//   11. MAS-DREQ-006 assembled only when MF-01 = "Yes"
//   12. MAS-DREQ-006 NOT assembled when MF-01 = false
//   13. MAS-DREQ-006 NOT assembled when MF-01 absent
//   14. MAS-DREQ-007 assembled when PI-04 is answered and != "None"
//   15. MAS-DREQ-007 NOT assembled when PI-04 = "None"
//   16. MAS-DREQ-007 NOT assembled when PI-04 absent
//   17. target_model is correct per checkpoint
//   18. target_operation is "write" for every assembled definition
//   19. intended_changes is null for all definitions — honest missing-input behavior
//   20. Non-MAS checkpoint IDs not added to the map
//   21. Return is a plain object — never null, never array
//   22. null inputs: 0 unconditional definitions returned (all reclassified)
//   23. Preview generation for conditional MAS checkpoints unblocked by supplied definitions
//   24. MAS Executable checkpoints blocked by Gate 6 when no definitions supplied
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assembleMasterDataOperationDefinitions,
  MASTER_DATA_CATEGORY_MODEL,
  MASTER_DATA_PARTNER_CATEGORY_MODEL,
  MASTER_DATA_UOM_CATEGORY_MODEL,
  MASTER_DATA_TARGET_OPERATION,
  MASTER_DATA_EXECUTABLE_CHECKPOINT_IDS,
  MASTER_DATA_OP_DEFS_VERSION,
} from "../master-data-operation-definitions.js";

import { CHECKPOINT_IDS } from "../checkpoint-engine.js";
import { computePreviews } from "../governed-preview-engine.js";

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

/**
 * Builds a minimal Master Data Executable checkpoint record for preview integration tests.
 */
function makeMasterDataCheckpoint(checkpoint_id, safety_class = "Safe") {
  return {
    checkpoint_id,
    domain: "master_data",
    checkpoint_class: "Domain_Required",
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

describe("assembleMasterDataOperationDefinitions", () => {

  // ── Test 1: No unconditional definitions remain ────────────────────────

  it("1. no unconditional MAS definitions remain (DREQ-002 excluded DL-014, DREQ-003 excluded DL-015)", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_002],
      undefined,
      "MAS-DREQ-002 must NOT be assembled (readiness-verification, no truthful write target — DL-014)"
    );
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_003],
      undefined,
      "MAS-DREQ-003 must NOT be assembled (readiness-verification, no truthful write target — DL-015)"
    );
    assert.equal(Object.keys(defs).length, 0,
      "no definitions must be returned when no conditional answers supplied");
  });

  // ── Test 1b: MAS-DREQ-001 excluded — readiness-verification checkpoint ─

  it("1b. MAS-DREQ-001 excluded — Informational / User_Confirmed / Not_Applicable (DL-013)", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_001],
      undefined,
      "MAS-DREQ-001 must NOT have a definition (readiness-verification, no truthful write target)"
    );
  });

  // ── Test 1c: MAS-DREQ-003 excluded — readiness-verification checkpoint ─

  it("1c. MAS-DREQ-003 excluded — Informational / User_Confirmed / Not_Applicable (DL-015)", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_003],
      undefined,
      "MAS-DREQ-003 must NOT have a definition (readiness-verification, no truthful write target)"
    );
  });

  // ── Test 2: Keyed by correct checkpoint IDs ─────────────────────────────

  it("2. definitions keyed by exact MAS checkpoint IDs (conditional only)", () => {
    const answers = makeDiscoveryAnswers({ "OP-01": true, "MF-01": true });
    const captures = { inventory: { warehouse_name: "Main" } };
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers, captures);
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_005].checkpoint_id, CHECKPOINT_IDS.MAS_DREQ_005);
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_006].checkpoint_id, CHECKPOINT_IDS.MAS_DREQ_006);
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_007].checkpoint_id, CHECKPOINT_IDS.MAS_DREQ_007);
  });

  // ── Test 3: MAS-FOUND-001 excluded (User_Confirmed confirm route) ────────

  it("3. MAS-FOUND-001 excluded — User_Confirmed confirm route only, Gate 6 does not apply", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_FOUND_001],
      undefined,
      "MAS-FOUND-001 must NOT have a definition (validation_source: User_Confirmed)"
    );
  });

  // ── Test 4: MAS-FOUND-002 excluded (User_Confirmed confirm route) ────────

  it("4. MAS-FOUND-002 excluded — User_Confirmed confirm route only, Gate 6 does not apply", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_FOUND_002],
      undefined,
      "MAS-FOUND-002 must NOT have a definition (validation_source: User_Confirmed)"
    );
  });

  // ── Test 5: MAS-DREQ-004 excluded (Informational / Not_Applicable) ───────

  it("5. MAS-DREQ-004 excluded — Informational, safety_class: Not_Applicable", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_004],
      undefined,
      "MAS-DREQ-004 must NOT have a definition (Informational / Not_Applicable)"
    );
  });

  // ── Test 6: MAS-DREQ-005 assembled when OP-01 = true ────────────────────

  it("6. MAS-DREQ-005 assembled when OP-01 = true", () => {
    const answers = makeDiscoveryAnswers({ "OP-01": true });
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.MAS_DREQ_005], "MAS-DREQ-005 must be assembled when OP-01=true");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_005].checkpoint_id, CHECKPOINT_IDS.MAS_DREQ_005);
  });

  // ── Test 7: MAS-DREQ-005 assembled when OP-01 = "Yes" ───────────────────

  it('7. MAS-DREQ-005 assembled when OP-01 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "OP-01": "Yes" });
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.MAS_DREQ_005], 'MAS-DREQ-005 must be assembled when OP-01="Yes"');
  });

  // ── Test 8: MAS-DREQ-005 NOT assembled when OP-01 = false ───────────────

  it("8. MAS-DREQ-005 NOT assembled when OP-01 = false", () => {
    const answers = makeDiscoveryAnswers({ "OP-01": false });
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_005],
      undefined,
      "MAS-DREQ-005 must NOT be assembled when OP-01=false"
    );
  });

  // ── Test 9: MAS-DREQ-005 NOT assembled when OP-01 absent ────────────────

  it("9. MAS-DREQ-005 NOT assembled when OP-01 is absent", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_005],
      undefined,
      "MAS-DREQ-005 must NOT be assembled when OP-01 is absent"
    );
  });

  // ── Test 10: MAS-DREQ-006 assembled when MF-01 = true ───────────────────

  it("10. MAS-DREQ-006 assembled when MF-01 = true", () => {
    const answers = makeDiscoveryAnswers({ "MF-01": true });
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.MAS_DREQ_006], "MAS-DREQ-006 must be assembled when MF-01=true");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_006].checkpoint_id, CHECKPOINT_IDS.MAS_DREQ_006);
  });

  // ── Test 11: MAS-DREQ-006 assembled when MF-01 = "Yes" ──────────────────

  it('11. MAS-DREQ-006 assembled when MF-01 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "MF-01": "Yes" });
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.MAS_DREQ_006], 'MAS-DREQ-006 must be assembled when MF-01="Yes"');
  });

  // ── Test 12: MAS-DREQ-006 NOT assembled when MF-01 = false ──────────────

  it("12. MAS-DREQ-006 NOT assembled when MF-01 = false", () => {
    const answers = makeDiscoveryAnswers({ "MF-01": false });
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_006],
      undefined,
      "MAS-DREQ-006 must NOT be assembled when MF-01=false"
    );
  });

  // ── Test 13: MAS-DREQ-006 NOT assembled when MF-01 absent ───────────────

  it("13. MAS-DREQ-006 NOT assembled when MF-01 is absent", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_006],
      undefined,
      "MAS-DREQ-006 must NOT be assembled when MF-01 is absent"
    );
  });

  // ── Test 14: MAS-DREQ-007 assembled when inventory wizard captured ──────
  // PI-04 was removed from discovery; the new gate reads wizard_captures.inventory.

  it("14. MAS-DREQ-007 assembled when wizard_captures.inventory is present", () => {
    const answers = makeDiscoveryAnswers();
    const captures = { inventory: { warehouse_name: "Main" } };
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers, captures);
    assert.ok(defs[CHECKPOINT_IDS.MAS_DREQ_007],
      "MAS-DREQ-007 must be assembled when wizard_captures.inventory is present");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_007].checkpoint_id, CHECKPOINT_IDS.MAS_DREQ_007);
  });

  // ── Test 15: MAS-DREQ-007 NOT assembled when wizard_captures is null ────

  it("15. MAS-DREQ-007 NOT assembled when wizard_captures is null", () => {
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), null);
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_007],
      undefined,
      "MAS-DREQ-007 must NOT be assembled when wizard_captures is null"
    );
  });

  // ── Test 16: MAS-DREQ-007 NOT assembled when inventory capture absent ───

  it("16. MAS-DREQ-007 NOT assembled when wizard_captures.inventory is absent", () => {
    const captures = { "master-data": { product_category_name: "X" } };
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers(), captures);
    assert.equal(
      defs[CHECKPOINT_IDS.MAS_DREQ_007],
      undefined,
      "MAS-DREQ-007 must NOT be assembled when wizard_captures.inventory is absent"
    );
  });

  // ── Test 17: target_model correct per checkpoint ─────────────────────────

  it("17. target_model is correct per checkpoint", () => {
    const answers = makeDiscoveryAnswers({ "OP-01": true, "MF-01": true });
    const captures = { inventory: { warehouse_name: "Main" } };
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers, captures);

    // product.category checkpoints
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_005].target_model, MASTER_DATA_CATEGORY_MODEL,
      "MAS-DREQ-005 must target product.category");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_006].target_model, MASTER_DATA_CATEGORY_MODEL,
      "MAS-DREQ-006 must target product.category");

    // res.partner.category checkpoints
    // MAS-DREQ-002 excluded (DL-014) — no target_model assertion
    // MAS-DREQ-003 excluded (DL-015) — no target_model assertion
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_007].target_model, MASTER_DATA_PARTNER_CATEGORY_MODEL,
      "MAS-DREQ-007 must target res.partner.category");
  });

  // ── Test 18: target_operation is "write" for every assembled definition ──

  it('18. target_operation is "write" for every assembled definition', () => {
    const answers = makeDiscoveryAnswers({ "OP-01": true, "MF-01": true });
    const captures = { inventory: { warehouse_name: "Main" } };
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers, captures);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_operation,
        MASTER_DATA_TARGET_OPERATION,
        `${key} target_operation must be write`
      );
    }
  });

  // ── Test 19: intended_changes is null for all definitions ───────────────

  it("19. intended_changes is null for all assembled definitions — honest missing-input behavior", () => {
    const answers = makeDiscoveryAnswers({ "OP-01": true, "MF-01": true });
    const captures = { inventory: { warehouse_name: "Main" } };
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers, captures);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].intended_changes,
        null,
        `${key} intended_changes must be null (category data not available at assembly time)`
      );
    }
  });

  // ── Test 20: Non-MAS checkpoint IDs not added ────────────────────────────

  it("20. non-MAS checkpoint IDs are not in the assembled map", () => {
    const answers = makeDiscoveryAnswers({ "OP-01": true, "MF-01": true });
    const captures = { inventory: { warehouse_name: "Main" } };
    const defs = assembleMasterDataOperationDefinitions(makeTargetContext(), answers, captures);
    const keys = Object.keys(defs);
    for (const key of keys) {
      assert.ok(
        key.startsWith("MAS-"),
        `Unexpected non-MAS key in map: ${key}`
      );
    }
  });

  // ── Test 21: Return is a plain object ────────────────────────────────────

  it("21. return is a plain object — never null, never array", () => {
    const defs = assembleMasterDataOperationDefinitions(null, null);
    assert.ok(defs !== null, "result must not be null");
    assert.ok(!Array.isArray(defs), "result must not be an array");
    assert.equal(typeof defs, "object");
  });

  // ── Test 22: null inputs: 0 unconditional definitions returned ──────────

  it("22. null target_context and null discovery_answers: 0 definitions returned (all unconditionals reclassified)", () => {
    const defs = assembleMasterDataOperationDefinitions(null, null);
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_001], undefined, "MAS-DREQ-001 must be absent (readiness-verification, DL-013)");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_002], undefined, "MAS-DREQ-002 must be absent (readiness-verification, DL-014)");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_003], undefined, "MAS-DREQ-003 must be absent (readiness-verification, DL-015)");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_004], undefined, "MAS-DREQ-004 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_005], undefined, "MAS-DREQ-005 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_006], undefined, "MAS-DREQ-006 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.MAS_DREQ_007], undefined, "MAS-DREQ-007 must be absent");
    assert.equal(Object.keys(defs).length, 0, "0 definitions with null inputs (all unconditionals reclassified)");
  });

  // ── Test 23: Preview generation unblocked for conditional MAS checkpoints ─
  //
  // Integration test: supply Master Data operation definitions to computePreviews
  // and verify that conditional Executable checkpoints produce preview records.
  // MAS-DREQ-001/002/003 all reclassified (DL-013/014/015) — no previews for them.

  it("23. preview generation for conditional MAS-DREQ-005 unblocked when definitions supplied", () => {
    const tc = makeTargetContext({ deployment_type: "on_premise" });
    const da = makeDiscoveryAnswers({ "OP-01": true });
    const defs = assembleMasterDataOperationDefinitions(tc, da);

    // Build checkpoint for conditional MAS-DREQ-005
    const checkpoints = [
      makeMasterDataCheckpoint(CHECKPOINT_IDS.MAS_DREQ_005, "Safe"),
    ];

    const output = computePreviews(
      checkpoints,
      null,   // validated_checkpoints
      null,   // blockers
      null,   // project_state
      tc,     // target_context (required for Executable Gate 3)
      null,   // connection_state
      defs    // operation_definitions — Master Data definitions supplied
    );

    assert.equal(
      output.previews.length,
      1,
      "Conditional MAS-DREQ-005 must produce a preview record when OP-01=true"
    );

    const p005 = output.previews[0];
    assert.ok(p005.target_model, "preview.target_model must be present");
    assert.equal(p005.target_model, MASTER_DATA_CATEGORY_MODEL,
      "MAS-DREQ-005 preview must target product.category");
    assert.equal(p005.target_operation, MASTER_DATA_TARGET_OPERATION,
      "preview.target_operation must be write");
    assert.ok(p005.preview_id, "preview_id must be present");
    assert.equal(p005.execution_approval_implied, false,
      "execution_approval_implied must be false");
  });

  // ── Test 24: Gate 6 blocks MAS Executables without definitions ───────���───
  //
  // Confirms that without operation definitions Executable checkpoints produce
  // zero previews — Gate 6 enforcement is intact.
  // Uses manually-constructed Executable checkpoints to exercise the gate path.

  it("24. MAS Executable checkpoints produce no previews when definitions are absent (Gate 6 enforced)", () => {
    const tc = makeTargetContext({ deployment_type: "on_premise" });

    // Use conditional checkpoint IDs for Gate 6 test (all unconditionals reclassified)
    const checkpoints = [
      makeMasterDataCheckpoint(CHECKPOINT_IDS.MAS_DREQ_005, "Safe"),
      makeMasterDataCheckpoint(CHECKPOINT_IDS.MAS_DREQ_006, "Safe"),
    ];

    // Pass an empty definitions map — no master_data definitions
    const output = computePreviews(
      checkpoints,
      null, null, null, tc, null,
      {} // empty operation_definitions
    );

    assert.equal(
      output.previews.length,
      0,
      "No previews must be generated when operation_definitions is empty (Gate 6 blocks all)"
    );
  });

});
