// ---------------------------------------------------------------------------
// Foundation Preview Integration Proof Test
// ---------------------------------------------------------------------------
//
// Proves: the repo can produce a first visible Foundation preview under
// governed eligibility gates.
//
// Proof conditions (all must hold):
//   - confirmed_by: "proof-operator" satisfies the unconditional Both-gate
//     for FND-FOUND-001, advancing it to Pending_System_Check and clearing
//     the owner_confirmation_missing blocker (Gate 2 cleared).
//   - deployment_type: "on_premise" satisfies Gate 3 (target_context present).
//   - Gate 4 (branch target) does not apply to on_premise.
//   - Gate 5 satisfied: FND-FOUND-001 has safety_class "Safe".
//   - Gate 6 satisfied: operation_definition supplied for FND-FOUND-001
//     with target_model "res.company" and target_operation "write".
//
// Assertions:
//   A1  runtime_state.previews.length >= 1
//   A2  at least one preview has target_model === "res.company"
//       and target_operation === "write"
//   A3  all previews have execution_approval_implied === false
// ---------------------------------------------------------------------------

"use strict";

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runPipeline } from "../pipeline-orchestrator.js";
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
 * Minimal answer set sufficient for unconditional domain activation.
 * confirmed_by is set to "proof-operator" to satisfy the owner-confirmation
 * gate for unconditional Both checkpoints (e.g. FND-FOUND-001).
 */
function proofAnswers() {
  const da = makeAnswers({
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
  // confirmed_by clears owner_confirmation_missing blocker for unconditional
  // Both checkpoints (validation advances to Pending_System_Check, not
  // Pending_User_Input, so P1 in blocker-engine does not fire).
  da.confirmed_by = "proof-operator";
  return da;
}

function unconfirmedProofAnswers() {
  const da = proofAnswers();
  da.confirmed_by = null;
  return da;
}

/**
 * Target context with deployment_type "on_premise".
 * Satisfies Gate 3 (target_context non-null, deployment_type non-null).
 * Gate 4 does not apply (on_premise does not require odoosh_branch_target).
 */
function proofTargetContext() {
  return {
    odoo_version: "19",
    edition: "enterprise",
    deployment_type: "on_premise",
    primary_country: "AU",
    primary_currency: "AUD",
    multi_company: false,
    multi_currency: false,
    odoosh_branch_target: null,
    odoosh_environment_type: null,
    connection_mode: null,
    connection_status: null,
    connection_target_id: null,
    connection_capability_note: null,
  };
}

/**
 * Operation definitions for FND-FOUND-001.
 * Supplies target_model "res.company" and target_operation "write" to satisfy
 * Gate 6 (Executable checkpoints require an explicit operation definition).
 * target_model and target_operation are NEVER inferred — they come exclusively
 * from this caller-supplied definition per governed-preview-engine R15.
 */
function proofOperationDefinitions() {
  return {
    "FND-FOUND-001": {
      checkpoint_id: "FND-FOUND-001",
      target_model: "res.company",
      target_operation: "write",
      intended_changes: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Proof suite
// ---------------------------------------------------------------------------

describe("Foundation preview integration proof", () => {
  it("produces a root foundation preview on fresh project without confirmed_by", () => {
    const result = runPipeline({
      discovery_answers: unconfirmedProofAnswers(),
      target_context: proofTargetContext(),
      operation_definitions: proofOperationDefinitions(),
    });

    const hasFoundationPreview = result.previews.some(
      (p) => p.checkpoint_id === "FND-FOUND-001"
    );
    assert.ok(
      hasFoundationPreview,
      "Expected FND-FOUND-001 preview when dependencies are empty and owner confirmation is pending."
    );
  });

  it("produces at least one preview when confirmed_by and on_premise target are supplied with operation_definitions", () => {
    const result = runPipeline({
      discovery_answers: proofAnswers(),
      target_context: proofTargetContext(),
      operation_definitions: proofOperationDefinitions(),
    });

    // A1: at least one preview produced
    assert.ok(
      Array.isArray(result.previews) && result.previews.length >= 1,
      `Expected previews.length >= 1, got ${result.previews.length}`
    );
  });

  it("at least one preview targets res.company write", () => {
    const result = runPipeline({
      discovery_answers: proofAnswers(),
      target_context: proofTargetContext(),
      operation_definitions: proofOperationDefinitions(),
    });

    // A2: at least one preview has target_model "res.company" and target_operation "write"
    const hasCompanyWrite = result.previews.some(
      (p) => p.target_model === "res.company" && p.target_operation === "write"
    );
    assert.ok(
      hasCompanyWrite,
      `Expected at least one preview with target_model "res.company" and target_operation "write". ` +
      `Got previews: ${JSON.stringify(result.previews.map((p) => ({ target_model: p.target_model, target_operation: p.target_operation })))}`
    );
  });

  it("all previews have execution_approval_implied === false", () => {
    const result = runPipeline({
      discovery_answers: proofAnswers(),
      target_context: proofTargetContext(),
      operation_definitions: proofOperationDefinitions(),
    });

    // A3: no preview implies execution approval (R8 of governed-preview-engine)
    for (const preview of result.previews) {
      assert.strictEqual(
        preview.execution_approval_implied,
        false,
        `preview ${preview.preview_id} has execution_approval_implied !== false`
      );
    }
  });

  it("preview_engine_output.previews matches result.previews (pipeline linkage)", () => {
    const result = runPipeline({
      discovery_answers: proofAnswers(),
      target_context: proofTargetContext(),
      operation_definitions: proofOperationDefinitions(),
    });

    // Engine output and composed output must be identical (R3 of governed-preview-engine)
    assert.deepStrictEqual(
      result.previews,
      result._engine_outputs.preview_engine_output.previews
    );
  });
});
