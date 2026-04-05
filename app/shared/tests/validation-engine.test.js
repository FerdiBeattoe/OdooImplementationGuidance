// ---------------------------------------------------------------------------
// Validation Engine Tests
// Tests for: app/shared/validation-engine.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1. System-detectable checkpoint initial validation → Pass
//   2. User-confirmed checkpoint with required answer present → Pass
//   3. User-confirmed checkpoint with required answer missing → Pending_User_Input
//   4. Both-source checkpoint first-pass behavior → non-passing
//   5. No dependency evaluation (cross-domain pass/fail not computed)
//   6. No blocker, readiness, or deferment computation in output
//   7. Contract-shape compliance (createValidationRecord / createValidationResult)
//   8. Determinism: identical inputs produce identical output shapes
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeValidation,
  createValidationRecord,
  createValidationResult,
  VALIDATION_ENGINE_VERSION,
  VALIDATION_REQUIRED_ANSWERS,
  VALIDATION_STATUS,
} from "../validation-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal checkpoint record with the given fields.
 */
function makeCheckpoint({
  checkpoint_id = "FND-FOUND-001",
  validation_source = "System_Detectable",
  domain = "foundation",
  checkpoint_class = "Foundational",
  status = "Not_Started",
  execution_relevance = "None",
  safety_class = "Not_Applicable",
  dependencies = [],
} = {}) {
  return {
    checkpoint_id,
    domain,
    checkpoint_class,
    validation_source,
    status,
    execution_relevance,
    safety_class,
    dependencies,
  };
}

/**
 * Builds a minimal discoveryAnswers object with the given answers map.
 * @param {object} answersMap - discovery question_id → value
 * @param {{ confirmedBy?: string|null }} opts - optional overrides
 */
function makeDiscoveryAnswers(answersMap = {}, { confirmedBy = null } = {}) {
  return {
    answers: answersMap,
    answered_at: {},
    conditional_questions_skipped: [],
    framework_version: "1.0.0",
    confirmed_by: confirmedBy,
    confirmed_at: null,
  };
}

/**
 * Returns the validation record for the given checkpoint_id from result.records.
 */
function findRecord(result, checkpointId) {
  return result.records.find((r) => r.checkpoint_id === checkpointId) ?? null;
}

// ---------------------------------------------------------------------------
// Section 1 — createValidationResult() factory shape
// ---------------------------------------------------------------------------

