// ---------------------------------------------------------------------------
// Pipeline Contract Snapshot Harness — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   End-to-end runtime contract snapshot verification for the shared pipeline.
//   Verifies that full pipeline output remains contract-stable across:
//     - minimal valid input path
//     - conditional discovery path
//     - blocked path (empty answers)
//     - previewable path (target_context present)
//     - execution-approved-but-not-executed path
//     - executed path with explicit execution_result
//
// Rules:
//   - Deterministic only. Fixed fixtures only. No business inference.
//   - Verify end-to-end runtime state shape and governed invariants.
//   - Fail loudly on contract drift: unexpected field addition/removal,
//     enum drift, wrong null/default shapes, mutated structure.
//   - Normalize volatile timestamps/UUIDs before snapshotting.
//   - Normalization must not mask structural drift.
// ---------------------------------------------------------------------------

"use strict";

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  runPipeline,
  PIPELINE_ORCHESTRATOR_VERSION,
} from "../pipeline-orchestrator.js";

import { createDiscoveryAnswers } from "../runtime-state-contract.js";

// ---------------------------------------------------------------------------
// Timestamp / UUID normalization
//
// ISO 8601 timestamps are volatile per-run (orchestrated_at, composed_at,
// activated_at, blocker created_at, etc.). UUIDs are volatile where
// crypto.randomUUID() is called (preview_id, candidate_id, approval_id,
// execution_id, deferment_id).
//
// Normalization replaces volatile scalar strings with canonical tokens so
// that two runs with identical inputs produce identical normalized output.
// Array structure and object shape are preserved — only volatile scalars change.
// ---------------------------------------------------------------------------

const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeSnapshot(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") {
    if (ISO_TIMESTAMP_RE.test(obj)) return "NORMALIZED_TIMESTAMP";
    if (UUID_RE.test(obj)) return "NORMALIZED_UUID";
    return obj;
  }
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(normalizeSnapshot);
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = normalizeSnapshot(v);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Exact key set assertion
//
// Fails loudly if actual keys differ from expected (addition OR removal).
// The error message always includes "key set drift" so assert.throws callers
// can match it with /key set drift/.
// ---------------------------------------------------------------------------

function assertExactKeys(actual, expectedKeys, label) {
  const actualSorted = Object.keys(actual).sort();
  const expectedSorted = [...expectedKeys].sort();
  assert.deepStrictEqual(
    actualSorted,
    expectedSorted,
    `${label}: key set drift — expected [${expectedSorted.join(", ")}], ` +
      `got [${actualSorted.join(", ")}]`
  );
}

// ---------------------------------------------------------------------------
// Golden key sets — frozen contract snapshots
//
// Any deviation from these sets is a contract drift and must fail loudly.
// The sets are derived directly from the runtime contract spec and pipeline
// orchestrator assembly (pipeline-orchestrator.js step 12).
// ---------------------------------------------------------------------------

// 22 top-level keys produced by runPipeline
export const GOLDEN_TOP_LEVEL_KEYS = Object.freeze(
  [
    "_engine_outputs",
    "activated_domains",
    "audit_refs",
    "blockers",
    "checkpoints",
    "composed_at",
    "composer_version",
    "connection_state",
    "decisions",
    "deferments",
    "discovery_answers",
    "executions",
    "orchestrated_at",
    "orchestrator_version",
    "previews",
    "project_identity",
    "readiness_state",
    "readiness_summary",
    "resume_context",
    "stage_state",
    "target_context",
    "training_state",
  ].sort()
);

// 11 readiness_state keys — §1.8; no __owner in engine output
export const GOLDEN_READINESS_STATE_KEYS = Object.freeze(
  [
    "blocked_checkpoints",
    "deferred_checkpoints",
    "go_live_readiness",
    "incomplete_critical_checkpoints",
    "readiness_reason",
    "recommendation_issued",
    "recommendation_issued_at",
    "recommendation_issued_by",
    "recommendation_withheld_reason",
    "training_status",
    "unresolved_warnings",
  ].sort()
);

// 6 blockers keys — §1.9
export const GOLDEN_BLOCKERS_KEYS = Object.freeze(
  [
    "active_blockers",
    "by_domain",
    "by_severity",
    "by_stage",
    "highest_priority_blocker",
    "total_count",
  ].sort()
);

// 4 audit_refs keys — §1.14 (stub — all null in first-pass pipeline)
export const GOLDEN_AUDIT_REFS_KEYS = Object.freeze(
  ["by_checkpoint", "by_decision", "by_execution", "by_preview"].sort()
);

