// ---------------------------------------------------------------------------
// Pipeline Apply Route Tests
// app/backend/tests/pipeline-apply-route.test.js
// ---------------------------------------------------------------------------
//
// Covers: POST /api/pipeline/apply — route-level hardening for the first
// live governed Odoo apply slice.
//
// Invariants:
//   R1  No execution without: approved, preview-backed, connection-present input.
//   R2  No re-execution: execution_occurred must be false.
//   R3  Model must be in allowlist (res.company only for first slice).
//   R4  Method must be in allowlist (write or create only).
//   R5  Success envelope: { ok, result_status, odoo_result, error, executed_at,
//       execution_source_inputs } — exact key set, no extras, no gaps.
//   R6  Failure envelope: same key set — ok:false, result_status:"failure",
//       error is a non-empty string.
//   R7  Route always returns JSON. HTTP 200 on ok, HTTP 400 on failure.
//   R8  Fail-closed: every missing or invalid input produces 400 + failure envelope.
//
// NOTE: The governed apply service uses _getClient for production. At the
// route boundary, _getClient is NOT injectable — the route calls applyGoverned
// without a mock client. Therefore "connection missing" is tested by passing a
// runtime_state that has no matching approval (service fails before reaching
// the client lookup). True connection-absent behavior is tested by omitting
// connection_context.project_id, which is validated before client lookup.
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";

import { createAppServer } from "../server.js";

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
});

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
// Frozen contract — exact key set for apply response envelope
// ---------------------------------------------------------------------------

const APPLY_RESPONSE_KEYS = Object.freeze([
  "error",
  "executed_at",
  "execution_source_inputs",
  "odoo_result",
  "ok",
  "result_status",
]);

function assertExactKeySet(obj, expectedKeys, label) {
  const actual = Object.keys(obj).sort();
  const expected = [...expectedKeys].sort();
  assert.deepStrictEqual(
    actual,
    expected,
    `${label}: key set drift.\n  actual: ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}`
  );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeApproval(overrides = {}) {
  return {
    approval_id: "approval-route-001",
    candidate_id: "candidate-route-001",
    preview_id: "preview-route-001",
    checkpoint_id: "CMP-ROUTE-001",
    safety_class: "safe",
    execution_occurred: false,
    ...overrides,
  };
}

function makeCandidate(overrides = {}) {
  return {
    candidate_id: "candidate-route-001",
    checkpoint_id: "CMP-ROUTE-001",
    preview_id: "preview-route-001",
    safety_class: "safe",
    ...overrides,
  };
}

function makePreview(overrides = {}) {
  return {
    preview_id: "preview-route-001",
    checkpoint_id: "CMP-ROUTE-001",
    checkpoint_class: "Foundational",
    safety_class: "safe",
    execution_approval_implied: false,
    ...overrides,
  };
}

function makeRuntimeState({
  approvals = [makeApproval()],
  candidates = [makeCandidate()],
  previews = [makePreview()],
} = {}) {
  return {
    previews,
    executions: [],
    _engine_outputs: {
      execution_approvals: { execution_approvals: approvals },
      execution_eligibility: { execution_candidates: candidates },
    },
  };
}

// The route calls applyGoverned without a mock client. For happy-path tests
// the service will reach the getClientForProject call and throw because no
// real Odoo connection exists in the test environment. That is the expected
// failure mode at the route boundary — the route returns a truthful failure
// envelope (ok:false, result_status:"failure") not a 500.
//
// To test the full success path through the route, we would need a live Odoo
// connection — out of scope for this slice. Success-path contract shape is
// verified by the governed-odoo-apply-service.test.js unit tests.
// The route tests below verify:
//   - All refusal paths return 400 + failure envelope
//   - The envelope key set is exact on refusal
//   - The happy-path (all inputs valid, no live connection) returns 400 +
//     failure envelope with the "No live Odoo connection" error message,
//     proving the route reached the Odoo client boundary (all governance
//     checks passed)
//   - No 500 errors at the route boundary

// ---------------------------------------------------------------------------
// Section 1 — Refusal: missing approval_id
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — refusal: missing approval_id", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      runtime_state: makeRuntimeState(),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set (R5/R6)", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "refusal envelope (missing approval_id)");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error is a non-empty string", () => {
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0);
  });

  test("odoo_result is null", () => {
    assert.strictEqual(res.body.odoo_result, null);
  });

  test("execution_source_inputs is null", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });

  test("executed_at is a non-empty string", () => {
    assert.strictEqual(typeof res.body.executed_at, "string");
    assert.ok(res.body.executed_at.length > 0);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Refusal: approval not found in runtime_state
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — refusal: approval not found", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "nonexistent-approval",
      runtime_state: makeRuntimeState({ approvals: [] }),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "refusal envelope (approval not found)");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions approval", () => {
    assert.ok(res.body.error.toLowerCase().includes("approval"));
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Refusal: re-execution attempt (execution_occurred not false)
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — refusal: re-execution attempt", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState({
        approvals: [makeApproval({ execution_occurred: true })],
      }),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "refusal envelope (re-execution)");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions execution_occurred", () => {
    assert.ok(res.body.error.includes("execution_occurred"));
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Refusal: preview missing
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — refusal: preview missing", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState({ previews: [] }),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "refusal envelope (preview missing)");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions Preview", () => {
    assert.ok(res.body.error.includes("Preview"));
  });
});

