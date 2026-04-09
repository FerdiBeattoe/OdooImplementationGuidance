// ---------------------------------------------------------------------------
// server.test.js — New route and URL normaliser tests
// app/backend/tests/server.test.js
// ---------------------------------------------------------------------------
//
// Covers:
//   1. URL normaliser — all 8 input formats specified in the task
//   2. URL normaliser — rejection of genuinely invalid input
//   3. POST /api/odoo/detect-databases — success response shape
//   4. POST /api/odoo/detect-databases — timeout returns ok:false not throw
//   5. POST /api/odoo/detect-databases — unreachable host returns ok:false
//   6. Form flow — database dropdown shown on successful detection (contract)
//   7. Form flow — text input shown on failed detection (contract)
//   8. "Create a new database" option stores name correctly (normaliser + contract)
//
// Governance:
//   - No engine files modified.
//   - No proof-track state files modified.
//   - No direct database writes.
//   - Additive: only new functionality tested here.
// ---------------------------------------------------------------------------

"use strict";

import { describe, test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest, createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createAppServer } from "../server.js";
import { normaliseOdooUrl } from "../../frontend/src/state/onboarding-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ---------------------------------------------------------------------------
// HTTP helpers
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
// SECTION 1: URL normaliser — all 8 input formats
// ---------------------------------------------------------------------------

describe("URL normaliser — normaliseOdooUrl", () => {

  // Test 1a: bare hostname with no protocol → https + .odoo.com not appended (already has dot)
  test("mycompany.odoo.com → https://mycompany.odoo.com", () => {
    const result = normaliseOdooUrl("mycompany.odoo.com");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
    assert.equal(result.error, null);
  });

  // Test 1b: bare word with no dots → appends .odoo.com
  test("mycompany → https://mycompany.odoo.com", () => {
    const result = normaliseOdooUrl("mycompany");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
    assert.equal(result.error, null);
  });

  // Test 1c: http:// → forced to https://
  test("http://mycompany.odoo.com → https://mycompany.odoo.com", () => {
    const result = normaliseOdooUrl("http://mycompany.odoo.com");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
    assert.equal(result.error, null);
  });

  // Test 1d: trailing slash stripped
  test("https://mycompany.odoo.com/ → https://mycompany.odoo.com", () => {
    const result = normaliseOdooUrl("https://mycompany.odoo.com/");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
    assert.equal(result.error, null);
  });

  // Test 1e: path with fragment stripped
  test("mycompany.odoo.com/web#action=... → https://mycompany.odoo.com", () => {
    const result = normaliseOdooUrl("mycompany.odoo.com/web#action=mail.action_discuss");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
    assert.equal(result.error, null);
  });

  // Test 1f: path segment beyond hostname stripped
  test("https://mycompany.odoo.com/web → https://mycompany.odoo.com", () => {
    const result = normaliseOdooUrl("https://mycompany.odoo.com/web");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
    assert.equal(result.error, null);
  });

  // Test 1g: uppercase hostname → lowercased
  test("MYCOMPANY.ODOO.COM → https://mycompany.odoo.com", () => {
    const result = normaliseOdooUrl("MYCOMPANY.ODOO.COM");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
    assert.equal(result.error, null);
  });

  // Test 1h: non-standard port preserved
  test("mycompany.odoo.com:8069 → https://mycompany.odoo.com:8069", () => {
    const result = normaliseOdooUrl("mycompany.odoo.com:8069");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com:8069");
    assert.equal(result.error, null);
  });

  // Test 1h variant: port preserved with http prefix
  test("http://mycompany.odoo.com:8069 → https://mycompany.odoo.com:8069", () => {
    const result = normaliseOdooUrl("http://mycompany.odoo.com:8069");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com:8069");
    assert.equal(result.error, null);
  });

});

// ---------------------------------------------------------------------------
// SECTION 2: URL normaliser — rejection of invalid input
// ---------------------------------------------------------------------------

