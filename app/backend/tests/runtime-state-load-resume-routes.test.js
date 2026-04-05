// ---------------------------------------------------------------------------
// Runtime State Load/Resume Route Tests
// Tests for: POST /api/pipeline/state/load
//            POST /api/pipeline/state/resume
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Valid load request returns runtime_state
//   2.  Valid resume request returns runtime_state
//   3.  Malformed load request rejected
//   4.  Malformed resume request rejected
//   5.  Missing record returns truthful not-found response
//   6.  Backend envelope does not mutate runtime payload
//   7.  Route/service integration correctness
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import path from "node:path";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createAppServer } from "../server.js";
import { saveRuntimeState } from "../runtime-state-persistence-service.js";

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

let server;
let serverPort;

before(async () => {
  server = createAppServer();
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
// Test cleanup helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_RUN_ID = `route_test_${Date.now()}`;
const _createdProjectIds = new Set();

function makeProjectId(label) {
  return `${TEST_RUN_ID}_${label}`;
}

async function cleanupTestFiles() {
  const storeDir = path.resolve(__dirname, "..", "data", "runtime-states");
  for (const projectId of _createdProjectIds) {
    const safe = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const filePath = path.join(storeDir, `${safe}.json`);
    try {
      await rm(filePath, { force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ---------------------------------------------------------------------------
// Fixture factory
// ---------------------------------------------------------------------------

function makeRuntimeState(overrides = {}) {
  const project_id = overrides.project_id ?? makeProjectId("default");
  return {
    project_identity: {
      project_id,
      project_name: "Route Test Project",
      created_at: "2026-01-01T00:00:00.000Z",
      last_modified_at: "2026-01-01T00:00:00.000Z",
      customer_entity: null,
      project_owner: null,
      implementation_lead: null,
      project_mode: null,
    },
    target_context: {
      odoo_version: "19",
      edition: "enterprise",
      deployment_type: "online",
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
    },
    discovery_answers: {
      answers: { Q001: "yes" },
      answered_at: {},
      conditional_questions_skipped: [],
      framework_version: null,
      confirmed_by: null,
      confirmed_at: null,
    },
    activated_domains: { domains: [], activation_engine_version: null, activated_at: null },
    checkpoints: [],
    decisions: [],
    stage_state: [],
    deferments: [],
    previews: [],
    executions: [],
    connection_state: null,
    training_state: null,
    readiness_summary: null,
    ...overrides,
  };
}

async function trackedSave(runtimeState) {
  const projectId = runtimeState?.project_identity?.project_id;
  if (typeof projectId === "string") {
    _createdProjectIds.add(projectId);
  }
  return saveRuntimeState(runtimeState);
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function postJson(routePath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: "127.0.0.1",
      port: serverPort,
      path: routePath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
        } catch (e) {
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
// 1. Valid load request returns runtime_state
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/load — valid request", () => {
  test("returns HTTP 200 and ok: true for existing project_id", async () => {
    const projectId = makeProjectId("load_valid");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
  });

  test("returns runtime_state object in response body", async () => {
    const projectId = makeProjectId("load_rs_present");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(res.body.runtime_state !== null && typeof res.body.runtime_state === "object");
  });

  test("returned runtime_state.project_identity.project_id matches requested project_id", async () => {
    const projectId = makeProjectId("load_pid_match");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(res.body.runtime_state.project_identity.project_id, projectId);
  });

  test("returns saved_at as a valid ISO 8601 string", async () => {
    const projectId = makeProjectId("load_saved_at");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(typeof res.body.saved_at, "string");
    assert.ok(!Number.isNaN(Date.parse(res.body.saved_at)));
  });

  test("returned discovery_answers round-trips without drift", async () => {
    const projectId = makeProjectId("load_da_rt");
    const state = makeRuntimeState({ project_id: projectId });
    await trackedSave(state);

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.deepStrictEqual(
      res.body.runtime_state.discovery_answers,
      state.discovery_answers
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Valid resume request returns runtime_state
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/resume — valid request", () => {
  test("returns HTTP 200 and ok: true for existing project_id", async () => {
    const projectId = makeProjectId("resume_valid");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
  });

  test("returns runtime_state object in response body", async () => {
    const projectId = makeProjectId("resume_rs_present");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.ok(res.body.runtime_state !== null && typeof res.body.runtime_state === "object");
  });

  test("returned runtime_state.project_identity.project_id matches requested project_id", async () => {
    const projectId = makeProjectId("resume_pid_match");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.strictEqual(res.body.runtime_state.project_identity.project_id, projectId);
  });

  test("returns saved_at as a valid ISO 8601 string", async () => {
    const projectId = makeProjectId("resume_saved_at");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.strictEqual(typeof res.body.saved_at, "string");
    assert.ok(!Number.isNaN(Date.parse(res.body.saved_at)));
  });

  test("resume and load return the same runtime_state for the same project_id", async () => {
    const projectId = makeProjectId("resume_eq_load");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const loadRes = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const resumeRes = await postJson("/api/pipeline/state/resume", { project_id: projectId });

    assert.deepStrictEqual(loadRes.body.runtime_state, resumeRes.body.runtime_state);
  });
});

// ---------------------------------------------------------------------------
// 3. Malformed load request rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/load — malformed request rejected", () => {
  test("returns HTTP 400 and ok: false when project_id is missing", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(typeof res.body.error, "string");
  });

  test("returns HTTP 400 and ok: false when project_id is null", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: null });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when project_id is empty string", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: "" });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when project_id is whitespace only", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: "   " });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when project_id is a number", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: 42 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when project_id is an array", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: ["id"] });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("error field is present and non-empty on malformed rejection", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.ok(typeof res.body.error === "string" && res.body.error.length > 0);
  });

  test("runtime_state is not present in malformed rejection response", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    assert.ok(!("runtime_state" in res.body));
  });
});

