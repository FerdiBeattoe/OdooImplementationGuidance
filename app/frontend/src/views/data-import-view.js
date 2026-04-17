import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import {
  getImportedData, setImportedData, addActivityLog,
  getProductOptions, getCustomerOptions, getAccountOptions,
  getDepartmentOptions, getJobPositionOptions, getPaymentTermOptions, getPricelistOptions
} from "../state/implementationStore.js";
import { setGovernedImportedData, persistActiveProject } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { GRID_PUSH_MAP } from "./grid-push.js";

// ── Token-based style constants ───────────────────────────────

const CANVAS_STYLE =
  "min-height: 100vh; background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), var(--color-canvas-base), var(--surface-texture); padding: var(--space-8) var(--space-5) var(--space-12); font-family: var(--font-body); color: var(--color-ink); box-sizing: border-box;";

const COLUMN_STYLE =
  "max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6);";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; padding: 4px 12px; border: 1px solid var(--color-line); border-radius: var(--radius-pill); background: var(--color-surface); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle);";

const HERO_H1 =
  "font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 600; letter-spacing: var(--track-tight); line-height: var(--lh-snug); color: var(--color-ink); margin: 0;";

const HERO_SUB =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0; line-height: var(--lh-body);";

const PANEL_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-5) var(--space-6);";

const PILL_PRIMARY =
  "display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); border: 1px solid var(--color-pill-primary-bg); font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; cursor: pointer; transition: all var(--dur-base) var(--ease);";

const PILL_SECONDARY =
  "display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); border: 1px solid var(--color-pill-secondary-border); font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; cursor: pointer; transition: all var(--dur-base) var(--ease);";

const LINK_BTN_STYLE =
  "display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; color: var(--color-ink); background: none; border: none; cursor: pointer; padding: 6px 10px; text-decoration: underline; text-underline-offset: 2px;";

const CHIP_STYLE =
  "display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--radius-pill); background: var(--color-chip-bg); color: var(--color-chip-fg); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow);";

const CHIP_READY =
  "display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--radius-pill); background: var(--color-chip-ready-bg); color: var(--color-chip-ready-fg); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow);";

const INPUT_STYLE =
  "width: 100%; min-width: 0; padding: 6px 10px; font-family: var(--font-body); font-size: var(--fs-small); background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-input); color: var(--color-ink); outline: none; box-sizing: border-box;";