// ---------------------------------------------------------------------------
// Section 5 — Refusal: connection_context missing / project_id absent
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — refusal: connection_context missing", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState(),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "refusal envelope (no connection_context)");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });
});

describe("POST /api/pipeline/apply — refusal: project_id empty string", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState(),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });
});

// ---------------------------------------------------------------------------
// Section 6 — Refusal: model outside allowlist
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — refusal: model outside allowlist", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState(),
      operation: { model: "res.partner", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "refusal envelope (disallowed model)");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions the rejected model", () => {
    assert.ok(res.body.error.includes("res.partner"));
  });

  test("error mentions allowed set", () => {
    assert.ok(res.body.error.includes("not in the allowed apply set"));
  });
});

// ---------------------------------------------------------------------------
// Section 7 — Refusal: method outside allowlist
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — refusal: method outside allowlist", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState(),
      operation: { model: "res.company", method: "unlink", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "refusal envelope (disallowed method)");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions the rejected method", () => {
    assert.ok(res.body.error.includes("unlink"));
  });
});

// ---------------------------------------------------------------------------
// Section 8 — Refusal: write without ids
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — refusal: write without ids", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState(),
      operation: { model: "res.company", method: "write", values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "refusal envelope (write without ids)");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions ids", () => {
    assert.ok(res.body.error.includes("ids"));
  });
});

// ---------------------------------------------------------------------------
// Section 9 — Connection absent: governance passes, Odoo client fails closed
//
// All governance checks pass. The route reaches the Odoo client boundary and
// fails closed because no live connection exists in the test environment.
// This verifies that:
//   - preview-backed + approval-backed input passes all governance
//   - the route reaches the client layer
//   - the client layer fails closed with a truthful error
//   - the route returns 400 + failure envelope (not 500)
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — no live connection: governance passes, route fails closed", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState(),
      operation: { model: "res.company", method: "write", ids: [1], values: { name: "ACME" } },
      connection_context: { project_id: "proj-route-no-conn" },
    });
  });

  test("returns HTTP 400 (not 500)", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "connection-absent failure envelope");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error is a non-empty string (not invented)", () => {
    assert.strictEqual(typeof res.body.error, "string");
    assert.ok(res.body.error.length > 0);
  });

  test("error mentions connection", () => {
    assert.ok(
      res.body.error.toLowerCase().includes("connection") ||
      res.body.error.toLowerCase().includes("odoo"),
      `Expected error to mention connection or odoo, got: ${res.body.error}`
    );
  });

  test("odoo_result is null", () => {
    assert.strictEqual(res.body.odoo_result, null);
  });

  test("execution_source_inputs is null (not reached OdooClient)", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });
});

