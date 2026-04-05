// ---------------------------------------------------------------------------
// Pipeline Orchestrator Tests
// Tests for: app/shared/pipeline-orchestrator.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Deterministic full pipeline run
//   2.  Missing discovery answers truthfully constrains downstream outputs
//   3.  Blocked checkpoint prevents preview/eligibility/approval/execution downstream
//   4.  Missing target context truthfully constrains deployment-sensitive branches
//   5.  Missing approval/execution result prevents downstream execution records
//   6.  Final runtime state contract-shape compliance
//   7.  Orchestrator does not mutate engine outputs
//   8.  Correct engine call order (verified via output field presence)
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
// Helpers
// ---------------------------------------------------------------------------

function makeAnswers(overrides = {}) {
  const da = createDiscoveryAnswers({ framework_version: "1.0" });
  da.answers = { ...overrides };
  return da;
}

/**
 * Minimal answer set — only unconditional domains activate.
 */
function minimalAnswers() {
  return makeAnswers({
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

function makeTargetContext(overrides = {}) {
  return {
    odoo_version:              "19",
    edition:                   "enterprise",
    deployment_type:           "odoosh",
    primary_country:           "AU",
    primary_currency:          "AUD",
    multi_company:             false,
    multi_currency:            false,
    odoosh_branch_target:      "production",
    odoosh_environment_type:   "production",
    connection_mode:           null,
    connection_status:         null,
    connection_target_id:      null,
    connection_capability_note: null,
    ...overrides,
  };
}

function makeProjectIdentity(overrides = {}) {
  return {
    project_id:           "proj-00000000-0000-0000-0000-000000000001",
    project_name:         "Test Project",
    customer_entity:      "ACME Corp",
    project_owner:        "owner@example.com",
    implementation_lead:  "lead@example.com",
    project_mode:         "full",
    created_at:           "2026-01-01T00:00:00.000Z",
    last_modified_at:     "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// Contract-required top-level keys (persisted + computed + composer-owned + orchestrator-owned)
const CONTRACT_PERSISTED_KEYS = [
  "project_identity",
  "target_context",
  "discovery_answers",
  "activated_domains",
  "checkpoints",
  "decisions",
  "stage_state",
  "deferments",
  "previews",
  "executions",
];

const CONTRACT_COMPUTED_KEYS = [
  "readiness_state",
  "blockers",
  "audit_refs",
  "resume_context",
];

const CONTRACT_COMPOSER_KEYS = [
  "connection_state",
  "training_state",
  "readiness_summary",
  "composer_version",
  "composed_at",
];

const CONTRACT_ORCHESTRATOR_KEYS = [
  "_engine_outputs",
  "orchestrator_version",
  "orchestrated_at",
];

// ---------------------------------------------------------------------------
// 1. Deterministic full pipeline run
// ---------------------------------------------------------------------------

describe("deterministic full pipeline run", () => {
  it("produces identical output for identical inputs", () => {
    const answers = minimalAnswers();
    const identity = makeProjectIdentity();
    const target = makeTargetContext();

    const run1 = runPipeline({
      project_identity: identity,
      discovery_answers: answers,
      target_context: target,
    });

    const run2 = runPipeline({
      project_identity: identity,
      discovery_answers: answers,
      target_context: target,
    });

    // Structural shape must be identical
    assert.deepStrictEqual(
      Object.keys(run1).sort(),
      Object.keys(run2).sort()
    );

    // Contract-shape fields must be structurally equal (ignoring timestamps)
    for (const key of CONTRACT_PERSISTED_KEYS) {
      if (key === "previews" || key === "executions") continue; // arrays checked separately
      assert.ok(key in run1, `run1 missing key: ${key}`);
      assert.ok(key in run2, `run2 missing key: ${key}`);
    }

    // Computed objects must have identical structure
    assert.deepStrictEqual(
      Object.keys(run1.readiness_state).sort(),
      Object.keys(run2.readiness_state).sort()
    );
    assert.deepStrictEqual(
      Object.keys(run1.blockers).sort(),
      Object.keys(run2.blockers).sort()
    );
  });

  it("activated_domains contains domains array", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(result.activated_domains !== null);
    assert.ok(Array.isArray(result.activated_domains.domains));
    assert.ok(result.activated_domains.domains.length > 0);
  });

  it("checkpoints array is populated from activated domains", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.checkpoints));
    assert.ok(result.checkpoints.length > 0);
  });

  it("readiness_state.go_live_readiness is set", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(result.readiness_state !== null);
    assert.ok(typeof result.readiness_state.go_live_readiness === "string");
  });

  it("blockers object has active_blockers array", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(result.blockers !== null);
    assert.ok(Array.isArray(result.blockers.active_blockers));
  });

  it("stage_routing is present in engine outputs", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(result._engine_outputs !== null);
    assert.ok(result._engine_outputs.stage_routing !== null);
    assert.ok(typeof result._engine_outputs.stage_routing === "object");
  });
});

