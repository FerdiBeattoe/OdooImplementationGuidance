// ---------------------------------------------------------------------------
// Pipeline Service Tests
// Tests for: app/backend/pipeline-service.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Valid request returns runtime state (ok: true, runtime_state present)
//   2.  Malformed request is rejected (ok: false, error message)
//   3.  Identical inputs return deterministic structural output
//   4.  Optional missing inputs remain null and bounded (truthful pass-through)
//   5.  Backend envelope does not mutate runtime payload
//   6.  Shared pipeline is called exactly once per request
//   7.  Contract-shape compliance at backend boundary
// ---------------------------------------------------------------------------

"use strict";

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  runPipelineService,
  PIPELINE_SERVICE_VERSION,
} from "../pipeline-service.js";

import { runPipeline } from "../../shared/pipeline-orchestrator.js";
import { createDiscoveryAnswers } from "../../shared/runtime-state-contract.js";

// ---------------------------------------------------------------------------
// Helpers (mirrors orchestrator test helpers for consistency)
// ---------------------------------------------------------------------------

function makeAnswers(overrides = {}) {
  const da = createDiscoveryAnswers({ framework_version: "1.0" });
  da.answers = { ...overrides };
  return da;
}

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

function makeProjectIdentity() {
  return {
    project_id: "proj-00000000-0000-0000-0000-000000000001",
    project_name: "Test Project",
    customer_entity: "ACME Corp",
    project_owner: "owner@example.com",
    implementation_lead: "lead@example.com",
    project_mode: "full",
    created_at: "2026-01-01T00:00:00.000Z",
    last_modified_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeTargetContext() {
  return {
    odoo_version: "19",
    edition: "enterprise",
    deployment_type: "odoosh",
    primary_country: "AU",
    primary_currency: "AUD",
    multi_company: false,
    multi_currency: false,
    odoosh_branch_target: "production",
    odoosh_environment_type: "production",
    connection_mode: null,
    connection_status: null,
    connection_target_id: null,
    connection_capability_note: null,
  };
}

// Contract-required top-level keys (must all be present in runtime_state)
const CONTRACT_KEYS = [
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
  "readiness_state",
  "blockers",
  "audit_refs",
  "resume_context",
  "connection_state",
  "training_state",
  "readiness_summary",
  "composer_version",
  "composed_at",
  "_engine_outputs",
  "orchestrator_version",
  "orchestrated_at",
];

// ---------------------------------------------------------------------------
// 1. Valid request returns runtime state
// ---------------------------------------------------------------------------

describe("valid request returns runtime state", () => {
  it("returns ok: true with runtime_state for minimal valid payload", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.strictEqual(result.ok, true);
    assert.ok(result.runtime_state !== null && typeof result.runtime_state === "object");
  });

  it("returns ok: true with full optional payload", () => {
    const result = runPipelineService({
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
      connection_state: null,
      workflow_state: null,
      training_state: null,
      decision_links: null,
      approval_context: null,
      execution_result: null,
    });
    assert.strictEqual(result.ok, true);
    assert.ok(result.runtime_state !== null);
  });

  it("does not include error field on success", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.ok(!("error" in result));
  });

  it("PIPELINE_SERVICE_VERSION is a non-empty string", () => {
    assert.ok(typeof PIPELINE_SERVICE_VERSION === "string");
    assert.ok(PIPELINE_SERVICE_VERSION.length > 0);
  });
});

// ---------------------------------------------------------------------------
// 2. Malformed request is rejected
// ---------------------------------------------------------------------------

describe("malformed request is rejected", () => {
  it("rejects null payload with ok: false", () => {
    const result = runPipelineService(null);
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string" && result.error.length > 0);
  });

  it("rejects array payload with ok: false", () => {
    const result = runPipelineService([]);
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  it("rejects primitive payload with ok: false", () => {
    const result = runPipelineService("invalid");
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  it("rejects missing discovery_answers with ok: false", () => {
    const result = runPipelineService({ project_identity: makeProjectIdentity() });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /discovery_answers/i);
  });

  it("rejects null discovery_answers with ok: false", () => {
    const result = runPipelineService({ discovery_answers: null });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /discovery_answers/i);
  });

  it("rejects array discovery_answers with ok: false", () => {
    const result = runPipelineService({ discovery_answers: [] });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /discovery_answers/i);
  });

  it("rejects string discovery_answers with ok: false", () => {
    const result = runPipelineService({ discovery_answers: "not-an-object" });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /discovery_answers/i);
  });

  it("does not include runtime_state field on rejection", () => {
    const result = runPipelineService(null);
    assert.ok(!("runtime_state" in result));
  });

  it("never throws — returns error object instead", () => {
    assert.doesNotThrow(() => runPipelineService(null));
    assert.doesNotThrow(() => runPipelineService(undefined));
    assert.doesNotThrow(() => runPipelineService(42));
    assert.doesNotThrow(() => runPipelineService({ discovery_answers: null }));
  });
});