// 10 resume_context keys — §1.16 (stub — all null/[] in first-pass pipeline)
export const GOLDEN_RESUME_CONTEXT_KEYS = Object.freeze(
  [
    "current_stages",
    "highest_priority_blocker",
    "next_required_action",
    "resume_context_message",
    "resume_target_checkpoint_id",
    "resume_target_domain_id",
    "resume_target_stage_id",
    "resume_target_type",
    "secondary_action_queue",
    "stale_state_alerts",
  ].sort()
);

// 7 _engine_outputs keys
export const GOLDEN_ENGINE_OUTPUTS_KEYS = Object.freeze(
  [
    "checkpoints_output",
    "execution_approvals",
    "execution_eligibility",
    "execution_records",
    "preview_engine_output",
    "stage_routing",
    "validated_checkpoints",
  ].sort()
);

// Valid go_live_readiness enum values (GoLiveReadinessEngine constants)
const VALID_READINESS_ENUMS = Object.freeze([
  "Ready",
  "Not_Ready",
  "Configuration_Complete_Not_Operationally_Ready",
]);

// ---------------------------------------------------------------------------
// Core shape assertion
//
// Asserts that the full pipeline output matches the frozen contract topology.
// Fails loudly on any unexpected key addition or removal at any governed level.
// ---------------------------------------------------------------------------

function assertContractShape(result, label) {
  assertExactKeys(result, GOLDEN_TOP_LEVEL_KEYS, `${label}/top-level`);
  assertExactKeys(
    result.readiness_state,
    GOLDEN_READINESS_STATE_KEYS,
    `${label}/readiness_state`
  );
  assertExactKeys(result.blockers, GOLDEN_BLOCKERS_KEYS, `${label}/blockers`);
  assertExactKeys(
    result.audit_refs,
    GOLDEN_AUDIT_REFS_KEYS,
    `${label}/audit_refs`
  );
  assertExactKeys(
    result.resume_context,
    GOLDEN_RESUME_CONTEXT_KEYS,
    `${label}/resume_context`
  );
  assertExactKeys(
    result._engine_outputs,
    GOLDEN_ENGINE_OUTPUTS_KEYS,
    `${label}/_engine_outputs`
  );
}

// ---------------------------------------------------------------------------
// Type and invariant assertions
//
// Asserts required field types and governed invariants that hold for every
// pipeline path. These are contract-stable regardless of input scenario.
// ---------------------------------------------------------------------------