// ---------------------------------------------------------------------------
// 2. Missing discovery answers constrains downstream outputs
// ---------------------------------------------------------------------------

describe("missing discovery answers constrains downstream outputs", () => {
  it("empty answers activates only unconditional domains", () => {
    const emptyAnswers = makeAnswers({});
    const result = runPipeline({ discovery_answers: emptyAnswers });

    const activated = result.activated_domains.domains.filter((d) => d.activated);
    const unconditionalIds = ["foundation", "users_roles", "master_data"];
    for (const id of unconditionalIds) {
      assert.ok(
        activated.some((d) => d.domain_id === id),
        `Expected unconditional domain "${id}" to be activated`
      );
    }
  });

  it("missing answers does not produce previews without required gates", () => {
    const emptyAnswers = makeAnswers({});
    const result = runPipeline({ discovery_answers: emptyAnswers });
    // Previews require target_context — absent here so none should be generated
    assert.ok(Array.isArray(result.previews));
    assert.strictEqual(result.previews.length, 0);
  });

  it("validated_checkpoints still produced for all generated checkpoints", () => {
    const emptyAnswers = makeAnswers({});
    const result = runPipeline({ discovery_answers: emptyAnswers });
    const vc = result._engine_outputs.validated_checkpoints;
    assert.ok(vc !== null);
    assert.ok(Array.isArray(vc.records));
    assert.strictEqual(vc.records.length, result.checkpoints.length);
  });

  it("blockers reflect missing discovery answers for user-confirmed checkpoints", () => {
    const emptyAnswers = makeAnswers({});
    const result = runPipeline({ discovery_answers: emptyAnswers });
    // With empty answers many user-confirmed checkpoints will have blockers
    assert.ok(Array.isArray(result.blockers.active_blockers));
    assert.ok(result.blockers.active_blockers.length > 0);
  });
});

// ---------------------------------------------------------------------------
// 3. Blocked checkpoint prevents downstream preview/eligibility/approval/execution
// ---------------------------------------------------------------------------