describe("createValidationResult() factory", () => {
  it("returns object with records, engine_version, validated_at", () => {
    const out = createValidationResult({
      records: [],
      engine_version: "1.0.0",
      validated_at: "2026-01-01T00:00:00.000Z",
    });
    assert.ok(Object.prototype.hasOwnProperty.call(out, "records"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "engine_version"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "validated_at"));
    assert.deepEqual(out.records, []);
    assert.equal(out.engine_version, "1.0.0");
    assert.equal(out.validated_at, "2026-01-01T00:00:00.000Z");
  });

  it("defaults records to empty array when not provided", () => {
    const out = createValidationResult();
    assert.deepEqual(out.records, []);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — createValidationRecord() factory shape
// ---------------------------------------------------------------------------

describe("createValidationRecord() factory", () => {
  it("returns exactly the 6 governed fields", () => {
    const rec = createValidationRecord({
      checkpoint_id: "FND-FOUND-001",
      validation_source: "System_Detectable",
      validation_pass: true,
      validation_status: VALIDATION_STATUS.PASS,
      answer_refs: [],
      missing_answer_refs: [],
    });

    const keys = Object.keys(rec).sort();
    const expected = [
      "answer_refs",
      "checkpoint_id",
      "missing_answer_refs",
      "validation_pass",
      "validation_source",
      "validation_status",
    ].sort();

    assert.deepEqual(keys, expected);
  });

  it("stores copies of answer_refs and missing_answer_refs", () => {
    const refs = ["BM-02"];
    const rec = createValidationRecord({ answer_refs: refs });
    refs.push("EXTRA");
    assert.equal(rec.answer_refs.length, 1);
  });

  it("defaults arrays to empty when not provided", () => {
    const rec = createValidationRecord({ checkpoint_id: "X" });
    assert.deepEqual(rec.answer_refs, []);
    assert.deepEqual(rec.missing_answer_refs, []);
  });
});

// ---------------------------------------------------------------------------
// Section 3 — computeValidation() output container shape
// ---------------------------------------------------------------------------

describe("computeValidation() — output container shape", () => {
  it("returns createValidationResult() shape with engine_version and validated_at", () => {
    const result = computeValidation(
      [makeCheckpoint()],
      makeDiscoveryAnswers({})
    );
    assert.ok(Object.prototype.hasOwnProperty.call(result, "records"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "engine_version"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "validated_at"));
    assert.equal(result.engine_version, VALIDATION_ENGINE_VERSION);
    assert.ok(typeof result.validated_at === "string");
  });

  it("produces one record per input checkpoint", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-002", validation_source: "Both" }),
    ];
    const result = computeValidation(checkpoints, makeDiscoveryAnswers({}));
    assert.equal(result.records.length, 3);
  });

  it("returns empty records for empty checkpoints input", () => {
    const result = computeValidation([], makeDiscoveryAnswers({}));
    assert.deepEqual(result.records, []);
  });
});

// ---------------------------------------------------------------------------
// Section 4 — System_Detectable checkpoint initial validation
// ---------------------------------------------------------------------------

describe("System_Detectable checkpoint — first-pass validation", () => {
  it("produces Pass status", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.ok(rec !== null);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PASS);
  });

  it("sets validation_pass to true", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, "FND-FOUND-001").validation_pass, true);
  });

  it("has empty answer_refs and missing_answer_refs", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.deepEqual(rec.answer_refs, []);
    assert.deepEqual(rec.missing_answer_refs, []);
  });

  it("passes regardless of discovery_answers content", () => {
    const result1 = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({})
    );
    const result2 = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({ "BM-01": "Yes", "FC-01": "Full accounting" })
    );
    assert.equal(findRecord(result1, "FND-FOUND-001").validation_status, VALIDATION_STATUS.PASS);
    assert.equal(findRecord(result2, "FND-FOUND-001").validation_status, VALIDATION_STATUS.PASS);
  });

  it("traces checkpoint_id and validation_source correctly", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.checkpoint_id, "FND-FOUND-001");
    assert.equal(rec.validation_source, "System_Detectable");
  });
});

// ---------------------------------------------------------------------------
// Section 5 — User_Confirmed checkpoint with required answer present
// ---------------------------------------------------------------------------

describe("User_Confirmed checkpoint — required answer present", () => {
  // FND-FOUND-006 requires BM-02 per VALIDATION_REQUIRED_ANSWERS
  it("produces Pass status when required answer is present", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({ "BM-02": "Yes" })
    );
    const rec = findRecord(result, "FND-FOUND-006");
    assert.ok(rec !== null);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PASS);
  });

  it("sets validation_pass to true", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({ "BM-02": "Yes" })
    );
    assert.equal(findRecord(result, "FND-FOUND-006").validation_pass, true);
  });

  it("populates answer_refs with the present question_id", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({ "BM-02": "Yes" })
    );
    const rec = findRecord(result, "FND-FOUND-006");
    assert.ok(rec.answer_refs.includes("BM-02"));
    assert.deepEqual(rec.missing_answer_refs, []);
  });

  it("traces checkpoint_id and validation_source correctly", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({ "BM-02": "Yes" })
    );
    const rec = findRecord(result, "FND-FOUND-006");
    assert.equal(rec.checkpoint_id, "FND-FOUND-006");
    assert.equal(rec.validation_source, "User_Confirmed");
  });

  it("multi-required-answer checkpoint passes only when all answers present (MRP-DREQ-008 needs FC-01 and MF-02)", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "MRP-DREQ-008", validation_source: "Both" })],
      makeDiscoveryAnswers({ "FC-01": "Full accounting", "MF-02": "Multi-level" })
    );
    const rec = findRecord(result, "MRP-DREQ-008");
    // Both — user answers present → Pending_System_Check (not Pass; system check still needed)
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_SYSTEM_CHECK);
    assert.ok(rec.answer_refs.includes("FC-01"));
    assert.ok(rec.answer_refs.includes("MF-02"));
    assert.deepEqual(rec.missing_answer_refs, []);
  });
});