function assertTypeInvariants(result, label) {
  // Orchestrator metadata
  assert.strictEqual(
    typeof result.orchestrator_version,
    "string",
    `${label}: orchestrator_version must be string`
  );
  assert.strictEqual(
    result.orchestrator_version,
    PIPELINE_ORCHESTRATOR_VERSION,
    `${label}: orchestrator_version enum drift`
  );
  assert.ok(
    ISO_TIMESTAMP_RE.test(result.orchestrated_at),
    `${label}: orchestrated_at must be ISO timestamp`
  );
  assert.ok(
    ISO_TIMESTAMP_RE.test(result.composed_at),
    `${label}: composed_at must be ISO timestamp`
  );

  // Array invariants — always arrays regardless of content
  assert.ok(
    Array.isArray(result.checkpoints),
    `${label}: checkpoints must be array`
  );
  assert.ok(
    Array.isArray(result.decisions),
    `${label}: decisions must be array`
  );
  assert.ok(
    Array.isArray(result.stage_state),
    `${label}: stage_state must be array`
  );
  assert.ok(
    Array.isArray(result.deferments),
    `${label}: deferments must be array`
  );
  assert.ok(
    Array.isArray(result.previews),
    `${label}: previews must be array`
  );
  assert.ok(
    Array.isArray(result.executions),
    `${label}: executions must be array`
  );
  assert.ok(
    Array.isArray(result.readiness_state.incomplete_critical_checkpoints),
    `${label}: readiness_state.incomplete_critical_checkpoints must be array`
  );
  assert.ok(
    Array.isArray(result.readiness_state.blocked_checkpoints),
    `${label}: readiness_state.blocked_checkpoints must be array`
  );
  assert.ok(
    Array.isArray(result.readiness_state.deferred_checkpoints),
    `${label}: readiness_state.deferred_checkpoints must be array`
  );
  assert.ok(
    Array.isArray(result.readiness_state.unresolved_warnings),
    `${label}: readiness_state.unresolved_warnings must be array`
  );
  assert.ok(
    Array.isArray(result.blockers.active_blockers),
    `${label}: blockers.active_blockers must be array`
  );
  assert.ok(
    Array.isArray(result.resume_context.current_stages),
    `${label}: resume_context.current_stages must be array`
  );
  assert.ok(
    Array.isArray(result.resume_context.stale_state_alerts),
    `${label}: resume_context.stale_state_alerts must be array`
  );
  assert.ok(
    Array.isArray(result.resume_context.secondary_action_queue),
    `${label}: resume_context.secondary_action_queue must be array`
  );

  // blockers.total_count must exactly equal active_blockers.length
  assert.strictEqual(
    result.blockers.total_count,
    result.blockers.active_blockers.length,
    `${label}: blockers.total_count must equal active_blockers.length`
  );

  // Boolean invariants
  assert.strictEqual(
    typeof result.readiness_state.recommendation_issued,
    "boolean",
    `${label}: readiness_state.recommendation_issued must be boolean`
  );
  assert.strictEqual(
    result.readiness_state.recommendation_issued,
    false,
    `${label}: readiness_state.recommendation_issued must be false (first-pass)`
  );

  // Null invariants — always null in first-pass pipeline
  assert.strictEqual(
    result.readiness_state.recommendation_issued_at,
    null,
    `${label}: readiness_state.recommendation_issued_at must be null`
  );
  assert.strictEqual(
    result.readiness_state.recommendation_issued_by,
    null,
    `${label}: readiness_state.recommendation_issued_by must be null`
  );
  assert.strictEqual(
    result.audit_refs.by_checkpoint,
    null,
    `${label}: audit_refs.by_checkpoint must be null (stub)`
  );
  assert.strictEqual(
    result.audit_refs.by_decision,
    null,
    `${label}: audit_refs.by_decision must be null (stub)`
  );
  assert.strictEqual(
    result.audit_refs.by_preview,
    null,
    `${label}: audit_refs.by_preview must be null (stub)`
  );
  assert.strictEqual(
    result.audit_refs.by_execution,
    null,
    `${label}: audit_refs.by_execution must be null (stub)`
  );
  assert.strictEqual(
    result.resume_context.resume_target_type,
    null,
    `${label}: resume_context.resume_target_type must be null (stub)`
  );

  // go_live_readiness must be a string in the governed enum
  assert.strictEqual(
    typeof result.readiness_state.go_live_readiness,
    "string",
    `${label}: readiness_state.go_live_readiness must be string`
  );
  assert.ok(
    VALID_READINESS_ENUMS.includes(result.readiness_state.go_live_readiness),
    `${label}: go_live_readiness enum drift: "${result.readiness_state.go_live_readiness}"`
  );

  // activated_domains
  assert.ok(
    result.activated_domains !== null &&
      typeof result.activated_domains === "object" &&
      !Array.isArray(result.activated_domains),
    `${label}: activated_domains must be object`
  );
  assert.ok(
    Array.isArray(result.activated_domains.domains),
    `${label}: activated_domains.domains must be array`
  );

  // preview_engine_output.previews must equal result.previews (same reference after assembly)
  assert.deepStrictEqual(
    result.previews,
    result._engine_outputs.preview_engine_output.previews,
    `${label}: result.previews must equal preview_engine_output.previews`
  );

  // execution_records.executions must equal result.executions
  assert.deepStrictEqual(
    result.executions,
    result._engine_outputs.execution_records.executions,
    `${label}: result.executions must equal execution_records.executions`
  );
}

// ---------------------------------------------------------------------------
// Full snapshot assertion (shape + invariants combined)
// ---------------------------------------------------------------------------

function assertSnapshot(result, label) {
  assertContractShape(result, label);
  assertTypeInvariants(result, label);
}

// ---------------------------------------------------------------------------
// Fixture factories — deterministic fixed inputs only
// ---------------------------------------------------------------------------

function makeDiscoveryAnswers(overrides = {}) {
  const da = createDiscoveryAnswers({ framework_version: "1.0" });
  da.answers = { ...overrides };
  return da;
}

// Minimal valid answer set — activates unconditional domains only
function minimalAnswers() {
  return makeDiscoveryAnswers({
    "BM-01": "Services only",
    "BM-02": false,
    "BM-03": "AU",
    "BM-04": false,
    "BM-05": 5,
    "RM-01": ["One-time service delivery"],
    "RM-02": false,
    "RM-03": false,
    "RM-04": false,
    "OP-01": false,
    "OP-03": false,
    "OP-04": false,
    "OP-05": false,
    "SC-01": false,
    "SC-02": false,
    "SC-03": false,
    "SC-04": "Discounting is not permitted",
    "PI-01": false,
    "PI-05": false,
    "FC-01": "Not using Odoo for financials",
    "FC-04": false,
    "FC-05": false,
    "FC-06": false,
    "TA-01": ["System Administrator (separate from all operational roles)"],
    "TA-02": false,
    "TA-03": ["None — standard module approvals are sufficient"],
    "TA-04": "Jane Smith, IT Manager",
  });
}

