// ---------------------------------------------------------------------------
// Tests: Governed Execution Approval Engine
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeExecutionApprovals,
  createExecutionApprovalRecord,
  createExecutionApprovalOutput,
  EXECUTION_APPROVAL_ENGINE_VERSION,
  APPROVAL_GATE_TOKEN,
} from "../governed-execution-approval-engine.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CHECKPOINT_ID = "cp-001";
const PREVIEW_ID = "pv-001";
const CANDIDATE_ID = "cand-001";

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

function makeBlockers(checkpointIds = []) {
  return {
    active_blockers: checkpointIds.map((id) => ({ source_checkpoint_id: id })),
  };
}

function makeTargetContext(overrides = {}) {
  return {
    deployment_type: "saas",
    connection_mode: null,
    odoosh_branch_target: null,
    ...overrides,
  };
}

function makeApprovalContext(overrides = {}) {
  return {
    approval_granted_by: "user@example.com",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory tests
// ---------------------------------------------------------------------------

describe("createExecutionApprovalRecord", () => {
  it("sets execution_occurred to false unconditionally", () => {
    const record = createExecutionApprovalRecord({
      candidate_id: "c1",
      checkpoint_id: "cp1",
      preview_id: "pv1",
    });
    assert.strictEqual(record.execution_occurred, false);
  });

  it("generates an approval_id when not supplied", () => {
    const record = createExecutionApprovalRecord({});
    assert.strictEqual(typeof record.approval_id, "string");
    assert.ok(record.approval_id.trim() !== "");
  });

  it("uses provided approval_id when valid", () => {
    const record = createExecutionApprovalRecord({ approval_id: "my-id" });
    assert.strictEqual(record.approval_id, "my-id");
  });

  it("includes all required contract fields", () => {
    const record = createExecutionApprovalRecord({});
    assert.ok(Object.prototype.hasOwnProperty.call(record, "approval_id"));
    assert.ok(Object.prototype.hasOwnProperty.call(record, "candidate_id"));
    assert.ok(Object.prototype.hasOwnProperty.call(record, "checkpoint_id"));
    assert.ok(Object.prototype.hasOwnProperty.call(record, "preview_id"));
    assert.ok(Object.prototype.hasOwnProperty.call(record, "safety_class"));
    assert.ok(Object.prototype.hasOwnProperty.call(record, "approval_source_inputs"));
    assert.ok(Object.prototype.hasOwnProperty.call(record, "approval_decision_path"));
    assert.ok(Object.prototype.hasOwnProperty.call(record, "execution_occurred"));
    assert.ok(Object.prototype.hasOwnProperty.call(record, "approved_at"));
  });
});

describe("createExecutionApprovalOutput", () => {
  it("returns a container with execution_approvals, engine_version, generated_at", () => {
    const output = createExecutionApprovalOutput({});
    assert.ok(Array.isArray(output.execution_approvals));
    assert.strictEqual(output.engine_version, EXECUTION_APPROVAL_ENGINE_VERSION);
  });

  it("defaults execution_approvals to empty array", () => {
    const output = createExecutionApprovalOutput({});
    assert.strictEqual(output.execution_approvals.length, 0);
  });
});

// ---------------------------------------------------------------------------
// computeExecutionApprovals — argument validation
// ---------------------------------------------------------------------------

describe("computeExecutionApprovals — argument validation", () => {
  it("throws when execution_candidates is not an array", () => {
    assert.throws(() =>
      computeExecutionApprovals(null, [], null, null, null),
      { message: /execution_candidates must be an array/ }
    );
  });

  it("throws when checkpoints is not an array", () => {
    assert.throws(() =>
      computeExecutionApprovals([], null, null, null, null),
      { message: /checkpoints must be an array/ }
    );
  });
});

// ---------------------------------------------------------------------------
// Gate 1 — Candidate valid (non-candidate produces no approval)
// ---------------------------------------------------------------------------

describe("Gate 1 — non-candidate produces no approval", () => {
  it("produces no approval when candidate_id is missing", () => {
    const candidate = makeCandidate({ candidate_id: undefined });
    const output = computeExecutionApprovals(
      [candidate],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when candidate_id is empty string", () => {
    const candidate = makeCandidate({ candidate_id: "   " });
    const output = computeExecutionApprovals(
      [candidate],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when candidate is null", () => {
    const output = computeExecutionApprovals(
      [null],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when candidate is a plain object without candidate_id", () => {
    const output = computeExecutionApprovals(
      [{ checkpoint_id: CHECKPOINT_ID, preview_id: PREVIEW_ID }],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Gate 2 — Checkpoint resolved
// ---------------------------------------------------------------------------

describe("Gate 2 — unresolvable checkpoint produces no approval", () => {
  it("produces no approval when checkpoint_id does not match any checkpoint", () => {
    const candidate = makeCandidate({ checkpoint_id: "cp-unknown" });
    const output = computeExecutionApprovals(
      [candidate],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when checkpoints array is empty", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Gate 3 — Preview resolved
// ---------------------------------------------------------------------------

describe("Gate 3 — unresolvable preview produces no approval", () => {
  it("produces no approval when preview_id does not match any preview", () => {
    const candidate = makeCandidate({ preview_id: "pv-unknown" });
    const output = computeExecutionApprovals(
      [candidate],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when previews is null", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      null,
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when previews array is empty", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Gate 4 — Blocked refusal
// ---------------------------------------------------------------------------

describe("Gate 4 — blocked checkpoint produces no approval", () => {
  it("produces no approval when checkpoint has an active blocker", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers([CHECKPOINT_ID]),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces approval when a different checkpoint is blocked", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(["cp-other"]),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Gate 5 — Approval input required
// ---------------------------------------------------------------------------

describe("Gate 5 — missing approval input prevents approval", () => {
  it("produces no approval when approval_context is null", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      null
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when approval_granted_by is empty string", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext({ approval_granted_by: "   " })
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when approval_granted_by is absent", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      {}
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Gate 6 — Target context required for Executable
// ---------------------------------------------------------------------------

describe("Gate 6 — missing target context prevents approval where required", () => {
  it("produces no approval when target_context is null and checkpoint is Executable", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint({ execution_relevance: "Executable" })],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      null,
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when target_context.deployment_type is null", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint({ execution_relevance: "Executable" })],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ deployment_type: null }),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("allows approval for non-Executable checkpoint without target_context", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint({ execution_relevance: "Informational" })],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      null,
      null,
      makeApprovalContext()
    );
    // Informational does not require target_context — if all other gates pass, approval is granted.
    assert.strictEqual(output.execution_approvals.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Gate 7 — Branch target required for odoosh
// ---------------------------------------------------------------------------

describe("Gate 7 — missing branch target prevents approval for odoosh", () => {
  it("produces no approval when odoosh deployment_type has no branch target", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint({ execution_relevance: "Executable" })],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ deployment_type: "odoosh", odoosh_branch_target: null }),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces approval when odoosh deployment_type has a branch target", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint({ execution_relevance: "Executable" })],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ deployment_type: "odoosh", odoosh_branch_target: "staging" }),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Gate 8 — Connection support required
// ---------------------------------------------------------------------------

describe("Gate 8 — missing connection support prevents approval where required", () => {
  it("produces no approval when connection_mode is set but connection_state is null", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ connection_mode: "rpc" }),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when connection_mode is set and execute is false", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ connection_mode: "rpc" }),
      { availableFeatures: { execute: false } },
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces no approval when connection_mode is set and availableFeatures is missing", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ connection_mode: "rpc" }),
      { status: "connected" },
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 0);
  });

  it("produces approval when connection_mode is set and execute is true", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ connection_mode: "rpc", deployment_type: "saas" }),
      { status: "connected", availableFeatures: { execute: true } },
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 1);
  });

  it("produces approval when connection_mode is null (connection not required)", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ connection_mode: null }),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Valid candidate produces approval record
// ---------------------------------------------------------------------------

describe("valid execution candidate can produce approval record", () => {
  it("produces one approval record for a fully passing candidate", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 1);
    const rec = output.execution_approvals[0];
    assert.strictEqual(rec.candidate_id, CANDIDATE_ID);
    assert.strictEqual(rec.checkpoint_id, CHECKPOINT_ID);
    assert.strictEqual(rec.preview_id, PREVIEW_ID);
    assert.strictEqual(typeof rec.safety_class, "string");
    assert.strictEqual(rec.execution_occurred, false);
    assert.strictEqual(typeof rec.approval_id, "string");
    assert.strictEqual(typeof rec.approved_at, "string");
  });

  it("carries approval_source_inputs with approval_granted_by", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext({ approval_granted_by: "lead@company.com" })
    );
    const rec = output.execution_approvals[0];
    assert.strictEqual(rec.approval_source_inputs.approval_granted_by, "lead@company.com");
    assert.strictEqual(rec.approval_source_inputs.candidate_id, CANDIDATE_ID);
    assert.strictEqual(rec.approval_source_inputs.checkpoint_id, CHECKPOINT_ID);
    assert.strictEqual(rec.approval_source_inputs.preview_id, PREVIEW_ID);
  });

  it("approval_decision_path contains expected gate tokens", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    const rec = output.execution_approvals[0];
    assert.ok(rec.approval_decision_path.includes(APPROVAL_GATE_TOKEN.CANDIDATE_VALID));
    assert.ok(rec.approval_decision_path.includes(APPROVAL_GATE_TOKEN.CHECKPOINT_RESOLVED));
    assert.ok(rec.approval_decision_path.includes(APPROVAL_GATE_TOKEN.PREVIEW_RESOLVED));
    assert.ok(rec.approval_decision_path.includes(APPROVAL_GATE_TOKEN.NOT_BLOCKED));
    assert.ok(rec.approval_decision_path.includes(APPROVAL_GATE_TOKEN.APPROVAL_INPUT_PRESENT));
    assert.ok(rec.approval_decision_path.includes(APPROVAL_GATE_TOKEN.CONNECTION_NOT_REQUIRED));
  });
});

// ---------------------------------------------------------------------------
// Approval does not imply execution occurred
// ---------------------------------------------------------------------------

describe("approval does not imply execution occurred", () => {
  it("execution_occurred is false on every produced approval record", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    for (const rec of output.execution_approvals) {
      assert.strictEqual(rec.execution_occurred, false);
    }
  });

  it("execution_occurred is false even for odoosh with branch target", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint({ execution_relevance: "Executable" })],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext({ deployment_type: "odoosh", odoosh_branch_target: "prod" }),
      null,
      makeApprovalContext()
    );
    for (const rec of output.execution_approvals) {
      assert.strictEqual(rec.execution_occurred, false);
    }
  });
});

// ---------------------------------------------------------------------------
// Contract shape compliance
// ---------------------------------------------------------------------------

describe("contract-shape compliance", () => {
  it("output container has execution_approvals, engine_version, generated_at", () => {
    const output = computeExecutionApprovals(
      [],
      [],
      null,
      null,
      null
    );
    assert.ok(Object.prototype.hasOwnProperty.call(output, "execution_approvals"));
    assert.ok(Object.prototype.hasOwnProperty.call(output, "engine_version"));
    assert.ok(Object.prototype.hasOwnProperty.call(output, "generated_at"));
    assert.ok(Array.isArray(output.execution_approvals));
    assert.strictEqual(output.engine_version, EXECUTION_APPROVAL_ENGINE_VERSION);
  });

  it("approval record does not contain execution outcome fields beyond execution_occurred", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    const rec = output.execution_approvals[0];
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "execution_result"), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "executed_at"), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(rec, "execution_status"), false);
  });

  it("every approval record has all required traceability fields", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    const rec = output.execution_approvals[0];
    assert.ok(rec.approval_id !== undefined);
    assert.ok(rec.candidate_id !== undefined);
    assert.ok(rec.checkpoint_id !== undefined);
    assert.ok(rec.preview_id !== undefined);
    assert.ok(rec.safety_class !== undefined);
    assert.ok(rec.approval_source_inputs !== undefined);
    assert.ok(rec.approval_decision_path !== undefined);
    assert.ok(rec.approved_at !== undefined);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("determinism", () => {
  it("produces identical approval_decision_path for identical inputs", () => {
    const args = [
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext(),
    ];
    const out1 = computeExecutionApprovals(...args);
    const out2 = computeExecutionApprovals(...args);
    assert.strictEqual(out1.execution_approvals[0].approval_decision_path,
      out2.execution_approvals[0].approval_decision_path);
  });

  it("produces the same number of approvals for identical inputs", () => {
    const args = [
      [makeCandidate(), makeCandidate({ candidate_id: "cand-002" })],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext(),
    ];
    const out1 = computeExecutionApprovals(...args);
    const out2 = computeExecutionApprovals(...args);
    assert.strictEqual(out1.execution_approvals.length, out2.execution_approvals.length);
  });

  it("produces no approvals when all candidates fail gates, consistently", () => {
    const args = [
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers([CHECKPOINT_ID]),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext(),
    ];
    const out1 = computeExecutionApprovals(...args);
    const out2 = computeExecutionApprovals(...args);
    assert.strictEqual(out1.execution_approvals.length, 0);
    assert.strictEqual(out2.execution_approvals.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Multiple candidates — partial approval
// ---------------------------------------------------------------------------

describe("multiple candidates — partial approval", () => {
  it("approves only candidates that pass all gates", () => {
    const candidates = [
      makeCandidate({ candidate_id: "cand-pass" }),
      makeCandidate({ candidate_id: "cand-blocked", checkpoint_id: "cp-blocked" }),
    ];
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: CHECKPOINT_ID }),
      makeCheckpoint({ checkpoint_id: "cp-blocked" }),
    ];
    const previews = [
      makePreviewRecord({ preview_id: PREVIEW_ID, checkpoint_id: CHECKPOINT_ID }),
      makePreviewRecord({ preview_id: "pv-blocked", checkpoint_id: "cp-blocked" }),
    ];
    candidates[1].preview_id = "pv-blocked";

    const output = computeExecutionApprovals(
      candidates,
      checkpoints,
      makeBlockers(["cp-blocked"]),
      previews,
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 1);
    assert.strictEqual(output.execution_approvals[0].candidate_id, "cand-pass");
  });
});

// ---------------------------------------------------------------------------
// Previews container shape — both array and object with .previews
// ---------------------------------------------------------------------------

describe("previews input shape handling", () => {
  it("resolves preview from flat array", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      [makePreviewRecord()],
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 1);
  });

  it("resolves preview from object with .previews array", () => {
    const output = computeExecutionApprovals(
      [makeCandidate()],
      [makeCheckpoint()],
      makeBlockers(),
      { previews: [makePreviewRecord()] },
      null,
      makeTargetContext(),
      null,
      makeApprovalContext()
    );
    assert.strictEqual(output.execution_approvals.length, 1);
  });
});
