// ---------------------------------------------------------------------------
// Project State Composer Tests
// Tests for: app/shared/project-state-composer.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Minimal valid project state composition
//   2.  Checkpoint state persistence and traceability
//   3.  Readiness summary persistence without recomputation
//   4.  Connection state persistence without secrets
//   5.  Target context persistence where provided
//   6.  Decision linkage persistence where provided
//   7.  Partial state does not imply readiness
//   8.  Determinism
//   9.  Contract-shape compliance
// ---------------------------------------------------------------------------

"use strict";

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  composeProjectState,
  PROJECT_STATE_COMPOSER_VERSION,
} from "../project-state-composer.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

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

function makeTargetContext(overrides = {}) {
  return {
    odoo_version:              "19",
    edition:                   "enterprise",
    deployment_type:           "odoosh",
    primary_country:           "US",
    primary_currency:          "USD",
    multi_company:             false,
    multi_currency:            false,
    odoosh_branch_target:      "main",
    odoosh_environment_type:   "production",
    connection_mode:           null,
    connection_status:         null,
    connection_target_id:      null,
    connection_capability_note: null,
    ...overrides,
  };
}

function makeCheckpoint(overrides = {}) {
  return {
    // Persisted definition fields
    checkpoint_id:                  "CP-001",
    domain:                         "foundation",
    checkpoint_name:                "Foundation Setup",
    checkpoint_class:               "Foundational",
    validation_source:              "System_Detectable",
    evidence_required:              [],
    checkpoint_owner:               null,
    deferment_allowed:              false,
    deferment_constraints:          null,
    dependencies:                   [],
    downstream_impact_summary:      null,
    guidance_required:              false,
    training_available:             false,
    execution_relevance:            null,
    preview_required:               false,
    safety_class:                   null,
    linked_decision_types:          [],
    // Persisted mutable fields
    status:                         "Not_Started",
    evidence_items:                 {},
    reviewer:                       null,
    linked_preview_ids:             [],
    linked_execution_ids:           [],
    linked_decision_ids:            [],
    last_status_transition_actor:   null,
    last_status_transition_at:      null,
    last_reviewed_at:               null,
    // Computed fields — must be stripped by composer
    blocker_flag:                   true,
    blocked_reason:                 "Dependency unmet",
    dependencies_met:               false,
    all_evidence_provided:          false,
    ...overrides,
  };
}

function makeReadinessState(overrides = {}) {
  return {
    go_live_readiness:                 "Not_Ready",
    readiness_reason:                  "2 configuration gap(s) identified.",
    incomplete_critical_checkpoints:   [{ checkpoint_id: "CP-001" }, { checkpoint_id: "CP-002" }],
    blocked_checkpoints:               [{ checkpoint_id: "CP-003" }],
    deferred_checkpoints:              [{ checkpoint_id: "CP-004" }],
    unresolved_warnings:               [{ checkpoint_id: "CP-005" }],
    training_status:                   "OK",
    recommendation_issued:             false,
    recommendation_issued_at:          null,
    recommendation_issued_by:          null,
    recommendation_withheld_reason:    "Go-live readiness not achieved.",
    ...overrides,
  };
}

function makeConnectionState(overrides = {}) {
  return {
    mode:            "application-layer",
    status:          "connected_inspect",
    capabilityLevel: "inspect",
    supported:       true,
    reason:          "",
    lastCheckedAt:   "2026-01-01T00:00:00.000Z",
    connectedAt:     "2026-01-01T00:00:00.000Z",
    environmentIdentity: {
      urlOrigin:         "https://example.odoo.com",
      database:          "test-db",
      serverVersion:     "19.0",
      serverSerie:       "19.0",
      edition:           "enterprise",
      deployment:        "odoosh",
      branchTarget:      "main",
      environmentTarget: "production",
    },
    availableFeatures: {
      inspect: true,
      preview: false,
      execute: false,
    },
    ...overrides,
  };
}

