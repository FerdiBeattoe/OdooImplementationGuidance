// ---------------------------------------------------------------------------
// Users/Roles Operation Definitions Tests
// Tests for: app/shared/users-roles-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional USR definitions assembled (USR-FOUND-001, USR-DREQ-001, USR-DREQ-002)
//   2.  Definitions keyed by correct USR checkpoint IDs
//   3.  USR-FOUND-002 excluded — Informational, no definition needed
//   4.  USR-DREQ-004 assembled only when TA-02 = true
//   5.  USR-DREQ-004 assembled only when TA-02 = "Yes"
//   6.  USR-DREQ-004 NOT assembled when TA-02 = false
//   7.  USR-DREQ-004 NOT assembled when TA-02 absent
//   8.  USR-DREQ-005 assembled only when BM-02 = true
//   9.  USR-DREQ-005 assembled only when BM-02 = "Yes"
//   10. USR-DREQ-005 NOT assembled when BM-02 = false
//   11. USR-DREQ-005 NOT assembled when BM-02 absent
//   12. target_model is "res.users" for user checkpoints
//   13. target_model is "res.groups" for group checkpoints
//   14. target_operation is "write" for every assembled definition
//   15. intended_changes is null for all definitions — honest missing-input behavior
//   16. Non-USR checkpoint IDs not added to the map
//   17. Return is a plain object — never null, never array
//   18. Both TA-02=Yes and BM-02=Yes simultaneously: both conditionals assembled
//   19. null target_context and null discovery_answers: only unconditionals returned
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assembleUsersRolesOperationDefinitions,
  USERS_ROLES_USER_MODEL,
  USERS_ROLES_GROUP_MODEL,
  USERS_ROLES_TARGET_OPERATION,
  USERS_ROLES_EXECUTABLE_CHECKPOINT_IDS,
  USERS_ROLES_OP_DEFS_VERSION,
} from "../users-roles-operation-definitions.js";

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

