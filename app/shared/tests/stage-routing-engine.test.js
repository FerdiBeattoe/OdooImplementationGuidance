// ---------------------------------------------------------------------------
// Stage Routing Engine Tests
// Tests for: app/shared/stage-routing-engine.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Correct stage order (12 stages, stage_order 1-12)
//   2.  Correct domain-to-stage mapping
//   3.  Correct checkpoint-to-stage mapping
//   4.  blocker source_stage_id derivation
//   5.  by_stage grouping population
//   6.  No duplicate stage assignment
//   7.  Determinism
//   8.  Contract-shape compliance
//   9.  Projects domain conditional (BM-01)
//   10. Input validation
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeStageRouting,
  createStageRouting,
  resolveProjectsStage,
  STAGE_DEFINITIONS,
  DOMAIN_PRIMARY_STAGE_MAP,
  STAGE_ROUTING_ENGINE_VERSION,
} from "../stage-routing-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal activated_domains object with the given domain IDs activated.
 */
function makeActivatedDomains(activeDomainIds = []) {
  const ALL_KNOWN = [
    "foundation", "users_roles", "master_data", "crm", "sales", "purchase",
    "inventory", "manufacturing", "plm", "accounting", "pos",
    "website_ecommerce", "projects", "hr", "quality", "maintenance",
    "repairs", "documents", "sign", "approvals", "subscriptions",
    "rental", "field_service",
  ];
  return {
    domains: ALL_KNOWN.map((id) => ({
      domain_id: id,
      activated: activeDomainIds.includes(id),
      excluded_reason: activeDomainIds.includes(id) ? null : "not_in_scope",
      priority: activeDomainIds.includes(id) ? "required" : null,
      activation_question_refs: [],
      deferral_eligible: false,
    })),
    activation_engine_version: "1.0.0",
    activated_at: new Date().toISOString(),
  };
}

/**
 * Builds a minimal checkpoint record.
 */
function makeCheckpoint({
  checkpoint_id = "FND-FOUND-001",
  domain = "foundation",
  checkpoint_class = "Foundational",
  validation_source = "System_Detectable",
  status = "Not_Started",
  dependencies = [],
} = {}) {
  return { checkpoint_id, domain, checkpoint_class, validation_source, status, dependencies };
}

/**
 * Builds a minimal validated_checkpoints container.
 */
function makeValidatedCheckpoints(records = []) {
  return { records, engine_version: "1.0.0", validated_at: new Date().toISOString() };
}

/**
 * Builds a minimal blockers container.
 */
function makeBlockers(activeBlockers = []) {
  return {
    active_blockers: activeBlockers,
    total_count: activeBlockers.length,
    by_severity: null,
    by_stage: null,
    by_domain: null,
    highest_priority_blocker: null,
  };
}

/**
 * Builds a minimal blocker record (source_stage_id is null — set by stage routing).
 */
function makeBlockerRecord({
  blocker_id = "FND-FOUND-001:blocker",
  source_checkpoint_id = "FND-FOUND-001",
  source_domain_id = "foundation",
  source_stage_id = null,
  blocker_type = "dependency_unmet",
  severity = "critical",
} = {}) {
  return {
    blocker_id,
    scope: "checkpoint",
    source_checkpoint_id,
    source_domain_id,
    source_stage_id,
    blocker_type,
    blocked_reason: "test blocker",
    blocking_checkpoint_id: null,
    blocking_domain_id: null,
    severity,
    created_at: new Date().toISOString(),
    resolution_action: "resolve it",
  };
}

/**
 * Builds discovery_answers with BM-01 set to the given value.
 */
function makeDiscoveryAnswers(bm01Value = null) {
  const answers = {};
  if (bm01Value !== null) answers["BM-01"] = bm01Value;
  return { answers, answered_at: {}, conditional_questions_skipped: [], framework_version: "1.0.0", confirmed_by: null, confirmed_at: null };
}

// ---------------------------------------------------------------------------
// Section 1 — createStageRouting() factory shape
// ---------------------------------------------------------------------------

