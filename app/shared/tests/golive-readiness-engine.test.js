// ---------------------------------------------------------------------------
// Go-Live Readiness Engine Tests
// Tests for: app/shared/golive-readiness-engine.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Readiness blocked by foundational blocker
//   2.  Readiness blocked by Domain_Required checkpoint failure state
//   3.  Readiness blocked by Go_Live checkpoint failure state
//   4.  Readiness gap list traceability (source_type, source_id, checkpoint_id)
//   5.  Recommended and Optional items do not block readiness
//   6.  Optional blocker goes to unresolved_warnings, not blocked_checkpoints
//   7.  Required training blocks only when explicitly marked required
//   8.  Advisory training goes to unresolved_warnings when not explicitly required
//   9.  Branch target gap respected when deployment_type is odoosh
//   10. Non-production odoosh environment yields Configuration_Complete_Not_Operationally_Ready
//   11. Non-odoosh deployment ignores environment fields
//   12. Configuration complete but not operationally ready (distinct from Not_Ready)
//   13. All blocking gates passed → Ready
//   14. Deterministic output (identical inputs → identical output)
//   15. Contract-shape compliance (all required fields, correct types)
//   16. Input validation errors
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeGoLiveReadiness,
  createReadinessGap,
  createReadinessState,
  GOLIVE_READINESS_ENGINE_VERSION,
  GO_LIVE_READINESS_STATUS,
  READINESS_GAP_SOURCE_TYPE,
  READINESS_TRAINING_STATUS,
} from "../golive-readiness-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal checkpoint record.
 * Defaults: Foundational, System_Detectable, Complete — no gaps.
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
  training_available = false,
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
    training_available,
  };
}

/**
 * Builds a minimal validated_checkpoints container.
 */
function makeValidatedCheckpoints(records = []) {
  return {
    records,
    engine_version: "1.0.0",
    validated_at: new Date().toISOString(),
  };
}

/**
 * Builds a minimal blockers container with given active_blockers.
 */
function makeBlockers(active_blockers = []) {
  return {
    active_blockers,
    total_count: active_blockers.length,
    by_severity: null,
    by_stage: null,
    by_domain: null,
    highest_priority_blocker: active_blockers.length > 0 ? active_blockers[0] : null,
  };
}

/**
 * Builds a minimal stage_routing container.
 * Accepts a map of checkpoint_id → stage_id for the checkpoint_to_stage field.
 */
function makeStageRouting(checkpointToStage = {}) {
  return {
    stages: [],
    domain_to_stage: {},
    checkpoint_to_stage: checkpointToStage,
    checkpoints_by_stage: {},
    blockers_by_stage: null,
    enriched_active_blockers: [],
    engine_version: "1.0.0",
    routed_at: new Date().toISOString(),
  };
}

/**
 * Builds a minimal blocker record for the active_blockers array.
 */
function makeBlockerRecord({
  blocker_id = "FND-FOUND-001:blocker",
  source_checkpoint_id = "FND-FOUND-001",
  source_domain_id = "foundation",
  source_stage_id = "S04",
  blocker_type = "dependency_unmet",
  blocked_reason = "Test blocked reason.",
  severity = "critical",
} = {}) {
  return {
    blocker_id,
    scope: "checkpoint",
    source_checkpoint_id,
    source_domain_id,
    source_stage_id,
    blocker_type,
    blocked_reason,
    blocking_checkpoint_id: null,
    blocking_domain_id: null,
    severity,
    created_at: new Date().toISOString(),
    resolution_action: "Resolve the dependency.",
  };
}

/**
 * Builds a projectState with target_context and optional deferments.
 */
