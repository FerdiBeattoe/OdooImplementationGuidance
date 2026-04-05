// ---------------------------------------------------------------------------
// Backend Contract Hardening Tests
// app/backend/tests/contract-hardening.test.js
// ---------------------------------------------------------------------------
// Confirms fail-closed behavior under malformed, hostile, and
// boundary-stressing inputs across all backend boundaries.
//
// Targets:
//   - runPipelineService (direct)
//   - saveRuntimeState / loadRuntimeState (direct)
//   - POST /api/pipeline/run (HTTP route)
//   - POST /api/pipeline/state/load (HTTP route)
//   - POST /api/pipeline/state/resume (HTTP route)
//
// Invariants enforced throughout:
//   I1  Rejected requests never include runtime_state in envelope.
//   I2  Error envelopes have exactly {ok, error} — no extra keys.
//   I3  Success envelopes have exactly the keys specified by the contract.
//   I4  Non-plain-object inputs do not silently coerce to success at boundaries.
//   I5  Services never throw through the boundary — exceptions are gaps.
//   I6  Same hostile input always produces the same rejection outcome.
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import path from "node:path";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { runPipelineService } from "../pipeline-service.js";
import {
  saveRuntimeState,
  loadRuntimeState,
} from "../runtime-state-persistence-service.js";
import { createAppServer } from "../server.js";
import { createDiscoveryAnswers } from "../../shared/runtime-state-contract.js";

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
// File cleanup tracking
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const TEST_RUN_ID      = `hardening_${Date.now()}`;
const _createdProjectIds = new Set();

function makeProjectId(label) {
  return `${TEST_RUN_ID}_${label}`;
}

async function cleanupTestFiles() {
  const storeDir = path.resolve(__dirname, "..", "data", "runtime-states");
  for (const projectId of _createdProjectIds) {
    const safe     = projectId.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const filePath = path.join(storeDir, `${safe}.json`);
    try { await rm(filePath, { force: true }); } catch { /* ignore */ }
  }
}

