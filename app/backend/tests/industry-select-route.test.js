// ---------------------------------------------------------------------------
// Industry Select Route Tests
// app/backend/tests/industry-select-route.test.js
// ---------------------------------------------------------------------------
//
// Covers: POST /api/pipeline/industry/select
//
// Required tests:
//   1. Valid industry_id returns correct pre-populated answers
//   2. Invalid industry_id returns 400
//   3. Missing project_id returns 400
//   4. Pre-populated answers do not overwrite existing user answers on merge
//   5. Deferred questions are recorded correctly
//   6. activated_domains_preview matches computeActivatedDomains() output
//   7. Pipeline/run uses persisted discovery_answers when none are passed
//      (HALT CONDITION — documented separately, tested via load+run sequence)
//
// Governance:
//   - No engine files modified.
//   - No proof-track state files modified.
//   - No direct database writes.
//   - Additive: only new route handler tested here.
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import path from "node:path";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createAppServer } from "../server.js";
import {
  saveRuntimeState,
  loadRuntimeState,
} from "../runtime-state-persistence-service.js";
import {
  computeActivatedDomains,
} from "../../shared/domain-activation-engine.js";

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

let server;
let serverPort;

before(async () => {
  server = createAppServer({ rateLimitMaxRequests: Infinity });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      serverPort = server.address().port;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await cleanupTestFiles();
});

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const TEST_RUN_ID        = `ind_sel_${Date.now()}`;
const _createdProjectIds = new Set();

function makeProjectId(label) {
  return `${TEST_RUN_ID}_${label}`;
}

async function cleanupTestFiles() {
  const storeDir = path.resolve(__dirname, "..", "data", "runtime-states");
  for (const pid of _createdProjectIds) {
    const safe = pid.replace(/[^a-zA-Z0-9\-_]/g, "_");
    try {
      await rm(path.join(storeDir, `${safe}.json`), { force: true });
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function post(pathname, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = httpRequest(
      {
        hostname: "127.0.0.1",
        port: serverPort,
        path: pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({ statusCode: res.statusCode, body: raw ? JSON.parse(raw) : {} });
        });
      }
    );
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Test 1: Valid industry_id returns correct pre-populated answers
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/industry/select — valid request", () => {
  test("manufacturing returns ok:true with expected pre-populated answers", async () => {
    const project_id = makeProjectId("mfg_valid");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "manufacturing",
    });

    assert.equal(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.industry_id, "manufacturing");
    assert.equal(res.body.industry_name, "Manufacturing & Production");
    assert.equal(res.body.next_step, "wizard");

    const answers = res.body.pre_populated_answers;
    assert.ok(answers, "pre_populated_answers must be present");
    assert.equal(answers["MF-01"], "Yes", "manufacturing requires MF-01=Yes");
    assert.equal(answers["BM-01"], "Physical products only");
    assert.equal(answers["PI-01"], "Yes");
    assert.equal(answers["OP-01"], "Yes");
    assert.equal(answers["FC-01"], "Full accounting");
    assert.ok(Array.isArray(answers["RM-01"]), "RM-01 must be an array");
    assert.ok(answers["RM-01"].includes("One-time product sales"));
    assert.ok(Array.isArray(answers["MF-06"]), "MF-06 must be an array for quality");
  });

  test("retail returns ok:true with expected pre-populated answers", async () => {
    const project_id = makeProjectId("retail_valid");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "retail",
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.industry_id, "retail");
    assert.equal(res.body.industry_name, "Retail & POS");

    const answers = res.body.pre_populated_answers;
    assert.equal(answers["OP-03"], "Yes", "retail requires OP-03=Yes for POS");
    assert.equal(answers["OP-01"], "Yes");
    assert.equal(answers["OP-04"], "Yes");
    assert.equal(answers["SC-01"], "Yes");
    assert.equal(answers["FC-01"], "Full accounting");
    assert.ok(Array.isArray(answers["RM-01"]));
    assert.ok(answers["RM-01"].includes("One-time product sales"));
  });

  test("distribution returns ok:true with expected pre-populated answers", async () => {
    const project_id = makeProjectId("dist_valid");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "distribution",
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.industry_id, "distribution");
    assert.equal(res.body.industry_name, "Distribution & Wholesale");

    const answers = res.body.pre_populated_answers;
    assert.equal(answers["PI-01"], "Yes");
    assert.equal(answers["OP-01"], "Yes");
    assert.equal(answers["SC-01"], "Yes");
    assert.equal(answers["FC-01"], "Full accounting");
    assert.ok(Array.isArray(answers["RM-01"]));
    assert.ok(answers["RM-01"].includes("One-time product sales"));
  });

  test("services returns ok:true with expected pre-populated answers", async () => {
    const project_id = makeProjectId("svc_valid");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "services",
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.industry_id, "services");
    assert.equal(res.body.industry_name, "Services & Projects");

    const answers = res.body.pre_populated_answers;
    assert.equal(answers["RM-02"], "Yes");
    assert.equal(answers["SC-01"], "Yes");
    assert.equal(answers["FC-01"], "Full accounting");
    assert.equal(answers["BM-01"], "Services only");
    assert.equal(typeof answers["BM-05"], "number");
    assert.ok(answers["BM-05"] > 10, "BM-05 must be > 10 to activate HR");
    assert.ok(Array.isArray(answers["RM-01"]));
    assert.ok(answers["RM-01"].includes("One-time service delivery"));
  });
});

