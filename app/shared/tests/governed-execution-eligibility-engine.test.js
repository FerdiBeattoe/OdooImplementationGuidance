// ---------------------------------------------------------------------------
// Governed Execution Eligibility Engine Tests
// Tests for: app/shared/governed-execution-eligibility-engine.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Eligible preview produces execution candidate
//   2.  Missing preview produces no execution candidate
//   3.  Blocked checkpoint produces no execution candidate
//   4.  Missing target context prevents candidacy
//   5.  Null deployment_type prevents candidacy
//   6.  Missing branch target prevents candidacy for odoosh deployment
//   7.  Non-odoosh deployment does not gate on branch target
//   8.  Missing connection support prevents candidacy (connection required)
//   9.  Connection not required when connection_mode is null
//   10. Non-executable checkpoint produces no candidate
//   11. Missing safety class prevents candidacy
//   12. Execution approval implied is always false
//   13. Candidate record preserves checkpoint_id and preview_id linkage
//   14. Candidate record carries safety_class from checkpoint
//   15. Candidate record carries correct deployment_target and branch_context
//   16. eligibility_reason_path traces all satisfied gates
//   17. Mixed batch: only fully eligible checkpoints produce candidates
//   18. Determinism: identical inputs produce identical candidate checkpoint_ids
//   19. Contract-shape compliance: all required fields present and typed
//   20. Input validation: non-array checkpoints throws
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeExecutionEligibility,
  createExecutionCandidateRecord,
  createExecutionEligibilityOutput,
  EXECUTION_ELIGIBILITY_ENGINE_VERSION,
  EXECUTION_RELEVANCE_EXECUTABLE,
  EXEC_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES,
  ELIGIBILITY_GATE_TOKEN,
} from "../governed-execution-eligibility-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal checkpoint record.
 * Defaults: Executable, Foundational, safe — eligible for candidacy.
 */
function makeCheckpoint({
  checkpoint_id = "FND-FOUND-001",
  domain = "foundation",
  checkpoint_class = "Foundational",
  validation_source = "System_Detectable",
  status = "In_Progress",
  dependencies = [],
  execution_relevance = "Executable",
  preview_required = true,
  safety_class = "safe",
  downstream_impact_summary = "Downstream impact.",
} = {}) {
  return {
    checkpoint_id,
    domain,
    checkpoint_class,
    validation_source,
    status,
    dependencies,
    execution_relevance,
    preview_required,
    safety_class,
    downstream_impact_summary,
  };
}

/**
 * Builds a minimal preview record linked to a checkpoint.
 */
