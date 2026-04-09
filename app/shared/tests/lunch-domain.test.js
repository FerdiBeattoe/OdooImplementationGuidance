import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  LUNCH_CHECKPOINT_GROUPS,
  isLunchCheckpoint,
} from "../lunch-domain.js";

describe("lunch-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(LUNCH_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(LUNCH_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of LUNCH_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'lunch'", () => {
    for (const entry of LUNCH_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "lunch", `${entry.id} domainId must be lunch`);
    }
  });

  it("4. isLunchCheckpoint returns true for matching domainId", () => {
    assert.equal(isLunchCheckpoint({ domainId: "lunch" }), true);
  });

  it("5. isLunchCheckpoint returns false for wrong domainId", () => {
    assert.equal(isLunchCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isLunchCheckpoint returns false for null/undefined", () => {
    assert.equal(isLunchCheckpoint(null), false);
    assert.equal(isLunchCheckpoint(undefined), false);
  });
});
