import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import {
  getImportedData, setImportedData, addActivityLog,
  getProductOptions, getCustomerOptions, getAccountOptions,
  getDepartmentOptions, getJobPositionOptions, getPaymentTermOptions, getPricelistOptions
} from "../state/implementationStore.js";
import { setGovernedImportedData, persistActiveProject } from "../state/app-store.js";
import { GRID_PUSH_MAP } from "./grid-push.js";

// ── Grid definition registry ──────────────────────────────────

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
  const container = el("div", { style: "max-width: 1100px; margin: 0 auto; padding: 32px;" });

  function showGrid(gridId) {
    activeGridId = gridId;
    render();
  }

  function render() {
    while (container.firstChild) container.removeChild(container.firstChild);

    container.append(
      el("div", { style: "margin-bottom: 32px;" }, [
        el("span", { style: "display: inline-block; font-size: 11px; letter-spacing: 0.1em; color: #92400e; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 6px; padding: 3px 10px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;", text: "BULK DATA ENTRY" }),
        el("h2", { style: "font-size: 28px; font-weight: 700; color: #0c1a30; font-family: Inter, sans-serif; margin-bottom: 8px;", text: "Data Import" }),
        el("p", { style: "font-size: 14px; color: #64748b;", text: "Import records in bulk. Paste from Excel or upload a CSV. All grids validate data before pushing to Odoo." })
      ])
    );

    if (!activeGridId) {
      // Grid selector
      container.append(
        el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px;" },
          GRIDS.map(g => {
            const rows = getImportedData(g.id);
            const hasRows = rows.length > 0;
            const card = el("div", {
              style: "display: flex; align-items: center; gap: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;",
              onclick: () => showGrid(g.id)
            }, [
              el("div", { style: "width: 44px; height: 44px; border-radius: 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #92400e;" }, [
                lucideIcon(g.icon, 20)
              ]),
              el("div", { style: "flex: 1; min-width: 0;" }, [
                el("h4", { style: "font-size: 15px; font-weight: 600; color: #0c1a30; margin-bottom: 2px;", text: g.label }),
                el("p", { style: "font-size: 12px; color: #64748b;", text: g.desc })
              ]),
              hasRows ? el("span", { style: "display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #065f46; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 6px; padding: 2px 8px; flex-shrink: 0;", text: `${rows.length} rows` }) : null
            ]);
            card.onmouseenter = () => { card.style.borderColor = "#f59e0b"; card.style.boxShadow = "0 2px 8px rgba(245,158,11,0.1)"; };
            card.onmouseleave = () => { card.style.borderColor = "#e2e8f0"; card.style.boxShadow = "none"; };
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
  return container;
}

function buildGrid(gridDef, onBack) {
  let rows = getImportedData(gridDef.id).map(r => ({ ...r, _status: "pending" }));
  if (rows.length === 0) rows = [emptyRow()];

  const tableBody = el("tbody");
  const countBadge = el("span", { style: "font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 8px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 6px; color: #92400e;" });
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
      const checkCell = el("td", { style: "padding: 8px; width: 32px; border-bottom: 1px solid #f1f5f9;" });
      const cb = el("input", { type: "checkbox", style: "width: 16px; height: 16px; cursor: pointer;" });
      cb.checked = selectedRows.has(ri);
      cb.addEventListener("change", () => { if (cb.checked) selectedRows.add(ri); else selectedRows.delete(ri); updateDeleteSelected(); });
      checkCell.append(cb);
      
      const statusCell = el("td", { style: "padding: 8px; width: 24px; border-bottom: 1px solid #f1f5f9;" }, [
        el("div", { style: `width: 8px; height: 8px; border-radius: 50%; ${
          row._status === "success" ? "background: #059669;" :
          row._status === "error"   ? "background: #dc2626;" :
          row._status === "importing" ? "background: #f59e0b; animation: pulse 1s infinite;" : "background: #cbd5e1;"
        }`, title: row._statusMessage || row._status })
      ]);
      
      const cells = gridDef.columns.map(col => {
        const isInvalid = row._invalidCols?.has(col.key);
        const cellEl = el("td", { style: `padding: 4px 8px; border-bottom: 1px solid #f1f5f9; ${isInvalid ? "background: rgba(239,68,68,0.06);" : ""}` });
        const inputEl = buildCellInput(col, row[col.key], (val) => {
          rows[ri][col.key] = val;
          if (val && row._invalidCols) { row._invalidCols.delete(col.key); cellEl.style.background = ""; }
        });
        if (isInvalid) inputEl.style.border = "1px solid #dc2626";
        cellEl.append(inputEl);
        return cellEl;
      });
      
      const deleteCell = el("td", { style: "padding: 8px; width: 32px; border-bottom: 1px solid #f1f5f9;" }, [
        el("button", {
          style: "padding: 4px; color: #94a3b8; background: none; border: none; cursor: pointer;",
          onmouseenter: (e) => e.currentTarget.style.color = "#dc2626",
          onmouseleave: (e) => e.currentTarget.style.color = "#94a3b8",
          onclick: () => { rows.splice(ri, 1); selectedRows.delete(ri); if (rows.length === 0) rows.push(emptyRow()); renderRows(); updateCount(); }
        }, [lucideIcon("trash-2", 16)])
      ]);
      
      tableBody.append(el("tr", { style: "height: 40px;" }, [checkCell, statusCell, ...cells, deleteCell]));
    });
    updateCount();
  }

  renderRows();

  const deleteSelectedBtn = el("button", {
    style: "display: none; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #dc2626; background: none; border: none; cursor: pointer; padding: 8px;",
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
      deleteSelectedBtn.style.display = "flex";
      deleteSelectedBtn.querySelector("span:last-child").textContent = `Delete Selected (${selectedRows.size})`;
    } else {
      deleteSelectedBtn.style.display = "none";
    }
  }

  const addRowBtn = el("button", {
    style: "display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #92400e; background: none; border: none; cursor: pointer; padding: 8px;",
    onclick: () => { rows.push(emptyRow()); renderRows(); updateCount(); }
  }, [
    lucideIcon("plus", 16),
    el("span", { text: "Add Row" })
  ]);

  // CSV template download
  const downloadTemplateBtn = el("button", {
    style: "display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; padding: 8px;",
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

  // CSV file upload
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
    style: "display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #92400e; border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.08); border-radius: 6px; padding: 8px 16px; cursor: pointer;",
    onclick: () => fileInput.click()
  }, [
    lucideIcon("upload", 16),
    el("span", { text: "Upload CSV File" })
  ]);

  // CSV paste area
  const csvTextarea = el("textarea", {
    style: "width: 100%; height: 100px; padding: 12px; font-family: monospace; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; resize: none; color: #0c1a30; box-sizing: border-box;",
    placeholder: "Paste CSV data here (first row = headers matching column names)..."
  });

  const parseCSVBtn = el("button", {
    style: "display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #92400e; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); border-radius: 6px; padding: 8px 16px; cursor: pointer;",
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
    style: "display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #92400e; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); border-radius: 6px; padding: 10px 20px; cursor: pointer;",
    onclick: async () => {
      // Validate with per-cell highlighting
      let hasInvalid = false;
      rows.forEach(r => {
        r._invalidCols = new Set();
        gridDef.columns.forEach(c => {
          if (c.required && !r[c.key]) { r._invalidCols.add(c.key); hasInvalid = true; }
        });
        if (r._invalidCols.size > 0) { r._status = "error"; r._statusMessage = "Missing required fields"; }
      });
      if (hasInvalid) { renderRows(); return; }
      // Push rows via API
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
      // Persist to governed project state for refresh survival
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
    el("span", { text: `Import ${gridDef.label} to Odoo` })
  ]);

  return el("div", { style: "display: flex; flex-direction: column; gap: 24px;" }, [
    // Header
    el("div", { style: "display: flex; align-items: center; gap: 16px;" }, [
      el("button", {
        style: "padding: 8px; color: #64748b; background: none; border: none; cursor: pointer;",
        onclick: onBack
      }, [lucideIcon("arrow-left", 20)]),
      el("div", { style: "display: flex; align-items: center; gap: 12px; flex: 1;" }, [
        el("div", { style: "width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); color: #92400e;" }, [
          lucideIcon(gridDef.icon, 20)
        ]),
        el("div", {}, [
          el("h3", { style: "font-size: 18px; font-weight: 700; color: #0c1a30; font-family: Inter, sans-serif;", text: gridDef.label }),
          el("p", { style: "font-size: 12px; color: #64748b;", text: gridDef.desc })
        ])
      ]),
      countBadge
    ]),
    
    // CSV import panel
    el("div", { style: "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 12px;" }, [
      el("div", { style: "display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;" }, [
        el("p", { style: "font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b;", text: "CSV Import" }),
        el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [downloadTemplateBtn, uploadBtn])
      ]),
      fileInput,
      csvTextarea,
      parseCSVBtn
    ]),
    
    // Grid table
    el("div", { style: "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;" }, [
      el("div", { style: "overflow-x: auto;" }, [
        el("table", { style: "width: 100%; font-size: 12px; border-collapse: collapse;" }, [
          el("thead", {}, [
            el("tr", {}, [
              el("th", { style: "padding: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; text-align: left;" }, [
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
              el("th", { style: "padding: 8px; width: 24px;" }),
              ...gridDef.columns.map(col =>
                el("th", { style: "padding: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; text-align: left; white-space: nowrap;" }, [
                  el("span", { text: col.label }),
                  col.required ? el("span", { style: "color: #dc2626; margin-left: 2px;", text: "*" }) : null
                ])
              ),
              el("th", { style: "padding: 8px; width: 32px;" })
            ])
          ]),
          tableBody
        ])
      ]),
      el("div", { style: "padding: 12px 16px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;" }, [
        el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [addRowBtn, deleteSelectedBtn]),
        importBtn
      ])
    ])
  ]);
}

function buildCellInput(col, value, onChange) {
  const baseClass = "w-full min-w-0 px-2 py-1.5 text-xs bg-transparent border border-outline-variant/20 rounded focus:ring-1 focus:ring-primary/30 focus:border-primary focus:outline-none";

  if (col.type === "checkbox") {
    const cb = el("input", { type: "checkbox", className: "w-4 h-4 rounded border-outline text-primary focus:ring-primary/20 cursor-pointer" });
    cb.checked = value === true || value === "true";
    cb.addEventListener("change", e => onChange(e.target.checked));
    return el("div", { className: "flex justify-center" }, [cb]);
  }

  if (col.type === "select") {
    const sel = el("select", { className: baseClass + " cursor-pointer" }, [
      el("option", { value: "", text: "—" }),
      ...col.options.map(o => el("option", { value: o, selected: o === value ? "selected" : null, text: o }))
    ]);
    sel.addEventListener("change", e => onChange(e.target.value));
    return sel;
  }

  if (col.type === "dropdown") {
    const opts = col.optionsFn ? col.optionsFn() : [];
    const sel = el("select", { className: baseClass + " cursor-pointer" }, [
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
    className: baseClass + (col.type === "number" ? " text-right" : ""),
    style: col.type === "number" ? "min-width: 80px" : "min-width: 120px"
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