function getInstanceHost() {
  const state = onboardingStore.getState();
  const url = state?.connection?.url || "";
  if (!url) return "";
  try { return new URL(url).host; }
  catch { return String(url).replace(/^https?:\/\//i, "").split("/")[0]; }
}

// ── Grid definition registry (unchanged) ──────────────────────

const GRIDS = [
  {
    id: "products",
    label: "Products",
    icon: "package",
    desc: "Products and services",
    columns: [
      { key: "internalRef",    label: "Internal Ref",    type: "text",     required: false },
      { key: "name",           label: "Name",            type: "text",     required: true },
      { key: "productType",    label: "Product Type",    type: "select",   options: ["Storable", "Consumable", "Service"], required: true },
      { key: "salesPrice",     label: "Sales Price",     type: "number",   required: false },
      { key: "cost",           label: "Cost",            type: "number",   required: false },
      { key: "uom",            label: "Unit of Measure", type: "text",     required: false },
      { key: "category",       label: "Category",        type: "text",     required: false },
      { key: "barcode",        label: "Barcode",         type: "text",     required: false },
      { key: "saleDescription", label: "Sales Description",type: "text",     required: false },
      { key: "purchaseDescription",label: "Purchase Description",type: "text", required: false },
      { key: "canBeSold",      label: "Can Be Sold",     type: "checkbox", required: false },
      { key: "canBePurchased", label: "Can Be Purchased",type: "checkbox", required: false }
    ]
  },
  {
    id: "productVariants",
    label: "Product Variants",
    icon: "layers",
    desc: "Attributes and variants for products",
    columns: [
      { key: "product",        label: "Product",         type: "dropdown", optionsFn: () => getProductOptions().map(o => o.label), required: true },
      { key: "attribute",      label: "Attribute",       type: "select",   options: ["Size", "Color", "Material", "Weight", "Style", "Finish"], required: true },
      { key: "displayType",    label: "Display Type",    type: "select",   options: ["radio", "pills", "select", "color"], required: false },
      { key: "createVariant",  label: "Variant Creation",type: "select",   options: ["always", "dynamic", "no_variant"], required: false },
      { key: "values",         label: "Values (comma separated)", type: "text", required: true },
      { key: "extraPrice",     label: "Extra Price",     type: "number",   required: false }
    ]
  },
  {
    id: "customers",
    label: "Customers",
    icon: "user",
    desc: "Customer contacts and accounts",
    columns: [
      { key: "name",        label: "Name",           type: "text",     required: true },
      { key: "companyName", label: "Company Name",   type: "text",     required: false },
      { key: "email",       label: "Email",          type: "email",    required: false },
      { key: "phone",       label: "Phone",          type: "text",     required: false },
      { key: "street",      label: "Street",         type: "text",     required: false },
      { key: "city",        label: "City",           type: "text",     required: false },
      { key: "country",     label: "Country",        type: "text",     required: false },
      { key: "state",       label: "State / Region", type: "text",     required: false },
      { key: "taxId",       label: "Tax ID",         type: "text",     required: false },
      { key: "pricelist",   label: "Pricelist",      type: "dropdown", optionsFn: () => getPricelistOptions().map(o => o.label), required: false },
      { key: "paymentTerms",label: "Payment Terms",  type: "dropdown", optionsFn: () => getPaymentTermOptions().map(o => o.label), required: false }
    ]
  },
  {
    id: "vendors",
    label: "Vendors / Suppliers",
    icon: "truck",
    desc: "Supplier contacts and accounts",
    columns: [
      { key: "name",        label: "Name",           type: "text",   required: true },
      { key: "company",     label: "Company",        type: "text",   required: false },
      { key: "email",       label: "Email",          type: "email",  required: false },
      { key: "phone",       label: "Phone",          type: "text",   required: false },
      { key: "street",      label: "Street",         type: "text",   required: false },
      { key: "city",        label: "City",           type: "text",   required: false },
      { key: "country",     label: "Country",        type: "text",   required: false },
      { key: "currency",    label: "Currency",       type: "select", options: ["USD","EUR","GBP","AUD","CAD"], required: false },
      { key: "paymentTerms",label: "Payment Terms",  type: "dropdown", optionsFn: () => getPaymentTermOptions().map(o => o.label), required: false },
      { key: "leadTime",    label: "Lead Time (days)",type: "number", required: false }
    ]
  },
  {
    id: "billsOfMaterials",
    label: "Bill of Materials",
    icon: "git-branch",
    desc: "Manufacturing BOM structures",
    columns: [
      { key: "product",        label: "Product",          type: "dropdown", optionsFn: () => getProductOptions().map(o => o.label), required: true },
      { key: "bomType",        label: "BOM Type",         type: "select",   options: ["Manufacture", "Kit", "Subcontracting"], required: true },
      { key: "quantity",       label: "Quantity",         type: "number",   required: true },
      { key: "component",      label: "Component",        type: "dropdown", optionsFn: () => getProductOptions().map(o => o.label), required: true },
      { key: "componentQty",   label: "Component Qty",    type: "number",   required: true },
      { key: "uom",            label: "Unit of Measure",  type: "text",     required: false }
    ]
  },
  {
    id: "employees",
    label: "Employees",
    icon: "badge-check",
    desc: "Employee records",
    columns: [
      { key: "name",          label: "Name",             type: "text",     required: true },
      { key: "jobPosition",   label: "Job Position",     type: "dropdown", optionsFn: () => getJobPositionOptions().map(o => o.label), required: false },
      { key: "department",    label: "Department",       type: "dropdown", optionsFn: () => getDepartmentOptions().map(o => o.label), required: false },
      { key: "workEmail",     label: "Work Email",       type: "email",    required: false },
      { key: "workPhone",     label: "Work Phone",       type: "text",     required: false },
      { key: "manager",       label: "Manager",          type: "dropdown", optionsFn: () => getDepartmentOptions().map(o => o.label), required: false },
      { key: "contractType",  label: "Contract Type",    type: "select",   options: ["Permanent", "Fixed Term", "Part-time", "Freelance"], required: false },
      { key: "wage",          label: "Wage",             type: "number",   required: false },
      { key: "startDate",     label: "Start Date",       type: "date",     required: false }
    ]
  },
  {
    id: "openingBalances",
    label: "Opening Balances",
    icon: "wallet",
    desc: "Accounting opening balances",
    columns: [
      { key: "account",   label: "Account",   type: "dropdown", optionsFn: () => getAccountOptions().map(o => o.label), required: true },
      { key: "partner",   label: "Partner",   type: "dropdown", optionsFn: () => [...getCustomerOptions(), ...getCustomerOptions()].map(o => o.label), required: false },
      { key: "date",      label: "Date",      type: "date",     required: true },
      { key: "debit",     label: "Debit",     type: "number",   required: false },
      { key: "credit",    label: "Credit",    type: "number",   required: false },
      { key: "reference", label: "Reference", type: "text",     required: false }
    ]
  },
  {
    id: "reorderingRules",
    label: "Reordering Rules",
    icon: "refresh-cw",
    desc: "Automatic replenishment rules",
    columns: [
      { key: "product",       label: "Product",           type: "dropdown", optionsFn: () => getProductOptions().map(o => o.label), required: true },
      { key: "warehouse",     label: "Warehouse",         type: "text",     required: false },
      { key: "location",      label: "Location",          type: "text",     required: false },
      { key: "minQty",        label: "Min Quantity",      type: "number",   required: true },
      { key: "maxQty",        label: "Max Quantity",      type: "number",   required: true },
      { key: "qtyMultiple",   label: "Qty Multiple",      type: "number",   required: false },
      { key: "route",         label: "Route",             type: "select",   options: ["Buy", "Manufacture", "Resupply"], required: false },
      { key: "leadDays",      label: "Lead Days",         type: "number",   required: false }
    ]
  },
  {
    id: "putawayRules",
    label: "Putaway Rules",
    icon: "warehouse",
    desc: "Product storage location rules",
    columns: [
      { key: "product",       label: "Product",           type: "dropdown", optionsFn: () => getProductOptions().map(o => o.label), required: false },
      { key: "category",      label: "Product Category",  type: "text",     required: false },
      { key: "sourceLocation",label: "Source Location",   type: "text",     required: true },
      { key: "destLocation",  label: "Destination Location",type: "text",   required: true },
      { key: "sequence",      label: "Priority",          type: "number",   required: false }
    ]
  },
  {
    id: "salesOrders",
    label: "Sales Orders (Historical)",
    icon: "file-text",
    desc: "Historical sales order import",
    columns: [
      { key: "customer",    label: "Customer",     type: "dropdown", optionsFn: () => getCustomerOptions().map(o => o.label), required: true },
      { key: "orderDate",   label: "Order Date",   type: "date",     required: true },
      { key: "product",     label: "Product",      type: "dropdown", optionsFn: () => getProductOptions().map(o => o.label), required: true },
      { key: "quantity",    label: "Quantity",     type: "number",   required: true },
      { key: "unitPrice",   label: "Unit Price",   type: "number",   required: true },
      { key: "discount",    label: "Discount %",   type: "number",   required: false },
      { key: "salesperson", label: "Salesperson",   type: "text",     required: false },
      { key: "deliveryDate",label: "Delivery Date",type: "date",     required: false }
    ]
  }
];

export function renderDataImportView({ onNavigate }) {
  let activeGridId = null;
  const canvas = el("div", { style: CANVAS_STYLE });
  const container = el("div", { style: COLUMN_STYLE });
  canvas.append(container);

  function showGrid(gridId) {
    activeGridId = gridId;
    render();
  }

  function render() {
    while (container.firstChild) container.removeChild(container.firstChild);

    const instanceHost = getInstanceHost();
    const eyebrowText = instanceHost ? `DATA IMPORT · ${instanceHost}` : "DATA IMPORT";

    container.append(
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" }, [
        el("span", { style: EYEBROW_STYLE, text: eyebrowText }),
        el("h1", { style: HERO_H1 }, [
          el("span", { text: "Bring your data " }),
          el("span", { style: "color: var(--color-muted);", text: "in" })
        ]),
        el("p", { style: HERO_SUB, text: "Import records in bulk. Paste from Excel or upload CSV. All grids validate before pushing to Odoo." })
      ])
    );

    if (!activeGridId) {
      container.append(
        el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-3);" },
          GRIDS.map(g => {
            const rows = getImportedData(g.id);
            const hasRows = rows.length > 0;
            const card = el("div", {
              style: `display: flex; align-items: center; gap: var(--space-3); background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-4) var(--space-5); cursor: pointer; transition: all var(--dur-base) var(--ease);`,
              onclick: () => showGrid(g.id)
            }, [
              el("div", { style: "width: 40px; height: 40px; border-radius: var(--radius-panel); background: var(--color-line-soft); border: 1px solid var(--color-line); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--color-ink);" }, [
                lucideIcon(g.icon, 20)
              ]),
              el("div", { style: "flex: 1; min-width: 0;" }, [
                el("h4", { style: "font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 500; color: var(--color-ink); margin: 0 0 2px; letter-spacing: var(--track-tight);", text: g.label }),
                el("p", { style: "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-muted); margin: 0;", text: g.desc })
              ]),
              hasRows ? el("span", { style: CHIP_READY, text: `${rows.length} rows` }) : null
            ]);
            card.onmouseenter = () => { card.style.borderColor = "var(--color-ink)"; card.style.boxShadow = "var(--shadow-raised)"; };
            card.onmouseleave = () => { card.style.borderColor = "var(--color-line)"; card.style.boxShadow = "none"; };
            return card;
          })
        )
      );
    } else {
      const gridDef = GRIDS.find(g => g.id === activeGridId);
      container.append(buildGrid(gridDef, () => { activeGridId = null; render(); }));
    }
  }

  render();
  return canvas;
}

