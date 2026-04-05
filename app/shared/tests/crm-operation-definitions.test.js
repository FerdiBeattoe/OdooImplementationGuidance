// ---------------------------------------------------------------------------
// CRM Operation Definitions Tests
// Tests for: app/shared/crm-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional CRM definitions assembled (FOUND-001/002, DREQ-001/002/003, REC-001)
//   2.  Definitions keyed by correct CRM checkpoint IDs
//   3.  CRM-DREQ-004 assembled only when TA-02 = true
//   4.  CRM-DREQ-004 assembled only when TA-02 = "Yes"
//   5.  CRM-DREQ-004 NOT assembled when TA-02 = false
//   6.  CRM-DREQ-004 NOT assembled when TA-02 absent
//   7.  target_model is "crm.stage" for stage-targeted checkpoints
//   8.  target_model is "crm.team" for team-targeted checkpoints
//   9.  target_operation is "write" for every assembled definition
//   10. intended_changes is null for all definitions — honest missing-input behavior
//   11. Non-CRM checkpoint IDs not added to the map
//   12. Return is a plain object — never null, never array
//   13. null target_context and null discovery_answers: only unconditionals returned (6)
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assembleCrmOperationDefinitions,
  CRM_STAGE_MODEL,
  CRM_TEAM_MODEL,
  CRM_TARGET_OPERATION,
  CRM_EXECUTABLE_CHECKPOINT_IDS,
  CRM_OP_DEFS_VERSION,
} from "../crm-operation-definitions.js";

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