function makeActivatedDomains(overrides = {}) {
  return {
    domains: [
      {
        domain_id:                "foundation",
        activated:                true,
        excluded_reason:          null,
        priority:                 "required",
        activation_question_refs: [],
        deferral_eligible:        false,
        // Computed fields — must be stripped
        primary_stage:            "S04",
        domain_status:            "active",
        domain_visibility:        "visible",
        has_warnings:             false,
        has_deferrals:            false,
        has_blocked_golive:       false,
        has_review_pending:       false,
      },
    ],
    activation_engine_version: "1.0.0",
    activated_at:              "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Minimal valid project state composition
// ---------------------------------------------------------------------------

describe("1. minimal valid project state composition", () => {
  it("returns a non-null object with no inputs", () => {
    const state = composeProjectState();
    assert.ok(state !== null && typeof state === "object");
  });

  it("returns null for unset identity, context, and domains", () => {
    const state = composeProjectState();
    assert.strictEqual(state.project_identity, null);
    assert.strictEqual(state.target_context, null);
    assert.strictEqual(state.activated_domains, null);
    assert.strictEqual(state.discovery_answers, null);
  });

  it("returns empty arrays for checkpoints, decisions, stage_state, deferments", () => {
    const state = composeProjectState();
    assert.deepStrictEqual(state.checkpoints,  []);
    assert.deepStrictEqual(state.decisions,    []);
    assert.deepStrictEqual(state.stage_state,  []);
    assert.deepStrictEqual(state.deferments,   []);
  });

  it("updates last_modified_at when project_identity is provided", () => {
    const identity = makeProjectIdentity({ last_modified_at: "2026-01-01T00:00:00.000Z" });
    const state = composeProjectState({ project_identity: identity });
    assert.notStrictEqual(state.project_identity.last_modified_at, "2026-01-01T00:00:00.000Z");
    assert.match(state.project_identity.last_modified_at, /^\d{4}-\d{2}-\d{2}T/);
  });

  it("preserves immutable project_id and created_at from project_identity", () => {
    const identity = makeProjectIdentity();
    const state = composeProjectState({ project_identity: identity });
    assert.strictEqual(state.project_identity.project_id, identity.project_id);
    assert.strictEqual(state.project_identity.created_at, identity.created_at);
  });
});

// ---------------------------------------------------------------------------
// 2. Checkpoint state persistence and traceability
// ---------------------------------------------------------------------------

describe("2. checkpoint state persistence and traceability", () => {
  it("strips computed fields from checkpoint records", () => {
    const cp = makeCheckpoint();
    const state = composeProjectState({ checkpoints: [cp] });
    const out = state.checkpoints[0];
    assert.strictEqual(out.blocker_flag,          undefined, "blocker_flag must be stripped");
    assert.strictEqual(out.blocked_reason,         undefined, "blocked_reason must be stripped");
    assert.strictEqual(out.dependencies_met,       undefined, "dependencies_met must be stripped");
    assert.strictEqual(out.all_evidence_provided,  undefined, "all_evidence_provided must be stripped");
  });

  it("preserves all contract-defined persisted checkpoint fields", () => {
    const cp = makeCheckpoint({
      checkpoint_id:                "CP-T01",
      domain:                       "accounting",
      checkpoint_name:              "Chart of Accounts",
      checkpoint_class:             "Domain_Required",
      status:                       "In_Progress",
      evidence_items:               { coa_screenshot: { provided: true } },
      reviewer:                     "reviewer@example.com",
      last_status_transition_actor: "actor@example.com",
      last_status_transition_at:    "2026-03-01T00:00:00.000Z",
      last_reviewed_at:             "2026-03-02T00:00:00.000Z",
    });
    const state = composeProjectState({ checkpoints: [cp] });
    const out = state.checkpoints[0];

    assert.strictEqual(out.checkpoint_id,               "CP-T01");
    assert.strictEqual(out.domain,                      "accounting");
    assert.strictEqual(out.checkpoint_name,             "Chart of Accounts");
    assert.strictEqual(out.checkpoint_class,            "Domain_Required");
    assert.strictEqual(out.status,                      "In_Progress");
    assert.deepStrictEqual(out.evidence_items,          { coa_screenshot: { provided: true } });
    assert.strictEqual(out.reviewer,                    "reviewer@example.com");
    assert.strictEqual(out.last_status_transition_actor, "actor@example.com");
    assert.strictEqual(out.last_status_transition_at,   "2026-03-01T00:00:00.000Z");
    assert.strictEqual(out.last_reviewed_at,            "2026-03-02T00:00:00.000Z");
  });

  it("preserves linkage fields for traceability", () => {
    const cp = makeCheckpoint({
      checkpoint_id:       "CP-LINK",
      linked_decision_ids: ["DEC-001", "DEC-002"],
      linked_preview_ids:  ["PRV-001"],
      linked_execution_ids: ["EXE-001"],
    });
    const state = composeProjectState({ checkpoints: [cp] });
    const out = state.checkpoints[0];
    assert.deepStrictEqual(out.linked_decision_ids,   ["DEC-001", "DEC-002"]);
    assert.deepStrictEqual(out.linked_preview_ids,    ["PRV-001"]);
    assert.deepStrictEqual(out.linked_execution_ids,  ["EXE-001"]);
  });

  it("composes multiple checkpoints preserving order", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "CP-001" }),
      makeCheckpoint({ checkpoint_id: "CP-002", domain: "sales" }),
      makeCheckpoint({ checkpoint_id: "CP-003", domain: "accounting" }),
    ];
    const state = composeProjectState({ checkpoints });
    assert.strictEqual(state.checkpoints.length, 3);
    assert.strictEqual(state.checkpoints[0].checkpoint_id, "CP-001");
    assert.strictEqual(state.checkpoints[1].checkpoint_id, "CP-002");
    assert.strictEqual(state.checkpoints[2].checkpoint_id, "CP-003");
  });

  it("null field on missing checkpoint property is null, not undefined", () => {
    const cp = { checkpoint_id: "CP-MIN" }; // minimal — most fields absent
    const state = composeProjectState({ checkpoints: [cp] });
    const out = state.checkpoints[0];
    assert.strictEqual(out.checkpoint_id,    "CP-MIN");
    assert.strictEqual(out.domain,           null);
    assert.strictEqual(out.checkpoint_class, null);
    assert.strictEqual(out.status,           null);
  });
});