// Conditional discovery answers — activates additional conditional domains
// by flipping product sales, operations, accounting gates
function conditionalAnswers() {
  return makeDiscoveryAnswers({
    "BM-01": "Product sales and services",
    "BM-02": true,
    "BM-03": "AU",
    "BM-04": false,
    "BM-05": 25,
    "RM-01": ["Recurring subscriptions", "Product sales"],
    "RM-02": true,
    "RM-03": true,
    "RM-04": false,
    "OP-01": true,
    "OP-03": true,
    "OP-04": false,
    "OP-05": false,
    "SC-01": true,
    "SC-02": true,
    "SC-03": false,
    "SC-04": "Discounting permitted with approval",
    "PI-01": false,
    "PI-05": false,
    "FC-01": "Standard accounting required",
    "FC-04": false,
    "FC-05": false,
    "FC-06": false,
    "TA-01": ["System Administrator (separate from all operational roles)"],
    "TA-02": false,
    "TA-03": ["None — standard module approvals are sufficient"],
    "TA-04": "Jane Smith, IT Manager",
  });
}

// Empty answers — produces maximum blockers (all conditional gates fail)
function emptyAnswers() {
  return makeDiscoveryAnswers({});
}

// Fixed project identity — deterministic project_id (no randomUUID)
function makeProjectIdentity(overrides = {}) {
  return {
    project_id:          "proj-00000000-0000-0000-0000-000000000001",
    project_name:        "Snapshot Test Project",
    customer_entity:     "ACME Corp",
    project_owner:       "owner@example.com",
    implementation_lead: "lead@example.com",
    project_mode:        "full",
    created_at:          "2026-01-01T00:00:00.000Z",
    last_modified_at:    "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// Fixed odoosh production target context
function makeTargetContext(overrides = {}) {
  return {
    odoo_version:               "19",
    edition:                    "enterprise",
    deployment_type:            "odoosh",
    primary_country:            "AU",
    primary_currency:           "AUD",
    multi_company:              false,
    multi_currency:             false,
    odoosh_branch_target:       "production",
    odoosh_environment_type:    "production",
    connection_mode:            null,
    connection_status:          null,
    connection_target_id:       null,
    connection_capability_note: null,
    ...overrides,
  };
}

function makeApprovalContext() {
  return { approval_granted_by: "approver@example.com" };
}

function makeExecutionResult() {
  return { result_status: "success" };
}

// ---------------------------------------------------------------------------
// 1. Stable snapshot output for minimal valid path
// ---------------------------------------------------------------------------

describe("snapshot: minimal valid path", () => {
  it("produces contract-stable output for minimal valid inputs", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    assertSnapshot(result, "minimal-valid");
  });

  it("activates at least the unconditional domains", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const activated = result.activated_domains.domains.filter((d) => d.activated);
    const unconditional = ["foundation", "users_roles", "master_data"];
    for (const id of unconditional) {
      assert.ok(
        activated.some((d) => d.domain_id === id),
        `minimal-valid: expected unconditional domain "${id}" to be activated`
      );
    }
  });

  it("previews and executions are empty without target_context", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    assert.strictEqual(
      result.previews.length,
      0,
      "minimal-valid: previews must be empty without target_context"
    );
    assert.strictEqual(
      result.executions.length,
      0,
      "minimal-valid: executions must be empty without target_context"
    );
  });

  it("normalized snapshot is stable across two identical runs", () => {
    const identity = makeProjectIdentity();
    const answers = minimalAnswers();
    const n1 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    const n2 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    assert.deepStrictEqual(
      n1,
      n2,
      "minimal-valid: identical inputs must produce identical normalized snapshots"
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Stable snapshot output for conditional discovery path
// ---------------------------------------------------------------------------

describe("snapshot: conditional discovery path", () => {
  it("produces contract-stable output for conditional discovery answers", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: conditionalAnswers(),
    });
    assertSnapshot(result, "conditional-discovery");
  });

  it("activates at least as many domains as minimal path", () => {
    const minResult = runPipeline({ discovery_answers: minimalAnswers() });
    const condResult = runPipeline({ discovery_answers: conditionalAnswers() });
    const minActivated = minResult.activated_domains.domains.filter(
      (d) => d.activated
    ).length;
    const condActivated = condResult.activated_domains.domains.filter(
      (d) => d.activated
    ).length;
    assert.ok(
      condActivated >= minActivated,
      `conditional-discovery: expected >= ${minActivated} activated domains, got ${condActivated}`
    );
  });

  it("checkpoints array is at least as large as minimal path", () => {
    const minResult = runPipeline({ discovery_answers: minimalAnswers() });
    const condResult = runPipeline({ discovery_answers: conditionalAnswers() });
    assert.ok(
      condResult.checkpoints.length >= minResult.checkpoints.length,
      "conditional-discovery: expected at least as many checkpoints as minimal path"
    );
  });

  it("normalized snapshot is stable across two identical conditional runs", () => {
    const identity = makeProjectIdentity();
    const answers = conditionalAnswers();
    const n1 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    const n2 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    assert.deepStrictEqual(
      n1,
      n2,
      "conditional-discovery: identical inputs must produce identical normalized snapshots"
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Stable snapshot output for blocked path (empty answers)
// ---------------------------------------------------------------------------

describe("snapshot: blocked path", () => {
  it("produces contract-stable output for empty (fully-blocked) answers", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: emptyAnswers(),
    });
    assertSnapshot(result, "blocked");
  });

  it("active_blockers is non-empty with empty answers", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: emptyAnswers(),
    });
    assert.ok(
      result.blockers.active_blockers.length > 0,
      "blocked: empty answers must produce active blockers"
    );
  });

  it("go_live_readiness is Not_Ready with empty answers", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: emptyAnswers(),
    });
    assert.strictEqual(
      result.readiness_state.go_live_readiness,
      "Not_Ready",
      "blocked: go_live_readiness must be Not_Ready with empty answers"
    );
  });

  it("previews and executions are empty on blocked path", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: emptyAnswers(),
    });
    assert.strictEqual(
      result.previews.length,
      0,
      "blocked: previews must be empty"
    );
    assert.strictEqual(
      result.executions.length,
      0,
      "blocked: executions must be empty"
    );
  });

  it("blockers.total_count equals active_blockers.length", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: emptyAnswers(),
    });
    assert.strictEqual(
      result.blockers.total_count,
      result.blockers.active_blockers.length,
      "blocked: total_count must equal active_blockers.length"
    );
  });

  it("normalized snapshot is stable across two identical blocked runs", () => {
    const identity = makeProjectIdentity();
    const answers = emptyAnswers();
    const n1 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    const n2 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    assert.deepStrictEqual(
      n1,
      n2,
      "blocked: identical inputs must produce identical normalized snapshots"
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Stable snapshot output for previewable path (target_context present)
// ---------------------------------------------------------------------------

describe("snapshot: previewable path", () => {
  it("produces contract-stable output with target_context present", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
    });
    assertSnapshot(result, "previewable");
  });

  it("target_context is preserved in output", () => {
    const tc = makeTargetContext();
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context: tc,
    });
    assert.ok(
      result.target_context !== null,
      "previewable: target_context must be non-null in output"
    );
    assert.strictEqual(
      result.target_context.deployment_type,
      tc.deployment_type,
      "previewable: deployment_type must be preserved"
    );
    assert.strictEqual(
      result.target_context.edition,
      tc.edition,
      "previewable: edition must be preserved"
    );
  });

  it("previews array is array (may be empty or populated)", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
    });
    assert.ok(
      Array.isArray(result.previews),
      "previewable: previews must be array"
    );
  });

  it("preview_engine_output.previews is the exact same content as result.previews", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
    });
    assert.deepStrictEqual(
      result.previews,
      result._engine_outputs.preview_engine_output.previews,
      "previewable: result.previews must equal preview_engine_output.previews"
    );
  });

  it("execution_eligibility.execution_candidates is array", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
    });
    assert.ok(
      Array.isArray(
        result._engine_outputs.execution_eligibility.execution_candidates
      ),
      "previewable: execution_candidates must be array"
    );
  });

  it("normalized snapshot is stable across two identical previewable runs", () => {
    const identity = makeProjectIdentity();
    const answers = minimalAnswers();
    const tc = makeTargetContext();
    const n1 = normalizeSnapshot(
      runPipeline({
        project_identity: identity,
        discovery_answers: answers,
        target_context: tc,
      })
    );
    const n2 = normalizeSnapshot(
      runPipeline({
        project_identity: identity,
        discovery_answers: answers,
        target_context: tc,
      })
    );
    assert.deepStrictEqual(
      n1,
      n2,
      "previewable: identical inputs must produce identical normalized snapshots"
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Stable snapshot output for execution-approved-but-not-executed path
// ---------------------------------------------------------------------------

describe("snapshot: approved-not-executed path", () => {
  it("produces contract-stable output with approval_context and no execution_result", () => {
    const result = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  null,
    });
    assertSnapshot(result, "approved-not-executed");
  });

  it("executions is empty when execution_result is null", () => {
    const result = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  null,
    });
    assert.strictEqual(
      result.executions.length,
      0,
      "approved-not-executed: executions must be empty without execution_result"
    );
  });

  it("execution_approvals output is accessible and is array", () => {
    const result = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  null,
    });
    const approvals = result._engine_outputs.execution_approvals;
    assert.ok(
      approvals !== null && typeof approvals === "object",
      "approved-not-executed: execution_approvals output must be object"
    );
    assert.ok(
      Array.isArray(approvals.execution_approvals),
      "approved-not-executed: execution_approvals.execution_approvals must be array"
    );
  });

  it("executions remain empty regardless of whether approval_context is present", () => {
    const withApproval = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  null,
    });
    const withoutApproval = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  null,
      execution_result:  null,
    });
    assert.strictEqual(
      withApproval.executions.length,
      0,
      "approved-not-executed: executions must be empty with approval but no execution_result"
    );
    assert.strictEqual(
      withoutApproval.executions.length,
      0,
      "approved-not-executed: executions must be empty without approval and without execution_result"
    );
  });

  it("normalized snapshot is stable across two identical approved-not-executed runs", () => {
    const identity = makeProjectIdentity();
    const answers = minimalAnswers();
    const tc = makeTargetContext();
    const ac = makeApprovalContext();
    const n1 = normalizeSnapshot(
      runPipeline({
        project_identity:  identity,
        discovery_answers: answers,
        target_context:    tc,
        approval_context:  ac,
        execution_result:  null,
      })
    );
    const n2 = normalizeSnapshot(
      runPipeline({
        project_identity:  identity,
        discovery_answers: answers,
        target_context:    tc,
        approval_context:  ac,
        execution_result:  null,
      })
    );
    assert.deepStrictEqual(
      n1,
      n2,
      "approved-not-executed: identical inputs must produce identical normalized snapshots"
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Stable snapshot output for executed path (with execution_result)
// ---------------------------------------------------------------------------

describe("snapshot: executed path", () => {
  it("produces contract-stable output with approval_context and execution_result", () => {
    const result = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  makeExecutionResult(),
    });
    assertSnapshot(result, "executed");
  });

  it("executions array is array", () => {
    const result = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  makeExecutionResult(),
    });
    assert.ok(
      Array.isArray(result.executions),
      "executed: executions must be array"
    );
  });

  it("execution_records.executions matches result.executions exactly", () => {
    const result = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  makeExecutionResult(),
    });
    assert.deepStrictEqual(
      result.executions,
      result._engine_outputs.execution_records.executions,
      "executed: result.executions must equal execution_records.executions"
    );
  });

  it("output key structure is identical to approved-not-executed structure", () => {
    const executed = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  makeExecutionResult(),
    });
    const approvedOnly = runPipeline({
      project_identity:  makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context:    makeTargetContext(),
      approval_context:  makeApprovalContext(),
      execution_result:  null,
    });
    assert.deepStrictEqual(
      Object.keys(executed).sort(),
      Object.keys(approvedOnly).sort(),
      "executed: top-level key structure must be identical to approved-not-executed"
    );
  });

  it("normalized snapshot is stable across two identical executed runs", () => {
    const identity = makeProjectIdentity();
    const answers = minimalAnswers();
    const tc = makeTargetContext();
    const ac = makeApprovalContext();
    const er = makeExecutionResult();
    const n1 = normalizeSnapshot(
      runPipeline({
        project_identity:  identity,
        discovery_answers: answers,
        target_context:    tc,
        approval_context:  ac,
        execution_result:  er,
      })
    );
    const n2 = normalizeSnapshot(
      runPipeline({
        project_identity:  identity,
        discovery_answers: answers,
        target_context:    tc,
        approval_context:  ac,
        execution_result:  er,
      })
    );
    assert.deepStrictEqual(
      n1,
      n2,
      "executed: identical inputs must produce identical normalized snapshots"
    );
  });
});

