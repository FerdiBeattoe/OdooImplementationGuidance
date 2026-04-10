// ---------------------------------------------------------------------------
// Checkpoint Engine Tests
// Tests for: app/shared/checkpoint-engine.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1. Unconditional checkpoints are generated for activated domains
//   2. Conditional checkpoints are NOT generated when trigger answer is missing
//   3. Conditional checkpoints ARE generated when trigger answer is present
//   4. Checkpoints are NOT generated for domains where activated === false
//   5. Cross-domain dependencies stored as arrays of strings (not evaluated)
//   6. Output shape matches createCheckpoints() and createCheckpointRecord()
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeCheckpoints,
  createCheckpoints,
  createCheckpointRecord,
  CHECKPOINT_ENGINE_VERSION,
  CHECKPOINT_IDS,
} from "../checkpoint-engine.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal activatedDomains object with only the named domains
 * set to activated = true.
 */
function makeActivatedDomains(activeDomainIds = []) {
  const ALL_KNOWN = [
    "foundation", "users_roles", "master_data", "crm", "sales", "purchase",
    "inventory", "manufacturing", "plm", "accounting", "pos",
    "website_ecommerce", "projects", "hr", "quality", "maintenance",
    "repairs", "documents", "sign", "approvals", "subscriptions",
    "rental", "field_service",
  ];

  const domains = ALL_KNOWN.map((id) => ({
    domain_id: id,
    activated: activeDomainIds.includes(id),
    excluded_reason: activeDomainIds.includes(id) ? null : "not_in_scope",
    priority: activeDomainIds.includes(id) ? "required" : null,
    activation_question_refs: [],
    deferral_eligible: false,
  }));

  return {
    domains,
    activation_engine_version: "1.0.0",
    activated_at: new Date().toISOString(),
  };
}

/**
 * Builds a minimal discoveryAnswers object.
 */
function makeDiscoveryAnswers(answersMap = {}) {
  return {
    answers: answersMap,
    answered_at: {},
    conditional_questions_skipped: [],
    framework_version: "1.0.0",
    confirmed_by: null,
    confirmed_at: null,
  };
}

const PI02_NO_APPROVAL = "No approval required - purchasers can confirm freely";
const PI02_THRESHOLD = "Approval required above a monetary threshold";
const PI02_ALL_ORDERS = "All purchase orders require manager approval";

/**
 * Returns the record with the given checkpoint_id from the result, or null.
 */
function findRecord(result, checkpointId) {
  return result.records.find((r) => r.checkpoint_id === checkpointId) ?? null;
}

// ---------------------------------------------------------------------------
// Section 1 — Output container shape (createCheckpoints contract)
// ---------------------------------------------------------------------------