describe("createStageRouting() factory", () => {
  it("returns object with all 8 required fields", () => {
    const out = createStageRouting();
    assert.ok(Object.prototype.hasOwnProperty.call(out, "stages"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "domain_to_stage"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "checkpoint_to_stage"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "checkpoints_by_stage"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "blockers_by_stage"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "enriched_active_blockers"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "engine_version"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "routed_at"));
  });

  it("defaults to empty/null state", () => {
    const out = createStageRouting();
    assert.deepEqual(out.stages, []);
    assert.deepEqual(out.enriched_active_blockers, []);
    assert.equal(out.blockers_by_stage, null);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Correct stage order
// ---------------------------------------------------------------------------

describe("Stage order", () => {
  it("STAGE_DEFINITIONS has exactly 12 entries", () => {
    assert.equal(STAGE_DEFINITIONS.length, 12);
  });

  it("stage_order runs from 1 to 12 with no gaps", () => {
    const orders = STAGE_DEFINITIONS.map((s) => s.stage_order).sort((a, b) => a - b);
    for (let i = 0; i < 12; i++) {
      assert.equal(orders[i], i + 1);
    }
  });

  it("stages are pre-sorted by stage_order ascending", () => {
    for (let i = 1; i < STAGE_DEFINITIONS.length; i++) {
      assert.ok(
        STAGE_DEFINITIONS[i].stage_order > STAGE_DEFINITIONS[i - 1].stage_order,
        `Stage at index ${i} is out of order`
      );
    }
  });

  it("computeStageRouting() stages output matches STAGE_DEFINITIONS order", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.stages.length, 12);
    for (let i = 0; i < 12; i++) {
      assert.equal(result.stages[i].stage_id,    STAGE_DEFINITIONS[i].stage_id);
      assert.equal(result.stages[i].stage_order, STAGE_DEFINITIONS[i].stage_order);
    }
  });

  it("every stage entry has stage_id, stage_name, stage_order", () => {
    const result = computeStageRouting(
      makeActivatedDomains([]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    for (const stage of result.stages) {
      assert.ok(typeof stage.stage_id    === "string" && stage.stage_id.length > 0);
      assert.ok(typeof stage.stage_name  === "string" && stage.stage_name.length > 0);
      assert.ok(typeof stage.stage_order === "number");
    }
  });

  it("known stage IDs are S01 through S12", () => {
    const ids = STAGE_DEFINITIONS.map((s) => s.stage_id);
    for (let i = 1; i <= 12; i++) {
      assert.ok(ids.includes(`S${String(i).padStart(2, "0")}`));
    }
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Correct domain-to-stage mapping
// ---------------------------------------------------------------------------

describe("Domain-to-stage mapping", () => {
  it("foundation maps to S04", () => {
    assert.equal(DOMAIN_PRIMARY_STAGE_MAP["foundation"], "S04");
  });

  it("users_roles maps to S05", () => {
    assert.equal(DOMAIN_PRIMARY_STAGE_MAP["users_roles"], "S05");
  });

  it("master_data maps to S06", () => {
    assert.equal(DOMAIN_PRIMARY_STAGE_MAP["master_data"], "S06");
  });

  it("core operations domains map to S07 (crm, sales, purchase, inventory, manufacturing, pos)", () => {
    for (const domain of ["crm", "sales", "purchase", "inventory", "manufacturing", "pos"]) {
      assert.equal(DOMAIN_PRIMARY_STAGE_MAP[domain], "S07", `${domain} should be S07`);
    }
  });

  it("accounting maps to S08", () => {
    assert.equal(DOMAIN_PRIMARY_STAGE_MAP["accounting"], "S08");
  });

  it("extended module domains map to S09", () => {
    const extended = [
      "plm", "website_ecommerce", "hr", "quality", "maintenance",
      "repairs", "documents", "sign", "approvals", "subscriptions",
      "rental", "field_service",
    ];
    for (const domain of extended) {
      assert.equal(DOMAIN_PRIMARY_STAGE_MAP[domain], "S09", `${domain} should be S09`);
    }
  });

  it("computeStageRouting domain_to_stage contains only activated domains", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "sales"]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.ok(Object.prototype.hasOwnProperty.call(result.domain_to_stage, "foundation"));
    assert.ok(Object.prototype.hasOwnProperty.call(result.domain_to_stage, "sales"));
    // crm not activated — must not appear
    assert.ok(!Object.prototype.hasOwnProperty.call(result.domain_to_stage, "crm"));
  });

  it("domain_to_stage assigns correct stages for activated domains", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "accounting", "sales"]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.domain_to_stage["foundation"],   "S04");
    assert.equal(result.domain_to_stage["users_roles"],  "S05");
    assert.equal(result.domain_to_stage["master_data"],  "S06");
    assert.equal(result.domain_to_stage["sales"],        "S07");
    assert.equal(result.domain_to_stage["accounting"],   "S08");
  });

  it("unknown domain_ids are skipped — not remapped", () => {
    const activatedDomains = {
      domains: [
        { domain_id: "foundation", activated: true, excluded_reason: null, priority: "required", activation_question_refs: [], deferral_eligible: false },
        { domain_id: "unknown_module_xyz", activated: true, excluded_reason: null, priority: "required", activation_question_refs: [], deferral_eligible: false },
      ],
      activation_engine_version: "1.0.0",
      activated_at: new Date().toISOString(),
    };
    const result = computeStageRouting(
      activatedDomains,
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.ok(Object.prototype.hasOwnProperty.call(result.domain_to_stage, "foundation"));
    assert.ok(!Object.prototype.hasOwnProperty.call(result.domain_to_stage, "unknown_module_xyz"));
  });

  it("deactivated domains do not appear in domain_to_stage", () => {
    const result = computeStageRouting(
      makeActivatedDomains([]),  // none activated
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.deepEqual(result.domain_to_stage, {});
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Projects domain conditional (BM-01)
// ---------------------------------------------------------------------------

describe("Projects domain — BM-01 conditional", () => {
  it("resolveProjectsStage returns S07 when BM-01 = Services only", () => {
    assert.equal(resolveProjectsStage(makeDiscoveryAnswers("Services only")), "S07");
  });

  it("resolveProjectsStage returns S09 when BM-01 = Products and Services", () => {
    assert.equal(resolveProjectsStage(makeDiscoveryAnswers("Products and Services")), "S09");
  });

  it("resolveProjectsStage returns S09 when BM-01 is absent", () => {
    assert.equal(resolveProjectsStage(makeDiscoveryAnswers(null)), "S09");
  });

  it("resolveProjectsStage returns S09 when discoveryAnswers is null", () => {
    assert.equal(resolveProjectsStage(null), "S09");
  });

  it("computeStageRouting maps projects to S07 when BM-01 = Services only", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["projects"]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([]),
      makeDiscoveryAnswers("Services only")
    );
    assert.equal(result.domain_to_stage["projects"], "S07");
  });

  it("computeStageRouting maps projects to S09 when BM-01 is absent", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["projects"]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
      // no discoveryAnswers
    );
    assert.equal(result.domain_to_stage["projects"], "S09");
  });

  it("computeStageRouting maps projects to S09 when BM-01 = Products", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["projects"]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([]),
      makeDiscoveryAnswers("Products")
    );
    assert.equal(result.domain_to_stage["projects"], "S09");
  });
});

// ---------------------------------------------------------------------------
// Section 5 — Correct checkpoint-to-stage mapping
// ---------------------------------------------------------------------------

describe("Checkpoint-to-stage mapping", () => {
  it("foundation checkpoint maps to S04 (domain's primary stage)", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" })],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.checkpoint_to_stage["FND-FOUND-001"], "S04");
  });

  it("sales checkpoint maps to S07", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "sales"]),
      [
        makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "SAL-FOUND-001", domain: "sales" }),
      ],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.checkpoint_to_stage["SAL-FOUND-001"], "S07");
  });

  it("accounting checkpoint maps to S08", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["accounting"]),
      [makeCheckpoint({ checkpoint_id: "ACCT-FOUND-001", domain: "accounting" })],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.checkpoint_to_stage["ACCT-FOUND-001"], "S08");
  });

  it("checkpoint in unactivated domain does not appear in checkpoint_to_stage", () => {
    // crm is NOT activated; any crm checkpoint should be excluded
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),  // crm not in list
      [
        makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "CRM-FOUND-001", domain: "crm" }),
      ],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.ok(Object.prototype.hasOwnProperty.call(result.checkpoint_to_stage, "FND-FOUND-001"));
    assert.ok(!Object.prototype.hasOwnProperty.call(result.checkpoint_to_stage, "CRM-FOUND-001"));
  });

  it("multiple checkpoints in same domain all map to same stage", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [
        makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "FND-FOUND-002", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "FND-DREQ-001", domain: "foundation" }),
      ],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.checkpoint_to_stage["FND-FOUND-001"], "S04");
    assert.equal(result.checkpoint_to_stage["FND-FOUND-002"], "S04");
    assert.equal(result.checkpoint_to_stage["FND-DREQ-001"],  "S04");
  });

  it("checkpoints_by_stage groups checkpoint_ids under correct stage", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "sales"]),
      [
        makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "FND-FOUND-002", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "SAL-FOUND-001", domain: "sales" }),
      ],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.ok(Array.isArray(result.checkpoints_by_stage["S04"]));
    assert.ok(result.checkpoints_by_stage["S04"].includes("FND-FOUND-001"));
    assert.ok(result.checkpoints_by_stage["S04"].includes("FND-FOUND-002"));
    assert.ok(Array.isArray(result.checkpoints_by_stage["S07"]));
    assert.ok(result.checkpoints_by_stage["S07"].includes("SAL-FOUND-001"));
  });

  it("checkpoints_by_stage lists are sorted lexicographically", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [
        makeCheckpoint({ checkpoint_id: "FND-FOUND-002", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "FND-DREQ-001", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
      ],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    const s04 = result.checkpoints_by_stage["S04"];
    const sorted = [...s04].sort();
    assert.deepEqual(s04, sorted);
  });
});

