"use strict";

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  computeActivatedDomains,
  getDomainRecord,
  getActivatedDomains,
  getExcludedDomains,
  getIndustryDomainHints,
  DOMAIN_IDS,
  DOMAIN_ACTIVATION_ENGINE_VERSION,
} from "../domain-activation-engine.js";

import {
  createDiscoveryAnswers,
  createActivatedDomains,
  createActivatedDomainRecord,
} from "../runtime-state-contract.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAnswers(overrides = {}) {
  const da = createDiscoveryAnswers({ framework_version: "1.0" });
  da.answers = { ...overrides };
  return da;
}

/**
 * Minimal complete answer set — all required questions answered such that
 * only unconditional domains activate (no conditional domain triggers).
 */
function minimalAnswers() {
  return makeAnswers({
    // Section 1 — Business Model
    "BM-01": "Services only",
    "BM-02": false,
    "BM-03": "AU",
    "BM-04": false,
    "BM-05": 5,
    // Section 2 — Revenue
    "RM-01": ["One-time service delivery"],
    "RM-02": false,
    "RM-03": false,
    "RM-04": false,
    // Section 3 — Operations
    "OP-01": false,
    "OP-03": false,
    "OP-04": false,
    "OP-05": false,
    // Section 4 — Sales & CRM
    "SC-01": false,
    "SC-02": false,
    "SC-03": false,
    "SC-04": "Discounting is not permitted",
    // Section 5 — Procurement
    "PI-01": false,
    "PI-05": false,
    // Section 6 — Finance
    "FC-01": "Not using Odoo for financials",
    "FC-04": false,
    "FC-05": false,
    "FC-06": false,
    // Section 8 — Team & Access
    "TA-01": ["System Administrator (separate from all operational roles)"],
    "TA-02": false,
    "TA-03": ["None — standard module approvals are sufficient"],
    "TA-04": "Jane Smith, IT Manager",
  });
}

// ---------------------------------------------------------------------------
// Output shape contract
// ---------------------------------------------------------------------------

describe("output shape matches runtime-state-contract factories", () => {
  test("returns createActivatedDomains() shape with populated fields", () => {
    const result = computeActivatedDomains(minimalAnswers());
    assert.ok(typeof result === "object" && result !== null);
    assert.ok(Array.isArray(result.domains));
    assert.strictEqual(result.activation_engine_version, DOMAIN_ACTIVATION_ENGINE_VERSION);
    assert.ok(typeof result.activated_at === "string" && result.activated_at.length > 0);
  });

  test("every domain record matches createActivatedDomainRecord() fields", () => {
    const template = createActivatedDomainRecord();
    const templateKeys = Object.keys(template).sort();
    const result = computeActivatedDomains(minimalAnswers());
    for (const record of result.domains) {
      const recordKeys = Object.keys(record).sort();
      assert.deepStrictEqual(
        recordKeys,
        templateKeys,
        `Domain ${record.domain_id} has unexpected keys: got [${recordKeys}], expected [${templateKeys}]`
      );
    }
  });

  test("no computed fields present on any domain record", () => {
    const COMPUTED_FIELDS = [
      "primary_stage",
      "domain_status",
      "domain_visibility",
      "has_warnings",
      "has_deferrals",
      "has_blocked_golive",
      "has_review_pending",
    ];
    const result = computeActivatedDomains(minimalAnswers());
    for (const record of result.domains) {
      for (const field of COMPUTED_FIELDS) {
        assert.ok(
          !(field in record),
          `Domain ${record.domain_id} must not contain computed field "${field}"`
        );
      }
    }
  });

  test("activated=true records have non-null priority", () => {
    const result = computeActivatedDomains(minimalAnswers());
    for (const record of result.domains) {
      if (record.activated) {
        assert.notStrictEqual(
          record.priority,
          null,
          `Activated domain ${record.domain_id} must have a non-null priority`
        );
      }
    }
  });

  test("activated=false records have null priority", () => {
    const result = computeActivatedDomains(minimalAnswers());
    for (const record of result.domains) {
      if (!record.activated) {
        assert.strictEqual(
          record.priority,
          null,
          `Excluded domain ${record.domain_id} must have null priority`
        );
      }
    }
  });

  test("activation_question_refs is always an array", () => {
    const result = computeActivatedDomains(minimalAnswers());
    for (const record of result.domains) {
      assert.ok(
        Array.isArray(record.activation_question_refs),
        `Domain ${record.domain_id} activation_question_refs must be an array`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Unconditional domains — always activated
// ---------------------------------------------------------------------------

describe("unconditional domain activation", () => {
  test("foundation always activated", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.FOUNDATION);
    assert.ok(rec !== null, "foundation record must exist");
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "required");
    assert.strictEqual(rec.deferral_eligible, false);
  });

  test("users_roles always activated", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.USERS_ROLES);
    assert.ok(rec !== null);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "required");
  });

  test("master_data always activated", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.MASTER_DATA);
    assert.ok(rec !== null);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "required");
  });

  test("unconditional domains have empty activation_question_refs", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    for (const id of [DOMAIN_IDS.FOUNDATION, DOMAIN_IDS.USERS_ROLES, DOMAIN_IDS.MASTER_DATA]) {
      const rec = getDomainRecord(result, id);
      assert.deepStrictEqual(rec.activation_question_refs, []);
    }
  });
});