async function trackedSave(runtimeState) {
  const projectId = runtimeState?.project_identity?.project_id;
  if (typeof projectId === "string") _createdProjectIds.add(projectId);
  return saveRuntimeState(runtimeState);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeMinimalAnswers() {
  const da = createDiscoveryAnswers({ framework_version: "1.0" });
  da.answers = {
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
  };
  return da;
}

function makeBaseRuntimeState(label) {
  const project_id = makeProjectId(label);
  _createdProjectIds.add(project_id);
  return {
    project_identity: {
      project_id,
      project_name:         "Hardening Test",
      created_at:           "2026-01-01T00:00:00.000Z",
      last_modified_at:     "2026-01-01T00:00:00.000Z",
      customer_entity:      null,
      project_owner:        null,
      implementation_lead:  null,
      project_mode:         null,
    },
    target_context: {
      odoo_version:               "19",
      edition:                    "enterprise",
      deployment_type:            "online",
      primary_country:            null,
      primary_currency:           null,
      multi_company:              false,
      multi_currency:             false,
      odoosh_branch_target:       null,
      odoosh_environment_type:    null,
      connection_mode:            null,
      connection_status:          null,
      connection_target_id:       null,
      connection_capability_note: null,
    },
    discovery_answers: {
      answers:                       { Q001: "yes" },
      answered_at:                   {},
      conditional_questions_skipped: [],
      framework_version:             null,
      confirmed_by:                  null,
      confirmed_at:                  null,
    },
    activated_domains: { domains: [], activation_engine_version: null, activated_at: null },
    checkpoints:       [],
    decisions:         [],
    stage_state:       [],
    deferments:        [],
    previews:          [],
    executions:        [],
    connection_state:  null,
    training_state:    null,
    readiness_summary: null,
  };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function postJson(routePath, body) {
  return postRaw(routePath, JSON.stringify(body));
}

function postRaw(routePath, rawBody, contentType = "application/json") {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(rawBody ?? "", "utf8");
    const options = {
      hostname: "127.0.0.1",
      port:     serverPort,
      path:     routePath,
      method:   "POST",
      headers:  {
        "Content-Type":   contentType,
        "Content-Length": bodyBuf.length,
      },
    };
    const req = httpRequest(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        let parsed;
        try { parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
        catch { parsed = null; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("error", reject);
    req.write(bodyBuf);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Assertion helper: confirms a failure envelope (I1, I2)
// ---------------------------------------------------------------------------

function assertFailureEnvelope(result) {
  assert.strictEqual(result.ok, false, "ok must be false");
  assert.ok(
    typeof result.error === "string" && result.error.length > 0,
    "error must be a non-empty string"
  );
  assert.ok(
    !("runtime_state" in result),
    "runtime_state must not appear in rejection envelope (I1)"
  );
}

// ---------------------------------------------------------------------------
// 1. Pipeline service — exotic non-standard types as discovery_answers (I4, I5)
// ---------------------------------------------------------------------------

describe("pipeline-service — exotic types as discovery_answers", () => {
  test("function as discovery_answers — rejects with ok: false (typeof !== object)", () => {
    // eslint-disable-next-line no-unused-vars
    const result = runPipelineService({ discovery_answers: () => {} });
    assertFailureEnvelope(result);
  });

  test("Symbol as discovery_answers — rejects with ok: false (typeof symbol !== object)", () => {
    const result = runPipelineService({ discovery_answers: Symbol("x") });
    assertFailureEnvelope(result);
  });

  test("BigInt as discovery_answers — rejects with ok: false", () => {
    const result = runPipelineService({ discovery_answers: BigInt(42) });
    assertFailureEnvelope(result);
  });

  test("Map as discovery_answers — does not throw, envelope is truthful (I5)", () => {
    // Map passes isPlainObject (typeof object, not null, not array).
    // This test documents whether the boundary silently accepts it.
    let result;
    assert.doesNotThrow(() => {
      result = runPipelineService({ discovery_answers: new Map() });
    });
    if (result.ok === false) {
      assert.ok(!("runtime_state" in result), "I1: no runtime_state on rejection");
    } else {
      assert.ok("runtime_state" in result, "I3: success must include runtime_state");
    }
  });

  test("Map as discovery_answers — deterministic outcome on repeated calls (I6)", () => {
    let r1, r2;
    assert.doesNotThrow(() => { r1 = runPipelineService({ discovery_answers: new Map() }); });
    assert.doesNotThrow(() => { r2 = runPipelineService({ discovery_answers: new Map() }); });
    assert.strictEqual(r1.ok, r2.ok, "I6: identical input → identical ok outcome");
  });

  test("Set as discovery_answers — does not throw, envelope is truthful (I5)", () => {
    let result;
    assert.doesNotThrow(() => {
      result = runPipelineService({ discovery_answers: new Set() });
    });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(!("runtime_state" in result));
    else                      assert.ok("runtime_state" in result);
  });

  test("Date as discovery_answers — does not throw, envelope is truthful (I5)", () => {
    let result;
    assert.doesNotThrow(() => {
      result = runPipelineService({ discovery_answers: new Date() });
    });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(!("runtime_state" in result));
    else                      assert.ok("runtime_state" in result);
  });

  test("RegExp as discovery_answers — does not throw, envelope is truthful (I5)", () => {
    let result;
    assert.doesNotThrow(() => {
      result = runPipelineService({ discovery_answers: /pattern/ });
    });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(!("runtime_state" in result));
    else                      assert.ok("runtime_state" in result);
  });

  test("null-prototype object as discovery_answers — does not throw, envelope is truthful (I5)", () => {
    // Object.create(null) passes isPlainObject — this tests downstream handling.
    const nullProto = Object.create(null);
    let result;
    assert.doesNotThrow(() => {
      result = runPipelineService({ discovery_answers: nullProto });
    });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(!("runtime_state" in result));
    else                      assert.ok("runtime_state" in result);
  });
});

// ---------------------------------------------------------------------------
// 2. Pipeline service — hostile payload shapes (I2, I4)
// ---------------------------------------------------------------------------

describe("pipeline-service — hostile payload shapes", () => {
  test("boolean true as payload — rejects with ok: false", () => {
    assertFailureEnvelope(runPipelineService(true));
  });

  test("boolean false as payload — rejects with ok: false", () => {
    assertFailureEnvelope(runPipelineService(false));
  });

  test("number 0 as payload — rejects with ok: false", () => {
    assertFailureEnvelope(runPipelineService(0));
  });

  test("whitespace-only string as payload — rejects with ok: false", () => {
    assertFailureEnvelope(runPipelineService("   "));
  });

  test("array of objects as payload — rejects with ok: false", () => {
    assertFailureEnvelope(runPipelineService([{ discovery_answers: {} }]));
  });

  test("discovery_answers: array of objects — rejects with ok: false", () => {
    assertFailureEnvelope(runPipelineService({ discovery_answers: [{ answers: {} }] }));
  });

  test("null-prototype payload with no properties — rejects (missing discovery_answers)", () => {
    const nullProto = Object.create(null);
    let result;
    assert.doesNotThrow(() => { result = runPipelineService(nullProto); });
    // isPlainObject passes, but "discovery_answers" in nullProto is false
    // → rejected for missing required field
    assert.strictEqual(result.ok, false);
    assert.ok(!("runtime_state" in result));
  });

  test("null-prototype payload with discovery_answers — does not throw, envelope truthful", () => {
    const nullProto = Object.create(null);
    nullProto.discovery_answers = makeMinimalAnswers();
    let result;
    assert.doesNotThrow(() => { result = runPipelineService(nullProto); });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(!("runtime_state" in result));
    else                      assert.ok("runtime_state" in result);
  });

  test("payload with unexpected top-level keys — success envelope has no extra keys (I3)", () => {
    const result = runPipelineService({
      discovery_answers: makeMinimalAnswers(),
      unexpected_a:      "inject",
      unexpected_b:      { nested: true },
      unexpected_c:      [1, 2, 3],
    });
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(Object.keys(result).sort(), ["ok", "runtime_state"]);
  });

  test("payload unexpected keys do not appear in runtime_state", () => {
    const result = runPipelineService({
      discovery_answers: makeMinimalAnswers(),
      injected_field:    "should-not-appear",
    });
    assert.strictEqual(result.ok, true);
    assert.ok(!("injected_field" in result.runtime_state));
  });

  test("discovery_answers with only symbol-keyed entries — does not throw, envelope truthful", () => {
    // Symbol keys are not enumerable by for...in or Object.keys, but do exist on the object.
    const symKey = Symbol("k");
    const da = { [symKey]: "val" }; // typeof is object, not array — passes isPlainObject
    let result;
    assert.doesNotThrow(() => { result = runPipelineService({ discovery_answers: da }); });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(!("runtime_state" in result));
    else                      assert.ok("runtime_state" in result);
  });

  test("deeply nested plain object as discovery_answers — does not throw, envelope truthful", () => {
    const da = { level1: { level2: { level3: { level4: "deep" } } } };
    let result;
    assert.doesNotThrow(() => { result = runPipelineService({ discovery_answers: da }); });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(!("runtime_state" in result));
    else                      assert.ok("runtime_state" in result);
  });
});

// ---------------------------------------------------------------------------
// 3. Pipeline service — envelope invariants across all failure modes (I1, I2, I6)
// ---------------------------------------------------------------------------

describe("pipeline-service — envelope invariants across all hostile inputs", () => {
  const hostilePayloads = [
    ["null",                      null],
    ["undefined",                 undefined],
    ["empty array",               []],
    ["number 42",                 42],
    ["boolean true",              true],
    ["boolean false",             false],
    ["empty string",              ""],
    ["whitespace string",         "   "],
    ["array with plausible item", [{ discovery_answers: {} }]],
    ["empty object",              {}],
    ["null discovery_answers",    { discovery_answers: null }],
    ["array discovery_answers",   { discovery_answers: [] }],
    ["string discovery_answers",  { discovery_answers: "string" }],
    ["number discovery_answers",  { discovery_answers: 42 }],
    ["boolean discovery_answers", { discovery_answers: true }],
  ];

  for (const [label, payload] of hostilePayloads) {
    test(`[${label}] — ok:false, no runtime_state, error string, no throw (I1,I2,I5)`, () => {
      assert.doesNotThrow(() => {
        const result = runPipelineService(payload);
        assertFailureEnvelope(result);
        assert.deepStrictEqual(Object.keys(result).sort(), ["error", "ok"]);
      });
    });
  }

  test("same hostile input produces identical rejection on repeated calls (I6)", () => {
    const r1 = runPipelineService({ discovery_answers: [] });
    const r2 = runPipelineService({ discovery_answers: [] });
    assert.strictEqual(r1.ok,    r2.ok);
    assert.strictEqual(r1.error, r2.error);
  });

  test("whitespace-only string discovery_answers — deterministic rejection", () => {
    const r1 = runPipelineService({ discovery_answers: "   " });
    const r2 = runPipelineService({ discovery_answers: "   " });
    assert.strictEqual(r1.ok,    false);
    assert.strictEqual(r1.error, r2.error);
  });
});

// ---------------------------------------------------------------------------
// 4. Persistence service — hostile project_identity shapes (P7)
// ---------------------------------------------------------------------------

describe("saveRuntimeState — hostile project_identity shapes", () => {
  test("project_identity as array — rejects with ok: false, error mentions project_identity", async () => {
    const state = makeBaseRuntimeState("pi_array");
    state.project_identity = [];
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /project_identity/i);
  });

  test("project_identity as string — rejects with ok: false", async () => {
    const state = makeBaseRuntimeState("pi_string");
    state.project_identity = "not-an-object";
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /project_identity/i);
  });

  test("project_identity as number — rejects with ok: false", async () => {
    const state = makeBaseRuntimeState("pi_number");
    state.project_identity = 42;
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
  });

  test("project_identity as boolean true — rejects with ok: false", async () => {
    const state = makeBaseRuntimeState("pi_bool");
    state.project_identity = true;
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
  });

  test("project_identity.project_id as number — rejects, error mentions project_id", async () => {
    const state = makeBaseRuntimeState("pi_pid_num");
    state.project_identity = { ...state.project_identity, project_id: 42 };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /project_id/i);
  });

  test("project_identity.project_id as null — rejects, error mentions project_id", async () => {
    const state = makeBaseRuntimeState("pi_pid_null");
    state.project_identity = { ...state.project_identity, project_id: null };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /project_id/i);
  });

  test("project_identity.project_id as array — rejects, error mentions project_id", async () => {
    const state = makeBaseRuntimeState("pi_pid_arr");
    state.project_identity = { ...state.project_identity, project_id: ["proj-1"] };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /project_id/i);
  });

  test("project_identity.project_id as boolean — rejects with ok: false", async () => {
    const state = makeBaseRuntimeState("pi_pid_bool");
    state.project_identity = { ...state.project_identity, project_id: false };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 5. Persistence service — hostile runtime_state shapes (P2, P7)
// ---------------------------------------------------------------------------

describe("saveRuntimeState — hostile runtime_state shapes", () => {
  test("null-prototype object as runtime_state — does not reject, deterministic result", async () => {
    // Object.create(null) passes isPlainObject — project_identity will be undefined → rejected
    const nullProto = Object.create(null);
    let result;
    await assert.doesNotReject(async () => { result = await saveRuntimeState(nullProto); });
    assert.ok(typeof result === "object" && result !== null);
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(typeof result.error === "string");
  });

  test("circular reference in runtime_state — returns ok: false, does not throw (P7)", async () => {
    // JSON.stringify throws for circular refs — the service must catch it
    const state = makeBaseRuntimeState("circular_ref");
    state.self_ref = state;
    let result;
    await assert.doesNotReject(async () => { result = await saveRuntimeState(state); });
    assert.strictEqual(result.ok, false,
      "circular reference must not silently succeed — JSON.stringify must throw and be caught");
    assert.ok(typeof result.error === "string" && result.error.length > 0);
  });

  test("Map as discovery_answers — does not throw; if ok:true the coercion is documented (I4)", async () => {
    // Map passes isPlainObject. JSON.stringify(new Map()) → "{}". This documents the coercion gap.
    const state = makeBaseRuntimeState("da_map");
    state.discovery_answers = new Map([["Q001", "yes"]]);
    let result;
    await assert.doesNotReject(async () => { result = await saveRuntimeState(state); });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === true) {
      // Document the coercion: Map entries are lost — serialized as {}
      const pid      = state.project_identity.project_id;
      const loaded   = await loadRuntimeState(pid);
      assert.strictEqual(loaded.ok, true);
      // Map with entries serialized by JSON.stringify as {} — coercion occurred
      assert.deepStrictEqual(loaded.runtime_state.discovery_answers, {},
        "I4: Map coerced to empty object — this documents the boundary gap");
    } else {
      assert.ok(typeof result.error === "string");
    }
  });

  test("Set as discovery_answers — does not throw, envelope is deterministic", async () => {
    const state = makeBaseRuntimeState("da_set");
    state.discovery_answers = new Set(["Q001"]);
    let result;
    await assert.doesNotReject(async () => { result = await saveRuntimeState(state); });
    assert.ok(typeof result.ok === "boolean");
    if (result.ok === false) assert.ok(typeof result.error === "string" && result.error.length > 0);
  });

  test("extra unexpected top-level keys in runtime_state — save succeeds, keys persist (not stripped)", async () => {
    const state = makeBaseRuntimeState("extra_top_keys");
    state.custom_field        = "custom_value";
    state.another_custom_field = { nested: true };
    const saveResult = await trackedSave(state);
    assert.strictEqual(saveResult.ok, true);

    const loaded = await loadRuntimeState(state.project_identity.project_id);
    assert.strictEqual(loaded.ok, true);
    // Extra keys that are not computed/secret pass through to persistence
    assert.strictEqual(loaded.runtime_state.custom_field, "custom_value");
    assert.deepStrictEqual(loaded.runtime_state.another_custom_field, { nested: true });
  });

  test("runtime_state with number as discovery_answers — rejects, error mentions discovery_answers", async () => {
    const state = makeBaseRuntimeState("da_number");
    state.discovery_answers = 42;
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /discovery_answers/i);
  });

  test("runtime_state with array as discovery_answers — rejects, error mentions discovery_answers", async () => {
    const state = makeBaseRuntimeState("da_array");
    state.discovery_answers = [{ answers: {} }];
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /discovery_answers/i);
  });
});

// ---------------------------------------------------------------------------
// 6. Persistence service — secret check scope (P4)
// ---------------------------------------------------------------------------

describe("saveRuntimeState — secret check scope (P4 scoped to target_context)", () => {
  test("password-like string in discovery_answers.answers is NOT rejected (target_context only)", async () => {
    // P4 scopes secrets detection to target_context. This documents that scope.
    const state = makeBaseRuntimeState("secret_in_da_answers");
    state.discovery_answers = {
      ...state.discovery_answers,
      answers: { AUTH_Q: "hunter2_password_here" },
    };
    const result = await trackedSave(state);
    assert.strictEqual(result.ok, true,
      "P4 secrets check must be scoped to target_context only — discovery_answers is not checked");
  });

  test("api_key in project_identity is NOT rejected (target_context only scope)", async () => {
    const state = makeBaseRuntimeState("secret_in_pi");
    state.project_identity = { ...state.project_identity, api_key: "leaked_key" };
    const result = await trackedSave(state);
    assert.strictEqual(result.ok, true,
      "P4 secrets check must be scoped to target_context only — project_identity is not checked");
  });

  test("deeply nested secret in target_context (3 levels) — rejects with ok: false", async () => {
    const state = makeBaseRuntimeState("deep_secret_3lvl");
    state.target_context = {
      ...state.target_context,
      auth: {
        credentials: {
          password: "deeply_nested_value",
        },
      },
    };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /secret|password/i);
  });

  test("nested token in target_context (2 levels) — rejects with ok: false", async () => {
    const state = makeBaseRuntimeState("deep_secret_2lvl");
    state.target_context = {
      ...state.target_context,
      integration: { token: "bearer_abc123" },
    };
    const result = await saveRuntimeState(state);
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /secret|token/i);
  });
});

