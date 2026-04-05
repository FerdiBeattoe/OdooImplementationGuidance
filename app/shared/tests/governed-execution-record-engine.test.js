// ---------------------------------------------------------------------------
// Tests: Governed Execution Record Engine
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeExecutionRecords,
  createExecutionRecord,
  createExecutionRecordOutput,
  EXECUTION_RECORD_ENGINE_VERSION,
  EXECUTION_RECORD_GATE_TOKEN,
} from "../governed-execution-record-engine.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CHECKPOINT_ID = "cp-001";
const PREVIEW_ID = "pv-001";
const CANDIDATE_ID = "cand-001";
const APPROVAL_ID = "appr-001";

function makeCheckpoint(overrides = {}) {
  return {
    checkpoint_id: CHECKPOINT_ID,
    checkpoint_class: "Configuration",
    execution_relevance: "Executable",
    safety_class: "W2",
    preview_required: true,
    ...overrides,
  };
}

function makeCandidate(overrides = {}) {
  return {
    candidate_id: CANDIDATE_ID,
    checkpoint_id: CHECKPOINT_ID,
    preview_id: PREVIEW_ID,
    safety_class: "W2",
    execution_approval_implied: false,
    ...overrides,
  };
}

function makePreviewRecord(overrides = {}) {
  return {
    preview_id: PREVIEW_ID,
    checkpoint_id: CHECKPOINT_ID,
    safety_class: "W2",
    ...overrides,
  };
}

