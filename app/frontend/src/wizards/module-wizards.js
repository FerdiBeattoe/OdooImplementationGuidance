/**
 * All 12 Module Setup Wizards
 * Each wizard uses createWizardShell with fully defined steps.
 */
import { createWizardShell, formField, formInput, formSelect, formCheckbox, formSection, formGrid, pushSummaryStep } from "./WizardShell.js";
import { el } from "../lib/dom.js";
import {
  pushCompanySetup, pushUsersAccess, pushChartOfAccounts, pushSalesConfig,
  pushCrmConfig, pushInventoryConfig, pushAccountingConfig, pushPurchaseConfig,
  pushManufacturingConfig, pushHrPayroll, pushWebsiteEcommerce, pushPosConfig
} from "./wizard-push.js";
import {
  setWizardData, getWizardData, addActivityLog,
  getUserOptions, getDefaultCurrency, getDefaultCountry,
  getSalesTeamOptions, getAccountOptions, getDepartmentOptions, getJobPositionOptions,
  getWarehouseOptions
} from "../state/implementationStore.js";

// ─────────────────────────────────────────────────────────────
// WIZARD 1 — Company Setup
// ─────────────────────────────────────────────────────────────
export function renderCompanySetupWizard({ onComplete, onCancel }) {
  const existing = getWizardData("companySetup") || {};

  const shell = createWizardShell({
    title: "Company Setup",
    subtitle: "Configure your Odoo company identity",
    icon: "business",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("companySetup", merged);
      addActivityLog({ action: "Company Setup completed", module: "Company Setup" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Identity",
        render: ({ data, setData }) => {
          const nameInput   = formInput({ placeholder: "Acme Global Solutions Ltd.", value: data.companyName || existing.companyName || "" });
          const legalInput  = formInput({ placeholder: "Full legal/registered name", value: data.legalName || existing.legalName || "" });
          const typeSelect  = formSelect(["Limited Company", "Sole Trader", "Partnership", "Non-profit", "Other"], data.companyType || existing.companyType || "");
          nameInput.addEventListener("input",  e => setData({ companyName: e.target.value }));
          legalInput.addEventListener("input", e => setData({ legalName: e.target.value }));
          typeSelect.addEventListener("change",e => setData({ companyType: e.target.value }));
          return formSection("Company Identity", [
            formField("Company Name", nameInput, null, true),
            formField("Legal Name", legalInput),
            formField("Company Type", typeSelect)
          ]);
        }
      },
      {
        label: "Address",
        render: ({ data, setData }) => {
          const countryInput = formInput({ placeholder: "e.g. United Kingdom", value: data.country || existing.country || "" });
          const stateInput   = formInput({ placeholder: "e.g. England", value: data.state || existing.state || "" });
          const streetInput  = formInput({ placeholder: "123 Main Street", value: data.street || existing.street || "" });
          const cityInput    = formInput({ placeholder: "London", value: data.city || existing.city || "" });
          const zipInput     = formInput({ placeholder: "SW1A 1AA", value: data.zip || existing.zip || "" });
          countryInput.addEventListener("input", e => setData({ country: e.target.value }));
          stateInput.addEventListener("input",  e => setData({ state: e.target.value }));
          streetInput.addEventListener("input", e => setData({ street: e.target.value }));
          cityInput.addEventListener("input",   e => setData({ city: e.target.value }));
          zipInput.addEventListener("input",    e => setData({ zip: e.target.value }));
          return formSection("Company Address", [
            formGrid([formField("Country", countryInput, null, true), formField("State / Province", stateInput)]),
            formField("Street Address", streetInput),
            formGrid([formField("City", cityInput), formField("Post / Zip Code", zipInput)])
          ]);
        }
      },
      {
        label: "Branding",
        render: ({ data, setData }) => {
          const tzSelect   = formSelect(["Europe/London", "America/New_York", "America/Los_Angeles", "Europe/Berlin", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney"], data.timezone || existing.timezone || "");
          const langSelect = formSelect(["English (UK)", "English (US)", "French", "German", "Spanish", "Arabic", "Portuguese"], data.language || existing.language || "");
          const currSelect = formSelect(["USD", "EUR", "GBP", "AUD", "CAD", "JPY", "AED", "ZAR"], data.currency || existing.currency || getDefaultCurrency());
          tzSelect.addEventListener("change",   e => setData({ timezone: e.target.value }));
          langSelect.addEventListener("change", e => setData({ language: e.target.value }));
          currSelect.addEventListener("change", e => setData({ currency: e.target.value }));
          return formSection("Branding & Locale", [
            el("div", { className: "p-4 rounded-xl border-2 border-dashed border-outline-variant/40 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors" }, [
              el("span", { className: "material-symbols-outlined text-3xl text-on-surface-variant", text: "image" }),
              el("div", {}, [
                el("p", { className: "text-sm font-semibold text-on-surface", text: "Upload Company Logo" }),
                el("p", { className: "text-xs text-on-surface-variant", text: "PNG, SVG or JPG — recommended 400×400px" })
              ])
            ]),
            formGrid([formField("Timezone", tzSelect), formField("Language", langSelect)]),
            formField("Default Currency", currSelect)
          ]);
        }
      },
      {
        label: "Fiscal",
        render: ({ data, setData }) => {
          const fyStart = formInput({ type: "date", value: data.fiscalYearStart || existing.fiscalYearStart || "" });
          const taxId   = formInput({ placeholder: "e.g. GB123456789", value: data.taxId || existing.taxId || "" });
          const regNum  = formInput({ placeholder: "Company registration number", value: data.registryNumber || existing.registryNumber || "" });
          fyStart.addEventListener("change", e => setData({ fiscalYearStart: e.target.value }));
          taxId.addEventListener("input",   e => setData({ taxId: e.target.value }));
          regNum.addEventListener("input",  e => setData({ registryNumber: e.target.value }));
          return formSection("Fiscal & Legal", [
            formField("Fiscal Year Start Date", fyStart),
            formField("Tax ID / VAT Number", taxId),
            formField("Company Registry Number", regNum)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData, setData }) => {
          const merged = Object.assign({}, ...allData);
          return pushSummaryStep("Company Setup", merged, pushCompanySetup);
        }
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 2 — Users & Access Rights
// ─────────────────────────────────────────────────────────────
export function renderUsersAccessWizard({ onComplete, onCancel }) {
  const existing = getWizardData("usersAccess") || {};
  let users = existing.users || [];

  const shell = createWizardShell({
    title: "Users & Access Rights",
    subtitle: "Add team members and set their Odoo permissions",
    icon: "manage_accounts",
    onComplete: (data) => {
      const merged = { users, ...Object.assign({}, ...data) };
      setWizardData("usersAccess", merged);
      addActivityLog({ action: "Users & Access configured", module: "Users" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Add Users",
        render: () => {
          const listEl = el("div", { className: "space-y-2" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            users.forEach((u, i) => {
              listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
                el("div", { className: "w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold flex-shrink-0" }, [
                  el("span", { text: u.name ? u.name[0].toUpperCase() : "?" })
                ]),
                el("div", { className: "flex-1 min-w-0" }, [
                  el("p", { className: "text-sm font-semibold text-on-surface", text: u.name }),
                  el("p", { className: "text-xs text-on-surface-variant", text: u.email })
                ]),
                el("span", { className: "badge badge--secondary text-[10px]", text: u.role || "User" }),
                el("button", {
                  className: "p-1 text-error hover:bg-error-container rounded-lg transition-colors",
                  onclick: () => { users.splice(i, 1); renderList(); }
                }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
              ]));
            });
          };

          const nameIn  = formInput({ placeholder: "Full name" });
          const emailIn = formInput({ type: "email", placeholder: "user@company.com" });
          const roleIn  = formSelect(["User", "Manager", "Administrator"], "User");
          const addBtn  = el("button", {
            className: "flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all",
            onclick: () => {
              if (nameIn.value && emailIn.value) {
                users.push({ name: nameIn.value, email: emailIn.value, role: roleIn.value, modules: [] });
                nameIn.value = ""; emailIn.value = "";
                renderList();
              }
            }
          }, [el("span", { className: "material-symbols-outlined text-[18px]", text: "person_add" }), el("span", { text: "Add User" })]);

          renderList();
          return el("div", { className: "space-y-6" }, [
            listEl,
            el("div", { className: "bg-surface-container-low rounded-xl p-5 space-y-4" }, [
              el("h4", { className: "text-sm font-bold text-on-surface", text: "Add New User" }),
              formGrid([formField("Full Name", nameIn, null, true), formField("Email", emailIn, null, true)]),
              formGrid([formField("Role", roleIn)]),
              addBtn
            ])
          ]);
        }
      },
      {
        label: "Module Access",
        render: ({ data, setData }) => {
          const modules = ["Sales", "CRM", "Inventory", "Accounting", "Purchase", "Manufacturing", "HR", "Website", "POS"];
          return formSection("Assign Module Access", [
            users.length === 0
              ? el("p", { className: "text-sm text-on-surface-variant", text: "No users added yet. Go back to Step 1 to add users." })
              : el("div", { className: "space-y-4" },
                  users.map(u => el("div", { className: "bg-surface-container-low rounded-xl p-4 space-y-3" }, [
                    el("p", { className: "text-sm font-bold text-on-surface", text: u.name }),
                    el("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2" },
                      modules.map(m => {
                        const checked = u.modules?.includes(m);
                        return formCheckbox(m, checked, (v) => {
                          if (v) u.modules = [...(u.modules || []), m];
                          else u.modules = (u.modules || []).filter(x => x !== m);
                        });
                      })
                    )
                  ]))
                )
          ]);
        }
      },
      {
        label: "Admins",
        render: ({ data, setData }) => {
          return formSection("Administrator Users", [
            el("p", { className: "text-sm text-on-surface-variant mb-4", text: "Select users who will have full system administrator access." }),
            users.length === 0
              ? el("p", { className: "text-sm text-on-surface-variant", text: "No users added yet." })
              : el("div", { className: "space-y-2" },
                  users.map(u => formCheckbox(
                    `${u.name} (${u.email})`,
                    u.isAdmin || false,
                    (v) => { u.isAdmin = v; }
                  ))
                )
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Users & Access", { userCount: users.length, users: users.map(u => u.name).join(", ") }, pushUsersAccess)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 3 — Chart of Accounts
// ─────────────────────────────────────────────────────────────
export function renderChartOfAccountsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("chartOfAccounts") || {};
  let accounts = existing.accounts || [];

  const DEFAULT_ACCOUNTS = [
    { code: "1000", name: "Cash", type: "asset" },
    { code: "1200", name: "Accounts Receivable", type: "asset" },
    { code: "2000", name: "Accounts Payable", type: "liability" },
    { code: "3000", name: "Owner's Equity", type: "equity" },
    { code: "4000", name: "Sales Revenue", type: "income" },
    { code: "5000", name: "Cost of Goods Sold", type: "expense" },
    { code: "6000", name: "Operating Expenses", type: "expense" }
  ];

  const shell = createWizardShell({
    title: "Chart of Accounts",
    subtitle: "Set up your accounting structure",
    icon: "account_balance",
    onComplete: (data) => {
      const merged = { accounts, ...Object.assign({}, ...data) };
      setWizardData("chartOfAccounts", merged);
      addActivityLog({ action: "Chart of Accounts configured", module: "Accounting" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Country",
        render: ({ data, setData }) => {
          const countrySelect = formSelect([
            "United Kingdom", "United States", "Germany", "France", "Australia",
            "Canada", "South Africa", "UAE", "India", "Singapore"
          ], data.country || existing.country || getDefaultCountry());
          const loadBtn = el("button", {
            className: "flex items-center gap-2 bg-secondary text-on-secondary text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all",
            onclick: () => {
              accounts = DEFAULT_ACCOUNTS.map(a => ({ ...a }));
              setData({ country: countrySelect.value, accountsLoaded: true });
            }
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "download" }),
            el("span", { text: "Load Standard Chart of Accounts" })
          ]);
          countrySelect.addEventListener("change", e => setData({ country: e.target.value }));
          return formSection("Select Country", [
            formField("Country", countrySelect, "The standard chart of accounts for this country will be pre-loaded."),
            el("div", { className: "pt-2" }, [loadBtn]),
            data.accountsLoaded || existing.accountsLoaded
              ? el("div", { className: "flex items-center gap-2 text-green-700 text-sm font-medium mt-2" }, [
                  el("span", { className: "material-symbols-outlined text-[18px]", text: "check_circle" }),
                  el("span", { text: `${accounts.length} accounts loaded` })
                ])
              : null
          ]);
        }
      },
      {
        label: "Review Accounts",
        render: ({ data, setData }) => {
          if (accounts.length === 0) accounts = DEFAULT_ACCOUNTS.map(a => ({ ...a }));
          return formSection(`Account List (${accounts.length})`, [
            el("div", { className: "max-h-80 overflow-y-auto rounded-xl border border-outline-variant/20" }, [
              el("table", { className: "w-full text-sm" }, [
                el("thead", { className: "bg-surface-container-high" }, [
                  el("tr", {}, [
                    el("th", { className: "text-left px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wide", text: "Code" }),
                    el("th", { className: "text-left px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wide", text: "Name" }),
                    el("th", { className: "text-left px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wide", text: "Type" })
                  ])
                ]),
                el("tbody", { className: "divide-y divide-outline-variant/10" },
                  accounts.map(a => el("tr", { className: "hover:bg-surface-container-low" }, [
                    el("td", { className: "px-4 py-2 font-mono text-xs text-secondary", text: a.code }),
                    el("td", { className: "px-4 py-2 text-on-surface", text: a.name }),
                    el("td", { className: "px-4 py-2" }, [
                      el("span", { className: `badge badge--${a.type === "asset" ? "secondary" : a.type === "income" ? "success" : "neutral"} text-[10px]`, text: a.type })
                    ])
                  ]))
                )
              ])
            ])
          ]);
        }
      },
      {
        label: "Tax Accounts",
        render: ({ data, setData }) => {
          const outputTaxSelect = formSelect(["2200 — VAT Payable", "2300 — Sales Tax Payable"], data.outputTaxAccount || "");
          const inputTaxSelect  = formSelect(["1400 — VAT Reclaimable", "1500 — Input Tax"], data.inputTaxAccount || "");
          outputTaxSelect.addEventListener("change", e => setData({ outputTaxAccount: e.target.value }));
          inputTaxSelect.addEventListener("change",  e => setData({ inputTaxAccount: e.target.value }));
          return formSection("Tax Account Mapping", [
            formField("Output Tax Account (Sales Tax)", outputTaxSelect),
            formField("Input Tax Account (Purchase Tax)", inputTaxSelect)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Chart of Accounts", { accountCount: accounts.length }, pushChartOfAccounts)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 4 — Sales Configuration
// ─────────────────────────────────────────────────────────────
export function renderSalesConfigWizard({ onComplete, onCancel }) {
  const existing = getWizardData("salesConfig") || {};

  const shell = createWizardShell({
    title: "Sales Configuration",
    subtitle: "Set up sales module features",
    icon: "sell",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("salesConfig", merged);
      addActivityLog({ action: "Sales Configuration completed", module: "Sales" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Features",
        render: ({ data, setData }) => {
          return formSection("Sales Features", [
            formCheckbox("Online Quotes / Sales Portals", data.onlineQuotes ?? existing.onlineQuotes ?? false, v => setData({ onlineQuotes: v })),
            formCheckbox("Digital Signatures on Quotes", data.digitalSignatures ?? existing.digitalSignatures ?? false, v => setData({ digitalSignatures: v })),
            formCheckbox("Lock Confirmed Sales Orders", data.lockConfirmed ?? existing.lockConfirmed ?? false, v => setData({ lockConfirmed: v })),
            formCheckbox("Ship Before Invoice", data.shipBeforeInvoice ?? existing.shipBeforeInvoice ?? false, v => setData({ shipBeforeInvoice: v }))
          ]);
        }
      },
      {
        label: "Teams",
        render: ({ data, setData }) => {
          let teams = data.salesTeams || existing.salesTeams || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn  = formInput({ placeholder: "Team name, e.g. Direct Sales" });
          const leaderIn = formSelect(["—"].concat(getUserOptions().map(u => u.label)), "");
          const renderTeams = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            teams.forEach((t, i) => listEl.append(
              el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
                el("span", { className: "material-symbols-outlined text-secondary", text: "groups" }),
                el("span", { className: "flex-1 text-sm font-semibold", text: t.name }),
                el("span", { className: "text-xs text-on-surface-variant", text: t.leader || "No leader" }),
                el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { teams.splice(i,1); setData({ salesTeams: teams }); renderTeams(); } }, [
                  el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })
                ])
              ])
            ));
          };
          renderTeams();
          const addBtn = el("button", {
            className: "flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all",
            onclick: () => {
              if (nameIn.value) { teams.push({ name: nameIn.value, leader: leaderIn.value !== "—" ? leaderIn.value : "" }); nameIn.value = ""; setData({ salesTeams: teams }); renderTeams(); }
            }
          }, [el("span", { text: "Add Team" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Sales Team", [formField("Team Name", nameIn), formField("Team Leader", leaderIn), addBtn])]);
        }
      },
      {
        label: "Pricelists",
        render: ({ data, setData }) => {
          let pricelists = data.pricelists || existing.pricelists || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn  = formInput({ placeholder: "Pricelist name" });
          const currIn  = formSelect(["USD", "EUR", "GBP", "AUD", "CAD"], getDefaultCurrency());
          const discIn  = formSelect(["No Discount", "Fixed Discount", "Percentage Discount"], "");
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            pricelists.forEach((p, i) => listEl.append(
              el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
                el("span", { className: "flex-1 text-sm font-semibold", text: p.name }),
                el("span", { className: "badge badge--secondary text-[10px]", text: p.currency }),
                el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { pricelists.splice(i,1); setData({ pricelists }); renderList(); } }, [
                  el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })
                ])
              ])
            ));
          };
          renderList();
          const addBtn = el("button", {
            className: "flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all",
            onclick: () => { if (nameIn.value) { pricelists.push({ name: nameIn.value, currency: currIn.value, discountMethod: discIn.value }); nameIn.value = ""; setData({ pricelists }); renderList(); } }
          }, [el("span", { text: "Add Pricelist" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Pricelist", [formField("Name", nameIn), formGrid([formField("Currency", currIn), formField("Discount Method", discIn)]), addBtn])]);
        }
      },
      {
        label: "Payment Terms",
        render: ({ data, setData }) => {
          let paymentTerms = data.paymentTerms || existing.paymentTerms || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn = formInput({ placeholder: "e.g. Net 30" });
          const daysIn = formInput({ type: "number", placeholder: "30" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            paymentTerms.forEach((t, i) => listEl.append(
              el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
                el("span", { className: "flex-1 text-sm font-semibold", text: t.name }),
                el("span", { className: "text-xs text-on-surface-variant", text: `${t.days || 0} days` }),
                el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { paymentTerms.splice(i,1); setData({ paymentTerms }); renderList(); } }, [
                  el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })
                ])
              ])
            ));
          };
          renderList();
          const addBtn = el("button", {
            className: "flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all",
            onclick: () => { if (nameIn.value) { paymentTerms.push({ name: nameIn.value, days: parseInt(daysIn.value) || 0 }); nameIn.value = ""; daysIn.value = ""; setData({ paymentTerms }); renderList(); } }
          }, [el("span", { text: "Add Payment Term" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Payment Term", [formGrid([formField("Name", nameIn), formField("Days", daysIn)]), addBtn])]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Sales Config", Object.assign({}, ...allData), pushSalesConfig)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 5 — CRM Configuration
// ─────────────────────────────────────────────────────────────
export function renderCrmConfigWizard({ onComplete, onCancel }) {
  const existing = getWizardData("crmConfig") || {};

  const shell = createWizardShell({
    title: "CRM Configuration",
    subtitle: "Configure your sales pipeline and lead management",
    icon: "person_pin",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("crmConfig", merged);
      addActivityLog({ action: "CRM Configuration completed", module: "CRM" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Pipeline",
        render: ({ data, setData }) => {
          let stages = data.stages || existing.stages || [
            { name: "New", probability: 10, requirements: "Lead created" },
            { name: "Qualified", probability: 30, requirements: "Requirements gathered" },
            { name: "Proposal", probability: 60, requirements: "Proposal sent" },
            { name: "Won", probability: 100, requirements: "Deal closed" }
          ];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn = formInput({ placeholder: "Stage name" });
          const probIn = formInput({ type: "number", placeholder: "0-100" });
          const reqIn  = formInput({ placeholder: "Entry requirements" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            stages.forEach((s, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("div", { className: `w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold`, text: String(i + 1) }),
              el("span", { className: "flex-1 text-sm font-semibold", text: s.name }),
              el("span", { className: "badge badge--secondary text-[10px]", text: `${s.probability}%` }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { stages.splice(i, 1); setData({ stages }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { stages.push({ name: nameIn.value, probability: parseInt(probIn.value) || 0, requirements: reqIn.value }); nameIn.value = ""; probIn.value = ""; reqIn.value = ""; setData({ stages }); renderList(); } } }, [el("span", { text: "Add Stage" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Stage", [formGrid([formField("Stage Name", nameIn), formField("Win Probability %", probIn)]), formField("Entry Requirements", reqIn), addBtn])]);
        }
      },
      {
        label: "Lead Sources",
        render: ({ data, setData }) => {
          let sources = data.leadSources || existing.leadSources || ["Website", "Email Marketing", "Referral", "Cold Call", "Trade Show"];
          const listEl = el("div", { className: "flex flex-wrap gap-2" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            sources.forEach((s, i) => listEl.append(el("span", { className: "flex items-center gap-1.5 badge badge--primary text-xs" }, [
              el("span", { text: s }),
              el("button", { className: "hover:text-error", onclick: () => { sources.splice(i, 1); setData({ leadSources: sources }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[14px]", text: "close" })])
            ])));
          };
          renderList();
          const srcIn = formInput({ placeholder: "Lead source name" });
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (srcIn.value) { sources.push(srcIn.value); srcIn.value = ""; setData({ leadSources: sources }); renderList(); } } }, [el("span", { text: "Add Source" })]);
          return formSection("Lead Sources & Channels", [listEl, formGrid([formField("New Source", srcIn), el("div", { className: "pt-6" }, [addBtn])])]);
        }
      },
      {
        label: "Teams",
        render: ({ data, setData }) => {
          const teamOpts = getSalesTeamOptions();
          const teamSelect = formSelect(
            teamOpts.length ? teamOpts.map(t => t.label) : ["—"],
            data.defaultTeam || ""
          );
          teamSelect.addEventListener("change", e => setData({ defaultTeam: e.target.value }));
          return formSection("Sales Team Assignment", [
            formField("Default CRM Sales Team", teamSelect, "Sales teams are pulled from the Sales wizard."),
            teamOpts.length === 0 ? el("p", { className: "text-sm text-warning mt-2", text: "⚠ Complete Sales Configuration wizard first to see teams." }) : null
          ]);
        }
      },
      {
        label: "Lost Reasons",
        render: ({ data, setData }) => {
          let lostReasons = data.lostReasons || existing.lostReasons || ["Price too high", "Lost to competitor", "No budget", "No longer interested"];
          const listEl = el("div", { className: "flex flex-wrap gap-2" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            lostReasons.forEach((r, i) => listEl.append(el("span", { className: "flex items-center gap-1.5 badge badge--neutral text-xs" }, [
              el("span", { text: r }),
              el("button", { className: "hover:text-error", onclick: () => { lostReasons.splice(i, 1); setData({ lostReasons }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[14px]", text: "close" })])
            ])));
          };
          renderList();
          const rin = formInput({ placeholder: "Add lost reason" });
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (rin.value) { lostReasons.push(rin.value); rin.value = ""; setData({ lostReasons }); renderList(); } } }, [el("span", { text: "Add" })]);
          return formSection("Lost Reasons", [listEl, formGrid([formField("New Reason", rin), el("div", { className: "pt-6" }, [addBtn])])]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("CRM Config", Object.assign({}, ...allData), pushCrmConfig)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 6 — Inventory Configuration
// ─────────────────────────────────────────────────────────────
export function renderInventoryConfigWizard({ onComplete, onCancel }) {
  const existing = getWizardData("inventoryConfig") || {};

  const shell = createWizardShell({
    title: "Inventory Configuration",
    subtitle: "Set up warehouses, locations and stock operations",
    icon: "inventory_2",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("inventoryConfig", merged);
      addActivityLog({ action: "Inventory Configuration completed", module: "Inventory" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Warehouses",
        render: ({ data, setData }) => {
          let warehouses = data.warehouses || existing.warehouses || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn   = formInput({ placeholder: "Main Warehouse" });
          const shortIn  = formInput({ placeholder: "WH" });
          const addrIn   = formInput({ placeholder: "Warehouse address" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            warehouses.forEach((w, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "badge badge--secondary text-xs", text: w.shortName }),
              el("span", { className: "flex-1 text-sm font-semibold", text: w.name }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { warehouses.splice(i,1); setData({ warehouses }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { warehouses.push({ name: nameIn.value, shortName: shortIn.value || "WH", address: addrIn.value }); nameIn.value = ""; shortIn.value = ""; addrIn.value = ""; setData({ warehouses }); renderList(); } } }, [el("span", { text: "Add Warehouse" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Warehouse", [formGrid([formField("Warehouse Name", nameIn, null, true), formField("Short Name", shortIn, null, true)]), formField("Address", addrIn), addBtn])]);
        }
      },
      {
        label: "Locations",
        render: ({ data, setData }) => {
          const warehouseOpts = (data.warehouses || existing.warehouses || []).map(w => w.name);
          const parentSelect  = formSelect(["WH/Stock", "WH/Input", "WH/Output", ...warehouseOpts.map(w => `${w}/Stock`)], "");
          const nameIn = formInput({ placeholder: "e.g. Shelf A1" });
          parentSelect.addEventListener("change", e => setData({ defaultParentLocation: e.target.value }));
          nameIn.addEventListener("input", e => setData({ defaultLocationName: e.target.value }));
          return formSection("Storage Locations", [
            formField("Parent Location", parentSelect, "Storage locations are created under the parent warehouse location."),
            formField("Location Name", nameIn)
          ]);
        }
      },
      {
        label: "Operation Types",
        render: ({ data, setData }) => {
          let opTypes = data.operationTypes || existing.operationTypes || [
            { name: "Receipts", code: "incoming", returnType: false, reservation: "at_confirm" },
            { name: "Delivery Orders", code: "outgoing", returnType: false, reservation: "at_confirm" },
            { name: "Internal Transfers", code: "internal", returnType: false, reservation: "at_confirm" },
            { name: "Returns", code: "incoming", returnType: true, reservation: "at_confirm" }
          ];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn = formInput({ placeholder: "e.g. Quality Check" });
          const codeIn = formSelect([
            { value: "incoming", label: "Receipt (incoming)" },
            { value: "outgoing", label: "Delivery (outgoing)" },
            { value: "internal", label: "Internal Transfer" }
          ]);
          const reserveIn = formSelect([
            { value: "at_confirm", label: "At Confirmation" },
            { value: "manual", label: "Manual" },
            { value: "by_date", label: "Before Scheduled Date" }
          ]);
          const returnCb = formCheckbox("Is a return operation", false);

          const renderOps = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            opTypes.forEach((ot, i) => listEl.append(
              el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
                el("span", { className: "badge badge--secondary text-[10px]", text: ot.code }),
                el("span", { className: "flex-1 text-sm font-semibold", text: ot.name }),
                ot.returnType ? el("span", { className: "text-xs text-on-surface-variant italic", text: "Return" }) : null,
                el("span", { className: "text-xs text-on-surface-variant", text: ot.reservation }),
                el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { opTypes.splice(i,1); setData({ operationTypes: opTypes }); renderOps(); } }, [
                  el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })
                ])
              ])
            ));
          };
          renderOps();
          const addBtn = el("button", {
            className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all",
            onclick: () => {
              if (nameIn.value) {
                const cb = returnCb.querySelector("input[type=checkbox]");
                opTypes.push({ name: nameIn.value, code: codeIn.value, returnType: cb?.checked || false, reservation: reserveIn.value });
                nameIn.value = "";
                setData({ operationTypes: opTypes });
                renderOps();
              }
            }
          }, [el("span", { text: "Add Operation Type" })]);
          return el("div", { className: "space-y-4" }, [
            listEl,
            formSection("New Operation Type", [
              formGrid([formField("Name", nameIn), formField("Type Code", codeIn)]),
              formGrid([formField("Reservation Method", reserveIn)]),
              returnCb,
              addBtn
            ])
          ]);
        }
      },
      {
        label: "Routes",
        render: ({ data, setData }) => {
          return formSection("Inventory Routes", [
            formCheckbox("Buy (from vendor)", data.routeBuy ?? true, v => setData({ routeBuy: v })),
            formCheckbox("Manufacture (produce in-house)", data.routeManufacture ?? false, v => setData({ routeManufacture: v })),
            formCheckbox("Replenish on Order (MTO)", data.routeMto ?? false, v => setData({ routeMto: v })),
            formCheckbox("Resupply from another warehouse", data.routeResupply ?? false, v => setData({ routeResupply: v }))
          ]);
        }
      },
      {
        label: "Lots / Serial",
        render: ({ data, setData }) => {
          return formSection("Traceability Settings", [
            formCheckbox("Enable Lot Numbers", data.lotsEnabled ?? false, v => setData({ lotsEnabled: v })),
            formCheckbox("Enable Serial Numbers", data.serialEnabled ?? false, v => setData({ serialEnabled: v })),
            formCheckbox("Expiry Dates on Lots", data.expiryDates ?? false, v => setData({ expiryDates: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Inventory Config", Object.assign({}, ...allData), pushInventoryConfig)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 7 — Accounting Configuration
// ─────────────────────────────────────────────────────────────
export function renderAccountingConfigWizard({ onComplete, onCancel }) {
  const existing = getWizardData("accountingConfig") || {};

  const shell = createWizardShell({
    title: "Accounting Configuration",
    subtitle: "Set up banks, journals and tax rules",
    icon: "account_balance",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("accountingConfig", merged);
      addActivityLog({ action: "Accounting Configuration completed", module: "Accounting" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Bank Accounts",
        render: ({ data, setData }) => {
          let banks = data.bankAccounts || existing.bankAccounts || [];
          const listEl = el("div", { className: "space-y-2" });
          const accIn   = formInput({ placeholder: "IBAN or account number" });
          const bankIn  = formInput({ placeholder: "Bank name" });
          const journIn = formInput({ placeholder: "Journal name, e.g. Bank" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            banks.forEach((b, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "material-symbols-outlined text-secondary", text: "account_balance" }),
              el("div", { className: "flex-1" }, [el("p", { className: "text-sm font-semibold", text: b.bankName }), el("p", { className: "text-xs text-on-surface-variant font-mono", text: b.accountNumber })]),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { banks.splice(i,1); setData({ bankAccounts: banks }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (accIn.value && bankIn.value) { banks.push({ accountNumber: accIn.value, bankName: bankIn.value, journalName: journIn.value }); accIn.value = ""; bankIn.value = ""; journIn.value = ""; setData({ bankAccounts: banks }); renderList(); } } }, [el("span", { text: "Add Bank Account" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Bank Account", [formField("Account Number / IBAN", accIn), formGrid([formField("Bank Name", bankIn), formField("Journal Name", journIn)]), addBtn])]);
        }
      },
      {
        label: "Opening Balances",
        render: ({ data, setData }) => {
          const accOpts = getAccountOptions();
          const accSelect = formSelect(accOpts.length ? accOpts.map(a => a.label) : ["Load Chart of Accounts first"]);
          const debitIn  = formInput({ type: "number", placeholder: "0.00" });
          const creditIn = formInput({ type: "number", placeholder: "0.00" });
          return formSection("Opening Balances", [
            el("p", { className: "text-sm text-on-surface-variant mb-4", text: "Use the Data Import section for bulk opening balance entry. Add individual accounts here." }),
            formField("Account", accSelect),
            formGrid([formField("Debit", debitIn), formField("Credit", creditIn)])
          ]);
        }
      },
      {
        label: "Fiscal Positions",
        render: ({ data, setData }) => {
          let fiscalPositions = data.fiscalPositions || existing.fiscalPositions || [];
          const listEl = el("div", { className: "space-y-3" });
          const fpName = formInput({ placeholder: "e.g. Intra-EU B2B" });
          const fpCountry = formSelect(["All countries", "Germany", "France", "United Kingdom", "United States", "Canada", "Australia"], "");
          const autoApply = formCheckbox("Auto-detect from partner country", true);
          const taxFromIn = formInput({ placeholder: "Source tax, e.g. VAT 20%" });
          const taxToIn   = formInput({ placeholder: "Destination tax, e.g. VAT 0% EU" });
          let tempMappings = [];
          const mappingList = el("div", { className: "space-y-1" });

          const renderMappings = () => {
            while (mappingList.firstChild) mappingList.removeChild(mappingList.firstChild);
            tempMappings.forEach((m, i) => mappingList.append(
              el("div", { className: "flex items-center gap-2 text-xs py-1" }, [
                el("span", { className: "font-mono", text: m.from }),
                el("span", { className: "text-on-surface-variant", text: "→" }),
                el("span", { className: "font-mono font-semibold", text: m.to }),
                el("button", { className: "text-error text-[10px]", onclick: () => { tempMappings.splice(i,1); renderMappings(); } }, [el("span", { text: "×" })])
              ])
            ));
          };

          const addMappingBtn = el("button", {
            className: "text-xs text-primary font-semibold hover:underline",
            onclick: () => { if (taxFromIn.value && taxToIn.value) { tempMappings.push({ from: taxFromIn.value, to: taxToIn.value }); taxFromIn.value = ""; taxToIn.value = ""; renderMappings(); } }
          }, [el("span", { text: "+ Add Tax Mapping" })]);

          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            fiscalPositions.forEach((fp, i) => listEl.append(
              el("div", { className: "bg-surface-container-low rounded-xl px-4 py-3 space-y-2" }, [
                el("div", { className: "flex items-center gap-3" }, [
                  el("span", { className: "flex-1 text-sm font-semibold", text: fp.name }),
                  el("span", { className: "badge badge--neutral text-[10px]", text: fp.country }),
                  fp.autoApply ? el("span", { className: "badge badge--secondary text-[10px]", text: "Auto" }) : null,
                  el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { fiscalPositions.splice(i,1); setData({ fiscalPositions }); renderList(); } }, [
                    el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })
                  ])
                ]),
                fp.taxMappings?.length ? el("div", { className: "pl-4 space-y-0.5" },
                  fp.taxMappings.map(m => el("div", { className: "flex items-center gap-2 text-xs text-on-surface-variant" }, [
                    el("span", { className: "font-mono", text: m.from }),
                    el("span", { text: "→" }),
                    el("span", { className: "font-mono font-semibold text-on-surface", text: m.to })
                  ]))
                ) : null
              ])
            ));
          };
          renderList();

          const addBtn = el("button", {
            className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all",
            onclick: () => {
              if (fpName.value) {
                const cb = autoApply.querySelector("input[type=checkbox]");
                fiscalPositions.push({ name: fpName.value, country: fpCountry.value, autoApply: cb?.checked || false, taxMappings: [...tempMappings] });
                fpName.value = ""; tempMappings = [];
                setData({ fiscalPositions });
                renderList();
                renderMappings();
              }
            }
          }, [el("span", { text: "Add Fiscal Position" })]);

          return el("div", { className: "space-y-4" }, [
            listEl,
            formSection("New Fiscal Position", [
              formGrid([formField("Name", fpName), formField("Country / Region", fpCountry)]),
              autoApply,
              formSection("Tax Mappings", [
                formGrid([formField("Tax on Product", taxFromIn), formField("Tax to Apply", taxToIn)]),
                mappingList,
                addMappingBtn
              ]),
              addBtn
            ])
          ]);
        }
      },
      {
        label: "Tax Config",
        render: ({ data, setData }) => {
          let taxes = data.taxes || existing.taxes || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn = formInput({ placeholder: "e.g. VAT 20%" });
          const typeIn = formSelect(["Sale", "Purchase", "None"], "");
          const rateIn = formInput({ type: "number", placeholder: "20" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            taxes.forEach((t, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "flex-1 text-sm font-semibold", text: t.name }),
              el("span", { className: "badge badge--secondary text-[10px]", text: `${t.rate}%` }),
              el("span", { className: "badge badge--neutral text-[10px]", text: t.type }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { taxes.splice(i,1); setData({ taxes }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { taxes.push({ name: nameIn.value, type: typeIn.value, rate: parseFloat(rateIn.value) || 0 }); nameIn.value = ""; rateIn.value = ""; setData({ taxes }); renderList(); } } }, [el("span", { text: "Add Tax" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Tax", [formField("Tax Name", nameIn), formGrid([formField("Type", typeIn), formField("Rate %", rateIn)]), addBtn])]);
        }
      },
      {
        label: "Sequences",
        render: ({ data, setData }) => {
          let sequences = data.sequences || existing.sequences || [
            { docType: "Customer Invoice", prefix: "INV/%(year)s/", padding: 4, startNumber: 1 },
            { docType: "Vendor Bill", prefix: "BILL/%(year)s/", padding: 4, startNumber: 1 },
            { docType: "Credit Note", prefix: "RINV/%(year)s/", padding: 4, startNumber: 1 },
            { docType: "Sales Order", prefix: "SO", padding: 5, startNumber: 1 },
            { docType: "Purchase Order", prefix: "PO", padding: 5, startNumber: 1 },
            { docType: "Delivery Order", prefix: "WH/OUT/", padding: 5, startNumber: 1 },
            { docType: "Receipt", prefix: "WH/IN/", padding: 5, startNumber: 1 }
          ];
          const listEl = el("div", { className: "space-y-2" });
          const docIn = formSelect([
            "Customer Invoice", "Vendor Bill", "Credit Note", "Refund",
            "Sales Order", "Purchase Order", "Delivery Order", "Receipt",
            "Manufacturing Order", "Payment", "Bank Statement"
          ]);
          const prefixIn = formInput({ placeholder: "INV/%(year)s/" });
          const padIn = formInput({ type: "number", placeholder: "4" });
          const startIn = formInput({ type: "number", placeholder: "1" });

          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            sequences.forEach((s, i) => listEl.append(
              el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
                el("span", { className: "flex-1 text-sm font-semibold", text: s.docType }),
                el("span", { className: "text-xs font-mono text-on-surface-variant", text: s.prefix }),
                el("span", { className: "badge badge--neutral text-[10px]", text: `${s.padding} digits` }),
                el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { sequences.splice(i,1); setData({ sequences }); renderList(); } }, [
                  el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })
                ])
              ])
            ));
          };
          renderList();
          const addBtn = el("button", {
            className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all",
            onclick: () => {
              if (docIn.value) {
                sequences.push({ docType: docIn.value, prefix: prefixIn.value || "", padding: parseInt(padIn.value) || 4, startNumber: parseInt(startIn.value) || 1 });
                prefixIn.value = ""; padIn.value = ""; startIn.value = "";
                setData({ sequences });
                renderList();
              }
            }
          }, [el("span", { text: "Add Sequence" })]);
          return el("div", { className: "space-y-4" }, [
            listEl,
            formSection("New Document Sequence", [
              formGrid([formField("Document Type", docIn), formField("Prefix", prefixIn, "Use %(year)s for year, %(month)s for month")]),
              formGrid([formField("Zero Padding", padIn), formField("Start Number", startIn)]),
              addBtn
            ])
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Accounting Config", Object.assign({}, ...allData), pushAccountingConfig)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 8 — Purchase Configuration
// ─────────────────────────────────────────────────────────────
export function renderPurchaseConfigWizard({ onComplete, onCancel }) {
  const existing = getWizardData("purchaseConfig") || {};

  const shell = createWizardShell({
    title: "Purchase Configuration",
    subtitle: "Configure purchasing rules and approval workflows",
    icon: "shopping_cart",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("purchaseConfig", merged);
      addActivityLog({ action: "Purchase Configuration completed", module: "Purchase" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Settings",
        render: ({ data, setData }) => {
          return formSection("Purchase Settings", [
            formCheckbox("Lock Confirmed Purchase Orders", data.lockPOs ?? existing.lockPOs ?? false, v => setData({ lockPOs: v })),
            formCheckbox("Reception Reminder Emails", data.receptionReminder ?? existing.receptionReminder ?? true, v => setData({ receptionReminder: v })),
            formGrid([
              formField("Default Purchase Lead Time (days)", formInput({ type: "number", placeholder: "3", value: data.leadTime || existing.leadTime || "3", attrs: { onchange: e => setData({ leadTime: e.target.value }) } }))
            ])
          ]);
        }
      },
      {
        label: "Vendor Pricelists",
        render: ({ data, setData }) => {
          const vendorCurr = formSelect(["USD", "EUR", "GBP", "AUD"], data.vendorCurrency || getDefaultCurrency());
          vendorCurr.addEventListener("change", e => setData({ vendorCurrency: e.target.value }));
          return formSection("Vendor Pricelist Settings", [
            formCheckbox("Enable Vendor Pricelists", data.vendorPricelists ?? false, v => setData({ vendorPricelists: v })),
            formField("Default Vendor Currency", vendorCurr)
          ]);
        }
      },
      {
        label: "Approval Rules",
        render: ({ data, setData }) => {
          const thresholdIn = formInput({ type: "number", placeholder: "5000", value: data.approvalThreshold || "" });
          const approverOpts = getUserOptions();
          const approverSelect = formSelect(approverOpts.length ? approverOpts.map(u => u.label) : ["—"], data.approver || "");
          thresholdIn.addEventListener("input", e => setData({ approvalThreshold: e.target.value }));
          approverSelect.addEventListener("change", e => setData({ approver: e.target.value }));
          return formSection("Purchase Order Approval", [
            formCheckbox("Require approval for large POs", data.requireApproval ?? false, v => setData({ requireApproval: v })),
            formGrid([formField("Approval Threshold Amount", thresholdIn), formField("Default Approver", approverSelect)]),
            approverOpts.length === 0 ? el("p", { className: "text-xs text-warning mt-2", text: "⚠ Add users in the Users wizard to populate this list." }) : null
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Purchase Config", Object.assign({}, ...allData), pushPurchaseConfig)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 9 — Manufacturing Configuration
// ─────────────────────────────────────────────────────────────
export function renderManufacturingConfigWizard({ onComplete, onCancel }) {
  const existing = getWizardData("manufacturingConfig") || {};

  const shell = createWizardShell({
    title: "Manufacturing Configuration",
    subtitle: "Configure manufacturing operations and workcenters",
    icon: "factory",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("manufacturingConfig", merged);
      addActivityLog({ action: "Manufacturing Configuration completed", module: "Manufacturing" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Settings",
        render: ({ data, setData }) => {
          const warehouseOpts = getWarehouseOptions();
          const mfgWarehouse = formSelect(warehouseOpts.length ? warehouseOpts.map(w => w.label) : ["Configure warehouses in Inventory wizard first"], data.mfgWarehouse || "");
          mfgWarehouse.addEventListener("change", e => setData({ mfgWarehouse: e.target.value }));
          return formSection("Manufacturing Settings", [
            formField("Manufacturing Warehouse", mfgWarehouse, "Warehouse where manufactured products are stored"),
            warehouseOpts.length === 0 ? el("p", { className: "text-xs text-warning mb-2", text: "⚠ Complete the Inventory wizard first to see warehouses here." }) : null,
            formCheckbox("Work Orders (operations/routing)", data.workOrders ?? false, v => setData({ workOrders: v })),
            formCheckbox("Enable Byproducts", data.byproducts ?? false, v => setData({ byproducts: v })),
            formCheckbox("Enable Scrap Locations", data.scrapLocations ?? true, v => setData({ scrapLocations: v })),
            formCheckbox("Unlock Finished Products", data.unlockFinished ?? false, v => setData({ unlockFinished: v }))
          ]);
        }
      },
      {
        label: "Workcenters",
        render: ({ data, setData }) => {
          let workcenters = data.workcenters || existing.workcenters || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn     = formInput({ placeholder: "Assembly Line 1" });
          const capacityIn = formInput({ type: "number", placeholder: "1" });
          const effIn      = formInput({ type: "number", placeholder: "100" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            workcenters.forEach((w, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "material-symbols-outlined text-tertiary", text: "precision_manufacturing" }),
              el("span", { className: "flex-1 text-sm font-semibold", text: w.name }),
              el("span", { className: "text-xs text-on-surface-variant", text: `Eff: ${w.efficiency}%` }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { workcenters.splice(i,1); setData({ workcenters }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { workcenters.push({ name: nameIn.value, capacity: parseFloat(capacityIn.value) || 1, efficiency: parseFloat(effIn.value) || 100 }); nameIn.value = ""; capacityIn.value = ""; effIn.value = ""; setData({ workcenters }); renderList(); } } }, [el("span", { text: "Add Workcenter" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Workcenter", [formField("Workcenter Name", nameIn), formGrid([formField("Capacity", capacityIn), formField("Time Efficiency %", effIn)]), addBtn])]);
        }
      },
      {
        label: "Operations",
        render: ({ data, setData }) => {
          let operations = data.operations || existing.operations || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn = formInput({ placeholder: "Cutting, Assembly, Painting..." });
          const timeIn = formInput({ type: "number", placeholder: "Minutes per unit" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            operations.forEach((o, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "flex-1 text-sm font-semibold", text: o.name }),
              el("span", { className: "text-xs text-on-surface-variant", text: `${o.timePerUnit} min/unit` }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { operations.splice(i,1); setData({ operations }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { operations.push({ name: nameIn.value, timePerUnit: parseFloat(timeIn.value) || 0 }); nameIn.value = ""; timeIn.value = ""; setData({ operations }); renderList(); } } }, [el("span", { text: "Add Operation" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Operation", [formField("Operation Name", nameIn), formField("Time per Unit (min)", timeIn), addBtn])]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Manufacturing Config", Object.assign({}, ...allData), pushManufacturingConfig)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 10 — HR & Payroll Configuration
// ─────────────────────────────────────────────────────────────
export function renderHrPayrollWizard({ onComplete, onCancel }) {
  const existing = getWizardData("hrPayrollConfig") || {};

  const shell = createWizardShell({
    title: "HR & Payroll Configuration",
    subtitle: "Set up departments, positions and payroll",
    icon: "group",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("hrPayrollConfig", merged);
      addActivityLog({ action: "HR & Payroll configured", module: "HR" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Departments",
        render: ({ data, setData }) => {
          let departments = data.departments || existing.departments || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn    = formInput({ placeholder: "Sales, Engineering, Finance..." });
          const managerIn = formSelect(["—"].concat(getUserOptions().map(u => u.label)));
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            departments.forEach((d, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "material-symbols-outlined text-tertiary", text: "corporate_fare" }),
              el("span", { className: "flex-1 text-sm font-semibold", text: d.name }),
              el("span", { className: "text-xs text-on-surface-variant", text: d.manager || "No manager" }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { departments.splice(i,1); setData({ departments }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { departments.push({ name: nameIn.value, manager: managerIn.value !== "—" ? managerIn.value : "" }); nameIn.value = ""; setData({ departments }); renderList(); } } }, [el("span", { text: "Add Department" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Department", [formGrid([formField("Department Name", nameIn), formField("Manager", managerIn)]), addBtn])]);
        }
      },
      {
        label: "Job Positions",
        render: ({ data, setData }) => {
          let jobPositions = data.jobPositions || existing.jobPositions || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn  = formInput({ placeholder: "Sales Manager, Developer..." });
          const deptIn  = formSelect(["—"].concat((data.departments || existing.departments || []).map(d => d.name)));
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            jobPositions.forEach((p, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "flex-1 text-sm font-semibold", text: p.name }),
              el("span", { className: "badge badge--neutral text-[10px]", text: p.department || "No dept" }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { jobPositions.splice(i,1); setData({ jobPositions }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { jobPositions.push({ name: nameIn.value, department: deptIn.value !== "—" ? deptIn.value : "" }); nameIn.value = ""; setData({ jobPositions }); renderList(); } } }, [el("span", { text: "Add Position" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Job Position", [formGrid([formField("Position Name", nameIn), formField("Department", deptIn)]), addBtn])]);
        }
      },
      {
        label: "Leave Types",
        render: ({ data, setData }) => {
          let leaveTypes = data.leaveTypes || existing.leaveTypes || [{ name: "Annual Leave", allocationMode: "Fixed", approval: "No Validation" }];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn  = formInput({ placeholder: "Annual Leave, Sick Leave..." });
          const allocIn = formSelect(["No Allocation", "Fixed by HR", "Allowed for Employees"], "");
          const approvIn = formSelect(["No Validation", "By HR Officer", "By Employee's Approver", "Both"], "");
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            leaveTypes.forEach((lt, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "flex-1 text-sm font-semibold", text: lt.name }),
              el("span", { className: "badge badge--secondary text-[10px]", text: lt.allocationMode }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { leaveTypes.splice(i,1); setData({ leaveTypes }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { leaveTypes.push({ name: nameIn.value, allocationMode: allocIn.value, approval: approvIn.value }); nameIn.value = ""; setData({ leaveTypes }); renderList(); } } }, [el("span", { text: "Add Leave Type" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Leave Type", [formField("Leave Type Name", nameIn), formGrid([formField("Allocation Mode", allocIn), formField("Approval", approvIn)]), addBtn])]);
        }
      },
      {
        label: "Payroll",
        render: ({ data, setData }) => {
          let salaryRules = data.salaryRules || existing.salaryRules || [{ name: "Basic Salary", sequence: 1 }];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn = formInput({ placeholder: "e.g. Housing Allowance" });
          const seqIn  = formInput({ type: "number", placeholder: "10" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            salaryRules.forEach((r, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "badge badge--neutral text-[10px]", text: String(r.sequence) }),
              el("span", { className: "flex-1 text-sm font-semibold", text: r.name }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { salaryRules.splice(i,1); setData({ salaryRules }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { salaryRules.push({ name: nameIn.value, sequence: parseInt(seqIn.value) || 0 }); nameIn.value = ""; seqIn.value = ""; setData({ salaryRules }); renderList(); } } }, [el("span", { text: "Add Salary Rule" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Salary Rule", [formGrid([formField("Rule Name", nameIn), formField("Sequence", seqIn)]), addBtn])]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("HR & Payroll Config", Object.assign({}, ...allData), pushHrPayroll)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 11 — Website & eCommerce
// ─────────────────────────────────────────────────────────────
export function renderWebsiteEcommerceWizard({ onComplete, onCancel }) {
  const existing = getWizardData("websiteEcommerce") || {};

  const shell = createWizardShell({
    title: "Website & eCommerce",
    subtitle: "Set up your Odoo website and online store",
    icon: "language",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("websiteEcommerce", merged);
      addActivityLog({ action: "Website & eCommerce configured", module: "Website" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Website",
        render: ({ data, setData }) => {
          const nameIn = formInput({ placeholder: "My Odoo Website", value: data.websiteName || existing.websiteName || "" });
          const langIn = formSelect(["English (UK)", "English (US)", "French", "German", "Spanish"], data.language || "");
          const currIn = formSelect(["USD", "EUR", "GBP"], data.currency || getDefaultCurrency());
          nameIn.addEventListener("input", e => setData({ websiteName: e.target.value }));
          langIn.addEventListener("change", e => setData({ language: e.target.value }));
          currIn.addEventListener("change", e => setData({ currency: e.target.value }));
          return formSection("Website Settings", [
            formField("Website Name", nameIn, null, true),
            formGrid([formField("Default Language", langIn), formField("Default Currency", currIn)])
          ]);
        }
      },
      {
        label: "Features",
        render: ({ data, setData }) => formSection("Website Features", [
          formCheckbox("Blog", data.blog ?? false, v => setData({ blog: v })),
          formCheckbox("Live Chat", data.liveChat ?? false, v => setData({ liveChat: v })),
          formCheckbox("Online Payments", data.onlinePayments ?? true, v => setData({ onlinePayments: v })),
          formCheckbox("eCommerce Shop", data.ecommerceShop ?? true, v => setData({ ecommerceShop: v })),
          formCheckbox("Customer Portal", data.customerPortal ?? true, v => setData({ customerPortal: v }))
        ])
      },
      {
        label: "Payments",
        render: ({ data, setData }) => {
          const stripeIn = formInput({ type: "password", placeholder: "sk_live_...", value: data.stripeKey || "" });
          const paypalIn = formInput({ type: "password", placeholder: "PayPal client ID", value: data.paypalKey || "" });
          stripeIn.addEventListener("input", e => setData({ stripeKey: e.target.value }));
          paypalIn.addEventListener("input", e => setData({ paypalKey: e.target.value }));
          return formSection("Payment Providers", [
            el("div", { className: "p-3 bg-secondary-container/30 rounded-lg text-xs text-on-secondary-container mb-4", text: "⚠ API keys are stored only in localStorage and never sent to our servers." }),
            formField("Stripe API Key", stripeIn),
            formField("PayPal Client ID", paypalIn)
          ]);
        }
      },
      {
        label: "Shipping",
        render: ({ data, setData }) => {
          let methods = data.shippingMethods || existing.shippingMethods || [];
          const listEl = el("div", { className: "space-y-2" });
          const nameIn  = formInput({ placeholder: "Standard Delivery" });
          const priceIn = formInput({ type: "number", placeholder: "4.99" });
          const renderList = () => {
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            methods.forEach((m, i) => listEl.append(el("div", { className: "flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3" }, [
              el("span", { className: "flex-1 text-sm font-semibold", text: m.name }),
              el("span", { className: "text-xs text-on-surface-variant", text: `${getDefaultCurrency()} ${m.price}` }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { methods.splice(i,1); setData({ shippingMethods: methods }); renderList(); } }, [el("span", { className: "material-symbols-outlined text-[16px]", text: "delete" })])
            ])));
          };
          renderList();
          const addBtn = el("button", { className: "bg-primary text-on-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all", onclick: () => { if (nameIn.value) { methods.push({ name: nameIn.value, price: parseFloat(priceIn.value) || 0 }); nameIn.value = ""; priceIn.value = ""; setData({ shippingMethods: methods }); renderList(); } } }, [el("span", { text: "Add Method" })]);
          return el("div", { className: "space-y-4" }, [listEl, formSection("New Shipping Method", [formGrid([formField("Method Name", nameIn), formField("Price", priceIn)]), addBtn])]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Website & eCommerce", Object.assign({}, ...allData), pushWebsiteEcommerce)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 12 — Point of Sale
// ─────────────────────────────────────────────────────────────
export function renderPosWizard({ onComplete, onCancel }) {
  const existing = getWizardData("posConfig") || {};

  const shell = createWizardShell({
    title: "Point of Sale",
    subtitle: "Configure your POS terminals",
    icon: "point_of_sale",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("posConfig", merged);
      addActivityLog({ action: "POS Configuration completed", module: "POS" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "POS Setup",
        render: ({ data, setData }) => {
          const nameIn    = formInput({ placeholder: "Main POS", value: data.posName || existing.posName || "" });
          const journalIn = formSelect(["Cash Journal", "Bank Journal", "POS Journal"], data.linkedJournal || "");
          const warehouseOpts = getWarehouseOptions();
          const warehouseIn = formSelect(warehouseOpts.length ? warehouseOpts.map(w => w.label) : ["Configure warehouses in Inventory wizard first"], data.warehouse || "");
          nameIn.addEventListener("input", e => setData({ posName: e.target.value }));
          journalIn.addEventListener("change", e => setData({ linkedJournal: e.target.value }));
          warehouseIn.addEventListener("change", e => setData({ warehouse: e.target.value }));
          return formSection("POS Terminal Setup", [
            formField("POS Name", nameIn, null, true),
            formField("Linked Journal", journalIn),
            formField("Stock Warehouse", warehouseIn, "Inventory will be decremented from this warehouse"),
            warehouseOpts.length === 0 ? el("p", { className: "text-xs text-warning", text: "⚠ Complete the Inventory wizard first to see warehouses here." }) : null
          ]);
        }
      },
      {
        label: "Payments",
        render: ({ data, setData }) => formSection("Payment Methods", [
          formCheckbox("Cash", data.paymentCash ?? true, v => setData({ paymentCash: v })),
          formCheckbox("Credit/Debit Card", data.paymentCard ?? true, v => setData({ paymentCard: v })),
          formCheckbox("Bank Transfer", data.paymentBank ?? false, v => setData({ paymentBank: v }))
        ])
      },
      {
        label: "Receipt",
        render: ({ data, setData }) => {
          const headerIn = formInput({ placeholder: "Welcome to our store!", value: data.receiptHeader || "" });
          const footerIn = formInput({ placeholder: "Thank you for your business!", value: data.receiptFooter || "" });
          headerIn.addEventListener("input", e => setData({ receiptHeader: e.target.value }));
          footerIn.addEventListener("input", e => setData({ receiptFooter: e.target.value }));
          return formSection("Receipt Customisation", [
            formField("Receipt Header Text", headerIn),
            formField("Receipt Footer Text", footerIn)
          ]);
        }
      },
      {
        label: "Hardware",
        render: ({ data, setData }) => formSection("Connected Hardware", [
          formCheckbox("Receipt Printer", data.receiptPrinter ?? false, v => setData({ receiptPrinter: v })),
          formCheckbox("Barcode Scanner", data.barcodeScanner ?? false, v => setData({ barcodeScanner: v })),
          formCheckbox("Cash Drawer", data.cashDrawer ?? false, v => setData({ cashDrawer: v })),
          formCheckbox("Customer Display", data.customerDisplay ?? false, v => setData({ customerDisplay: v }))
        ])
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("POS Config", Object.assign({}, ...allData), pushPosConfig)
      }
    ]
  });

  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// Module Setup View — router for all wizards
// ─────────────────────────────────────────────────────────────
export function renderModuleSetupView({ wizardId, onComplete, onCancel, onNavigate }) {
  const props = { onComplete, onCancel };

  const WIZARD_MAP = {
    "company-setup":       () => renderCompanySetupWizard(props),
    "users-access":        () => renderUsersAccessWizard(props),
    "chart-of-accounts":   () => renderChartOfAccountsWizard(props),
    "sales-setup":         () => renderSalesConfigWizard(props),
    "crm-setup":           () => renderCrmConfigWizard(props),
    "inventory-setup":     () => renderInventoryConfigWizard(props),
    "accounting-setup":    () => renderAccountingConfigWizard(props),
    "purchase-setup":      () => renderPurchaseConfigWizard(props),
    "manufacturing-setup": () => renderManufacturingConfigWizard(props),
    "hr-setup":            () => renderHrPayrollWizard(props),
    "website-setup":       () => renderWebsiteEcommerceWizard(props),
    "pos-setup":           () => renderPosWizard(props)
  };

  if (!wizardId || !WIZARD_MAP[wizardId]) {
    return renderWizardLauncher(onNavigate);
  }

  return WIZARD_MAP[wizardId]();
}

function renderWizardLauncher(onNavigate) {
  const WIZARD_CARDS = [
    { id: "company-setup",       label: "Company Setup",       icon: "business",         desc: "Name, address, currency, fiscal year" },
    { id: "users-access",        label: "Users & Access",      icon: "manage_accounts",  desc: "Add team members and roles" },
    { id: "chart-of-accounts",   label: "Chart of Accounts",   icon: "account_balance",  desc: "Load standard accounts for your country" },
    { id: "sales-setup",         label: "Sales",               icon: "sell",             desc: "Teams, pricelists, payment terms" },
    { id: "crm-setup",           label: "CRM",                 icon: "person_pin",       desc: "Pipeline stages, lead sources" },
    { id: "inventory-setup",     label: "Inventory",           icon: "inventory_2",      desc: "Warehouses, locations, routes" },
    { id: "accounting-setup",    label: "Accounting",          icon: "account_balance",  desc: "Banks, journals, taxes" },
    { id: "purchase-setup",      label: "Purchase",            icon: "shopping_cart",    desc: "PO rules, approval workflows" },
    { id: "manufacturing-setup", label: "Manufacturing",       icon: "factory",          desc: "Workcenters, BOM routes" },
    { id: "hr-setup",            label: "HR & Payroll",        icon: "group",            desc: "Departments, positions, payroll" },
    { id: "website-setup",       label: "Website",             icon: "language",         desc: "Online store, payment providers" },
    { id: "pos-setup",           label: "Point of Sale",       icon: "point_of_sale",    desc: "POS terminals, payment methods" }
  ];

  return el("div", { className: "max-w-4xl mx-auto space-y-6" }, [
    el("div", {}, [
      el("p", { className: "text-xs font-bold uppercase tracking-widest text-secondary mb-1", text: "Configuration Wizards" }),
      el("h2", { className: "font-headline text-2xl font-bold text-on-surface", text: "Module Setup" }),
      el("p", { className: "text-sm text-on-surface-variant mt-1", text: "Complete each wizard to configure your Odoo modules. Data flows automatically between wizards." })
    ]),
    el("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" },
      WIZARD_CARDS.map(w => {
        const done = !!getWizardData(toCamelKey(w.id));
        return el("button", {
          className: `text-left bg-surface-container-lowest rounded-xl border ${done ? "border-secondary/30" : "border-outline-variant/10"} shadow-sm p-5 hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.98]`,
          onclick: () => onNavigate("wizard-" + w.id)
        }, [
          el("div", { className: "flex items-start justify-between mb-3" }, [
            el("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${done ? "bg-secondary text-on-secondary" : "primary-gradient text-on-primary"}` }, [
              el("span", { className: "material-symbols-outlined text-[20px]", text: done ? "check" : w.icon })
            ]),
            done ? el("span", { className: "badge badge--success text-[10px]", text: "Done" }) : null
          ]),
          el("h4", { className: "font-headline text-sm font-bold text-on-surface mb-1", text: w.label }),
          el("p", { className: "text-xs text-on-surface-variant", text: w.desc })
        ]);
      })
    )
  ]);
}

function toCamelKey(id) {
  const map = {
    "company-setup": "companySetup",
    "users-access": "usersAccess",
    "chart-of-accounts": "chartOfAccounts",
    "sales-setup": "salesConfig",
    "crm-setup": "crmConfig",
    "inventory-setup": "inventoryConfig",
    "accounting-setup": "accountingConfig",
    "purchase-setup": "purchaseConfig",
    "manufacturing-setup": "manufacturingConfig",
    "hr-setup": "hrPayrollConfig",
    "website-setup": "websiteEcommerce",
    "pos-setup": "posConfig"
  };
  return map[id] || null;
}