function makePreviewRecord({
  preview_id = "preview-001",
  checkpoint_id = "FND-FOUND-001",
  checkpoint_class = "Foundational",
  safety_class = "safe",
  intended_operation_class = "Executable",
  deployment_target = "odoosh",
  branch_context = "main",
} = {}) {
  return {
    preview_id,
    checkpoint_id,
    checkpoint_class,
    safety_class,
    intended_operation_class,
    deployment_target,
    branch_context,
    execution_approval_implied: false,
    stale: false,
    linked_execution_id: null,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Builds a previews container (engine output shape).
 */
function makePreviews(records = []) {
  return {
    previews: records,
    engine_version: "1.0.0",
    generated_at: new Date().toISOString(),
  };
}

/**
 * Builds a minimal blockers container with given blocked checkpoint_ids.
 */
function makeBlockers(blockedCheckpointIds = []) {
  const active_blockers = blockedCheckpointIds.map((id) => ({
    blocker_id: `${id}:blocker`,
    source_checkpoint_id: id,
    source_domain_id: "foundation",
    blocker_type: "evidence_missing",
    severity: "critical",
    created_at: new Date().toISOString(),
  }));
  return {
    active_blockers,
    total_count: active_blockers.length,
    by_severity: null,
    by_stage: null,
    by_domain: null,
    highest_priority_blocker: null,
  };
}

/**
 * Builds an odoosh target_context with connection_mode set.
 */
function makeOdooshTargetContext({
  odoosh_branch_target = "main",
  odoosh_environment_type = "production",
  connection_mode = "application-layer",
  connection_status = "connected_execute",
} = {}) {
  return {
    odoo_version: "19",
    edition: "enterprise",
    deployment_type: "odoosh",
    primary_country: null,
    primary_currency: null,
    multi_company: false,
    multi_currency: false,
    odoosh_branch_target,
    odoosh_environment_type,
    connection_mode,
    connection_status,
    connection_target_id: null,
    connection_capability_note: null,
  };
}

/**
 * Builds a target_context without connection_mode set.
 */
function makeOdooshTargetContextNoConnection({
  odoosh_branch_target = "main",
} = {}) {
  return {
    odoo_version: "19",
    edition: "enterprise",
    deployment_type: "odoosh",
    primary_country: null,
    primary_currency: null,
    multi_company: false,
    multi_currency: false,
    odoosh_branch_target,
    odoosh_environment_type: "production",
    connection_mode: null,
    connection_status: null,
    connection_target_id: null,
    connection_capability_note: null,
  };
}

/**
 * Builds a self-hosted target_context (no branch/connection requirements).
 */
function makeSelfHostedTargetContext({
  connection_mode = null,
} = {}) {
  return {
    odoo_version: "19",
    edition: "community",
    deployment_type: "self_hosted",
    primary_country: null,
    primary_currency: null,
    multi_company: false,
    multi_currency: false,
    odoosh_branch_target: null,
    odoosh_environment_type: null,
    connection_mode,
    connection_status: null,
    connection_target_id: null,
    connection_capability_note: null,
  };
}

/**
 * Builds a connection_state with execute capability available.
 */
function makeConnectionStateExecute() {
  return {
    mode: "application-layer",
    status: "connected_execute",
    capabilityLevel: "execute",
    supported: true,
    reason: "",
    lastCheckedAt: new Date().toISOString(),
    connectedAt: new Date().toISOString(),
    environmentIdentity: {
      urlOrigin: "https://example.odoo.com",
      database: "test_db",
      serverVersion: "19.0",
      serverSerie: "19.0",
      edition: "enterprise",
      deployment: "odoosh",
      branchTarget: "main",
      environmentTarget: "production",
    },
    availableFeatures: {
      inspect: true,
      preview: true,
      execute: true,
    },
  };
}

/**
 * Builds a connection_state with only preview capability (no execute).
 */
function makeConnectionStatePreviewOnly() {
  return {
    mode: "application-layer",
    status: "connected_preview",
    capabilityLevel: "preview",
    supported: true,
    reason: "",
    lastCheckedAt: new Date().toISOString(),
    connectedAt: new Date().toISOString(),
    environmentIdentity: {
      urlOrigin: "https://example.odoo.com",
      database: "test_db",
      serverVersion: "19.0",
      serverSerie: "19.0",
      edition: "enterprise",
      deployment: "odoosh",
      branchTarget: "main",
      environmentTarget: "production",
    },
    availableFeatures: {
      inspect: true,
      preview: true,
      execute: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Test 1: Eligible preview produces execution candidate
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — eligible candidate", () => {
  it("produces one candidate for a single fully eligible checkpoint", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 1);
    assert.equal(result.engine_version, EXECUTION_ELIGIBILITY_ENGINE_VERSION);
    assert.ok(typeof result.generated_at === "string");
  });
});

// ---------------------------------------------------------------------------
// Test 2: Missing preview produces no execution candidate
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — missing preview", () => {
  it("produces no candidate when previews is an empty array", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces no candidate when previews is null", () => {
    const checkpoints = [makeCheckpoint()];
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, null, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces no candidate when preview for checkpoint is missing (wrong checkpoint_id)", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "CK-001" })];
    const previews = makePreviews([makePreviewRecord({ checkpoint_id: "CK-DIFFERENT" })]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces no candidate when preview_id is an empty string", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "CK-001" })];
    const badPreview = makePreviewRecord({ checkpoint_id: "CK-001", preview_id: "" });
    const previews = makePreviews([badPreview]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Blocked checkpoint produces no execution candidate
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — blocked checkpoint", () => {
  it("produces no candidate for a blocked checkpoint", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "CK-001" })];
    const previews = makePreviews([makePreviewRecord({ checkpoint_id: "CK-001" })]);
    const blockers = makeBlockers(["CK-001"]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("only blocked checkpoint is excluded; unblocked eligible checkpoint still produces candidate", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "CK-001" }),
      makeCheckpoint({ checkpoint_id: "CK-002" }),
    ];
    const previews = makePreviews([
      makePreviewRecord({ checkpoint_id: "CK-001", preview_id: "prev-001" }),
      makePreviewRecord({ checkpoint_id: "CK-002", preview_id: "prev-002" }),
    ]);
    const blockers = makeBlockers(["CK-001"]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 1);
    assert.equal(result.execution_candidates[0].checkpoint_id, "CK-002");
  });
});