describe("createCheckpoints() factory", () => {
  it("returns object with records, engine_version, generated_at", () => {
    const out = createCheckpoints({ records: [], engine_version: "1.0.0", generated_at: "2026-01-01T00:00:00.000Z" });
    assert.ok(Object.prototype.hasOwnProperty.call(out, "records"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "engine_version"));
    assert.ok(Object.prototype.hasOwnProperty.call(out, "generated_at"));
    assert.deepEqual(out.records, []);
    assert.equal(out.engine_version, "1.0.0");
  });

  it("defaults records to empty array when not provided", () => {
    const out = createCheckpoints();
    assert.deepEqual(out.records, []);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — createCheckpointRecord() shape compliance
// ---------------------------------------------------------------------------

describe("createCheckpointRecord() factory", () => {
  it("returns exactly the 10 governed fields", () => {
    const rec = createCheckpointRecord({
      checkpoint_id: "FND-FOUND-001",
      domain: "foundation",
      checkpoint_class: "Foundational",
      validation_source: "Both",
      execution_relevance: "Executable",
      safety_class: "Safe",
      dependencies: [],
    });

    const keys = Object.keys(rec).sort();
    const expected = [
      "checkpoint_id",
      "checkpoint_class",
      "dependencies",
      "domain",
      "execution_relevance",
      "safety_class",
      "status",
      "validation_source",
      "preview_required",
      "downstream_impact_summary",
    ].sort();

    assert.deepEqual(keys, expected);
  });

  it("sets status to Not_Started by default", () => {
    const rec = createCheckpointRecord({ checkpoint_id: "X", domain: "foundation" });
    assert.equal(rec.status, "Not_Started");
  });

  it("stores dependencies as a copy of the input array", () => {
    const deps = ["FND-FOUND-001", "FND-FOUND-002"];
    const rec = createCheckpointRecord({ dependencies: deps });
    assert.deepEqual(rec.dependencies, deps);
    // Mutation of original should not affect record
    deps.push("EXTRA");
    assert.equal(rec.dependencies.length, 2);
  });

  it("defaults dependencies to empty array when not provided", () => {
    const rec = createCheckpointRecord({ checkpoint_id: "X" });
    assert.deepEqual(rec.dependencies, []);
  });

  it("sets preview_required = true when execution_relevance = Executable", () => {
    const rec = createCheckpointRecord({ execution_relevance: "Executable" });
    assert.equal(rec.preview_required, true);
  });

  it("sets preview_required = false when execution_relevance = Informational", () => {
    const rec = createCheckpointRecord({ execution_relevance: "Informational" });
    assert.equal(rec.preview_required, false);
  });

  it("sets preview_required = false when execution_relevance = None", () => {
    const rec = createCheckpointRecord({ execution_relevance: "None" });
    assert.equal(rec.preview_required, false);
  });

  it("sets preview_required = false when execution_relevance is absent", () => {
    const rec = createCheckpointRecord({});
    assert.equal(rec.preview_required, false);
  });

  it("defaults downstream_impact_summary to null when not provided", () => {
    const rec = createCheckpointRecord({ execution_relevance: "Executable" });
    assert.equal(rec.downstream_impact_summary, null);
  });

  it("passes downstream_impact_summary through when provided", () => {
    const rec = createCheckpointRecord({
      execution_relevance: "Executable",
      downstream_impact_summary: "Creates 3 product records in Odoo",
    });
    assert.equal(rec.downstream_impact_summary, "Creates 3 product records in Odoo");
  });
});

// ---------------------------------------------------------------------------
// Section 3 — computeCheckpoints() output shape
// ---------------------------------------------------------------------------

describe("computeCheckpoints() — output container shape", () => {
  it("returns createCheckpoints() shape with engine_version and generated_at", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );

    assert.ok(Object.prototype.hasOwnProperty.call(result, "records"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "engine_version"));
    assert.ok(Object.prototype.hasOwnProperty.call(result, "generated_at"));
    assert.equal(result.engine_version, CHECKPOINT_ENGINE_VERSION);
    assert.ok(typeof result.generated_at === "string");
    assert.ok(Array.isArray(result.records));
  });

  it("every record has exactly the 10 governed fields", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );

    const REQUIRED_FIELDS = new Set([
      "checkpoint_id",
      "domain",
      "checkpoint_class",
      "validation_source",
      "status",
      "execution_relevance",
      "safety_class",
      "dependencies",
      "preview_required",
      "downstream_impact_summary",
    ]);

    for (const record of result.records) {
      const keys = new Set(Object.keys(record));
      for (const field of REQUIRED_FIELDS) {
        assert.ok(keys.has(field), `Record ${record.checkpoint_id} missing field: ${field}`);
      }
      assert.equal(keys.size, REQUIRED_FIELDS.size,
        `Record ${record.checkpoint_id} has extra fields: ${[...keys].filter(k => !REQUIRED_FIELDS.has(k)).join(", ")}`
      );
    }
  });

  it("Executable records have preview_required = true, non-Executable have preview_required = false", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );

    for (const record of result.records) {
      if (record.execution_relevance === "Executable") {
        assert.equal(record.preview_required, true,
          `Executable record ${record.checkpoint_id} must have preview_required = true`);
      } else {
        assert.equal(record.preview_required, false,
          `Non-Executable record ${record.checkpoint_id} must have preview_required = false`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Unconditional checkpoints generated for activated domains
// ---------------------------------------------------------------------------

describe("Unconditional checkpoints — activated domains", () => {
  it("generates FND-FOUND-001 through FND-DREQ-002 for foundation (always activated)", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({})
    );

    const unconditionalIds = [
      CHECKPOINT_IDS.FND_FOUND_001,
      CHECKPOINT_IDS.FND_FOUND_002,
      CHECKPOINT_IDS.FND_FOUND_003,
      CHECKPOINT_IDS.FND_FOUND_004,
      CHECKPOINT_IDS.FND_FOUND_005,
      CHECKPOINT_IDS.FND_DREQ_001,
      CHECKPOINT_IDS.FND_DREQ_002,
    ];

    for (const id of unconditionalIds) {
      assert.ok(findRecord(result, id) !== null, `Expected ${id} to be generated`);
    }
  });

  it("generates USR-FOUND-001, USR-FOUND-002, USR-DREQ-001..003 for users_roles", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({})
    );

    const unconditionalIds = [
      CHECKPOINT_IDS.USR_FOUND_001,
      CHECKPOINT_IDS.USR_FOUND_002,
      CHECKPOINT_IDS.USR_DREQ_001,
      CHECKPOINT_IDS.USR_DREQ_002,
      CHECKPOINT_IDS.USR_DREQ_003,
    ];

    for (const id of unconditionalIds) {
      assert.ok(findRecord(result, id) !== null, `Expected ${id} to be generated`);
    }
  });

  it("generates MAS-FOUND-001, MAS-FOUND-002, MAS-DREQ-001..004 for master_data", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );

    const unconditionalIds = [
      CHECKPOINT_IDS.MAS_FOUND_001,
      CHECKPOINT_IDS.MAS_FOUND_002,
      CHECKPOINT_IDS.MAS_DREQ_001,
      CHECKPOINT_IDS.MAS_DREQ_002,
      CHECKPOINT_IDS.MAS_DREQ_003,
      CHECKPOINT_IDS.MAS_DREQ_004,
    ];

    for (const id of unconditionalIds) {
      assert.ok(findRecord(result, id) !== null, `Expected ${id} to be generated`);
    }
  });

  it("MAS-DREQ-001 is Domain_Required / User_Confirmed / Informational / Not_Applicable (DL-013)", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, CHECKPOINT_IDS.MAS_DREQ_001);
    assert.ok(rec, "MAS-DREQ-001 must be generated");
    assert.equal(rec.checkpoint_class, "Domain_Required",
      "MAS-DREQ-001 checkpoint_class must remain Domain_Required");
    assert.equal(rec.validation_source, "User_Confirmed",
      "MAS-DREQ-001 validation_source must be User_Confirmed after reclassification");
    assert.equal(rec.execution_relevance, "Informational",
      "MAS-DREQ-001 execution_relevance must be Informational after reclassification");
    assert.equal(rec.safety_class, "Not_Applicable",
      "MAS-DREQ-001 safety_class must be Not_Applicable after reclassification");
  });

  it("MAS-DREQ-003 is Domain_Required / User_Confirmed / Informational / Not_Applicable (DL-015)", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, CHECKPOINT_IDS.MAS_DREQ_003);
    assert.ok(rec, "MAS-DREQ-003 must be generated");
    assert.equal(rec.checkpoint_class, "Domain_Required",
      "MAS-DREQ-003 checkpoint_class must remain Domain_Required");
    assert.equal(rec.validation_source, "User_Confirmed",
      "MAS-DREQ-003 validation_source must be User_Confirmed after reclassification");
    assert.equal(rec.execution_relevance, "Informational",
      "MAS-DREQ-003 execution_relevance must be Informational after reclassification");
    assert.equal(rec.safety_class, "Not_Applicable",
      "MAS-DREQ-003 safety_class must be Not_Applicable after reclassification");
  });

  it("all unconditional foundation records have status = Not_Started", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({})
    );

    for (const record of result.records) {
      assert.equal(record.status, "Not_Started",
        `${record.checkpoint_id} should have status Not_Started`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Section 5 — Conditional checkpoints NOT generated when answer is missing
// ---------------------------------------------------------------------------

describe("Conditional checkpoints — missing trigger answer", () => {
  it("does NOT generate FND-FOUND-006 when BM-02 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({}) // BM-02 absent
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.FND_FOUND_006), null);
  });

  it("does NOT generate FND-DREQ-003 when BM-04 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.FND_DREQ_003), null);
  });

  it("does NOT generate FND-DREQ-004 when FC-04 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.FND_DREQ_004), null);
  });

  it("does NOT generate USR-DREQ-004 when TA-02 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.USR_DREQ_004), null);
  });

  it("does NOT generate USR-DREQ-006 when BM-05 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.USR_DREQ_006), null);
  });

  it("does NOT generate USR-DREQ-007 (sales approver) when SC-02 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.USR_DREQ_007), null);
  });

  it("does NOT generate MAS-DREQ-005 when OP-01 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.MAS_DREQ_005), null);
  });

  it("does NOT generate MAS-DREQ-006 when MF-01 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.MAS_DREQ_006), null);
  });

  it("does NOT generate ACCT-DREQ-005 (multi-currency journals) when BM-04 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "accounting"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.ACCT_DREQ_005), null);
  });

  it("does NOT generate INV-DREQ-003 when OP-02 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "inventory"]),
      makeDiscoveryAnswers({ "OP-01": "Yes" }) // OP-02 absent
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.INV_DREQ_003), null);
  });

  it("does NOT generate CRM-DREQ-004 when TA-02 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "crm"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.CRM_DREQ_004), null);
  });

  it("does NOT generate QUA-DREQ-001 when MF-06 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains([
        "foundation", "users_roles", "master_data", "inventory",
        "manufacturing", "quality"
      ]),
      makeDiscoveryAnswers({ "MF-01": "Yes", "OP-01": "Yes" })
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.QUA_DREQ_001), null);
  });

  it("does NOT generate APR-DREQ-003 when TA-03 does not include Inventory adjustments", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "approvals"]),
      makeDiscoveryAnswers({ "TA-03": ["Expenses"] }) // no Inventory adjustments
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.APR_DREQ_003), null);
  });

  it("does NOT generate USR-DREQ-008 (purchase approver) when PI-02 is missing", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({})
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.USR_DREQ_008), null);
  });

  it("does NOT generate USR-DREQ-008 when PI-02 = No approval", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "PI-02": PI02_NO_APPROVAL })
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.USR_DREQ_008), null);
  });

  it("does NOT generate USR-DREQ-008 when PI-02 short label is No approval", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "PI-02": "No approval" })
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.USR_DREQ_008), null);
  });
});