describe("assembleCrmOperationDefinitions", () => {

  // ── Test 1: Unconditional definitions assembled ─────────────────────────

  it("1. assembles unconditional CRM definitions (FOUND-001/002, DREQ-001/002/003, REC-001)", () => {
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.ok(defs[CHECKPOINT_IDS.CRM_FOUND_001], "CRM-FOUND-001 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.CRM_FOUND_002], "CRM-FOUND-002 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.CRM_DREQ_001],  "CRM-DREQ-001 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.CRM_DREQ_002],  "CRM-DREQ-002 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.CRM_DREQ_003],  "CRM-DREQ-003 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.CRM_REC_001],   "CRM-REC-001 must be assembled");
  });

  // ── Test 2: Keyed by correct checkpoint IDs ─────────────────────────────

  it("2. definitions keyed by exact CRM checkpoint IDs", () => {
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(defs[CHECKPOINT_IDS.CRM_FOUND_001].checkpoint_id, CHECKPOINT_IDS.CRM_FOUND_001);
    assert.equal(defs[CHECKPOINT_IDS.CRM_FOUND_002].checkpoint_id, CHECKPOINT_IDS.CRM_FOUND_002);
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_001].checkpoint_id,  CHECKPOINT_IDS.CRM_DREQ_001);
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_002].checkpoint_id,  CHECKPOINT_IDS.CRM_DREQ_002);
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_003].checkpoint_id,  CHECKPOINT_IDS.CRM_DREQ_003);
    assert.equal(defs[CHECKPOINT_IDS.CRM_REC_001].checkpoint_id,   CHECKPOINT_IDS.CRM_REC_001);
  });

  // ── Test 3: CRM-DREQ-004 assembled when TA-02 = true ───────────────────

  it("3. CRM-DREQ-004 assembled when TA-02 = true", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true });
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.CRM_DREQ_004], "CRM-DREQ-004 must be assembled when TA-02=true");
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_004].checkpoint_id, CHECKPOINT_IDS.CRM_DREQ_004);
  });

  // ── Test 4: CRM-DREQ-004 assembled when TA-02 = "Yes" ───────────────────

  it('4. CRM-DREQ-004 assembled when TA-02 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "TA-02": "Yes" });
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.CRM_DREQ_004], 'CRM-DREQ-004 must be assembled when TA-02="Yes"');
  });

  // ── Test 5: CRM-DREQ-004 NOT assembled when TA-02 = false ───────────────

  it("5. CRM-DREQ-004 NOT assembled when TA-02 = false", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": false });
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.CRM_DREQ_004],
      undefined,
      "CRM-DREQ-004 must NOT be assembled when TA-02=false"
    );
  });

  // ── Test 6: CRM-DREQ-004 NOT assembled when TA-02 absent ────────────────

  it("6. CRM-DREQ-004 NOT assembled when TA-02 is absent", () => {
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.CRM_DREQ_004],
      undefined,
      "CRM-DREQ-004 must NOT be assembled when TA-02 is absent"
    );
  });

  // ── Test 7: target_model is "crm.stage" for stage-targeted checkpoints ───

  it("7. target_model is \"crm.stage\" for stage-targeted checkpoints", () => {
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(defs[CHECKPOINT_IDS.CRM_FOUND_001].target_model, CRM_STAGE_MODEL,
      "CRM-FOUND-001 must target crm.stage");
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_001].target_model, CRM_STAGE_MODEL,
      "CRM-DREQ-001 must target crm.stage");
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_003].target_model, CRM_STAGE_MODEL,
      "CRM-DREQ-003 must target crm.stage");
  });

  // ── Test 8: target_model is "crm.team" for team-targeted checkpoints ─────

  it("8. target_model is \"crm.team\" for team-targeted checkpoints", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true });
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), answers);
    assert.equal(defs[CHECKPOINT_IDS.CRM_FOUND_002].target_model, CRM_TEAM_MODEL,
      "CRM-FOUND-002 must target crm.team");
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_002].target_model, CRM_TEAM_MODEL,
      "CRM-DREQ-002 must target crm.team");
    assert.equal(defs[CHECKPOINT_IDS.CRM_REC_001].target_model, CRM_TEAM_MODEL,
      "CRM-REC-001 must target crm.team");
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_004].target_model, CRM_TEAM_MODEL,
      "CRM-DREQ-004 must target crm.team");
  });

  // ── Test 9: target_operation is "write" for every assembled definition ───

  it("9. target_operation is \"write\" for every assembled definition", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true });
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_operation,
        CRM_TARGET_OPERATION,
        `${key} target_operation must be write`
      );
    }
  });

  // ── Test 10: intended_changes is null for all definitions ───────────────

  it("10. intended_changes is null for all assembled definitions — honest missing-input behavior", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true });
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].intended_changes,
        null,
        `${key} intended_changes must be null (CRM data not available at assembly time)`
      );
    }
  });

  // ── Test 11: Non-CRM checkpoint IDs not added ────────────────────────────

  it("11. non-CRM checkpoint IDs are not in the assembled map", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true });
    const defs = assembleCrmOperationDefinitions(makeTargetContext(), answers);
    const keys = Object.keys(defs);
    for (const key of keys) {
      assert.ok(
        key.startsWith("CRM-"),
        `Unexpected non-CRM key in map: ${key}`
      );
    }
  });

  // ── Test 12: Return is a plain object ────────────────────────────────────

  it("12. return is a plain object — never null, never array", () => {
    const defs = assembleCrmOperationDefinitions(null, null);
    assert.ok(defs !== null, "result must not be null");
    assert.ok(!Array.isArray(defs), "result must not be an array");
    assert.equal(typeof defs, "object");
  });

  // ── Test 13: null inputs: only unconditionals returned (6 definitions) ───

  it("13. null target_context and null discovery_answers: only unconditional definitions returned (6)", () => {
    const defs = assembleCrmOperationDefinitions(null, null);
    assert.ok(defs[CHECKPOINT_IDS.CRM_FOUND_001], "CRM-FOUND-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.CRM_FOUND_002], "CRM-FOUND-002 must be present");
    assert.ok(defs[CHECKPOINT_IDS.CRM_DREQ_001],  "CRM-DREQ-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.CRM_DREQ_002],  "CRM-DREQ-002 must be present");
    assert.ok(defs[CHECKPOINT_IDS.CRM_DREQ_003],  "CRM-DREQ-003 must be present");
    assert.ok(defs[CHECKPOINT_IDS.CRM_REC_001],   "CRM-REC-001 must be present");
    assert.equal(defs[CHECKPOINT_IDS.CRM_DREQ_004], undefined, "CRM-DREQ-004 must be absent");
    assert.equal(Object.keys(defs).length, 6, "exactly 6 definitions with null inputs");
  });

});