// ---------------------------------------------------------------------------
// Section 6 — Blocker source_stage_id derivation
// ---------------------------------------------------------------------------

describe("Blocker source_stage_id derivation", () => {
  it("blocker for foundation checkpoint gets source_stage_id = S04", () => {
    const cp = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" });
    const blocker = makeBlockerRecord({ source_checkpoint_id: "FND-FOUND-001", source_domain_id: "foundation" });
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [cp],
      makeValidatedCheckpoints([]),
      makeBlockers([blocker])
    );
    assert.equal(result.enriched_active_blockers.length, 1);
    assert.equal(result.enriched_active_blockers[0].source_stage_id, "S04");
  });

  it("blocker for sales checkpoint gets source_stage_id = S07", () => {
    const cp = makeCheckpoint({ checkpoint_id: "SAL-DREQ-001", domain: "sales" });
    const blocker = makeBlockerRecord({ blocker_id: "SAL-DREQ-001:blocker", source_checkpoint_id: "SAL-DREQ-001", source_domain_id: "sales" });
    const result = computeStageRouting(
      makeActivatedDomains(["sales"]),
      [cp],
      makeValidatedCheckpoints([]),
      makeBlockers([blocker])
    );
    assert.equal(result.enriched_active_blockers[0].source_stage_id, "S07");
  });

  it("blocker for accounting checkpoint gets source_stage_id = S08", () => {
    const cp = makeCheckpoint({ checkpoint_id: "ACCT-FOUND-001", domain: "accounting" });
    const blocker = makeBlockerRecord({ blocker_id: "ACCT-FOUND-001:blocker", source_checkpoint_id: "ACCT-FOUND-001", source_domain_id: "accounting" });
    const result = computeStageRouting(
      makeActivatedDomains(["accounting"]),
      [cp],
      makeValidatedCheckpoints([]),
      makeBlockers([blocker])
    );
    assert.equal(result.enriched_active_blockers[0].source_stage_id, "S08");
  });

  it("blocker for checkpoint not in checkpoints array gets source_stage_id = null", () => {
    // Blocker refers to a checkpoint not in the checkpoints array
    const blocker = makeBlockerRecord({ source_checkpoint_id: "ORPHAN-001" });
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [],  // no checkpoints
      makeValidatedCheckpoints([]),
      makeBlockers([blocker])
    );
    assert.equal(result.enriched_active_blockers[0].source_stage_id, null);
  });

  it("enriched blockers preserve all original blocker fields", () => {
    const cp = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" });
    const original = makeBlockerRecord({
      blocker_id: "FND-FOUND-001:blocker",
      source_checkpoint_id: "FND-FOUND-001",
      source_domain_id: "foundation",
      blocker_type: "dependency_unmet",
      severity: "critical",
    });
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [cp],
      makeValidatedCheckpoints([]),
      makeBlockers([original])
    );
    const enriched = result.enriched_active_blockers[0];
    assert.equal(enriched.blocker_id,           original.blocker_id);
    assert.equal(enriched.source_checkpoint_id, original.source_checkpoint_id);
    assert.equal(enriched.source_domain_id,     original.source_domain_id);
    assert.equal(enriched.blocker_type,         original.blocker_type);
    assert.equal(enriched.severity,             original.severity);
    // source_stage_id is now populated
    assert.equal(enriched.source_stage_id, "S04");
  });

  it("original blocker records in input are not mutated", () => {
    const cp = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" });
    const original = makeBlockerRecord({ source_checkpoint_id: "FND-FOUND-001", source_domain_id: "foundation" });
    const originalStageId = original.source_stage_id;

    computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [cp],
      makeValidatedCheckpoints([]),
      makeBlockers([original])
    );

    // Input object must not have been mutated
    assert.equal(original.source_stage_id, originalStageId);
  });
});