// ---------------------------------------------------------------------------
// 7. Explicit failure on unexpected field addition or removal
// ---------------------------------------------------------------------------

describe("snapshot: field drift detection", () => {
  it("detects unexpected top-level field addition", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const tampered = { ...result, _unexpected_field: "injected" };
    assert.throws(
      () => assertExactKeys(tampered, GOLDEN_TOP_LEVEL_KEYS, "drift-test"),
      /key set drift/,
      "must throw on unexpected top-level field addition"
    );
  });

  it("detects top-level field removal", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const { blockers: _removed, ...incomplete } = result;
    assert.throws(
      () => assertExactKeys(incomplete, GOLDEN_TOP_LEVEL_KEYS, "drift-test"),
      /key set drift/,
      "must throw on top-level field removal"
    );
  });

  it("detects readiness_state field addition", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const tampered = { ...result.readiness_state, _extra: "injected" };
    assert.throws(
      () =>
        assertExactKeys(tampered, GOLDEN_READINESS_STATE_KEYS, "drift-test"),
      /key set drift/,
      "must throw on readiness_state field addition"
    );
  });

  it("detects readiness_state field removal", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const { go_live_readiness: _removed, ...incomplete } = result.readiness_state;
    assert.throws(
      () =>
        assertExactKeys(incomplete, GOLDEN_READINESS_STATE_KEYS, "drift-test"),
      /key set drift/,
      "must throw on readiness_state field removal"
    );
  });

  it("detects blockers field addition", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const tampered = { ...result.blockers, _extra: "injected" };
    assert.throws(
      () => assertExactKeys(tampered, GOLDEN_BLOCKERS_KEYS, "drift-test"),
      /key set drift/,
      "must throw on blockers field addition"
    );
  });

  it("detects blockers field removal", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const { by_severity: _removed, ...incomplete } = result.blockers;
    assert.throws(
      () => assertExactKeys(incomplete, GOLDEN_BLOCKERS_KEYS, "drift-test"),
      /key set drift/,
      "must throw on blockers field removal"
    );
  });

  it("detects audit_refs field addition", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const tampered = { ...result.audit_refs, _extra: "injected" };
    assert.throws(
      () => assertExactKeys(tampered, GOLDEN_AUDIT_REFS_KEYS, "drift-test"),
      /key set drift/,
      "must throw on audit_refs field addition"
    );
  });

  it("detects resume_context field addition", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const tampered = { ...result.resume_context, _extra: "injected" };
    assert.throws(
      () =>
        assertExactKeys(tampered, GOLDEN_RESUME_CONTEXT_KEYS, "drift-test"),
      /key set drift/,
      "must throw on resume_context field addition"
    );
  });

  it("detects resume_context field removal", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const { next_required_action: _removed, ...incomplete } =
      result.resume_context;
    assert.throws(
      () =>
        assertExactKeys(incomplete, GOLDEN_RESUME_CONTEXT_KEYS, "drift-test"),
      /key set drift/,
      "must throw on resume_context field removal"
    );
  });

  it("detects _engine_outputs field addition", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const tampered = { ...result._engine_outputs, _extra: "injected" };
    assert.throws(
      () =>
        assertExactKeys(tampered, GOLDEN_ENGINE_OUTPUTS_KEYS, "drift-test"),
      /key set drift/,
      "must throw on _engine_outputs field addition"
    );
  });

  it("detects _engine_outputs field removal", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    const {
      execution_records: _removed,
      ...incomplete
    } = result._engine_outputs;
    assert.throws(
      () =>
        assertExactKeys(incomplete, GOLDEN_ENGINE_OUTPUTS_KEYS, "drift-test"),
      /key set drift/,
      "must throw on _engine_outputs field removal"
    );
  });

  it("detects go_live_readiness enum drift", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    // Actual value must be in the governed enum
    assert.ok(
      VALID_READINESS_ENUMS.includes(result.readiness_state.go_live_readiness),
      `go_live_readiness must be a valid enum, got: "${result.readiness_state.go_live_readiness}"`
    );
    // A drifted value must not pass enum validation
    const driftedValue = "Invalid_Readiness_Value";
    assert.ok(
      !VALID_READINESS_ENUMS.includes(driftedValue),
      "drift detector: injected enum value must not be in valid set"
    );
  });
});