function buildGrid(gridDef, onBack) {
  let rows = getImportedData(gridDef.id).map(r => ({ ...r, _status: "pending" }));
  if (rows.length === 0) rows = [emptyRow()];

  const tableBody = el("tbody");
  const countBadge = el("span", { style: CHIP_STYLE });
  let selectedRows = new Set();

  function emptyRow() {
    const row = { _status: "pending" };
    gridDef.columns.forEach(c => { row[c.key] = ""; });
    return row;
  }

  function updateCount() {
    countBadge.textContent = `${rows.length} row${rows.length !== 1 ? "s" : ""}`;
  }

  function renderRows() {
    while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
    rows.forEach((row, ri) => {
      const checkCell = el("td", { style: "padding: var(--space-2); width: 32px; border-bottom: 1px solid var(--color-line);" });
      const cb = el("input", { type: "checkbox", style: "width: 16px; height: 16px; cursor: pointer;" });
      cb.checked = selectedRows.has(ri);
      cb.addEventListener("change", () => { if (cb.checked) selectedRows.add(ri); else selectedRows.delete(ri); updateDeleteSelected(); });
      checkCell.append(cb);

      const statusCell = el("td", { style: "padding: var(--space-2); width: 24px; border-bottom: 1px solid var(--color-line);" }, [
        el("div", { style: `width: 8px; height: 8px; border-radius: 50%; ${
          row._status === "success"   ? "background: var(--color-ink);" :
          row._status === "error"     ? "background: var(--color-chip-review-fg);" :
          row._status === "importing" ? "background: var(--color-muted); animation: pulse 1s infinite;" :
                                        "background: var(--color-line);"
        }`, title: row._statusMessage || row._status })
      ]);

      const cells = gridDef.columns.map(col => {
        const isInvalid = row._invalidCols?.has(col.key);
        const cellEl = el("td", { style: `padding: 4px var(--space-2); border-bottom: 1px solid var(--color-line); ${isInvalid ? "background: var(--color-chip-review-bg);" : ""}` });
        const inputEl = buildCellInput(col, row[col.key], (val) => {
          rows[ri][col.key] = val;
          if (val && row._invalidCols) { row._invalidCols.delete(col.key); cellEl.style.background = ""; }
        });
        if (isInvalid) inputEl.style.border = "1px solid var(--color-chip-review-fg)";
        cellEl.append(inputEl);
        return cellEl;
      });

      const deleteCell = el("td", { style: "padding: var(--space-2); width: 32px; border-bottom: 1px solid var(--color-line);" }, [
        el("button", {
          style: "padding: 4px; color: var(--color-muted); background: none; border: none; cursor: pointer;",
          onmouseenter: (e) => e.currentTarget.style.color = "var(--color-chip-review-fg)",
          onmouseleave: (e) => e.currentTarget.style.color = "var(--color-muted)",
          onclick: () => { rows.splice(ri, 1); selectedRows.delete(ri); if (rows.length === 0) rows.push(emptyRow()); renderRows(); updateCount(); }
        }, [lucideIcon("trash-2", 16)])
      ]);

      tableBody.append(el("tr", { style: "height: 40px;" }, [checkCell, statusCell, ...cells, deleteCell]));
    });
    updateCount();
  }

  renderRows();

  const deleteSelectedBtn = el("button", {
    style: `${LINK_BTN_STYLE} display: none; color: var(--color-chip-review-fg);`,
    onclick: () => {
      const indices = [...selectedRows].sort((a, b) => b - a);
      indices.forEach(i => rows.splice(i, 1));
      selectedRows.clear();
      if (rows.length === 0) rows.push(emptyRow());
      renderRows();
      updateCount();
      updateDeleteSelected();
    }
  }, [
    lucideIcon("trash", 16),
    el("span", { text: "Delete Selected" })
  ]);

  function updateDeleteSelected() {
    if (selectedRows.size > 0) {
      deleteSelectedBtn.style.display = "inline-flex";
      deleteSelectedBtn.querySelector("span:last-child").textContent = `Delete Selected (${selectedRows.size})`;
    } else {
      deleteSelectedBtn.style.display = "none";
    }
  }

  const addRowBtn = el("button", {
    style: LINK_BTN_STYLE,
    onclick: () => { rows.push(emptyRow()); renderRows(); updateCount(); }
  }, [
    lucideIcon("plus", 16),
    el("span", { text: "Add Row" })
  ]);

  const downloadTemplateBtn = el("button", {
    style: `${LINK_BTN_STYLE} color: var(--color-muted);`,
    onclick: () => {
      const headers = gridDef.columns.map(c => c.label).join(",");
      const blob = new Blob([headers + "\n"], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${gridDef.id}-template.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [
    lucideIcon("download", 16),
    el("span", { text: "Download CSV Template" })
  ]);

  const fileInput = el("input", { type: "file", accept: ".csv,.txt", style: "display: none;" });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(reader.result, gridDef.columns);
      if (parsed.length) {
        rows = [...rows.filter(r => Object.values(r).some(v => v && v !== "pending")), ...parsed];
        if (rows.length === 0) rows = [emptyRow()];
        renderRows();
      }
      fileInput.value = "";
    };
    reader.readAsText(file);
  });

  const uploadBtn = el("button", {
    style: PILL_SECONDARY,
    onclick: () => fileInput.click()
  }, [
    lucideIcon("upload", 16),
    el("span", { text: "Upload CSV File" })
  ]);

  const csvTextarea = el("textarea", {
    style: "width: 100%; height: 96px; padding: var(--space-3); font-family: var(--font-mono); font-size: var(--fs-small); background: var(--color-line-soft); border: 1px solid var(--color-line); border-radius: var(--radius-input); resize: none; color: var(--color-ink); box-sizing: border-box; outline: none;",
    placeholder: "Paste CSV data here (first row = headers matching column names)..."
  });

  const parseCSVBtn = el("button", {
    style: PILL_SECONDARY,
    onclick: () => {
      const text = csvTextarea.value.trim();
      if (!text) return;
      const parsed = parseCSV(text, gridDef.columns);
      if (parsed.length) {
        rows = [...rows.filter(r => Object.values(r).some(v => v && v !== "pending")), ...parsed];
        if (rows.length === 0) rows = [emptyRow()];
        renderRows();
        csvTextarea.value = "";
      }
    }
  }, [
    lucideIcon("table", 16),
    el("span", { text: "Parse & Add Rows" })
  ]);

  const importBtn = el("button", {
    style: PILL_PRIMARY,
    onclick: async () => {
      let hasInvalid = false;
      rows.forEach(r => {
        r._invalidCols = new Set();
        gridDef.columns.forEach(c => {
          if (c.required && !r[c.key]) { r._invalidCols.add(c.key); hasInvalid = true; }
        });
        if (r._invalidCols.size > 0) { r._status = "error"; r._statusMessage = "Missing required fields"; }
      });
      if (hasInvalid) { renderRows(); return; }
      importBtn.disabled = true;
      importBtn.style.opacity = "0.6";
      const pushFn = GRID_PUSH_MAP[gridDef.id];
      for (let i = 0; i < rows.length; i++) {
        rows[i]._status = "importing";
        renderRows();
        if (pushFn) {
          const result = await pushFn(rows[i]);
          rows[i]._status = result.success ? "success" : "error";
          rows[i]._statusMessage = result.detail;
        } else {
          rows[i]._status = "success";
        }
      }
      renderRows();
      const cleanRows = rows.map(r => {
        const clean = { ...r };
        delete clean._status;
        delete clean._statusMessage;
        delete clean._invalidCols;
        return clean;
      });
      setImportedData(gridDef.id, cleanRows);
      setGovernedImportedData(gridDef.id, cleanRows);
      persistActiveProject();
      addActivityLog({ action: `Imported ${cleanRows.length} ${gridDef.label}`, module: "Data Import" });
      importBtn.disabled = false;
      importBtn.style.opacity = "1";
      const successCount = rows.filter(r => r._status === "success").length;
      const errorCount = rows.filter(r => r._status === "error").length;
      if (errorCount > 0) {
        clearNode(importBtn);
        importBtn.append(lucideIcon("alert-triangle", 18), el("span", { text: ` ${successCount} Written, ${errorCount} Refused` }));
      } else {
        clearNode(importBtn);
        importBtn.append(lucideIcon("check-circle", 18), el("span", { text: ` ${successCount} Records Written` }));
      }
    }
  }, [
    lucideIcon("cloud-upload", 18),
    el("span", { text: `Push ${gridDef.label} to Odoo` })
  ]);

  return el("div", { style: "display: flex; flex-direction: column; gap: var(--space-5);" }, [
    el("div", { style: "display: flex; align-items: center; gap: var(--space-3);" }, [
      el("button", {
        style: "padding: var(--space-2); color: var(--color-muted); background: none; border: none; cursor: pointer;",
        onclick: onBack
      }, [lucideIcon("arrow-left", 20)]),
      el("div", { style: "display: flex; align-items: center; gap: var(--space-3); flex: 1;" }, [
        el("div", { style: "width: 40px; height: 40px; border-radius: var(--radius-panel); display: flex; align-items: center; justify-content: center; background: var(--color-line-soft); border: 1px solid var(--color-line); color: var(--color-ink);" }, [
          lucideIcon(gridDef.icon, 20)
        ]),
        el("div", {}, [
          el("h3", { style: "font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 500; color: var(--color-ink); letter-spacing: var(--track-tight); margin: 0;", text: gridDef.label }),
          el("p", { style: "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0;", text: gridDef.desc })
        ])
      ]),
      countBadge
    ]),

    el("div", { style: `${PANEL_STYLE} display: flex; flex-direction: column; gap: var(--space-3);` }, [
      el("div", { style: "display: flex; align-items: center; justify-content: space-between;" }, [
        el("p", { style: "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow); color: var(--color-subtle); margin: 0;", text: "CSV IMPORT" }),
        el("div", { style: "display: flex; align-items: center; gap: var(--space-3);" }, [downloadTemplateBtn, uploadBtn])
      ]),
      fileInput,
      csvTextarea,
      el("div", { style: "display: flex; justify-content: flex-end;" }, [parseCSVBtn])
    ]),

    el("div", { style: `${PANEL_STYLE} padding: 0; overflow: hidden;` }, [
      el("div", { style: "overflow-x: auto;" }, [
        el("table", { style: "width: 100%; font-family: var(--font-body); font-size: var(--fs-small); border-collapse: collapse;" }, [
          el("thead", {}, [
            el("tr", {}, [
              el("th", { style: "padding: var(--space-2); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow); color: var(--color-subtle); text-align: left; border-bottom: 1px solid var(--color-line);" }, [
                (() => {
                  const selectAll = el("input", { type: "checkbox", style: "width: 16px; height: 16px; cursor: pointer;" });
                  selectAll.addEventListener("change", () => {
                    if (selectAll.checked) rows.forEach((_, i) => selectedRows.add(i));
                    else selectedRows.clear();
                    renderRows();
                    updateDeleteSelected();
                  });
                  return selectAll;
                })()
              ]),
              el("th", { style: "padding: var(--space-2); width: 24px; border-bottom: 1px solid var(--color-line);" }),
              ...gridDef.columns.map(col =>
                el("th", { style: "padding: var(--space-2); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow); color: var(--color-subtle); text-align: left; white-space: nowrap; border-bottom: 1px solid var(--color-line);" }, [
                  el("span", { text: col.label }),
                  col.required ? el("span", { style: "color: var(--color-chip-review-fg); margin-left: 2px;", text: "*" }) : null
                ])
              ),
              el("th", { style: "padding: var(--space-2); width: 32px; border-bottom: 1px solid var(--color-line);" })
            ])
          ]),
          tableBody
        ])
      ]),
      el("div", { style: "padding: var(--space-3) var(--space-5); border-top: 1px solid var(--color-line); display: flex; align-items: center; justify-content: space-between;" }, [
        el("div", { style: "display: flex; align-items: center; gap: var(--space-3);" }, [addRowBtn, deleteSelectedBtn]),
        importBtn
      ])
    ])
  ]);
}

