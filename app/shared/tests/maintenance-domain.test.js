import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MAINTENANCE_CHECKPOINT_GROUPS,
  isMaintenanceCheckpoint,
} from "../maintenance-domain.js";

describe("maintenance-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(MAINTENANCE_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(MAINTENANCE_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of MAINTENANCE_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'maintenance'", () => {
    for (const entry of MAINTENANCE_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "maintenance", `${entry.id} domainId must be maintenance`);
    }
  });

  it("4. isMaintenanceCheckpoint returns true for matching domainId", () => {
    assert.equal(isMaintenanceCheckpoint({ domainId: "maintenance" }), true);
  });

  it("5. isMaintenanceCheckpoint returns false for wrong domainId", () => {
    assert.equal(isMaintenanceCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isMaintenanceCheckpoint returns false for null/undefined", () => {
    assert.equal(isMaintenanceCheckpoint(null), false);
    assert.equal(isMaintenanceCheckpoint(undefined), false);
  });
});