// ---------------------------------------------------------------------------
// Section 7 — by_stage grouping population
// ---------------------------------------------------------------------------

describe("by_stage grouping population (blockers_by_stage)", () => {
  it("blockers_by_stage is null when no blockers exist", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation"]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.blockers_by_stage, null);
  });

  it("blockers_by_stage counts blockers per stage", () => {
    const cp1 = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" });
    const cp2 = makeCheckpoint({ checkpoint_id: "FND-FOUND-002", domain: "foundation" });
    const cp3 = makeCheckpoint({ checkpoint_id: "SAL-FOUND-001", domain: "sales" });
    const b1 = makeBlockerRecord({ blocker_id: "FND-FOUND-001:blocker", source_checkpoint_id: "FND-FOUND-001" });
    const b2 = makeBlockerRecord({ blocker_id: "FND-FOUND-002:blocker", source_checkpoint_id: "FND-FOUND-002" });
    const b3 = makeBlockerRecord({ blocker_id: "SAL-FOUND-001:blocker",  source_checkpoint_id: "SAL-FOUND-001" });
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "sales"]),
      [cp1, cp2, cp3],
      makeValidatedCheckpoints([]),
      makeBlockers([b1, b2, b3])
    );
    assert.ok(result.blockers_by_stage !== null);
    assert.equal(result.blockers_by_stage["S04"], 2);
    assert.equal(result.blockers_by_stage["S07"], 1);
  });

  it("blockers_by_stage only contains stages that have blockers", () => {
    const cp = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" });
    const blocker = makeBlockerRecord({ source_checkpoint_id: "FND-FOUND-001" });
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "sales"]),
      [cp],
      makeValidatedCheckpoints([]),
      makeBlockers([blocker])
    );
    assert.ok(Object.prototype.hasOwnProperty.call(result.blockers_by_stage, "S04"));
    assert.ok(!Object.prototype.hasOwnProperty.call(result.blockers_by_stage, "S07"));
  });
});

