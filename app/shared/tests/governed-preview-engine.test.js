// ---------------------------------------------------------------------------
// Governed Preview Engine Tests
// Tests for: app/shared/governed-preview-engine.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Preview generated for eligible governed checkpoint
//   2.  Blocked checkpoint produces no previewable record
//   3.  Missing target context prevents truthful preview (Executable)
//   4.  Null deployment_type in target context prevents truthful preview
//   5.  Deployment-sensitive preview (odoosh) requires explicit branch target
//   6.  Non-odoosh deployment does not require branch target
//   7.  Preview record preserves checkpoint linkage (checkpoint_id)
//   8.  Preview record carries safety_class from governing checkpoint
//   9.  Preview does not imply execution approval (execution_approval_implied === false)
//   10. checkpoint.preview_required !== true → no preview generated
//   11. Missing safety_class prevents preview generation
//   12. Informational checkpoint with target context omitted still previews
//   13. Multiple checkpoints: only eligible ones produce records
//   14. Determinism: identical inputs produce identical previews
//   15. Contract-shape compliance: all required fields present and typed correctly
//   16. Input validation: non-array checkpoints throws
//   17. Gate 6: operation definition required for Executable checkpoints
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computePreviews,
  createPreviewRecord,
  createPreviewEngineOutput,
  GOVERNED_PREVIEW_ENGINE_VERSION,
  BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES,
  TARGET_CONTEXT_REQUIRED_RELEVANCE,
} from "../governed-preview-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a single operation definition object for use in tests.
 * target_model / target_operation / intended_changes are caller-supplied; never inferred.
 */
function makeOpDef(checkpoint_id, {
  target_model = "res.partner",
  target_operation = "write",
  intended_changes = null,
} = {}) {
  return {
    checkpoint_id,
    target_model,
    target_operation,
    intended_changes,
  };
}

/**
 * Builds an operation_definitions map from a list of checkpoint_ids.
 * Each entry uses default test values — no inference.
 */
function makeOpDefs(...checkpoint_ids) {
  const map = {};
  for (const id of checkpoint_ids) {
    map[id] = makeOpDef(id);
  }
  return map;
}

/**
 * Builds a minimal checkpoint record for use in tests.
 * Defaults match a previewable Executable checkpoint in foundation domain.
 */
function makeCheckpoint({
  checkpoint_id = "FND-FOUND-001",
  domain = "foundation",
  checkpoint_class = "Foundational",
  validation_source = "System_Detectable",
  status = "In_Progress",
  dependencies = [],
  evidence_required = [],
  evidence_items = {},
  execution_relevance = "Executable",
  preview_required = true,
  safety_class = "safe",
  downstream_impact_summary = "Downstream impact for test.",
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
    execution_relevance,
    preview_required,
    safety_class,
    downstream_impact_summary,
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
 * Builds a minimal blockers container with given active_blocker checkpoint_ids.
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
 * Builds a minimal target_context for an odoosh deployment.
 */
function makeOdooshTargetContext({
  odoosh_branch_target = "main",
  odoosh_environment_type = "production",
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
    connection_mode: null,
    connection_status: null,
    connection_target_id: null,
    connection_capability_note: null,
  };
}

/**
 * Builds a minimal target_context for a self-hosted deployment.
 */
function makeSelfHostedTargetContext() {
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
    connection_mode: null,
    connection_status: null,
    connection_target_id: null,
    connection_capability_note: null,
  };
}

// ---------------------------------------------------------------------------
// Test 1: Preview generated for eligible governed checkpoint
// ---------------------------------------------------------------------------

describe("computePreviews — eligible checkpoint", () => {
  it("generates exactly one preview record for a single eligible checkpoint", () => {
    const checkpoints = [makeCheckpoint()];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 1);
    assert.equal(result.engine_version, GOVERNED_PREVIEW_ENGINE_VERSION);
    assert.ok(typeof result.generated_at === "string");
  });
});

// ---------------------------------------------------------------------------
// Test 2: Blocked checkpoint produces no previewable record
// ---------------------------------------------------------------------------

