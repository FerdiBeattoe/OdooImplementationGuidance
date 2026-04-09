// ---------------------------------------------------------------------------
// Checkpoint Confirm Route Tests
// app/backend/tests/checkpoint-confirm-route.test.js
// ---------------------------------------------------------------------------
//
// Covers: POST /api/pipeline/checkpoint/confirm
//
// Required tests:
//   1.  valid confirmation sets status and persists
//   2.  missing project_id rejected
//   3.  missing checkpoint_id rejected
//   4.  missing evidence rejected
//   5.  missing actor rejected
//   6.  non-existent project_id rejected
//   7.  checkpoint_id not found in checkpoints rejected
//   8.  checkpoint with validation_source !== "User_Confirmed" rejected
//   9.  status other than "Complete" rejected
//   10. round-trip: confirm then loadRuntimeState shows status persisted
//   11. confirm then pipeline run shows carry-over:
//       - checkpoint is Complete
//       - dependency_unmet blocker referencing that checkpoint is cleared
//
// Governance:
//   - Only User_Confirmed checkpoints may use this route.
//   - Only "Complete" may be set by this route.
//   - evidence and actor are mandatory for auditability.
//   - No database writes. No engine file modifications.
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

const TEST_RUN_ID        = `cp_confirm_${Date.now()}`;
const _createdProjectIds = new Set();

function makeProjectId(label) {
  return `${TEST_RUN_ID}_${label}`;
}

