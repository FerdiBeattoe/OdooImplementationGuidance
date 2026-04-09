import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  FLEET_CHECKPOINT_GROUPS,
  isFleetCheckpoint,
} from "../fleet-domain.js";

describe("fleet-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(FLEET_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(FLEET_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of FLEET_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'fleet'", () => {
    for (const entry of FLEET_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "fleet", `${entry.id} domainId must be fleet`);
    }
  });

  it("4. isFleetCheckpoint returns true for matching domainId", () => {
    assert.equal(isFleetCheckpoint({ domainId: "fleet" }), true);
  });

  it("5. isFleetCheckpoint returns false for wrong domainId", () => {
    assert.equal(isFleetCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isFleetCheckpoint returns false for null/undefined", () => {
    assert.equal(isFleetCheckpoint(null), false);
    assert.equal(isFleetCheckpoint(undefined), false);
  });
});