describe("assembleUsersRolesOperationDefinitions", () => {

  // ── Test 1: Unconditional definitions assembled ─────────────────────────

  it("1. assembles unconditional USR definitions (USR-FOUND-001, USR-DREQ-001, USR-DREQ-002)", () => {
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.ok(defs[CHECKPOINT_IDS.USR_FOUND_001], "USR-FOUND-001 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_001],  "USR-DREQ-001 must be assembled");
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_002],  "USR-DREQ-002 must be assembled");
  });

  // ── Test 2: Keyed by correct checkpoint IDs ─────────────────────────────

  it("2. definitions keyed by exact USR checkpoint IDs", () => {
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.USR_FOUND_001].checkpoint_id,
      CHECKPOINT_IDS.USR_FOUND_001
    );
    assert.equal(
      defs[CHECKPOINT_IDS.USR_DREQ_001].checkpoint_id,
      CHECKPOINT_IDS.USR_DREQ_001
    );
    assert.equal(
      defs[CHECKPOINT_IDS.USR_DREQ_002].checkpoint_id,
      CHECKPOINT_IDS.USR_DREQ_002
    );
  });

  // ── Test 3: USR-FOUND-002 excluded (Informational) ──────────────────────

  it("3. USR-FOUND-002 excluded — Informational checkpoint, no definition needed", () => {
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), makeDiscoveryAnswers());
    assert.equal(
      defs[CHECKPOINT_IDS.USR_FOUND_002],
      undefined,
      "USR-FOUND-002 must NOT have a definition (Informational / Not_Applicable)"
    );
  });

  // ── Test 4: USR-DREQ-004 assembled when TA-02 = true ───────────────────

  it("4. USR-DREQ-004 assembled when TA-02 = true", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_004], "USR-DREQ-004 must be assembled when TA-02=true");
    assert.equal(defs[CHECKPOINT_IDS.USR_DREQ_004].checkpoint_id, CHECKPOINT_IDS.USR_DREQ_004);
  });

  // ── Test 5: USR-DREQ-004 assembled when TA-02 = "Yes" ───────────────────

  it('5. USR-DREQ-004 assembled when TA-02 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "TA-02": "Yes" });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_004], 'USR-DREQ-004 must be assembled when TA-02="Yes"');
  });

  // ── Test 6: USR-DREQ-004 NOT assembled when TA-02 = false ───────────────

  it("6. USR-DREQ-004 NOT assembled when TA-02 = false", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": false });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.USR_DREQ_004],
      undefined,
      "USR-DREQ-004 must NOT be assembled when TA-02=false"
    );
  });

  // ── Test 7: USR-DREQ-004 NOT assembled when TA-02 absent ────────────────

  it("7. USR-DREQ-004 NOT assembled when TA-02 is absent", () => {
    const answers = makeDiscoveryAnswers({});
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.USR_DREQ_004],
      undefined,
      "USR-DREQ-004 must NOT be assembled when TA-02 is absent"
    );
  });

  // ── Test 8: USR-DREQ-005 assembled when BM-02 = true ───────────────────

  it("8. USR-DREQ-005 assembled when BM-02 = true", () => {
    const answers = makeDiscoveryAnswers({ "BM-02": true });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_005], "USR-DREQ-005 must be assembled when BM-02=true");
    assert.equal(defs[CHECKPOINT_IDS.USR_DREQ_005].checkpoint_id, CHECKPOINT_IDS.USR_DREQ_005);
  });

  // ── Test 9: USR-DREQ-005 assembled when BM-02 = "Yes" ───────────────────

  it('9. USR-DREQ-005 assembled when BM-02 = "Yes"', () => {
    const answers = makeDiscoveryAnswers({ "BM-02": "Yes" });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_005], 'USR-DREQ-005 must be assembled when BM-02="Yes"');
  });

  // ── Test 10: USR-DREQ-005 NOT assembled when BM-02 = false ──────────────

  it("10. USR-DREQ-005 NOT assembled when BM-02 = false", () => {
    const answers = makeDiscoveryAnswers({ "BM-02": false });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.USR_DREQ_005],
      undefined,
      "USR-DREQ-005 must NOT be assembled when BM-02=false"
    );
  });

  // ── Test 11: USR-DREQ-005 NOT assembled when BM-02 absent ───────────────

  it("11. USR-DREQ-005 NOT assembled when BM-02 is absent", () => {
    const answers = makeDiscoveryAnswers({});
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.equal(
      defs[CHECKPOINT_IDS.USR_DREQ_005],
      undefined,
      "USR-DREQ-005 must NOT be assembled when BM-02 is absent"
    );
  });

  // ── Test 12: target_model is "res.users" for user checkpoints ───────────

  it("12. target_model is \"res.users\" for user-targeted checkpoints", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.equal(defs[CHECKPOINT_IDS.USR_FOUND_001].target_model, USERS_ROLES_USER_MODEL);
    assert.equal(defs[CHECKPOINT_IDS.USR_DREQ_001].target_model,  USERS_ROLES_USER_MODEL);
    assert.equal(defs[CHECKPOINT_IDS.USR_DREQ_004].target_model,  USERS_ROLES_USER_MODEL);
  });

  // ── Test 13: target_model is "res.groups" for group checkpoints ─────────

  it("13. target_model is \"res.groups\" for group-targeted checkpoints", () => {
    const answers = makeDiscoveryAnswers({ "BM-02": true });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.equal(defs[CHECKPOINT_IDS.USR_DREQ_002].target_model,  USERS_ROLES_GROUP_MODEL);
    assert.equal(defs[CHECKPOINT_IDS.USR_DREQ_005].target_model,  USERS_ROLES_GROUP_MODEL);
  });

  // ── Test 14: target_operation is "write" for every assembled definition ──

  it("14. target_operation is \"write\" for every assembled definition", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true, "BM-02": true });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].target_operation,
        USERS_ROLES_TARGET_OPERATION,
        `${key} target_operation must be write`
      );
    }
  });

  // ── Test 15: intended_changes is null for all definitions ───────────────

  it("15. intended_changes is null for all assembled definitions — honest missing-input behavior", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true, "BM-02": true });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    for (const key of Object.keys(defs)) {
      assert.equal(
        defs[key].intended_changes,
        null,
        `${key} intended_changes must be null (provisioning data not available at assembly time)`
      );
    }
  });

  // ── Test 16: Non-USR checkpoint IDs not added ────────────────────────────

  it("16. non-USR checkpoint IDs are not in the assembled map", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": true, "BM-02": true });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    const keys = Object.keys(defs);
    for (const key of keys) {
      assert.ok(
        key.startsWith("USR-"),
        `Unexpected non-USR key in map: ${key}`
      );
    }
  });

  // ── Test 17: Return is a plain object ────────────────────────────────────

  it("17. return is a plain object — never null, never array", () => {
    const defs = assembleUsersRolesOperationDefinitions(null, null);
    assert.ok(defs !== null, "result must not be null");
    assert.ok(!Array.isArray(defs), "result must not be an array");
    assert.equal(typeof defs, "object");
  });

  // ── Test 18: Both TA-02=Yes and BM-02=Yes simultaneously ────────────────

  it("18. both TA-02=Yes and BM-02=Yes: both conditionals assembled alongside unconditionals", () => {
    const answers = makeDiscoveryAnswers({ "TA-02": "Yes", "BM-02": "Yes" });
    const defs = assembleUsersRolesOperationDefinitions(makeTargetContext(), answers);
    assert.ok(defs[CHECKPOINT_IDS.USR_FOUND_001], "USR-FOUND-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_001],  "USR-DREQ-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_002],  "USR-DREQ-002 must be present");
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_004],  "USR-DREQ-004 must be present (TA-02=Yes)");
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_005],  "USR-DREQ-005 must be present (BM-02=Yes)");
    assert.equal(Object.keys(defs).length, 5, "exactly 5 definitions when both conditionals active");
  });

  // ── Test 19: null inputs: only unconditionals returned ───────────────────

  it("19. null target_context and null discovery_answers: only unconditional definitions returned", () => {
    const defs = assembleUsersRolesOperationDefinitions(null, null);
    assert.ok(defs[CHECKPOINT_IDS.USR_FOUND_001], "USR-FOUND-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_001],  "USR-DREQ-001 must be present");
    assert.ok(defs[CHECKPOINT_IDS.USR_DREQ_002],  "USR-DREQ-002 must be present");
    assert.equal(defs[CHECKPOINT_IDS.USR_DREQ_004], undefined, "USR-DREQ-004 must be absent");
    assert.equal(defs[CHECKPOINT_IDS.USR_DREQ_005], undefined, "USR-DREQ-005 must be absent");
    assert.equal(Object.keys(defs).length, 3, "exactly 3 definitions with null inputs");
  });

});