async function cleanupTestFiles() {
  const storeDir = path.resolve(__dirname, "..", "data", "runtime-states");
  for (const projectId of _createdProjectIds) {
    const safe     = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const filePath = path.join(storeDir, `${safe}.json`);
    try {
      await rm(filePath, { force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function postJson(routePath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: "127.0.0.1",
      port:     serverPort,
      path:     routePath,
      method:   "POST",
      headers:  {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    };

    const req = httpRequest(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          parsed = null;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Minimal runtime_state fixture with a checkpoints container that includes
// both a User_Confirmed checkpoint (FND-FOUND-005) and a non-User_Confirmed
// checkpoint (FND-DREQ-002 has validation_source "Both") for rejection tests.
function makeRuntimeState(projectId, overrides = {}) {
  _createdProjectIds.add(projectId);
  return {
    project_identity: {
      project_id:           projectId,
      project_name:         "Checkpoint Confirm Route Test",
      created_at:           "2026-01-01T00:00:00.000Z",
      last_modified_at:     "2026-01-01T00:00:00.000Z",
      customer_entity:      null,
      project_owner:        null,
      implementation_lead:  null,
      project_mode:         null,
    },
    target_context: {
      odoo_version:                "19",
      edition:                     "enterprise",
      deployment_type:             "online",
      primary_country:             null,
      primary_currency:            null,
      multi_company:               false,
      multi_currency:              false,
      odoosh_branch_target:        null,
      odoosh_environment_type:     null,
      connection_mode:             null,
      connection_status:           null,
      connection_target_id:        null,
      connection_capability_note:  null,
    },
    discovery_answers: {
      answers:                        {},
      answered_at:                    {},
      conditional_questions_skipped:  [],
      framework_version:              "1.0",
      confirmed_by:                   null,
      confirmed_at:                   null,
    },
    // checkpoints in standard container shape
    checkpoints: {
      records: [
        {
          checkpoint_id:              "FND-FOUND-005",
          domain:                     "foundation",
          checkpoint_class:           "Foundational",
          validation_source:          "User_Confirmed",
          status:                     "Not_Started",
          execution_relevance:        "Informational",
          safety_class:               "Not_Applicable",
          dependencies:               [],
          preview_required:           false,
          downstream_impact_summary:  null,
        },
        {
          checkpoint_id:              "FND-DREQ-002",
          domain:                     "foundation",
          checkpoint_class:           "Domain_Required",
          validation_source:          "Both",
          status:                     "Not_Started",
          execution_relevance:        "Executable",
          safety_class:               "Safe",
          dependencies:               ["FND-FOUND-002", "FND-FOUND-005"],
          preview_required:           true,
          downstream_impact_summary:  null,
        },
      ],
      engine_version:  "1.0.0",
      generated_at:    "2026-01-01T00:00:00.000Z",
    },
    checkpoint_statuses:      null,
    checkpoint_confirmations: null,
    activated_domains:        { domains: [], activation_engine_version: null, activated_at: null },
    decisions:                [],
    stage_state:              [],
    deferments:               [],
    previews:                 [],
    executions:               [],
    connection_state:         null,
    training_state:           null,
    readiness_summary:        null,
    ...overrides,
  };
}

async function seedState(projectId, overrides = {}) {
  const state = makeRuntimeState(projectId, overrides);
  const result = await saveRuntimeState(state);
  assert.strictEqual(result.ok, true, `seed save must succeed for ${projectId}`);
  return state;
}

// Default valid confirm payload
function validPayload(projectId, checkpointId = "FND-FOUND-005") {
  return {
    project_id:    projectId,
    checkpoint_id: checkpointId,
    status:        "Complete",
    evidence:      "Finance team confirmed company currency is AUD as required.",
    actor:         "jane.smith@acme.com",
  };
}

// ---------------------------------------------------------------------------
// 1. Valid confirmation sets status and persists
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — valid confirmation", () => {
  test("returns HTTP 200 and ok: true for a valid User_Confirmed checkpoint", async () => {
    const projectId = makeProjectId("valid_confirm");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", validPayload(projectId));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
  });

  test("response includes runtime_state", async () => {
    const projectId = makeProjectId("valid_rs_present");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", validPayload(projectId));
    assert.ok(res.body.runtime_state !== null && typeof res.body.runtime_state === "object");
  });

  test("checkpoint_statuses in returned runtime_state contains confirmed checkpoint as Complete", async () => {
    const projectId = makeProjectId("valid_status_set");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", validPayload(projectId));
    assert.strictEqual(res.body.runtime_state.checkpoint_statuses["FND-FOUND-005"], "Complete");
  });

  test("checkpoint_confirmations in returned runtime_state records evidence and actor", async () => {
    const projectId = makeProjectId("valid_meta_recorded");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", validPayload(projectId));
    const conf = res.body.runtime_state.checkpoint_confirmations["FND-FOUND-005"];
    assert.ok(conf !== null && typeof conf === "object");
    assert.strictEqual(conf.evidence, "Finance team confirmed company currency is AUD as required.");
    assert.strictEqual(conf.actor, "jane.smith@acme.com");
    assert.strictEqual(typeof conf.confirmed_at, "string");
    assert.ok(!Number.isNaN(Date.parse(conf.confirmed_at)));
  });
});

// ---------------------------------------------------------------------------
// 2. Missing project_id rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — missing project_id rejected", () => {
  test("returns HTTP 400 and ok: false when project_id is absent", async () => {
    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "Some evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(typeof res.body.error, "string");
  });

  test("returns HTTP 400 and ok: false when project_id is empty string", async () => {
    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    "",
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "Some evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 3. Missing checkpoint_id rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — missing checkpoint_id rejected", () => {
  test("returns HTTP 400 and ok: false when checkpoint_id is absent", async () => {
    const projectId = makeProjectId("missing_cp_id");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id: projectId,
      status:     "Complete",
      evidence:   "Some evidence.",
      actor:      "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(typeof res.body.error, "string");
  });

  test("returns HTTP 400 and ok: false when checkpoint_id is empty string", async () => {
    const projectId = makeProjectId("empty_cp_id");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "",
      status:        "Complete",
      evidence:      "Some evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 4. Missing evidence rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — missing evidence rejected", () => {
  test("returns HTTP 400 and ok: false when evidence is absent", async () => {
    const projectId = makeProjectId("missing_evidence");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(typeof res.body.error, "string");
  });

  test("returns HTTP 400 and ok: false when evidence is empty string", async () => {
    const projectId = makeProjectId("empty_evidence");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when evidence is whitespace only", async () => {
    const projectId = makeProjectId("ws_evidence");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "   ",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 5. Missing actor rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — missing actor rejected", () => {
  test("returns HTTP 400 and ok: false when actor is absent", async () => {
    const projectId = makeProjectId("missing_actor");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "Valid evidence.",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(typeof res.body.error, "string");
  });

  test("returns HTTP 400 and ok: false when actor is empty string", async () => {
    const projectId = makeProjectId("empty_actor");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "Valid evidence.",
      actor:         "",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 6. Non-existent project_id rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — non-existent project_id rejected", () => {
  test("returns HTTP 404 and ok: false when project has no persisted state", async () => {
    const projectId = makeProjectId("no_such_project_xyzabc");

    const res = await postJson("/api/pipeline/checkpoint/confirm", validPayload(projectId));
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(res.body.not_found, true);
    assert.strictEqual(typeof res.body.error, "string");
  });
});

// ---------------------------------------------------------------------------
// 7. checkpoint_id not found in checkpoints rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — checkpoint_id not found rejected", () => {
  test("returns HTTP 400 and ok: false when checkpoint_id does not exist in state", async () => {
    const projectId = makeProjectId("cp_not_found");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "DOES-NOT-EXIST-999",
      status:        "Complete",
      evidence:      "Valid evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(typeof res.body.error, "string");
  });
});

// ---------------------------------------------------------------------------
// 8. Checkpoint with validation_source !== "User_Confirmed" rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — non-User_Confirmed checkpoint rejected", () => {
  test("returns HTTP 400 and ok: false for checkpoint with validation_source Both", async () => {
    const projectId = makeProjectId("non_user_confirmed");
    await seedState(projectId);

    // FND-DREQ-002 has validation_source "Both" in the fixture
    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-DREQ-002",
      status:        "Complete",
      evidence:      "Valid evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(typeof res.body.error === "string" && res.body.error.length > 0);
  });

  test("error message references the route restriction to User_Confirmed", async () => {
    const projectId = makeProjectId("non_uc_error_msg");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-DREQ-002",
      status:        "Complete",
      evidence:      "Valid evidence.",
      actor:         "actor@example.com",
    });
    assert.ok(res.body.error.toLowerCase().includes("user_confirmed"));
  });
});

// ---------------------------------------------------------------------------
// 9. Status other than "Complete" rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/checkpoint/confirm — status other than Complete rejected", () => {
  test("returns HTTP 400 and ok: false when status is In_Progress", async () => {
    const projectId = makeProjectId("status_in_progress");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "In_Progress",
      evidence:      "Valid evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(typeof res.body.error, "string");
  });

  test("returns HTTP 400 and ok: false when status is Not_Started", async () => {
    const projectId = makeProjectId("status_not_started");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Not_Started",
      evidence:      "Valid evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when status is Deferred", async () => {
    const projectId = makeProjectId("status_deferred");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Deferred",
      evidence:      "Valid evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when status is absent", async () => {
    const projectId = makeProjectId("status_absent");
    await seedState(projectId);

    const res = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      evidence:      "Valid evidence.",
      actor:         "actor@example.com",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 10. Round-trip: confirm then loadRuntimeState shows status persisted
// ---------------------------------------------------------------------------

describe("round-trip: confirm then loadRuntimeState shows status persisted", () => {
  test("checkpoint_statuses[FND-FOUND-005] is Complete after confirm round-trip", async () => {
    const projectId = makeProjectId("rt_status_persisted");
    await seedState(projectId);

    // Confirm via route
    const confirmRes = await postJson(
      "/api/pipeline/checkpoint/confirm",
      validPayload(projectId)
    );
    assert.strictEqual(confirmRes.body.ok, true);

    // Load directly from persistence
    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(loadResult.ok, true);
    assert.strictEqual(loadResult.runtime_state.checkpoint_statuses["FND-FOUND-005"], "Complete");
  });

  test("confirmation metadata is persisted and survives a load round-trip", async () => {
    const projectId = makeProjectId("rt_meta_persisted");
    await seedState(projectId);

    await postJson("/api/pipeline/checkpoint/confirm", validPayload(projectId));

    const loadResult = await loadRuntimeState(projectId);
    const conf = loadResult.runtime_state.checkpoint_confirmations["FND-FOUND-005"];
    assert.ok(conf !== null && typeof conf === "object");
    assert.strictEqual(conf.evidence, "Finance team confirmed company currency is AUD as required.");
    assert.strictEqual(conf.actor, "jane.smith@acme.com");
    assert.strictEqual(typeof conf.confirmed_at, "string");
  });

  test("second confirm call overwrites previous checkpoint_statuses entry cleanly", async () => {
    const projectId = makeProjectId("rt_overwrite");
    await seedState(projectId);

    await postJson("/api/pipeline/checkpoint/confirm", validPayload(projectId));
    await postJson("/api/pipeline/checkpoint/confirm", {
      ...validPayload(projectId),
      evidence: "Updated evidence after re-review.",
      actor:    "updated-actor@acme.com",
    });

    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(loadResult.runtime_state.checkpoint_statuses["FND-FOUND-005"], "Complete");
    assert.strictEqual(
      loadResult.runtime_state.checkpoint_confirmations["FND-FOUND-005"].evidence,
      "Updated evidence after re-review."
    );
  });
});

// ---------------------------------------------------------------------------
// Industry select -> pipeline run -> checkpoint confirm flow
// ---------------------------------------------------------------------------

describe("industry select -> pipeline run -> checkpoint confirm", () => {
  test("checkpoint confirmation no longer fails with not-found errors after industry select", async () => {
    const projectId = makeProjectId("industry_flow_success");
    _createdProjectIds.add(projectId);

    const industryRes = await postJson("/api/pipeline/industry/select", {
      project_id:  projectId,
      industry_id: "manufacturing",
    });
    assert.strictEqual(industryRes.status, 200, "industry select must succeed");
    assert.strictEqual(industryRes.body.ok, true);

    const runRes = await postJson("/api/pipeline/run", { project_id: projectId });
    assert.strictEqual(runRes.status, 200, "pipeline run must succeed");
    assert.strictEqual(runRes.body.ok, true);

    const confirmFnd001 = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-001",
      status:        "Complete",
      evidence:      "Implementation lead confirmed foundational scope.",
      actor:         "lead@example.com",
    });
    assert.strictEqual(
      confirmFnd001.status,
      400,
      "FND-FOUND-001 remains Both-sourced and must fail the validation_source gate"
    );
    assert.ok(
      String(confirmFnd001.body?.error || "").includes("validation_source"),
      "error must reference the governance restriction"
    );
    assert.ok(
      !String(confirmFnd001.body?.error || "").includes(
        'checkpoint_id "FND-FOUND-001" not found'
      ),
      "checkpoint lookup must succeed even when governance blocks confirmation"
    );

    const confirmFnd005 = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "Implementation lead confirmed multi-company readiness.",
      actor:         "lead@example.com",
    });
    assert.strictEqual(confirmFnd005.status, 200, "User_Confirmed checkpoint must succeed");
    assert.strictEqual(confirmFnd005.body.ok, true);
    assert.strictEqual(
      confirmFnd005.body.runtime_state.checkpoint_statuses["FND-FOUND-005"],
      "Complete"
    );
  });
});

// ---------------------------------------------------------------------------
// 11. Confirm then pipeline run shows carry-over
// ---------------------------------------------------------------------------

describe("confirm then pipeline run shows carry-over", () => {
  // Build a full discovery_answers fixture that covers Foundation checkpoints.
  function makeDiscoveryAnswers() {
    return {
      answers: {
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
      },
      answered_at:                   {},
      conditional_questions_skipped: [],
      framework_version:             "1.0",
      confirmed_by:                  null,
      confirmed_at:                  null,
    };
  }

  test("pipeline run with carried-over FND-FOUND-005 shows checkpoint as Complete", async () => {
    const projectId = makeProjectId("carryover_status");
    _createdProjectIds.add(projectId);

    // Step 1: run pipeline to produce a real runtime_state with actual checkpoints
    const runRes = await postJson("/api/pipeline/run", {
      project_identity: {
        project_id:          projectId,
        project_name:        "Carry-over Test Project",
        created_at:          "2026-01-01T00:00:00.000Z",
        last_modified_at:    "2026-01-01T00:00:00.000Z",
        customer_entity:     null,
        project_owner:       null,
        implementation_lead: null,
        project_mode:        null,
      },
      discovery_answers: makeDiscoveryAnswers(),
    });
    assert.strictEqual(runRes.body.ok, true, "initial pipeline run must succeed");

    // Step 2: save the runtime_state so the confirm route can load it
    const saveResult = await saveRuntimeState(runRes.body.runtime_state);
    assert.strictEqual(saveResult.ok, true, "save after pipeline run must succeed");

    // Step 3: confirm FND-FOUND-005 via the governed route
    const confirmRes = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "Finance team signed off on functional scope document.",
      actor:         "lead@acme.com",
    });
    assert.strictEqual(confirmRes.body.ok, true, "confirm route must succeed");

    // Step 4: load the persisted state and re-run the pipeline with checkpoint_statuses carry-over
    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(loadResult.ok, true, "load after confirm must succeed");

    const reRunRes = await postJson("/api/pipeline/run", {
      project_identity:   runRes.body.runtime_state.project_identity,
      discovery_answers:  makeDiscoveryAnswers(),
      checkpoint_statuses: loadResult.runtime_state.checkpoint_statuses,
    });
    assert.strictEqual(reRunRes.body.ok, true, "re-run with carry-over must succeed");

    // FND-FOUND-005 must be Complete in the re-run output
    const checkpoints = reRunRes.body.runtime_state.checkpoints;
    // checkpoints may be an array (flat from pipeline output) or container
    const records = Array.isArray(checkpoints)
      ? checkpoints
      : (Array.isArray(checkpoints?.records) ? checkpoints.records : []);

    const fndFound005 = records.find((cp) => cp.checkpoint_id === "FND-FOUND-005");
    assert.ok(fndFound005 !== undefined, "FND-FOUND-005 must appear in re-run checkpoint records");
    assert.strictEqual(
      fndFound005.status,
      "Complete",
      "FND-FOUND-005 must be Complete after carry-over"
    );
  });

  test("pipeline run with carried-over FND-FOUND-005 clears dependency_unmet blocker on FND-DREQ-002", async () => {
    const projectId = makeProjectId("carryover_blocker_clear");
    _createdProjectIds.add(projectId);

    // Step 1: run pipeline
    const runRes = await postJson("/api/pipeline/run", {
      project_identity: {
        project_id:          projectId,
        project_name:        "Blocker Clear Test Project",
        created_at:          "2026-01-01T00:00:00.000Z",
        last_modified_at:    "2026-01-01T00:00:00.000Z",
        customer_entity:     null,
        project_owner:       null,
        implementation_lead: null,
        project_mode:        null,
      },
      discovery_answers: makeDiscoveryAnswers(),
    });
    assert.strictEqual(runRes.body.ok, true);

    // Step 2: save
    const saveResult = await saveRuntimeState(runRes.body.runtime_state);
    assert.strictEqual(saveResult.ok, true);

    // Step 3: confirm FND-FOUND-005
    const confirmRes = await postJson("/api/pipeline/checkpoint/confirm", {
      project_id:    projectId,
      checkpoint_id: "FND-FOUND-005",
      status:        "Complete",
      evidence:      "Signed off.",
      actor:         "lead@acme.com",
    });
    assert.strictEqual(confirmRes.body.ok, true);

    // Step 4: load and re-run with carry-over
    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(loadResult.ok, true);

    const reRunRes = await postJson("/api/pipeline/run", {
      project_identity:    runRes.body.runtime_state.project_identity,
      discovery_answers:   makeDiscoveryAnswers(),
      checkpoint_statuses: loadResult.runtime_state.checkpoint_statuses,
    });
    assert.strictEqual(reRunRes.body.ok, true);

    // Verify no dependency_unmet blocker on FND-DREQ-002 referencing FND-FOUND-005
    const blockers      = reRunRes.body.runtime_state.blockers;
    const activeBlockers = Array.isArray(blockers?.active_blockers) ? blockers.active_blockers : [];

    const staleBlocker = activeBlockers.find(
      (b) =>
        b.source_checkpoint_id   === "FND-DREQ-002" &&
        b.blocker_type           === "dependency_unmet" &&
        b.blocking_checkpoint_id === "FND-FOUND-005"
    );
    assert.strictEqual(
      staleBlocker,
      undefined,
      "FND-DREQ-002 must not have a dependency_unmet blocker for FND-FOUND-005 when FND-FOUND-005 is Complete"
    );
  });
});