// ---------------------------------------------------------------------------
// Section 6 — Conditional checkpoints ARE generated when trigger answer present
// ---------------------------------------------------------------------------

describe("Conditional checkpoints — trigger answer present", () => {
  it("generates FND-FOUND-006 when BM-02 = Yes", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({ "BM-02": "Yes" })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.FND_FOUND_006);
    assert.ok(rec !== null, "FND-FOUND-006 should be generated when BM-02 = Yes");
    assert.equal(rec.domain, "foundation");
    assert.equal(rec.checkpoint_class, "Foundational");
  });

  it("generates FND-DREQ-003 when BM-04 = Yes", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({ "BM-04": "Yes" })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.FND_DREQ_003);
    assert.ok(rec !== null);
    assert.equal(rec.checkpoint_class, "Domain_Required");
  });

  it("generates FND-DREQ-004 when FC-04 = Yes", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({ "FC-04": "Yes" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.FND_DREQ_004) !== null);
  });

  it("generates USR-DREQ-005 (cross-company) when BM-02 = Yes", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "BM-02": "Yes" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.USR_DREQ_005) !== null);
  });

  it("generates USR-DREQ-006 (SoD) when BM-05 = 51", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "BM-05": 51 })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.USR_DREQ_006) !== null);
  });

  it("does NOT generate USR-DREQ-006 when BM-05 = 50 (boundary)", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "BM-05": 50 })
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.USR_DREQ_006), null);
  });

  it("generates USR-DREQ-007 when SC-02 = Yes", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "SC-02": "Yes" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.USR_DREQ_007) !== null);
  });

  it("generates USR-DREQ-008 when PI-02 = Threshold", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "PI-02": PI02_THRESHOLD })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.USR_DREQ_008) !== null);
  });

  it("generates USR-DREQ-008 when PI-02 short label is Threshold", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "PI-02": "Threshold" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.USR_DREQ_008) !== null);
  });

  it("generates USR-DREQ-008 when PI-02 = All orders", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "PI-02": PI02_ALL_ORDERS })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.USR_DREQ_008) !== null);
  });

  it("generates USR-DREQ-008 when PI-02 short label is All orders", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({ "PI-02": "All orders" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.USR_DREQ_008) !== null);
  });

  it("generates MAS-DREQ-005 when OP-01 = Yes", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({ "OP-01": "Yes" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.MAS_DREQ_005) !== null);
  });

  it("generates MAS-DREQ-006 when MF-01 = Yes", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({ "MF-01": "Yes" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.MAS_DREQ_006) !== null);
  });

  it("generates MAS-DREQ-007 when PI-04 = Lot tracking", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({ "PI-04": "Lot tracking" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.MAS_DREQ_007) !== null);
  });

  it("does NOT generate MAS-DREQ-007 when PI-04 = None", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({ "PI-04": "None" })
    );
    assert.equal(findRecord(result, CHECKPOINT_IDS.MAS_DREQ_007), null);
  });

  it("generates ACCT-DREQ-005 when BM-04 = Yes and accounting is activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "accounting"]),
      makeDiscoveryAnswers({ "BM-04": "Yes" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.ACCT_DREQ_005) !== null);
  });

  it("generates ACCT-DREQ-006 when FC-02 = AVCO", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "accounting"]),
      makeDiscoveryAnswers({ "FC-02": "AVCO" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.ACCT_DREQ_006) !== null);
  });

  it("generates ACCT-DREQ-006 when FC-02 = FIFO", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "accounting"]),
      makeDiscoveryAnswers({ "FC-02": "FIFO" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.ACCT_DREQ_006) !== null);
  });

  it("generates ACCT-DREQ-007 when FC-02 = Standard Price", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "accounting"]),
      makeDiscoveryAnswers({ "FC-02": "Standard Price" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.ACCT_DREQ_007) !== null);
  });

  it("generates ACCT-REC-001 when FC-05 = Yes", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "accounting"]),
      makeDiscoveryAnswers({ "FC-05": "Yes" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.ACCT_REC_001) !== null);
  });

  it("generates ACCT-REC-002 when FC-01 = Full accounting", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "accounting"]),
      makeDiscoveryAnswers({ "FC-01": "Full accounting" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.ACCT_REC_002) !== null);
  });

  it("generates INV-DREQ-003 when OP-02 = 2", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "inventory"]),
      makeDiscoveryAnswers({ "OP-01": "Yes", "OP-02": 2 })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.INV_DREQ_003) !== null);
  });

  it("generates INV-DREQ-007 when FC-02 = AVCO and inventory is activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "accounting", "inventory"]),
      makeDiscoveryAnswers({ "OP-01": "Yes", "FC-02": "AVCO" })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.INV_DREQ_007);
    assert.ok(rec !== null);
    // Should depend on ACCT-FOUND-002 and ACCT-DREQ-003
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.ACCT_FOUND_002));
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.ACCT_DREQ_003));
  });

  it("generates MRP-DREQ-003 when MF-02 = Multi-level", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "inventory", "manufacturing"]),
      makeDiscoveryAnswers({ "MF-01": "Yes", "OP-01": "Yes", "MF-02": "Multi-level" })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.MRP_DREQ_003) !== null);
  });

  it("generates MRP-DREQ-008 only when FC-01 = Full accounting AND MF-02 = Multi-level", () => {
    // Both conditions met
    const resultBoth = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "accounting", "inventory", "manufacturing"]),
      makeDiscoveryAnswers({ "MF-01": "Yes", "OP-01": "Yes", "FC-01": "Full accounting", "MF-02": "Multi-level" })
    );
    assert.ok(findRecord(resultBoth, CHECKPOINT_IDS.MRP_DREQ_008) !== null,
      "MRP-DREQ-008 should be generated when both FC-01=Full accounting AND MF-02=Multi-level");

    // Only FC-01 met, MF-02 missing
    const resultFc01Only = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "accounting", "inventory", "manufacturing"]),
      makeDiscoveryAnswers({ "MF-01": "Yes", "OP-01": "Yes", "FC-01": "Full accounting" })
    );
    assert.equal(findRecord(resultFc01Only, CHECKPOINT_IDS.MRP_DREQ_008), null,
      "MRP-DREQ-008 should NOT be generated when MF-02 is missing");

    // Only MF-02 met, FC-01 missing
    const resultMf02Only = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "inventory", "manufacturing"]),
      makeDiscoveryAnswers({ "MF-01": "Yes", "OP-01": "Yes", "MF-02": "Multi-level" })
    );
    assert.equal(findRecord(resultMf02Only, CHECKPOINT_IDS.MRP_DREQ_008), null,
      "MRP-DREQ-008 should NOT be generated when FC-01 is missing");
  });

  it("generates QUA-DREQ-001 when MF-06 includes Receipt", () => {
    const result = computeCheckpoints(
      makeActivatedDomains([
        "foundation", "users_roles", "master_data", "inventory",
        "manufacturing", "quality"
      ]),
      makeDiscoveryAnswers({ "MF-01": "Yes", "OP-01": "Yes", "MF-06": ["Receipt"] })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.QUA_DREQ_001) !== null);
  });

  it("generates QUA-DREQ-002 when MF-06 includes In-process", () => {
    const result = computeCheckpoints(
      makeActivatedDomains([
        "foundation", "users_roles", "master_data", "inventory",
        "manufacturing", "quality"
      ]),
      makeDiscoveryAnswers({ "MF-01": "Yes", "OP-01": "Yes", "MF-03": "Yes", "MF-06": ["In-process"] })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.QUA_DREQ_002) !== null);
  });

  it("generates QUA-DREQ-003 when MF-06 includes Finished goods", () => {
    const result = computeCheckpoints(
      makeActivatedDomains([
        "foundation", "users_roles", "master_data", "inventory",
        "manufacturing", "quality"
      ]),
      makeDiscoveryAnswers({ "MF-01": "Yes", "OP-01": "Yes", "MF-06": ["Finished goods"] })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.QUA_DREQ_003) !== null);
  });

  it("generates APR-DREQ-003 when TA-03 includes Inventory adjustments", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "approvals"]),
      makeDiscoveryAnswers({ "TA-03": ["Inventory adjustments"] })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.APR_DREQ_003) !== null);
  });

  it("generates multiple APR conditionals from a multi-select TA-03", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "approvals"]),
      makeDiscoveryAnswers({ "TA-03": ["Inventory adjustments", "Expenses", "HR leave"] })
    );
    assert.ok(findRecord(result, CHECKPOINT_IDS.APR_DREQ_003) !== null);
    assert.ok(findRecord(result, CHECKPOINT_IDS.APR_DREQ_004) !== null);
    assert.ok(findRecord(result, CHECKPOINT_IDS.APR_DREQ_006) !== null);
    // TA-03 does NOT include Manufacturing order → APR-DREQ-005 absent
    assert.equal(findRecord(result, CHECKPOINT_IDS.APR_DREQ_005), null);
  });

  it("generates POS-DREQ-004 when FC-01 = Full accounting and pos is activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "accounting", "pos"]),
      makeDiscoveryAnswers({ "FC-01": "Full accounting" })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.POS_DREQ_004);
    assert.ok(rec !== null);
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.ACCT_DREQ_003));
  });

  it("generates SUB-DREQ-003 when FC-01 = Full accounting and subscriptions is activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "sales", "accounting", "subscriptions"]),
      makeDiscoveryAnswers({ "FC-01": "Full accounting", "RM-01": ["One-time product sales"] })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.SUB_DREQ_003);
    assert.ok(rec !== null);
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.ACCT_DREQ_003));
  });
});

