import { describe, before, after, test } from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";

import { createAppServer } from "../server.js";
import { saveRuntimeState } from "../runtime-state-persistence-service.js";
import { createPersistedProjectState } from "../../shared/runtime-state-contract.js";

describe("POST /api/pipeline/wizard-capture", () => {
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

  test("two-step reception wizard capture updates INV-DREQ-004 intended changes", async () => {
    const projectId = `proj_wizard_two_${Date.now()}`;
    await seedRuntimeState(projectId, "2 steps");

    const response = await post("/api/pipeline/wizard-capture", {
      project_id: projectId,
      domain: "inventory",
      wizard_data: {
        reception_steps: "two_steps",
        delivery_steps: "two_step",
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);

    const checkpoint = findCheckpoint(response.body.checkpoints, "INV-DREQ-004");
    assert.ok(checkpoint, "INV-DREQ-004 should be present");
    assert.deepEqual(checkpoint.intended_changes, {
      reception_steps: "two_steps",
      delivery_steps: "two_step",
    });
  });

  test("three-step reception wizard capture populates INV-DREQ-005 defaults", async () => {
    const projectId = `proj_wizard_three_${Date.now()}`;
    await seedRuntimeState(projectId, "3 steps");

    const response = await post("/api/pipeline/wizard-capture", {
      project_id: projectId,
      domain: "inventory",
      wizard_data: {
        reception_steps: "three_steps",
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);

    const checkpoint = findCheckpoint(response.body.checkpoints, "INV-DREQ-005");
    assert.ok(checkpoint, "INV-DREQ-005 should be present");
    assert.deepEqual(checkpoint.intended_changes, {
      reception_steps: "three_steps",
      delivery_steps: "pick_pack_ship",
    });
  });

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
            let bodyJson;
            try {
              bodyJson = raw ? JSON.parse(raw) : {};
            } catch {
              bodyJson = raw;
            }
            resolve({ statusCode: res.statusCode, body: bodyJson });
          });
        }
      );
      req.on("error", reject);
      req.write(bodyStr);
      req.end();
    });
  }
});

async function seedRuntimeState(projectId, pi03Value) {
  const runtimeState = createPersistedProjectState();
  runtimeState.project_identity.project_id = projectId;
  runtimeState.discovery_answers.answers["PI-03"] = pi03Value;
  runtimeState.wizard_captures = runtimeState.wizard_captures || {};
  const saveResult = await saveRuntimeState(runtimeState);
  assert.equal(saveResult.ok, true, `Failed to seed runtime state for ${projectId}`);
}

function findCheckpoint(checkpoints, checkpointId) {
  if (!Array.isArray(checkpoints)) {
    return null;
  }
  return checkpoints.find((entry) => entry?.checkpoint_id === checkpointId) || null;
}
