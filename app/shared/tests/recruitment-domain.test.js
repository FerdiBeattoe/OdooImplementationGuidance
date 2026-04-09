import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  RECRUITMENT_CHECKPOINT_GROUPS,
  isRecruitmentCheckpoint,
} from "../recruitment-domain.js";

describe("recruitment-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(RECRUITMENT_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(RECRUITMENT_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of RECRUITMENT_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'recruitment'", () => {
    for (const entry of RECRUITMENT_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "recruitment", `${entry.id} domainId must be recruitment`);
    }
  });

  it("4. isRecruitmentCheckpoint returns true for matching domainId", () => {
    assert.equal(isRecruitmentCheckpoint({ domainId: "recruitment" }), true);
  });

  it("5. isRecruitmentCheckpoint returns false for wrong domainId", () => {
    assert.equal(isRecruitmentCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isRecruitmentCheckpoint returns false for null/undefined", () => {
    assert.equal(isRecruitmentCheckpoint(null), false);
    assert.equal(isRecruitmentCheckpoint(undefined), false);
  });
});