// ---------------------------------------------------------------------------
// Manufacturing hard gate (R6)
// ---------------------------------------------------------------------------

describe("manufacturing hard gate — MF-01 only", () => {
  test("manufacturing activates when MF-01=Yes", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    da.answers["MF-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "go-live");
    assert.ok(rec.activation_question_refs.includes("MF-01"));
  });

  test("manufacturing excluded when MF-01=No", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    da.answers["MF-01"] = "No";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, false);
  });

  test("manufacturing excluded when MF-01 is absent", () => {
    const result = computeActivatedDomains(minimalAnswers());
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, false);
    assert.strictEqual(rec.excluded_reason, null);
    assert.deepStrictEqual(rec.activation_question_refs, []);
  });

  test("manufacturing activation traces to MF-01 only", () => {
    const da = minimalAnswers();
    da.answers["MF-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    if (rec.activated) {
      assert.deepStrictEqual(rec.activation_question_refs, ["MF-01"]);
    }
  });
});

// ---------------------------------------------------------------------------
// Missing required input — R2
// ---------------------------------------------------------------------------

describe("missing required input produces activated=false with correct reason", () => {
  test("CRM missing SC-01 → not activated, reason=missing_required_input", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.CRM);
    assert.strictEqual(rec.activated, false);
    assert.ok(
      rec.excluded_reason === "missing_required_input" ||
        rec.activation_question_refs.length === 0,
      "expected missing_required_input signal"
    );
  });

  test("accounting missing FC-01 → not activated, reason=missing_required_input", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.ACCOUNTING);
    assert.strictEqual(rec.activated, false);
  });

  test("PLM missing MF-01 → not activated", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.PLM);
    assert.strictEqual(rec.activated, false);
  });

  test("maintenance missing MF-03 → not activated", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.MAINTENANCE);
    assert.strictEqual(rec.activated, false);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Accounting (FC-01 variants)
// ---------------------------------------------------------------------------