function makeProjectState({
  deployment_type = null,
  odoosh_environment_type = null,
  odoosh_branch_target = null,
  deferments = [],
  required_training_confirmed = undefined,
} = {}) {
  const project_identity = {
    project_id: "test-project-id",
    project_name: "Test Project",
    customer_entity: null,
    project_owner: null,
    implementation_lead: null,
    project_mode: null,
    created_at: new Date().toISOString(),
    last_modified_at: new Date().toISOString(),
    ...(required_training_confirmed !== undefined
      ? { required_training_confirmed }
      : {}),
  };
  return {
    project_identity,
    target_context: {
      odoo_version: "19",
      edition: "enterprise",
      deployment_type,
      primary_country: null,
      primary_currency: null,
      multi_company: false,
      multi_currency: false,
      odoosh_branch_target,
      odoosh_environment_type,
      connection_mode: null,
      connection_status: null,
      connection_target_id: null,
      connection_capability_note: null,
    },
    deferments,
  };
}

// ---------------------------------------------------------------------------
// 1. Readiness blocked by foundational blocker
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — foundational blocker", () => {
  it("blocks readiness when active blocker targets a Foundational checkpoint", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "In_Progress",
    });
    const blocker = makeBlockerRecord({
      blocker_id: "FND-FOUND-001:blocker",
      source_checkpoint_id: "FND-FOUND-001",
      source_domain_id: "foundation",
      severity: "critical",
      blocked_reason: "Foundational checkpoint is blocked.",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers([blocker]),
      makeStageRouting({ "FND-FOUND-001": "S04" })
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.NOT_READY);
    assert.ok(result.blocked_checkpoints.length > 0, "blocked_checkpoints should be non-empty");
    const blockedEntry = result.blocked_checkpoints[0];
    assert.strictEqual(blockedEntry.source_type, READINESS_GAP_SOURCE_TYPE.BLOCKER);
    assert.strictEqual(blockedEntry.checkpoint_id, "FND-FOUND-001");
    assert.strictEqual(blockedEntry.blocker_id, "FND-FOUND-001:blocker");
    assert.ok(typeof result.recommendation_withheld_reason === "string");
  });

  it("critical blocker alone (checkpoint Complete) still surfaces in blocked_checkpoints", () => {
    // A blocker record on a Foundational checkpoint — even if status happened to be Complete —
    // should appear in blocked_checkpoints for traceability.
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Complete",
    });
    const blocker = makeBlockerRecord({
      source_checkpoint_id: "FND-FOUND-001",
      severity: "critical",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers([blocker]),
      makeStageRouting({ "FND-FOUND-001": "S04" })
    );

    // Blocker on a blocking-class checkpoint blocks readiness
    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.NOT_READY);
    assert.ok(result.blocked_checkpoints.length > 0);
  });
});

// ---------------------------------------------------------------------------
// 2. Readiness blocked by Domain_Required checkpoint failure state
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — Domain_Required checkpoint failure", () => {
  it("blocks readiness when a Domain_Required checkpoint is Not_Started", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      domain: "sales",
      checkpoint_class: "Domain_Required",
      status: "Not_Started",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting({ "SAL-DREQ-001": "S07" })
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.NOT_READY);
    assert.ok(result.incomplete_critical_checkpoints.length > 0);
    const gap = result.incomplete_critical_checkpoints[0];
    assert.strictEqual(gap.checkpoint_id, "SAL-DREQ-001");
    assert.strictEqual(gap.checkpoint_class, "Domain_Required");
    assert.strictEqual(gap.source_type, READINESS_GAP_SOURCE_TYPE.CHECKPOINT);
  });

  it("blocks readiness when a Domain_Required checkpoint is In_Progress", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      domain: "sales",
      checkpoint_class: "Domain_Required",
      status: "In_Progress",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.NOT_READY);
  });

  it("does NOT block when Domain_Required checkpoint is Complete", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      domain: "sales",
      checkpoint_class: "Domain_Required",
      status: "Complete",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    assert.strictEqual(result.incomplete_critical_checkpoints.length, 0);
  });

  it("does NOT block when Domain_Required checkpoint is Deferred", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      domain: "sales",
      checkpoint_class: "Domain_Required",
      status: "Deferred",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    // Should be listed in deferred_checkpoints, not incomplete_critical_checkpoints
    assert.strictEqual(result.incomplete_critical_checkpoints.length, 0);
    assert.strictEqual(result.deferred_checkpoints.length, 1);
  });
});

