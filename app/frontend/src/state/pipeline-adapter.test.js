import test from "node:test";
import assert from "node:assert/strict";

import {
  runPipeline,
  loadPipelineState,
  resumePipelineState,
} from "./pipeline-adapter.js";

// ---------------------------------------------------------------------------
// Mock fetch factory
//
// Returns a fetch function that resolves with the given body and status.
// Captures the last call's URL and options for assertion.
// ---------------------------------------------------------------------------

function makeMockFetch(body, { status = 200, throwNetwork = false } = {}) {
  const calls = [];
  const _fetch = async (url, options) => {
    if (throwNetwork) {
      throw new Error("Network unreachable.");
    }
    calls.push({ url, options });
    return {
      status,
      ok: status >= 200 && status < 300,
      json: async () => body,
    };
  };
  _fetch.calls = calls;
  return _fetch;
}

function makeMalformedJsonFetch() {
  return async () => ({
    status: 200,
    ok: true,
    json: async () => { throw new SyntaxError("Unexpected token"); },
  });
}

// ---------------------------------------------------------------------------
// runPipeline — success
// ---------------------------------------------------------------------------

test("runPipeline returns ok:true with runtime_state on successful response", async () => {
  const runtimeState = { project_identity: { project_id: "p1" }, discovery_answers: { q1: "a1" } };
  const _fetch = makeMockFetch({ ok: true, runtime_state: runtimeState });

  const result = await runPipeline({ discovery_answers: { q1: "a1" } }, { _fetch });

  assert.equal(result.ok, true);
  assert.deepEqual(result.runtime_state, runtimeState);
});

test("runPipeline sends POST to /api/pipeline/run with JSON body", async () => {
  const payload = { discovery_answers: { q1: "a1" } };
  const _fetch = makeMockFetch({ ok: true, runtime_state: {} });

  await runPipeline(payload, { _fetch });

  assert.equal(_fetch.calls.length, 1);
  assert.equal(_fetch.calls[0].url, "/api/pipeline/run");
  assert.equal(_fetch.calls[0].options.method, "POST");
  assert.equal(_fetch.calls[0].options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(_fetch.calls[0].options.body), payload);
});

// ---------------------------------------------------------------------------
// runPipeline — failure
// ---------------------------------------------------------------------------