// ---------------------------------------------------------------------------
// Test 4: Missing target context prevents candidacy
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — target context required", () => {
  it("produces no candidate when target_context is null", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, null, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 5: Null deployment_type prevents candidacy
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — null deployment_type", () => {
  it("produces no candidate when deployment_type is null in target_context", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const partial_ctx = { odoo_version: "19", deployment_type: null, connection_mode: null };
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, partial_ctx, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 6: Missing branch target prevents candidacy for odoosh
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — odoosh branch target required", () => {
  it("produces no candidate when odoosh_branch_target is null", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ odoosh_branch_target: null });
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces no candidate when odoosh_branch_target is empty string", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ odoosh_branch_target: "" });
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces a candidate when odoosh_branch_target is explicitly set", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord({ branch_context: "feature-branch" })]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ odoosh_branch_target: "feature-branch" });
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 1);
    assert.equal(result.execution_candidates[0].branch_context, "feature-branch");
  });
});

// ---------------------------------------------------------------------------
// Test 7: Non-odoosh deployment does not gate on branch target
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — non-odoosh branch gate absent", () => {
  it("produces a candidate for self_hosted without branch target and without connection", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord({ deployment_target: "self_hosted", branch_context: null })]);
    const blockers = makeBlockers([]);
    const target_context = makeSelfHostedTargetContext({ connection_mode: null });

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, null
    );

    assert.equal(result.execution_candidates.length, 1);
    assert.equal(result.execution_candidates[0].deployment_target, "self_hosted");
    assert.equal(result.execution_candidates[0].branch_context, null);
  });
});