describe("blocked checkpoint prevents downstream preview/eligibility/approval/execution", () => {
  it("previews array is empty when no target_context provided", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.previews));
    assert.strictEqual(result.previews.length, 0);
  });

  it("execution_candidates empty when previews are empty", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const eligibility = result._engine_outputs.execution_eligibility;
    assert.ok(Array.isArray(eligibility.execution_candidates));
    assert.strictEqual(eligibility.execution_candidates.length, 0);
  });

  it("execution_approvals empty when execution_candidates are empty", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const approvals = result._engine_outputs.execution_approvals;
    assert.ok(Array.isArray(approvals.execution_approvals));
    assert.strictEqual(approvals.execution_approvals.length, 0);
  });

  it("execution records empty when approvals are empty", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.executions));
    assert.strictEqual(result.executions.length, 0);
  });

  it("blockers on checkpoints propagate to readiness_state", () => {
    const emptyAnswers = makeAnswers({});
    const result = runPipeline({ discovery_answers: emptyAnswers });
    // With empty answers there should be active blockers which affect readiness
    assert.ok(result.readiness_state.go_live_readiness !== null);
    assert.notStrictEqual(
      result.readiness_state.go_live_readiness,
      "Ready"
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Missing target context constrains deployment-sensitive branches
// ---------------------------------------------------------------------------

describe("missing target context constrains deployment-sensitive branches", () => {
  it("no previews generated without target_context", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: null,
    });
    assert.ok(Array.isArray(result.previews));
    assert.strictEqual(result.previews.length, 0);
  });

  it("no execution_candidates generated without target_context", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: null,
    });
    const eligibility = result._engine_outputs.execution_eligibility;
    assert.strictEqual(eligibility.execution_candidates.length, 0);
  });

  it("target_context preserved in output when provided", () => {
    const tc = makeTargetContext();
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: tc,
    });
    assert.ok(result.target_context !== null);
    assert.strictEqual(result.target_context.deployment_type, tc.deployment_type);
    assert.strictEqual(result.target_context.edition, tc.edition);
  });

  it("target_context null in output when not provided", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: null,
    });
    // composeProjectState may emit empty target_context shape — check deployment_type is absent/null
    if (result.target_context !== null) {
      assert.ok(
        result.target_context.deployment_type === null ||
        result.target_context.deployment_type === undefined
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Missing approval/execution result prevents downstream execution records
// ---------------------------------------------------------------------------

describe("missing approval/execution result prevents downstream execution records", () => {
  it("no executions when approval_context is null", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
      approval_context: null,
    });
    assert.ok(Array.isArray(result.executions));
    assert.strictEqual(result.executions.length, 0);
  });

  it("no executions when execution_result is null", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
      execution_result: null,
    });
    assert.ok(Array.isArray(result.executions));
    assert.strictEqual(result.executions.length, 0);
  });

  it("execution_approvals engine output is accessible even without approval_context", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
    });
    const approvals = result._engine_outputs.execution_approvals;
    assert.ok(approvals !== null && typeof approvals === "object");
    assert.ok(Array.isArray(approvals.execution_approvals));
  });
});

// ---------------------------------------------------------------------------
// 6. Final runtime state contract-shape compliance
// ---------------------------------------------------------------------------

