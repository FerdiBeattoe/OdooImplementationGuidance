/**
 * Grid Push — UNGOVERNED WRITE PATHS DISABLED.
 *
 * All direct Odoo write calls via /api/odoo/create have been removed.
 * Data import must route through the governed pipeline (/api/pipeline/apply).
 * These stubs exist to preserve the GRID_PUSH_MAP interface shape while
 * refusing all writes fail-closed. No silent no-ops, no rerouting.
 */

const REFUSED = { success: false, detail: "Ungoverned direct write disabled. Use the governed pipeline." };

export async function pushProductRow(_row) { return REFUSED; }
export async function pushProductVariantRow(_row) { return REFUSED; }
export async function pushCustomerRow(_row) { return REFUSED; }
export async function pushVendorRow(_row) { return REFUSED; }
export async function pushBomRow(_row) { return REFUSED; }
export async function pushEmployeeRow(_row) { return REFUSED; }
export async function pushOpeningBalanceRow(_row) { return REFUSED; }
export async function pushReorderingRuleRow(_row) { return REFUSED; }
export async function pushPutawayRuleRow(_row) { return REFUSED; }
export async function pushSalesOrderRow(_row) { return REFUSED; }

// ── Push map ────────────────────────────────────────────────────
export const GRID_PUSH_MAP = {
  products: pushProductRow,
  productVariants: pushProductVariantRow,
  customers: pushCustomerRow,
  vendors: pushVendorRow,
  billsOfMaterials: pushBomRow,
  employees: pushEmployeeRow,
  reorderingRules: pushReorderingRuleRow,
  putawayRules: pushPutawayRuleRow,
  openingBalances: pushOpeningBalanceRow,
  salesOrders: pushSalesOrderRow
};
