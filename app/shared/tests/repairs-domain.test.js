import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  REPAIRS_CHECKPOINT_GROUPS,
  isRepairsCheckpoint,
} from "../repairs-domain.js";

describe("repairs-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(REPAIRS_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(REPAIRS_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of REPAIRS_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'repairs'", () => {
    for (const entry of REPAIRS_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "repairs", `${entry.id} domainId must be repairs`);
    }
  });

  it("4. isRepairsCheckpoint returns true for matching domainId", () => {
    assert.equal(isRepairsCheckpoint({ domainId: "repairs" }), true);
  });

  it("5. isRepairsCheckpoint returns false for wrong domainId", () => {
    assert.equal(isRepairsCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isRepairsCheckpoint returns false for null/undefined", () => {
    assert.equal(isRepairsCheckpoint(null), false);
    assert.equal(isRepairsCheckpoint(undefined), false);
  });
});