function buildCellInput(col, value, onChange) {
  if (col.type === "checkbox") {
    const cb = el("input", { type: "checkbox", style: "width: 16px; height: 16px; cursor: pointer;" });
    cb.checked = value === true || value === "true";
    cb.addEventListener("change", e => onChange(e.target.checked));
    return el("div", { style: "display: flex; justify-content: center;" }, [cb]);
  }

  if (col.type === "select") {
    const sel = el("select", { style: `${INPUT_STYLE} cursor: pointer;` }, [
      el("option", { value: "", text: "—" }),
      ...col.options.map(o => el("option", { value: o, selected: o === value ? "selected" : null, text: o }))
    ]);
    sel.addEventListener("change", e => onChange(e.target.value));
    return sel;
  }

  if (col.type === "dropdown") {
    const opts = col.optionsFn ? col.optionsFn() : [];
    const sel = el("select", { style: `${INPUT_STYLE} cursor: pointer;` }, [
      el("option", { value: "", text: "—" }),
      ...opts.map(o => el("option", { value: o, selected: o === value ? "selected" : null, text: o }))
    ]);
    sel.addEventListener("change", e => onChange(e.target.value));
    return sel;
  }

  const input = el("input", {
    type: col.type === "number" ? "number" : col.type === "date" ? "date" : col.type === "email" ? "email" : "text",
    value: value || "",
    placeholder: col.label,
    style: `${INPUT_STYLE}${col.type === "number" ? " text-align: right; min-width: 80px;" : " min-width: 120px;"}`
  });
  input.addEventListener("input", e => onChange(e.target.value));
  return input;
}

function parseCSV(text, columns) {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, ""));
  const colKeyMap = {};
  columns.forEach(c => {
    colKeyMap[c.key.toLowerCase()] = c.key;
    colKeyMap[c.label.toLowerCase().replace(/\s+/g, "")] = c.key;
  });

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row = { _status: "pending" };
    columns.forEach(c => { row[c.key] = ""; });
    headers.forEach((h, i) => {
      const key = colKeyMap[h];
      if (key) row[key] = values[i] || "";
    });
    return row;
  });
}
