/**
 * Grid Push — Maps data import grid rows to Odoo 19 API calls.
 * Each function receives an array of row objects and returns per-row results.
 */
import { addActivityLog } from "../state/implementationStore.js";

async function apiCall(endpoint, payload) {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

// ── Products ────────────────────────────────────────────────────
export async function pushProductRow(row) {
  const typeMap = { "Storable": "product", "Consumable": "consu", "Service": "service" };
  try {
    await apiCall("/api/odoo/create", {
      model: "product.template",
      values: {
        name: row.name,
        default_code: row.internalRef || false,
        type: typeMap[row.productType] || "consu",
        list_price: parseFloat(row.salesPrice) || 0,
        standard_price: parseFloat(row.cost) || 0,
        uom_id: row.uom || false,
        categ_id: row.category || false,
        barcode: row.barcode || false,
        sale_ok: row.canBeSold !== false,
        purchase_ok: row.canBePurchased !== false
      }
    });
    return { success: true, detail: `Product "${row.name}" created` };
  } catch (err) {
    return { success: false, detail: err.message };
  }
}

// ── Product Variants ────────────────────────────────────────────
export async function pushProductVariantRow(row) {
  try {
    await apiCall("/api/odoo/create", {
      model: "product.attribute",
      values: {
        name: row.attribute,
        display_type: row.displayType || "radio",
        create_variant: row.createVariant || "always",
        value_ids: (row.values || "").split(",").map(v => v.trim()).filter(Boolean)
      }
    });
    return { success: true, detail: `Attribute "${row.attribute}" (${row.displayType || "radio"}) created for ${row.product}` };
  } catch (err) {
    return { success: false, detail: err.message };
  }
}

// ── Customers ───────────────────────────────────────────────────
export async function pushCustomerRow(row) {
  try {
    await apiCall("/api/odoo/create", {
      model: "res.partner",
      values: {
        name: row.name,
        company_name: row.companyName || false,
        email: row.email || false,
        phone: row.phone || false,
        street: row.street || false,
        city: row.city || false,
        country_id: row.country || false,
        vat: row.taxId || false,
        customer_rank: 1
      }
    });
    return { success: true, detail: `Customer "${row.name}" created` };
  } catch (err) {
    return { success: false, detail: err.message };
  }
}

// ── Vendors ─────────────────────────────────────────────────────
export async function pushVendorRow(row) {
  try {
    await apiCall("/api/odoo/create", {
      model: "res.partner",
      values: {
        name: row.name,
        company_name: row.company || false,
        email: row.email || false,
        phone: row.phone || false,
        street: row.street || false,
        city: row.city || false,
        country_id: row.country || false,
        supplier_rank: 1
      }
    });
    return { success: true, detail: `Vendor "${row.name}" created` };
  } catch (err) {
    return { success: false, detail: err.message };
  }
}

// ── Bills of Materials ──────────────────────────────────────────
export async function pushBomRow(row) {
  const typeMap = { "Manufacture": "normal", "Kit": "phantom", "Subcontracting": "subcontract" };
  try {
    await apiCall("/api/odoo/create", {
      model: "mrp.bom",
      values: {
        product_tmpl_id: row.product || false,
        type: typeMap[row.bomType] || "normal",
        product_qty: parseFloat(row.quantity) || 1,
        bom_line_ids: [[0, 0, {
          product_id: row.component || false,
          product_qty: parseFloat(row.componentQty) || 1
        }]]
      }
    });
    return { success: true, detail: `BOM for "${row.product}" created` };
  } catch (err) {
    return { success: false, detail: err.message };
  }
}

// ── Employees ───────────────────────────────────────────────────
export async function pushEmployeeRow(row) {
  try {
    await apiCall("/api/odoo/create", {
      model: "hr.employee",
      values: {
        name: row.name,
        job_id: row.jobPosition || false,
        department_id: row.department || false,
        work_email: row.workEmail || false,
        work_phone: row.workPhone || false
      }
    });
    return { success: true, detail: `Employee "${row.name}" created` };
  } catch (err) {
    return { success: false, detail: err.message };
  }
}

// ── Opening Balances ────────────────────────────────────────────
export async function pushOpeningBalanceRow(row) {
  try {
    await apiCall("/api/odoo/create", {
      model: "account.move.line",
      values: {
        account_id: row.account || false,
        partner_id: row.partner || false,
        date: row.date || false,
        debit: parseFloat(row.debit) || 0,
        credit: parseFloat(row.credit) || 0,
        name: row.reference || "Opening Balance"
      }
    });
    return { success: true, detail: `Balance entry for "${row.account}" created` };
  } catch (err) {
    return { success: false, detail: err.message };
  }
}

// ── Sales Orders ────────────────────────────────────────────────
export async function pushSalesOrderRow(row) {
  try {
    await apiCall("/api/odoo/create", {
      model: "sale.order",
      values: {
        partner_id: row.customer || false,
        date_order: row.orderDate || false,
        order_line: [[0, 0, {
          product_id: row.product || false,
          product_uom_qty: parseFloat(row.quantity) || 1,
          price_unit: parseFloat(row.unitPrice) || 0,
          discount: parseFloat(row.discount) || 0
        }]]
      }
    });
    return { success: true, detail: `Order for "${row.customer}" created` };
  } catch (err) {
    return { success: false, detail: err.message };
  }
}

// ── Push map ────────────────────────────────────────────────────
export const GRID_PUSH_MAP = {
  products: pushProductRow,
  productVariants: pushProductVariantRow,
  customers: pushCustomerRow,
  vendors: pushVendorRow,
  billsOfMaterials: pushBomRow,
  employees: pushEmployeeRow,
  openingBalances: pushOpeningBalanceRow,
  salesOrders: pushSalesOrderRow
};
