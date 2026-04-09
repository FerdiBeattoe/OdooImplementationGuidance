import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  VOIP_CHECKPOINT_GROUPS,
  isVoipCheckpoint,
} from "../voip-domain.js";

describe("voip-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(VOIP_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(VOIP_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of VOIP_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'voip'", () => {
    for (const entry of VOIP_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "voip", `${entry.id} domainId must be voip`);
    }
  });

  it("4. isVoipCheckpoint returns true for matching domainId", () => {
    assert.equal(isVoipCheckpoint({ domainId: "voip" }), true);
  });

  it("5. isVoipCheckpoint returns false for wrong domainId", () => {
    assert.equal(isVoipCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isVoipCheckpoint returns false for null/undefined", () => {
    assert.equal(isVoipCheckpoint(null), false);
    assert.equal(isVoipCheckpoint(undefined), false);
  });
});