// ---------------------------------------------------------------------------
// Test 8: Missing connection support prevents candidacy (connection required)
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — connection support required", () => {
  it("produces no candidate when connection_mode is set but connection_state is null", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ connection_mode: "application-layer" });

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, null
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces no candidate when connection_mode is set and execute feature is false", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ connection_mode: "application-layer" });
    const connection_state = makeConnectionStatePreviewOnly();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces a candidate when connection_mode is set and execute feature is true", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ connection_mode: "application-layer" });
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Test 9: Connection not required when connection_mode is null
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — connection not required", () => {
  it("produces a candidate when connection_mode is null and connection_state is null", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContextNoConnection();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, null
    );

    assert.equal(result.execution_candidates.length, 1);
    assert.ok(
      result.execution_candidates[0].eligibility_reason_path.includes(
        ELIGIBILITY_GATE_TOKEN.CONNECTION_NOT_REQUIRED
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Test 10: Non-executable checkpoint produces no candidate
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — non-executable refusal", () => {
  it("produces no candidate for Informational checkpoint", () => {
    const checkpoints = [makeCheckpoint({ execution_relevance: "Informational" })];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces no candidate when execution_relevance is null", () => {
    const checkpoints = [makeCheckpoint({ execution_relevance: null })];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 11: Missing safety class prevents candidacy
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — safety class required", () => {
  it("produces no candidate when safety_class is null", () => {
    const checkpoints = [makeCheckpoint({ safety_class: null })];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });

  it("produces no candidate when safety_class is empty string", () => {
    const checkpoints = [makeCheckpoint({ safety_class: "" })];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 12: Execution approval implied is always false
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — no execution approval", () => {
  it("execution_approval_implied is false on every candidate record", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "CK-001" }),
      makeCheckpoint({ checkpoint_id: "CK-002" }),
    ];
    const previews = makePreviews([
      makePreviewRecord({ checkpoint_id: "CK-001", preview_id: "prev-001" }),
      makePreviewRecord({ checkpoint_id: "CK-002", preview_id: "prev-002" }),
    ]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 2);
    for (const candidate of result.execution_candidates) {
      assert.equal(candidate.execution_approval_implied, false);
    }
  });

  it("createExecutionCandidateRecord always sets execution_approval_implied to false", () => {
    const record = createExecutionCandidateRecord({
      candidate_id: "test-cand-001",
      checkpoint_id: "CK-001",
      preview_id: "prev-001",
      safety_class: "safe",
    });
    assert.equal(record.execution_approval_implied, false);
  });
});

// ---------------------------------------------------------------------------
// Test 13: Candidate record preserves checkpoint_id and preview_id linkage
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — linkage traceability", () => {
  it("candidate carries the governing checkpoint_id and linked preview_id", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "FND-FOUND-007" })];
    const previews = makePreviews([
      makePreviewRecord({ checkpoint_id: "FND-FOUND-007", preview_id: "preview-abc-123" }),
    ]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 1);
    assert.equal(result.execution_candidates[0].checkpoint_id, "FND-FOUND-007");
    assert.equal(result.execution_candidates[0].preview_id, "preview-abc-123");
  });

  it("candidate carries checkpoint_class from governing checkpoint", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_class: "Go_Live" })];
    const previews = makePreviews([makePreviewRecord({ checkpoint_class: "Go_Live" })]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates[0].checkpoint_class, "Go_Live");
  });
});

// ---------------------------------------------------------------------------
// Test 14: Candidate carries safety_class from checkpoint
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — safety class carriage", () => {
  it("candidate carries the safety_class from the governing checkpoint", () => {
    const checkpoints = [makeCheckpoint({ safety_class: "high" })];
    const previews = makePreviews([makePreviewRecord({ safety_class: "high" })]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates[0].safety_class, "high");
  });
});

// ---------------------------------------------------------------------------
// Test 15: Candidate carries correct deployment_target and branch_context
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — deployment context carriage", () => {
  it("candidate carries deployment_target from target_context", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ odoosh_branch_target: "release-19" });
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates[0].deployment_target, "odoosh");
    assert.equal(result.execution_candidates[0].branch_context, "release-19");
  });

  it("candidate carries connection_support_status from connection_state", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates[0].connection_support_status, "connected_execute");
  });
});

