// ---------------------------------------------------------------------------
// Blocker Engine Tests
// Tests for: app/shared/blocker-engine.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1. missing prerequisite blocker (dependency_unmet)
//   2. missing mandatory user confirmation blocker (owner_confirmation_missing)
//   3. unresolved dependency blocker (cross_domain_dependency)
//   4. insufficient evidence blocker (evidence_missing)
//   5. non-blocked checkpoint produces no blocker record
//   6. recommended/optional checkpoint does not become a go-live (critical) blocker
//   7. determinism
//   8. contract-shape compliance
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeBlockers,
  createBlockerRecord,
  createBlockers,
  BLOCKER_ENGINE_VERSION,
  BLOCKER_TYPE,
  BLOCKER_SEVERITY,
} from "../blocker-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal checkpoint record for use in tests.
 * Defaults match a non-blocked, system-detectable, complete checkpoint.
 */
function makeCheckpoint({
  checkpoint_id = "FND-FOUND-001",
  domain = "foundation",
  checkpoint_class = "Foundational",
  validation_source = "System_Detectable",
  status = "Complete",
  dependencies = [],
  evidence_required = [],
  evidence_items = {},
} = {}) {
  return {
    checkpoint_id,
    domain,
    checkpoint_class,
    validation_source,
    status,
    dependencies,
    evidence_required,
    evidence_items,
  };
}

/**
 * Builds a validation result container with the given records.
 */
function makeValidatedCheckpoints(records = []) {
  return {
    records,
    engine_version: "1.0.0",
    validated_at: new Date().toISOString(),
  };
}

/**
 * Builds a single validation record.
 */
function makeValidationRecord({
  checkpoint_id = "FND-FOUND-001",
  validation_source = "System_Detectable",
  validation_pass = true,
  validation_status = "Pass",
  answer_refs = [],
  missing_answer_refs = [],
} = {}) {
  return {
    checkpoint_id,
    validation_source,
    validation_pass,
    validation_status,
    answer_refs,
    missing_answer_refs,
  };
}

/**
 * Finds the blocker record for a given checkpoint_id in the result.
 */
function findBlocker(result, checkpointId) {
  return result.active_blockers.find(
    (b) => b.source_checkpoint_id === checkpointId
  ) ?? null;
}

// ---------------------------------------------------------------------------
// Section 1 — createBlockers() factory shape
// ---------------------------------------------------------------------------