function makeApproval(overrides = {}) {
  return {
    approval_id: APPROVAL_ID,
    candidate_id: CANDIDATE_ID,
    checkpoint_id: CHECKPOINT_ID,
    preview_id: PREVIEW_ID,
    safety_class: "W2",
    execution_occurred: false,
    approved_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeExecutionResult(overrides = {}) {
  return {
    result_status: "success",
    ...overrides,
  };
}

function makeTargetContext(overrides = {}) {
  return {
    deployment_type: "odoosh",
    odoosh_branch_target: "staging",
    connection_mode: "live",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory tests
// ---------------------------------------------------------------------------

describe("createExecutionRecord", () => {
  it("returns an object with all required fields", () => {
    const record = createExecutionRecord({
      approval_id: APPROVAL_ID,
      candidate_id: CANDIDATE_ID,
      preview_id: PREVIEW_ID,
      checkpoint_id: CHECKPOINT_ID,
      safety_class: "W2",
      result_status: "success",
      execution_source_inputs: {},
      execution_decision_path: "gate1|gate2",
      recorded_at: "2026-01-01T00:00:00.000Z",
    });

    assert.ok(Object.prototype.hasOwnProperty.call(record, "execution_id"));
    assert.strictEqual(typeof record.execution_id, "string");
    assert.ok(record.execution_id.trim() !== "");
    assert.strictEqual(record.approval_id, APPROVAL_ID);
    assert.strictEqual(record.candidate_id, CANDIDATE_ID);
    assert.strictEqual(record.preview_id, PREVIEW_ID);
    assert.strictEqual(record.checkpoint_id, CHECKPOINT_ID);
    assert.strictEqual(record.safety_class, "W2");
    assert.strictEqual(record.result_status, "success");
    assert.strictEqual(record.execution_decision_path, "gate1|gate2");
    assert.strictEqual(record.recorded_at, "2026-01-01T00:00:00.000Z");
  });

  it("execution_record_type is always 'recorded' — R8 hardcoded", () => {
    const record = createExecutionRecord({});
    assert.strictEqual(record.execution_record_type, "recorded");
  });

  it("execution_record_type cannot be overridden by caller", () => {
    // The factory signature does not accept execution_record_type as input;
    // any attempt to pass it via overrides is simply ignored.
    const record = createExecutionRecord({ execution_record_type: "executed" });
    assert.strictEqual(record.execution_record_type, "recorded");
  });

  it("generates a uuid when execution_id is omitted", () => {
    const r1 = createExecutionRecord({});
    const r2 = createExecutionRecord({});
    assert.strictEqual(typeof r1.execution_id, "string");
    assert.notStrictEqual(r1.execution_id, r2.execution_id);
  });

  it("uses provided execution_id when given", () => {
    const record = createExecutionRecord({ execution_id: "exec-custom-id" });
    assert.strictEqual(record.execution_id, "exec-custom-id");
  });

  it("defaults null fields when omitted", () => {
    const record = createExecutionRecord({});
    assert.strictEqual(record.approval_id, null);
    assert.strictEqual(record.candidate_id, null);
    assert.strictEqual(record.preview_id, null);
    assert.strictEqual(record.checkpoint_id, null);
    assert.strictEqual(record.safety_class, null);
    assert.strictEqual(record.result_status, null);
    assert.strictEqual(record.execution_source_inputs, null);
    assert.strictEqual(record.execution_decision_path, null);
    assert.strictEqual(record.recorded_at, null);
    assert.strictEqual(record.deployment_target, null);
    assert.strictEqual(record.branch_context, null);
  });
});

describe("createExecutionRecordOutput", () => {
  it("returns container shape with executions array", () => {
    const output = createExecutionRecordOutput({});
    assert.ok(Array.isArray(output.executions));
    assert.strictEqual(output.engine_version, EXECUTION_RECORD_ENGINE_VERSION);
  });

  it("defaults generated_at to null when omitted", () => {
    const output = createExecutionRecordOutput({});
    assert.strictEqual(output.generated_at, null);
  });

  it("preserves provided executions array", () => {
    const rec = createExecutionRecord({ approval_id: APPROVAL_ID });
    const output = createExecutionRecordOutput({ executions: [rec] });
    assert.strictEqual(output.executions.length, 1);
    assert.strictEqual(output.executions[0].approval_id, APPROVAL_ID);
  });

  it("coerces non-array executions to empty array", () => {
    const output = createExecutionRecordOutput({ executions: null });
    assert.ok(Array.isArray(output.executions));
    assert.strictEqual(output.executions.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Argument validation
// ---------------------------------------------------------------------------

describe("computeExecutionRecords — argument validation", () => {
  it("throws when execution_approvals is not an array", () => {
    assert.throws(() =>
      computeExecutionRecords(null, [], [], [], null),
      { message: /execution_approvals must be an array/ }
    );
  });

  it("throws when execution_candidates is not an array", () => {
    assert.throws(() =>
      computeExecutionRecords([], null, [], [], null),
      { message: /execution_candidates must be an array/ }
    );
  });

  it("throws when checkpoints is not an array", () => {
    assert.throws(() =>
      computeExecutionRecords([], [], [], null, null),
      { message: /checkpoints must be an array/ }
    );
  });
});

// ---------------------------------------------------------------------------
// Gate 1 — Approval required
// ---------------------------------------------------------------------------

describe("Gate 1 — Approval required (R3)", () => {
  it("produces no record when execution_approvals is empty", () => {
    const result = computeExecutionRecords(
      [],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when approval_id is missing", () => {
    const approval = makeApproval({ approval_id: null });
    const result = computeExecutionRecords(
      [approval],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when approval_id is empty string", () => {
    const approval = makeApproval({ approval_id: "" });
    const result = computeExecutionRecords(
      [approval],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when approval entry is null", () => {
    const result = computeExecutionRecords(
      [null],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Gate 2 — Candidate linkage
// ---------------------------------------------------------------------------

describe("Gate 2 — Candidate linkage (R4)", () => {
  it("produces no record when candidate_id does not resolve", () => {
    const approval = makeApproval({ candidate_id: "no-such-candidate" });
    const result = computeExecutionRecords(
      [approval],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when candidate_id is null on approval", () => {
    const approval = makeApproval({ candidate_id: null });
    const result = computeExecutionRecords(
      [approval],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when execution_candidates is empty", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Gate 3 — Preview linkage
// ---------------------------------------------------------------------------

describe("Gate 3 — Preview linkage (R5)", () => {
  it("produces no record when preview_id does not resolve", () => {
    const approval = makeApproval({ preview_id: "no-such-preview" });
    const result = computeExecutionRecords(
      [approval],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when preview_id is null on approval", () => {
    const approval = makeApproval({ preview_id: null });
    const result = computeExecutionRecords(
      [approval],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("accepts previews as array (not container object)", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()], // plain array
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 1);
  });

  it("accepts previews as container object with previews array", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      { previews: [makePreviewRecord()] }, // container shape
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Gate 4 — Checkpoint linkage
// ---------------------------------------------------------------------------

describe("Gate 4 — Checkpoint linkage (R6)", () => {
  it("produces no record when checkpoint_id does not resolve", () => {
    const approval = makeApproval({ checkpoint_id: "no-such-checkpoint" });
    const result = computeExecutionRecords(
      [approval],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when checkpoint_id is null on approval", () => {
    const approval = makeApproval({ checkpoint_id: null });
    const result = computeExecutionRecords(
      [approval],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when checkpoints array is empty", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Gate 5 — Execution result required
// ---------------------------------------------------------------------------

describe("Gate 5 — Execution result required (R7)", () => {
  it("produces no record when execution_result is null", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      null // no execution_result
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when execution_result.result_status is missing", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      {} // execution_result without result_status
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when execution_result.result_status is empty string", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      { result_status: "" }
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("produces no record when execution_result.result_status is null", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      { result_status: null }
    );
    assert.strictEqual(result.executions.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Happy path — all gates pass
// ---------------------------------------------------------------------------

describe("Happy path — approved candidate with explicit result produces execution record", () => {
  it("produces one execution record when all gates pass", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 1);
  });

  it("produced record has non-empty execution_id", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    const rec = result.executions[0];
    assert.strictEqual(typeof rec.execution_id, "string");
    assert.ok(rec.execution_id.trim() !== "");
  });

  it("result_status is taken verbatim from execution_result — R13", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      { result_status: "partial_success" }
    );
    assert.strictEqual(result.executions[0].result_status, "partial_success");
  });

  it("does not invent success or failure — result_status is never assumed", () => {
    // With no explicit result, no record is created (Gate 5).
    const noResult = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      null
    );
    assert.strictEqual(noResult.executions.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Traceability — approval/candidate/preview/checkpoint linkage is preserved
// ---------------------------------------------------------------------------

describe("Traceability — linkage fields are preserved in execution record", () => {
  it("execution record carries approval_id, candidate_id, preview_id, checkpoint_id", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    const rec = result.executions[0];
    assert.strictEqual(rec.approval_id, APPROVAL_ID);
    assert.strictEqual(rec.candidate_id, CANDIDATE_ID);
    assert.strictEqual(rec.preview_id, PREVIEW_ID);
    assert.strictEqual(rec.checkpoint_id, CHECKPOINT_ID);
  });

  it("execution_source_inputs captures all traceability fields", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    const src = result.executions[0].execution_source_inputs;
    assert.strictEqual(src.approval_id, APPROVAL_ID);
    assert.strictEqual(src.candidate_id, CANDIDATE_ID);
    assert.strictEqual(src.preview_id, PREVIEW_ID);
    assert.strictEqual(src.checkpoint_id, CHECKPOINT_ID);
    assert.strictEqual(src.result_status, "success");
  });

  it("safety_class is resolved from approval, then candidate, then checkpoint", () => {
    // approval has safety_class
    const result = computeExecutionRecords(
      [makeApproval({ safety_class: "W10" })],
      [makeCandidate({ safety_class: "W2" })],
      [makePreviewRecord()],
      [makeCheckpoint({ safety_class: "W2" })],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions[0].safety_class, "W10");
  });

  it("safety_class falls back to candidate when approval.safety_class is null", () => {
    const result = computeExecutionRecords(
      [makeApproval({ safety_class: null })],
      [makeCandidate({ safety_class: "W2" })],
      [makePreviewRecord()],
      [makeCheckpoint({ safety_class: "W5" })],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions[0].safety_class, "W2");
  });

  it("safety_class falls back to checkpoint when approval and candidate safety_class are null", () => {
    const result = computeExecutionRecords(
      [makeApproval({ safety_class: null })],
      [makeCandidate({ safety_class: null })],
      [makePreviewRecord()],
      [makeCheckpoint({ safety_class: "W5" })],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions[0].safety_class, "W5");
  });

  it("execution_decision_path contains all gate tokens in order", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    const path = result.executions[0].execution_decision_path;
    const tokens = path.split("|");
    assert.ok(tokens.includes(EXECUTION_RECORD_GATE_TOKEN.APPROVAL_PRESENT));
    assert.ok(tokens.includes(EXECUTION_RECORD_GATE_TOKEN.CANDIDATE_LINKED));
    assert.ok(tokens.includes(EXECUTION_RECORD_GATE_TOKEN.PREVIEW_LINKED));
    assert.ok(tokens.includes(EXECUTION_RECORD_GATE_TOKEN.CHECKPOINT_LINKED));
    assert.ok(tokens.includes(EXECUTION_RECORD_GATE_TOKEN.EXECUTION_RESULT_PRESENT));
    assert.strictEqual(tokens.length, 5);
  });
});

// ---------------------------------------------------------------------------
// Target context — recorded as provided, no scope widening (R14)
// ---------------------------------------------------------------------------

describe("Target context — recorded verbatim (R14)", () => {
  it("deployment_target and branch_context are null when target_context is absent", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null, // no target_context
      null,
      makeExecutionResult()
    );
    const rec = result.executions[0];
    assert.strictEqual(rec.deployment_target, null);
    assert.strictEqual(rec.branch_context, null);
  });

  it("deployment_target and branch_context are recorded when target_context is provided", () => {
    const tc = makeTargetContext();
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      tc,
      null,
      makeExecutionResult()
    );
    const rec = result.executions[0];
    assert.strictEqual(rec.deployment_target, "odoosh");
    assert.strictEqual(rec.branch_context, "staging");
  });
});

// ---------------------------------------------------------------------------
// Multiple approvals — partial production
// ---------------------------------------------------------------------------

describe("Multiple approvals — partial production", () => {
  it("produces records only for approvals that pass all gates", () => {
    const approval1 = makeApproval({ approval_id: "appr-001" });
    const approval2 = makeApproval({
      approval_id: "appr-002",
      candidate_id: "no-such-candidate",
    });
    const approval3 = makeApproval({
      approval_id: "appr-003",
      preview_id: "no-such-preview",
    });

    const result = computeExecutionRecords(
      [approval1, approval2, approval3],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 1);
    assert.strictEqual(result.executions[0].approval_id, "appr-001");
  });

  it("produces a record for each valid approval when multiple approvals pass", () => {
    const candidate2 = makeCandidate({ candidate_id: "cand-002", checkpoint_id: "cp-002" });
    const preview2 = makePreviewRecord({ preview_id: "pv-002", checkpoint_id: "cp-002" });
    const checkpoint2 = makeCheckpoint({ checkpoint_id: "cp-002" });
    const approval2 = makeApproval({
      approval_id: "appr-002",
      candidate_id: "cand-002",
      preview_id: "pv-002",
      checkpoint_id: "cp-002",
    });

    const result = computeExecutionRecords(
      [makeApproval(), approval2],
      [makeCandidate(), candidate2],
      [makePreviewRecord(), preview2],
      [makeCheckpoint(), checkpoint2],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 2);
  });
});

// ---------------------------------------------------------------------------
// Distinctions: approved vs executed vs execution outcome recorded
// ---------------------------------------------------------------------------

describe("Strict distinction: approved vs executed vs execution outcome recorded", () => {
  it("execution_record_type is always 'recorded' — never 'executed'", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions[0].execution_record_type, "recorded");
  });

  it("approval does not produce an execution record without execution_result", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      null // missing execution_result — Gate 5 fails
    );
    assert.strictEqual(result.executions.length, 0);
  });

  it("execution result alone (no approval) produces no record", () => {
    const result = computeExecutionRecords(
      [], // no approvals
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("Determinism (R12)", () => {
  it("same inputs produce same output structure (modulo timestamps and ids)", () => {
    const args = [
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult(),
    ];
    const r1 = computeExecutionRecords(...args);
    const r2 = computeExecutionRecords(...args);
    assert.strictEqual(r1.executions.length, r2.executions.length);
    assert.strictEqual(r1.executions[0].approval_id, r2.executions[0].approval_id);
    assert.strictEqual(r1.executions[0].candidate_id, r2.executions[0].candidate_id);
    assert.strictEqual(r1.executions[0].preview_id, r2.executions[0].preview_id);
    assert.strictEqual(r1.executions[0].checkpoint_id, r2.executions[0].checkpoint_id);
    assert.strictEqual(r1.executions[0].result_status, r2.executions[0].result_status);
    assert.strictEqual(r1.executions[0].execution_decision_path, r2.executions[0].execution_decision_path);
    assert.strictEqual(r1.executions[0].execution_record_type, r2.executions[0].execution_record_type);
  });

  it("all records in one run share the same recorded_at timestamp", () => {
    const candidate2 = makeCandidate({ candidate_id: "cand-002", checkpoint_id: "cp-002" });
    const preview2 = makePreviewRecord({ preview_id: "pv-002", checkpoint_id: "cp-002" });
    const checkpoint2 = makeCheckpoint({ checkpoint_id: "cp-002" });
    const approval2 = makeApproval({
      approval_id: "appr-002",
      candidate_id: "cand-002",
      preview_id: "pv-002",
      checkpoint_id: "cp-002",
    });

    const result = computeExecutionRecords(
      [makeApproval(), approval2],
      [makeCandidate(), candidate2],
      [makePreviewRecord(), preview2],
      [makeCheckpoint(), checkpoint2],
      null,
      null,
      null,
      makeExecutionResult()
    );
    assert.strictEqual(result.executions.length, 2);
    assert.strictEqual(result.executions[0].recorded_at, result.executions[1].recorded_at);
  });
});

// ---------------------------------------------------------------------------
// Contract shape compliance
// ---------------------------------------------------------------------------

describe("Contract shape compliance", () => {
  it("output container has executions, engine_version, generated_at", () => {
    const result = computeExecutionRecords([], [], [], [], null);
    assert.ok(Object.prototype.hasOwnProperty.call(result, "executions"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "engine_version"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "generated_at"));
  });

  it("engine_version matches EXECUTION_RECORD_ENGINE_VERSION", () => {
    const result = computeExecutionRecords([], [], [], [], null);
    assert.strictEqual(result.engine_version, EXECUTION_RECORD_ENGINE_VERSION);
  });

  it("execution record has all required contract fields", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    const rec = result.executions[0];
    const requiredFields = [
      "execution_id",
      "approval_id",
      "candidate_id",
      "preview_id",
      "checkpoint_id",
      "safety_class",
      "result_status",
      "execution_source_inputs",
      "execution_decision_path",
      "execution_record_type",
      "recorded_at",
      "deployment_target",
      "branch_context",
    ];
    for (const field of requiredFields) {
      assert.ok(Object.prototype.hasOwnProperty.call(rec, field));
    }
  });

  it("executions array is empty (not null) when no gates pass", () => {
    const result = computeExecutionRecords([], [], [], [], null);
    assert.ok(Array.isArray(result.executions));
    assert.strictEqual(result.executions.length, 0);
  });
});

// ---------------------------------------------------------------------------
// No invented state
// ---------------------------------------------------------------------------

describe("No invented state", () => {
  it("does not invent timestamps or operator identity beyond explicit inputs", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    const src = result.executions[0].execution_source_inputs;
    // connection_status is null when no connection_state is provided
    assert.strictEqual(src.connection_status, null);
    // deployment_target and branch_context are null when no target_context
    assert.strictEqual(src.deployment_target, null);
    assert.strictEqual(src.branch_context, null);
  });

  it("does not add fields beyond what is defined in the record shape", () => {
    const result = computeExecutionRecords(
      [makeApproval()],
      [makeCandidate()],
      [makePreviewRecord()],
      [makeCheckpoint()],
      null,
      null,
      null,
      makeExecutionResult()
    );
    const rec = result.executions[0];
    // Should not carry approval-engine-specific fields
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "execution_occurred"), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "approval_decision_path"), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "approval_source_inputs"), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "approved_at"), false);
    // Should not carry eligibility-engine-specific fields
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "execution_approval_implied"), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "eligibility_reason_path"), false);
  });
});
