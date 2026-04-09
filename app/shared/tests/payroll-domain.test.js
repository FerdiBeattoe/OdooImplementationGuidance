import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  PAYROLL_CHECKPOINT_GROUPS,
  isPayrollCheckpoint,
} from "../payroll-domain.js";

describe("payroll-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(PAYROLL_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(PAYROLL_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of PAYROLL_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'payroll'", () => {
    for (const entry of PAYROLL_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "payroll", `${entry.id} domainId must be payroll`);
    }
  });

  it("4. isPayrollCheckpoint returns true for matching domainId", () => {
    assert.equal(isPayrollCheckpoint({ domainId: "payroll" }), true);
  });

  it("5. isPayrollCheckpoint returns false for wrong domainId", () => {
    assert.equal(isPayrollCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isPayrollCheckpoint returns false for null/undefined", () => {
    assert.equal(isPayrollCheckpoint(null), false);
    assert.equal(isPayrollCheckpoint(undefined), false);
  });
});