describe("createBlockers() factory", () => {
  it("returns object with all 6 contract fields", () => {
    const out = createBlockers();
    assert.ok(Object.prototype.hasOwnProperty.call(out, "active_blockers"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "total_count"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "by_severity"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "by_stage"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "by_domain"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "highest_priority_blocker"));
  });

  it("defaults to empty state", () => {
    const out = createBlockers();
    assert.deepEqual(out.active_blockers, []);
    assert.equal(out.total_count, 0);
    assert.equal(out.highest_priority_blocker, null);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — createBlockerRecord() factory shape
// ---------------------------------------------------------------------------

describe("createBlockerRecord() factory", () => {
  it("returns exactly the 12 contract fields", () => {
    const rec = createBlockerRecord({
      checkpoint_id:          "FND-FOUND-001",
      domain:                 "foundation",
      checkpoint_class:       "Foundational",
      blocker_type:           BLOCKER_TYPE.DEPENDENCY_UNMET,
      blocked_reason:         "reason",
      blocking_checkpoint_id: null,
      blocking_domain_id:     null,
      resolution_action:      "action",
      created_at:             "2026-01-01T00:00:00.000Z",
    });

    const expected = [
      "blocker_id",
      "scope",
      "source_checkpoint_id",
      "source_domain_id",
      "source_stage_id",
      "blocker_type",
      "blocked_reason",
      "blocking_checkpoint_id",
      "blocking_domain_id",
      "severity",
      "created_at",
      "resolution_action",
    ].sort();

    assert.deepEqual(Object.keys(rec).sort(), expected);
  });

  it("derives blocker_id as {checkpoint_id}:blocker", () => {
    const rec = createBlockerRecord({ checkpoint_id: "FND-FOUND-001" });
    assert.equal(rec.blocker_id, "FND-FOUND-001:blocker");
  });

  it("sets scope to checkpoint", () => {
    const rec = createBlockerRecord({ checkpoint_id: "X" });
    assert.equal(rec.scope, "checkpoint");
  });

  it("sets source_stage_id to null (first pass)", () => {
    const rec = createBlockerRecord({ checkpoint_id: "X" });
    assert.equal(rec.source_stage_id, null);
  });

  it("computes critical severity for Foundational checkpoint", () => {
    const rec = createBlockerRecord({ checkpoint_id: "X", checkpoint_class: "Foundational" });
    assert.equal(rec.severity, BLOCKER_SEVERITY.CRITICAL);
  });

  it("computes critical severity for Domain_Required checkpoint", () => {
    const rec = createBlockerRecord({ checkpoint_id: "X", checkpoint_class: "Domain_Required" });
    assert.equal(rec.severity, BLOCKER_SEVERITY.CRITICAL);
  });

  it("computes standard severity for Go_Live checkpoint", () => {
    const rec = createBlockerRecord({ checkpoint_id: "X", checkpoint_class: "Go_Live" });
    assert.equal(rec.severity, BLOCKER_SEVERITY.STANDARD);
  });

  it("computes standard severity for Recommended checkpoint", () => {
    const rec = createBlockerRecord({ checkpoint_id: "X", checkpoint_class: "Recommended" });
    assert.equal(rec.severity, BLOCKER_SEVERITY.STANDARD);
  });

  it("computes standard severity for Optional checkpoint", () => {
    const rec = createBlockerRecord({ checkpoint_id: "X", checkpoint_class: "Optional" });
    assert.equal(rec.severity, BLOCKER_SEVERITY.STANDARD);
  });
});

// ---------------------------------------------------------------------------
// Section 3 — computeBlockers() output container shape
// ---------------------------------------------------------------------------

describe("computeBlockers() — output container shape", () => {
  it("returns createBlockers() shape with all required fields", () => {
    const result = computeBlockers([], makeValidatedCheckpoints([]));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "active_blockers"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "total_count"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "by_severity"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "by_stage"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "by_domain"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "highest_priority_blocker"));
  });

  it("by_stage is null (first pass — requires stage routing)", () => {
    const result = computeBlockers(
      [makeCheckpoint({ status: "Not_Started", dependencies: [] })],
      makeValidatedCheckpoints([makeValidationRecord({ validation_status: "Pass", validation_pass: true })])
    );
    assert.equal(result.by_stage, null);
  });

  it("returns empty blockers for empty checkpoints input", () => {
    const result = computeBlockers([], makeValidatedCheckpoints([]));
    assert.deepEqual(result.active_blockers, []);
    assert.equal(result.total_count, 0);
    assert.equal(result.highest_priority_blocker, null);
  });

  it("total_count matches active_blockers.length", () => {
    const cp1 = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "User_Confirmed",
      status: "Not_Started",
    });
    const cp2 = makeCheckpoint({
      checkpoint_id: "FND-FOUND-002",
      validation_source: "User_Confirmed",
      status: "Not_Started",
    });
    const vr1 = makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_source: "User_Confirmed", validation_status: "Pending_User_Input", validation_pass: false, missing_answer_refs: ["BM-02"] });
    const vr2 = makeValidationRecord({ checkpoint_id: "FND-FOUND-002", validation_source: "User_Confirmed", validation_status: "Pending_User_Input", validation_pass: false, missing_answer_refs: ["BM-04"] });

    const result = computeBlockers([cp1, cp2], makeValidatedCheckpoints([vr1, vr2]));
    assert.equal(result.total_count, result.active_blockers.length);
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Missing prerequisite blocker (dependency_unmet)
// ---------------------------------------------------------------------------

describe("dependency_unmet blocker", () => {
  it("produces dependency_unmet when dep checkpoint is Not_Started", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      domain: "foundation",
      checkpoint_class: "Domain_Required",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "FND-DREQ-001");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.DEPENDENCY_UNMET);
  });

  it("produces dependency_unmet when dep checkpoint is In_Progress", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", status: "In_Progress" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-DREQ-001").blocker_type, BLOCKER_TYPE.DEPENDENCY_UNMET);
  });

  it("does NOT produce dependency_unmet when dep is Complete", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", status: "Complete" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-DREQ-001"), null);
  });

  it("does NOT produce dependency_unmet when dep is Deferred", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", status: "Deferred" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-DREQ-001"), null);
  });

  it("blocker traces to correct checkpoint_id and blocking_checkpoint_id", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation", status: "Not_Started" });
    const cp = makeCheckpoint({ checkpoint_id: "FND-DREQ-001", domain: "foundation", checkpoint_class: "Domain_Required", status: "Not_Started", dependencies: ["FND-FOUND-001"] });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001" }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001" }),
      ])
    );
    const blocker = findBlocker(result, "FND-DREQ-001");
    assert.equal(blocker.source_checkpoint_id, "FND-DREQ-001");
    assert.equal(blocker.blocking_checkpoint_id, "FND-FOUND-001");
    assert.equal(blocker.blocking_domain_id, "foundation");
  });

  it("picks first unmet dependency when multiple exist", () => {
    const dep1 = makeCheckpoint({ checkpoint_id: "A", status: "Complete" });
    const dep2 = makeCheckpoint({ checkpoint_id: "B", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "C",
      status: "Not_Started",
      dependencies: ["A", "B"],
    });
    const result = computeBlockers(
      [dep1, dep2, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "A", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "B", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "C", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "C");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.DEPENDENCY_UNMET);
    assert.equal(blocker.blocking_checkpoint_id, "B");
  });
});

// ---------------------------------------------------------------------------
// Section 5 — Missing mandatory user confirmation blocker (owner_confirmation_missing)
// ---------------------------------------------------------------------------