// ---------------------------------------------------------------------------
// Test 16: eligibility_reason_path traces all satisfied gates
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — eligibility_reason_path", () => {
  it("path includes all expected gate tokens for odoosh with connection", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    const path = result.execution_candidates[0].eligibility_reason_path;
    assert.ok(path.includes(ELIGIBILITY_GATE_TOKEN.PREVIEW_LINKED));
    assert.ok(path.includes(ELIGIBILITY_GATE_TOKEN.NOT_BLOCKED));
    assert.ok(path.includes(ELIGIBILITY_GATE_TOKEN.EXECUTABLE));
    assert.ok(path.includes(ELIGIBILITY_GATE_TOKEN.SAFETY_CLASS_PRESENT));
    assert.ok(path.includes(ELIGIBILITY_GATE_TOKEN.TARGET_CONTEXT_VALID));
    assert.ok(path.includes(ELIGIBILITY_GATE_TOKEN.BRANCH_TARGET_PRESENT));
    assert.ok(path.includes(ELIGIBILITY_GATE_TOKEN.CONNECTION_SUPPORTED));
  });

  it("path includes CONNECTION_NOT_REQUIRED when connection_mode is null", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord()]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContextNoConnection();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, null
    );

    const path = result.execution_candidates[0].eligibility_reason_path;
    assert.ok(path.includes(ELIGIBILITY_GATE_TOKEN.CONNECTION_NOT_REQUIRED));
    assert.ok(!path.includes(ELIGIBILITY_GATE_TOKEN.CONNECTION_SUPPORTED));
  });

  it("path does not include BRANCH_TARGET_PRESENT for self_hosted", () => {
    const checkpoints = [makeCheckpoint()];
    const previews = makePreviews([makePreviewRecord({ deployment_target: "self_hosted" })]);
    const blockers = makeBlockers([]);
    const target_context = makeSelfHostedTargetContext({ connection_mode: null });

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, null
    );

    const path = result.execution_candidates[0].eligibility_reason_path;
    assert.ok(!path.includes(ELIGIBILITY_GATE_TOKEN.BRANCH_TARGET_PRESENT));
  });
});

// ---------------------------------------------------------------------------
// Test 17: Mixed batch — only fully eligible checkpoints produce candidates
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — mixed eligibility batch", () => {
  it("emits only eligible candidates from a mixed batch", () => {
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "CK-001" }),                           // eligible
      makeCheckpoint({ checkpoint_id: "CK-002" }),                           // blocked
      makeCheckpoint({ checkpoint_id: "CK-003", execution_relevance: "Informational" }), // non-executable
      makeCheckpoint({ checkpoint_id: "CK-004", safety_class: null }),       // missing safety class
      makeCheckpoint({ checkpoint_id: "CK-005" }),                           // eligible
      makeCheckpoint({ checkpoint_id: "CK-006" }),                           // no preview
    ];

    const previews = makePreviews([
      makePreviewRecord({ checkpoint_id: "CK-001", preview_id: "prev-001" }),
      makePreviewRecord({ checkpoint_id: "CK-002", preview_id: "prev-002" }),
      makePreviewRecord({ checkpoint_id: "CK-003", preview_id: "prev-003" }),
      makePreviewRecord({ checkpoint_id: "CK-004", preview_id: "prev-004" }),
      makePreviewRecord({ checkpoint_id: "CK-005", preview_id: "prev-005" }),
      // CK-006 has no preview
    ]);

    const blockers = makeBlockers(["CK-002"]);

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 2);
    const ids = result.execution_candidates.map((c) => c.checkpoint_id);
    assert.ok(ids.includes("CK-001"));
    assert.ok(ids.includes("CK-005"));
    assert.ok(!ids.includes("CK-002")); // blocked
    assert.ok(!ids.includes("CK-003")); // non-executable
    assert.ok(!ids.includes("CK-004")); // missing safety class
    assert.ok(!ids.includes("CK-006")); // no preview
  });
});