// ---------------------------------------------------------------------------
// 3. Readiness summary persistence without recomputation
// ---------------------------------------------------------------------------

describe("3. readiness summary persistence without recomputation", () => {
  it("persists readiness status and reason as summary", () => {
    const readiness = makeReadinessState();
    const state = composeProjectState({ readiness });
    assert.strictEqual(state.readiness_summary.go_live_readiness, "Not_Ready");
    assert.strictEqual(state.readiness_summary.readiness_reason, "2 configuration gap(s) identified.");
    assert.strictEqual(state.readiness_summary.training_status, "OK");
  });

  it("persists counts from gap arrays — not the gap records themselves", () => {
    const readiness = makeReadinessState();
    const state = composeProjectState({ readiness });
    const rs = state.readiness_summary;
    assert.strictEqual(rs.incomplete_critical_count, 2);
    assert.strictEqual(rs.blocked_count,             1);
    assert.strictEqual(rs.deferred_count,            1);
    assert.strictEqual(rs.warning_count,             1);
    // Full gap record arrays must not be persisted
    assert.strictEqual(rs.incomplete_critical_checkpoints, undefined);
    assert.strictEqual(rs.blocked_checkpoints,             undefined);
    assert.strictEqual(rs.deferred_checkpoints,            undefined);
    assert.strictEqual(rs.unresolved_warnings,             undefined);
  });

  it("persists recommendation state from input", () => {
    const readiness = makeReadinessState({
      recommendation_issued:          true,
      recommendation_issued_at:       "2026-03-01T00:00:00.000Z",
      recommendation_issued_by:       "lead@example.com",
      recommendation_withheld_reason: null,
    });
    const state = composeProjectState({ readiness });
    const rs = state.readiness_summary;
    assert.strictEqual(rs.recommendation_issued,       true);
    assert.strictEqual(rs.recommendation_issued_at,    "2026-03-01T00:00:00.000Z");
    assert.strictEqual(rs.recommendation_issued_by,    "lead@example.com");
    assert.strictEqual(rs.recommendation_withheld_reason, null);
  });

  it("readiness_summary is null when readiness not provided", () => {
    const state = composeProjectState();
    assert.strictEqual(state.readiness_summary, null);
  });

  it("readiness_summary is null for non-object readiness input", () => {
    const state = composeProjectState({ readiness: "Not_Ready" });
    assert.strictEqual(state.readiness_summary, null);
  });

  it("zero counts when readiness provided with empty gap arrays", () => {
    const readiness = makeReadinessState({
      go_live_readiness:               "Ready",
      incomplete_critical_checkpoints: [],
      blocked_checkpoints:             [],
      deferred_checkpoints:            [],
      unresolved_warnings:             [],
    });
    const state = composeProjectState({ readiness });
    const rs = state.readiness_summary;
    assert.strictEqual(rs.incomplete_critical_count, 0);
    assert.strictEqual(rs.blocked_count,             0);
    assert.strictEqual(rs.deferred_count,            0);
    assert.strictEqual(rs.warning_count,             0);
  });
});