// ---------------------------------------------------------------------------
// 8. Deterministic normalization of volatile timestamps and IDs
// ---------------------------------------------------------------------------

describe("snapshot: timestamp and ID normalization", () => {
  it("normalizeSnapshot replaces ISO 8601 timestamps with NORMALIZED_TIMESTAMP", () => {
    const ts = "2026-01-01T00:00:00.000Z";
    const input = { created_at: ts, nested: { modified_at: ts } };
    const normalized = normalizeSnapshot(input);
    assert.strictEqual(normalized.created_at, "NORMALIZED_TIMESTAMP");
    assert.strictEqual(normalized.nested.modified_at, "NORMALIZED_TIMESTAMP");
  });

  it("normalizeSnapshot replaces UUID strings with NORMALIZED_UUID", () => {
    const uuid = "12345678-1234-1234-1234-123456789abc";
    const input = { id: uuid, items: [{ ref: uuid }] };
    const normalized = normalizeSnapshot(input);
    assert.strictEqual(normalized.id, "NORMALIZED_UUID");
    assert.strictEqual(normalized.items[0].ref, "NORMALIZED_UUID");
  });

  it("normalizeSnapshot preserves non-volatile strings", () => {
    const input = { status: "Not_Ready", name: "Test Project" };
    const normalized = normalizeSnapshot(input);
    assert.strictEqual(normalized.status, "Not_Ready");
    assert.strictEqual(normalized.name, "Test Project");
  });

  it("normalizeSnapshot preserves null and boolean values", () => {
    const input = { field: null, flag: false, count: 0 };
    const normalized = normalizeSnapshot(input);
    assert.strictEqual(normalized.field, null);
    assert.strictEqual(normalized.flag, false);
    assert.strictEqual(normalized.count, 0);
  });

  it("normalizeSnapshot preserves array structure", () => {
    const input = { items: [1, "2026-01-01T00:00:00.000Z", null, true] };
    const normalized = normalizeSnapshot(input);
    assert.ok(Array.isArray(normalized.items));
    assert.strictEqual(normalized.items[0], 1);
    assert.strictEqual(normalized.items[1], "NORMALIZED_TIMESTAMP");
    assert.strictEqual(normalized.items[2], null);
    assert.strictEqual(normalized.items[3], true);
  });

  it("normalizeSnapshot does not alter object key structure", () => {
    const input = {
      composed_at: "2026-01-01T00:00:00.000Z",
      status: "Not_Ready",
      count: 5,
    };
    const normalized = normalizeSnapshot(input);
    assert.deepStrictEqual(Object.keys(normalized).sort(), [
      "composed_at",
      "count",
      "status",
    ]);
  });

  it("orchestrated_at and composed_at are both normalized in pipeline output", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    assert.ok(
      ISO_TIMESTAMP_RE.test(result.orchestrated_at),
      "orchestrated_at must be ISO timestamp before normalization"
    );
    assert.ok(
      ISO_TIMESTAMP_RE.test(result.composed_at),
      "composed_at must be ISO timestamp before normalization"
    );
    const normalized = normalizeSnapshot(result);
    assert.strictEqual(
      normalized.orchestrated_at,
      "NORMALIZED_TIMESTAMP",
      "orchestrated_at must normalize to NORMALIZED_TIMESTAMP"
    );
    assert.strictEqual(
      normalized.composed_at,
      "NORMALIZED_TIMESTAMP",
      "composed_at must normalize to NORMALIZED_TIMESTAMP"
    );
  });

  it("activated_domains.activated_at is normalized", () => {
    const result = runPipeline({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
    });
    assert.ok(
      ISO_TIMESTAMP_RE.test(result.activated_domains.activated_at),
      "activated_at must be ISO timestamp before normalization"
    );
    const normalized = normalizeSnapshot(result);
    assert.strictEqual(
      normalized.activated_domains.activated_at,
      "NORMALIZED_TIMESTAMP",
      "activated_at must normalize to NORMALIZED_TIMESTAMP"
    );
  });

  it("two minimal runs produce identical normalized snapshots", () => {
    const identity = makeProjectIdentity();
    const answers = minimalAnswers();
    const n1 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    const n2 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    assert.deepStrictEqual(
      n1,
      n2,
      "minimal: identical inputs must produce identical normalized snapshots"
    );
  });

  it("two blocked runs produce identical normalized snapshots", () => {
    const identity = makeProjectIdentity();
    const answers = emptyAnswers();
    const n1 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    const n2 = normalizeSnapshot(
      runPipeline({ project_identity: identity, discovery_answers: answers })
    );
    assert.deepStrictEqual(
      n1,
      n2,
      "blocked: identical inputs must produce identical normalized snapshots"
    );
  });
});