// ---------------------------------------------------------------------------
// Test 18: Determinism
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — determinism", () => {
  it("produces the same candidate checkpoint_ids across two runs with identical inputs", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "CK-001" }),
      makeCheckpoint({ checkpoint_id: "CK-002", execution_relevance: "Informational" }),
      makeCheckpoint({ checkpoint_id: "CK-003" }),
    ];
    const previews = makePreviews([
      makePreviewRecord({ checkpoint_id: "CK-001", preview_id: "prev-001" }),
      makePreviewRecord({ checkpoint_id: "CK-003", preview_id: "prev-003" }),
    ]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const r1 = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );
    const r2 = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    const ids1 = r1.execution_candidates.map((c) => c.checkpoint_id).sort();
    const ids2 = r2.execution_candidates.map((c) => c.checkpoint_id).sort();
    assert.deepEqual(ids1, ids2);
    assert.equal(r1.execution_candidates.length, r2.execution_candidates.length);
  });

  it("produces the same field values (safety_class, intended_operation_class) across two runs", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "CK-001", safety_class: "high" })];
    const previews = makePreviews([makePreviewRecord({ checkpoint_id: "CK-001" })]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const r1 = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );
    const r2 = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(r1.execution_candidates[0].safety_class, r2.execution_candidates[0].safety_class);
    assert.equal(
      r1.execution_candidates[0].intended_operation_class,
      r2.execution_candidates[0].intended_operation_class
    );
    assert.equal(
      r1.execution_candidates[0].eligibility_reason_path,
      r2.execution_candidates[0].eligibility_reason_path
    );
  });
});

// ---------------------------------------------------------------------------
// Test 19: Contract-shape compliance
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — contract-shape compliance", () => {
  it("candidate record contains all required fields with correct types", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "SHAPE-001" })];
    const previews = makePreviews([makePreviewRecord({ checkpoint_id: "SHAPE-001", preview_id: "prev-shape-001" })]);
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, previews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 1);
    const c = result.execution_candidates[0];

    assert.ok(typeof c.candidate_id === "string" && c.candidate_id.length > 0);
    assert.equal(c.checkpoint_id, "SHAPE-001");
    assert.equal(c.preview_id, "prev-shape-001");
    assert.ok("checkpoint_class" in c);
    assert.ok("safety_class" in c);
    assert.ok("intended_operation_class" in c);
    assert.ok("deployment_target" in c);
    assert.ok("branch_context" in c);
    assert.ok("connection_support_status" in c);
    assert.ok(typeof c.eligibility_reason_path === "string");
    assert.equal(c.execution_approval_implied, false);
    assert.ok(typeof c.generated_at === "string");
  });

  it("output container contains execution_candidates, engine_version, and generated_at", () => {
    const result = computeExecutionEligibility([], null, null, null, null, null, null);

    assert.ok(Array.isArray(result.execution_candidates));
    assert.equal(typeof result.engine_version, "string");
    assert.equal(typeof result.generated_at, "string");
    assert.equal(result.engine_version, EXECUTION_ELIGIBILITY_ENGINE_VERSION);
  });

  it("createExecutionEligibilityOutput returns correct container shape", () => {
    const output = createExecutionEligibilityOutput({
      execution_candidates: [],
      engine_version: EXECUTION_ELIGIBILITY_ENGINE_VERSION,
      generated_at: new Date().toISOString(),
    });

    assert.ok(Array.isArray(output.execution_candidates));
    assert.equal(output.engine_version, EXECUTION_ELIGIBILITY_ENGINE_VERSION);
    assert.ok(typeof output.generated_at === "string");
  });

  it("createExecutionCandidateRecord returns all governed fields", () => {
    const record = createExecutionCandidateRecord({
      candidate_id: "cand-001",
      checkpoint_id: "FND-FOUND-001",
      preview_id: "prev-001",
      checkpoint_class: "Foundational",
      safety_class: "safe",
      intended_operation_class: "Executable",
      deployment_target: "odoosh",
      branch_context: "main",
      connection_support_status: "connected_execute",
      eligibility_reason_path: "preview_linked|not_blocked|executable",
      generated_at: "2026-03-27T00:00:00.000Z",
    });

    assert.equal(record.candidate_id, "cand-001");
    assert.equal(record.checkpoint_id, "FND-FOUND-001");
    assert.equal(record.preview_id, "prev-001");
    assert.equal(record.checkpoint_class, "Foundational");
    assert.equal(record.safety_class, "safe");
    assert.equal(record.intended_operation_class, "Executable");
    assert.equal(record.deployment_target, "odoosh");
    assert.equal(record.branch_context, "main");
    assert.equal(record.connection_support_status, "connected_execute");
    assert.equal(record.eligibility_reason_path, "preview_linked|not_blocked|executable");
    assert.equal(record.execution_approval_implied, false);
    assert.equal(record.generated_at, "2026-03-27T00:00:00.000Z");
  });

  it("previews container can be passed as a raw array (not wrapped in engine output)", () => {
    const checkpoints = [makeCheckpoint()];
    const rawPreviews = [makePreviewRecord()];
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const connection_state = makeConnectionStateExecute();

    const result = computeExecutionEligibility(
      checkpoints, null, blockers, rawPreviews, null, target_context, connection_state
    );

    assert.equal(result.execution_candidates.length, 1);
  });
});

