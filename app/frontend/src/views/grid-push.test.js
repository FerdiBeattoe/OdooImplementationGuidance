// ---------------------------------------------------------------------------
// grid-push tests — Import Wizard write surface truth contract
// ---------------------------------------------------------------------------
//
// Covers:
//   1. All push functions return REFUSED (success: false) — no Odoo writes occur
//   2. REFUSED detail message is present and non-empty
//   3. GRID_PUSH_MAP covers all expected grid IDs
//   4. No push function returns success: true under any input
//
// These tests exist to make the ungoverned-write guard explicit.
// If any push function is ever wired to a live write path,
// these tests will catch the contract change.
// ---------------------------------------------------------------------------

import assert from "node:assert/strict";
import { test, describe } from "node:test";

import {
  pushProductRow,
  pushProductVariantRow,
  pushCustomerRow,
  pushVendorRow,
  pushBomRow,
  pushEmployeeRow,
  pushOpeningBalanceRow,
  pushReorderingRuleRow,
  pushPutawayRuleRow,
  pushSalesOrderRow,
  GRID_PUSH_MAP,
} from "./grid-push.js";

const ALL_PUSH_FNS = [
  ["pushProductRow",         pushProductRow],
  ["pushProductVariantRow",  pushProductVariantRow],
  ["pushCustomerRow",        pushCustomerRow],
  ["pushVendorRow",          pushVendorRow],
  ["pushBomRow",             pushBomRow],
  ["pushEmployeeRow",        pushEmployeeRow],
  ["pushOpeningBalanceRow",  pushOpeningBalanceRow],
  ["pushReorderingRuleRow",  pushReorderingRuleRow],
  ["pushPutawayRuleRow",     pushPutawayRuleRow],
  ["pushSalesOrderRow",      pushSalesOrderRow],
];

const EXPECTED_GRID_IDS = [
  "products",
  "productVariants",
  "customers",
  "vendors",
  "billsOfMaterials",
  "employees",
  "reorderingRules",
  "putawayRules",
  "openingBalances",
  "salesOrders",
];

describe("grid-push — REFUSED contract (Import Wizard data-capture only)", () => {
  for (const [name, fn] of ALL_PUSH_FNS) {
    test(`${name} returns REFUSED (success: false) with any row`, async () => {
      const result = await fn({ name: "Test", qty: 1, someField: "value" });
      assert.equal(result.success, false, `${name} must never return success: true`);
      assert.ok(typeof result.detail === "string" && result.detail.length > 0,
        `${name} must return a non-empty detail message`);
    });

    test(`${name} returns REFUSED (success: false) with empty row`, async () => {
      const result = await fn({});
      assert.equal(result.success, false, `${name} must never return success: true for empty row`);
    });

    test(`${name} returns REFUSED (success: false) with null row`, async () => {
      const result = await fn(null);
      assert.equal(result.success, false, `${name} must never return success: true for null`);
    });
  }

  test("GRID_PUSH_MAP covers all expected grid IDs", () => {
    for (const id of EXPECTED_GRID_IDS) {
      assert.ok(id in GRID_PUSH_MAP, `GRID_PUSH_MAP must include key "${id}"`);
      assert.equal(typeof GRID_PUSH_MAP[id], "function", `GRID_PUSH_MAP["${id}"] must be a function`);
    }
  });

  test("All GRID_PUSH_MAP functions return REFUSED", async () => {
    for (const id of EXPECTED_GRID_IDS) {
      const fn = GRID_PUSH_MAP[id];
      const result = await fn({ sample: "row" });
      assert.equal(result.success, false, `GRID_PUSH_MAP["${id}"] must return success: false`);
    }
  });
});