// ---------------------------------------------------------------------------
// Section 6 — User_Confirmed checkpoint with required answer missing
// ---------------------------------------------------------------------------

describe("User_Confirmed checkpoint — required answer missing", () => {
  it("produces Pending_User_Input when required answer is absent", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-006");
    assert.ok(rec !== null);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
  });

  it("sets validation_pass to false", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, "FND-FOUND-006").validation_pass, false);
  });

  it("populates missing_answer_refs with the absent question_id", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-006");
    assert.ok(rec.missing_answer_refs.includes("BM-02"));
    assert.deepEqual(rec.answer_refs, []);
  });

  it("produces Pending_User_Input for unconditional User_Confirmed (no required answers defined)", () => {
    // FND-FOUND-004 is unconditional User_Confirmed; not in VALIDATION_REQUIRED_ANSWERS
    assert.equal(VALIDATION_REQUIRED_ANSWERS["FND-FOUND-004"], undefined);

    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({ "BM-01": "Yes", "BM-02": "Yes" })
    );
    const rec = findRecord(result, "FND-FOUND-004");
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
    assert.equal(rec.validation_pass, false);
  });

  it("does NOT mark Pass when a required answer is null", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({ "BM-02": null })
    );
    assert.equal(findRecord(result, "FND-FOUND-006").validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
  });

  it("partial answers: missing_answer_refs lists only absent questions", () => {
    // MRP-DREQ-008 needs both FC-01 and MF-02; provide only FC-01
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "MRP-DREQ-008", validation_source: "Both" })],
      makeDiscoveryAnswers({ "FC-01": "Full accounting" })
    );
    const rec = findRecord(result, "MRP-DREQ-008");
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
    assert.ok(rec.answer_refs.includes("FC-01"));
    assert.ok(rec.missing_answer_refs.includes("MF-02"));
  });
});

// ---------------------------------------------------------------------------
// Section 7 — Both-source checkpoint first-pass behavior
// ---------------------------------------------------------------------------