// ---------------------------------------------------------------------------
// Section 7 — Checkpoints NOT generated for domains where activated === false
// ---------------------------------------------------------------------------

describe("Domain activation gate", () => {
  it("does NOT generate CRM checkpoints when CRM is not activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]), // crm excluded
      makeDiscoveryAnswers({})
    );

    const crmIds = [
      CHECKPOINT_IDS.CRM_FOUND_001,
      CHECKPOINT_IDS.CRM_FOUND_002,
      CHECKPOINT_IDS.CRM_DREQ_001,
    ];

    for (const id of crmIds) {
      assert.equal(findRecord(result, id), null, `${id} should not be generated when CRM is not activated`);
    }
  });

  it("does NOT generate Sales checkpoints when Sales is not activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );

    assert.equal(findRecord(result, CHECKPOINT_IDS.SAL_FOUND_001), null);
    assert.equal(findRecord(result, CHECKPOINT_IDS.SAL_GL_001), null);
  });

  it("does NOT generate Accounting checkpoints when Accounting is not activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );

    assert.equal(findRecord(result, CHECKPOINT_IDS.ACCT_FOUND_001), null);
    assert.equal(findRecord(result, CHECKPOINT_IDS.ACCT_DREQ_003), null);
  });

  it("does NOT generate Manufacturing checkpoints when Manufacturing is not activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "inventory"]),
      makeDiscoveryAnswers({ "OP-01": "Yes" })
    );

    assert.equal(findRecord(result, CHECKPOINT_IDS.MRP_FOUND_001), null);
    assert.equal(findRecord(result, CHECKPOINT_IDS.MRP_DREQ_001), null);
    assert.equal(findRecord(result, CHECKPOINT_IDS.MRP_GL_001), null);
  });

  it("does NOT generate Inventory checkpoints when Inventory is not activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );

    assert.equal(findRecord(result, CHECKPOINT_IDS.INV_FOUND_001), null);
    assert.equal(findRecord(result, CHECKPOINT_IDS.INV_GL_001), null);
  });

  it("generates zero records when no domains are activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains([]), // nothing activated
      makeDiscoveryAnswers({})
    );
    assert.equal(result.records.length, 0);
  });

  it("handles activatedDomains with empty domains array", () => {
    const result = computeCheckpoints(
      { domains: [], activation_engine_version: "1.0.0", activated_at: null },
      makeDiscoveryAnswers({})
    );
    assert.equal(result.records.length, 0);
  });

  it("handles null activatedDomains gracefully", () => {
    const result = computeCheckpoints(null, makeDiscoveryAnswers({}));
    assert.equal(result.records.length, 0);
  });

  it("handles null discoveryAnswers gracefully", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      null
    );
    // Should generate unconditional foundation checkpoints with no conditionals
    assert.ok(result.records.length > 0);
    assert.ok(findRecord(result, CHECKPOINT_IDS.FND_FOUND_001) !== null);
    // No conditionals without answers
    assert.equal(findRecord(result, CHECKPOINT_IDS.FND_FOUND_006), null);
  });
});