// ---------------------------------------------------------------------------
// 7. Persistence service — hostile project_id strings for load (P7, P8)
// ---------------------------------------------------------------------------

describe("loadRuntimeState — hostile project_id strings", () => {
  test("path traversal project_id — sanitized to safe path, no path traversal, returns not_found", async () => {
    // buildStorePath sanitizes: "../../../etc/passwd" → "_______etc_passwd"
    // Must not throw, must not return 500-style error
    const result = await loadRuntimeState("../../../etc/passwd_hardening_test");
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
    // Sanitized path won't exist — either not_found or deterministic error
  });

  test("project_id of '.' — sanitized, deterministic not_found result", async () => {
    const result = await loadRuntimeState(".");
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  test("project_id with all special chars — sanitized consistently, not_found", async () => {
    const result = await loadRuntimeState("!@#$%^&*()");
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  test("project_id with path separators — consistent behavior (no crash)", async () => {
    const result = await loadRuntimeState("/tmp/hostile/path");
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  test("project_id: boolean true — rejects with ok: false", async () => {
    const result = await loadRuntimeState(true);
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  test("project_id: boolean false — rejects with ok: false", async () => {
    const result = await loadRuntimeState(false);
    assert.strictEqual(result.ok, false);
  });

  test("project_id: plain object — rejects with ok: false", async () => {
    const result = await loadRuntimeState({ id: "proj-1" });
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  test("project_id: array — rejects with ok: false", async () => {
    const result = await loadRuntimeState(["proj-1"]);
    assert.strictEqual(result.ok, false);
    assert.ok(typeof result.error === "string");
  });

  test("path traversal save + load round-trips consistently (sanitization is symmetric)", async () => {
    // Both save and load sanitize the project_id identically — round-trip is consistent.
    const traversalId = "../hardening_traversal_test_only";
    _createdProjectIds.add(traversalId); // schedule cleanup (sanitized filename)

    // Build a state using the traversal id directly
    const state = {
      project_identity: {
        project_id:           traversalId,
        project_name:         "Traversal Test",
        created_at:           "2026-01-01T00:00:00.000Z",
        last_modified_at:     "2026-01-01T00:00:00.000Z",
        customer_entity:      null,
        project_owner:        null,
        implementation_lead:  null,
        project_mode:         null,
      },
      target_context: {
        odoo_version: "19", edition: "enterprise", deployment_type: "online",
        primary_country: null, primary_currency: null,
        multi_company: false, multi_currency: false,
        odoosh_branch_target: null, odoosh_environment_type: null,
        connection_mode: null, connection_status: null,
        connection_target_id: null, connection_capability_note: null,
      },
      discovery_answers: {
        answers: { Q001: "yes" }, answered_at: {}, conditional_questions_skipped: [],
        framework_version: null, confirmed_by: null, confirmed_at: null,
      },
      activated_domains: { domains: [], activation_engine_version: null, activated_at: null },
      checkpoints: [], decisions: [], stage_state: [], deferments: [],
      previews: [], executions: [], connection_state: null,
      training_state: null, readiness_summary: null,
    };

    const saveResult = await saveRuntimeState(state);
    // Either save succeeds (sanitized path is inside store dir, safe) or fails
    if (saveResult.ok === true) {
      // Load with the same traversal id — must round-trip (symmetric sanitization)
      const loadResult = await loadRuntimeState(traversalId);
      assert.strictEqual(loadResult.ok, true,
        "save and load must use identical sanitization for the same project_id string");
      assert.strictEqual(loadResult.runtime_state.project_identity.project_id, traversalId);
    } else {
      // If rejected, both save and load must fail consistently
      const loadResult = await loadRuntimeState(traversalId);
      assert.strictEqual(loadResult.ok, false);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Persistence service — no spurious file creation on validation failure
// ---------------------------------------------------------------------------

describe("saveRuntimeState — no spurious file creation on validation failure", () => {
  test("rejected save (missing project_identity) does not create any file", async () => {
    const phantomId  = makeProjectId("phantom_no_pi");
    const invalidState = makeBaseRuntimeState("phantom_no_pi_src");
    delete invalidState.project_identity;

    const saveResult = await saveRuntimeState(invalidState);
    assert.strictEqual(saveResult.ok, false);

    // The phantom project_id was never successfully saved
    const loadResult = await loadRuntimeState(phantomId);
    assert.strictEqual(loadResult.ok, false);
    assert.strictEqual(loadResult.not_found, true);
  });

  test("rejected save (secrets in target_context) does not create a partial file", async () => {
    const projectId = makeProjectId("secret_no_file");
    const state     = makeBaseRuntimeState("secret_no_file_src");
    state.project_identity.project_id = projectId;
    state.target_context = { ...state.target_context, password: "s3cret" };

    const saveResult = await saveRuntimeState(state);
    assert.strictEqual(saveResult.ok, false);

    const loadResult = await loadRuntimeState(projectId);
    assert.strictEqual(loadResult.ok, false);
    assert.strictEqual(loadResult.not_found, true);
  });

  test("rejected save (whitespace project_id) does not create any file", async () => {
    const state = makeBaseRuntimeState("ws_pid_no_file");
    state.project_identity.project_id = "   ";

    const saveResult = await saveRuntimeState(state);
    assert.strictEqual(saveResult.ok, false);

    // No file created — loading any whitespace-like id must fail
    const loadResult = await loadRuntimeState("   ");
    assert.strictEqual(loadResult.ok, false);
  });
});

// ---------------------------------------------------------------------------
// 9. Route — POST /api/pipeline/run hardening
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/run — route hardening", () => {
  test("invalid JSON body — HTTP 400, ok: false", async () => {
    const res = await postRaw("/api/pipeline/run", "{ bad json !!!");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(typeof res.body.error === "string");
  });

  test("empty body — HTTP 400 (missing discovery_answers)", async () => {
    const res = await postRaw("/api/pipeline/run", "");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("top-level JSON array body — HTTP 400", async () => {
    const res = await postRaw("/api/pipeline/run", "[]");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body), "I1: no runtime_state on rejection");
  });

  test("JSON array with plausible item — HTTP 400", async () => {
    const res = await postJson("/api/pipeline/run", [{ discovery_answers: {} }]);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("JSON boolean true body — HTTP 400", async () => {
    const res = await postRaw("/api/pipeline/run", "true");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("JSON boolean false body — HTTP 400", async () => {
    const res = await postRaw("/api/pipeline/run", "false");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("JSON numeric body — HTTP 400", async () => {
    const res = await postRaw("/api/pipeline/run", "42");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("JSON null body — HTTP 400, no runtime_state (I1)", async () => {
    // runPipelineService(null) → ok: false — route must propagate this correctly
    const res = await postRaw("/api/pipeline/run", "null");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("missing discovery_answers — HTTP 400, no runtime_state (I1)", async () => {
    const res = await postJson("/api/pipeline/run", { project_identity: { project_id: "x" } });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("null discovery_answers — HTTP 400, no runtime_state (I1)", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: null });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("array discovery_answers — HTTP 400, no runtime_state (I1)", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: [] });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("string discovery_answers — HTTP 400", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: "answers" });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("number discovery_answers — HTTP 400", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: 99 });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("rejection envelope has exactly {ok, error} — no extra keys (I2)", async () => {
    const res = await postJson("/api/pipeline/run", { discovery_answers: null });
    const keys = Object.keys(res.body).sort();
    assert.deepStrictEqual(keys, ["error", "ok"]);
  });

  test("extra unexpected keys alongside missing discovery_answers — still HTTP 400 (I4)", async () => {
    const res = await postJson("/api/pipeline/run", {
      unexpected_a: "inject",
      unexpected_b: [1, 2, 3],
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("extra unexpected keys alongside valid discovery_answers — HTTP 200, no key leakage (I3)", async () => {
    const res = await postJson("/api/pipeline/run", {
      discovery_answers: makeMinimalAnswers(),
      injected:          "should-not-appear-in-runtime_state",
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.ok(!("injected" in res.body.runtime_state));
  });

  test("valid request — HTTP 200, ok: true, runtime_state present (I3)", async () => {
    const res = await postJson("/api/pipeline/run", {
      discovery_answers: makeMinimalAnswers(),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.ok(res.body.runtime_state !== null && typeof res.body.runtime_state === "object");
  });

  test("valid request — success envelope has exactly {ok, runtime_state} (I3)", async () => {
    const res = await postJson("/api/pipeline/run", {
      discovery_answers: makeMinimalAnswers(),
    });
    assert.strictEqual(res.status, 200);
    const keys = Object.keys(res.body).sort();
    assert.deepStrictEqual(keys, ["ok", "runtime_state"]);
  });

  test("repeated hostile requests produce identical rejections (I6)", async () => {
    const body = { discovery_answers: [] };
    const r1   = await postJson("/api/pipeline/run", body);
    const r2   = await postJson("/api/pipeline/run", body);
    assert.strictEqual(r1.status, r2.status);
    assert.strictEqual(r1.body.ok, r2.body.ok);
    assert.strictEqual(r1.body.error, r2.body.error);
  });
});

// ---------------------------------------------------------------------------
// 10. Route — POST /api/pipeline/state/load — additional hostile cases
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/load — additional hostile inputs", () => {
  test("boolean project_id (true) — HTTP 400, no runtime_state (I1)", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: true });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("boolean project_id (false) — HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: false });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("object project_id — HTTP 400, no runtime_state (I1)", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: { id: "proj-1" } });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("nested array project_id — HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/load", { project_id: [["proj-1"]] });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("JSON null body — HTTP 400, no runtime_state (I1)", async () => {
    // Route accesses payload.project_id; if payload is null this should be caught
    const res = await postRaw("/api/pipeline/state/load", "null");
    assert.strictEqual(res.status, 400,
      "null JSON body must return 400, not 500 (server must guard against null.project_id access)");
    assert.ok(!("runtime_state" in (res.body ?? {})));
  });

  test("invalid JSON body — HTTP 400", async () => {
    const res = await postRaw("/api/pipeline/state/load", "{ not json");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("empty body — HTTP 400", async () => {
    const res = await postRaw("/api/pipeline/state/load", "");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("JSON array body — HTTP 4xx, no runtime_state", async () => {
    const res = await postRaw("/api/pipeline/state/load", "[\"proj-1\"]");
    assert.ok(res.status >= 400, `expected 4xx, got ${res.status}`);
    assert.ok(!("runtime_state" in (res.body ?? {})));
  });

  test("project_id with path separators — HTTP 4xx, no runtime_state (sanitized, not_found)", async () => {
    // Route passes the string to the service, which sanitizes it
    const res = await postJson("/api/pipeline/state/load", { project_id: "../../../etc/hosts" });
    assert.ok(res.status >= 400 && res.status < 500,
      `path traversal project_id must return 4xx, got ${res.status}`);
    assert.ok(!("runtime_state" in res.body));
  });

  test("extra keys in body with valid project_id — load succeeds, extra keys ignored", async () => {
    const state = makeBaseRuntimeState("load_xk_valid");
    const pid   = state.project_identity.project_id;
    await trackedSave(state);

    const res = await postJson("/api/pipeline/state/load", {
      project_id:   pid,
      injected_key: "surprise",
      nested_junk:  { deep: [1, 2, 3] },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.runtime_state.project_identity.project_id, pid);
    assert.ok(!("injected_key" in res.body.runtime_state));
  });

  test("load rejection envelope has exactly {ok, error} — no extra keys (I2)", async () => {
    const res = await postJson("/api/pipeline/state/load", {});
    const keys = Object.keys(res.body).sort();
    assert.deepStrictEqual(keys, ["error", "ok"]);
  });
});

// ---------------------------------------------------------------------------
// 11. Route — POST /api/pipeline/state/resume — additional hostile cases
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/state/resume — additional hostile inputs", () => {
  test("boolean project_id (true) — HTTP 400, no runtime_state (I1)", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: true });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("boolean project_id (false) — HTTP 400", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: false });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("object project_id — HTTP 400, no runtime_state (I1)", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: { id: "x" } });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(!("runtime_state" in res.body));
  });

  test("JSON null body — HTTP 400, no runtime_state (I1)", async () => {
    const res = await postRaw("/api/pipeline/state/resume", "null");
    assert.strictEqual(res.status, 400,
      "null JSON body must return 400, not 500 (server must guard against null.project_id access)");
    assert.ok(!("runtime_state" in (res.body ?? {})));
  });

  test("invalid JSON body — HTTP 400", async () => {
    const res = await postRaw("/api/pipeline/state/resume", "{ not json");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("empty body — HTTP 400", async () => {
    const res = await postRaw("/api/pipeline/state/resume", "");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("project_id with path separators — HTTP 4xx, no runtime_state", async () => {
    const res = await postJson("/api/pipeline/state/resume", { project_id: "../../../tmp/x" });
    assert.ok(res.status >= 400 && res.status < 500,
      `path traversal project_id must return 4xx, got ${res.status}`);
    assert.ok(!("runtime_state" in res.body));
  });

  test("extra keys in body with valid project_id — resume succeeds, extra keys ignored", async () => {
    const state = makeBaseRuntimeState("resume_xk_valid");
    const pid   = state.project_identity.project_id;
    await trackedSave(state);

    const res = await postJson("/api/pipeline/state/resume", {
      project_id: pid,
      injection:  { hostile: "value" },
      extra_arr:  [1, 2, 3],
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.runtime_state.project_identity.project_id, pid);
    assert.ok(!("injection" in res.body.runtime_state));
  });

  test("resume rejection envelope has exactly {ok, error} — no extra keys (I2)", async () => {
    const res = await postJson("/api/pipeline/state/resume", {});
    const keys = Object.keys(res.body).sort();
    assert.deepStrictEqual(keys, ["error", "ok"]);
  });

  test("load and resume routes reject identical hostile inputs with identical status codes (I6)", async () => {
    const hostileIds = [true, false, null, "", "   ", 42, { id: "x" }];
    for (const id of hostileIds) {
      const loadRes   = await postJson("/api/pipeline/state/load",   { project_id: id });
      const resumeRes = await postJson("/api/pipeline/state/resume", { project_id: id });
      assert.strictEqual(loadRes.status, resumeRes.status,
        `load and resume must reject project_id=${JSON.stringify(id)} with same HTTP status`);
      assert.strictEqual(loadRes.body.ok, resumeRes.body.ok,
        `load and resume must have identical ok field for project_id=${JSON.stringify(id)}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Removed bypass routes — must return 404 (governance bypass elimination)
// ---------------------------------------------------------------------------

describe("Removed bypass routes return 404", () => {
  test("POST /api/domain/execute returns 404 (I7)", async () => {
    const res = await postJson("/api/domain/execute", {});
    assert.strictEqual(res.status, 404,
      `/api/domain/execute must be absent — got ${res.status}`);
  });

  test("POST /api/odoo/create returns 404 (I7)", async () => {
    const res = await postJson("/api/odoo/create", {});
    assert.strictEqual(res.status, 404,
      `/api/odoo/create must be absent — got ${res.status}`);
  });
});

// ---------------------------------------------------------------------------
// 12. POST /api/pipeline/run — discovery_answers fallback from persisted state
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/run — discovery_answers fallback from persisted state", () => {
  // T1: Payload with explicit discovery_answers works exactly as before.
  test("T1: payload with explicit discovery_answers — HTTP 200, ok: true (no change to existing behaviour)", async () => {
    const res = await postJson("/api/pipeline/run", {
      discovery_answers: makeMinimalAnswers(),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.ok("runtime_state" in res.body);
  });

  // T2: Payload without discovery_answers + persisted state with discovery_answers → uses persisted answers.
  test("T2: payload without discovery_answers + persisted state has discovery_answers → HTTP 200, ok: true", async () => {
    const state = makeBaseRuntimeState("da_fallback_t2");
    const pid   = state.project_identity.project_id;
    // state already has discovery_answers (from makeBaseRuntimeState fixture)
    await trackedSave(state);

    const res = await postJson("/api/pipeline/run", {
      project_identity: { project_id: pid },
    });
    assert.strictEqual(res.status, 200, `Expected 200 from fallback path, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.ok, true);
    assert.ok("runtime_state" in res.body);
  });

  // T3: Payload without discovery_answers + no persisted state → 400.
  test("T3: payload without discovery_answers + no persisted state → HTTP 400, specific error", async () => {
    const res = await postJson("/api/pipeline/run", {
      project_identity: { project_id: "nonexistent_project_da_fallback_t3" },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.ok(
      typeof res.body.error === "string" && res.body.error.includes("discovery_answers required"),
      `Expected error to include 'discovery_answers required', got: ${res.body.error}`
    );
    assert.ok(!("runtime_state" in res.body));
  });

  // T4: Foundation proof-track call pattern — explicit discovery_answers payload — unchanged result.
  test("T4: Foundation proof-track call pattern with explicit discovery_answers — HTTP 200, ok: true", async () => {
    // This mirrors the canonical Foundation proof-track call used in live proofs.
    // discovery_answers is explicitly in the payload — fallback block is not entered.
    const res = await postJson("/api/pipeline/run", {
      discovery_answers: makeMinimalAnswers(),
      checkpoint_statuses: {
        "FND-FOUND-001": "Complete",
        "FND-FOUND-002": "Complete",
        "FND-DREQ-001":  "Complete",
        "FND-FOUND-004": "Complete",
        "FND-FOUND-005": "Complete",
        "FND-DREQ-002":  "Complete",
      },
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.ok, true);
    assert.ok("runtime_state" in res.body);
    // Confirm no regression: runtime_state is a non-null plain object
    const rs = res.body.runtime_state;
    assert.ok(rs !== null && typeof rs === "object" && !Array.isArray(rs));
  });
});
