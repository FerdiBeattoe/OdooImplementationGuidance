import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  OUTGOING_MAIL_CHECKPOINT_GROUPS,
  isOutgoingMailCheckpoint,
} from "../outgoing-mail-domain.js";

describe("outgoing-mail-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(OUTGOING_MAIL_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(OUTGOING_MAIL_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of OUTGOING_MAIL_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'outgoing-mail'", () => {
    for (const entry of OUTGOING_MAIL_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "outgoing-mail", `${entry.id} domainId must be outgoing-mail`);
    }
  });

  it("4. isOutgoingMailCheckpoint returns true for matching domainId", () => {
    assert.equal(isOutgoingMailCheckpoint({ domainId: "outgoing-mail" }), true);
  });

  it("5. isOutgoingMailCheckpoint returns false for wrong domainId", () => {
    assert.equal(isOutgoingMailCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isOutgoingMailCheckpoint returns false for null/undefined", () => {
    assert.equal(isOutgoingMailCheckpoint(null), false);
    assert.equal(isOutgoingMailCheckpoint(undefined), false);
  });
});