describe("Both checkpoint — first-pass behavior", () => {
  it("produces non-passing result when required user answer is missing", () => {
    // FND-DREQ-003 is Both and requires BM-04
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-DREQ-003");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
  });

  it("produces Pending_System_Check (not Pass) when user answer is present", () => {
    // FND-DREQ-003 requires BM-04; even with answer present, system check still needed
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" })],
      makeDiscoveryAnswers({ "BM-04": "Yes" })
    );
    const rec = findRecord(result, "FND-DREQ-003");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_SYSTEM_CHECK);
  });

  it("unconditional Both checkpoint produces Pending_User_Input regardless of answers", () => {
    // FND-FOUND-001 is Both and unconditional (not in VALIDATION_REQUIRED_ANSWERS)
    assert.equal(VALIDATION_REQUIRED_ANSWERS["FND-FOUND-001"], undefined);

    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "Both" })],
      makeDiscoveryAnswers({ "BM-01": "Yes", "BM-02": "Yes", "BM-04": "Yes" })
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
  });

  it("FND-FOUND-002 registry entry is present and maps to BM-03", () => {
    // Spec evidence: "Country selection matches BM-03 answer" (checkpoint_engine.md line 313)
    assert.notEqual(VALIDATION_REQUIRED_ANSWERS["FND-FOUND-002"], undefined);
    assert.ok(VALIDATION_REQUIRED_ANSWERS["FND-FOUND-002"].includes("BM-03"));
  });

  it("FND-FOUND-002 produces Pending_System_Check when BM-03 answer is present", () => {
    // BM-03 (Primary Operating Country) is the grounded required answer for localization selection
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-002", validation_source: "Both" })],
      makeDiscoveryAnswers({ "BM-03": "Australia" })
    );
    const rec = findRecord(result, "FND-FOUND-002");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_SYSTEM_CHECK);
    assert.ok(rec.answer_refs.includes("BM-03"));
    assert.deepEqual(rec.missing_answer_refs, []);
  });

  it("FND-FOUND-002 produces Pending_User_Input when BM-03 answer is absent", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-002", validation_source: "Both" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-002");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
    assert.ok(rec.missing_answer_refs.includes("BM-03"));
  });

  it("FND-FOUND-003 remains absent from VALIDATION_REQUIRED_ANSWERS (out of scope)", () => {
    assert.equal(VALIDATION_REQUIRED_ANSWERS["FND-FOUND-003"], undefined);
  });

  it("Both never reaches Pass on first pass even when answer is present", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" })],
      makeDiscoveryAnswers({ "BM-04": true })
    );
    const rec = findRecord(result, "FND-DREQ-003");
    assert.notEqual(rec.validation_status, VALIDATION_STATUS.PASS);
    assert.equal(rec.validation_pass, false);
  });

  it("Pending_System_Check record has answer_refs populated and missing_answer_refs empty", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" })],
      makeDiscoveryAnswers({ "BM-04": "Yes" })
    );
    const rec = findRecord(result, "FND-DREQ-003");
    assert.ok(rec.answer_refs.includes("BM-04"));
    assert.deepEqual(rec.missing_answer_refs, []);
  });
});

// ---------------------------------------------------------------------------
// Section 7b — confirmed_by wire for unconditional Both checkpoints
// ---------------------------------------------------------------------------

describe("Both checkpoint — confirmed_by wire (unconditional checkpoints only)", () => {
  it("FND-FOUND-001 stays Pending_User_Input when confirmed_by is null", () => {
    assert.equal(VALIDATION_REQUIRED_ANSWERS["FND-FOUND-001"], undefined);

    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "Both" })],
      makeDiscoveryAnswers({}) // confirmed_by: null by default
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
  });

  it("FND-FOUND-001 stays Pending_User_Input when confirmed_by is empty string", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "Both" })],
      makeDiscoveryAnswers({}, { confirmedBy: "   " })
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
  });

  it("FND-FOUND-001 advances to Pending_System_Check when confirmed_by is set", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "Both" })],
      makeDiscoveryAnswers({}, { confirmedBy: "alice" })
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_SYSTEM_CHECK);
  });

  it("FND-FOUND-001 with confirmed_by set never reaches Pass", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "Both" })],
      makeDiscoveryAnswers({}, { confirmedBy: "alice" })
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.notEqual(rec.validation_status, VALIDATION_STATUS.PASS);
    assert.equal(rec.validation_pass, false);
  });

  it("confirmed_by does not bypass mapped Both checkpoints (FND-FOUND-002 still needs BM-03)", () => {
    assert.notEqual(VALIDATION_REQUIRED_ANSWERS["FND-FOUND-002"], undefined);

    // confirmed_by set but BM-03 absent → still Pending_User_Input
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-002", validation_source: "Both" })],
      makeDiscoveryAnswers({}, { confirmedBy: "alice" })
    );
    const rec = findRecord(result, "FND-FOUND-002");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
    assert.ok(rec.missing_answer_refs.includes("BM-03"));
  });

  it("confirmed_by does not bypass mapped Both checkpoints when BM-03 present (normal path unaffected)", () => {
    // BM-03 present + confirmed_by set → Pending_System_Check via the normal mapped path
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-002", validation_source: "Both" })],
      makeDiscoveryAnswers({ "BM-03": "Australia" }, { confirmedBy: "alice" })
    );
    const rec = findRecord(result, "FND-FOUND-002");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_SYSTEM_CHECK);
    assert.ok(rec.answer_refs.includes("BM-03"));
  });

  it("confirmed_by does not affect unconditional User_Confirmed checkpoints", () => {
    // FND-FOUND-004 is User_Confirmed, unconditional — confirmed_by must not help it
    assert.equal(VALIDATION_REQUIRED_ANSWERS["FND-FOUND-004"], undefined);

    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed" })],
      makeDiscoveryAnswers({}, { confirmedBy: "alice" })
    );
    const rec = findRecord(result, "FND-FOUND-004");
    assert.equal(rec.validation_pass, false);
    assert.equal(rec.validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
  });
});

