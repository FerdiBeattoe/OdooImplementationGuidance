import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  RENTAL_CHECKPOINT_GROUPS,
  isRentalCheckpoint,
} from "../rental-domain.js";

describe("rental-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(RENTAL_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(RENTAL_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of RENTAL_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'rental'", () => {
    for (const entry of RENTAL_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "rental", `${entry.id} domainId must be rental`);
    }
  });

  it("4. isRentalCheckpoint returns true for matching domainId", () => {
    assert.equal(isRentalCheckpoint({ domainId: "rental" }), true);
  });

  it("5. isRentalCheckpoint returns false for wrong domainId", () => {
    assert.equal(isRentalCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isRentalCheckpoint returns false for null/undefined", () => {
    assert.equal(isRentalCheckpoint(null), false);
    assert.equal(isRentalCheckpoint(undefined), false);
  });
});