describe("computePreviews — blocked checkpoint", () => {
  it("produces no preview record when checkpoint has an active blocker", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "FND-FOUND-001" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers(["FND-FOUND-001"]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 0);
  });

  it("generates a preview only for the non-blocked checkpoint when one is blocked", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-002" }),
    ];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers(["FND-FOUND-001"]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001", "FND-FOUND-002");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 1);
    assert.equal(result.previews[0].checkpoint_id, "FND-FOUND-002");
  });
});

// ---------------------------------------------------------------------------
// Test 3: Missing target context prevents truthful preview (Executable)
// ---------------------------------------------------------------------------

describe("computePreviews — target context required", () => {
  it("produces no preview for Executable checkpoint when target_context is null", () => {
    const checkpoints = [makeCheckpoint({ execution_relevance: "Executable" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);

    const result = computePreviews(checkpoints, validated, blockers, null, null);

    assert.equal(result.previews.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Null deployment_type in target context prevents truthful preview
// ---------------------------------------------------------------------------

describe("computePreviews — null deployment_type", () => {
  it("produces no preview for Executable checkpoint when deployment_type is null", () => {
    const checkpoints = [makeCheckpoint({ execution_relevance: "Executable" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const partial_ctx = { odoo_version: "19", deployment_type: null };

    const result = computePreviews(checkpoints, validated, blockers, null, partial_ctx);

    assert.equal(result.previews.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 5: Deployment-sensitive preview (odoosh) requires explicit branch target
// ---------------------------------------------------------------------------

describe("computePreviews — odoosh branch target required", () => {
  it("produces no preview for odoosh Executable checkpoint when branch target is null", () => {
    const checkpoints = [makeCheckpoint({ execution_relevance: "Executable" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ odoosh_branch_target: null });

    const result = computePreviews(checkpoints, validated, blockers, null, target_context);

    assert.equal(result.previews.length, 0);
  });

  it("produces no preview for odoosh Executable checkpoint when branch target is empty string", () => {
    const checkpoints = [makeCheckpoint({ execution_relevance: "Executable" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ odoosh_branch_target: "" });

    const result = computePreviews(checkpoints, validated, blockers, null, target_context);

    assert.equal(result.previews.length, 0);
  });

  it("produces a preview when odoosh branch target is explicitly set", () => {
    const checkpoints = [makeCheckpoint({ execution_relevance: "Executable" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext({ odoosh_branch_target: "staging-branch" });
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 1);
    assert.equal(result.previews[0].branch_context, "staging-branch");
  });
});

// ---------------------------------------------------------------------------
// Test 6: Non-odoosh deployment does not require branch target
// ---------------------------------------------------------------------------

describe("computePreviews — non-odoosh does not gate on branch target", () => {
  it("generates preview for self_hosted Executable checkpoint without branch target", () => {
    const checkpoints = [makeCheckpoint({ execution_relevance: "Executable" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeSelfHostedTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 1);
    assert.equal(result.previews[0].deployment_target, "self_hosted");
    assert.equal(result.previews[0].branch_context, null);
  });
});

// ---------------------------------------------------------------------------
// Test 7: Preview record preserves checkpoint linkage
// ---------------------------------------------------------------------------

describe("computePreviews — checkpoint linkage", () => {
  it("preview record carries the governing checkpoint_id", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "FND-FOUND-007" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-007");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 1);
    assert.equal(result.previews[0].checkpoint_id, "FND-FOUND-007");
  });

  it("preview record carries checkpoint_class from governing checkpoint", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_class: "Domain_Required" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews[0].checkpoint_class, "Domain_Required");
  });

  it("preview record carries prerequisite_snapshot from checkpoint dependencies", () => {
    const checkpoints = [
      makeCheckpoint({ dependencies: ["FND-FOUND-001", "FND-FOUND-002"] }),
    ];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.deepEqual(result.previews[0].prerequisite_snapshot, ["FND-FOUND-001", "FND-FOUND-002"]);
  });

  it("preview record carries downstream_impact_summary from governing checkpoint", () => {
    const checkpoints = [
      makeCheckpoint({ downstream_impact_summary: "Affects localization settings downstream." }),
    ];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(
      result.previews[0].downstream_impact_summary,
      "Affects localization settings downstream."
    );
  });
});

// ---------------------------------------------------------------------------
// Test 8: Safety class carried from governing checkpoint
// ---------------------------------------------------------------------------

describe("computePreviews — safety class carriage", () => {
  it("preview record carries safety_class from governing checkpoint", () => {
    const checkpoints = [makeCheckpoint({ safety_class: "high" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews[0].safety_class, "high");
  });

  it("preview record carries safety_class 'safe' when checkpoint has that class", () => {
    const checkpoints = [makeCheckpoint({ safety_class: "safe" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews[0].safety_class, "safe");
  });
});

// ---------------------------------------------------------------------------
// Test 9: Preview does not imply execution approval
// ---------------------------------------------------------------------------

describe("computePreviews — no execution approval", () => {
  it("execution_approval_implied is always false on every preview record", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-002" }),
    ];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("FND-FOUND-001", "FND-FOUND-002");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 2);
    for (const preview of result.previews) {
      assert.equal(preview.execution_approval_implied, false);
    }
  });

  it("createPreviewRecord always sets execution_approval_implied to false regardless of any caller input", () => {
    // Even if a caller somehow attempts to pass the field, factory enforces false.
    const record = createPreviewRecord({
      preview_id: "test-preview-id",
      checkpoint_id: "FND-FOUND-001",
      safety_class: "safe",
    });
    assert.equal(record.execution_approval_implied, false);
  });
});

// ---------------------------------------------------------------------------
// Test 10: checkpoint.preview_required !== true → no preview generated
// ---------------------------------------------------------------------------

describe("computePreviews — preview_required gate", () => {
  it("produces no preview when preview_required is false", () => {
    const checkpoints = [makeCheckpoint({ preview_required: false })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();

    const result = computePreviews(checkpoints, validated, blockers, null, target_context);

    assert.equal(result.previews.length, 0);
  });

  it("produces no preview when preview_required is null", () => {
    const checkpoints = [makeCheckpoint({ preview_required: null })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();

    const result = computePreviews(checkpoints, validated, blockers, null, target_context);

    assert.equal(result.previews.length, 0);
  });

  it("produces no preview when preview_required is absent from record", () => {
    // Construct directly — makeCheckpoint default would apply true
    const checkpoint = {
      checkpoint_id: "CK-NO-PREVIEW",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "System_Detectable",
      status: "In_Progress",
      dependencies: [],
      execution_relevance: "Executable",
      safety_class: "safe",
      downstream_impact_summary: "Test.",
      // preview_required intentionally absent
    };
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();

    const result = computePreviews([checkpoint], validated, blockers, null, target_context);

    assert.equal(result.previews.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 11: Missing safety_class prevents preview generation
// ---------------------------------------------------------------------------

describe("computePreviews — safety class gate", () => {
  it("produces no preview when checkpoint safety_class is null", () => {
    const checkpoints = [makeCheckpoint({ safety_class: null })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();

    const result = computePreviews(checkpoints, validated, blockers, null, target_context);

    assert.equal(result.previews.length, 0);
  });

  it("produces no preview when checkpoint safety_class is empty string", () => {
    const checkpoints = [makeCheckpoint({ safety_class: "" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();

    const result = computePreviews(checkpoints, validated, blockers, null, target_context);

    assert.equal(result.previews.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Test 12: Informational checkpoint without target context still previews
// ---------------------------------------------------------------------------

describe("computePreviews — Informational checkpoint target context gate", () => {
  it("generates preview for Informational checkpoint when target_context is null", () => {
    const checkpoints = [
      makeCheckpoint({ execution_relevance: "Informational", preview_required: true }),
    ];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);

    const result = computePreviews(checkpoints, validated, blockers, null, null);

    assert.equal(result.previews.length, 1);
    assert.equal(result.previews[0].deployment_target, null);
    assert.equal(result.previews[0].branch_context, null);
  });
});

// ---------------------------------------------------------------------------
// Test 13: Multiple checkpoints — only eligible ones produce records
// ---------------------------------------------------------------------------

describe("computePreviews — mixed eligibility", () => {
  it("emits only eligible previews from a mixed batch", () => {
    const target_context = makeOdooshTargetContext();

    const checkpoints = [
      // eligible — needs definition
      makeCheckpoint({ checkpoint_id: "CK-001", preview_required: true }),
      // not in scope — Gate 1 (preview_required=false)
      makeCheckpoint({ checkpoint_id: "CK-002", preview_required: false }),
      // blocked — Gate 2
      makeCheckpoint({ checkpoint_id: "CK-003", preview_required: true }),
      // missing safety_class — Gate 5
      makeCheckpoint({ checkpoint_id: "CK-004", preview_required: true, safety_class: null }),
      // eligible — needs definition
      makeCheckpoint({ checkpoint_id: "CK-005", preview_required: true }),
    ];

    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers(["CK-003"]);
    // Provide definitions for the two eligible checkpoints
    const operation_definitions = makeOpDefs("CK-001", "CK-005");

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 2);
    const ids = result.previews.map((p) => p.checkpoint_id);
    assert.ok(ids.includes("CK-001"));
    assert.ok(ids.includes("CK-005"));
    assert.ok(!ids.includes("CK-002"));
    assert.ok(!ids.includes("CK-003"));
    assert.ok(!ids.includes("CK-004"));
  });
});

// ---------------------------------------------------------------------------
// Test 14: Determinism
// ---------------------------------------------------------------------------

describe("computePreviews — determinism", () => {
  it("produces the same set of checkpoint_ids for identical inputs across two runs", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "CK-001" }),
      makeCheckpoint({ checkpoint_id: "CK-002", preview_required: false }),
      makeCheckpoint({ checkpoint_id: "CK-003" }),
    ];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("CK-001", "CK-003");

    const result1 = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);
    const result2 = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    const ids1 = result1.previews.map((p) => p.checkpoint_id).sort();
    const ids2 = result2.previews.map((p) => p.checkpoint_id).sort();

    assert.deepEqual(ids1, ids2);
    assert.equal(result1.previews.length, result2.previews.length);
  });

  it("produces the same safety_class, checkpoint_class, and intended_operation_class across two runs", () => {
    const checkpoints = [makeCheckpoint({
      checkpoint_id: "CK-001",
      checkpoint_class: "Go_Live",
      safety_class: "high",
      execution_relevance: "Executable",
    })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = makeOpDefs("CK-001");

    const r1 = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);
    const r2 = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(r1.previews[0].safety_class, r2.previews[0].safety_class);
    assert.equal(r1.previews[0].checkpoint_class, r2.previews[0].checkpoint_class);
    assert.equal(r1.previews[0].intended_operation_class, r2.previews[0].intended_operation_class);
  });
});

// ---------------------------------------------------------------------------
// Test 15: Contract-shape compliance
// ---------------------------------------------------------------------------

describe("computePreviews — contract-shape compliance", () => {
  it("preview record contains all required fields including operation-binding fields", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "CK-SHAPE-001" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = {
      "CK-SHAPE-001": makeOpDef("CK-SHAPE-001", {
        target_model: "account.move",
        target_operation: "create",
        intended_changes: { journal_id: 1 },
      }),
    };

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 1);
    const preview = result.previews[0];

    // Required fields
    assert.ok(typeof preview.preview_id === "string" && preview.preview_id.length > 0);
    assert.equal(preview.checkpoint_id, "CK-SHAPE-001");
    assert.ok("checkpoint_class" in preview);
    assert.ok("safety_class" in preview);
    assert.ok("intended_operation_class" in preview);
    assert.ok("deployment_target" in preview);
    assert.ok("branch_context" in preview);
    assert.ok(Array.isArray(preview.prerequisite_snapshot));
    assert.ok("downstream_impact_summary" in preview);
    assert.equal(preview.execution_approval_implied, false);
    assert.equal(preview.stale, false);
    assert.equal(preview.linked_execution_id, null);
    assert.ok(typeof preview.generated_at === "string");
    // Operation-binding fields
    assert.equal(preview.target_model, "account.move");
    assert.equal(preview.target_operation, "create");
    assert.deepEqual(preview.intended_changes, { journal_id: 1 });
  });

  it("output container contains previews, engine_version, and generated_at", () => {
    const result = computePreviews([], makeValidatedCheckpoints(), makeBlockers([]), null, null);

    assert.ok(Array.isArray(result.previews));
    assert.equal(typeof result.engine_version, "string");
    assert.equal(typeof result.generated_at, "string");
    assert.equal(result.engine_version, GOVERNED_PREVIEW_ENGINE_VERSION);
  });

  it("createPreviewEngineOutput returns correct container shape when called directly", () => {
    const output = createPreviewEngineOutput({
      previews: [],
      engine_version: GOVERNED_PREVIEW_ENGINE_VERSION,
      generated_at: new Date().toISOString(),
    });

    assert.ok(Array.isArray(output.previews));
    assert.equal(output.engine_version, GOVERNED_PREVIEW_ENGINE_VERSION);
    assert.ok(typeof output.generated_at === "string");
  });

  it("createPreviewRecord returns all governed fields including operation-binding fields", () => {
    const record = createPreviewRecord({
      preview_id: "test-001",
      checkpoint_id: "FND-FOUND-001",
      checkpoint_class: "Foundational",
      safety_class: "safe",
      intended_operation_class: "Executable",
      deployment_target: "odoosh",
      branch_context: "main",
      prerequisite_snapshot: ["DEP-001"],
      downstream_impact_summary: "Test impact.",
      generated_at: "2026-03-27T00:00:00.000Z",
      target_model: "res.company",
      target_operation: "write",
      intended_changes: { currency_id: 3 },
    });

    assert.equal(record.preview_id, "test-001");
    assert.equal(record.checkpoint_id, "FND-FOUND-001");
    assert.equal(record.checkpoint_class, "Foundational");
    assert.equal(record.safety_class, "safe");
    assert.equal(record.intended_operation_class, "Executable");
    assert.equal(record.deployment_target, "odoosh");
    assert.equal(record.branch_context, "main");
    assert.deepEqual(record.prerequisite_snapshot, ["DEP-001"]);
    assert.equal(record.downstream_impact_summary, "Test impact.");
    assert.equal(record.execution_approval_implied, false);
    assert.equal(record.stale, false);
    assert.equal(record.linked_execution_id, null);
    assert.equal(record.generated_at, "2026-03-27T00:00:00.000Z");
    assert.equal(record.target_model, "res.company");
    assert.equal(record.target_operation, "write");
    assert.deepEqual(record.intended_changes, { currency_id: 3 });
  });

  it("createPreviewRecord defaults operation-binding fields to null when not supplied", () => {
    const record = createPreviewRecord({
      preview_id: "test-002",
      checkpoint_id: "FND-FOUND-002",
      safety_class: "safe",
    });
    assert.equal(record.target_model, null);
    assert.equal(record.target_operation, null);
    assert.equal(record.intended_changes, null);
  });
});

// ---------------------------------------------------------------------------
// Test 16: Input validation
// ---------------------------------------------------------------------------

describe("computePreviews — input validation", () => {
  it("throws when checkpoints is not an array", () => {
    assert.throws(
      () => computePreviews(null, null, null, null),
      /checkpoints must be an array/
    );
  });

  it("throws when checkpoints is an object (not array)", () => {
    assert.throws(
      () => computePreviews({}, null, null, null),
      /checkpoints must be an array/
    );
  });

  it("does not throw when blockers is null (no blockers)", () => {
    const result = computePreviews([], makeValidatedCheckpoints(), null, null, null);
    assert.equal(result.previews.length, 0);
  });

  it("does not throw when validated_checkpoints is null", () => {
    const result = computePreviews([], null, null, null, null);
    assert.equal(result.previews.length, 0);
  });

  it("handles empty checkpoints array gracefully", () => {
    const result = computePreviews([], makeValidatedCheckpoints(), makeBlockers([]), null, null);
    assert.equal(result.previews.length, 0);
    assert.equal(result.engine_version, GOVERNED_PREVIEW_ENGINE_VERSION);
  });
});

// ---------------------------------------------------------------------------
// Test: Constants exported correctly
// ---------------------------------------------------------------------------

describe("governed-preview-engine — exported constants", () => {
  it("GOVERNED_PREVIEW_ENGINE_VERSION is 1.1.0 after Gate 6 addition", () => {
    assert.equal(GOVERNED_PREVIEW_ENGINE_VERSION, "1.1.0");
  });

  it("BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES includes odoosh", () => {
    assert.ok(BRANCH_TARGET_REQUIRED_DEPLOYMENT_TYPES.includes("odoosh"));
  });

  it("TARGET_CONTEXT_REQUIRED_RELEVANCE includes Executable", () => {
    assert.ok(TARGET_CONTEXT_REQUIRED_RELEVANCE.includes("Executable"));
  });
});

// ---------------------------------------------------------------------------
// Test 17: Gate 6 — operation definition required for Executable checkpoints
// ---------------------------------------------------------------------------

describe("computePreviews — Gate 6: operation definition required for Executable", () => {
  it("Executable checkpoint with matching definition produces preview with truthful operation-binding fields", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "FND-EXE-001" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = {
      "FND-EXE-001": makeOpDef("FND-EXE-001", {
        target_model: "res.partner",
        target_operation: "write",
        intended_changes: { country_id: 14 },
      }),
    };

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 1);
    const preview = result.previews[0];
    assert.equal(preview.checkpoint_id, "FND-EXE-001");
    assert.equal(preview.target_model, "res.partner");
    assert.equal(preview.target_operation, "write");
    assert.deepEqual(preview.intended_changes, { country_id: 14 });
  });

  it("Executable checkpoint with operation_definitions null produces no preview — blocked by omission", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "FND-EXE-001" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();

    // operation_definitions not supplied (defaults to null)
    const result = computePreviews(checkpoints, validated, blockers, null, target_context);

    assert.equal(result.previews.length, 0);
  });

  it("Executable checkpoint with empty operation_definitions map produces no preview", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "FND-EXE-001" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = {}; // empty — no entry for FND-EXE-001

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 0);
  });

  it("Executable checkpoint with definition for a different checkpoint_id produces no preview", () => {
    const checkpoints = [makeCheckpoint({ checkpoint_id: "FND-EXE-001" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = {
      "FND-EXE-999": makeOpDef("FND-EXE-999"), // wrong key
    };

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 0);
  });

  it("non-Executable (Informational) checkpoint is unaffected by absent operation_definitions", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-INFO-001", execution_relevance: "Informational" }),
    ];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);

    // No operation_definitions and no target_context (Informational doesn't need either)
    const result = computePreviews(checkpoints, validated, blockers, null, null);

    assert.equal(result.previews.length, 1);
    assert.equal(result.previews[0].checkpoint_id, "FND-INFO-001");
    // Operation-binding fields are null for non-Executable
    assert.equal(result.previews[0].target_model, null);
    assert.equal(result.previews[0].target_operation, null);
    assert.equal(result.previews[0].intended_changes, null);
  });

  it("mixed batch: Executable with definition previews, Executable without definition blocked, Informational unaffected", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "EXE-WITH-DEF", execution_relevance: "Executable" }),
      makeCheckpoint({ checkpoint_id: "EXE-NO-DEF", execution_relevance: "Executable" }),
      makeCheckpoint({ checkpoint_id: "INFO-NO-DEF", execution_relevance: "Informational" }),
    ];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = {
      "EXE-WITH-DEF": makeOpDef("EXE-WITH-DEF", { target_model: "stock.move", target_operation: "create" }),
    };

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    const ids = result.previews.map((p) => p.checkpoint_id);
    assert.ok(ids.includes("EXE-WITH-DEF"), "Executable with definition should produce preview");
    assert.ok(!ids.includes("EXE-NO-DEF"), "Executable without definition should be blocked");
    assert.ok(ids.includes("INFO-NO-DEF"), "Informational should be unaffected by absent definition");
    assert.equal(result.previews.length, 2);
  });

  it("Executable preview record has null operation-binding fields NOT reachable — Gate 6 ensures this", () => {
    // This test proves the invariant: if a preview record exists for an Executable checkpoint,
    // it MUST have a non-null target_model because Gate 6 blocked the no-definition case.
    const checkpoints = [makeCheckpoint({ checkpoint_id: "EXE-BOUND-001" })];
    const validated = makeValidatedCheckpoints();
    const blockers = makeBlockers([]);
    const target_context = makeOdooshTargetContext();
    const operation_definitions = {
      "EXE-BOUND-001": makeOpDef("EXE-BOUND-001", { target_model: "res.lang", target_operation: "write" }),
    };

    const result = computePreviews(checkpoints, validated, blockers, null, target_context, null, operation_definitions);

    assert.equal(result.previews.length, 1);
    const preview = result.previews[0];
    assert.ok(preview.target_model !== null, "target_model must not be null for Executable with definition");
    assert.ok(preview.target_operation !== null, "target_operation must not be null for Executable with definition");
  });
});