// ---------------------------------------------------------------------------
// Section 8 — Cross-domain dependencies stored as arrays of strings
// ---------------------------------------------------------------------------

describe("Cross-domain dependencies — stored as arrays, not evaluated", () => {
  it("ACCT-FOUND-001 depends on FND-FOUND-004 (cross-domain, stored as string)", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "accounting"]),
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, CHECKPOINT_IDS.ACCT_FOUND_001);
    assert.ok(rec !== null);
    assert.ok(Array.isArray(rec.dependencies));
    assert.ok(rec.dependencies.every((d) => typeof d === "string"),
      "All dependency entries must be strings");
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.FND_FOUND_004));
  });

  it("USR-FOUND-002 depends on FND-FOUND-005 (cross-domain)", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, CHECKPOINT_IDS.USR_FOUND_002);
    assert.ok(rec !== null);
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.FND_FOUND_005));
  });

  it("INV-DREQ-007 depends on ACCT-FOUND-002 and ACCT-DREQ-003 when FC-02 = AVCO", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "accounting", "inventory"]),
      makeDiscoveryAnswers({ "OP-01": "Yes", "FC-02": "AVCO" })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.INV_DREQ_007);
    assert.ok(rec !== null);
    assert.ok(Array.isArray(rec.dependencies));
    assert.ok(rec.dependencies.every((d) => typeof d === "string"));
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.ACCT_FOUND_002));
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.ACCT_DREQ_003));
  });

  it("MAS-DREQ-004 depends on USR-FOUND-002 (cross-domain)", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data"]),
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, CHECKPOINT_IDS.MAS_DREQ_004);
    assert.ok(rec !== null);
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.USR_FOUND_002));
  });

  it("dependencies arrays are never null — empty array when no dependencies", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation"]),
      makeDiscoveryAnswers({})
    );
    const rec = findRecord(result, CHECKPOINT_IDS.FND_FOUND_001);
    assert.ok(rec !== null);
    assert.ok(Array.isArray(rec.dependencies));
    assert.equal(rec.dependencies.length, 0);
  });

  it("dependency entries are checkpoint_id strings, not objects", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles"]),
      makeDiscoveryAnswers({})
    );
    for (const record of result.records) {
      for (const dep of record.dependencies) {
        assert.equal(typeof dep, "string", `Dependency in ${record.checkpoint_id} must be a string`);
      }
    }
  });

  it("SAL-DREQ-003 depends on USR-DREQ-007 (cross-domain approver dependency)", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "sales"]),
      makeDiscoveryAnswers({
        "RM-01": ["One-time product sales"],
        "SC-02": "Yes",
      })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.SAL_DREQ_003);
    assert.ok(rec !== null, "SAL-DREQ-003 should be generated when SC-02 = Yes");
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.USR_DREQ_007));
  });
});