// ---------------------------------------------------------------------------
// Section 8 — No duplicate stage assignment
// ---------------------------------------------------------------------------

describe("No duplicate stage assignment", () => {
  it("each domain_id appears at most once in domain_to_stage", () => {
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "sales", "accounting"]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    const keys = Object.keys(result.domain_to_stage);
    const unique = new Set(keys);
    assert.equal(unique.size, keys.length);
  });

  it("each checkpoint_id appears at most once in checkpoint_to_stage", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-002", domain: "foundation" }),
      makeCheckpoint({ checkpoint_id: "SAL-FOUND-001", domain: "sales" }),
    ];
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "sales"]),
      checkpoints,
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    const keys = Object.keys(result.checkpoint_to_stage);
    const unique = new Set(keys);
    assert.equal(unique.size, keys.length);
  });

  it("a checkpoint_id appears in checkpoints_by_stage exactly once across all stages", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
      makeCheckpoint({ checkpoint_id: "SAL-FOUND-001", domain: "sales" }),
    ];
    const result = computeStageRouting(
      makeActivatedDomains(["foundation", "sales"]),
      checkpoints,
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    const allIds = [];
    for (const ids of Object.values(result.checkpoints_by_stage)) {
      allIds.push(...ids);
    }
    const unique = new Set(allIds);
    assert.equal(unique.size, allIds.length);
    assert.equal(allIds.length, checkpoints.length);
  });
});