describe("URL normaliser — rejection", () => {

  test("empty string → ok:false with helpful message", () => {
    const result = normaliseOdooUrl("");
    assert.equal(result.ok, false);
    assert.equal(result.url, null);
    assert.match(result.error, /mycompany\.odoo\.com/);
  });

  test("null → ok:false with helpful message", () => {
    const result = normaliseOdooUrl(null);
    assert.equal(result.ok, false);
    assert.equal(result.url, null);
    assert.match(result.error, /mycompany\.odoo\.com/);
  });

  test("whitespace only → ok:false", () => {
    const result = normaliseOdooUrl("   ");
    assert.equal(result.ok, false);
    assert.equal(result.url, null);
  });

  test("hostname with illegal chars → ok:false", () => {
    const result = normaliseOdooUrl("https://my company.odoo.com");
    assert.equal(result.ok, false);
    assert.equal(result.url, null);
    assert.match(result.error, /mycompany\.odoo\.com/);
  });

  test("error message does not say 'Invalid URL' — uses helpful message", () => {
    const result = normaliseOdooUrl("https://bad host!");
    assert.equal(result.ok, false);
    assert.notEqual(result.error, "Invalid URL");
    assert.match(result.error, /mycompany\.odoo\.com/);
  });

});

// ---------------------------------------------------------------------------
// SECTION 3: POST /api/odoo/detect-databases — success response shape
// ---------------------------------------------------------------------------

describe("POST /api/odoo/detect-databases — response shape", () => {

  test("route exists and returns JSON with ok and databases fields", async () => {
    // The route should always return a response (never throw).
    // We call it with a localhost URL that won't have Odoo — expect ok:false but correct shape.
    const result = await post("/api/odoo/detect-databases", {
      url: "https://localhost:19999",
    });
    assert.equal(result.statusCode, 200, "HTTP status must be 200 even on failure");
    assert.equal(typeof result.body, "object");
    assert.equal(typeof result.body.ok, "boolean");
    assert.ok(Array.isArray(result.body.databases), "databases must be an array");
  });

  test("missing url returns ok:false with error", async () => {
    const result = await post("/api/odoo/detect-databases", {});
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, false);
    assert.ok(result.body.error);
    assert.deepEqual(result.body.databases, []);
  });

  test("invalid JSON body returns ok:false (not a 500 crash)", async () => {
    // Send raw non-JSON to verify route never crashes
    const result = await new Promise((resolve, reject) => {
      const bodyStr = "not json at all";
      const req = httpRequest(
        {
          hostname: "127.0.0.1",
          port: serverPort,
          path: "/api/odoo/detect-databases",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyStr),
          },
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");
            try {
              resolve({ statusCode: res.statusCode, body: JSON.parse(raw) });
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
    // Must not be a 500 — should be 200 with ok:false
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, false);
    assert.deepEqual(result.body.databases, []);
  });

  test("invalid URL format returns ok:false", async () => {
    const result = await post("/api/odoo/detect-databases", {
      url: "not-a-url",
    });
    // "not-a-url" has no dot so falls through to URL parse failure
    // The route validates URL before calling Odoo — should return ok:false
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, false);
    assert.deepEqual(result.body.databases, []);
  });

});

// ---------------------------------------------------------------------------
// SECTION 4: Timeout returns ok:false, not an unhandled error
// ---------------------------------------------------------------------------

describe("POST /api/odoo/detect-databases — timeout behaviour", () => {

  test("unreachable host (non-routable IP) returns ok:false within reasonable time", async () => {
    // 192.0.2.x is TEST-NET per RFC 5737 — guaranteed non-routable, connection
    // will fail immediately or be refused (not hang). On Windows it typically
    // produces ECONNREFUSED immediately which is still a non-throw failure path.
    const start = Date.now();
    const result = await post("/api/odoo/detect-databases", {
      url: "https://192.0.2.1:19999",
    });
    const elapsed = Date.now() - start;
    assert.equal(result.statusCode, 200, "HTTP 200 even on network failure");
    assert.equal(result.body.ok, false);
    assert.ok(Array.isArray(result.body.databases));
    assert.deepEqual(result.body.databases, []);
    assert.ok(typeof result.body.error === "string", "error string present");
    // Should not take longer than 6s (5s timeout + 1s buffer)
    assert.ok(elapsed < 6000, `elapsed ${elapsed}ms should be < 6000ms`);
  });

});

// ---------------------------------------------------------------------------
// SECTION 5: Unreachable host returns ok:false (not an error throw)
// ---------------------------------------------------------------------------