// ---------------------------------------------------------------------------
// 4. Malformed resume request rejected
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/resume — malformed request rejected", () => {
  test("returns HTTP 400 and ok: false when project_id is missing", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(typeof res.body.error, "string");
  });

  test("returns HTTP 400 and ok: false when project_id is null", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: null });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when project_id is empty string", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: "" });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when project_id is whitespace only", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: "   " });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("returns HTTP 400 and ok: false when project_id is a number", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: 42 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("error field is present and non-empty on malformed rejection", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.ok(typeof res.body.error === "string" && res.body.error.length > 0);
  });

  test("runtime_state is not present in malformed rejection response", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    assert.ok(!("runtime_state" in res.body));
  });
});

// ---------------------------------------------------------------------------
// 5. Missing record returns truthful not-found response
// ---------------------------------------------------------------------------

describe("missing record — truthful not-found response", () => {
  test("load returns HTTP 404 for unknown project_id", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_missing"),
    });
    assert.strictEqual(res.status, 404);
  });

  test("load returns ok: false for unknown project_id", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_missing_ok"),
    });
    assert.strictEqual(res.body.ok, false);
  });

  test("load returns not_found: true for unknown project_id", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_missing_nf"),
    });
    assert.strictEqual(res.body.not_found, true);
  });

  test("load not-found response contains a non-empty error string", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_missing_err"),
    });
    assert.ok(typeof res.body.error === "string" && res.body.error.length > 0);
  });

  test("load not-found response does not contain runtime_state", async () => {
    const res = await postJson("/api/pipeline/state/load", {
      project_id: makeProjectId("load_missing_rs"),
    });
    assert.ok(!("runtime_state" in res.body));
  });

  test("resume returns HTTP 404 for unknown project_id", async () => {
    const res = await postJson("/api/pipeline/state/resume", {
      project_id: makeProjectId("resume_missing"),
    });
    assert.strictEqual(res.status, 404);
  });

  test("resume returns ok: false for unknown project_id", async () => {
    const res = await postJson("/api/pipeline/state/resume", {
      project_id: makeProjectId("resume_missing_ok"),
    });
    assert.strictEqual(res.body.ok, false);
  });

  test("resume returns not_found: true for unknown project_id", async () => {
    const res = await postJson("/api/pipeline/state/resume", {
      project_id: makeProjectId("resume_missing_nf"),
    });
    assert.strictEqual(res.body.not_found, true);
  });

  test("resume not-found response does not contain runtime_state", async () => {
    const res = await postJson("/api/pipeline/state/resume", {
      project_id: makeProjectId("resume_missing_rs"),
    });
    assert.ok(!("runtime_state" in res.body));
  });
});

// ---------------------------------------------------------------------------
// 6. Backend envelope does not mutate runtime payload
// ---------------------------------------------------------------------------

