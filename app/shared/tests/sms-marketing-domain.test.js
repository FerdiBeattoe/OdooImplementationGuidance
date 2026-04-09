import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  SMS_MARKETING_CHECKPOINT_GROUPS,
  isSmsMarketingCheckpoint,
} from "../sms-marketing-domain.js";

describe("sms-marketing-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(SMS_MARKETING_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(SMS_MARKETING_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of SMS_MARKETING_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'sms-marketing'", () => {
    for (const entry of SMS_MARKETING_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "sms-marketing", `${entry.id} domainId must be sms-marketing`);
    }
  });

  it("4. isSmsMarketingCheckpoint returns true for matching domainId", () => {
    assert.equal(isSmsMarketingCheckpoint({ domainId: "sms-marketing" }), true);
  });

  it("5. isSmsMarketingCheckpoint returns false for wrong domainId", () => {
    assert.equal(isSmsMarketingCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isSmsMarketingCheckpoint returns false for null/undefined", () => {
    assert.equal(isSmsMarketingCheckpoint(null), false);
    assert.equal(isSmsMarketingCheckpoint(undefined), false);
  });
});