// ---------------------------------------------------------------------------
// Section 10 — Preview operation cross-check: model mismatch (S12)
//
// The preview carries target_model = "res.company". The caller supplies
// operation.model = "stock.warehouse". Cross-check fires before client lookup.
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — preview cross-check: model mismatch", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState({
        previews: [makePreview({ target_model: "res.company", target_operation: "write" })],
      }),
      operation: { model: "stock.warehouse", method: "write", ids: [1], values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "cross-check model mismatch envelope");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions mismatched model", () => {
    assert.ok(
      res.body.error.includes("stock.warehouse"),
      `Expected error to mention 'stock.warehouse', got: ${res.body.error}`
    );
  });

  test("error mentions preview-bound model", () => {
    assert.ok(
      res.body.error.includes("res.company"),
      `Expected error to mention 'res.company', got: ${res.body.error}`
    );
  });

  test("execution_source_inputs is null (refused before client lookup)", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });
});

// ---------------------------------------------------------------------------
// Section 11 — Preview operation cross-check: method mismatch (S12)
//
// The preview carries target_operation = "write". The caller supplies
// operation.method = "create". Cross-check fires before client lookup.
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — preview cross-check: method mismatch", () => {
  let res;
  before(async () => {
    res = await postJson("/api/pipeline/apply", {
      approval_id: "approval-route-001",
      runtime_state: makeRuntimeState({
        previews: [makePreview({ target_model: "res.company", target_operation: "write" })],
      }),
      operation: { model: "res.company", method: "create", values: { name: "X" } },
      connection_context: { project_id: "proj-route-001" },
    });
  });

  test("returns HTTP 400", () => {
    assert.strictEqual(res.status, 400);
  });

  test("envelope has exact key set", () => {
    assertExactKeySet(res.body, APPLY_RESPONSE_KEYS, "cross-check method mismatch envelope");
  });

  test("ok is false", () => {
    assert.strictEqual(res.body.ok, false);
  });

  test("result_status is 'failure'", () => {
    assert.strictEqual(res.body.result_status, "failure");
  });

  test("error mentions mismatched method", () => {
    assert.ok(
      res.body.error.includes("create"),
      `Expected error to mention 'create', got: ${res.body.error}`
    );
  });

  test("error mentions preview-bound operation", () => {
    assert.ok(
      res.body.error.includes("write"),
      `Expected error to mention 'write', got: ${res.body.error}`
    );
  });

  test("execution_source_inputs is null (refused before client lookup)", () => {
    assert.strictEqual(res.body.execution_source_inputs, null);
  });
});

// ---------------------------------------------------------------------------
// Malformed body: non-object bodies are rejected cleanly (renumbered)
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — malformed body handling", () => {
  test("null body: returns HTTP 400 with failure envelope", async () => {
    const res = await postJson("/api/pipeline/apply", null);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(typeof res.body.ok, "boolean");
    assert.strictEqual(res.body.ok, false);
  });

  test("array body: returns HTTP 400 with failure envelope", async () => {
    const res = await postJson("/api/pipeline/apply", []);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
  });

  test("empty object: returns HTTP 400 with failure envelope", async () => {
    const res = await postJson("/api/pipeline/apply", {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.ok, false);
    assert.strictEqual(res.body.result_status, "failure");
  });
});

// ---------------------------------------------------------------------------
// Section 11 — Response always JSON, never 500
// ---------------------------------------------------------------------------

describe("POST /api/pipeline/apply — route never returns 500", () => {
  const badInputs = [
    { label: "entirely missing runtime_state",
      body: { approval_id: "x", operation: { model: "res.company", method: "write", ids: [1], values: {} }, connection_context: { project_id: "p" } } },
    { label: "approval_id is a number",
      body: { approval_id: 42, runtime_state: makeRuntimeState(), operation: { model: "res.company", method: "write", ids: [1], values: {} }, connection_context: { project_id: "p" } } },
    { label: "operation is null",
      body: { approval_id: "x", runtime_state: makeRuntimeState(), operation: null, connection_context: { project_id: "p" } } },
    { label: "model is undefined (omitted)",
      body: { approval_id: "approval-route-001", runtime_state: makeRuntimeState(), operation: { method: "write", ids: [1], values: {} }, connection_context: { project_id: "p" } } },
  ];

  for (const { label, body } of badInputs) {
    test(`${label}: no 500`, async () => {
      const res = await postJson("/api/pipeline/apply", body);
      assert.notStrictEqual(res.status, 500, `Got 500 for: ${label}`);
      assert.strictEqual(res.body.ok, false);
    });
  }
});
