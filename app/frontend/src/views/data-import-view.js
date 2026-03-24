import { el } from "../lib/dom.js";
import {
  getImportedData, setImportedData, addActivityLog,
  getProductOptions, getCustomerOptions, getAccountOptions,
  getDepartmentOptions, getJobPositionOptions, getPaymentTermOptions, getPricelistOptions
} from "../state/implementationStore.js";
import { GRID_PUSH_MAP } from "./grid-push.js";

// ── Grid definition registry ──────────────────────────────────

const GRIDS = [
  {
    id: "products",
    label: "Products",
    icon: "inventory_2",
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
    icon: "category",
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
    icon: "person",
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
    icon: "local_shipping",
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
      { key: "paymentTerms",label: "Payment Terms",  type: "dropdown",optionsFn: () => getPaymentTermOptions().map(o => o.label), required: false },
      { key: "leadTime",    label: "Lead Time (days)",type: "number", required: false }
    ]
  },
  {
    id: "billsOfMaterials",
    label: "Bill of Materials",
    icon: "account_tree",
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
    icon: "badge",
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
    icon: "account_balance_wallet",
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
    icon: "sync_alt",
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
    icon: "receipt_long",
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
  const container = el("div", { className: "max-w-7xl mx-auto space-y-6" });

  function showGrid(gridId) {
    activeGridId = gridId;
    render();
  }

  function render() {
    while (container.firstChild) container.removeChild(container.firstChild);

    container.append(
      el("div", {}, [
        el("p", { className: "text-xs font-bold uppercase tracking-widest text-secondary mb-1", text: "Bulk Data Entry" }),
        el("h2", { className: "font-headline text-2xl font-bold text-on-surface", text: "Data Import" }),
        el("p", { className: "text-sm text-on-surface-variant mt-1", text: "Import records in bulk. Paste from Excel or upload a CSV. All grids validate data before pushing to Odoo." })
      ])
    );

    if (!activeGridId) {
      // Grid selector
      container.append(
        el("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },
          GRIDS.map(g => {
            const rows = getImportedData(g.id);
            return el("button", {
              className: "text-left bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5 hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.98]",
              onclick: () => showGrid(g.id)
            }, [
              el("div", { className: "flex items-start justify-between mb-3" }, [
                el("div", { className: "w-10 h-10 rounded-xl primary-gradient flex items-center justify-center" }, [
                  el("span", { className: "material-symbols-outlined text-[20px] text-on-primary", text: g.icon })
                ]),
                rows.length > 0 ? el("span", { className: "badge badge--secondary text-[10px]", text: `${rows.length} rows` }) : null
              ]),
              el("h4", { className: "font-headline text-sm font-bold text-on-surface mb-1", text: g.label }),
              el("p", { className: "text-xs text-on-surface-variant", text: g.desc })
            ]);
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
  const countBadge = el("span", { className: "badge badge--secondary text-xs" });

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
      const statusCell = el("td", { className: "px-3 py-2 w-8" }, [
        el("div", { className: `w-2 h-2 rounded-full ${
          row._status === "success" ? "bg-green-500" :
          row._status === "error"   ? "bg-error" :
          row._status === "importing" ? "bg-secondary animate-pulse" : "bg-outline-variant"
        }`, title: row._statusMessage || row._status })
      ]);
      const cells = gridDef.columns.map(col => {
        const cellEl = el("td", { className: "px-1 py-1" });
        const inputEl = buildCellInput(col, row[col.key], (val) => {
          rows[ri][col.key] = val;
        });
        cellEl.append(inputEl);
        return cellEl;
      });
      const deleteCell = el("td", { className: "px-2 py-1 w-8" }, [
        el("button", {
          className: "p-1 text-on-surface-variant hover:text-error transition-colors",
          onclick: () => { rows.splice(ri, 1); if (rows.length === 0) rows.push(emptyRow()); renderRows(); updateCount(); }
        }, [el("span", { className: "material-symbols-outlined text-[14px]", text: "delete" })])
      ]);
      tableBody.append(el("tr", { className: "hover:bg-surface-container-low border-b border-outline-variant/10" }, [statusCell, ...cells, deleteCell]));
    });
    updateCount();
  }

  renderRows();

  const addRowBtn = el("button", {
    className: "flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline px-2 py-1",
    onclick: () => { rows.push(emptyRow()); renderRows(); }
  }, [
    el("span", { className: "material-symbols-outlined text-[16px]", text: "add" }),
    el("span", { text: "Add Row" })
  ]);

  // CSV paste area
  const csvTextarea = el("textarea", {
    className: "w-full h-24 px-4 py-3 text-xs font-mono bg-surface-container-high border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none",
    placeholder: "Paste CSV data here (first row = headers matching column names)..."
  });

  const parseCSVBtn = el("button", {
    className: "flex items-center gap-2 bg-secondary text-on-secondary text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all",
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
    el("span", { className: "material-symbols-outlined text-[16px]", text: "table_view" }),
    el("span", { text: "Parse & Add Rows" })
  ]);

  const importBtn = el("button", {
    className: "flex items-center gap-2 bg-primary text-on-primary text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm",
    onclick: async () => {
      // Validate
      const invalid = rows.filter(r => gridDef.columns.some(c => c.required && !r[c.key]));
      if (invalid.length) {
        invalid.forEach(r => { r._status = "error"; r._statusMessage = "Missing required fields"; });
        renderRows();
        return;
      }
      // Push rows via API (falls back to local save if no connection)
      importBtn.disabled = true;
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
        return clean;
      });
      setImportedData(gridDef.id, cleanRows);
      addActivityLog({ action: `Imported ${cleanRows.length} ${gridDef.label}`, module: "Data Import" });
      importBtn.disabled = false;
      importBtn.textContent = `✓ ${cleanRows.length} Records Imported`;
    }
  }, [
    el("span", { className: "material-symbols-outlined text-[18px]", text: "cloud_upload" }),
    el("span", { text: `Import ${gridDef.label} to Odoo` })
  ]);

  return el("div", { className: "space-y-5" }, [
    // Header
    el("div", { className: "flex items-center gap-4" }, [
      el("button", {
        className: "p-2 rounded-lg hover:bg-surface-container transition-colors",
        onclick: onBack
      }, [el("span", { className: "material-symbols-outlined", text: "arrow_back" })]),
      el("div", { className: "flex items-center gap-3 flex-1" }, [
        el("span", { className: "material-symbols-outlined text-secondary text-[22px]", text: gridDef.icon }),
        el("div", {}, [
          el("h3", { className: "font-headline text-lg font-bold text-on-surface", text: gridDef.label }),
          el("p", { className: "text-xs text-on-surface-variant", text: gridDef.desc })
        ])
      ]),
      countBadge
    ]),
    // CSV import
    el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-4 space-y-3" }, [
      el("p", { className: "text-xs font-semibold text-on-surface-variant uppercase tracking-wide", text: "CSV Import" }),
      csvTextarea,
      parseCSVBtn
    ]),
    // Grid table
    el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden" }, [
      el("div", { className: "overflow-x-auto" }, [
        el("table", { className: "w-full text-xs" }, [
          el("thead", { className: "bg-surface-container-high" }, [
            el("tr", {}, [
              el("th", { className: "px-3 py-2.5 w-8", text: "" }),
              ...gridDef.columns.map(col =>
                el("th", { className: "px-3 py-2.5 text-left font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap" }, [
                  el("span", { text: col.label }),
                  col.required ? el("span", { className: "text-error ml-0.5", text: "*" }) : null
                ])
              ),
              el("th", { className: "px-2 py-2.5 w-8", text: "" })
            ])
          ]),
          tableBody
        ])
      ]),
      el("div", { className: "px-4 py-3 border-t border-outline-variant/10 flex items-center justify-between" }, [
        addRowBtn,
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
