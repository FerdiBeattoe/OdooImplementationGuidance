import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ACCOUNTING_REPORTS_CHECKPOINT_GROUPS,
  isAccountingReportsCheckpoint,
} from "../accounting-reports-domain.js";

describe("accounting-reports-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(ACCOUNTING_REPORTS_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(ACCOUNTING_REPORTS_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of ACCOUNTING_REPORTS_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'accounting-reports'", () => {
    for (const entry of ACCOUNTING_REPORTS_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "accounting-reports", `${entry.id} domainId must be accounting-reports`);
    }
  });

  it("4. isAccountingReportsCheckpoint returns true for matching domainId", () => {
    assert.equal(isAccountingReportsCheckpoint({ domainId: "accounting-reports" }), true);
  });

  it("5. isAccountingReportsCheckpoint returns false for wrong domainId", () => {
    assert.equal(isAccountingReportsCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isAccountingReportsCheckpoint returns false for null/undefined", () => {
    assert.equal(isAccountingReportsCheckpoint(null), false);
    assert.equal(isAccountingReportsCheckpoint(undefined), false);
  });
});