describe("backend envelope does not mutate runtime payload", () => {
  test("load response envelope keys on success are exactly ok, runtime_state, saved_at", async () => {
    const projectId = makeProjectId("load_envelope_keys");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const keys = Object.keys(res.body).sort();
    assert.deepStrictEqual(keys, ["ok", "runtime_state", "saved_at"]);
  });

  test("resume response envelope keys on success are exactly ok, runtime_state, saved_at", async () => {
    const projectId = makeProjectId("resume_envelope_keys");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    const keys = Object.keys(res.body).sort();
    assert.deepStrictEqual(keys, ["ok", "runtime_state", "saved_at"]);
  });

  test("load response runtime_state is not wrapped in a nested envelope", async () => {
    const projectId = makeProjectId("load_no_double_wrap");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.ok(!("runtime_state" in res.body.runtime_state),
      "runtime_state must not be double-wrapped");
  });

  test("resume response runtime_state is not wrapped in a nested envelope", async () => {
    const projectId = makeProjectId("resume_no_double_wrap");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const res = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.ok(!("runtime_state" in res.body.runtime_state),
      "runtime_state must not be double-wrapped");
  });

  test("load response runtime_state contains persisted fields unchanged", async () => {
    const projectId = makeProjectId("load_payload_intact");
    const state = makeRuntimeState({ project_id: projectId });
    state.discovery_answers.answers = { Q001: "alpha", Q002: "beta" };
    await trackedSave(state);

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.deepStrictEqual(
      res.body.runtime_state.discovery_answers.answers,
      { Q001: "alpha", Q002: "beta" }
    );
  });

  test("resume response runtime_state contains persisted fields unchanged", async () => {
    const projectId = makeProjectId("resume_payload_intact");
    const state = makeRuntimeState({ project_id: projectId });
    state.discovery_answers.answers = { Q001: "gamma" };
    await trackedSave(state);

    const res = await postJson("/api/pipeline/state/resume", { project_id: projectId });
    assert.deepStrictEqual(
      res.body.runtime_state.discovery_answers.answers,
      { Q001: "gamma" }
    );
  });

  test("computed keys are absent from load response runtime_state (stripped at persistence layer)", async () => {
    const projectId = makeProjectId("load_no_computed");
    const state = makeRuntimeState({ project_id: projectId });
    // Add computed keys to the save input — they should be stripped before persistence
    state.readiness_state = { go_live_readiness: "not_ready" };
    state.blockers = { active_blockers: [] };
    await trackedSave(state);

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    const rs = res.body.runtime_state;
    assert.ok(!("readiness_state" in rs), "readiness_state must not appear in loaded payload");
    assert.ok(!("blockers" in rs), "blockers must not appear in loaded payload");
  });
});

// ---------------------------------------------------------------------------
// 7. Route/service integration correctness
// ---------------------------------------------------------------------------

describe("route/service integration correctness", () => {
  test("load route returns same runtime_state as direct loadRuntimeState call", async () => {
    const projectId = makeProjectId("integration_load");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const { loadRuntimeState: directLoad } = await import("../runtime-state-persistence-service.js");
    const directResult = await directLoad(projectId);
    const routeRes = await postJson("/api/pipeline/state/load", { project_id: projectId });

    assert.strictEqual(routeRes.body.ok, true);
    assert.deepStrictEqual(routeRes.body.runtime_state, directResult.runtime_state);
  });

  test("resume route returns same runtime_state as direct resumeRuntimeState call", async () => {
    const projectId = makeProjectId("integration_resume");
    await trackedSave(makeRuntimeState({ project_id: projectId }));

    const { resumeRuntimeState: directResume } = await import("../runtime-state-persistence-service.js");
    const directResult = await directResume(projectId);
    const routeRes = await postJson("/api/pipeline/state/resume", { project_id: projectId });

    assert.strictEqual(routeRes.body.ok, true);
    assert.deepStrictEqual(routeRes.body.runtime_state, directResult.runtime_state);
  });

  test("two distinct project_ids return independent runtime_states via load route", async () => {
    const projectId1 = makeProjectId("integration_distinct_a");
    const projectId2 = makeProjectId("integration_distinct_b");

    const state1 = makeRuntimeState({ project_id: projectId1 });
    state1.discovery_answers.answers = { Q001: "alpha" };
    const state2 = makeRuntimeState({ project_id: projectId2 });
    state2.discovery_answers.answers = { Q001: "beta" };

    await trackedSave(state1);
    await trackedSave(state2);

    const res1 = await postJson("/api/pipeline/state/load", { project_id: projectId1 });
    const res2 = await postJson("/api/pipeline/state/load", { project_id: projectId2 });

    assert.strictEqual(res1.body.runtime_state.discovery_answers.answers.Q001, "alpha");
    assert.strictEqual(res2.body.runtime_state.discovery_answers.answers.Q001, "beta");
  });

  test("overwritten save is reflected in subsequent load route response", async () => {
    const projectId = makeProjectId("integration_overwrite");

    const state1 = makeRuntimeState({ project_id: projectId });
    state1.discovery_answers.answers = { Q001: "first" };
    await trackedSave(state1);

    const state2 = makeRuntimeState({ project_id: projectId });
    state2.discovery_answers.answers = { Q001: "second" };
    await trackedSave(state2);

    const res = await postJson("/api/pipeline/state/load", { project_id: projectId });
    assert.strictEqual(res.body.runtime_state.discovery_answers.answers.Q001, "second");
  });
});
