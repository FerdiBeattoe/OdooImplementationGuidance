// ---------------------------------------------------------------------------
// odoo-install-module-route.test.js
// app/backend/tests/odoo-install-module-route.test.js
// ---------------------------------------------------------------------------
//
// Covers transport-alignment fix for handleOdooInstallModule:
//   1. No live session → database/username/password/url validation fires (fallback path)
//   2. No live session → missing database → 400
//   3. No live session → missing username → 400
//   4. No live session → missing password → 400
//   5. No live session → invalid url → 400
//   6. Live session present → database/username/password/url NOT required → reaches Odoo
//   7. moduleName validated before session check (always required)
//   8. projectId validated before session check (always required)
//
// Governance:
//   - No governed pipeline logic touched.
//   - No checkpoint logic touched.
//   - No discovery questions touched.
//   - Only handleOdooInstallModule path tested.
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";

import { createAppServer } from "../server.js";
import {
  _forTestOnly_seedConnection,
  _forTestOnly_clearConnection,
} from "../engine.js";
import { OdooClient } from "../odoo-client.js";

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
});

const LIVE_SESSION_PROJECT_ID = "test-install-live-session";

afterEach(() => {
  _forTestOnly_clearConnection(LIVE_SESSION_PROJECT_ID);
});

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
          try {
            resolve({ statusCode: res.statusCode, body: raw ? JSON.parse(raw) : {} });
          } catch {
            resolve({ statusCode: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tests: fallback path — no live session present
// ---------------------------------------------------------------------------

describe("POST /api/odoo/install-module — no live session (fallback path)", () => {

  test("missing projectId → 400 projectId is required", async () => {
    const result = await post("/api/odoo/install-module", {
      moduleName: "sale",
    });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error, "projectId is required.");
  });

  test("missing moduleName → 400 moduleName is required", async () => {
    const result = await post("/api/odoo/install-module", {
      projectId: "proj-no-session",
    });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error, "moduleName is required.");
  });

  test("invalid moduleName pattern → 400 letters/numbers/underscores only", async () => {
    const result = await post("/api/odoo/install-module", {
      projectId: "proj-no-session",
      moduleName: "sale module!", // contains space and !
    });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error, "moduleName must contain only letters, numbers, and underscores.");
  });

  test("no live session, missing database → 400 database is required", async () => {
    const result = await post("/api/odoo/install-module", {
      projectId: "proj-no-session",
      moduleName: "sale",
      // database omitted — no live session → fallback path → database required
    });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error, "database is required.");
  });

  test("no live session, missing username → 400 username is required", async () => {
    const result = await post("/api/odoo/install-module", {
      projectId: "proj-no-session",
      moduleName: "sale",
      database: "mydb",
      // username omitted
    });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error, "username is required.");
  });

  test("no live session, missing password → 400 password is required", async () => {
    const result = await post("/api/odoo/install-module", {
      projectId: "proj-no-session",
      moduleName: "sale",
      database: "mydb",
      username: "admin",
      // password omitted
    });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error, "password is required.");
  });

  test("no live session, invalid url → 400 url validation error", async () => {
    const result = await post("/api/odoo/install-module", {
      projectId: "proj-no-session",
      moduleName: "sale",
      database: "mydb",
      username: "admin",
      password: "pass",
      url: "not-a-valid-url-at-all!!!",
    });
    assert.equal(result.statusCode, 400);
    // Error message comes from validateOdooBaseUrl — just verify it is a 400
    assert.ok(result.body.error, "expected an error message for invalid url");
  });

});

// ---------------------------------------------------------------------------
// Tests: live session path — session present, credentials not required
// ---------------------------------------------------------------------------

describe("POST /api/odoo/install-module — live session present", () => {

  test("live session: database/username/password/url not required; reaches Odoo client (module-not-found)", async () => {
    // Seed a fake connection entry. OdooClient will be constructed from it but
    // will fail at searchRead (no real Odoo server) — that is the expected
    // outcome here. The test proves that the handler does NOT return a
    // credential-validation 400 when a live session is registered.
    _forTestOnly_seedConnection(LIVE_SESSION_PROJECT_ID, {
      baseUrl: "https://127.0.0.1:19999", // unreachable — will cause a connection error
      database: "seeded_db",
      sessionId: "fake-session-id",
      uid: 2,
    });

    const result = await post("/api/odoo/install-module", {
      projectId: LIVE_SESSION_PROJECT_ID,
      moduleName: "sale",
      // No database, username, password, or url supplied
    });

    // Must not be a credential-validation 400
    assert.notEqual(result.body.error, "database is required.", "live session: database must not be required");
    assert.notEqual(result.body.error, "username is required.", "live session: username must not be required");
    assert.notEqual(result.body.error, "password is required.", "live session: password must not be required");

    // The handler attempted the Odoo call and got a connection/transport error
    // (not a 400 validation error). Accept any non-credential-validation response.
    // In practice this will be a 500 or a connection-error response, not 400.
    assert.notEqual(result.statusCode, 400, "live session path must not return a credential-validation 400");
  });

  test("live session: moduleName still required even with live session", async () => {
    _forTestOnly_seedConnection(LIVE_SESSION_PROJECT_ID, {
      baseUrl: "https://127.0.0.1:19999",
      database: "seeded_db",
      sessionId: "fake-session-id",
      uid: 2,
    });

    const result = await post("/api/odoo/install-module", {
      projectId: LIVE_SESSION_PROJECT_ID,
      // moduleName omitted
    });

    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error, "moduleName is required.");
  });

  test("live session: invalid moduleName pattern still rejected even with live session", async () => {
    _forTestOnly_seedConnection(LIVE_SESSION_PROJECT_ID, {
      baseUrl: "https://127.0.0.1:19999",
      database: "seeded_db",
      sessionId: "fake-session-id",
      uid: 2,
    });

    const result = await post("/api/odoo/install-module", {
      projectId: LIVE_SESSION_PROJECT_ID,
      moduleName: "bad name!",
    });

    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error, "moduleName must contain only letters, numbers, and underscores.");
  });

});