describe("accounting activation via FC-01", () => {
  test("FC-01=Full accounting → activated, priority=go-live", () => {
    const da = minimalAnswers();
    da.answers["FC-01"] = "Full accounting";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.ACCOUNTING);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "go-live");
    assert.ok(rec.activation_question_refs.includes("FC-01"));
  });

  test("FC-01=Invoicing only → activated, priority=recommended", () => {
    const da = minimalAnswers();
    da.answers["FC-01"] = "Invoicing only";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.ACCOUNTING);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "recommended");
  });

  test("FC-01=Not using Odoo for financials → excluded", () => {
    const da = minimalAnswers();
    da.answers["FC-01"] = "Not using Odoo for financials";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.ACCOUNTING);
    assert.strictEqual(rec.activated, false);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: CRM (SC-01)
// ---------------------------------------------------------------------------

describe("CRM activation via SC-01", () => {
  test("SC-01=Yes → activated, priority=recommended", () => {
    const da = minimalAnswers();
    da.answers["SC-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.CRM);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "recommended");
    assert.ok(rec.activation_question_refs.includes("SC-01"));
  });

  test("SC-01=No → excluded", () => {
    const da = minimalAnswers();
    da.answers["SC-01"] = "No";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.CRM);
    assert.strictEqual(rec.activated, false);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Inventory (OP-01 / RM-04 / MF-01)
// ---------------------------------------------------------------------------

describe("inventory activation", () => {
  test("OP-01=Yes → activated, priority=go-live", () => {
    const da = minimalAnswers();
    da.answers["OP-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "go-live");
    assert.ok(rec.activation_question_refs.includes("OP-01"));
  });

  test("RM-04=Yes activates inventory", () => {
    const da = minimalAnswers();
    da.answers["OP-01"] = "No";
    da.answers["RM-04"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("RM-04"));
  });

  test("MF-01=Yes activates inventory", () => {
    const da = minimalAnswers();
    da.answers["OP-01"] = "No";
    da.answers["RM-04"] = "No";
    da.answers["MF-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("MF-01"));
  });

  test("OP-01=No, RM-04=No, MF-01=No → excluded", () => {
    const da = minimalAnswers();
    da.answers["OP-01"] = "No";
    da.answers["RM-04"] = "No";
    da.answers["MF-01"] = "No";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, false);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: PLM (requires MF-01=Yes AND MF-05=Yes)
// ---------------------------------------------------------------------------

describe("PLM activation", () => {
  test("MF-01=Yes, MF-05=Yes → activated", () => {
    const da = minimalAnswers();
    da.answers["MF-01"] = "Yes";
    da.answers["MF-05"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PLM);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("MF-01"));
    assert.ok(rec.activation_question_refs.includes("MF-05"));
  });

  test("MF-01=Yes, MF-05=No → excluded", () => {
    const da = minimalAnswers();
    da.answers["MF-01"] = "Yes";
    da.answers["MF-05"] = "No";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PLM);
    assert.strictEqual(rec.activated, false);
  });

  test("MF-01=No → PLM excluded (gate)", () => {
    const da = minimalAnswers();
    da.answers["MF-01"] = "No";
    da.answers["MF-05"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PLM);
    assert.strictEqual(rec.activated, false);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Purchase
// ---------------------------------------------------------------------------

describe("purchase activation", () => {
  test("PI-01=Yes → activated", () => {
    const da = minimalAnswers();
    da.answers["PI-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PURCHASE);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("PI-01"));
  });

  test("PI-05=Yes activates purchase", () => {
    const da = minimalAnswers();
    da.answers["PI-01"] = "No";
    da.answers["PI-05"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PURCHASE);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("PI-05"));
  });

  test("MF-04=Yes activates purchase when MF-01=Yes", () => {
    const da = minimalAnswers();
    da.answers["PI-01"] = "No";
    da.answers["PI-05"] = "No";
    da.answers["MF-01"] = "Yes";
    da.answers["MF-04"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PURCHASE);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("MF-04"));
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Maintenance (MF-03=Yes AND MF-07=Yes)
// ---------------------------------------------------------------------------

describe("maintenance activation", () => {
  test("MF-03=Yes, MF-07=Yes → activated", () => {
    const da = minimalAnswers();
    da.answers["MF-03"] = "Yes";
    da.answers["MF-07"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MAINTENANCE);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "optional");
  });

  test("MF-03=No → maintenance excluded (gate)", () => {
    const da = minimalAnswers();
    da.answers["MF-03"] = "No";
    da.answers["MF-07"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MAINTENANCE);
    assert.strictEqual(rec.activated, false);
  });

  test("MF-03=Yes, MF-07=No → excluded", () => {
    const da = minimalAnswers();
    da.answers["MF-03"] = "Yes";
    da.answers["MF-07"] = "No";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MAINTENANCE);
    assert.strictEqual(rec.activated, false);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Quality (MF-06 non-None)
// ---------------------------------------------------------------------------

describe("quality activation", () => {
  test("MF-06 with non-None selection → activated", () => {
    const da = minimalAnswers();
    da.answers["MF-06"] = ["On receipt from supplier"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.QUALITY);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("MF-06"));
  });

  test("MF-06=None only → excluded", () => {
    const da = minimalAnswers();
    da.answers["MF-06"] = ["None — quality is managed externally or not required in Odoo"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.QUALITY);
    assert.strictEqual(rec.activated, false);
  });

  test("MF-06 not answered → not activated, missing_required_input", () => {
    const result = computeActivatedDomains(minimalAnswers());
    const rec = getDomainRecord(result, DOMAIN_IDS.QUALITY);
    assert.strictEqual(rec.activated, false);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Approvals (TA-03 non-None)
// ---------------------------------------------------------------------------

describe("approvals activation", () => {
  test("TA-03 with non-None selection → activated", () => {
    const da = minimalAnswers();
    da.answers["TA-03"] = ["HR leave requests"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.APPROVALS);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("TA-03"));
  });

  test("TA-03=None only → excluded", () => {
    const result = computeActivatedDomains(minimalAnswers());
    const rec = getDomainRecord(result, DOMAIN_IDS.APPROVALS);
    assert.strictEqual(rec.activated, false);
  });

  test("BM-05>50 with SC-02=Yes → approvals activated", () => {
    const da = minimalAnswers();
    da.answers["BM-05"] = 60;
    da.answers["SC-02"] = "Yes";
    da.answers["TA-03"] = ["None — standard module approvals are sufficient"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.APPROVALS);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("BM-05"));
    assert.ok(rec.activation_question_refs.includes("SC-02"));
  });
});

// ---------------------------------------------------------------------------
// Traceability — every activated conditional domain has question refs
// ---------------------------------------------------------------------------

describe("traceability — no inference allowed", () => {
  test("every activated conditional domain references at least one question", () => {
    const da = makeAnswers({
      "BM-01": "Both physical products and services",
      "BM-02": false,
      "BM-03": "AU",
      "BM-04": false,
      "BM-05": 25,
      "RM-01": ["One-time product sales", "One-time service delivery", "Project-based billing (time and materials or fixed price)"],
      "RM-02": "Yes",
      "RM-03": "Yes",
      "RM-04": "No",
      "OP-01": "Yes",
      "OP-03": "No",
      "OP-04": "Yes",
      "OP-05": "No",
      "SC-01": "Yes",
      "SC-02": "No",
      "SC-03": "No",
      "SC-04": "Discounting is not permitted",
      "PI-01": "Yes",
      "PI-05": "No",
      "MF-01": "Yes",
      "MF-03": "No",
      "MF-05": "No",
      "FC-01": "Full accounting",
      "FC-04": "No",
      "FC-05": "No",
      "FC-06": "No",
      "TA-01": ["System Administrator (separate from all operational roles)"],
      "TA-02": "No",
      "TA-03": ["None — standard module approvals are sufficient"],
      "TA-04": "Jane Smith",
    });
    const result = computeActivatedDomains(da);
    const UNCONDITIONAL = new Set([
      DOMAIN_IDS.FOUNDATION,
      DOMAIN_IDS.USERS_ROLES,
      DOMAIN_IDS.MASTER_DATA,
    ]);
    for (const record of result.domains) {
      if (record.activated && !UNCONDITIONAL.has(record.domain_id)) {
        assert.ok(
          record.activation_question_refs.length > 0,
          `Conditional domain ${record.domain_id} is activated but has no activation_question_refs`
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("input validation", () => {
  test("throws on null input", () => {
    assert.throws(
      () => computeActivatedDomains(null),
      /discoveryAnswers must be a non-null object/
    );
  });

  test("throws on non-object input", () => {
    assert.throws(
      () => computeActivatedDomains("not an object"),
      /discoveryAnswers must be a non-null object/
    );
  });

  test("empty answers object is accepted — unconditional domains still activate", () => {
    const da = createDiscoveryAnswers();
    const result = computeActivatedDomains(da);
    assert.ok(Array.isArray(result.domains));
    assert.strictEqual(getDomainRecord(result, DOMAIN_IDS.FOUNDATION).activated, true);
    assert.strictEqual(getDomainRecord(result, DOMAIN_IDS.USERS_ROLES).activated, true);
    assert.strictEqual(getDomainRecord(result, DOMAIN_IDS.MASTER_DATA).activated, true);
  });
});

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

describe("utility helpers", () => {
  test("getActivatedDomains returns only activated records", () => {
    const result = computeActivatedDomains(minimalAnswers());
    const activated = getActivatedDomains(result);
    assert.ok(activated.every((d) => d.activated === true));
  });

  test("getExcludedDomains returns only non-activated records", () => {
    const result = computeActivatedDomains(minimalAnswers());
    const excluded = getExcludedDomains(result);
    assert.ok(excluded.every((d) => d.activated === false));
  });

  test("getActivatedDomains + getExcludedDomains = all domains", () => {
    const result = computeActivatedDomains(minimalAnswers());
    const activated = getActivatedDomains(result);
    const excluded = getExcludedDomains(result);
    assert.strictEqual(activated.length + excluded.length, result.domains.length);
  });

  test("getDomainRecord returns null for unknown id", () => {
    const result = computeActivatedDomains(minimalAnswers());
    assert.strictEqual(getDomainRecord(result, "nonexistent-domain"), null);
  });
});

// ---------------------------------------------------------------------------
// Determinism — same input produces same domain set
// ---------------------------------------------------------------------------

describe("determinism", () => {
  test("identical inputs produce identical domain activation decisions", () => {
    const da1 = minimalAnswers();
    const da2 = minimalAnswers();
    const r1 = computeActivatedDomains(da1);
    const r2 = computeActivatedDomains(da2);
    // Compare domain activation decisions (not timestamps)
    for (let i = 0; i < r1.domains.length; i++) {
      assert.strictEqual(r1.domains[i].domain_id, r2.domains[i].domain_id);
      assert.strictEqual(r1.domains[i].activated, r2.domains[i].activated);
      assert.deepStrictEqual(
        r1.domains[i].activation_question_refs,
        r2.domains[i].activation_question_refs
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Subscriptions (RM-03 / RM-01 recurring)
// ---------------------------------------------------------------------------

describe("subscriptions activation", () => {
  test("RM-03=Yes → activated, priority=optional", () => {
    const da = minimalAnswers();
    da.answers["RM-03"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.SUBSCRIPTIONS);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "optional");
    assert.ok(rec.activation_question_refs.includes("RM-03"));
  });

  test("RM-01 includes recurring subscriptions → activated", () => {
    const da = minimalAnswers();
    da.answers["RM-03"] = "No";
    da.answers["RM-01"] = ["Recurring subscriptions or contracts"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.SUBSCRIPTIONS);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("RM-01"));
  });

  test("RM-03=Yes and RM-01 recurring → both refs present", () => {
    const da = minimalAnswers();
    da.answers["RM-03"] = "Yes";
    da.answers["RM-01"] = ["Recurring subscriptions or contracts"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.SUBSCRIPTIONS);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("RM-03"));
    assert.ok(rec.activation_question_refs.includes("RM-01"));
  });

  test("RM-03=No, RM-01 no recurring → excluded", () => {
    const da = minimalAnswers();
    da.answers["RM-03"] = "No";
    da.answers["RM-01"] = ["One-time product sales"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.SUBSCRIPTIONS);
    assert.strictEqual(rec.activated, false);
  });

  test("RM-03 not answered → not activated, missing_required_input", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.SUBSCRIPTIONS);
    assert.strictEqual(rec.activated, false);
    assert.deepStrictEqual(rec.activation_question_refs, []);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Rental (RM-04 / RM-01 rental)
// ---------------------------------------------------------------------------

describe("rental activation", () => {
  test("RM-04=Yes → activated, priority=optional", () => {
    const da = minimalAnswers();
    da.answers["RM-04"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.RENTAL);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "optional");
    assert.ok(rec.activation_question_refs.includes("RM-04"));
  });

  test("RM-01 includes Rental of assets → activated", () => {
    const da = minimalAnswers();
    da.answers["RM-04"] = "No";
    da.answers["RM-01"] = ["Rental of assets or equipment"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.RENTAL);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("RM-01"));
  });

  test("RM-04=Yes and RM-01 rental → both refs present", () => {
    const da = minimalAnswers();
    da.answers["RM-04"] = "Yes";
    da.answers["RM-01"] = ["Rental of assets or equipment"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.RENTAL);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("RM-04"));
    assert.ok(rec.activation_question_refs.includes("RM-01"));
  });

  test("RM-04=No, RM-01 no rental → excluded", () => {
    const da = minimalAnswers();
    da.answers["RM-04"] = "No";
    da.answers["RM-01"] = ["One-time product sales"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.RENTAL);
    assert.strictEqual(rec.activated, false);
  });

  test("RM-04 not answered → not activated, missing_required_input", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.RENTAL);
    assert.strictEqual(rec.activated, false);
    assert.deepStrictEqual(rec.activation_question_refs, []);
  });
});

// ---------------------------------------------------------------------------
// Conditional domain: Field Service (OP-05)
// ---------------------------------------------------------------------------

describe("field_service activation", () => {
  test("OP-05=Yes → activated, priority=optional", () => {
    const da = minimalAnswers();
    da.answers["OP-05"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.FIELD_SERVICE);
    assert.strictEqual(rec.activated, true);
    assert.strictEqual(rec.priority, "optional");
    assert.ok(rec.activation_question_refs.includes("OP-05"));
  });

  test("OP-05=No → excluded", () => {
    const da = minimalAnswers();
    da.answers["OP-05"] = "No";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.FIELD_SERVICE);
    assert.strictEqual(rec.activated, false);
  });

  test("OP-05 not answered → not activated, missing_required_input", () => {
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.FIELD_SERVICE);
    assert.strictEqual(rec.activated, false);
    assert.deepStrictEqual(rec.activation_question_refs, []);
  });

  test("OP-05=Yes traces to OP-05 only", () => {
    const da = minimalAnswers();
    da.answers["OP-05"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.FIELD_SERVICE);
    assert.deepStrictEqual(rec.activation_question_refs, ["OP-05"]);
  });
});

// ---------------------------------------------------------------------------
// Industry domain hints — getIndustryDomainHints
// ---------------------------------------------------------------------------

describe("getIndustryDomainHints", () => {
  test("known industry returns non-null hints object", () => {
    const hints = getIndustryDomainHints("manufacturing");
    assert.ok(hints !== null);
    assert.strictEqual(hints.industryId, "manufacturing");
    assert.ok(typeof hints.industryName === "string" && hints.industryName.length > 0);
    assert.ok(Array.isArray(hints.recommendedDomains));
    assert.ok(Array.isArray(hints.stageOrder));
  });

  test("manufacturing hints include expected domains", () => {
    const hints = getIndustryDomainHints("manufacturing");
    assert.ok(hints.recommendedDomains.includes("manufacturing"));
    assert.ok(hints.recommendedDomains.includes("inventory"));
    assert.ok(hints.recommendedDomains.includes("accounting"));
  });

  test("retail hints are distinct from manufacturing", () => {
    const mfg = getIndustryDomainHints("manufacturing");
    const retail = getIndustryDomainHints("retail");
    assert.ok(retail !== null);
    assert.strictEqual(retail.industryId, "retail");
    assert.ok(retail.recommendedDomains.includes("pos"));
    assert.ok(!mfg.recommendedDomains.includes("pos"));
  });

  test("unknown industryId returns null", () => {
    const hints = getIndustryDomainHints("nonexistent_industry");
    assert.strictEqual(hints, null);
  });

  test("empty string returns null", () => {
    const hints = getIndustryDomainHints("");
    assert.strictEqual(hints, null);
  });

  test("non-string returns null", () => {
    assert.strictEqual(getIndustryDomainHints(null), null);
    assert.strictEqual(getIndustryDomainHints(42), null);
    assert.strictEqual(getIndustryDomainHints(undefined), null);
  });

  test("returned arrays are copies — mutations do not affect engine state", () => {
    const hints = getIndustryDomainHints("manufacturing");
    const originalLength = hints.recommendedDomains.length;
    hints.recommendedDomains.push("MUTATED");
    const hints2 = getIndustryDomainHints("manufacturing");
    assert.strictEqual(hints2.recommendedDomains.length, originalLength);
  });

  test("distribution and services hints are non-null", () => {
    assert.ok(getIndustryDomainHints("distribution") !== null);
    assert.ok(getIndustryDomainHints("services") !== null);
  });
});

// ---------------------------------------------------------------------------
// BM-01 wiring — reinforcement tests
// ---------------------------------------------------------------------------

describe("BM-01 reinforces inventory activation when physical products present", () => {
  test("BM-01=Physical products only reinforces inventory when OP-01=Yes", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    da.answers["OP-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("BM-01"), "BM-01 must appear in refs");
    assert.ok(rec.activation_question_refs.includes("OP-01"), "OP-01 must still appear in refs");
  });

  test("BM-01=Both reinforces inventory when OP-01=Yes", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Both physical products and services";
    da.answers["OP-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("BM-01"));
  });

  test("BM-01=Services only does NOT appear in inventory refs", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Services only";
    da.answers["OP-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, true, "OP-01=Yes still activates inventory");
    assert.ok(!rec.activation_question_refs.includes("BM-01"), "BM-01=Services only must not be in refs");
  });

  test("BM-01 absent — inventory activation unchanged (OP-01=Yes still activates)", () => {
    const da = makeAnswers({ "OP-01": "Yes" });
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, true);
    assert.ok(!rec.activation_question_refs.includes("BM-01"), "absent BM-01 must not appear in refs");
  });

  test("BM-01=Physical products only does NOT activate inventory when OP-01=No and no other gate", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    da.answers["OP-01"] = "No";
    // RM-04 and MF-01 absent in minimalAnswers
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, false, "BM-01 alone must not activate inventory");
  });
});

describe("BM-01 reinforces manufacturing activation when physical products present", () => {
  test("BM-01=Physical products only reinforces manufacturing when MF-01=Yes", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    da.answers["MF-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("MF-01"), "MF-01 must appear");
    assert.ok(rec.activation_question_refs.includes("BM-01"), "BM-01 must appear as reinforcement");
  });

  test("BM-01=Both reinforces manufacturing when MF-01=Yes", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Both physical products and services";
    da.answers["MF-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("BM-01"));
  });

  test("BM-01=Services only does NOT appear in manufacturing refs", () => {
    // minimalAnswers already has BM-01=Services only — MF-01=Yes is the gate
    const da = minimalAnswers();
    da.answers["BM-01"] = "Services only";
    da.answers["MF-01"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, true, "MF-01=Yes still activates manufacturing");
    assert.ok(!rec.activation_question_refs.includes("BM-01"), "BM-01=Services only must not be in refs");
  });

  test("BM-01 absent — MF-01=Yes still activates manufacturing unchanged", () => {
    const da = makeAnswers({ "MF-01": "Yes" });
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, true);
    assert.ok(!rec.activation_question_refs.includes("BM-01"), "absent BM-01 must not appear");
    assert.deepStrictEqual(rec.activation_question_refs, ["MF-01"]);
  });

  test("BM-01=Physical products only does NOT activate manufacturing without MF-01", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    // MF-01 not set in minimalAnswers
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, false, "BM-01 alone must not activate manufacturing");
  });
});

describe("BM-01 reinforces sales activation when sales-implying model present", () => {
  test("BM-01=Physical products only reinforces sales when RM-01 triggers it", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    da.answers["RM-01"] = ["One-time product sales"];
    da.answers["PI-05"] = false;
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.SALES);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("BM-01"), "BM-01 must appear as reinforcement");
    assert.ok(rec.activation_question_refs.includes("RM-01"), "RM-01 must still appear");
  });

  test("BM-01=Services only reinforces sales when RM-01 triggers it", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Services only";
    da.answers["RM-01"] = ["One-time service delivery"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.SALES);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("BM-01"));
  });

  test("BM-01=Platform or marketplace does NOT appear in sales refs", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Platform or marketplace (connecting buyers and sellers)";
    da.answers["RM-01"] = ["One-time product sales"];
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.SALES);
    assert.strictEqual(rec.activated, true, "RM-01 still activates sales");
    assert.ok(!rec.activation_question_refs.includes("BM-01"), "Platform BM-01 must not be in refs");
  });

  test("BM-01 absent — sales activation unchanged", () => {
    const da = makeAnswers({
      "RM-01": ["One-time product sales"],
      "PI-05": false,
    });
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.SALES);
    assert.strictEqual(rec.activated, true);
    assert.ok(!rec.activation_question_refs.includes("BM-01"), "absent BM-01 must not appear");
  });

  test("BM-01=Physical products only does NOT activate sales without an existing gate", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    da.answers["RM-01"] = ["One-time service delivery"]; // sales-triggering
    da.answers["PI-05"] = false;
    // Force a non-activating RM-01 scenario: only way is no qualifying selection + PI-05=No
    const da2 = minimalAnswers();
    da2.answers["BM-01"] = "Physical products only";
    da2.answers["RM-01"] = []; // no qualifying selections
    da2.answers["PI-05"] = false;
    const result2 = computeActivatedDomains(da2);
    const rec2 = getDomainRecord(result2, DOMAIN_IDS.SALES);
    assert.strictEqual(rec2.activated, false, "BM-01 alone must not activate sales");
  });
});

describe("BM-01 reinforces projects activation when services model present", () => {
  test("BM-01=Services only reinforces projects when RM-02=Yes", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Services only";
    da.answers["RM-02"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PROJECTS);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("BM-01"), "BM-01 must appear as reinforcement");
    assert.ok(rec.activation_question_refs.includes("RM-02"), "RM-02 must still appear");
  });

  test("BM-01=Both reinforces projects when RM-02=Yes", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Both physical products and services";
    da.answers["RM-02"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PROJECTS);
    assert.strictEqual(rec.activated, true);
    assert.ok(rec.activation_question_refs.includes("BM-01"));
  });

  test("BM-01=Physical products only does NOT appear in projects refs", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Physical products only";
    da.answers["RM-02"] = "Yes";
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PROJECTS);
    assert.strictEqual(rec.activated, true, "RM-02=Yes still activates projects");
    assert.ok(!rec.activation_question_refs.includes("BM-01"), "Physical-only BM-01 must not be in projects refs");
  });

  test("BM-01 absent — projects activation unchanged", () => {
    const da = makeAnswers({ "RM-02": "Yes" });
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PROJECTS);
    assert.strictEqual(rec.activated, true);
    assert.ok(!rec.activation_question_refs.includes("BM-01"), "absent BM-01 must not appear");
  });

  test("BM-01=Services only does NOT activate projects without an existing gate", () => {
    const da = minimalAnswers();
    da.answers["BM-01"] = "Services only";
    // minimalAnswers: RM-02=false, OP-05=false, RM-01 has no project-based billing
    const result = computeActivatedDomains(da);
    const rec = getDomainRecord(result, DOMAIN_IDS.PROJECTS);
    assert.strictEqual(rec.activated, false, "BM-01 alone must not activate projects");
  });
});

describe("BM-01 — missing_required_input is never caused by BM-01 absence alone", () => {
  test("inventory missing_required_input is caused by OP-01 absence, not BM-01", () => {
    // No BM-01, no OP-01
    const result = computeActivatedDomains(makeAnswers({}));
    const rec = getDomainRecord(result, DOMAIN_IDS.INVENTORY);
    assert.strictEqual(rec.activated, false);
    // The reason is missing OP-01, not BM-01
    assert.deepStrictEqual(rec.activation_question_refs, []);
  });

  test("manufacturing missing_required_input is caused by MF-01 absence, not BM-01", () => {
    const result = computeActivatedDomains(makeAnswers({ "BM-01": "Physical products only" }));
    const rec = getDomainRecord(result, DOMAIN_IDS.MANUFACTURING);
    assert.strictEqual(rec.activated, false);
    assert.deepStrictEqual(rec.activation_question_refs, []);
  });

  test("sales missing_required_input is caused by RM-01 absence, not BM-01", () => {
    const result = computeActivatedDomains(makeAnswers({ "BM-01": "Physical products only" }));
    const rec = getDomainRecord(result, DOMAIN_IDS.SALES);
    assert.strictEqual(rec.activated, false);
    assert.deepStrictEqual(rec.activation_question_refs, []);
  });

  test("projects missing_required_input is caused by RM-02 absence, not BM-01", () => {
    const result = computeActivatedDomains(makeAnswers({ "BM-01": "Services only" }));
    const rec = getDomainRecord(result, DOMAIN_IDS.PROJECTS);
    assert.strictEqual(rec.activated, false);
    assert.deepStrictEqual(rec.activation_question_refs, []);
  });
});