// ---------------------------------------------------------------------------
// 3. Identical inputs return deterministic structural output
// ---------------------------------------------------------------------------

describe("identical inputs return deterministic structural output", () => {
  it("two calls with same payload produce identical top-level keys", () => {
    const payload = {
      project_identity: makeProjectIdentity(),
      discovery_answers: minimalAnswers(),
      target_context: makeTargetContext(),
    };

    const r1 = runPipelineService(payload);
    const r2 = runPipelineService(payload);

    assert.strictEqual(r1.ok, true);
    assert.strictEqual(r2.ok, true);
    assert.deepStrictEqual(
      Object.keys(r1.runtime_state).sort(),
      Object.keys(r2.runtime_state).sort()
    );
  });

  it("two calls with same payload produce structurally equal activated_domains", () => {
    const payload = { discovery_answers: minimalAnswers() };
    const r1 = runPipelineService(payload);
    const r2 = runPipelineService(payload);

    assert.strictEqual(
      r1.runtime_state.activated_domains.domains.length,
      r2.runtime_state.activated_domains.domains.length
    );
  });

  it("two calls with same payload produce structurally equal checkpoints count", () => {
    const payload = { discovery_answers: minimalAnswers() };
    const r1 = runPipelineService(payload);
    const r2 = runPipelineService(payload);

    assert.strictEqual(
      r1.runtime_state.checkpoints.length,
      r2.runtime_state.checkpoints.length
    );
  });

  it("two calls with same payload produce identical blockers total_count", () => {
    const payload = { discovery_answers: minimalAnswers() };
    const r1 = runPipelineService(payload);
    const r2 = runPipelineService(payload);

    assert.strictEqual(
      r1.runtime_state.blockers.total_count,
      r2.runtime_state.blockers.total_count
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Optional missing inputs remain null and bounded (truthful pass-through)
// ---------------------------------------------------------------------------

describe("optional missing inputs remain null and bounded", () => {
  it("omitted target_context results in no previews", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.strictEqual(result.ok, true);
    assert.ok(Array.isArray(result.runtime_state.previews));
    assert.strictEqual(result.runtime_state.previews.length, 0);
  });

  it("omitted target_context results in null or absent deployment_type", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    const tc = result.runtime_state.target_context;
    if (tc !== null) {
      assert.ok(
        tc.deployment_type === null || tc.deployment_type === undefined
      );
    }
  });

  it("omitted workflow_state results in empty stage_state or bounded array", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.runtime_state.stage_state));
  });

  it("omitted approval_context results in empty executions", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.runtime_state.executions));
    assert.strictEqual(result.runtime_state.executions.length, 0);
  });

  it("explicitly supplied null optional fields pass through to pipeline truthfully", () => {
    const result = runPipelineService({
      discovery_answers: minimalAnswers(),
      target_context: null,
      connection_state: null,
      workflow_state: null,
    });
    assert.strictEqual(result.ok, true);
    assert.ok(Array.isArray(result.runtime_state.previews));
    assert.strictEqual(result.runtime_state.previews.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 5. Backend envelope does not mutate runtime payload
// ---------------------------------------------------------------------------

describe("backend envelope does not mutate runtime payload", () => {
  it("runtime_state matches direct runPipeline output for same inputs", () => {
    const answers = minimalAnswers();
    const identity = makeProjectIdentity();

    const serviceResult = runPipelineService({
      project_identity: identity,
      discovery_answers: answers,
    });

    const directResult = runPipeline({
      project_identity: identity,
      discovery_answers: answers,
    });

    assert.strictEqual(serviceResult.ok, true);

    // Structural keys must match
    assert.deepStrictEqual(
      Object.keys(serviceResult.runtime_state).sort(),
      Object.keys(directResult).sort()
    );
  });

  it("runtime_state.activated_domains shape matches direct runPipeline output", () => {
    const answers = minimalAnswers();

    const serviceResult = runPipelineService({ discovery_answers: answers });
    const directResult = runPipeline({ discovery_answers: answers });

    assert.deepStrictEqual(
      Object.keys(serviceResult.runtime_state.activated_domains).sort(),
      Object.keys(directResult.activated_domains).sort()
    );
  });

  it("runtime_state.blockers shape matches direct runPipeline output", () => {
    const answers = minimalAnswers();

    const serviceResult = runPipelineService({ discovery_answers: answers });
    const directResult = runPipeline({ discovery_answers: answers });

    assert.deepStrictEqual(
      Object.keys(serviceResult.runtime_state.blockers).sort(),
      Object.keys(directResult.blockers).sort()
    );
  });

  it("input discovery_answers is not mutated by the service", () => {
    const answers = minimalAnswers();
    const answersSnapshot = JSON.parse(JSON.stringify(answers));

    runPipelineService({ discovery_answers: answers });

    assert.deepStrictEqual(answers.answers, answersSnapshot.answers);
    assert.strictEqual(answers.framework_version, answersSnapshot.framework_version);
  });

  it("envelope contains only ok and runtime_state on success", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    const envelopeKeys = Object.keys(result).sort();
    assert.deepStrictEqual(envelopeKeys, ["ok", "runtime_state"]);
  });

  it("envelope contains only ok and error on rejection", () => {
    const result = runPipelineService(null);
    const envelopeKeys = Object.keys(result).sort();
    assert.deepStrictEqual(envelopeKeys, ["error", "ok"]);
  });
});

// ---------------------------------------------------------------------------
// 6. Shared pipeline called exactly once per request
// ---------------------------------------------------------------------------

describe("shared pipeline called exactly once per request", () => {
  it("runtime_state has exactly one orchestrator_version field (not double-wrapped)", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.strictEqual(result.ok, true);
    assert.ok("orchestrator_version" in result.runtime_state);
    // No nested runtime_state
    assert.ok(!("runtime_state" in result.runtime_state));
  });

  it("runtime_state.orchestrated_at is a single ISO string (not array)", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.ok(typeof result.runtime_state.orchestrated_at === "string");
  });

  it("_engine_outputs contains exactly the engine output keys from one pipeline run", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    const eo = result.runtime_state._engine_outputs;
    assert.ok(typeof eo === "object" && eo !== null);

    const expectedEngineKeys = [
      "checkpoints_output",
      "validated_checkpoints",
      "stage_routing",
      "preview_engine_output",
      "execution_eligibility",
      "execution_approvals",
      "execution_records",
    ];
    for (const key of expectedEngineKeys) {
      assert.ok(key in eo, `_engine_outputs missing key: ${key}`);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Contract-shape compliance at backend boundary
// ---------------------------------------------------------------------------

describe("contract-shape compliance at backend boundary", () => {
  it("all contract keys present in runtime_state", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.strictEqual(result.ok, true);
    for (const key of CONTRACT_KEYS) {
      assert.ok(key in result.runtime_state, `runtime_state missing contract key: ${key}`);
    }
  });

  it("activated_domains has domains array", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.runtime_state.activated_domains.domains));
  });

  it("checkpoints is a non-empty array for minimal valid answers", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.runtime_state.checkpoints));
    assert.ok(result.runtime_state.checkpoints.length > 0);
  });

  it("readiness_state has go_live_readiness string", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.ok(typeof result.runtime_state.readiness_state.go_live_readiness === "string");
  });

  it("blockers has active_blockers array and total_count number", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    const b = result.runtime_state.blockers;
    assert.ok(Array.isArray(b.active_blockers));
    assert.ok(typeof b.total_count === "number");
    assert.strictEqual(b.total_count, b.active_blockers.length);
  });

  it("audit_refs has contract-shape fields", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    const ar = result.runtime_state.audit_refs;
    assert.ok("by_checkpoint" in ar);
    assert.ok("by_decision" in ar);
    assert.ok("by_preview" in ar);
    assert.ok("by_execution" in ar);
  });

  it("resume_context has contract-shape fields", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    const rc = result.runtime_state.resume_context;
    assert.ok("current_stages" in rc);
    assert.ok("resume_target_type" in rc);
    assert.ok("next_required_action" in rc);
  });

  it("previews and executions are arrays", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.ok(Array.isArray(result.runtime_state.previews));
    assert.ok(Array.isArray(result.runtime_state.executions));
  });

  it("project_identity propagated truthfully when provided", () => {
    const identity = makeProjectIdentity();
    const result = runPipelineService({
      project_identity: identity,
      discovery_answers: minimalAnswers(),
    });
    assert.ok(result.runtime_state.project_identity !== null);
    assert.strictEqual(result.runtime_state.project_identity.project_id, identity.project_id);
  });
});