// ---------------------------------------------------------------------------
// 4. Connection state persistence without secrets
// ---------------------------------------------------------------------------

describe("4. connection state persistence without secrets", () => {
  it("persists sanitized connection state", () => {
    const conn = makeConnectionState();
    const state = composeProjectState({ connection_state: conn });
    assert.ok(state.connection_state !== null);
    assert.strictEqual(state.connection_state.status,          "connected_inspect");
    assert.strictEqual(state.connection_state.capabilityLevel, "inspect");
    assert.strictEqual(state.connection_state.supported,       true);
  });

  it("strips password from top-level connection state", () => {
    const conn = { ...makeConnectionState(), password: "top-secret" };
    const state = composeProjectState({ connection_state: conn });
    assert.strictEqual(state.connection_state.password, undefined);
  });

  it("strips token from nested environmentIdentity", () => {
    const conn = makeConnectionState();
    conn.environmentIdentity = { ...conn.environmentIdentity, token: "bearer-abc" };
    const state = composeProjectState({ connection_state: conn });
    assert.strictEqual(state.connection_state.environmentIdentity.token, undefined);
  });

  it("strips api_key from nested environmentIdentity", () => {
    const conn = makeConnectionState();
    conn.environmentIdentity = { ...conn.environmentIdentity, api_key: "key-xyz" };
    const state = composeProjectState({ connection_state: conn });
    assert.strictEqual(state.connection_state.environmentIdentity.api_key, undefined);
  });

  it("strips secret and credential from nested objects", () => {
    const conn = {
      ...makeConnectionState(),
      auth: { secret: "shh", credential: "cred123", username: "admin" },
    };
    const state = composeProjectState({ connection_state: conn });
    assert.strictEqual(state.connection_state.auth.secret,     undefined);
    assert.strictEqual(state.connection_state.auth.credential, undefined);
    assert.strictEqual(state.connection_state.auth.username,   "admin");
  });

  it("preserves non-secret connection fields", () => {
    const conn = makeConnectionState();
    const state = composeProjectState({ connection_state: conn });
    const id = state.connection_state.environmentIdentity;
    assert.strictEqual(id.urlOrigin,         "https://example.odoo.com");
    assert.strictEqual(id.database,          "test-db");
    assert.strictEqual(id.serverSerie,       "19.0");
    assert.strictEqual(id.branchTarget,      "main");
    assert.strictEqual(id.environmentTarget, "production");
  });

  it("connection_state is null when not provided", () => {
    const state = composeProjectState();
    assert.strictEqual(state.connection_state, null);
  });

  it("connection_state is null for non-object input", () => {
    const state = composeProjectState({ connection_state: "not_connected" });
    assert.strictEqual(state.connection_state, null);
  });
});

// ---------------------------------------------------------------------------
// 5. Target context persistence where provided
// ---------------------------------------------------------------------------

describe("5. target context persistence where provided", () => {
  it("persists target_context when provided", () => {
    const tc = makeTargetContext();
    const state = composeProjectState({ target_context: tc });
    assert.strictEqual(state.target_context.edition,         "enterprise");
    assert.strictEqual(state.target_context.deployment_type, "odoosh");
    assert.strictEqual(state.target_context.odoo_version,    "19");
  });

  it("uses environment_context as fallback when target_context absent", () => {
    const ec = makeTargetContext({ edition: "community", deployment_type: "on_premise" });
    const state = composeProjectState({ environment_context: ec });
    assert.strictEqual(state.target_context.edition,         "community");
    assert.strictEqual(state.target_context.deployment_type, "on_premise");
  });

  it("target_context takes precedence over environment_context", () => {
    const tc = makeTargetContext({ edition: "enterprise" });
    const ec = makeTargetContext({ edition: "community" });
    const state = composeProjectState({ target_context: tc, environment_context: ec });
    assert.strictEqual(state.target_context.edition, "enterprise");
  });

  it("throws when target_context contains a secret field", () => {
    const tc = { ...makeTargetContext(), password: "oops" };
    assert.throws(
      () => composeProjectState({ target_context: tc }),
      /forbidden field/i
    );
  });

  it("throws when environment_context contains a secret field", () => {
    const ec = { ...makeTargetContext(), api_key: "leaked" };
    assert.throws(
      () => composeProjectState({ environment_context: ec }),
      /forbidden field/i
    );
  });

  it("target_context is null when neither input provided", () => {
    const state = composeProjectState();
    assert.strictEqual(state.target_context, null);
  });

  it("persists odoosh_branch_target and odoosh_environment_type", () => {
    const tc = makeTargetContext({
      deployment_type:         "odoosh",
      odoosh_branch_target:    "production",
      odoosh_environment_type: "production",
    });
    const state = composeProjectState({ target_context: tc });
    assert.strictEqual(state.target_context.odoosh_branch_target,    "production");
    assert.strictEqual(state.target_context.odoosh_environment_type, "production");
  });
});