// ---------------------------------------------------------------------------
// Test 2: Invalid industry_id returns 400
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/industry/select — invalid industry_id", () => {
  test("unknown industry_id returns 400 with descriptive error", async () => {
    const project_id = makeProjectId("invalid_industry");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "construction",
    });

    assert.equal(res.statusCode, 400, `Expected 400, got ${res.statusCode}`);
    assert.equal(res.body.ok, false);
    assert.ok(
      typeof res.body.error === "string" && res.body.error.includes("construction"),
      `Error message should name the invalid industry_id. Got: ${res.body.error}`
    );
  });

  test("empty string industry_id returns 400", async () => {
    const res = await post("/api/pipeline/industry/select", {
      project_id: makeProjectId("empty_industry"),
      industry_id: "",
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.ok, false);
  });

  test("numeric industry_id returns 400", async () => {
    const res = await post("/api/pipeline/industry/select", {
      project_id: makeProjectId("numeric_industry"),
      industry_id: 42,
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Missing project_id returns 400
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/industry/select — missing project_id", () => {
  test("missing project_id returns 400", async () => {
    const res = await post("/api/pipeline/industry/select", {
      industry_id: "manufacturing",
    });
    assert.equal(res.statusCode, 400, `Expected 400, got ${res.statusCode}`);
    assert.equal(res.body.ok, false);
    assert.ok(
      typeof res.body.error === "string" && res.body.error.toLowerCase().includes("project_id"),
      `Error should mention project_id. Got: ${res.body.error}`
    );
  });

  test("empty string project_id returns 400", async () => {
    const res = await post("/api/pipeline/industry/select", {
      project_id: "",
      industry_id: "manufacturing",
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.ok, false);
  });

  test("null project_id returns 400", async () => {
    const res = await post("/api/pipeline/industry/select", {
      project_id: null,
      industry_id: "manufacturing",
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Pre-populated answers do not overwrite existing user answers
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/industry/select — merge does not overwrite user answers", () => {
  test("existing user answer for MF-01 is preserved on merge", async () => {
    const project_id = makeProjectId("merge_user_wins");
    _createdProjectIds.add(project_id);

    // Pre-seed runtime state with a user-provided answer that differs from industry default
    const existingState = {
      project_identity: { project_id },
      discovery_answers: {
        answers: {
          "MF-01": "No",   // user said No — industry default would set Yes
          "FC-01": "Not using Odoo for financials",  // user overrides accounting
        },
        sources: {
          "MF-01": "user",
          "FC-01": "user",
        },
      },
    };
    const seedResult = await saveRuntimeState(existingState);
    assert.ok(seedResult.ok, `Seed save failed: ${seedResult.error}`);

    // Now select manufacturing industry
    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "manufacturing",
    });

    assert.equal(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.ok, true);

    // Verify persisted state has user answers preserved
    const loadResult = await loadRuntimeState(project_id);
    assert.ok(loadResult.ok);
    const persisted = loadResult.runtime_state.discovery_answers.answers;

    assert.equal(persisted["MF-01"], "No", "User answer MF-01=No must not be overwritten by industry default");
    assert.equal(persisted["FC-01"], "Not using Odoo for financials", "User answer FC-01 must not be overwritten");
    // Industry-default answers for questions NOT in existing state must be present
    assert.equal(persisted["BM-01"], "Physical products only", "Industry default BM-01 must be present where user had no answer");
    assert.equal(persisted["PI-01"], "Yes", "Industry default PI-01 must be present where user had no answer");
  });

  test("industry selection is recorded in persisted runtime state", async () => {
    const project_id = makeProjectId("industry_persisted");
    _createdProjectIds.add(project_id);

    await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "retail",
    });

    const loadResult = await loadRuntimeState(project_id);
    assert.ok(loadResult.ok);
    const sel = loadResult.runtime_state.industry_selection;
    assert.ok(sel, "industry_selection must be persisted");
    assert.equal(sel.industry_id, "retail");
    assert.equal(sel.industry_name, "Retail & POS");
    assert.ok(typeof sel.selected_at === "string", "selected_at must be a string timestamp");
  });
});

// ---------------------------------------------------------------------------
// Test 5: Deferred questions are recorded correctly
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/industry/select — deferred_questions", () => {
  test("manufacturing deferred_questions does not include answered questions", async () => {
    const project_id = makeProjectId("deferred_mfg");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "manufacturing",
    });

    assert.equal(res.statusCode, 200);
    const deferred = res.body.deferred_questions;
    assert.ok(Array.isArray(deferred), "deferred_questions must be an array");

    // Questions answered by manufacturing pre-population must not appear in deferred
    const answeredByIndustry = ["BM-01", "MF-01", "PI-01", "OP-01", "RM-01", "FC-01", "MF-06"];
    for (const q of answeredByIndustry) {
      assert.ok(
        !deferred.includes(q),
        `Question ${q} should not appear in deferred_questions since it is pre-populated`
      );
    }

    // Questions NOT answered by manufacturing must appear in deferred
    // Examples: RM-02, RM-03, RM-04, SC-01, OP-03, OP-04, OP-05
    assert.ok(deferred.includes("RM-02"), "RM-02 not answered by manufacturing — must be deferred");
    assert.ok(deferred.includes("OP-03"), "OP-03 not answered by manufacturing — must be deferred");
  });

  test("services deferred_questions does not include answered questions", async () => {
    const project_id = makeProjectId("deferred_svc");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "services",
    });

    assert.equal(res.statusCode, 200);
    const deferred = res.body.deferred_questions;
    assert.ok(Array.isArray(deferred));

    const answeredByServices = ["BM-01", "RM-02", "SC-01", "RM-01", "FC-01", "BM-05"];
    for (const q of answeredByServices) {
      assert.ok(!deferred.includes(q), `${q} should not be in deferred for services`);
    }

    // MF-01 not answered by services — must be deferred
    assert.ok(deferred.includes("MF-01"), "MF-01 not answered by services — must be deferred");
    assert.ok(deferred.includes("PI-01"), "PI-01 not answered by services — must be deferred");
  });
});