// ---------------------------------------------------------------------------
// Section 9 — Phantom dependency pruning
// ---------------------------------------------------------------------------

describe("Phantom dependency pruning", () => {
  it("removes cross-domain dependencies that were not generated (domain not activated)", () => {
    // Sales is activated but Accounting is not.
    // SAL-DREQ-006 depends on ACCT-DREQ-004 which would NOT be generated.
    // When ACCT-DREQ-004 is not in the generated set, it should be pruned
    // from SAL-DREQ-006's dependencies.
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "sales"]),
      makeDiscoveryAnswers({
        "RM-01": ["One-time product sales"],
        "FC-06": "Yes", // triggers SAL-DREQ-006 with dep on ACCT-DREQ-004
      })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.SAL_DREQ_006);
    // SAL-DREQ-006 should be generated (FC-06 = Yes)
    assert.ok(rec !== null, "SAL-DREQ-006 should be generated when FC-06 = Yes");
    // ACCT-DREQ-004 is NOT in the generated set (accounting not activated)
    // So the phantom dependency must be pruned
    assert.ok(
      !rec.dependencies.includes(CHECKPOINT_IDS.ACCT_DREQ_004),
      "Phantom dependency ACCT-DREQ-004 must be pruned when accounting is not activated"
    );
  });

  it("retains cross-domain dependencies that WERE generated", () => {
    // Both accounting and sales activated.
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "sales", "accounting"]),
      makeDiscoveryAnswers({
        "RM-01": ["One-time product sales"],
        "FC-06": "Yes",
      })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.SAL_DREQ_006);
    assert.ok(rec !== null);
    // ACCT-DREQ-004 IS generated, so it should remain in dependencies
    assert.ok(
      rec.dependencies.includes(CHECKPOINT_IDS.ACCT_DREQ_004),
      "ACCT-DREQ-004 should be retained when accounting is activated and the checkpoint was generated"
    );
  });

  it("INV-DREQ-002 has empty dependencies when FC-01 is not Full accounting", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "inventory"]),
      makeDiscoveryAnswers({ "OP-01": "Yes" }) // FC-01 absent — not Full accounting
    );
    const rec = findRecord(result, CHECKPOINT_IDS.INV_DREQ_002);
    assert.ok(rec !== null);
    assert.deepEqual(rec.dependencies, []);
  });

  it("INV-DREQ-002 depends on ACCT-DREQ-003 when FC-01 = Full accounting and accounting activated", () => {
    const result = computeCheckpoints(
      makeActivatedDomains(["foundation", "users_roles", "master_data", "accounting", "inventory"]),
      makeDiscoveryAnswers({ "OP-01": "Yes", "FC-01": "Full accounting" })
    );
    const rec = findRecord(result, CHECKPOINT_IDS.INV_DREQ_002);
    assert.ok(rec !== null);
    assert.ok(rec.dependencies.includes(CHECKPOINT_IDS.ACCT_DREQ_003));
  });
});