// ---------------------------------------------------------------------------
// Section 8 — No dependency evaluation
// ---------------------------------------------------------------------------

describe("No dependency evaluation", () => {
  it("does not add blocker_flag, dependencies_met, or blocked_reason to records", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "Both", dependencies: ["FAKE-001"] })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.blocker_flag, undefined);
    assert.equal(rec.dependencies_met, undefined);
    assert.equal(rec.blocked_reason, undefined);
  });

  it("does not evaluate cross-domain dependency chains", () => {
    // A checkpoint whose dependencies include unresolved checkpoints
    // should still produce the same validation result as one with no dependencies
    const withDeps = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-003",
      validation_source: "Both",
      dependencies: ["USR-DREQ-007", "FND-FOUND-001"],
    });
    const withoutDeps = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-003",
      validation_source: "Both",
      dependencies: [],
    });
    const answers = makeDiscoveryAnswers({ "SC-02": "Yes" });

    const r1 = computeValidation([withDeps], answers);
    const r2 = computeValidation([withoutDeps], answers);

    const rec1 = findRecord(r1, "SAL-DREQ-003");
    const rec2 = findRecord(r2, "SAL-DREQ-003");

    assert.equal(rec1.validation_status, rec2.validation_status);
    assert.equal(rec1.validation_pass, rec2.validation_pass);
  });
});

// ---------------------------------------------------------------------------
// Section 9 — No blocker, readiness, or deferment computation
// ---------------------------------------------------------------------------

describe("No blocker, readiness, or deferment computation", () => {
  it("result records do not contain readiness fields", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.readiness, undefined);
    assert.equal(rec.go_live_readiness, undefined);
    assert.equal(rec.readiness_reason, undefined);
  });

  it("result records do not contain blocker fields", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.blocker_flag, undefined);
    assert.equal(rec.active_blockers, undefined);
  });

  it("result records do not contain deferment fields", () => {
    const result = computeValidation(
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" })],
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, "FND-FOUND-001");
    assert.equal(rec.deferment_allowed, undefined);
    assert.equal(rec.deferment_eligible, undefined);
  });

  it("result container does not contain preview or execution fields", () => {
    const result = computeValidation([], makeDiscoveryAnswers({}));
    assert.equal(result.previews, undefined);
    assert.equal(result.executions, undefined);
    assert.equal(result.execution_candidates, undefined);
  });
});

// ---------------------------------------------------------------------------
// Section 10 — Contract-shape compliance
// ---------------------------------------------------------------------------