// ---------------------------------------------------------------------------
// 6. Decision linkage persistence where provided
// ---------------------------------------------------------------------------

describe("6. decision linkage persistence where provided", () => {
  it("persists decision_links as decisions array", () => {
    const decisions = [
      {
        decision_id:   "DEC-001",
        decision_type: "business_policy",
        decided_by:    "owner@example.com",
        decided_at:    "2026-02-01T00:00:00.000Z",
        rationale:     "Go with standard COA",
      },
    ];
    const state = composeProjectState({ decision_links: decisions });
    assert.strictEqual(state.decisions.length, 1);
    assert.strictEqual(state.decisions[0].decision_id,   "DEC-001");
    assert.strictEqual(state.decisions[0].decision_type, "business_policy");
    assert.strictEqual(state.decisions[0].decided_by,    "owner@example.com");
    assert.strictEqual(state.decisions[0].rationale,     "Go with standard COA");
  });

  it("persists multiple decision records in order", () => {
    const decisions = [
      { decision_id: "DEC-001", decision_type: "type_a" },
      { decision_id: "DEC-002", decision_type: "type_b" },
      { decision_id: "DEC-003", decision_type: "type_c" },
    ];
    const state = composeProjectState({ decision_links: decisions });
    assert.strictEqual(state.decisions.length, 3);
    assert.strictEqual(state.decisions[0].decision_id, "DEC-001");
    assert.strictEqual(state.decisions[2].decision_id, "DEC-003");
  });

  it("decisions is empty array when not provided", () => {
    const state = composeProjectState();
    assert.deepStrictEqual(state.decisions, []);
  });

  it("decisions is empty array for null input", () => {
    const state = composeProjectState({ decision_links: null });
    assert.deepStrictEqual(state.decisions, []);
  });

  it("decision records are shallow-copied — not the same reference", () => {
    const original = { decision_id: "DEC-REF", decision_type: "policy" };
    const decisions = [original];
    const state = composeProjectState({ decision_links: decisions });
    assert.notStrictEqual(state.decisions[0], original);
    assert.strictEqual(state.decisions[0].decision_id, "DEC-REF");
  });
});

// ---------------------------------------------------------------------------
// 7. Partial state does not imply readiness
// ---------------------------------------------------------------------------

describe("7. partial state does not imply readiness", () => {
  it("readiness_summary is null when no readiness input provided", () => {
    const state = composeProjectState({
      project_identity: makeProjectIdentity(),
      target_context:   makeTargetContext(),
      checkpoints:      [makeCheckpoint({ status: "Complete" })],
    });
    assert.strictEqual(state.readiness_summary, null);
  });

  it("all-complete checkpoints with no readiness input yields null readiness_summary", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "CP-001", status: "Complete" }),
      makeCheckpoint({ checkpoint_id: "CP-002", status: "Complete" }),
      makeCheckpoint({ checkpoint_id: "CP-003", status: "Complete" }),
    ];
    const state = composeProjectState({ checkpoints });
    assert.strictEqual(state.readiness_summary, null);
  });

  it("activated_domains with no readiness input yields null readiness_summary", () => {
    const state = composeProjectState({
      activated_domains: makeActivatedDomains(),
    });
    assert.strictEqual(state.readiness_summary, null);
  });

  it("stage_state in workflow_state with no readiness input yields null readiness_summary", () => {
    const state = composeProjectState({
      workflow_state: {
        stage_state: [
          { stage_id: "S01", entry_confirmed_at: "2026-01-01T00:00:00.000Z", entry_confirmed_by: "user" },
        ],
        discovery_answers: null,
      },
    });
    assert.strictEqual(state.readiness_summary, null);
  });

  it("fully populated state without readiness has null go_live_readiness", () => {
    const state = composeProjectState({
      project_identity:  makeProjectIdentity(),
      target_context:    makeTargetContext(),
      activated_domains: makeActivatedDomains(),
      checkpoints:       [makeCheckpoint({ status: "Complete" })],
      connection_state:  makeConnectionState(),
    });
    assert.strictEqual(state.readiness_summary, null);
  });
});