describe("owner_confirmation_missing blocker", () => {
  it("produces owner_confirmation_missing for User_Confirmed with Pending_User_Input", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-004",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-004",
      validation_source: "User_Confirmed",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: [],
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    const blocker = findBlocker(result, "FND-FOUND-004");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.OWNER_CONFIRMATION_MISSING);
  });

  it("produces owner_confirmation_missing for Both with Pending_User_Input", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-002",
      validation_source: "Both",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-002",
      validation_source: "Both",
      validation_pass: false,
      validation_status: "Pending_User_Input",
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.equal(findBlocker(result, "FND-FOUND-002").blocker_type, BLOCKER_TYPE.OWNER_CONFIRMATION_MISSING);
  });

  it("does NOT produce owner_confirmation_missing for dependency-free root checkpoints on first run", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "Both",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "Both",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: [],
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.equal(findBlocker(result, "FND-FOUND-001"), null);
  });

  it("does NOT produce owner_confirmation_missing when validation passes", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-006",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-006",
      validation_source: "User_Confirmed",
      validation_pass: true,
      validation_status: "Pass",
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.equal(findBlocker(result, "FND-FOUND-006"), null);
  });

  it("does NOT produce owner_confirmation_missing for System_Detectable with Pending_System_Check", () => {
    // System_Detectable never gets Pending_User_Input; but even if validation is non-Pass,
    // the owner_confirmation rule only fires for User_Confirmed or Both.
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      validation_pass: false,
      validation_status: "Pending_User_Input", // edge case: wrong status for this source
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    // System_Detectable should not trigger owner_confirmation_missing
    const blocker = findBlocker(result, "FND-FOUND-001");
    if (blocker !== null) {
      assert.notEqual(blocker.blocker_type, BLOCKER_TYPE.OWNER_CONFIRMATION_MISSING);
    }
  });

  it("owner_confirmation_missing takes priority over dependency_unmet", () => {
    // Checkpoint has both: missing user input AND an unmet dependency.
    // R3 priority: owner_confirmation_missing wins.
    const dep = makeCheckpoint({ checkpoint_id: "DEP-001", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "USR-DREQ-004",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: ["DEP-001"],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "USR-DREQ-004",
      validation_source: "User_Confirmed",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: ["TA-02"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP-001", validation_status: "Pass", validation_pass: true }),
        vr,
      ])
    );
    const blocker = findBlocker(result, "USR-DREQ-004");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.OWNER_CONFIRMATION_MISSING);
  });

  it("blocker traces to correct checkpoint_id and source_domain_id", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-004",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-004",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: [],
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    const blocker = findBlocker(result, "FND-FOUND-004");
    assert.equal(blocker.source_checkpoint_id, "FND-FOUND-004");
    assert.equal(blocker.source_domain_id, "foundation");
  });

  // -------------------------------------------------------------------------
  // Message truthfulness: unconditional Both vs. conditional Both
  // -------------------------------------------------------------------------

  it("unconditional Both + no answer refs: blocked_reason names evidence submission, not discovery answers", () => {
    // Simulates FND-DREQ-001: validation_source Both, no discovery-question mapping,
    // missing_answer_refs is empty. The message must NOT say "discovery answers".
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      validation_source: "Both",
      status: "Not_Started",
      dependencies: ["FND-FOUND-002"],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-DREQ-001",
      validation_source: "Both",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: [],
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    const blocker = findBlocker(result, "FND-DREQ-001");
    assert.ok(blocker !== null, "FND-DREQ-001 must remain blocked");
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.OWNER_CONFIRMATION_MISSING);
    assert.ok(
      !blocker.blocked_reason.includes("discovery answers"),
      `blocked_reason must not mention discovery answers for unconditional Both; got: "${blocker.blocked_reason}"`
    );
    assert.ok(
      blocker.blocked_reason.includes("evidence") || blocker.blocked_reason.includes("confirmation"),
      `blocked_reason must reference evidence or confirmation; got: "${blocker.blocked_reason}"`
    );
    assert.ok(
      !blocker.resolution_action.includes("discovery answers"),
      `resolution_action must not mention discovery answers for unconditional Both; got: "${blocker.resolution_action}"`
    );
  });

  it("conditional Both + real missing answer refs: blocked_reason names discovery answers", () => {
    // A Both checkpoint with actual missing discovery answers must still
    // produce the discovery-answer guidance, unchanged.
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-002",
      validation_source: "Both",
      status: "Not_Started",
      dependencies: ["FND-FOUND-002", "FND-FOUND-005"],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-DREQ-002",
      validation_source: "Both",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: ["BM-02", "TA-01"],
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    const blocker = findBlocker(result, "FND-DREQ-002");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.OWNER_CONFIRMATION_MISSING);
    assert.ok(
      blocker.blocked_reason.includes("discovery answers"),
      `blocked_reason must mention discovery answers when missing_answer_refs is non-empty; got: "${blocker.blocked_reason}"`
    );
    assert.ok(
      blocker.blocked_reason.includes("BM-02"),
      `blocked_reason must include at least one missing ref; got: "${blocker.blocked_reason}"`
    );
    assert.ok(
      blocker.resolution_action.includes("discovery answers"),
      `resolution_action must name discovery answers when refs are missing; got: "${blocker.resolution_action}"`
    );
  });
});

// ---------------------------------------------------------------------------
// Section 6 — Unresolved dependency blocker (cross_domain_dependency)
// ---------------------------------------------------------------------------