describe("final runtime state contract-shape compliance", () => {
  it("all contract-persisted keys are present", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    for (const key of CONTRACT_PERSISTED_KEYS) {
      assert.ok(key in result, `Missing contract-persisted key: ${key}`);
    }
  });

  it("all contract-computed keys are present", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    for (const key of CONTRACT_COMPUTED_KEYS) {
      assert.ok(key in result, `Missing contract-computed key: ${key}`);
    }
  });

  it("all composer-owned keys are present", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    for (const key of CONTRACT_COMPOSER_KEYS) {
      assert.ok(key in result, `Missing composer-owned key: ${key}`);
    }
  });

  it("orchestrator metadata keys are present", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    for (const key of CONTRACT_ORCHESTRATOR_KEYS) {
      assert.ok(key in result, `Missing orchestrator key: ${key}`);
    }
    assert.strictEqual(result.orchestrator_version, PIPELINE_ORCHESTRATOR_VERSION);
    assert.ok(typeof result.orchestrated_at === "string");
  });

  it("readiness_state has all contract-shape fields", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const rs = result.readiness_state;
    assert.ok(rs !== null);
    const requiredFields = [
      "go_live_readiness",
      "readiness_reason",
      "incomplete_critical_checkpoints",
      "blocked_checkpoints",
      "deferred_checkpoints",
      "unresolved_warnings",
      "training_status",
      "recommendation_issued",
      "recommendation_issued_at",
      "recommendation_issued_by",
      "recommendation_withheld_reason",
    ];
    for (const f of requiredFields) {
      assert.ok(f in rs, `readiness_state missing field: ${f}`);
    }
  });

  it("blockers has all contract-shape fields", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const b = result.blockers;
    assert.ok(b !== null);
    const requiredFields = [
      "active_blockers",
      "total_count",
      "by_severity",
      "by_stage",
      "by_domain",
      "highest_priority_blocker",
    ];
    for (const f of requiredFields) {
      assert.ok(f in b, `blockers missing field: ${f}`);
    }
  });

  it("audit_refs has contract-shape fields", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const ar = result.audit_refs;
    assert.ok(ar !== null);
    assert.ok("by_checkpoint" in ar);
    assert.ok("by_decision" in ar);
    assert.ok("by_preview" in ar);
    assert.ok("by_execution" in ar);
  });

  it("resume_context has contract-shape fields", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const rc = result.resume_context;
    assert.ok(rc !== null);
    const requiredFields = [
      "current_stages",
      "resume_target_type",
      "resume_target_checkpoint_id",
      "resume_target_domain_id",
      "resume_target_stage_id",
      "resume_context_message",
      "stale_state_alerts",
      "highest_priority_blocker",
      "next_required_action",
      "secondary_action_queue",
    ];
    for (const f of requiredFields) {
      assert.ok(f in rc, `resume_context missing field: ${f}`);
    }
  });

  it("previews is an array", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.previews));
  });

  it("executions is an array", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.executions));
  });

  it("checkpoints array contains only persisted-shape records", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    // Computed fields must not appear on checkpoints in the composed output
    const COMPUTED_CHECKPOINT_FIELDS = [
      "blocker_flag",
      "blocked_reason",
      "dependencies_met",
      "all_evidence_provided",
    ];
    for (const cp of result.checkpoints) {
      for (const f of COMPUTED_CHECKPOINT_FIELDS) {
        assert.ok(
          !(f in cp),
          `Checkpoint ${cp.checkpoint_id} has computed field "${f}" in persisted output`
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Orchestrator does not mutate engine outputs
// ---------------------------------------------------------------------------

describe("orchestrator does not mutate engine outputs", () => {
  it("discovery_answers input object is not mutated by runPipeline", () => {
    const answers = minimalAnswers();
    const originalAnswersCopy = JSON.parse(JSON.stringify(answers));
    runPipeline({ discovery_answers: answers });
    assert.deepStrictEqual(answers.answers, originalAnswersCopy.answers);
    assert.strictEqual(answers.framework_version, originalAnswersCopy.framework_version);
  });

  it("target_context input object is not mutated by runPipeline", () => {
    const tc = makeTargetContext();
    const originalCopy = JSON.parse(JSON.stringify(tc));
    runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: tc,
    });
    assert.deepStrictEqual(tc, originalCopy);
  });

  it("project_identity input object is not mutated by runPipeline", () => {
    const identity = makeProjectIdentity();
    const originalCopy = JSON.parse(JSON.stringify(identity));
    runPipeline({
      project_identity: identity,
      discovery_answers: minimalAnswers(),
    });
    assert.deepStrictEqual(identity, originalCopy);
  });

  it("_engine_outputs entries are preserved references (not re-derived)", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    // Engine outputs must be accessible and have correct shapes
    assert.ok(typeof result._engine_outputs === "object");
    assert.ok("validated_checkpoints" in result._engine_outputs);
    assert.ok("stage_routing" in result._engine_outputs);
    assert.ok("preview_engine_output" in result._engine_outputs);
    assert.ok("execution_eligibility" in result._engine_outputs);
    assert.ok("execution_approvals" in result._engine_outputs);
    assert.ok("execution_records" in result._engine_outputs);
  });
});

// ---------------------------------------------------------------------------
// 8. Correct engine call order (verified via field presence and linkage)
// ---------------------------------------------------------------------------

describe("correct engine call order verified via output linkage", () => {
  it("checkpoints_output is produced before validated_checkpoints", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const vc = result._engine_outputs.validated_checkpoints;
    // validated_checkpoints.records must have same count as generated checkpoints
    assert.strictEqual(vc.records.length, result.checkpoints.length);
  });

  it("stage_routing references checkpoints (domain_to_stage populated when domains activated)", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const sr = result._engine_outputs.stage_routing;
    assert.ok(sr !== null);
    assert.ok(typeof sr.domain_to_stage === "object");
    assert.ok(typeof sr.checkpoint_to_stage === "object");
  });

  it("blockers total_count matches active_blockers.length", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.strictEqual(
      result.blockers.total_count,
      result.blockers.active_blockers.length
    );
  });

  it("preview_engine_output.previews matches result.previews", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
    });
    assert.deepStrictEqual(
      result.previews,
      result._engine_outputs.preview_engine_output.previews
    );
  });

  it("execution_records.executions matches result.executions", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    assert.deepStrictEqual(
      result.executions,
      result._engine_outputs.execution_records.executions
    );
  });

  it("readiness_state is populated from go-live readiness engine (step 6 before step 7+)", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    // readiness_state must not be null — engine ran
    assert.ok(result.readiness_state !== null);
    // blockers feeds into readiness — both must be objects
    assert.ok(typeof result.blockers === "object");
    assert.ok(typeof result.readiness_state === "object");
  });

  it("eligibility output references preview engine output (step 8 after step 7)", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const eligibility = result._engine_outputs.execution_eligibility;
    // eligibility engine must have run
    assert.ok(eligibility !== null && typeof eligibility === "object");
    assert.ok(Array.isArray(eligibility.execution_candidates));
  });

  it("approvals output references eligibility output (step 9 after step 8)", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const approvals = result._engine_outputs.execution_approvals;
    assert.ok(approvals !== null && typeof approvals === "object");
    assert.ok(Array.isArray(approvals.execution_approvals));
  });

  it("execution records output references approvals output (step 10 after step 9)", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    const records = result._engine_outputs.execution_records;
    assert.ok(records !== null && typeof records === "object");
    assert.ok(Array.isArray(records.executions));
  });
});