describe("Contract-shape compliance", () => {
  it("every record contains exactly the 6 validation-owned fields", () => {
    const EXPECTED_KEYS = [
      "answer_refs",
      "checkpoint_id",
      "missing_answer_refs",
      "validation_pass",
      "validation_source",
      "validation_status",
    ].sort();

    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" }),
    ];

    const result = computeValidation(
      checkpoints,
      makeDiscoveryAnswers({ "BM-02": "Yes", "BM-04": "Yes" })
    );

    for (const rec of result.records) {
      assert.deepEqual(Object.keys(rec).sort(), EXPECTED_KEYS);
    }
  });

  it("validation_pass is always a boolean", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-002", validation_source: "Both" }),
    ];
    const result = computeValidation(checkpoints, makeDiscoveryAnswers({}));
    for (const rec of result.records) {
      assert.equal(typeof rec.validation_pass, "boolean");
    }
  });

  it("validation_status is one of the known VALIDATION_STATUS constants", () => {
    const known = Object.values(VALIDATION_STATUS);
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" }),
    ];
    const result = computeValidation(
      checkpoints,
      makeDiscoveryAnswers({ "BM-02": "Yes", "BM-04": "Yes" })
    );
    for (const rec of result.records) {
      assert.ok(known.includes(rec.validation_status), `Unexpected status: ${rec.validation_status}`);
    }
  });

  it("answer_refs and missing_answer_refs are always arrays", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" }),
    ];
    const result = computeValidation(
      checkpoints,
      makeDiscoveryAnswers({ "BM-02": "Yes" })
    );
    for (const rec of result.records) {
      assert.ok(Array.isArray(rec.answer_refs));
      assert.ok(Array.isArray(rec.missing_answer_refs));
    }
  });

  it("validation_pass is true only when validation_status is Pass", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-004", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" }),
    ];
    const result = computeValidation(
      checkpoints,
      makeDiscoveryAnswers({ "BM-02": "Yes", "BM-04": "Yes" })
    );
    for (const rec of result.records) {
      if (rec.validation_pass) {
        assert.equal(rec.validation_status, VALIDATION_STATUS.PASS);
      } else {
        assert.notEqual(rec.validation_status, VALIDATION_STATUS.PASS);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Section 11 — Determinism
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("identical inputs produce records with identical validation_status and validation_pass", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" }),
      makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" }),
    ];
    const answers = makeDiscoveryAnswers({ "BM-02": "Yes" });

    const result1 = computeValidation(checkpoints, answers);
    const result2 = computeValidation(checkpoints, answers);

    assert.equal(result1.records.length, result2.records.length);
    for (let i = 0; i < result1.records.length; i++) {
      assert.equal(result1.records[i].checkpoint_id,      result2.records[i].checkpoint_id);
      assert.equal(result1.records[i].validation_status,  result2.records[i].validation_status);
      assert.equal(result1.records[i].validation_pass,    result2.records[i].validation_pass);
      assert.deepEqual(result1.records[i].answer_refs,         result2.records[i].answer_refs);
      assert.deepEqual(result1.records[i].missing_answer_refs, result2.records[i].missing_answer_refs);
    }
  });

  it("changing an answer changes the corresponding validation result", () => {
    const cp = makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" });

    const withAnswer    = computeValidation([cp], makeDiscoveryAnswers({ "BM-02": "Yes" }));
    const withoutAnswer = computeValidation([cp], makeDiscoveryAnswers({}));

    assert.equal(findRecord(withAnswer,    "FND-FOUND-006").validation_status, VALIDATION_STATUS.PASS);
    assert.equal(findRecord(withoutAnswer, "FND-FOUND-006").validation_status, VALIDATION_STATUS.PENDING_USER_INPUT);
  });

  it("output order matches input order", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-DREQ-003", validation_source: "Both" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", validation_source: "System_Detectable" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-006", validation_source: "User_Confirmed" }),
    ];
    const result = computeValidation(checkpoints, makeDiscoveryAnswers({ "BM-02": "Yes" }));
    assert.equal(result.records[0].checkpoint_id, "FND-DREQ-003");
    assert.equal(result.records[1].checkpoint_id, "FND-FOUND-001");
    assert.equal(result.records[2].checkpoint_id, "FND-FOUND-006");
  });
});

// ---------------------------------------------------------------------------
// Section 12 — Input validation
// ---------------------------------------------------------------------------

describe("computeValidation() — input validation", () => {
  it("throws if checkpoints is not an array", () => {
    assert.throws(
      () => computeValidation(null, makeDiscoveryAnswers({})),
      /checkpoints must be an array/
    );
  });

  it("throws if discoveryAnswers is null", () => {
    assert.throws(
      () => computeValidation([], null),
      /discoveryAnswers must be an object/
    );
  });

  it("throws if discoveryAnswers is not an object", () => {
    assert.throws(
      () => computeValidation([], "bad"),
      /discoveryAnswers must be an object/
    );
  });
});