describe("cross_domain_dependency blocker", () => {
  it("produces cross_domain_dependency when dep checkpoint_id not in checkpoints array", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "INV-DREQ-001",
      domain: "inventory",
      checkpoint_class: "Domain_Required",
      status: "Not_Started",
      dependencies: ["MAS-DREQ-001"],
      // MAS-DREQ-001 is NOT in the checkpoints array (unactivated domain)
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "INV-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "INV-DREQ-001");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.CROSS_DOMAIN_DEPENDENCY);
  });

  it("blocking_checkpoint_id is set to the missing dep id", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      status: "Not_Started",
      dependencies: ["PHANTOM-001"],
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "SAL-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "SAL-DREQ-001");
    assert.equal(blocker.blocking_checkpoint_id, "PHANTOM-001");
  });

  it("cross_domain_dependency takes priority over dependency_unmet (P2 before P3)", () => {
    // Both a missing-from-array dep AND an existing unmet dep.
    // cross_domain_dependency should win (P2 fires first in dep loop).
    const existingDep = makeCheckpoint({ checkpoint_id: "A", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "B",
      status: "Not_Started",
      // PHANTOM not in array; A is in array but Not_Started
      dependencies: ["PHANTOM", "A"],
    });
    const result = computeBlockers(
      [existingDep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "A", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "B", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "B");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.CROSS_DOMAIN_DEPENDENCY);
    assert.equal(blocker.blocking_checkpoint_id, "PHANTOM");
  });

  it("does NOT produce cross_domain_dependency when all deps are in array", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", status: "Complete" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "FND-DREQ-001");
    assert.equal(blocker, null);
  });
});

// ---------------------------------------------------------------------------
// Section 7 — Insufficient evidence blocker (evidence_missing)
// ---------------------------------------------------------------------------

describe("evidence_missing blocker", () => {
  it("produces evidence_missing for In_Progress checkpoint with unprovided evidence", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "System_Detectable",
      status: "In_Progress",
      dependencies: [],
      evidence_required: ["fiscal_year_start_date", "fiscal_year_end_date"],
      evidence_items: {}, // nothing provided yet
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "FND-FOUND-001");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.EVIDENCE_MISSING);
  });

  it("produces evidence_missing for Ready_For_Review with unprovided evidence", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "Ready_For_Review",
      dependencies: [],
      evidence_required: ["item_a"],
      evidence_items: { item_a: { provided: false } },
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-FOUND-001").blocker_type, BLOCKER_TYPE.EVIDENCE_MISSING);
  });

  it("does NOT produce evidence_missing for Not_Started checkpoint", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "Not_Started",
      dependencies: [],
      evidence_required: ["item_a", "item_b"],
      evidence_items: {},
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-FOUND-001"), null);
  });

  it("does NOT produce evidence_missing when all evidence is provided", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "In_Progress",
      dependencies: [],
      evidence_required: ["item_a"],
      evidence_items: { item_a: { provided: true, source: "system_detected", value: "2026-01-01" } },
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-FOUND-001"), null);
  });

  it("does NOT produce evidence_missing when evidence_required is empty", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "In_Progress",
      dependencies: [],
      evidence_required: [],
      evidence_items: {},
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-FOUND-001"), null);
  });

  it("evidence_missing fires after dependency checks (P4 last)", () => {
    // Checkpoint is In_Progress, has missing evidence, AND has an unmet dep.
    // dependency_unmet should fire first (P3 before P4).
    const dep = makeCheckpoint({ checkpoint_id: "DEP-001", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "In_Progress",
      dependencies: ["DEP-001"],
      evidence_required: ["item_a"],
      evidence_items: {},
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "FND-FOUND-001");
    assert.ok(blocker !== null);
    assert.equal(blocker.blocker_type, BLOCKER_TYPE.DEPENDENCY_UNMET);
  });
});

// ---------------------------------------------------------------------------
// Section 8 — Non-blocked checkpoint produces no blocker record
// ---------------------------------------------------------------------------

describe("Non-blocked checkpoint — no blocker record", () => {
  it("complete System_Detectable checkpoint with no deps produces no blocker", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "Complete",
      dependencies: [],
      evidence_required: [],
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-FOUND-001"), null);
  });

  it("User_Confirmed checkpoint with Pass validation and all deps met produces no blocker", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP-001", status: "Complete" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-006",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: ["DEP-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({
          checkpoint_id: "FND-FOUND-006",
          validation_source: "User_Confirmed",
          validation_pass: true,
          validation_status: "Pass",
          answer_refs: ["BM-02"],
        }),
      ])
    );
    assert.equal(findBlocker(result, "FND-FOUND-006"), null);
  });

  it("In_Progress checkpoint with all evidence provided produces no blocker", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "In_Progress",
      dependencies: [],
      evidence_required: ["item_a", "item_b"],
      evidence_items: {
        item_a: { provided: true, source: "system_detected", value: "v1" },
        item_b: { provided: true, source: "user_confirmed", value: "v2" },
      },
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-FOUND-001"), null);
  });

  it("checkpoint with no deps, no validation issues, Not_Started produces no blocker", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "Not_Started",
      dependencies: [],
      evidence_required: [],
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-FOUND-001"), null);
  });
});

// ---------------------------------------------------------------------------
// Section 9 — Recommended / Optional do not become go-live (critical) blockers
// ---------------------------------------------------------------------------