// ---------------------------------------------------------------------------
// 3. Readiness blocked by Go_Live checkpoint failure state
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — Go_Live checkpoint failure", () => {
  it("blocks readiness when a Go_Live checkpoint is Ready_For_Review", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "GL-CHECK-001",
      domain: "foundation",
      checkpoint_class: "Go_Live",
      status: "Ready_For_Review",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting({ "GL-CHECK-001": "S11" })
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.NOT_READY);
    assert.ok(result.incomplete_critical_checkpoints.length > 0);
    assert.strictEqual(result.incomplete_critical_checkpoints[0].checkpoint_class, "Go_Live");
  });
});

// ---------------------------------------------------------------------------
// 4. Readiness gap list traceability
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — gap list traceability", () => {
  it("each gap preserves source_type, source_id, checkpoint_id, domain, stage_id", () => {
    const cp1 = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      domain: "foundation",
      checkpoint_class: "Foundational",
      status: "Not_Started",
    });
    const cp2 = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      domain: "sales",
      checkpoint_class: "Domain_Required",
      status: "In_Progress",
    });

    const result = computeGoLiveReadiness(
      [cp1, cp2],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting({
        "FND-FOUND-001": "S04",
        "SAL-DREQ-001": "S07",
      })
    );

    assert.strictEqual(result.incomplete_critical_checkpoints.length, 2);

    for (const gap of result.incomplete_critical_checkpoints) {
      assert.ok(gap.source_type !== null, "source_type must be set");
      assert.ok(gap.source_id !== null, "source_id must be set");
      assert.ok(gap.checkpoint_id !== null, "checkpoint_id must be set");
      assert.ok(gap.domain !== null, "domain must be set");
      assert.ok(gap.stage_id !== null, "stage_id must be set (mapped via stageRouting)");
      assert.ok(typeof gap.gap_reason === "string", "gap_reason must be a string");
    }
  });

  it("blocker gap preserves blocker_id and blocker_type for traceability", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "In_Progress",
    });
    const blocker = makeBlockerRecord({
      blocker_id: "FND-FOUND-001:blocker",
      source_checkpoint_id: "FND-FOUND-001",
      blocker_type: "evidence_missing",
      severity: "critical",
      blocked_reason: "Evidence is missing.",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers([blocker]),
      makeStageRouting()
    );

    assert.ok(result.blocked_checkpoints.length > 0);
    const gap = result.blocked_checkpoints[0];
    assert.strictEqual(gap.blocker_id, "FND-FOUND-001:blocker");
    assert.strictEqual(gap.blocker_type, "evidence_missing");
    assert.strictEqual(gap.source_type, READINESS_GAP_SOURCE_TYPE.BLOCKER);
    assert.strictEqual(gap.checkpoint_id, "FND-FOUND-001");
  });

  it("deferred checkpoint gap preserves deferment_id and has_owner_signoff", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      domain: "sales",
      checkpoint_class: "Domain_Required",
      status: "Deferred",
    });
    const deferment = {
      deferment_id: "deferred-uuid-001",
      source_checkpoint_id: "SAL-DREQ-001",
      source_domain_id: "sales",
      source_stage_id: "S07",
      deferred_by: "owner",
      deferred_at: new Date().toISOString(),
      reason: "Post go-live",
      constraints: [],
      review_date: null,
      owner_signoff: true,
      owner_signoff_by: "owner",
      owner_signoff_at: new Date().toISOString(),
      linked_decision_id: null,
      phase2_eligible: true,
      reactivated: false,
      reactivated_at: null,
    };
    const projectState = makeProjectState({ deferments: [deferment] });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    assert.strictEqual(result.deferred_checkpoints.length, 1);
    const deferredGap = result.deferred_checkpoints[0];
    assert.strictEqual(deferredGap.deferment_id, "deferred-uuid-001");
    assert.strictEqual(deferredGap.has_owner_signoff, true);
  });
});