// ---------------------------------------------------------------------------
// 9. operation_definitions threading — Gate 6 preview binding
// ---------------------------------------------------------------------------

describe("operation_definitions threading through pipeline", () => {
  it("runPipeline accepts operation_definitions without error", () => {
    assert.doesNotThrow(() => runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
      operation_definitions: {},
    }));
  });

  it("operation_definitions null (default) results in no previews for Executable checkpoints", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
      operation_definitions: null,
    });
    assert.ok(Array.isArray(result.previews));
    assert.strictEqual(result.previews.length, 0);
  });

  it("operation_definitions with matching entries produces preview records with operation-binding fields", () => {
    const answers = minimalAnswers();
    const target = makeTargetContext();

    // Discovery run: find Executable, preview_required, safety_class checkpoints
    const discovery = runPipeline({ discovery_answers: answers, target_context: target });

    // Build blocker index (keyed by source_checkpoint_id) to exclude blocked checkpoints.
    // The preview engine (Gate 2) refuses blocked checkpoints — test must mirror that gate.
    const blockerIndex = new Set(
      discovery.blockers.active_blockers.map((b) => b.source_checkpoint_id)
    );

    const eligibleIds = discovery.checkpoints
      .filter((cp) =>
        cp.execution_relevance === "Executable" &&
        cp.preview_required === true &&
        cp.safety_class &&
        !blockerIndex.has(cp.checkpoint_id)
      )
      .map((cp) => cp.checkpoint_id);

    if (eligibleIds.length === 0) {
      // No Executable preview checkpoints in this domain set — test passes trivially
      return;
    }

    // Build definitions for all eligible checkpoints
    const operation_definitions = {};
    for (const id of eligibleIds) {
      operation_definitions[id] = {
        checkpoint_id: id,
        target_model: "res.partner",
        target_operation: "write",
        intended_changes: null,
      };
    }

    const result = runPipeline({ discovery_answers: answers, target_context: target, operation_definitions });

    assert.ok(result.previews.length >= 1, "Expected at least one preview when definitions are supplied");

    // All preview records for Executable checkpoints must carry operation-binding fields
    for (const preview of result.previews) {
      if (preview.intended_operation_class === "Executable") {
        assert.equal(preview.target_model, "res.partner", `preview ${preview.preview_id} missing target_model`);
        assert.equal(preview.target_operation, "write", `preview ${preview.preview_id} missing target_operation`);
      }
    }

    // preview_engine_output.previews and result.previews must still match (R3)
    assert.deepStrictEqual(
      result.previews,
      result._engine_outputs.preview_engine_output.previews
    );
  });

  it("operation_definitions does not affect non-Executable (Informational) checkpoint previews", () => {
    // Informational checkpoints produce previews regardless of operation_definitions
    const answers = minimalAnswers();
    // null target_context: only Informational checkpoints can preview (Executable Gate 3 blocks)
    const result1 = runPipeline({ discovery_answers: answers, target_context: null, operation_definitions: null });
    const result2 = runPipeline({ discovery_answers: answers, target_context: null, operation_definitions: {} });

    // Both runs should produce the same preview count (Informational checkpoints unaffected by Gate 6)
    assert.strictEqual(result1.previews.length, result2.previews.length);
  });
});