// ---------------------------------------------------------------------------
// Test 20: Input validation
// ---------------------------------------------------------------------------

describe("computeExecutionEligibility — input validation", () => {
  it("throws when checkpoints is not an array", () => {
    assert.throws(
      () => computeExecutionEligibility(null, null, null, null, null),
      /checkpoints must be an array/
    );
  });

  it("throws when checkpoints is an object", () => {
    assert.throws(
      () => computeExecutionEligibility({}, null, null, null, null),
      /checkpoints must be an array/
    );
  });

  it("does not throw when blockers is null", () => {
    const result = computeExecutionEligibility([], null, null, null, null);
    assert.equal(result.execution_candidates.length, 0);
  });

  it("does not throw when validated_checkpoints is null", () => {
    const result = computeExecutionEligibility([], null, null, null, null);
    assert.equal(result.execution_candidates.length, 0);
  });

  it("handles empty checkpoints array gracefully", () => {
    const result = computeExecutionEligibility([], null, makeBlockers([]), makePreviews([]), null, null, null);
    assert.equal(result.execution_candidates.length, 0);
    assert.equal(result.engine_version, EXECUTION_ELIGIBILITY_ENGINE_VERSION);
  });
});

// ---------------------------------------------------------------------------
// Test: Exported constants
// ---------------------------------------------------------------------------

describe("governed-execution-eligibility-engine — exported constants", () => {
  it("EXECUTION_ELIGIBILITY_ENGINE_VERSION is a non-empty string", () => {
    assert.ok(typeof EXECUTION_ELIGIBILITY_ENGINE_VERSION === "string");
    assert.ok(EXECUTION_ELIGIBILITY_ENGINE_VERSION.length > 0);
  });

  it("EXECUTION_RELEVANCE_EXECUTABLE is 'Executable'", () => {
    assert.equal(EXECUTION_RELEVANCE_EXECUTABLE, "Executable");
  });

  it("EXEC_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES includes odoosh", () => {
    assert.ok(EXEC_BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES.includes("odoosh"));
  });

  it("ELIGIBILITY_GATE_TOKEN contains all expected gate keys", () => {
    assert.ok(typeof ELIGIBILITY_GATE_TOKEN.PREVIEW_LINKED === "string");
    assert.ok(typeof ELIGIBILITY_GATE_TOKEN.NOT_BLOCKED === "string");
    assert.ok(typeof ELIGIBILITY_GATE_TOKEN.EXECUTABLE === "string");
    assert.ok(typeof ELIGIBILITY_GATE_TOKEN.SAFETY_CLASS_PRESENT === "string");
    assert.ok(typeof ELIGIBILITY_GATE_TOKEN.TARGET_CONTEXT_VALID === "string");
    assert.ok(typeof ELIGIBILITY_GATE_TOKEN.BRANCH_TARGET_PRESENT === "string");
    assert.ok(typeof ELIGIBILITY_GATE_TOKEN.CONNECTION_SUPPORTED === "string");
    assert.ok(typeof ELIGIBILITY_GATE_TOKEN.CONNECTION_NOT_REQUIRED === "string");
  });
});