// ---------------------------------------------------------------------------
// Test 6: activated_domains_preview matches computeActivatedDomains() output
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/industry/select — activated_domains_preview", () => {
  test("manufacturing activated_domains_preview matches direct computeActivatedDomains call", async () => {
    const project_id = makeProjectId("preview_mfg");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "manufacturing",
    });

    assert.equal(res.statusCode, 200);
    const preview = res.body.activated_domains_preview;
    assert.ok(Array.isArray(preview), "activated_domains_preview must be an array");

    // Compute expected output directly
    const expectedResult = computeActivatedDomains({
      answers: res.body.pre_populated_answers,
    });
    const expectedDomains = expectedResult.domains
      .filter((d) => d.activated === true)
      .map((d) => d.domain_id);

    assert.deepEqual(
      preview.slice().sort(),
      expectedDomains.slice().sort(),
      "activated_domains_preview must match computeActivatedDomains output for the same answers"
    );

    // Unconditional domains must always be present
    assert.ok(preview.includes("foundation"), "foundation must always be in preview");
    assert.ok(preview.includes("users_roles"), "users_roles must always be in preview");
    assert.ok(preview.includes("master_data"), "master_data must always be in preview");

    // Manufacturing-specific domains
    assert.ok(preview.includes("manufacturing"), "manufacturing domain must be in preview for manufacturing industry");
    assert.ok(preview.includes("inventory"), "inventory must be in preview for manufacturing");
    assert.ok(preview.includes("purchase"), "purchase must be in preview for manufacturing");
    assert.ok(preview.includes("accounting"), "accounting must be in preview for manufacturing");
  });

  test("services activated_domains_preview includes projects and hr", async () => {
    const project_id = makeProjectId("preview_svc");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "services",
    });

    assert.equal(res.statusCode, 200);
    const preview = res.body.activated_domains_preview;
    assert.ok(Array.isArray(preview));

    assert.ok(preview.includes("projects"), "projects must be in preview for services");
    assert.ok(preview.includes("hr"), "hr must be in preview for services (BM-05 > 10)");
    assert.ok(preview.includes("crm"), "crm must be in preview for services");
    assert.ok(preview.includes("accounting"), "accounting must be in preview for services");

    // manufacturing must NOT be in preview for services
    assert.ok(!preview.includes("manufacturing"), "manufacturing must not be in services preview");
  });

  test("retail activated_domains_preview includes pos and website_ecommerce", async () => {
    const project_id = makeProjectId("preview_retail");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "retail",
    });

    assert.equal(res.statusCode, 200);
    const preview = res.body.activated_domains_preview;
    assert.ok(Array.isArray(preview));

    assert.ok(preview.includes("pos"), "pos must be in preview for retail");
    assert.ok(preview.includes("website_ecommerce"), "website_ecommerce must be in preview for retail");
    assert.ok(preview.includes("inventory"), "inventory must be in preview for retail");
    assert.ok(preview.includes("crm"), "crm must be in preview for retail");
  });

  test("distribution activated_domains_preview includes purchase and inventory but not manufacturing or pos", async () => {
    const project_id = makeProjectId("preview_dist");
    _createdProjectIds.add(project_id);

    const res = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "distribution",
    });

    assert.equal(res.statusCode, 200);
    const preview = res.body.activated_domains_preview;
    assert.ok(Array.isArray(preview));

    assert.ok(preview.includes("purchase"), "purchase must be in preview for distribution");
    assert.ok(preview.includes("inventory"), "inventory must be in preview for distribution");
    assert.ok(preview.includes("crm"), "crm must be in preview for distribution");
    assert.ok(!preview.includes("manufacturing"), "manufacturing must not be in distribution preview");
    assert.ok(!preview.includes("pos"), "pos must not be in distribution preview");
  });
});

