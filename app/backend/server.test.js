import test from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";

import { createInitialProjectState } from "../shared/project-state.js";
import { createAppServer } from "./server.js";

function requestJson(port, pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        hostname: "127.0.0.1",
        port,
        path: pathname,
        method: options.method || "GET",
        headers: options.headers || {}
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            statusCode: res.statusCode,
            body: raw ? JSON.parse(raw) : {}
          });
        });
      }
    );

    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

test("server health endpoint responds successfully", async () => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
  } finally {
    server.close();
  }
});

test("connection connect endpoint returns normalized project when fetch is stubbed", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes("/web/session/authenticate")) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: { uid: 5 }
        }),
        {
          status: 200,
          headers: { "set-cookie": "session_id=session-123; Path=/" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: {
          server_version: "19.0",
          server_serie: "19.0"
        }
      }),
      { status: 200 }
    );
  };

  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();

  try {
    const response = await requestJson(address.port, "/api/connection/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: createInitialProjectState(),
        credentials: {
          url: "https://example.odoo.test",
          database: "demo",
          username: "admin",
          password: "secret"
        }
      })
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.project.connectionState.status, "connected_execute");
  } finally {
    global.fetch = originalFetch;
    server.close();
  }
});