// ---------------------------------------------------------------------------
// 8. Determinism
// ---------------------------------------------------------------------------

describe("8. determinism", () => {
  it("same structural inputs produce identical non-timestamp fields", () => {
    const inputs = {
      activated_domains: makeActivatedDomains(),
      checkpoints:       [makeCheckpoint({ checkpoint_id: "CP-D01", status: "In_Progress" })],
      readiness:         makeReadinessState({ go_live_readiness: "Not_Ready" }),
      connection_state:  makeConnectionState(),
      training_state:    { completed: false, modules_pending: ["sales_basics"] },
      decision_links:    [{ decision_id: "DEC-D01", decision_type: "policy" }],
      workflow_state: {
        stage_state: [{ stage_id: "S04", entry_confirmed_at: "2026-01-15T00:00:00.000Z", entry_confirmed_by: "user" }],
        discovery_answers: { answers: { "BM-01": "Products and Services" } },
        deferments: [],
      },
    };

    const s1 = composeProjectState(inputs);
    const s2 = composeProjectState(inputs);

    // Exclude call-time timestamps
    function withoutTimestamps(s) {
      const { composed_at, ...rest } = s;
      return rest;
    }

    assert.deepStrictEqual(withoutTimestamps(s1), withoutTimestamps(s2));
  });

  it("computed inputs (blockers, stage_routing, validated_checkpoints) do not affect output", () => {
    const base = { checkpoints: [makeCheckpoint()] };

    const s1 = composeProjectState({ ...base });
    const s2 = composeProjectState({
      ...base,
      blockers:             { active_blockers: [{ blocker_id: "B1" }], total_count: 1 },
      stage_routing:        { stages: [], domain_to_stage: { foundation: "S04" } },
      validated_checkpoints: { records: [{ checkpoint_id: "CP-001" }], engine_version: "1.0.0" },
    });

    function withoutTimestamps(s) {
      const { composed_at, ...rest } = s;
      return rest;
    }
    assert.deepStrictEqual(withoutTimestamps(s1), withoutTimestamps(s2));
  });

  it("same activated_domains input produces identical domain records", () => {
    const domains = makeActivatedDomains();
    const s1 = composeProjectState({ activated_domains: domains });
    const s2 = composeProjectState({ activated_domains: domains });
    assert.deepStrictEqual(s1.activated_domains.domains, s2.activated_domains.domains);
  });
});

// ---------------------------------------------------------------------------
// 9. Contract-shape compliance
// ---------------------------------------------------------------------------