describe("Recommended / Optional checkpoint severity", () => {
  it("Recommended checkpoint with missing user confirmation has standard severity", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "CRM-REC-001",
      domain: "crm",
      checkpoint_class: "Recommended",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "CRM-REC-001",
      validation_source: "User_Confirmed",
      validation_pass: false,
      validation_status: "Pending_User_Input",
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    const blocker = findBlocker(result, "CRM-REC-001");
    assert.ok(blocker !== null);
    assert.equal(blocker.severity, BLOCKER_SEVERITY.STANDARD);
    assert.notEqual(blocker.severity, BLOCKER_SEVERITY.CRITICAL);
  });

  it("Optional checkpoint with unmet dependency has standard severity", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "MNT-REC-001",
      domain: "maintenance",
      checkpoint_class: "Optional",
      validation_source: "System_Detectable",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "MNT-REC-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "MNT-REC-001");
    assert.ok(blocker !== null);
    assert.equal(blocker.severity, BLOCKER_SEVERITY.STANDARD);
  });

  it("Foundational checkpoint with unmet dependency has critical severity", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "System_Detectable",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    const blocker = findBlocker(result, "FND-DREQ-001");
    assert.ok(blocker !== null);
    assert.equal(blocker.severity, BLOCKER_SEVERITY.CRITICAL);
  });

  it("Go_Live checkpoint blocker has standard severity", () => {
    const dep = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-GL-001",
      domain: "sales",
      checkpoint_class: "Go_Live",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: ["FND-FOUND-001"],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "SAL-GL-001",
      validation_source: "User_Confirmed",
      validation_pass: true,
      validation_status: "Pass",
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        vr,
      ])
    );
    const blocker = findBlocker(result, "SAL-GL-001");
    assert.ok(blocker !== null);
    assert.equal(blocker.severity, BLOCKER_SEVERITY.STANDARD);
  });
});

// ---------------------------------------------------------------------------
// Section 10 — by_severity and by_domain aggregations
// ---------------------------------------------------------------------------

describe("by_severity and by_domain aggregations", () => {
  it("by_severity counts match active blockers", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const critical = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Not_Started",
      dependencies: ["DEP"],
    });
    const standard = makeCheckpoint({
      checkpoint_id: "CRM-REC-001",
      checkpoint_class: "Recommended",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: [],
    });
    const result = computeBlockers(
      [dep, critical, standard],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({
          checkpoint_id: "CRM-REC-001",
          validation_source: "User_Confirmed",
          validation_pass: false,
          validation_status: "Pending_User_Input",
        }),
      ])
    );
    assert.ok(result.by_severity !== null);
    assert.equal(result.by_severity.critical, 1);
    assert.equal(result.by_severity.standard, 1);
  });

  it("by_domain groups blockers by source_domain_id", () => {
    const dep1 = makeCheckpoint({ checkpoint_id: "D1", status: "Not_Started", domain: "foundation" });
    const cp1 = makeCheckpoint({ checkpoint_id: "C1", domain: "foundation", checkpoint_class: "Foundational", status: "Not_Started", dependencies: ["D1"] });
    const dep2 = makeCheckpoint({ checkpoint_id: "D2", status: "Not_Started", domain: "sales" });
    const cp2 = makeCheckpoint({ checkpoint_id: "C2", domain: "sales", checkpoint_class: "Domain_Required", status: "Not_Started", dependencies: ["D2"] });

    const result = computeBlockers(
      [dep1, cp1, dep2, cp2],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "D1", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "C1", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "D2", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "C2", validation_status: "Pass", validation_pass: true }),
      ])
    );

    assert.ok(result.by_domain !== null);
    assert.equal(result.by_domain["foundation"], 1);
    assert.equal(result.by_domain["sales"], 1);
  });

  it("by_severity and by_domain are null when no blockers exist", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      status: "Complete",
      dependencies: [],
    });
    const result = computeBlockers(
      [cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(result.by_severity, null);
    assert.equal(result.by_domain, null);
  });
});

// ---------------------------------------------------------------------------
// Section 11 — highest_priority_blocker
// ---------------------------------------------------------------------------

describe("highest_priority_blocker", () => {
  it("is null when no blockers exist", () => {
    const result = computeBlockers([], makeValidatedCheckpoints([]));
    assert.equal(result.highest_priority_blocker, null);
  });

  it("is the critical blocker when both critical and standard exist", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const critical = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      domain: "foundation",
      checkpoint_class: "Foundational",
      status: "Not_Started",
      dependencies: ["DEP"],
    });
    const standard = makeCheckpoint({
      checkpoint_id: "CRM-REC-001",
      domain: "crm",
      checkpoint_class: "Recommended",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: [],
    });
    const result = computeBlockers(
      [dep, critical, standard],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-FOUND-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "CRM-REC-001", validation_source: "User_Confirmed", validation_pass: false, validation_status: "Pending_User_Input" }),
      ])
    );
    assert.ok(result.highest_priority_blocker !== null);
    assert.equal(result.highest_priority_blocker.severity, BLOCKER_SEVERITY.CRITICAL);
  });

  it("is the only blocker when one exists", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-004",
      validation_source: "User_Confirmed",
      checkpoint_class: "Foundational",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-004",
      validation_source: "User_Confirmed",
      validation_pass: false,
      validation_status: "Pending_User_Input",
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.ok(result.highest_priority_blocker !== null);
    assert.equal(result.highest_priority_blocker.source_checkpoint_id, "FND-FOUND-004");
  });
});

// ---------------------------------------------------------------------------
// Section 12 — Contract-shape compliance
// ---------------------------------------------------------------------------