// ---------------------------------------------------------------------------
// Test 7: Pipeline/run uses persisted discovery_answers when none are passed
//
// HALT CONDITION DOCUMENTATION:
//
// The requirement states: "Pipeline/run uses persisted discovery_answers when
// none are passed." This requires handlePipelineRun in server.js to:
//   1. Accept an optional project_id in the pipeline/run payload
//   2. When discovery_answers is absent, load persisted state and use its
//      discovery_answers as the default
//
// The constraint "Additive only in server.js — no existing routes modified"
// conflicts with this requirement — handlePipelineRun is an existing route.
//
// The halt condition trigger: "Additive only in server.js — no existing routes
// modified" prevents wiring this without touching handlePipelineRun.
//
// Test 7 is implemented as: select industry → load state → manually supply
// persisted discovery_answers to pipeline/run, which is the current supported
// path. The auto-load wiring requires handlePipelineRun modification.
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/industry/select — pipeline/run uses persisted answers (manual path)", () => {
  test("persisted discovery_answers from industry select produce correct pipeline output when supplied to pipeline/run", async () => {
    const project_id = makeProjectId("pipeline_run_integration");
    _createdProjectIds.add(project_id);

    // Step 1: select industry
    const selectRes = await post("/api/pipeline/industry/select", {
      project_id,
      industry_id: "manufacturing",
    });
    assert.equal(selectRes.statusCode, 200);
    assert.equal(selectRes.body.ok, true);

    // Step 2: load persisted state
    const loadResult = await loadRuntimeState(project_id);
    assert.ok(loadResult.ok, `Load failed: ${loadResult.error}`);
    const persisted_discovery_answers = loadResult.runtime_state.discovery_answers;

    // Step 3: run pipeline with persisted answers
    const runRes = await post("/api/pipeline/run", {
      discovery_answers: persisted_discovery_answers,
      project_identity: { project_id },
    });

    assert.equal(runRes.statusCode, 200, `Pipeline run failed: ${JSON.stringify(runRes.body)}`);
    assert.equal(runRes.body.ok, true);

    const runtimeState = runRes.body.runtime_state;
    assert.ok(runtimeState, "runtime_state must be present in response");

    // Activated domains must reflect manufacturing industry selection
    const activatedDomains = runtimeState.activated_domains;
    assert.ok(activatedDomains, "activated_domains must be present");

    const domains = Array.isArray(activatedDomains)
      ? activatedDomains
      : (activatedDomains.domains || []);

    const activatedIds = domains
      .filter((d) => d.activated === true)
      .map((d) => d.domain_id);

    assert.ok(activatedIds.includes("manufacturing"), "pipeline/run with manufacturing answers must activate manufacturing");
    assert.ok(activatedIds.includes("inventory"), "pipeline/run with manufacturing answers must activate inventory");
    assert.ok(activatedIds.includes("purchase"), "pipeline/run with manufacturing answers must activate purchase");
  });
});