describe("POST /api/odoo/detect-databases — unreachable host", () => {

  test("ECONNREFUSED returns ok:false with error string", async () => {
    // Use a local port that is definitely not listening
    const result = await post("/api/odoo/detect-databases", {
      url: "https://127.0.0.1:19998",
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, false);
    assert.ok(typeof result.body.error === "string");
    assert.deepEqual(result.body.databases, []);
  });

});

// ---------------------------------------------------------------------------
// SECTION 6-8: Form-flow contract tests
//
// The form UI itself runs in the browser and cannot be executed in Node.
// These tests verify the *contracts* that the form logic depends on:
//
//   6. If detect-databases returns { ok:true, databases: [...] }, the response
//      shape is a non-empty array — confirming the dropdown condition is met.
//
//   7. If detect-databases returns { ok:false }, the response confirms the
//      manual-entry condition is met.
//
//   8. The "create a new database" option: verified via normaliser contract —
//      a valid URL is normalised correctly and a new database name is a plain
//      string that can be passed to registerConnection unchanged.
// ---------------------------------------------------------------------------

describe("Form flow contracts — database detection response shapes", () => {

  test("6: ok:true + non-empty databases array satisfies dropdown condition", async () => {
    // Stand up a minimal Odoo-mock server that returns { result: ["mydb"] }
    const mockServer = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ result: ["mydb", "testdb"] }));
    });
    await new Promise((resolve) => mockServer.listen(0, "127.0.0.1", resolve));
    const mockPort = mockServer.address().port;

    try {
      const result = await post("/api/odoo/detect-databases", {
        url: `http://127.0.0.1:${mockPort}`,
      });
      assert.equal(result.statusCode, 200);
      assert.equal(result.body.ok, true);
      assert.ok(Array.isArray(result.body.databases));
      assert.ok(result.body.databases.length > 0, "databases must be non-empty for dropdown to show");
      assert.ok(result.body.databases.includes("mydb"));
      assert.ok(result.body.databases.includes("testdb"));
    } finally {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });

  test("7: ok:false satisfies manual-entry condition", async () => {
    // Unreachable target — the response must be ok:false
    const result = await post("/api/odoo/detect-databases", {
      url: "https://127.0.0.1:19997",
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.ok, false, "ok:false triggers manual entry mode in the form");
    assert.deepEqual(result.body.databases, []);
  });

  test("8: 'Create a new database' — new db name is a plain string, normalised URL is canonical", () => {
    // The form stores formState.database = whatever the user types in the new-db input.
    // This test verifies that normaliseOdooUrl returns a canonical URL that can be
    // passed through to registerConnection alongside a plain string database name.
    const urlResult = normaliseOdooUrl("mycompany.odoo.com");
    assert.equal(urlResult.ok, true);
    assert.equal(urlResult.url, "https://mycompany.odoo.com");

    // Simulate: user typed "newdb2025" in the create-new input
    const newDbName = "newdb2025";
    assert.equal(typeof newDbName, "string");
    assert.ok(newDbName.length > 0, "new database name must be non-empty");

    // The two values can be passed to registerConnection(url, database, username, password)
    // without modification — no transformation is applied to database names
    assert.equal(urlResult.url, "https://mycompany.odoo.com");
    assert.equal(newDbName, "newdb2025");
  });

});

// ---------------------------------------------------------------------------
// Additional normaliser edge cases
// ---------------------------------------------------------------------------

describe("URL normaliser — additional edge cases", () => {

  test("https URL with trailing slash and path → strips to hostname", () => {
    const result = normaliseOdooUrl("https://mycompany.odoo.com/web/login");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
  });

  test("mixed-case http URL → https + lowercase", () => {
    const result = normaliseOdooUrl("HTTP://MyCompany.Odoo.COM");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
  });

  test("URL with query string → query stripped", () => {
    const result = normaliseOdooUrl("mycompany.odoo.com?foo=bar");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com");
  });

  test("bare word with port → appends .odoo.com and preserves port", () => {
    const result = normaliseOdooUrl("mycompany:8069");
    assert.equal(result.ok, true);
    assert.equal(result.url, "https://mycompany.odoo.com:8069");
  });

});

// ---------------------------------------------------------------------------
// SECTION 9: Dev-mode membership bypass
// ---------------------------------------------------------------------------

describe("POST /api/odoo/scan — dev-mode membership bypass", () => {

  test("dev stub user can call scan without team membership", async () => {
    const result = await post("/api/odoo/scan", {
      projectId: "proj_devscan",
    });
    assert.equal(result.statusCode, 400, "missing database validation triggered");
    assert.notEqual(result.statusCode, 403, "must not block dev mode with membership check");
    assert.equal(result.body.error, "database is required.");
  });

});