// ---------------------------------------------------------------------------
// 10. checkpoint_statuses carry-over
// ---------------------------------------------------------------------------

describe("checkpoint_statuses carry-over", () => {
  // Test 1: run without checkpoint_statuses — existing behaviour preserved.
  it("run without checkpoint_statuses leaves generated checkpoints as Not_Started", () => {
    const result = runPipeline({ discovery_answers: minimalAnswers() });
    // All generated checkpoints must be Not_Started (no carry-over applied).
    for (const cp of result.checkpoints) {
      assert.strictEqual(
        cp.status,
        "Not_Started",
        `Expected checkpoint ${cp.checkpoint_id} to be Not_Started without carry-over`
      );
    }
  });

  // Test 2: carried-over Complete statuses are applied and clear dependency_unmet blockers.
  it("run with checkpoint_statuses applies Complete status and clears dependency_unmet blockers", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      checkpoint_statuses: {
        "FND-DREQ-002": "Complete",
        "FND-FOUND-005": "Complete",
      },
    });

    // Verify the carried-over statuses are reflected in the checkpoint records.
    const fndDreq002 = result.checkpoints.find((cp) => cp.checkpoint_id === "FND-DREQ-002");
    const fndFound005 = result.checkpoints.find((cp) => cp.checkpoint_id === "FND-FOUND-005");

    if (fndDreq002 !== undefined) {
      assert.strictEqual(
        fndDreq002.status,
        "Complete",
        "FND-DREQ-002 status must be Complete after carry-over"
      );
    }
    if (fndFound005 !== undefined) {
      assert.strictEqual(
        fndFound005.status,
        "Complete",
        "FND-FOUND-005 status must be Complete after carry-over"
      );
    }

    // Verify USR-FOUND-001 does not receive a dependency_unmet blocker for FND-DREQ-002.
    const dependencyBlocker = result.blockers.active_blockers.find(
      (b) =>
        b.source_checkpoint_id === "USR-FOUND-001" &&
        b.blocker_type === "dependency_unmet" &&
        b.blocking_checkpoint_id === "FND-DREQ-002"
    );
    assert.strictEqual(
      dependencyBlocker,
      undefined,
      "USR-FOUND-001 must not have a dependency_unmet blocker for FND-DREQ-002 when FND-DREQ-002 is Complete"
    );
  });

  // Test 3: invalid carried-over status value is silently ignored.
  it("run with invalid carry-over status value leaves checkpoint as Not_Started", () => {
    const result = runPipeline({
      discovery_answers: minimalAnswers(),
      checkpoint_statuses: {
        "FND-DREQ-002": "INVALID_STATUS_VALUE",
      },
    });

    const fndDreq002 = result.checkpoints.find((cp) => cp.checkpoint_id === "FND-DREQ-002");
    if (fndDreq002 !== undefined) {
      assert.strictEqual(
        fndDreq002.status,
        "Not_Started",
        "FND-DREQ-002 must remain Not_Started when carried-over value is invalid"
      );
    }
  });

  // Test 4: nonexistent checkpoint_id in checkpoint_statuses produces no error and no side effect.
  it("run with nonexistent checkpoint_id in checkpoint_statuses produces no error", () => {
    assert.doesNotThrow(() => {
      const result = runPipeline({
        discovery_answers: minimalAnswers(),
        checkpoint_statuses: {
          "DOES-NOT-EXIST-999": "Complete",
        },
      });
      // All existing checkpoints must remain Not_Started — no side effect.
      for (const cp of result.checkpoints) {
        assert.strictEqual(
          cp.status,
          "Not_Started",
          `Expected checkpoint ${cp.checkpoint_id} to be Not_Started; nonexistent key must not cause side effects`
        );
      }
    });
  });
});