// ---------------------------------------------------------------------------
// Section 9 — Determinism
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("identical inputs produce identical domain_to_stage and checkpoint_to_stage", () => {
    const inputs = [
      makeActivatedDomains(["foundation", "sales", "accounting"]),
      [
        makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
        makeCheckpoint({ checkpoint_id: "SAL-FOUND-001", domain: "sales" }),
        makeCheckpoint({ checkpoint_id: "ACCT-FOUND-001", domain: "accounting" }),
      ],
      makeValidatedCheckpoints([]),
      makeBlockers([]),
    ];

    const r1 = computeStageRouting(...inputs);
    const r2 = computeStageRouting(...inputs);

    assert.deepEqual(r1.domain_to_stage,     r2.domain_to_stage);
    assert.deepEqual(r1.checkpoint_to_stage, r2.checkpoint_to_stage);
    assert.deepEqual(r1.checkpoints_by_stage, r2.checkpoints_by_stage);
    assert.equal(r1.stages.length, r2.stages.length);
    for (let i = 0; i < r1.stages.length; i++) {
      assert.equal(r1.stages[i].stage_id,    r2.stages[i].stage_id);
      assert.equal(r1.stages[i].stage_order, r2.stages[i].stage_order);
    }
  });

  it("checkpoints_by_stage lists are identical across two calls with same input", () => {
    const checkpoints = [
      makeCheckpoint({ checkpoint_id: "FND-FOUND-002", domain: "foundation" }),
      makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" }),
    ];
    const activated = makeActivatedDomains(["foundation"]);
    const r1 = computeStageRouting(activated, checkpoints, makeValidatedCheckpoints([]), makeBlockers([]));
    const r2 = computeStageRouting(activated, checkpoints, makeValidatedCheckpoints([]), makeBlockers([]));
    assert.deepEqual(r1.checkpoints_by_stage, r2.checkpoints_by_stage);
  });

  it("blockers_by_stage is identical across two calls with same blockers input", () => {
    const cp = makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" });
    const blocker = makeBlockerRecord({ source_checkpoint_id: "FND-FOUND-001" });
    const activated = makeActivatedDomains(["foundation"]);
    const r1 = computeStageRouting(activated, [cp], makeValidatedCheckpoints([]), makeBlockers([blocker]));
    const r2 = computeStageRouting(activated, [cp], makeValidatedCheckpoints([]), makeBlockers([blocker]));
    assert.deepEqual(r1.blockers_by_stage, r2.blockers_by_stage);
  });

  it("adding an unactivated domain does not affect existing mappings", () => {
    const base = makeActivatedDomains(["foundation"]);
    const withExtra = makeActivatedDomains(["foundation"]);
    // both are the same activated set; crm remains not activated
    const checkpoints = [makeCheckpoint({ checkpoint_id: "FND-FOUND-001", domain: "foundation" })];
    const r1 = computeStageRouting(base,      checkpoints, makeValidatedCheckpoints([]), makeBlockers([]));
    const r2 = computeStageRouting(withExtra, checkpoints, makeValidatedCheckpoints([]), makeBlockers([]));
    assert.deepEqual(r1.domain_to_stage,     r2.domain_to_stage);
    assert.deepEqual(r1.checkpoint_to_stage, r2.checkpoint_to_stage);
  });
});

