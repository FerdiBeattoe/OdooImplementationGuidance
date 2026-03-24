import test from "node:test";
import assert from "node:assert/strict";

import { getConnectionWorkspaceModel, getDashboardSection } from "./dashboard-model.js";

test("connection workspace model states that application-layer connection is supported but not active", () => {
  const model = getConnectionWorkspaceModel({
    projectIdentity: {
      version: "19",
      edition: "Community",
      deployment: "On-Premise"
    }
  });

  assert.equal(model.status, "Not connected");
  assert.match(model.headline, /No live Odoo application-layer session is active/i);
  assert.ok(model.unsupportedMethods.some((item) => item.includes("Direct database access")));
});

test("connection workspace model explains Odoo.sh branch targeting without overclaiming execution", () => {
  const model = getConnectionWorkspaceModel({
    projectIdentity: {
      version: "19",
      edition: "Enterprise",
      deployment: "Odoo.sh"
    }
  });

  assert.match(model.deploymentExplanation, /branch-aware/i);
  assert.match(model.targetingExplanation, /branch or environment targeting is required/i);
  assert.ok(model.unsupportedMethods.some((item) => item.includes("SSH")));
});

test("connection workspace model reflects active bounded execution state", () => {
  const model = getConnectionWorkspaceModel({
    projectIdentity: {
      version: "19",
      edition: "Community",
      deployment: "On-Premise"
    },
    connectionState: {
      status: "connected_execute",
      capabilityLevel: "execute",
      availableFeatures: {
        inspect: true,
        preview: true,
        execute: true
      }
    }
  });

  assert.equal(model.status, "Connected for bounded execution");
  assert.ok(model.supportedMethods.includes("Bounded execution of approved safe actions"));
});

test("dashboard section lookup fails safe to overview", () => {
  assert.equal(getDashboardSection("missing-section").id, "overview");
});