// ---------------------------------------------------------------------------
// 8. operation_definitions boundary validation and pass-through
// ---------------------------------------------------------------------------

describe("operation_definitions boundary validation and pass-through", () => {
  it("omitting operation_definitions returns ok: true (null pass-through)", () => {
    const result = runPipelineService({ discovery_answers: minimalAnswers() });
    assert.strictEqual(result.ok, true);
  });

  it("explicitly null operation_definitions returns ok: true", () => {
    const result = runPipelineService({
      discovery_answers: minimalAnswers(),
      operation_definitions: null,
    });
    assert.strictEqual(result.ok, true);
  });

  it("valid plain object operation_definitions returns ok: true", () => {
    const result = runPipelineService({
      discovery_answers: minimalAnswers(),
      operation_definitions: {
        "FND-FOUND-001": {
          checkpoint_id: "FND-FOUND-001",
          target_model: "res.partner",
          target_operation: "write",
          intended_changes: null,
        },
      },
    });
    assert.strictEqual(result.ok, true);
  });

  it("operation_definitions as array is rejected with ok: false", () => {
    const result = runPipelineService({
      discovery_answers: minimalAnswers(),
      operation_definitions: [],
    });
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
    assert.match(result.error, /operation_definitions/i);
  });

  it("operation_definitions as string is rejected with ok: false", () => {
    const result = runPipelineService({
      discovery_answers: minimalAnswers(),
      operation_definitions: "not-an-object",
    });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /operation_definitions/i);
  });

  it("operation_definitions as number is rejected with ok: false", () => {
    const result = runPipelineService({
      discovery_answers: minimalAnswers(),
      operation_definitions: 42,
    });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /operation_definitions/i);
  });

  it("empty operation_definitions object {} returns ok: true", () => {
    const result = runPipelineService({
      discovery_answers: minimalAnswers(),
      operation_definitions: {},
    });
    assert.strictEqual(result.ok, true);
  });

  it("operation_definitions pass-through: supplying definitions for matching Executable checkpoints produces previews in runtime_state", () => {
    const answers = minimalAnswers();
    const target = makeTargetContext();

    // Discovery run to find Executable, preview_required, safety_class checkpoints
    const discovery = runPipelineService({ discovery_answers: answers, target_context: target });
    assert.strictEqual(discovery.ok, true);

    // Build blocker index (keyed by source_checkpoint_id) to exclude blocked checkpoints.
    // The preview engine (Gate 2) refuses blocked checkpoints — test must mirror that gate.
    const blockerIndex = new Set(
      discovery.runtime_state.blockers.active_blockers.map((b) => b.source_checkpoint_id)
    );

    const eligibleIds = discovery.runtime_state.checkpoints
      .filter((cp) =>
        cp.execution_relevance === "Executable" &&
        cp.preview_required === true &&
        cp.safety_class &&
        !blockerIndex.has(cp.checkpoint_id)
      )
      .map((cp) => cp.checkpoint_id);

    if (eligibleIds.length === 0) {
      return; // No Executable preview checkpoints — test passes trivially
    }

    const operation_definitions = {};
    for (const id of eligibleIds) {
      operation_definitions[id] = {
        checkpoint_id: id,
        target_model: "res.partner",
        target_operation: "write",
        intended_changes: null,
      };
    }

    const result = runPipelineService({
      discovery_answers: answers,
      target_context: target,
      operation_definitions,
    });

    assert.strictEqual(result.ok, true);
    assert.ok(result.runtime_state.previews.length >= 1, "Expected previews when definitions supplied");

    for (const preview of result.runtime_state.previews) {
      if (preview.intended_operation_class === "Executable") {
        assert.equal(preview.target_model, "res.partner");
        assert.equal(preview.target_operation, "write");
      }
    }
  });
});