describe("Contract-shape compliance", () => {
  const EXPECTED_BLOCKER_KEYS = [
    "blocker_id",
    "scope",
    "source_checkpoint_id",
    "source_domain_id",
    "source_stage_id",
    "blocker_type",
    "blocked_reason",
    "blocking_checkpoint_id",
    "blocking_domain_id",
    "severity",
    "created_at",
    "resolution_action",
  ].sort();

  it("every blocker record has exactly the 12 contract fields", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      checkpoint_class: "Domain_Required",
      status: "Not_Started",
      dependencies: ["DEP"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    for (const blocker of result.active_blockers) {
      assert.deepEqual(Object.keys(blocker).sort(), EXPECTED_BLOCKER_KEYS);
    }
  });

  it("blocker_id format is {checkpoint_id}:blocker", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-004",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-004",
      validation_pass: false,
      validation_status: "Pending_User_Input",
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.equal(result.active_blockers[0].blocker_id, "FND-FOUND-004:blocker");
  });

  it("scope is always checkpoint", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-004",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-004",
      validation_pass: false,
      validation_status: "Pending_User_Input",
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.equal(result.active_blockers[0].scope, "checkpoint");
  });

  it("source_stage_id is null for all first-pass blockers", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const cp = makeCheckpoint({ checkpoint_id: "FND-DREQ-001", checkpoint_class: "Domain_Required", status: "Not_Started", dependencies: ["DEP"] });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    for (const blocker of result.active_blockers) {
      assert.equal(blocker.source_stage_id, null);
    }
  });

  it("severity is one of critical or standard", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const cp = makeCheckpoint({ checkpoint_id: "FND-DREQ-001", checkpoint_class: "Domain_Required", status: "Not_Started", dependencies: ["DEP"] });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    for (const blocker of result.active_blockers) {
      assert.ok(
        blocker.severity === BLOCKER_SEVERITY.CRITICAL || blocker.severity === BLOCKER_SEVERITY.STANDARD,
        `Unexpected severity: ${blocker.severity}`
      );
    }
  });

  it("blocker_type is one of the known BLOCKER_TYPE values", () => {
    const knownTypes = Object.values(BLOCKER_TYPE);
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const cp = makeCheckpoint({ checkpoint_id: "FND-DREQ-001", checkpoint_class: "Domain_Required", status: "Not_Started", dependencies: ["DEP"] });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    for (const blocker of result.active_blockers) {
      assert.ok(knownTypes.includes(blocker.blocker_type), `Unknown blocker_type: ${blocker.blocker_type}`);
    }
  });

  it("container does not contain readiness, deferment, preview, or execution fields", () => {
    const result = computeBlockers([], makeValidatedCheckpoints([]));
    assert.equal(result.go_live_readiness,    undefined);
    assert.equal(result.readiness_state,      undefined);
    assert.equal(result.deferments,           undefined);
    assert.equal(result.previews,             undefined);
    assert.equal(result.executions,           undefined);
    assert.equal(result.execution_candidates, undefined);
  });
});

// ---------------------------------------------------------------------------
// Section 13 — Determinism
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("identical inputs produce blockers with identical types and tracing fields", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const cp1 = makeCheckpoint({ checkpoint_id: "FND-DREQ-001", checkpoint_class: "Domain_Required", status: "Not_Started", dependencies: ["DEP"] });
    const cp2 = makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed", checkpoint_class: "Foundational", status: "Not_Started", dependencies: [] });

    const validationRecords = [
      makeValidationRecord({ checkpoint_id: "DEP", validation_status: "Pass", validation_pass: true }),
      makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      makeValidationRecord({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed", validation_pass: false, validation_status: "Pending_User_Input" }),
    ];

    const r1 = computeBlockers([dep, cp1, cp2], makeValidatedCheckpoints(validationRecords));
    const r2 = computeBlockers([dep, cp1, cp2], makeValidatedCheckpoints(validationRecords));

    assert.equal(r1.active_blockers.length, r2.active_blockers.length);
    assert.equal(r1.total_count, r2.total_count);
    for (let i = 0; i < r1.active_blockers.length; i++) {
      assert.equal(r1.active_blockers[i].source_checkpoint_id, r2.active_blockers[i].source_checkpoint_id);
      assert.equal(r1.active_blockers[i].blocker_type,         r2.active_blockers[i].blocker_type);
      assert.equal(r1.active_blockers[i].severity,             r2.active_blockers[i].severity);
      assert.equal(r1.active_blockers[i].blocker_id,           r2.active_blockers[i].blocker_id);
      assert.equal(r1.active_blockers[i].blocking_checkpoint_id, r2.active_blockers[i].blocking_checkpoint_id);
    }
  });

  it("output order matches input checkpoint order", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const A = makeCheckpoint({ checkpoint_id: "A", checkpoint_class: "Domain_Required", status: "Not_Started", dependencies: ["DEP"] });
    const B = makeCheckpoint({ checkpoint_id: "B", checkpoint_class: "Foundational",    status: "Not_Started", dependencies: ["DEP"] });

    const result = computeBlockers(
      [dep, A, B],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "A",   validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "B",   validation_status: "Pass", validation_pass: true }),
      ])
    );

    assert.equal(result.active_blockers[0].source_checkpoint_id, "A");
    assert.equal(result.active_blockers[1].source_checkpoint_id, "B");
  });

  it("adding a non-blocking checkpoint does not change existing blocker records", () => {
    const dep = makeCheckpoint({ checkpoint_id: "DEP", status: "Not_Started" });
    const blocked = makeCheckpoint({ checkpoint_id: "FND-DREQ-001", checkpoint_class: "Domain_Required", status: "Not_Started", dependencies: ["DEP"] });
    const clean = makeCheckpoint({ checkpoint_id: "CLEAN", validation_source: "System_Detectable", status: "Complete", dependencies: [] });

    const validationRecords = [
      makeValidationRecord({ checkpoint_id: "DEP",       validation_status: "Pass", validation_pass: true }),
      makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      makeValidationRecord({ checkpoint_id: "CLEAN",     validation_status: "Pass", validation_pass: true }),
    ];

    const r1 = computeBlockers([dep, blocked],       makeValidatedCheckpoints(validationRecords.slice(0, 2)));
    const r2 = computeBlockers([dep, blocked, clean], makeValidatedCheckpoints(validationRecords));

    assert.equal(r1.active_blockers.length, r2.active_blockers.length);
    assert.equal(
      r1.active_blockers[0].source_checkpoint_id,
      r2.active_blockers[0].source_checkpoint_id
    );
  });
});