describe("9. contract-shape compliance", () => {
  const REQUIRED_KEYS = [
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
    "connection_state",
    "training_state",
    "readiness_summary",
    "composer_version",
    "composed_at",
  ];

  it("output contains all required top-level keys", () => {
    const state = composeProjectState();
    for (const key of REQUIRED_KEYS) {
      assert.ok(key in state, `Missing required key: ${key}`);
    }
  });

  it("previews is always an empty array", () => {
    const state = composeProjectState();
    assert.deepStrictEqual(state.previews, []);
  });

  it("executions is always an empty array", () => {
    const state = composeProjectState();
    assert.deepStrictEqual(state.executions, []);
  });

  it("previews stays empty even when checkpoints have linked_preview_ids", () => {
    const cp = makeCheckpoint({ linked_preview_ids: ["PRV-001"] });
    const state = composeProjectState({ checkpoints: [cp] });
    assert.deepStrictEqual(state.previews, []);
  });

  it("executions stays empty even when checkpoints have linked_execution_ids", () => {
    const cp = makeCheckpoint({ linked_execution_ids: ["EXE-001"] });
    const state = composeProjectState({ checkpoints: [cp] });
    assert.deepStrictEqual(state.executions, []);
  });

  it("composer_version matches module constant", () => {
    const state = composeProjectState();
    assert.strictEqual(state.composer_version, PROJECT_STATE_COMPOSER_VERSION);
  });

  it("composed_at is a valid ISO 8601 timestamp", () => {
    const state = composeProjectState();
    assert.match(state.composed_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("computed objects (blockers, stage_routing, validated_checkpoints) are not in output", () => {
    const state = composeProjectState({
      blockers:             { active_blockers: [{ blocker_id: "B1" }] },
      stage_routing:        { stages: [], domain_to_stage: {} },
      validated_checkpoints: { records: [], engine_version: "1.0.0" },
    });
    assert.strictEqual("blockers"              in state, false, "blockers must not be persisted");
    assert.strictEqual("stage_routing"         in state, false, "stage_routing must not be persisted");
    assert.strictEqual("validated_checkpoints" in state, false, "validated_checkpoints must not be persisted");
  });

  it("activated_domains domain records have computed fields stripped", () => {
    const state = composeProjectState({ activated_domains: makeActivatedDomains() });
    const domain = state.activated_domains.domains[0];
    assert.strictEqual(domain.primary_stage,     undefined);
    assert.strictEqual(domain.domain_status,     undefined);
    assert.strictEqual(domain.domain_visibility, undefined);
    assert.strictEqual(domain.has_warnings,      undefined);
    assert.strictEqual(domain.has_deferrals,     undefined);
    assert.strictEqual(domain.has_blocked_golive, undefined);
    assert.strictEqual(domain.has_review_pending, undefined);
  });

  it("activated_domains domain records retain persisted fields", () => {
    const state = composeProjectState({ activated_domains: makeActivatedDomains() });
    const domain = state.activated_domains.domains[0];
    assert.strictEqual(domain.domain_id,   "foundation");
    assert.strictEqual(domain.activated,   true);
    assert.strictEqual(domain.priority,    "required");
  });

  it("training_state is null when not provided", () => {
    const state = composeProjectState();
    assert.strictEqual(state.training_state, null);
  });

  it("training_state is preserved when provided", () => {
    const ts = { completed: true, confirmed_by: "lead@example.com", confirmed_at: "2026-03-01T00:00:00.000Z" };
    const state = composeProjectState({ training_state: ts });
    assert.strictEqual(state.training_state.completed,     true);
    assert.strictEqual(state.training_state.confirmed_by,  "lead@example.com");
  });

  it("workflow_state.discovery_answers is persisted to discovery_answers", () => {
    const state = composeProjectState({
      workflow_state: {
        discovery_answers: {
          answers:       { "BM-01": "Products and Services" },
          answered_at:   {},
          framework_version: "1.0",
          confirmed_by:  null,
          confirmed_at:  null,
        },
        stage_state: [],
      },
    });
    assert.strictEqual(state.discovery_answers.answers["BM-01"], "Products and Services");
    assert.strictEqual(state.discovery_answers.framework_version, "1.0");
  });

  it("workflow_state.stage_state is persisted with only persisted fields", () => {
    const state = composeProjectState({
      workflow_state: {
        stage_state: [
          {
            stage_id:          "S04",
            entry_confirmed_at: "2026-01-10T00:00:00.000Z",
            entry_confirmed_by: "user@example.com",
            exit_confirmed_at:  null,
            exit_confirmed_by:  null,
            // Computed — must be stripped
            stage_status:           "active",
            entry_conditions_met:   true,
            exit_conditions_met:    false,
            has_deferrals:          false,
            has_cross_stage_blockers: false,
            parallel_active:        false,
            assigned_domains:       ["foundation"],
          },
        ],
        discovery_answers: null,
      },
    });
    const stage = state.stage_state[0];
    assert.strictEqual(stage.stage_id,           "S04");
    assert.strictEqual(stage.entry_confirmed_at, "2026-01-10T00:00:00.000Z");
    assert.strictEqual(stage.entry_confirmed_by, "user@example.com");
    // Computed fields must be absent
    assert.strictEqual(stage.stage_status,           undefined);
    assert.strictEqual(stage.entry_conditions_met,   undefined);
    assert.strictEqual(stage.exit_conditions_met,    undefined);
    assert.strictEqual(stage.has_deferrals,          undefined);
    assert.strictEqual(stage.has_cross_stage_blockers, undefined);
    assert.strictEqual(stage.parallel_active,        undefined);
    assert.strictEqual(stage.assigned_domains,       undefined);
  });
});