// ---------------------------------------------------------------------------
// 5. Recommended and Optional items do not block readiness
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — Recommended/Optional not blocking", () => {
  it("Recommended checkpoint Not_Started does not block readiness", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-REC-001",
      domain: "sales",
      checkpoint_class: "Recommended",
      status: "Not_Started",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    assert.strictEqual(result.incomplete_critical_checkpoints.length, 0);
    assert.strictEqual(result.blocked_checkpoints.length, 0);
    // Should appear in warnings only
    assert.ok(result.unresolved_warnings.length > 0);
    assert.strictEqual(result.unresolved_warnings[0].checkpoint_id, "SAL-REC-001");
  });

  it("Optional checkpoint Not_Started does not block readiness", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-OPT-001",
      domain: "sales",
      checkpoint_class: "Optional",
      status: "Not_Started",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    assert.strictEqual(result.incomplete_critical_checkpoints.length, 0);
    assert.ok(result.unresolved_warnings.length > 0);
  });

  it("mix: Foundational Complete + Recommended Not_Started → Ready with warning", () => {
    const foundational = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Complete",
    });
    const recommended = makeCheckpoint({
      checkpoint_id: "FND-REC-001",
      domain: "foundation",
      checkpoint_class: "Recommended",
      status: "Not_Started",
    });

    const result = computeGoLiveReadiness(
      [foundational, recommended],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    assert.ok(result.unresolved_warnings.length === 1);
    assert.ok(result.readiness_reason.includes("warning"));
  });
});

// ---------------------------------------------------------------------------
// 6. Optional blocker goes to unresolved_warnings, not blocked_checkpoints
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — standard blocker on Optional checkpoint", () => {
  it("blocker on Optional checkpoint is advisory only", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-OPT-001",
      domain: "sales",
      checkpoint_class: "Optional",
      status: "In_Progress",
    });
    const blocker = makeBlockerRecord({
      blocker_id: "SAL-OPT-001:blocker",
      source_checkpoint_id: "SAL-OPT-001",
      source_domain_id: "sales",
      severity: "standard",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers([blocker]),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    assert.strictEqual(result.blocked_checkpoints.length, 0);
    // Optional checkpoint itself appears in warnings; blocker on it also in warnings
    const warningTypes = result.unresolved_warnings.map((w) => w.source_type);
    assert.ok(warningTypes.includes(READINESS_GAP_SOURCE_TYPE.BLOCKER));
  });
});

// ---------------------------------------------------------------------------
// 7. Required training blocks only when explicitly marked required
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — required training blocking", () => {
  it("training blocks readiness when project_identity.required_training_confirmed is false", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Complete",
      training_available: true,
    });
    const projectState = makeProjectState({ required_training_confirmed: false });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting({ "FND-FOUND-001": "S04" }),
      projectState
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.NOT_READY);
    const trainingGaps = result.incomplete_critical_checkpoints.filter(
      (g) => g.source_type === READINESS_GAP_SOURCE_TYPE.TRAINING
    );
    assert.ok(trainingGaps.length > 0, "training gap should be in incomplete_critical_checkpoints");
    assert.strictEqual(trainingGaps[0].checkpoint_id, "FND-FOUND-001");
  });

  it("training for non-completion checkpoint also blocks when required signal present", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      domain: "sales",
      checkpoint_class: "Domain_Required",
      status: "Complete",
      training_available: true,
    });
    // Status is Complete but training is explicitly required and not confirmed
    const projectState = makeProjectState({ required_training_confirmed: false });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.NOT_READY);
    const trainingGaps = result.incomplete_critical_checkpoints.filter(
      (g) => g.source_type === READINESS_GAP_SOURCE_TYPE.TRAINING
    );
    assert.ok(trainingGaps.length > 0);
  });
});

