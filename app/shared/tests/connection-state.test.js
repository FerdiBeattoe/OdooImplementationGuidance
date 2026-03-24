import test from "node:test";
import assert from "node:assert/strict";

import { createInitialConnectionState, normalizeConnectionState, deriveConnectionWorkspaceModel } from "../connection-state.js";

test("connection state normalizes to unsupported when version is not Odoo 19", () => {
  const normalized = normalizeConnectionState(createInitialConnectionState(), {
    version: "18",
    edition: "Community",
    deployment: "On-Premise"
  });

  assert.equal(normalized.status, "unsupported");
  assert.match(normalized.reason, /Only Odoo 19/);
});

test("connection state downgrades execute capability when Odoo.sh target is missing", () => {
  const normalized = normalizeConnectionState(
    {
      status: "connected_execute",
      capabilityLevel: "execute",
      availableFeatures: { inspect: true, preview: true, execute: true }
    },
    {
      version: "19",
      edition: "Enterprise",
      deployment: "Odoo.sh"
    }
  );

  assert.equal(normalized.capabilityLevel, "preview");
  assert.equal(normalized.availableFeatures.execute, false);
});

test("connection workspace model under-claims unsupported methods", () => {
  const model = deriveConnectionWorkspaceModel(
    createInitialConnectionState(),
    {
      version: "19",
      edition: "Community",
      deployment: "On-Premise"
    }
  );

  assert.equal(model.status, "Not connected");
  assert.ok(model.unsupportedMethods.includes("Direct database access"));
});
