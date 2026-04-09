import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  INCOMING_MAIL_CHECKPOINT_GROUPS,
  isIncomingMailCheckpoint,
} from "../incoming-mail-domain.js";

describe("incoming-mail-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(INCOMING_MAIL_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(INCOMING_MAIL_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of INCOMING_MAIL_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'incoming-mail'", () => {
    for (const entry of INCOMING_MAIL_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "incoming-mail", `${entry.id} domainId must be incoming-mail`);
    }
  });

  it("4. isIncomingMailCheckpoint returns true for matching domainId", () => {
    assert.equal(isIncomingMailCheckpoint({ domainId: "incoming-mail" }), true);
  });

  it("5. isIncomingMailCheckpoint returns false for wrong domainId", () => {
    assert.equal(isIncomingMailCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isIncomingMailCheckpoint returns false for null/undefined", () => {
    assert.equal(isIncomingMailCheckpoint(null), false);
    assert.equal(isIncomingMailCheckpoint(undefined), false);
  });
});