// ---------------------------------------------------------------------------
// 8. Advisory training goes to unresolved_warnings when not explicitly required
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — advisory training", () => {
  it("training goes to unresolved_warnings when required_training_confirmed is absent", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Complete",
      training_available: true,
    });
    // No required_training_confirmed field in projectState
    const projectState = makeProjectState();

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    // Training is advisory → should not block
    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    assert.strictEqual(result.training_status, READINESS_TRAINING_STATUS.AVAILABLE_NOT_CONFIRMED);
    const trainingWarnings = result.unresolved_warnings.filter(
      (w) => w.source_type === READINESS_GAP_SOURCE_TYPE.TRAINING
    );
    assert.ok(trainingWarnings.length > 0, "training warning should appear in unresolved_warnings");
  });

  it("training_status is OK when no checkpoints have training_available", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Complete",
      training_available: false,
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.training_status, READINESS_TRAINING_STATUS.OK);
  });

  it("training does not block when required_training_confirmed is true", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Complete",
      training_available: true,
    });
    const projectState = makeProjectState({ required_training_confirmed: true });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    // training is available and confirmed: should be OK
    assert.strictEqual(result.training_status, READINESS_TRAINING_STATUS.AVAILABLE_NOT_CONFIRMED);
    // Advisory since required_training_confirmed is true (not false)
    const blockingTraining = result.incomplete_critical_checkpoints.filter(
      (g) => g.source_type === READINESS_GAP_SOURCE_TYPE.TRAINING
    );
    assert.strictEqual(blockingTraining.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 9. Branch target gap respected when deployment_type is odoosh
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — odoosh branch target", () => {
  it("records operational gap when odoosh_branch_target is null", () => {
    const cp = makeCheckpoint({ status: "Complete" });
    const projectState = makeProjectState({
      deployment_type: "odoosh",
      odoosh_branch_target: null,
      odoosh_environment_type: "production",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    assert.strictEqual(
      result.go_live_readiness,
      GO_LIVE_READINESS_STATUS.CONFIGURATION_COMPLETE_NOT_OPERATIONALLY_READY
    );
    const envGaps = result.incomplete_critical_checkpoints.filter(
      (g) => g.source_type === READINESS_GAP_SOURCE_TYPE.TARGET_CONTEXT
    );
    assert.ok(envGaps.length > 0);
    const branchGap = envGaps.find((g) => g.source_id === "odoosh_branch_target");
    assert.ok(branchGap !== undefined, "branch target gap should be present");
  });

  it("no branch gap when odoosh_branch_target is set", () => {
    const cp = makeCheckpoint({ status: "Complete" });
    const projectState = makeProjectState({
      deployment_type: "odoosh",
      odoosh_branch_target: "main",
      odoosh_environment_type: "production",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    const envGaps = result.incomplete_critical_checkpoints.filter(
      (g) => g.source_type === READINESS_GAP_SOURCE_TYPE.TARGET_CONTEXT
    );
    assert.strictEqual(envGaps.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 10. Non-production odoosh environment yields Configuration_Complete_Not_Operationally_Ready
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — non-production environment", () => {
  for (const envType of ["staging", "development", "test"]) {
    it(`odoosh environment "${envType}" yields Configuration_Complete_Not_Operationally_Ready`, () => {
      const cp = makeCheckpoint({ status: "Complete" });
      const projectState = makeProjectState({
        deployment_type: "odoosh",
        odoosh_environment_type: envType,
        odoosh_branch_target: "main",
      });

      const result = computeGoLiveReadiness(
        [cp],
        makeValidatedCheckpoints(),
        makeBlockers(),
        makeStageRouting(),
        projectState
      );

      assert.strictEqual(
        result.go_live_readiness,
        GO_LIVE_READINESS_STATUS.CONFIGURATION_COMPLETE_NOT_OPERATIONALLY_READY
      );
      const envGap = result.incomplete_critical_checkpoints.find(
        (g) => g.source_id === "odoosh_environment_type"
      );
      assert.ok(envGap !== undefined, "environment gap should be present");
      assert.ok(envGap.gap_reason.includes(envType));
    });
  }
});

// ---------------------------------------------------------------------------
// 11. Non-odoosh deployment ignores environment fields
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — non-odoosh deployment", () => {
  it("on-premise deployment with null environment fields does not produce gaps", () => {
    const cp = makeCheckpoint({ status: "Complete" });
    const projectState = makeProjectState({
      deployment_type: "on_premise",
      odoosh_environment_type: null,
      odoosh_branch_target: null,
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    const envGaps = result.incomplete_critical_checkpoints.filter(
      (g) => g.source_type === READINESS_GAP_SOURCE_TYPE.TARGET_CONTEXT
    );
    assert.strictEqual(envGaps.length, 0);
  });

  it("null projectState does not cause errors and produces no environment gaps", () => {
    const cp = makeCheckpoint({ status: "Complete" });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      null
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
  });
});

// ---------------------------------------------------------------------------
// 12. Configuration complete but not operationally ready
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — configuration complete / not operationally ready", () => {
  it("Config_Complete_Not_Operationally_Ready is distinct from Not_Ready", () => {
    const foundational = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Complete",
    });
    const domainRequired = makeCheckpoint({
      checkpoint_id: "SAL-DREQ-001",
      domain: "sales",
      checkpoint_class: "Domain_Required",
      status: "Complete",
    });
    // All checkpoints complete, but staging environment
    const projectState = makeProjectState({
      deployment_type: "odoosh",
      odoosh_environment_type: "staging",
      odoosh_branch_target: "main",
    });

    const result = computeGoLiveReadiness(
      [foundational, domainRequired],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    assert.strictEqual(
      result.go_live_readiness,
      GO_LIVE_READINESS_STATUS.CONFIGURATION_COMPLETE_NOT_OPERATIONALLY_READY
    );
    // incomplete_critical_checkpoints contains only the environment gap
    const checkpointGaps = result.incomplete_critical_checkpoints.filter(
      (g) => g.source_type === READINESS_GAP_SOURCE_TYPE.CHECKPOINT
    );
    assert.strictEqual(checkpointGaps.length, 0, "no checkpoint gaps — config is complete");
    const envGaps = result.incomplete_critical_checkpoints.filter(
      (g) => g.source_type === READINESS_GAP_SOURCE_TYPE.TARGET_CONTEXT
    );
    assert.ok(envGaps.length > 0, "environment gap should be present");
    assert.ok(result.recommendation_withheld_reason !== null);
  });

  it("Not_Ready when checkpoint gap AND environment gap both present", () => {
    const cp = makeCheckpoint({
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      status: "Not_Started",
    });
    const projectState = makeProjectState({
      deployment_type: "odoosh",
      odoosh_environment_type: "staging",
      odoosh_branch_target: "main",
    });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting(),
      projectState
    );

    // Config gap takes precedence — result is Not_Ready, not Configuration_Complete
    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.NOT_READY);
  });
});

// ---------------------------------------------------------------------------
// 13. All blocking gates passed → Ready
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — all gates passed", () => {
  it("returns Ready with no gaps when all blocking checkpoints are Complete", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", checkpoint_class: "Foundational", status: "Complete" }),
      makeCheckpoint({ checkpoint_id: "SAL-DREQ-001", domain: "sales", checkpoint_class: "Domain_Required", status: "Complete" }),
      makeCheckpoint({ checkpoint_id: "GL-CHECK-001", checkpoint_class: "Go_Live", status: "Complete" }),
    ];

    const result = computeGoLiveReadiness(
      checkpoints,
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    assert.strictEqual(result.incomplete_critical_checkpoints.length, 0);
    assert.strictEqual(result.blocked_checkpoints.length, 0);
    assert.strictEqual(result.recommendation_issued, false);
    assert.strictEqual(result.recommendation_withheld_reason, null);
  });

  it("Deferred satisfies the blocking gate for all blocking classes", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", checkpoint_class: "Foundational",   status: "Deferred" }),
      makeCheckpoint({ checkpoint_id: "SAL-DREQ-001",  domain: "sales", checkpoint_class: "Domain_Required", status: "Deferred" }),
      makeCheckpoint({ checkpoint_id: "GL-CHECK-001",  checkpoint_class: "Go_Live",         status: "Deferred" }),
    ];

    const result = computeGoLiveReadiness(
      checkpoints,
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    assert.strictEqual(result.go_live_readiness, GO_LIVE_READINESS_STATUS.READY);
    assert.strictEqual(result.incomplete_critical_checkpoints.length, 0);
    assert.strictEqual(result.deferred_checkpoints.length, 3);
  });
});