// ---------------------------------------------------------------------------
// Section 10 — Contract-shape compliance
// ---------------------------------------------------------------------------

describe("Contract-shape compliance", () => {
  it("output has exactly the 8 governed fields", () => {
    const result = computeStageRouting(
      makeActivatedDomains([]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    const expected = [
      "stages",
      "domain_to_stage",
      "checkpoint_to_stage",
      "checkpoints_by_stage",
      "blockers_by_stage",
      "enriched_active_blockers",
      "engine_version",
      "routed_at",
    ].sort();
    assert.deepEqual(Object.keys(result).sort(), expected);
  });

  it("engine_version matches STAGE_ROUTING_ENGINE_VERSION", () => {
    const result = computeStageRouting(
      makeActivatedDomains([]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.engine_version, STAGE_ROUTING_ENGINE_VERSION);
  });

  it("routed_at is a valid ISO 8601 string", () => {
    const result = computeStageRouting(
      makeActivatedDomains([]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.ok(typeof result.routed_at === "string");
    assert.ok(!isNaN(Date.parse(result.routed_at)));
  });

  it("stages array entries each have stage_id, stage_name, stage_order", () => {
    const result = computeStageRouting(
      makeActivatedDomains([]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    for (const stage of result.stages) {
      assert.ok(Object.prototype.hasOwnProperty.call(stage, "stage_id"));
      assert.ok(Object.prototype.hasOwnProperty.call(stage, "stage_name"));
      assert.ok(Object.prototype.hasOwnProperty.call(stage, "stage_order"));
    }
  });

  it("enriched_active_blockers is always an array", () => {
    const result = computeStageRouting(
      makeActivatedDomains([]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.ok(Array.isArray(result.enriched_active_blockers));
  });

  it("does not contain readiness, deferment, or preview fields", () => {
    const result = computeStageRouting(
      makeActivatedDomains([]),
      [],
      makeValidatedCheckpoints([]),
      makeBlockers([])
    );
    assert.equal(result.go_live_readiness,  undefined);
    assert.equal(result.readiness_state,    undefined);
    assert.equal(result.deferments,         undefined);
    assert.equal(result.previews,           undefined);
    assert.equal(result.executions,         undefined);
    assert.equal(result.next_action,        undefined);
    assert.equal(result.resume_context,     undefined);
  });
});

// ---------------------------------------------------------------------------
// Section 11 — Input validation
// ---------------------------------------------------------------------------

describe("computeStageRouting() — input validation", () => {
  it("throws if activatedDomains is null", () => {
    assert.throws(
      () => computeStageRouting(null, [], makeValidatedCheckpoints([]), makeBlockers([])),
      /activatedDomains must be an object/
    );
  });

  it("throws if checkpoints is not an array", () => {
    assert.throws(
      () => computeStageRouting(makeActivatedDomains([]), null, makeValidatedCheckpoints([]), makeBlockers([])),
      /checkpoints must be an array/
    );
  });

  it("throws if validatedCheckpoints is null", () => {
    assert.throws(
      () => computeStageRouting(makeActivatedDomains([]), [], null, makeBlockers([])),
      /validatedCheckpoints must be an object/
    );
  });

  it("throws if validatedCheckpoints.records is not an array", () => {
    assert.throws(
      () => computeStageRouting(makeActivatedDomains([]), [], { records: null }, makeBlockers([])),
      /validatedCheckpoints must be an object/
    );
  });

  it("throws if blockers is null", () => {
    assert.throws(
      () => computeStageRouting(makeActivatedDomains([]), [], makeValidatedCheckpoints([]), null),
      /blockers must be an object/
    );
  });

  it("throws if blockers.active_blockers is not an array", () => {
    assert.throws(
      () => computeStageRouting(makeActivatedDomains([]), [], makeValidatedCheckpoints([]), { active_blockers: null }),
      /blockers must be an object/
    );
  });
});