// ---------------------------------------------------------------------------
// Section 10 — Determinism
// ---------------------------------------------------------------------------

describe("Determinism", () => {
  it("produces identical output for the same inputs on repeated calls", () => {
    const activatedDomains = makeActivatedDomains(["foundation", "users_roles", "master_data", "sales", "accounting"]);
    const discoveryAnswers = makeDiscoveryAnswers({ "RM-01": ["One-time product sales"], "FC-01": "Full accounting", "BM-02": "Yes" });

    const result1 = computeCheckpoints(activatedDomains, discoveryAnswers);
    const result2 = computeCheckpoints(activatedDomains, discoveryAnswers);

    const ids1 = result1.records.map((r) => r.checkpoint_id).sort();
    const ids2 = result2.records.map((r) => r.checkpoint_id).sort();

    assert.deepEqual(ids1, ids2, "Checkpoint IDs must be identical across calls");
    assert.equal(result1.records.length, result2.records.length);

    for (let i = 0; i < result1.records.length; i++) {
      const r1 = result1.records[i];
      const r2 = result2.records.find((r) => r.checkpoint_id === r1.checkpoint_id);
      assert.ok(r2 !== undefined);
      assert.equal(r1.domain, r2.domain);
      assert.equal(r1.checkpoint_class, r2.checkpoint_class);
      assert.equal(r1.safety_class, r2.safety_class);
      assert.deepEqual(r1.dependencies.sort(), r2.dependencies.sort());
    }
  });

  it("produces no duplicate checkpoint_ids", () => {
    const result = computeCheckpoints(
      makeActivatedDomains([
        "foundation", "users_roles", "master_data", "crm", "sales",
        "purchase", "inventory", "accounting",
      ]),
      makeDiscoveryAnswers({
        "SC-01": "Yes",
        "RM-01": ["One-time product sales"],
        "PI-01": "Yes",
        "OP-01": "Yes",
        "FC-01": "Full accounting",
        "BM-02": "Yes",
        "BM-04": "Yes",
      })
    );

    const ids = result.records.map((r) => r.checkpoint_id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, "Duplicate checkpoint IDs detected");
  });
});

// ---------------------------------------------------------------------------
// Section 11 — CHECKPOINT_IDS export integrity
// ---------------------------------------------------------------------------

describe("CHECKPOINT_IDS export", () => {
  it("is a frozen object", () => {
    assert.ok(Object.isFrozen(CHECKPOINT_IDS));
  });

  it("all values are non-empty strings", () => {
    for (const [key, value] of Object.entries(CHECKPOINT_IDS)) {
      assert.equal(typeof value, "string", `CHECKPOINT_IDS.${key} must be a string`);
      assert.ok(value.length > 0, `CHECKPOINT_IDS.${key} must not be empty`);
    }
  });

  it("all values match the {PREFIX}-{CLASS_CODE}-{SEQ} format", () => {
    const pattern = /^[A-Z]+-[A-Z]+-\d{3}$/;
    for (const [key, value] of Object.entries(CHECKPOINT_IDS)) {
      assert.ok(pattern.test(value), `CHECKPOINT_IDS.${key} = "${value}" does not match pattern`);
    }
  });
});