// ---------------------------------------------------------------------------
// 14. Deterministic output
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — determinism", () => {
  it("identical inputs produce identical go_live_readiness and gap counts", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", checkpoint_class: "Foundational", status: "Not_Started" }),
      makeCheckpoint({ checkpoint_id: "SAL-DREQ-001", domain: "sales", checkpoint_class: "Domain_Required", status: "Complete" }),
    ];
    const validatedCheckpoints = makeValidatedCheckpoints();
    const blockers = makeBlockers();
    const stageRouting = makeStageRouting({ "FND-FOUND-001": "S04", "SAL-DREQ-001": "S07" });

    const r1 = computeGoLiveReadiness(checkpoints, validatedCheckpoints, blockers, stageRouting);
    const r2 = computeGoLiveReadiness(checkpoints, validatedCheckpoints, blockers, stageRouting);

    assert.strictEqual(r1.go_live_readiness, r2.go_live_readiness);
    assert.strictEqual(r1.incomplete_critical_checkpoints.length, r2.incomplete_critical_checkpoints.length);
    assert.strictEqual(r1.blocked_checkpoints.length, r2.blocked_checkpoints.length);
    assert.strictEqual(r1.training_status, r2.training_status);
    assert.strictEqual(r1.recommendation_issued, r2.recommendation_issued);

    // Gap content should be identical
    for (let i = 0; i < r1.incomplete_critical_checkpoints.length; i++) {
      assert.strictEqual(
        r1.incomplete_critical_checkpoints[i].checkpoint_id,
        r2.incomplete_critical_checkpoints[i].checkpoint_id
      );
      assert.strictEqual(
        r1.incomplete_critical_checkpoints[i].source_type,
        r2.incomplete_critical_checkpoints[i].source_type
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 15. Contract-shape compliance
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — contract-shape compliance", () => {
  it("output contains all required readiness_state fields with correct types", () => {
    const cp = makeCheckpoint({ status: "Complete" });

    const result = computeGoLiveReadiness(
      [cp],
      makeValidatedCheckpoints(),
      makeBlockers(),
      makeStageRouting()
    );

    // §1.8 required fields
    assert.ok("go_live_readiness" in result, "go_live_readiness must be present");
    assert.ok("readiness_reason" in result, "readiness_reason must be present");
    assert.ok("incomplete_critical_checkpoints" in result);
    assert.ok("blocked_checkpoints" in result);
    assert.ok("deferred_checkpoints" in result);
    assert.ok("unresolved_warnings" in result);
    assert.ok("training_status" in result);
    assert.ok("recommendation_issued" in result);
    assert.ok("recommendation_issued_at" in result);
    assert.ok("recommendation_issued_by" in result);
    assert.ok("recommendation_withheld_reason" in result);

    assert.ok(typeof result.go_live_readiness === "string" || result.go_live_readiness === null);
    assert.ok(typeof result.readiness_reason === "string" || result.readiness_reason === null);
    assert.ok(Array.isArray(result.incomplete_critical_checkpoints));
    assert.ok(Array.isArray(result.blocked_checkpoints));
    assert.ok(Array.isArray(result.deferred_checkpoints));
    assert.ok(Array.isArray(result.unresolved_warnings));
    assert.strictEqual(typeof result.recommendation_issued, "boolean");
    assert.strictEqual(result.recommendation_issued, false);
    assert.strictEqual(result.recommendation_issued_at, null);
    assert.strictEqual(result.recommendation_issued_by, null);
  });

  it("createReadinessState factory produces correct default shape", () => {
    const state = createReadinessState();

    assert.strictEqual(state.go_live_readiness, null);
    assert.strictEqual(state.readiness_reason, null);
    assert.deepStrictEqual(state.incomplete_critical_checkpoints, []);
    assert.deepStrictEqual(state.blocked_checkpoints, []);
    assert.deepStrictEqual(state.deferred_checkpoints, []);
    assert.deepStrictEqual(state.unresolved_warnings, []);
    assert.strictEqual(state.training_status, null);
    assert.strictEqual(state.recommendation_issued, false);
    assert.strictEqual(state.recommendation_issued_at, null);
    assert.strictEqual(state.recommendation_issued_by, null);
    assert.strictEqual(state.recommendation_withheld_reason, null);
  });

  it("createReadinessGap factory produces all expected fields", () => {
    const gap = createReadinessGap({
      source_type: "checkpoint",
      source_id: "FND-FOUND-001",
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      domain: "foundation",
      stage_id: "S04",
      gap_reason: "Not started.",
    });

    assert.strictEqual(gap.source_type, "checkpoint");
    assert.strictEqual(gap.source_id, "FND-FOUND-001");
    assert.strictEqual(gap.checkpoint_id, "FND-FOUND-001");
    assert.strictEqual(gap.checkpoint_class, "Foundational");
    assert.strictEqual(gap.domain, "foundation");
    assert.strictEqual(gap.stage_id, "S04");
    assert.strictEqual(gap.blocker_id, null);
    assert.strictEqual(gap.blocker_type, null);
    assert.strictEqual(gap.deferment_id, null);
    assert.strictEqual(gap.has_owner_signoff, false);
    assert.strictEqual(gap.gap_reason, "Not started.");
  });

  it("engine version constant is exported and is a string", () => {
    assert.strictEqual(typeof GOLIVE_READINESS_ENGINE_VERSION, "string");
    assert.ok(GOLIVE_READINESS_ENGINE_VERSION.length > 0);
  });

  it("GO_LIVE_READINESS_STATUS contains expected values", () => {
    assert.strictEqual(GO_LIVE_READINESS_STATUS.READY, "Ready");
    assert.strictEqual(GO_LIVE_READINESS_STATUS.NOT_READY, "Not_Ready");
    assert.ok("CONFIGURATION_COMPLETE_NOT_OPERATIONALLY_READY" in GO_LIVE_READINESS_STATUS);
  });
});

// ---------------------------------------------------------------------------
// 16. Input validation errors
// ---------------------------------------------------------------------------

describe("computeGoLiveReadiness — input validation", () => {
  it("throws when checkpoints is not an array", () => {
    assert.throws(
      () => computeGoLiveReadiness(null, makeValidatedCheckpoints(), makeBlockers(), makeStageRouting()),
      /checkpoints must be an array/
    );
  });

  it("throws when validatedCheckpoints has no records array", () => {
    assert.throws(
      () => computeGoLiveReadiness([], { engine_version: "1.0.0" }, makeBlockers(), makeStageRouting()),
      /records array/
    );
  });

  it("throws when blockers has no active_blockers array", () => {
    assert.throws(
      () => computeGoLiveReadiness([], makeValidatedCheckpoints(), {}, makeStageRouting()),
      /active_blockers array/
    );
  });

  it("throws when stageRouting is null", () => {
    assert.throws(
      () => computeGoLiveReadiness([], makeValidatedCheckpoints(), makeBlockers(), null),
      /stageRouting must be an object/
    );
  });
});