test("runPipeline returns ok:false with error on backend failure envelope", async () => {
  const _fetch = makeMockFetch({ ok: false, error: "Required field missing: discovery_answers." }, { status: 400 });

  const result = await runPipeline({}, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Required field missing: discovery_answers.");
});

test("runPipeline returns ok:false on network failure", async () => {
  const _fetch = makeMockFetch(null, { throwNetwork: true });

  const result = await runPipeline({ discovery_answers: {} }, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Network unreachable.");
});

test("runPipeline returns ok:false on malformed JSON response", async () => {
  const result = await runPipeline({ discovery_answers: {} }, { _fetch: makeMalformedJsonFetch() });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Malformed response from server.");
});

test("runPipeline returns ok:false on malformed envelope (missing ok field)", async () => {
  const _fetch = makeMockFetch({ status: "ok", data: {} });

  const result = await runPipeline({ discovery_answers: {} }, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Malformed response envelope from server.");
});

// ---------------------------------------------------------------------------
// loadPipelineState — success
// ---------------------------------------------------------------------------

test("loadPipelineState returns ok:true with runtime_state and saved_at on success", async () => {
  const runtimeState = { project_identity: { project_id: "p2" }, discovery_answers: {} };
  const savedAt = "2026-03-27T10:00:00.000Z";
  const _fetch = makeMockFetch({ ok: true, runtime_state: runtimeState, saved_at: savedAt });

  const result = await loadPipelineState("p2", { _fetch });

  assert.equal(result.ok, true);
  assert.deepEqual(result.runtime_state, runtimeState);
  assert.equal(result.saved_at, savedAt);
});

test("loadPipelineState sends POST to /api/pipeline/state/load with project_id", async () => {
  const _fetch = makeMockFetch({ ok: true, runtime_state: {}, saved_at: null });

  await loadPipelineState("proj-abc", { _fetch });

  assert.equal(_fetch.calls[0].url, "/api/pipeline/state/load");
  assert.deepEqual(JSON.parse(_fetch.calls[0].options.body), { project_id: "proj-abc" });
});

// ---------------------------------------------------------------------------
// loadPipelineState — not_found
// ---------------------------------------------------------------------------

test("loadPipelineState returns ok:false with not_found:true on 404 not_found response", async () => {
  const _fetch = makeMockFetch(
    { ok: false, error: "No persisted state found for project_id \"p-missing\".", not_found: true },
    { status: 404 }
  );

  const result = await loadPipelineState("p-missing", { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.not_found, true);
  assert.match(result.error, /No persisted state found/);
});

test("loadPipelineState does not set not_found when backend omits it", async () => {
  const _fetch = makeMockFetch({ ok: false, error: "project_id must be a non-empty string." }, { status: 400 });

  const result = await loadPipelineState("", { _fetch });

  assert.equal(result.ok, false);
  assert.equal("not_found" in result, false);
});

// ---------------------------------------------------------------------------
// loadPipelineState — failure
// ---------------------------------------------------------------------------

test("loadPipelineState returns ok:false on network failure", async () => {
  const _fetch = makeMockFetch(null, { throwNetwork: true });

  const result = await loadPipelineState("p1", { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Network unreachable.");
});

test("loadPipelineState returns ok:false on malformed envelope", async () => {
  const _fetch = makeMockFetch({ message: "something" });

  const result = await loadPipelineState("p1", { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Malformed response envelope from server.");
});

// ---------------------------------------------------------------------------
// resumePipelineState — success
// ---------------------------------------------------------------------------

test("resumePipelineState returns ok:true with runtime_state and saved_at on success", async () => {
  const runtimeState = { project_identity: { project_id: "p3" }, discovery_answers: { x: 1 } };
  const savedAt = "2026-03-27T12:00:00.000Z";
  const _fetch = makeMockFetch({ ok: true, runtime_state: runtimeState, saved_at: savedAt });

  const result = await resumePipelineState("p3", { _fetch });

  assert.equal(result.ok, true);
  assert.deepEqual(result.runtime_state, runtimeState);
  assert.equal(result.saved_at, savedAt);
});

test("resumePipelineState sends POST to /api/pipeline/state/resume with project_id", async () => {
  const _fetch = makeMockFetch({ ok: true, runtime_state: {}, saved_at: null });

  await resumePipelineState("proj-xyz", { _fetch });

  assert.equal(_fetch.calls[0].url, "/api/pipeline/state/resume");
  assert.deepEqual(JSON.parse(_fetch.calls[0].options.body), { project_id: "proj-xyz" });
});

// ---------------------------------------------------------------------------
// resumePipelineState — not_found
// ---------------------------------------------------------------------------

test("resumePipelineState returns ok:false with not_found:true on 404 not_found response", async () => {
  const _fetch = makeMockFetch(
    { ok: false, error: "No persisted state found for project_id \"p-gone\".", not_found: true },
    { status: 404 }
  );

  const result = await resumePipelineState("p-gone", { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.not_found, true);
});

// ---------------------------------------------------------------------------
// resumePipelineState — failure
// ---------------------------------------------------------------------------

test("resumePipelineState returns ok:false on network failure", async () => {
  const _fetch = makeMockFetch(null, { throwNetwork: true });

  const result = await resumePipelineState("p1", { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Network unreachable.");
});

test("resumePipelineState returns ok:false on malformed JSON", async () => {
  const result = await resumePipelineState("p1", { _fetch: makeMalformedJsonFetch() });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Malformed response from server.");
});

// ---------------------------------------------------------------------------
// runtime_state payload — no mutation
// ---------------------------------------------------------------------------

test("runPipeline does not mutate the returned runtime_state object", async () => {
  const runtimeState = { project_identity: { project_id: "p-mut" }, discovery_answers: { q: "v" } };
  const _fetch = makeMockFetch({ ok: true, runtime_state: runtimeState });

  const result = await runPipeline({ discovery_answers: { q: "v" } }, { _fetch });

  // Runtime state is the exact reference from the response body
  assert.equal(result.runtime_state, runtimeState);
  // No extra keys injected
  assert.deepEqual(Object.keys(result.runtime_state), Object.keys(runtimeState));
});

test("loadPipelineState does not mutate the returned runtime_state object", async () => {
  const runtimeState = { project_identity: { project_id: "p-mut2" }, discovery_answers: {} };
  const _fetch = makeMockFetch({ ok: true, runtime_state: runtimeState, saved_at: "2026-01-01T00:00:00.000Z" });

  const result = await loadPipelineState("p-mut2", { _fetch });

  assert.equal(result.runtime_state, runtimeState);
  assert.deepEqual(Object.keys(result.runtime_state), Object.keys(runtimeState));
});

test("resumePipelineState does not mutate the returned runtime_state object", async () => {
  const runtimeState = { project_identity: { project_id: "p-mut3" }, discovery_answers: {} };
  const _fetch = makeMockFetch({ ok: true, runtime_state: runtimeState, saved_at: "2026-01-01T00:00:00.000Z" });

  const result = await resumePipelineState("p-mut3", { _fetch });

  assert.equal(result.runtime_state, runtimeState);
  assert.deepEqual(Object.keys(result.runtime_state), Object.keys(runtimeState));
});

// ---------------------------------------------------------------------------
// Determinism — repeated calls with identical inputs produce identical outputs
// ---------------------------------------------------------------------------

test("runPipeline is deterministic: repeated calls with identical inputs return identical structure", async () => {
  const runtimeState = { project_identity: { project_id: "p-det" }, discovery_answers: { q: "a" } };

  const result1 = await runPipeline(
    { discovery_answers: { q: "a" } },
    { _fetch: makeMockFetch({ ok: true, runtime_state: runtimeState }) }
  );
  const result2 = await runPipeline(
    { discovery_answers: { q: "a" } },
    { _fetch: makeMockFetch({ ok: true, runtime_state: runtimeState }) }
  );

  assert.equal(result1.ok, result2.ok);
  assert.deepEqual(result1.runtime_state, result2.runtime_state);
});

test("loadPipelineState is deterministic: repeated calls with identical inputs return identical structure", async () => {
  const runtimeState = { project_identity: { project_id: "p-det2" }, discovery_answers: {} };
  const savedAt = "2026-03-27T00:00:00.000Z";

  const result1 = await loadPipelineState(
    "p-det2",
    { _fetch: makeMockFetch({ ok: true, runtime_state: runtimeState, saved_at: savedAt }) }
  );
  const result2 = await loadPipelineState(
    "p-det2",
    { _fetch: makeMockFetch({ ok: true, runtime_state: runtimeState, saved_at: savedAt }) }
  );

  assert.equal(result1.ok, result2.ok);
  assert.deepEqual(result1.runtime_state, result2.runtime_state);
  assert.equal(result1.saved_at, result2.saved_at);
});

test("not_found handling is deterministic across repeated calls", async () => {
  const backendBody = { ok: false, error: "No persisted state found.", not_found: true };

  const result1 = await resumePipelineState(
    "p-gone",
    { _fetch: makeMockFetch(backendBody, { status: 404 }) }
  );
  const result2 = await resumePipelineState(
    "p-gone",
    { _fetch: makeMockFetch(backendBody, { status: 404 }) }
  );

  assert.equal(result1.ok, result2.ok);
  assert.equal(result1.not_found, result2.not_found);
  assert.equal(result1.error, result2.error);
});

// ---------------------------------------------------------------------------
// applyGoverned — success
// ---------------------------------------------------------------------------

import { applyGoverned, savePipelineState, registerPipelineConnection } from "./pipeline-adapter.js";

test("applyGoverned returns ok:true with result fields on successful response", async () => {
  const _fetch = makeMockFetch({
    ok: true,
    result_status: "success",
    odoo_result: true,
    executed_at: "2026-03-28T10:00:00.000Z",
  });

  const result = await applyGoverned(
    { approval_id: "a1", runtime_state: {}, operation: {}, connection_context: { project_id: "p1" } },
    { _fetch }
  );

  assert.equal(result.ok, true);
  assert.equal(result.result_status, "success");
  assert.equal(result.odoo_result, true);
  assert.equal(result.executed_at, "2026-03-28T10:00:00.000Z");
});

// ---------------------------------------------------------------------------
// Slice 1: applyGoverned forwards updated_runtime_state
// ---------------------------------------------------------------------------

test("applyGoverned forwards updated_runtime_state when backend includes it", async () => {
  const updatedState = {
    project_identity: { project_id: "p1" },
    _engine_outputs: { execution_approvals: { execution_approvals: [{ approval_id: "a1", execution_occurred: true }] } }
  };
  const _fetch = makeMockFetch({
    ok: true,
    result_status: "success",
    odoo_result: null,
    executed_at: "2026-03-28T10:00:00.000Z",
    updated_runtime_state: updatedState,
  });

  const result = await applyGoverned(
    { approval_id: "a1", runtime_state: {}, operation: {}, connection_context: { project_id: "p1" } },
    { _fetch }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.updated_runtime_state, updatedState, "updated_runtime_state must be forwarded intact");
});

test("applyGoverned returns updated_runtime_state as null when backend omits it", async () => {
  const _fetch = makeMockFetch({
    ok: true,
    result_status: "success",
    odoo_result: null,
    executed_at: null,
  });

  const result = await applyGoverned(
    { approval_id: "a1", runtime_state: {}, operation: {}, connection_context: { project_id: "p1" } },
    { _fetch }
  );

  assert.equal(result.ok, true);
  assert.equal(result.updated_runtime_state, null, "updated_runtime_state must be null when backend omits it");
});

test("applyGoverned sends POST to /api/pipeline/apply with payload", async () => {
  const payload = { approval_id: "a1", runtime_state: {}, operation: { model: "res.company", method: "write", ids: [1], values: {} }, connection_context: { project_id: "p1" } };
  const _fetch = makeMockFetch({ ok: true, result_status: "success", odoo_result: null, executed_at: null });

  await applyGoverned(payload, { _fetch });

  assert.equal(_fetch.calls[0].url, "/api/pipeline/apply");
  assert.equal(_fetch.calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(_fetch.calls[0].options.body), payload);
});

test("applyGoverned returns ok:false on backend failure", async () => {
  const _fetch = makeMockFetch({ ok: false, error: "Approval not found: a-bad.", result_status: "failure" }, { status: 400 });

  const result = await applyGoverned({ approval_id: "a-bad", runtime_state: {}, operation: {}, connection_context: { project_id: "p1" } }, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Approval not found: a-bad.");
});

test("applyGoverned returns ok:false on network failure", async () => {
  const _fetch = makeMockFetch(null, { throwNetwork: true });

  const result = await applyGoverned({}, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Network unreachable.");
});

test("applyGoverned returns ok:false on malformed envelope", async () => {
  const _fetch = makeMockFetch({ message: "unexpected" });

  const result = await applyGoverned({}, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Malformed response envelope from server.");
});

// ---------------------------------------------------------------------------
// savePipelineState — success
// ---------------------------------------------------------------------------

test("savePipelineState returns ok:true with project_id and saved_at on success", async () => {
  const savedAt = "2026-03-28T10:00:00.000Z";
  const _fetch = makeMockFetch({ ok: true, project_id: "p1", saved_at: savedAt });

  const result = await savePipelineState({ project_identity: { project_id: "p1" }, discovery_answers: {} }, { _fetch });

  assert.equal(result.ok, true);
  assert.equal(result.project_id, "p1");
  assert.equal(result.saved_at, savedAt);
});

test("savePipelineState sends POST to /api/pipeline/state/save with runtime_state as body", async () => {
  const runtimeState = { project_identity: { project_id: "p1" }, discovery_answers: {} };
  const _fetch = makeMockFetch({ ok: true, project_id: "p1", saved_at: "2026-03-28T10:00:00.000Z" });

  await savePipelineState(runtimeState, { _fetch });

  assert.equal(_fetch.calls[0].url, "/api/pipeline/state/save");
  assert.equal(_fetch.calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(_fetch.calls[0].options.body), runtimeState);
});

test("savePipelineState returns ok:false on backend failure", async () => {
  const _fetch = makeMockFetch({ ok: false, error: "runtime_state.project_identity.project_id must be a non-empty string." }, { status: 400 });

  const result = await savePipelineState({}, { _fetch });

  assert.equal(result.ok, false);
  assert.match(result.error, /project_id/);
});

test("savePipelineState returns ok:false on network failure", async () => {
  const _fetch = makeMockFetch(null, { throwNetwork: true });

  const result = await savePipelineState({}, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Network unreachable.");
});

test("savePipelineState returns ok:false on malformed envelope", async () => {
  const _fetch = makeMockFetch({ message: "bad" });

  const result = await savePipelineState({}, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Malformed response envelope from server.");
});

// ---------------------------------------------------------------------------
// Slice 2: registerPipelineConnection — pipeline connection registration
// ---------------------------------------------------------------------------

test("registerPipelineConnection returns ok:true with registered_at on success", async () => {
  const registeredAt = "2026-03-29T10:00:00.000Z";
  const _fetch = makeMockFetch({ ok: true, registered_at: registeredAt });

  const result = await registerPipelineConnection(
    "proj-001",
    { url: "https://demo.odoo.com", database: "demo", username: "admin", password: "secret" },
    { _fetch }
  );

  assert.equal(result.ok, true);
  assert.equal(result.registered_at, registeredAt);
});

test("registerPipelineConnection sends POST to /api/pipeline/connection/register with project_id and credentials", async () => {
  const _fetch = makeMockFetch({ ok: true, registered_at: "2026-03-29T10:00:00.000Z" });
  const creds  = { url: "https://demo.odoo.com", database: "demo", username: "admin", password: "secret" };

  await registerPipelineConnection("proj-001", creds, { _fetch });

  assert.equal(_fetch.calls.length, 1);
  assert.equal(_fetch.calls[0].url, "/api/pipeline/connection/register");
  assert.equal(_fetch.calls[0].options.method, "POST");
  const body = JSON.parse(_fetch.calls[0].options.body);
  assert.equal(body.project_id, "proj-001");
  assert.deepEqual(body.credentials, creds);
});

test("registerPipelineConnection returns ok:false on backend failure", async () => {
  const _fetch = makeMockFetch({ ok: false, error: "Authentication failed." }, { status: 400 });

  const result = await registerPipelineConnection("proj-001", {}, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Authentication failed.");
});

test("registerPipelineConnection returns ok:false on network failure", async () => {
  const _fetch = makeMockFetch(null, { throwNetwork: true });

  const result = await registerPipelineConnection("proj-001", {}, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Network unreachable.");
});

test("registerPipelineConnection returns ok:false on malformed envelope", async () => {
  const _fetch = makeMockFetch({ message: "unexpected" });

  const result = await registerPipelineConnection("proj-001", {}, { _fetch });

  assert.equal(result.ok, false);
  assert.equal(result.error, "Malformed response envelope from server.");
});

test("registerPipelineConnection returns registered_at as null when backend omits it", async () => {
  const _fetch = makeMockFetch({ ok: true });

  const result = await registerPipelineConnection("proj-001", {}, { _fetch });

  assert.equal(result.ok, true);
  assert.equal(result.registered_at, null);
});