// ---------------------------------------------------------------------------
// Section 14 — Input validation
// ---------------------------------------------------------------------------

describe("computeBlockers() — input validation", () => {
  it("throws if checkpoints is not an array", () => {
    assert.throws(
      () => computeBlockers(null, makeValidatedCheckpoints([])),
      /checkpoints must be an array/
    );
  });

  it("throws if validatedCheckpoints is null", () => {
    assert.throws(
      () => computeBlockers([], null),
      /validatedCheckpoints must be an object/
    );
  });

  it("throws if validatedCheckpoints.records is not an array", () => {
    assert.throws(
      () => computeBlockers([], { records: null }),
      /validatedCheckpoints must be an object/
    );
  });
});

// ---------------------------------------------------------------------------
// Section 15 — Complete / Deferred checkpoint guard
// ---------------------------------------------------------------------------

describe("Complete and Deferred checkpoints generate no blockers", () => {
  it("Complete checkpoint with User_Confirmed Pending_User_Input returns null (no blocker)", () => {
    // Without the guard, P1 would fire: validation_source=User_Confirmed + Pending_User_Input.
    // With the guard, status=Complete short-circuits before P1.
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "User_Confirmed",
      status: "Complete",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "User_Confirmed",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: ["BM-02"],
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.equal(result.active_blockers.length, 0);
    assert.equal(findBlocker(result, "FND-FOUND-001"), null);
    assert.equal(result.total_count, 0);
  });

  it("Deferred checkpoint with User_Confirmed Pending_User_Input returns null (no blocker)", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "USR-DREQ-001",
      domain: "users_roles",
      checkpoint_class: "Domain_Required",
      validation_source: "User_Confirmed",
      status: "Deferred",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "USR-DREQ-001",
      validation_source: "User_Confirmed",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: ["TA-01"],
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.equal(result.active_blockers.length, 0);
    assert.equal(findBlocker(result, "USR-DREQ-001"), null);
    assert.equal(result.total_count, 0);
  });

  it("Not_Started checkpoint still generates a blocker (guard does not suppress non-Complete)", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-004",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "User_Confirmed",
      status: "Not_Started",
      dependencies: [],
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-004",
      validation_source: "User_Confirmed",
      validation_pass: false,
      validation_status: "Pending_User_Input",
      missing_answer_refs: [],
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.ok(result.active_blockers.length > 0, "Not_Started must still produce a blocker");
    assert.ok(findBlocker(result, "FND-FOUND-004") !== null);
    assert.equal(findBlocker(result, "FND-FOUND-004").blocker_type, BLOCKER_TYPE.OWNER_CONFIRMATION_MISSING);
  });

  it("In_Progress checkpoint still generates a blocker (guard does not suppress non-Complete)", () => {
    // In_Progress + missing evidence must still produce evidence_missing blocker.
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "System_Detectable",
      status: "In_Progress",
      dependencies: [],
      evidence_required: ["fiscal_year_start_date"],
      evidence_items: {},
    });
    const vr = makeValidationRecord({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      validation_pass: true,
      validation_status: "Pass",
    });
    const result = computeBlockers([cp], makeValidatedCheckpoints([vr]));
    assert.ok(result.active_blockers.length > 0, "In_Progress with missing evidence must still produce a blocker");
    assert.equal(findBlocker(result, "FND-FOUND-001").blocker_type, BLOCKER_TYPE.EVIDENCE_MISSING);
  });

  it("Complete checkpoint with unmet dependency still generates no blocker (guard fires before P2/P3)", () => {
    // Without the guard, P3 (dependency_unmet) would fire because the dep is Not_Started.
    // With the guard, status=Complete short-circuits before dependency evaluation.
    const dep = makeCheckpoint({ checkpoint_id: "DEP-001", status: "Not_Started" });
    const cp = makeCheckpoint({
      checkpoint_id: "FND-DREQ-001",
      domain: "foundation",
      checkpoint_class: "Domain_Required",
      validation_source: "System_Detectable",
      status: "Complete",
      dependencies: ["DEP-001"],
    });
    const result = computeBlockers(
      [dep, cp],
      makeValidatedCheckpoints([
        makeValidationRecord({ checkpoint_id: "DEP-001", validation_status: "Pass", validation_pass: true }),
        makeValidationRecord({ checkpoint_id: "FND-DREQ-001", validation_status: "Pass", validation_pass: true }),
      ])
    );
    assert.equal(findBlocker(result, "FND-DREQ-001"), null);
    // DEP-001 itself is Not_Started with no deps — it generates no blocker either
    assert.equal(result.total_count, 0);
  });

  it("124 Complete checkpoints produce zero blockers (full 124/124 project scenario)", () => {
    // Simulates the test236 project state: all checkpoints Complete.
    // With the old code this would produce 102 phantom blockers.
    const ids = [
      "FND-FOUND-001", "FND-FOUND-002", "FND-FOUND-003", "FND-FOUND-004",
      "FND-FOUND-005", "FND-DREQ-001", "FND-DREQ-002",
      "USR-FOUND-001", "USR-FOUND-002", "USR-DREQ-001", "USR-DREQ-002",
      "USR-DREQ-003", "USR-DREQ-010",
      "MAS-FOUND-001", "MAS-FOUND-002", "MAS-DREQ-001", "MAS-DREQ-002",
      "MAS-DREQ-003", "MAS-DREQ-004", "MAS-DREQ-005", "MAS-DREQ-006",
      "ACCT-FOUND-001", "ACCT-FOUND-002", "ACCT-FOUND-003",
      "ACCT-DREQ-001", "ACCT-DREQ-002", "ACCT-DREQ-003", "ACCT-DREQ-004",
      "ACCT-GL-001", "ACCT-GL-002", "ACCT-GL-003", "ACCT-REC-002",
      "CRM-FOUND-001", "CRM-FOUND-002", "CRM-DREQ-001", "CRM-DREQ-002",
      "CRM-DREQ-003", "CRM-REC-001",
      "SAL-FOUND-001", "SAL-FOUND-002", "SAL-DREQ-001", "SAL-DREQ-002",
      "SAL-GL-001",
      "PUR-FOUND-001", "PUR-DREQ-001", "PUR-DREQ-002", "PUR-GL-001",
      "INV-FOUND-001", "INV-FOUND-002", "INV-FOUND-003",
      "INV-DREQ-001", "INV-DREQ-002", "INV-DREQ-008", "INV-DREQ-009",
      "INV-GL-001", "INV-GL-002",
      "MRP-FOUND-001", "MRP-DREQ-001", "MRP-DREQ-002", "MRP-DREQ-005",
      "MRP-DREQ-006", "MRP-GL-001", "MRP-GL-002",
      "PLM-FOUND-001", "PLM-DREQ-001", "PLM-DREQ-002", "PLM-REC-001",
      "HR-FOUND-001", "HR-DREQ-001", "HR-DREQ-002", "HR-DREQ-004",
      "POS-FOUND-001", "POS-DREQ-001", "POS-DREQ-002", "POS-DREQ-003",
      "POS-DREQ-004", "POS-DREQ-005", "POS-GL-001",
      "WEB-FOUND-001", "WEB-DREQ-001", "WEB-DREQ-002", "WEB-DREQ-003",
      "WEB-DREQ-004", "WEB-GL-001",
      "PRJ-FOUND-001", "PRJ-DREQ-001", "PRJ-DREQ-002", "PRJ-DREQ-003",
      "PRJ-GL-001",
      "QUA-FOUND-001", "QUA-DREQ-001", "QUA-DREQ-002", "QUA-DREQ-003",
      "MNT-FOUND-001", "MNT-DREQ-001", "MNT-DREQ-002", "MNT-REC-001",
      "REP-FOUND-001", "REP-DREQ-001", "REP-DREQ-002", "REP-REC-001",
      "DOC-FOUND-001", "DOC-DREQ-001", "DOC-REC-001",
      "SGN-FOUND-001", "SGN-DREQ-001", "SGN-DREQ-002",
      "APR-FOUND-001", "APR-DREQ-001", "APR-DREQ-002",
      "SUB-FOUND-001", "SUB-DREQ-001", "SUB-DREQ-002", "SUB-DREQ-003",
      "SUB-GL-001",
      "RNT-FOUND-001", "RNT-DREQ-001", "RNT-DREQ-002", "RNT-GL-001",
      "FSV-FOUND-001", "FSV-DREQ-001", "FSV-DREQ-002", "FSV-DREQ-003",
      "FSV-GL-001",
    ];
    const checkpoints = ids.map((id) =>
      makeCheckpoint({
        checkpoint_id: id,
        status: "Complete",
        validation_source: "User_Confirmed",
        dependencies: [],
      })
    );
    const validationRecords = ids.map((id) =>
      makeValidationRecord({
        checkpoint_id: id,
        validation_source: "User_Confirmed",
        validation_pass: false,
        validation_status: "Pending_User_Input",
        missing_answer_refs: ["Q-01"],
      })
    );
    const result = computeBlockers(checkpoints, makeValidatedCheckpoints(validationRecords));
    assert.equal(result.active_blockers.length, 0, `Expected 0 blockers but got ${result.active_blockers.length}`);
    assert.equal(result.total_count, 0);
    assert.equal(result.by_severity, null);
    assert.equal(result.by_domain, null);
    assert.equal(result.highest_priority_blocker, null);
  });
});
