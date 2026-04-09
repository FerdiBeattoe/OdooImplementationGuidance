/**
 * All 12 Module Setup Wizards
 * Each wizard uses createWizardShell with fully defined steps.
 */
import { createWizardShell, formField, formInput, formSelect, formCheckbox, formSection, formGrid, pushSummaryStep } from "./WizardShell.js";
import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import {
  pushCompanySetup, pushUsersAccess, pushChartOfAccounts, pushSalesConfig,
  pushCrmConfig, pushInventoryConfig, pushAccountingConfig, pushPurchaseConfig,
  pushManufacturingConfig, pushMasterDataConfig, pushPlmConfig, pushQualityConfig,
  pushHrPayroll, pushWebsiteEcommerce, pushPosConfig,
  pushFieldServiceConfig, pushMaintenanceConfig, pushRentalConfig, pushRepairsConfig,
  pushSubscriptionsConfig, pushTimesheetsConfig, pushExpensesConfig, pushAttendanceConfig,
  pushRecruitmentConfig, pushFleetConfig, pushEventsConfig, pushEmailMarketingConfig,
  pushHelpdeskConfig, pushPayrollConfig, pushPlanningConfig, pushKnowledgeConfig,
  pushDocumentsConfig, pushSignConfig, pushDiscussConfig, pushOutgoingMailConfig, pushIncomingMailConfig,
  pushAccountingReportsConfig, pushSpreadsheetConfig, pushLiveChatConfig,
  pushWhatsappConfig, pushSmsMarketingConfig, pushCalendarConfig, pushIotConfig,
  pushStudioConfig, pushConsolidationConfig, pushLunchConfig, pushReferralsConfig,
  pushLoyaltyConfig, pushAppraisalsConfig, pushVoipConfig, pushApprovalsConfig
} from "./wizard-push.js";
import {
  setWizardData, getWizardData, addActivityLog,
  getUserOptions, getDefaultCurrency, getDefaultCountry,
  getSalesTeamOptions, getAccountOptions, getDepartmentOptions, getJobPositionOptions,
  getWarehouseOptions
} from "../state/implementationStore.js";
import { getCompletedWizards } from "../state/app-store.js";

// ─────────────────────────────────────────────────────────────
// WIZARD 1 — Company Setup
// ─────────────────────────────────────────────────────────────
export function renderCompanySetupWizard({ onComplete, onCancel }) {
  const existing = getWizardData("companySetup") || {};

  const shell = createWizardShell({
    title: "Company Setup",
    subtitle: "Configure your Odoo company identity",
    icon: "building-2",
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
              lucideIcon("image", 28),
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
    icon: "users",
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
                }, [lucideIcon("trash-2", 16)])
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
          }, [lucideIcon("user-plus", 18), el("span", { text: "Add User" })]);

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
    icon: "landmark",
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
            lucideIcon("download", 18),
            el("span", { text: "Load Standard Chart of Accounts" })
          ]);
          countrySelect.addEventListener("change", e => setData({ country: e.target.value }));
          return formSection("Select Country", [
            formField("Country", countrySelect, "The standard chart of accounts for this country will be pre-loaded."),
            el("div", { className: "pt-2" }, [loadBtn]),
            data.accountsLoaded || existing.accountsLoaded
              ? el("div", { className: "flex items-center gap-2 text-green-700 text-sm font-medium mt-2" }, [
                  lucideIcon("check-circle", 18),
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
    icon: "tag",
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
                lucideIcon("users", 18),
                el("span", { className: "flex-1 text-sm font-semibold", text: t.name }),
                el("span", { className: "text-xs text-on-surface-variant", text: t.leader || "No leader" }),
                el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { teams.splice(i,1); setData({ salesTeams: teams }); renderTeams(); } }, [
                  lucideIcon("trash-2", 16)
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
                  lucideIcon("trash-2", 16)
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
                  lucideIcon("trash-2", 16)
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
    icon: "target",
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
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { stages.splice(i, 1); setData({ stages }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
              el("button", { className: "hover:text-error", onclick: () => { sources.splice(i, 1); setData({ leadSources: sources }); renderList(); } }, [lucideIcon("x", 14)])
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
              el("button", { className: "hover:text-error", onclick: () => { lostReasons.splice(i, 1); setData({ lostReasons }); renderList(); } }, [lucideIcon("x", 14)])
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
    icon: "package",
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
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { warehouses.splice(i,1); setData({ warehouses }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
                  lucideIcon("trash-2", 16)
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
    icon: "calculator",
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
              lucideIcon("landmark", 18),
              el("div", { className: "flex-1" }, [el("p", { className: "text-sm font-semibold", text: b.bankName }), el("p", { className: "text-xs text-on-surface-variant font-mono", text: b.accountNumber })]),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { banks.splice(i,1); setData({ bankAccounts: banks }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
                    lucideIcon("trash-2", 16)
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
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { taxes.splice(i,1); setData({ taxes }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
                  lucideIcon("trash-2", 16)
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
    icon: "shopping-cart",
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
              lucideIcon("cog", 18),
              el("span", { className: "flex-1 text-sm font-semibold", text: w.name }),
              el("span", { className: "text-xs text-on-surface-variant", text: `Eff: ${w.efficiency}%` }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { workcenters.splice(i,1); setData({ workcenters }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { operations.splice(i,1); setData({ operations }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
    icon: "user-check",
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
              lucideIcon("building", 18),
              el("span", { className: "flex-1 text-sm font-semibold", text: d.name }),
              el("span", { className: "text-xs text-on-surface-variant", text: d.manager || "No manager" }),
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { departments.splice(i,1); setData({ departments }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { jobPositions.splice(i,1); setData({ jobPositions }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { leaveTypes.splice(i,1); setData({ leaveTypes }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { salaryRules.splice(i,1); setData({ salaryRules }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
    icon: "globe",
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
              el("button", { className: "p-1 text-error hover:bg-error-container rounded-lg", onclick: () => { methods.splice(i,1); setData({ shippingMethods: methods }); renderList(); } }, [lucideIcon("trash-2", 16)])
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
    icon: "monitor",
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
// WIZARD 13 — Field Service
// ─────────────────────────────────────────────────────────────
export function renderFieldServiceWizard({ onComplete, onCancel }) {
  const existing = getWizardData("fieldServiceConfig") || {};
  const shell = createWizardShell({
    title: "Field Service",
    subtitle: "Configure on-site service teams and task management",
    icon: "wrench",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("fieldServiceConfig", merged);
      addActivityLog({ action: "Field Service completed", module: "Field Service" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Service Teams",
        render: ({ data, setData }) => {
          const teamName = formInput({ placeholder: "e.g. North Region Team", value: data.teamName || existing.teamName || "" });
          const territory = formInput({ placeholder: "e.g. North-East", value: data.territory || existing.territory || "" });
          const defaultTech = formInput({ placeholder: "e.g. John Smith", value: data.defaultTechnician || existing.defaultTechnician || "" });
          teamName.addEventListener("input", e => setData({ teamName: e.target.value }));
          territory.addEventListener("input", e => setData({ territory: e.target.value }));
          defaultTech.addEventListener("input", e => setData({ defaultTechnician: e.target.value }));
          return formSection("Service Teams", [
            formField("Team Name", teamName),
            formGrid([formField("Territory", territory), formField("Default Technician", defaultTech)])
          ]);
        }
      },
      {
        label: "Task Types",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "e.g. Installation, Repair, Inspection", value: data.taskCategories || existing.taskCategories || "" });
          const slaHours = formInput({ type: "number", placeholder: "24", value: data.slaHours || existing.slaHours || "" });
          categories.addEventListener("input", e => setData({ taskCategories: e.target.value }));
          slaHours.addEventListener("input", e => setData({ slaHours: e.target.value }));
          return formSection("Task Types", [
            formField("Service Task Categories", categories, "Comma-separated list"),
            formField("SLA Hours per Category", slaHours)
          ]);
        }
      },
      {
        label: "Equipment",
        render: ({ data, setData }) => {
          return formSection("Equipment Tracking", [
            formCheckbox("Track Customer Equipment", data.trackEquipment ?? existing.trackEquipment ?? false, v => setData({ trackEquipment: v })),
            formCheckbox("Serial Number Required", data.serialRequired ?? existing.serialRequired ?? false, v => setData({ serialRequired: v }))
          ]);
        }
      },
      {
        label: "Mobile",
        render: ({ data, setData }) => {
          return formSection("Mobile Access", [
            formCheckbox("Mobile App Access", data.mobileAccess ?? existing.mobileAccess ?? true, v => setData({ mobileAccess: v })),
            formCheckbox("Offline Mode", data.offlineMode ?? existing.offlineMode ?? false, v => setData({ offlineMode: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Field Service", Object.assign({}, ...allData), pushFieldServiceConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 14 — Maintenance
// ─────────────────────────────────────────────────────────────
export function renderMaintenanceWizard({ onComplete, onCancel }) {
  const existing = getWizardData("maintenanceConfig") || {};
  const shell = createWizardShell({
    title: "Maintenance",
    subtitle: "Set up equipment maintenance teams and schedules",
    icon: "settings",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("maintenanceConfig", merged);
      addActivityLog({ action: "Maintenance completed", module: "Maintenance" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Teams",
        render: ({ data, setData }) => {
          const teamName = formInput({ placeholder: "e.g. Facility Maintenance", value: data.teamName || existing.teamName || "" });
          const responsible = formSelect(getUserOptions(), data.responsibleUser || existing.responsibleUser || "");
          teamName.addEventListener("input", e => setData({ teamName: e.target.value }));
          responsible.addEventListener("change", e => setData({ responsibleUser: e.target.value }));
          return formSection("Maintenance Teams", [
            formField("Team Name", teamName),
            formField("Responsible User", responsible)
          ]);
        }
      },
      {
        label: "Equipment",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "e.g. HVAC, Electrical, Plumbing", value: data.equipmentCategories || existing.equipmentCategories || "" });
          categories.addEventListener("input", e => setData({ equipmentCategories: e.target.value }));
          return formSection("Equipment Registry", [
            formField("Equipment Categories", categories, "Comma-separated list"),
            formCheckbox("Location Tracking", data.locationTracking ?? existing.locationTracking ?? true, v => setData({ locationTracking: v }))
          ]);
        }
      },
      {
        label: "Preventive",
        render: ({ data, setData }) => {
          const scheduleType = formSelect(["Calendar-based", "Meter-based"], data.scheduleType || existing.scheduleType || "");
          const leadTime = formInput({ type: "number", placeholder: "7", value: data.leadTimeDays || existing.leadTimeDays || "" });
          scheduleType.addEventListener("change", e => setData({ scheduleType: e.target.value }));
          leadTime.addEventListener("input", e => setData({ leadTimeDays: e.target.value }));
          return formSection("Preventive Maintenance", [
            formField("Schedule Type", scheduleType),
            formField("Lead Time (days)", leadTime)
          ]);
        }
      },
      {
        label: "Corrective",
        render: ({ data, setData }) => {
          const priorityLevels = formInput({ placeholder: "e.g. Low, Normal, High, Urgent", value: data.priorityLevels || existing.priorityLevels || "" });
          const escalation = formSelect(["None", "Email Manager", "Email Manager + Director"], data.escalationPolicy || existing.escalationPolicy || "");
          priorityLevels.addEventListener("input", e => setData({ priorityLevels: e.target.value }));
          escalation.addEventListener("change", e => setData({ escalationPolicy: e.target.value }));
          return formSection("Corrective Maintenance", [
            formField("Priority Levels", priorityLevels, "Comma-separated list"),
            formField("Escalation Policy", escalation)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Maintenance", Object.assign({}, ...allData), pushMaintenanceConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 15 — Rental
// ─────────────────────────────────────────────────────────────
export function renderRentalWizard({ onComplete, onCancel }) {
  const existing = getWizardData("rentalConfig") || {};
  const shell = createWizardShell({
    title: "Rental",
    subtitle: "Configure rental products, pricing, and return policies",
    icon: "key",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("rentalConfig", merged);
      addActivityLog({ action: "Rental completed", module: "Rental" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Products",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "e.g. Vehicles, Equipment, Tools", value: data.rentalCategories || existing.rentalCategories || "" });
          categories.addEventListener("input", e => setData({ rentalCategories: e.target.value }));
          return formSection("Rental Products", [
            formField("Product Categories for Rental", categories, "Comma-separated list"),
            formCheckbox("Serialized Tracking", data.serializedTracking ?? existing.serializedTracking ?? true, v => setData({ serializedTracking: v }))
          ]);
        }
      },
      {
        label: "Pricing",
        render: ({ data, setData }) => {
          const pricingUnit = formSelect(["Daily", "Weekly", "Monthly"], data.pricingUnit || existing.pricingUnit || "");
          const minDuration = formInput({ type: "number", placeholder: "1", value: data.minDuration || existing.minDuration || "" });
          pricingUnit.addEventListener("change", e => setData({ pricingUnit: e.target.value }));
          minDuration.addEventListener("input", e => setData({ minDuration: e.target.value }));
          return formSection("Pricing", [
            formField("Pricing Unit", pricingUnit),
            formField("Minimum Rental Duration", minDuration)
          ]);
        }
      },
      {
        label: "Returns",
        render: ({ data, setData }) => {
          return formSection("Return Policy", [
            formCheckbox("Late Return Penalty", data.lateReturnPenalty ?? existing.lateReturnPenalty ?? false, v => setData({ lateReturnPenalty: v })),
            formCheckbox("Damage Deposit Required", data.damageDeposit ?? existing.damageDeposit ?? true, v => setData({ damageDeposit: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Rental", Object.assign({}, ...allData), pushRentalConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 16 — Repairs
// ─────────────────────────────────────────────────────────────
export function renderRepairsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("repairsConfig") || {};
  const shell = createWizardShell({
    title: "Repairs",
    subtitle: "Configure repair workflows, parts, and warranty tracking",
    icon: "tool",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("repairsConfig", merged);
      addActivityLog({ action: "Repairs completed", module: "Repairs" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Workflow",
        render: ({ data, setData }) => {
          const stages = formInput({ placeholder: "Quotation, Confirmed, Under Repair, Done", value: data.repairStages || existing.repairStages || "Quotation, Confirmed, Under Repair, Done" });
          stages.addEventListener("input", e => setData({ repairStages: e.target.value }));
          return formSection("Repair Workflow", [
            formField("Repair Stages", stages, "Comma-separated list of stages")
          ]);
        }
      },
      {
        label: "Parts & Labour",
        render: ({ data, setData }) => {
          const stockLocation = formSelect(getWarehouseOptions(), data.partsLocation || existing.partsLocation || "");
          const labourProduct = formInput({ placeholder: "e.g. Repair Labour", value: data.labourProduct || existing.labourProduct || "" });
          stockLocation.addEventListener("change", e => setData({ partsLocation: e.target.value }));
          labourProduct.addEventListener("input", e => setData({ labourProduct: e.target.value }));
          return formSection("Parts & Labour", [
            formField("Stock Location for Parts", stockLocation),
            formField("Labour Product Name", labourProduct)
          ]);
        }
      },
      {
        label: "Warranty",
        render: ({ data, setData }) => {
          const warrantyMonths = formInput({ type: "number", placeholder: "12", value: data.warrantyMonths || existing.warrantyMonths || "" });
          warrantyMonths.addEventListener("input", e => setData({ warrantyMonths: e.target.value }));
          return formSection("Warranty", [
            formCheckbox("Warranty Tracking", data.warrantyTracking ?? existing.warrantyTracking ?? true, v => setData({ warrantyTracking: v })),
            formField("Warranty Duration (months)", warrantyMonths)
          ]);
        }
      },
      {
        label: "Communication",
        render: ({ data, setData }) => {
          return formSection("Customer Communication", [
            formCheckbox("Send Repair Updates by Email", data.emailUpdates ?? existing.emailUpdates ?? true, v => setData({ emailUpdates: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Repairs", Object.assign({}, ...allData), pushRepairsConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 17 — Subscriptions
// ─────────────────────────────────────────────────────────────
export function renderSubscriptionsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("subscriptionsConfig") || {};
  const shell = createWizardShell({
    title: "Subscriptions",
    subtitle: "Set up subscription plans, renewals, and churn tracking",
    icon: "repeat",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("subscriptionsConfig", merged);
      addActivityLog({ action: "Subscriptions completed", module: "Subscriptions" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Plans",
        render: ({ data, setData }) => {
          const planNames = formInput({ placeholder: "e.g. Basic, Professional, Enterprise", value: data.planNames || existing.planNames || "" });
          const billingFreq = formSelect(["Monthly", "Quarterly", "Annual"], data.billingFrequency || existing.billingFrequency || "");
          planNames.addEventListener("input", e => setData({ planNames: e.target.value }));
          billingFreq.addEventListener("change", e => setData({ billingFrequency: e.target.value }));
          return formSection("Subscription Plans", [
            formField("Plan Names", planNames, "Comma-separated list"),
            formField("Billing Frequency", billingFreq)
          ]);
        }
      },
      {
        label: "Pricing",
        render: ({ data, setData }) => {
          const pricePerPlan = formInput({ placeholder: "e.g. 29.99", value: data.pricePerPlan || existing.pricePerPlan || "" });
          const currency = formSelect(["USD", "EUR", "GBP", "AUD", "CAD"], data.currency || existing.currency || getDefaultCurrency());
          pricePerPlan.addEventListener("input", e => setData({ pricePerPlan: e.target.value }));
          currency.addEventListener("change", e => setData({ currency: e.target.value }));
          return formSection("Pricing", [
            formField("Price per Plan", pricePerPlan),
            formField("Currency", currency)
          ]);
        }
      },
      {
        label: "Renewal",
        render: ({ data, setData }) => {
          const reminderDays = formInput({ type: "number", placeholder: "30", value: data.renewalReminderDays || existing.renewalReminderDays || "" });
          reminderDays.addEventListener("input", e => setData({ renewalReminderDays: e.target.value }));
          return formSection("Renewal", [
            formCheckbox("Auto-Renewal", data.autoRenewal ?? existing.autoRenewal ?? true, v => setData({ autoRenewal: v })),
            formField("Renewal Reminder (days before expiry)", reminderDays)
          ]);
        }
      },
      {
        label: "Churn",
        render: ({ data, setData }) => {
          const cancellationPolicy = formSelect(["Immediate", "End of billing period", "30-day notice"], data.cancellationPolicy || existing.cancellationPolicy || "");
          cancellationPolicy.addEventListener("change", e => setData({ cancellationPolicy: e.target.value }));
          return formSection("Churn", [
            formCheckbox("Churn Reason Tracking", data.churnTracking ?? existing.churnTracking ?? true, v => setData({ churnTracking: v })),
            formField("Cancellation Policy", cancellationPolicy)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Subscriptions", Object.assign({}, ...allData), pushSubscriptionsConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 18 — Timesheets
// ─────────────────────────────────────────────────────────────
export function renderTimesheetsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("timesheetsConfig") || {};
  const shell = createWizardShell({
    title: "Timesheets",
    subtitle: "Configure timesheet policies and invoicing rules",
    icon: "clock",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("timesheetsConfig", merged);
      addActivityLog({ action: "Timesheets completed", module: "Timesheets" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Policy",
        render: ({ data, setData }) => {
          const unit = formSelect(["Hours", "Days"], data.timesheetUnit || existing.timesheetUnit || "");
          const minEntry = formInput({ placeholder: "0.25", value: data.minEntryDuration || existing.minEntryDuration || "" });
          unit.addEventListener("change", e => setData({ timesheetUnit: e.target.value }));
          minEntry.addEventListener("input", e => setData({ minEntryDuration: e.target.value }));
          return formSection("Timesheet Policy", [
            formField("Timesheet Unit", unit),
            formField("Minimum Entry Duration", minEntry)
          ]);
        }
      },
      {
        label: "Approval",
        render: ({ data, setData }) => {
          const deadline = formSelect(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], data.approvalDeadline || existing.approvalDeadline || "");
          deadline.addEventListener("change", e => setData({ approvalDeadline: e.target.value }));
          return formSection("Approval", [
            formCheckbox("Manager Approval Required", data.managerApproval ?? existing.managerApproval ?? true, v => setData({ managerApproval: v })),
            formField("Approval Deadline (day of week)", deadline)
          ]);
        }
      },
      {
        label: "Invoicing",
        render: ({ data, setData }) => {
          const billingSource = formSelect(["Employee Cost", "Project Rate", "Task Rate"], data.billingRateSource || existing.billingRateSource || "");
          billingSource.addEventListener("change", e => setData({ billingRateSource: e.target.value }));
          return formSection("Invoicing", [
            formCheckbox("Link Timesheets to Invoicing", data.linkToInvoicing ?? existing.linkToInvoicing ?? false, v => setData({ linkToInvoicing: v })),
            formField("Billing Rate Source", billingSource)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Timesheets", Object.assign({}, ...allData), pushTimesheetsConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 19 — Expenses
// ─────────────────────────────────────────────────────────────
export function renderExpensesWizard({ onComplete, onCancel }) {
  const existing = getWizardData("expensesConfig") || {};
  const shell = createWizardShell({
    title: "Expenses",
    subtitle: "Set up expense categories, approvals, and accounting",
    icon: "receipt",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("expensesConfig", merged);
      addActivityLog({ action: "Expenses completed", module: "Expenses" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Policy",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "Travel, Meals, Accommodation, Equipment, Other", value: data.expenseCategories || existing.expenseCategories || "Travel, Meals, Accommodation, Equipment, Other" });
          categories.addEventListener("input", e => setData({ expenseCategories: e.target.value }));
          return formSection("Expense Policy", [
            formField("Expense Categories", categories, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Approval",
        render: ({ data, setData }) => {
          const workflow = formSelect(["Direct Manager", "Finance Team", "Both"], data.approvalWorkflow || existing.approvalWorkflow || "");
          workflow.addEventListener("change", e => setData({ approvalWorkflow: e.target.value }));
          return formSection("Approval Workflow", [
            formField("Approval Workflow", workflow)
          ]);
        }
      },
      {
        label: "Receipts",
        render: ({ data, setData }) => {
          const receiptThreshold = formInput({ type: "number", placeholder: "25", value: data.receiptThreshold || existing.receiptThreshold || "" });
          const currencyPolicy = formSelect(["Company Currency Only", "Any Currency"], data.currencyPolicy || existing.currencyPolicy || "");
          receiptThreshold.addEventListener("input", e => setData({ receiptThreshold: e.target.value }));
          currencyPolicy.addEventListener("change", e => setData({ currencyPolicy: e.target.value }));
          return formSection("Receipts", [
            formField("Receipt Required Above Amount", receiptThreshold),
            formField("Currency Policy", currencyPolicy)
          ]);
        }
      },
      {
        label: "Accounting",
        render: ({ data, setData }) => {
          const expenseAccount = formSelect(getAccountOptions(), data.expenseAccount || existing.expenseAccount || "");
          expenseAccount.addEventListener("change", e => setData({ expenseAccount: e.target.value }));
          return formSection("Accounting", [
            formField("Expense Account", expenseAccount),
            formCheckbox("Re-Invoice to Customer", data.reInvoice ?? existing.reInvoice ?? false, v => setData({ reInvoice: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Expenses", Object.assign({}, ...allData), pushExpensesConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 20 — Attendance
// ─────────────────────────────────────────────────────────────
export function renderAttendanceWizard({ onComplete, onCancel }) {
  const existing = getWizardData("attendanceConfig") || {};
  const shell = createWizardShell({
    title: "Attendance",
    subtitle: "Configure check-in methods, schedules, and overtime",
    icon: "user-check",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("attendanceConfig", merged);
      addActivityLog({ action: "Attendance completed", module: "Attendance" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Check-In",
        render: ({ data, setData }) => {
          const method = formSelect(["Manual", "Kiosk", "Mobile App", "Badge Scan"], data.checkInMethod || existing.checkInMethod || "");
          method.addEventListener("change", e => setData({ checkInMethod: e.target.value }));
          return formSection("Check-In Method", [
            formField("Check-In Method", method)
          ]);
        }
      },
      {
        label: "Schedule",
        render: ({ data, setData }) => {
          const hoursPerDay = formInput({ type: "number", placeholder: "8", value: data.hoursPerDay || existing.hoursPerDay || "" });
          const daysPerWeek = formInput({ type: "number", placeholder: "5", value: data.daysPerWeek || existing.daysPerWeek || "" });
          hoursPerDay.addEventListener("input", e => setData({ hoursPerDay: e.target.value }));
          daysPerWeek.addEventListener("input", e => setData({ daysPerWeek: e.target.value }));
          return formSection("Working Schedule", [
            formGrid([formField("Standard Hours per Day", hoursPerDay), formField("Work Days per Week", daysPerWeek)])
          ]);
        }
      },
      {
        label: "Overtime",
        render: ({ data, setData }) => {
          const threshold = formInput({ type: "number", placeholder: "40", value: data.overtimeThreshold || existing.overtimeThreshold || "" });
          threshold.addEventListener("input", e => setData({ overtimeThreshold: e.target.value }));
          return formSection("Overtime", [
            formCheckbox("Overtime Tracking", data.overtimeTracking ?? existing.overtimeTracking ?? false, v => setData({ overtimeTracking: v })),
            formField("Overtime Threshold (hours/week)", threshold)
          ]);
        }
      },
      {
        label: "Reporting",
        render: ({ data, setData }) => {
          return formSection("Reporting", [
            formCheckbox("Monthly Attendance Report", data.monthlyReport ?? existing.monthlyReport ?? true, v => setData({ monthlyReport: v })),
            formCheckbox("Manager Access to Reports", data.managerAccess ?? existing.managerAccess ?? true, v => setData({ managerAccess: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Attendance", Object.assign({}, ...allData), pushAttendanceConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 21 — Recruitment
// ─────────────────────────────────────────────────────────────
export function renderRecruitmentWizard({ onComplete, onCancel }) {
  const existing = getWizardData("recruitmentConfig") || {};
  const shell = createWizardShell({
    title: "Recruitment",
    subtitle: "Configure hiring pipeline, interviews, and communication",
    icon: "user-plus",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("recruitmentConfig", merged);
      addActivityLog({ action: "Recruitment completed", module: "Recruitment" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Pipeline",
        render: ({ data, setData }) => {
          const stages = formInput({ placeholder: "New, Screening, Interview, Offer, Hired, Refused", value: data.pipelineStages || existing.pipelineStages || "New, Screening, Interview, Offer, Hired, Refused" });
          stages.addEventListener("input", e => setData({ pipelineStages: e.target.value }));
          return formSection("Pipeline Stages", [
            formField("Recruitment Stages", stages, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Positions",
        render: ({ data, setData }) => {
          const positions = formInput({ placeholder: "e.g. Software Engineer, Sales Manager", value: data.jobPositions || existing.jobPositions || "" });
          const department = formSelect(getDepartmentOptions(), data.department || existing.department || "");
          positions.addEventListener("input", e => setData({ jobPositions: e.target.value }));
          department.addEventListener("change", e => setData({ department: e.target.value }));
          return formSection("Job Positions", [
            formField("Job Positions", positions, "Comma-separated list"),
            formField("Department", department)
          ]);
        }
      },
      {
        label: "Interviews",
        render: ({ data, setData }) => {
          const rounds = formSelect(["1", "2", "3"], data.interviewRounds || existing.interviewRounds || "");
          rounds.addEventListener("change", e => setData({ interviewRounds: e.target.value }));
          return formSection("Interview Process", [
            formField("Interview Rounds", rounds),
            formCheckbox("Panel Interview", data.panelInterview ?? existing.panelInterview ?? false, v => setData({ panelInterview: v }))
          ]);
        }
      },
      {
        label: "Communication",
        render: ({ data, setData }) => {
          return formSection("Communication", [
            formCheckbox("Automated Email at Each Stage", data.autoEmail ?? existing.autoEmail ?? true, v => setData({ autoEmail: v })),
            formCheckbox("Offer Letter Template", data.offerTemplate ?? existing.offerTemplate ?? true, v => setData({ offerTemplate: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Recruitment", Object.assign({}, ...allData), pushRecruitmentConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 22 — Fleet
// ─────────────────────────────────────────────────────────────
export function renderFleetWizard({ onComplete, onCancel }) {
  const existing = getWizardData("fleetConfig") || {};
  const shell = createWizardShell({
    title: "Fleet",
    subtitle: "Manage vehicles, drivers, services, and contracts",
    icon: "truck",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("fleetConfig", merged);
      addActivityLog({ action: "Fleet completed", module: "Fleet" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Vehicles",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "Car, Van, Truck", value: data.vehicleCategories || existing.vehicleCategories || "" });
          const fuelTypes = formInput({ placeholder: "Petrol, Diesel, Electric, Hybrid", value: data.fuelTypes || existing.fuelTypes || "" });
          categories.addEventListener("input", e => setData({ vehicleCategories: e.target.value }));
          fuelTypes.addEventListener("input", e => setData({ fuelTypes: e.target.value }));
          return formSection("Vehicle Registry", [
            formField("Vehicle Categories", categories, "Comma-separated list"),
            formField("Fuel Types", fuelTypes, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Drivers",
        render: ({ data, setData }) => {
          const policy = formSelect(["Assigned per Vehicle", "Pool - First Available", "Department Based"], data.driverPolicy || existing.driverPolicy || "");
          policy.addEventListener("change", e => setData({ driverPolicy: e.target.value }));
          return formSection("Driver Assignment", [
            formField("Assignment Policy", policy),
            formCheckbox("Licence Tracking", data.licenceTracking ?? existing.licenceTracking ?? true, v => setData({ licenceTracking: v }))
          ]);
        }
      },
      {
        label: "Service",
        render: ({ data, setData }) => {
          const serviceTypes = formInput({ placeholder: "Oil Change, Tyres, Inspection", value: data.serviceTypes || existing.serviceTypes || "" });
          const alertDays = formInput({ type: "number", placeholder: "30", value: data.serviceAlertDays || existing.serviceAlertDays || "" });
          serviceTypes.addEventListener("input", e => setData({ serviceTypes: e.target.value }));
          alertDays.addEventListener("input", e => setData({ serviceAlertDays: e.target.value }));
          return formSection("Service", [
            formField("Service Types", serviceTypes, "Comma-separated list"),
            formField("Service Alert (days before due)", alertDays)
          ]);
        }
      },
      {
        label: "Contracts",
        render: ({ data, setData }) => {
          return formSection("Contracts", [
            formCheckbox("Contract Tracking", data.contractTracking ?? existing.contractTracking ?? true, v => setData({ contractTracking: v })),
            formCheckbox("Insurance Expiry Alerts", data.insuranceAlerts ?? existing.insuranceAlerts ?? true, v => setData({ insuranceAlerts: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Fleet", Object.assign({}, ...allData), pushFleetConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 23 — Events
// ─────────────────────────────────────────────────────────────
export function renderEventsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("eventsConfig") || {};
  const shell = createWizardShell({
    title: "Events",
    subtitle: "Configure event types, registration, and ticketing",
    icon: "calendar",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("eventsConfig", merged);
      addActivityLog({ action: "Events completed", module: "Events" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Types",
        render: ({ data, setData }) => {
          const types = formInput({ placeholder: "Conference, Workshop, Webinar, Training", value: data.eventTypes || existing.eventTypes || "" });
          types.addEventListener("input", e => setData({ eventTypes: e.target.value }));
          return formSection("Event Types", [
            formField("Event Type Names", types, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Registration",
        render: ({ data, setData }) => {
          const capacity = formInput({ type: "number", placeholder: "100", value: data.capacityLimit || existing.capacityLimit || "" });
          capacity.addEventListener("input", e => setData({ capacityLimit: e.target.value }));
          return formSection("Registration", [
            formCheckbox("Online Registration", data.onlineRegistration ?? existing.onlineRegistration ?? true, v => setData({ onlineRegistration: v })),
            formField("Capacity Limit per Event", capacity)
          ]);
        }
      },
      {
        label: "Ticketing",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "Early Bird, Standard, VIP", value: data.ticketCategories || existing.ticketCategories || "" });
          categories.addEventListener("input", e => setData({ ticketCategories: e.target.value }));
          return formSection("Ticketing", [
            formCheckbox("Paid Tickets", data.paidTickets ?? existing.paidTickets ?? false, v => setData({ paidTickets: v })),
            formField("Ticket Categories", categories, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Communication",
        render: ({ data, setData }) => {
          const reminderDays = formInput({ type: "number", placeholder: "3", value: data.reminderDays || existing.reminderDays || "" });
          reminderDays.addEventListener("input", e => setData({ reminderDays: e.target.value }));
          return formSection("Communication", [
            formCheckbox("Confirmation Email", data.confirmEmail ?? existing.confirmEmail ?? true, v => setData({ confirmEmail: v })),
            formField("Reminder Email (days before event)", reminderDays)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Events", Object.assign({}, ...allData), pushEventsConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 24 — Email Marketing
// ─────────────────────────────────────────────────────────────
export function renderEmailMarketingWizard({ onComplete, onCancel }) {
  const existing = getWizardData("emailMarketingConfig") || {};
  const shell = createWizardShell({
    title: "Email Marketing",
    subtitle: "Configure mailing lists, sender identity, and campaigns",
    icon: "mail",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("emailMarketingConfig", merged);
      addActivityLog({ action: "Email Marketing completed", module: "Email Marketing" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Lists",
        render: ({ data, setData }) => {
          const listNames = formInput({ placeholder: "e.g. Newsletter, Promotions, Product Updates", value: data.listNames || existing.listNames || "" });
          const source = formSelect(["Website", "Manual", "Import", "All"], data.subscriptionSource || existing.subscriptionSource || "");
          listNames.addEventListener("input", e => setData({ listNames: e.target.value }));
          source.addEventListener("change", e => setData({ subscriptionSource: e.target.value }));
          return formSection("Mailing Lists", [
            formField("List Names", listNames, "Comma-separated list"),
            formField("Subscription Source", source)
          ]);
        }
      },
      {
        label: "Sender",
        render: ({ data, setData }) => {
          const senderName = formInput({ placeholder: "e.g. Acme Marketing", value: data.senderName || existing.senderName || "" });
          const senderEmail = formInput({ placeholder: "e.g. marketing@acme.com", value: data.senderEmail || existing.senderEmail || "" });
          const replyTo = formInput({ placeholder: "e.g. reply@acme.com", value: data.replyToAddress || existing.replyToAddress || "" });
          senderName.addEventListener("input", e => setData({ senderName: e.target.value }));
          senderEmail.addEventListener("input", e => setData({ senderEmail: e.target.value }));
          replyTo.addEventListener("input", e => setData({ replyToAddress: e.target.value }));
          return formSection("Sender Identity", [
            formField("Sender Name", senderName),
            formField("Sender Email", senderEmail),
            formField("Reply-To Address", replyTo)
          ]);
        }
      },
      {
        label: "Unsubscribe",
        render: ({ data, setData }) => {
          const blacklist = formSelect(["Block all future emails", "Block per list only"], data.blacklistPolicy || existing.blacklistPolicy || "");
          blacklist.addEventListener("change", e => setData({ blacklistPolicy: e.target.value }));
          return formSection("Unsubscribe", [
            formCheckbox("Unsubscribe Link Required (always on)", true, () => {}),
            formField("Blacklist Policy", blacklist)
          ]);
        }
      },
      {
        label: "Campaigns",
        render: ({ data, setData }) => {
          return formSection("Campaigns", [
            formCheckbox("Campaign Tracking", data.campaignTracking ?? existing.campaignTracking ?? true, v => setData({ campaignTracking: v })),
            formCheckbox("UTM Parameters", data.utmParameters ?? existing.utmParameters ?? true, v => setData({ utmParameters: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Email Marketing", Object.assign({}, ...allData), pushEmailMarketingConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 25 — Helpdesk
// ─────────────────────────────────────────────────────────────
export function renderHelpdeskWizard({ onComplete, onCancel }) {
  const existing = getWizardData("helpdeskConfig") || {};
  const shell = createWizardShell({
    title: "Helpdesk",
    subtitle: "Set up support teams, SLA, and communication channels",
    icon: "headphones",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("helpdeskConfig", merged);
      addActivityLog({ action: "Helpdesk completed", module: "Helpdesk" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Teams",
        render: ({ data, setData }) => {
          const teamNames = formInput({ placeholder: "e.g. Technical Support, Billing", value: data.teamNames || existing.teamNames || "" });
          const assignment = formSelect(["Manual", "Random", "Balanced"], data.assignmentMethod || existing.assignmentMethod || "");
          teamNames.addEventListener("input", e => setData({ teamNames: e.target.value }));
          assignment.addEventListener("change", e => setData({ assignmentMethod: e.target.value }));
          return formSection("Helpdesk Teams", [
            formField("Team Names", teamNames, "Comma-separated list"),
            formField("Assignment Method", assignment)
          ]);
        }
      },
      {
        label: "Stages",
        render: ({ data, setData }) => {
          const stages = formInput({ placeholder: "New, In Progress, Waiting on Customer, Resolved, Closed", value: data.ticketStages || existing.ticketStages || "New, In Progress, Waiting on Customer, Resolved, Closed" });
          stages.addEventListener("input", e => setData({ ticketStages: e.target.value }));
          return formSection("Ticket Stages", [
            formField("Stages", stages, "Comma-separated list")
          ]);
        }
      },
      {
        label: "SLA",
        render: ({ data, setData }) => {
          const responseTime = formInput({ type: "number", placeholder: "4", value: data.responseTimeHours || existing.responseTimeHours || "" });
          responseTime.addEventListener("input", e => setData({ responseTimeHours: e.target.value }));
          return formSection("Service Level Agreement", [
            formCheckbox("SLA Enabled", data.slaEnabled ?? existing.slaEnabled ?? true, v => setData({ slaEnabled: v })),
            formField("Response Time (hours) by Priority", responseTime)
          ]);
        }
      },
      {
        label: "Channels",
        render: ({ data, setData }) => {
          return formSection("Support Channels", [
            formCheckbox("Email", data.emailChannel ?? existing.emailChannel ?? true, v => setData({ emailChannel: v })),
            formCheckbox("Website Portal", data.portalChannel ?? existing.portalChannel ?? true, v => setData({ portalChannel: v })),
            formCheckbox("Live Chat", data.liveChatChannel ?? existing.liveChatChannel ?? false, v => setData({ liveChatChannel: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Helpdesk", Object.assign({}, ...allData), pushHelpdeskConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 26 — Payroll
// ─────────────────────────────────────────────────────────────
export function renderPayrollWizard({ onComplete, onCancel }) {
  const existing = getWizardData("payrollConfig") || {};
  const shell = createWizardShell({
    title: "Payroll",
    subtitle: "Configure payroll structures, salary rules, and accounting",
    icon: "dollar-sign",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("payrollConfig", merged);
      addActivityLog({ action: "Payroll completed", module: "Payroll" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Structures",
        render: ({ data, setData }) => {
          const types = formInput({ placeholder: "Monthly, Hourly, Commission", value: data.structureTypes || existing.structureTypes || "" });
          types.addEventListener("input", e => setData({ structureTypes: e.target.value }));
          return formSection("Payroll Structures", [
            formField("Structure Types", types, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Salary Rules",
        render: ({ data, setData }) => {
          return formSection("Salary Rules", [
            formCheckbox("Basic Salary", data.basicSalary ?? existing.basicSalary ?? true, v => setData({ basicSalary: v })),
            formCheckbox("Housing Allowance", data.housingAllowance ?? existing.housingAllowance ?? false, v => setData({ housingAllowance: v })),
            formCheckbox("Transport Allowance", data.transportAllowance ?? existing.transportAllowance ?? false, v => setData({ transportAllowance: v })),
            formCheckbox("Deductions", data.deductions ?? existing.deductions ?? true, v => setData({ deductions: v }))
          ]);
        }
      },
      {
        label: "Schedules",
        render: ({ data, setData }) => {
          const standardHours = formInput({ type: "number", placeholder: "40", value: data.standardHours || existing.standardHours || "" });
          const overtimeMultiplier = formInput({ placeholder: "1.5", value: data.overtimeMultiplier || existing.overtimeMultiplier || "" });
          standardHours.addEventListener("input", e => setData({ standardHours: e.target.value }));
          overtimeMultiplier.addEventListener("input", e => setData({ overtimeMultiplier: e.target.value }));
          return formSection("Work Schedules", [
            formField("Standard Hours per Week", standardHours),
            formField("Overtime Rate Multiplier", overtimeMultiplier)
          ]);
        }
      },
      {
        label: "Accounting",
        render: ({ data, setData }) => {
          const journal = formSelect(getAccountOptions(), data.salaryJournal || existing.salaryJournal || "");
          journal.addEventListener("change", e => setData({ salaryJournal: e.target.value }));
          return formSection("Accounting", [
            formField("Salary Journal", journal),
            formCheckbox("Payslip Accounting Entries", data.payslipEntries ?? existing.payslipEntries ?? true, v => setData({ payslipEntries: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Payroll", Object.assign({}, ...allData), pushPayrollConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 27 — Planning
// ─────────────────────────────────────────────────────────────
export function renderPlanningWizard({ onComplete, onCancel }) {
  const existing = getWizardData("planningConfig") || {};
  const shell = createWizardShell({
    title: "Planning",
    subtitle: "Configure roles, shifts, and shift publication",
    icon: "layout",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("planningConfig", merged);
      addActivityLog({ action: "Planning completed", module: "Planning" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Roles",
        render: ({ data, setData }) => {
          const roleNames = formInput({ placeholder: "e.g. Cashier, Warehouse, Driver", value: data.roleNames || existing.roleNames || "" });
          const colourCoding = formSelect(["Automatic", "Manual per Role"], data.colourCoding || existing.colourCoding || "");
          roleNames.addEventListener("input", e => setData({ roleNames: e.target.value }));
          colourCoding.addEventListener("change", e => setData({ colourCoding: e.target.value }));
          return formSection("Planning Roles", [
            formField("Role Names", roleNames, "Comma-separated list"),
            formField("Colour Coding", colourCoding)
          ]);
        }
      },
      {
        label: "Shifts",
        render: ({ data, setData }) => {
          const duration = formInput({ type: "number", placeholder: "8", value: data.defaultShiftDuration || existing.defaultShiftDuration || "" });
          const openShift = formSelect(["Allow Open Shifts", "Assigned Only"], data.openShiftPolicy || existing.openShiftPolicy || "");
          duration.addEventListener("input", e => setData({ defaultShiftDuration: e.target.value }));
          openShift.addEventListener("change", e => setData({ openShiftPolicy: e.target.value }));
          return formSection("Shifts", [
            formField("Default Shift Duration (hours)", duration),
            formField("Open Shift Policy", openShift)
          ]);
        }
      },
      {
        label: "Publication",
        render: ({ data, setData }) => {
          const noticeDays = formInput({ type: "number", placeholder: "7", value: data.advanceNoticeDays || existing.advanceNoticeDays || "" });
          noticeDays.addEventListener("input", e => setData({ advanceNoticeDays: e.target.value }));
          return formSection("Publication", [
            formCheckbox("Publish Shifts to Employees", data.publishShifts ?? existing.publishShifts ?? true, v => setData({ publishShifts: v })),
            formField("Advance Notice (days)", noticeDays)
          ]);
        }
      },
      {
        label: "Time Off",
        render: ({ data, setData }) => {
          return formSection("Time Off", [
            formCheckbox("Block Planning on Approved Leave", data.blockOnLeave ?? existing.blockOnLeave ?? true, v => setData({ blockOnLeave: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Planning", Object.assign({}, ...allData), pushPlanningConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 28 — Knowledge
// ─────────────────────────────────────────────────────────────
export function renderKnowledgeWizard({ onComplete, onCancel }) {
  const existing = getWizardData("knowledgeConfig") || {};
  const shell = createWizardShell({
    title: "Knowledge",
    subtitle: "Set up knowledge base structure and access rules",
    icon: "book-open",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("knowledgeConfig", merged);
      addActivityLog({ action: "Knowledge completed", module: "Knowledge" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Structure",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "HR, Operations, Finance, Sales, IT", value: data.articleCategories || existing.articleCategories || "" });
          categories.addEventListener("input", e => setData({ articleCategories: e.target.value }));
          return formSection("Knowledge Structure", [
            formField("Top-Level Article Categories", categories, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Access",
        render: ({ data, setData }) => {
          const access = formSelect(["Internal Only", "Customer-Facing", "Both"], data.accessLevel || existing.accessLevel || "");
          access.addEventListener("change", e => setData({ accessLevel: e.target.value }));
          return formSection("Access", [
            formField("Knowledge Base Visibility", access)
          ]);
        }
      },
      {
        label: "Templates",
        render: ({ data, setData }) => {
          const sections = formInput({ placeholder: "e.g. Overview, Steps, FAQ", value: data.standardSections || existing.standardSections || "" });
          sections.addEventListener("input", e => setData({ standardSections: e.target.value }));
          return formSection("Templates", [
            formCheckbox("Default Article Template", data.defaultTemplate ?? existing.defaultTemplate ?? true, v => setData({ defaultTemplate: v })),
            formField("Standard Sections", sections, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Knowledge", Object.assign({}, ...allData), pushKnowledgeConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 29 — Discuss
// ─────────────────────────────────────────────────────────────
export function renderDiscussWizard({ onComplete, onCancel }) {
  const existing = getWizardData("discussConfig") || {};
  const shell = createWizardShell({
    title: "Discuss",
    subtitle: "Configure messaging channels, policies, and notifications",
    icon: "message-circle",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("discussConfig", merged);
      addActivityLog({ action: "Discuss completed", module: "Discuss" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Channels",
        render: ({ data, setData }) => {
          const channels = formInput({ placeholder: "General, Announcements, Sales, Support", value: data.channelNames || existing.channelNames || "" });
          channels.addEventListener("input", e => setData({ channelNames: e.target.value }));
          return formSection("Default Channels", [
            formField("Channel Names", channels, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Policy",
        render: ({ data, setData }) => {
          return formSection("Messaging Policy", [
            formCheckbox("Direct Messages Allowed", data.directMessages ?? existing.directMessages ?? true, v => setData({ directMessages: v })),
            formCheckbox("Guest Access", data.guestAccess ?? existing.guestAccess ?? false, v => setData({ guestAccess: v }))
          ]);
        }
      },
      {
        label: "Notifications",
        render: ({ data, setData }) => {
          return formSection("Notifications", [
            formCheckbox("Email Notifications for Mentions", data.emailMentions ?? existing.emailMentions ?? true, v => setData({ emailMentions: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Discuss", Object.assign({}, ...allData), pushDiscussConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 30 — Outgoing Mail
// ─────────────────────────────────────────────────────────────
export function renderOutgoingMailWizard({ onComplete, onCancel }) {
  const existing = getWizardData("outgoingMailConfig") || {};
  const shell = createWizardShell({
    title: "Outgoing Mail",
    subtitle: "Configure SMTP server and email sender identity",
    icon: "send",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("outgoingMailConfig", merged);
      addActivityLog({ action: "Outgoing Mail completed", module: "Outgoing Mail" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "SMTP",
        render: ({ data, setData }) => {
          const provider = formSelect(["Gmail", "Outlook", "Custom"], data.provider || existing.provider || "");
          const host = formInput({ placeholder: "smtp.gmail.com", value: data.smtpHost || existing.smtpHost || "" });
          const port = formInput({ type: "number", placeholder: "587", value: data.smtpPort || existing.smtpPort || "" });
          const encryption = formSelect(["TLS", "SSL", "None"], data.encryption || existing.encryption || "");
          provider.addEventListener("change", e => setData({ provider: e.target.value }));
          host.addEventListener("input", e => setData({ smtpHost: e.target.value }));
          port.addEventListener("input", e => setData({ smtpPort: e.target.value }));
          encryption.addEventListener("change", e => setData({ encryption: e.target.value }));
          return formSection("SMTP Server", [
            formField("Provider", provider),
            formGrid([formField("SMTP Host", host), formField("Port", port)]),
            formField("Encryption", encryption)
          ]);
        }
      },
      {
        label: "Identity",
        render: ({ data, setData }) => {
          const fromName = formInput({ placeholder: "Acme Corp", value: data.fromName || existing.fromName || "" });
          const fromEmail = formInput({ placeholder: "noreply@acme.com", value: data.fromEmail || existing.fromEmail || "" });
          const replyTo = formInput({ placeholder: "reply@acme.com", value: data.replyToEmail || existing.replyToEmail || "" });
          fromName.addEventListener("input", e => setData({ fromName: e.target.value }));
          fromEmail.addEventListener("input", e => setData({ fromEmail: e.target.value }));
          replyTo.addEventListener("input", e => setData({ replyToEmail: e.target.value }));
          return formSection("Sender Identity", [
            formField("From Name", fromName),
            formField("From Email", fromEmail),
            formField("Reply-To Email", replyTo)
          ]);
        }
      },
      {
        label: "Aliases",
        render: ({ data, setData }) => {
          const aliases = formInput({ placeholder: "sales@, support@, invoices@, jobs@", value: data.aliases || existing.aliases || "" });
          aliases.addEventListener("input", e => setData({ aliases: e.target.value }));
          return formSection("Email Aliases", [
            formField("Alias Addresses", aliases, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Test",
        render: ({ data, setData }) => {
          const testEmail = formInput({ placeholder: "admin@acme.com", value: data.testEmail || existing.testEmail || "" });
          testEmail.addEventListener("input", e => setData({ testEmail: e.target.value }));
          return formSection("Test Configuration", [
            formField("Send Test Email To", testEmail)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Outgoing Mail", Object.assign({}, ...allData), pushOutgoingMailConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 31 — Incoming Mail
// ─────────────────────────────────────────────────────────────
export function renderIncomingMailWizard({ onComplete, onCancel }) {
  const existing = getWizardData("incomingMailConfig") || {};
  const shell = createWizardShell({
    title: "Incoming Mail",
    subtitle: "Configure incoming mail server, catchall, and aliases",
    icon: "inbox",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("incomingMailConfig", merged);
      addActivityLog({ action: "Incoming Mail completed", module: "Incoming Mail" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Server",
        render: ({ data, setData }) => {
          const protocol = formSelect(["IMAP", "POP3"], data.protocol || existing.protocol || "");
          const host = formInput({ placeholder: "imap.gmail.com", value: data.incomingHost || existing.incomingHost || "" });
          const port = formInput({ type: "number", placeholder: "993", value: data.incomingPort || existing.incomingPort || "" });
          protocol.addEventListener("change", e => setData({ protocol: e.target.value }));
          host.addEventListener("input", e => setData({ incomingHost: e.target.value }));
          port.addEventListener("input", e => setData({ incomingPort: e.target.value }));
          return formSection("Incoming Server", [
            formField("Protocol", protocol),
            formGrid([formField("Host", host), formField("Port", port)]),
            formCheckbox("SSL", data.ssl ?? existing.ssl ?? true, v => setData({ ssl: v }))
          ]);
        }
      },
      {
        label: "Catchall",
        render: ({ data, setData }) => {
          const catchall = formInput({ placeholder: "catchall@acme.com", value: data.catchallAddress || existing.catchallAddress || "" });
          const defaultAction = formSelect(["Create Lead", "Create Ticket", "Ignore"], data.defaultAction || existing.defaultAction || "");
          catchall.addEventListener("input", e => setData({ catchallAddress: e.target.value }));
          defaultAction.addEventListener("change", e => setData({ defaultAction: e.target.value }));
          return formSection("Catchall", [
            formField("Catchall Address", catchall),
            formField("Default Action for Unmatched Emails", defaultAction)
          ]);
        }
      },
      {
        label: "Aliases",
        render: ({ data, setData }) => {
          const aliases = formInput({ placeholder: "sales@→CRM, support@→Helpdesk, jobs@→Recruitment", value: data.documentAliases || existing.documentAliases || "" });
          aliases.addEventListener("input", e => setData({ documentAliases: e.target.value }));
          return formSection("Document Aliases", [
            formField("Alias Mappings", aliases, "Format: alias@→Module")
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Incoming Mail", Object.assign({}, ...allData), pushIncomingMailConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 32 — Accounting Reports
// ─────────────────────────────────────────────────────────────
export function renderAccountingReportsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("accountingReportsConfig") || {};
  const shell = createWizardShell({
    title: "Accounting Reports",
    subtitle: "Configure standard and tax reports",
    icon: "bar-chart-2",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("accountingReportsConfig", merged);
      addActivityLog({ action: "Accounting Reports completed", module: "Accounting Reports" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Standard",
        render: ({ data, setData }) => {
          const fyStart = formInput({ type: "date", value: data.fiscalYearStart || existing.fiscalYearStart || "" });
          const fyEnd = formInput({ type: "date", value: data.fiscalYearEnd || existing.fiscalYearEnd || "" });
          fyStart.addEventListener("change", e => setData({ fiscalYearStart: e.target.value }));
          fyEnd.addEventListener("change", e => setData({ fiscalYearEnd: e.target.value }));
          return formSection("Standard Reports (P&L, Balance Sheet, Cash Flow)", [
            formGrid([formField("Fiscal Year Start", fyStart), formField("Fiscal Year End", fyEnd)])
          ]);
        }
      },
      {
        label: "Tax Reports",
        render: ({ data, setData }) => {
          const frequency = formSelect(["Monthly", "Quarterly", "Annual"], data.taxReportFrequency || existing.taxReportFrequency || "");
          frequency.addEventListener("change", e => setData({ taxReportFrequency: e.target.value }));
          return formSection("Tax Reports", [
            formField("VAT/GST Report Frequency", frequency)
          ]);
        }
      },
      {
        label: "Custom",
        render: ({ data, setData }) => {
          const reportName = formInput({ placeholder: "e.g. Management Report", value: data.customReportName || existing.customReportName || "" });
          reportName.addEventListener("input", e => setData({ customReportName: e.target.value }));
          return formSection("Custom Reports", [
            formCheckbox("Custom Report Required", data.customReportRequired ?? existing.customReportRequired ?? false, v => setData({ customReportRequired: v })),
            formField("Report Name", reportName)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Accounting Reports", Object.assign({}, ...allData), pushAccountingReportsConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 33 — Spreadsheet
// ─────────────────────────────────────────────────────────────
export function renderSpreadsheetWizard({ onComplete, onCancel }) {
  const existing = getWizardData("spreadsheetConfig") || {};
  const shell = createWizardShell({
    title: "Spreadsheet",
    subtitle: "Set up spreadsheet templates and data sources",
    icon: "grid",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("spreadsheetConfig", merged);
      addActivityLog({ action: "Spreadsheet completed", module: "Spreadsheet" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Templates",
        render: ({ data, setData }) => {
          const templates = formInput({ placeholder: "Budget, Forecast, KPI Dashboard", value: data.templates || existing.templates || "" });
          templates.addEventListener("input", e => setData({ templates: e.target.value }));
          return formSection("Default Templates", [
            formField("Spreadsheet Templates", templates, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Data Sources",
        render: ({ data, setData }) => {
          const models = formInput({ placeholder: "Sales, Inventory, Accounting", value: data.connectedModels || existing.connectedModels || "" });
          models.addEventListener("input", e => setData({ connectedModels: e.target.value }));
          return formSection("Data Sources", [
            formField("Connected Odoo Models", models, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Access",
        render: ({ data, setData }) => {
          const access = formSelect(["All Users", "Finance Only", "Managers"], data.createAccess || existing.createAccess || "");
          access.addEventListener("change", e => setData({ createAccess: e.target.value }));
          return formSection("Access", [
            formField("Who Can Create Spreadsheets", access)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Spreadsheet", Object.assign({}, ...allData), pushSpreadsheetConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 34 — Live Chat
// ─────────────────────────────────────────────────────────────
export function renderLiveChatWizard({ onComplete, onCancel }) {
  const existing = getWizardData("liveChatConfig") || {};
  const shell = createWizardShell({
    title: "Live Chat",
    subtitle: "Configure live chat channels, chatbot, and widget",
    icon: "message-square",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("liveChatConfig", merged);
      addActivityLog({ action: "Live Chat completed", module: "Live Chat" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Channels",
        render: ({ data, setData }) => {
          const channels = formInput({ placeholder: "e.g. Sales Chat, Support Chat", value: data.chatChannels || existing.chatChannels || "" });
          const operators = formInput({ placeholder: "e.g. John, Jane", value: data.operators || existing.operators || "" });
          channels.addEventListener("input", e => setData({ chatChannels: e.target.value }));
          operators.addEventListener("input", e => setData({ operators: e.target.value }));
          return formSection("Live Chat Channels", [
            formField("Channel Names", channels, "Comma-separated list"),
            formField("Assigned Operators", operators, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Availability",
        render: ({ data, setData }) => {
          const hours = formInput({ placeholder: "e.g. 9:00-17:00", value: data.onlineHours || existing.onlineHours || "" });
          const offlinePolicy = formSelect(["Show contact form", "Hide widget", "Show message"], data.offlinePolicy || existing.offlinePolicy || "");
          hours.addEventListener("input", e => setData({ onlineHours: e.target.value }));
          offlinePolicy.addEventListener("change", e => setData({ offlinePolicy: e.target.value }));
          return formSection("Availability", [
            formField("Online Hours", hours),
            formField("Offline Message Policy", offlinePolicy)
          ]);
        }
      },
      {
        label: "Chatbot",
        render: ({ data, setData }) => {
          const botName = formInput({ placeholder: "e.g. Acme Bot", value: data.chatbotName || existing.chatbotName || "" });
          botName.addEventListener("input", e => setData({ chatbotName: e.target.value }));
          return formSection("Chatbot", [
            formCheckbox("Chatbot Enabled", data.chatbotEnabled ?? existing.chatbotEnabled ?? false, v => setData({ chatbotEnabled: v })),
            formField("Chatbot Name", botName),
            formCheckbox("Fallback to Human", data.fallbackToHuman ?? existing.fallbackToHuman ?? true, v => setData({ fallbackToHuman: v }))
          ]);
        }
      },
      {
        label: "Widget",
        render: ({ data, setData }) => {
          const placement = formSelect(["Bottom Right", "Bottom Left"], data.widgetPlacement || existing.widgetPlacement || "");
          const colour = formInput({ placeholder: "#6366f1", value: data.widgetColour || existing.widgetColour || "" });
          placement.addEventListener("change", e => setData({ widgetPlacement: e.target.value }));
          colour.addEventListener("input", e => setData({ widgetColour: e.target.value }));
          return formSection("Website Widget", [
            formField("Widget Placement", placement),
            formField("Widget Colour", colour)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Live Chat", Object.assign({}, ...allData), pushLiveChatConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 35 — WhatsApp
// ─────────────────────────────────────────────────────────────
export function renderWhatsappWizard({ onComplete, onCancel }) {
  const existing = getWizardData("whatsappConfig") || {};
  const shell = createWizardShell({
    title: "WhatsApp",
    subtitle: "Configure WhatsApp Business integration",
    icon: "smartphone",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("whatsappConfig", merged);
      addActivityLog({ action: "WhatsApp completed", module: "WhatsApp" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Account",
        render: ({ data, setData }) => {
          const phone = formInput({ placeholder: "+1 555 123 4567", value: data.phoneNumber || existing.phoneNumber || "" });
          const displayName = formInput({ placeholder: "Acme Corp", value: data.displayName || existing.displayName || "" });
          phone.addEventListener("input", e => setData({ phoneNumber: e.target.value }));
          displayName.addEventListener("input", e => setData({ displayName: e.target.value }));
          return formSection("WhatsApp Business Account", [
            formField("Phone Number", phone),
            formField("Display Name", displayName)
          ]);
        }
      },
      {
        label: "Templates",
        render: ({ data, setData }) => {
          const templateNames = formInput({ placeholder: "e.g. Order Confirmation, Invoice Reminder", value: data.templateNames || existing.templateNames || "" });
          const categories = formSelect(["Utility", "Marketing", "Both"], data.templateCategories || existing.templateCategories || "");
          templateNames.addEventListener("input", e => setData({ templateNames: e.target.value }));
          categories.addEventListener("change", e => setData({ templateCategories: e.target.value }));
          return formSection("Message Templates", [
            formField("Template Names", templateNames, "Comma-separated list"),
            formField("Template Categories", categories)
          ]);
        }
      },
      {
        label: "Opt-In",
        render: ({ data, setData }) => {
          const method = formSelect(["Website Form", "SMS Keyword", "Manual"], data.optInMethod || existing.optInMethod || "");
          const optOutKeyword = formInput({ placeholder: "STOP", value: data.optOutKeyword || existing.optOutKeyword || "STOP" });
          method.addEventListener("change", e => setData({ optInMethod: e.target.value }));
          optOutKeyword.addEventListener("input", e => setData({ optOutKeyword: e.target.value }));
          return formSection("Opt-In / Opt-Out", [
            formField("Opt-In Collection Method", method),
            formField("Opt-Out Keyword", optOutKeyword)
          ]);
        }
      },
      {
        label: "Triggers",
        render: ({ data, setData }) => {
          return formSection("Event Triggers", [
            formCheckbox("Invoice Sent", data.triggerInvoice ?? existing.triggerInvoice ?? false, v => setData({ triggerInvoice: v })),
            formCheckbox("Order Confirmed", data.triggerOrder ?? existing.triggerOrder ?? false, v => setData({ triggerOrder: v })),
            formCheckbox("Ticket Updated", data.triggerTicket ?? existing.triggerTicket ?? false, v => setData({ triggerTicket: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("WhatsApp", Object.assign({}, ...allData), pushWhatsappConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 36 — SMS Marketing
// ─────────────────────────────────────────────────────────────
export function renderSmsMarketingWizard({ onComplete, onCancel }) {
  const existing = getWizardData("smsMarketingConfig") || {};
  const shell = createWizardShell({
    title: "SMS Marketing",
    subtitle: "Configure SMS provider, sender ID, and campaigns",
    icon: "message-square",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("smsMarketingConfig", merged);
      addActivityLog({ action: "SMS Marketing completed", module: "SMS Marketing" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Provider",
        render: ({ data, setData }) => {
          const provider = formSelect(["Twilio", "Vonage", "Odoo IAP"], data.smsProvider || existing.smsProvider || "");
          provider.addEventListener("change", e => setData({ smsProvider: e.target.value }));
          return formSection("SMS Provider", [
            formField("Provider", provider)
          ]);
        }
      },
      {
        label: "Sender",
        render: ({ data, setData }) => {
          const senderId = formInput({ placeholder: "e.g. ACME or +15551234567", value: data.senderId || existing.senderId || "" });
          senderId.addEventListener("input", e => setData({ senderId: e.target.value }));
          return formSection("Sender ID", [
            formField("Sender Name or Number", senderId)
          ]);
        }
      },
      {
        label: "Opt-Out",
        render: ({ data, setData }) => {
          const optOutKeyword = formInput({ placeholder: "STOP", value: data.optOutKeyword || existing.optOutKeyword || "STOP" });
          optOutKeyword.addEventListener("input", e => setData({ optOutKeyword: e.target.value }));
          return formSection("Opt-Out Compliance", [
            formField("Opt-Out Keyword", optOutKeyword),
            formCheckbox("Compliance Acknowledgement", data.complianceAck ?? existing.complianceAck ?? false, v => setData({ complianceAck: v }))
          ]);
        }
      },
      {
        label: "Campaigns",
        render: ({ data, setData }) => {
          return formSection("Campaigns", [
            formCheckbox("Campaign Tracking", data.campaignTracking ?? existing.campaignTracking ?? true, v => setData({ campaignTracking: v })),
            formCheckbox("List Segmentation", data.listSegmentation ?? existing.listSegmentation ?? false, v => setData({ listSegmentation: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("SMS Marketing", Object.assign({}, ...allData), pushSmsMarketingConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 37 — Calendar
// ─────────────────────────────────────────────────────────────
export function renderCalendarWizard({ onComplete, onCancel }) {
  const existing = getWizardData("calendarConfig") || {};
  const shell = createWizardShell({
    title: "Calendar",
    subtitle: "Configure calendar sync, meeting types, and online booking",
    icon: "calendar",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("calendarConfig", merged);
      addActivityLog({ action: "Calendar completed", module: "Calendar" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Sync",
        render: ({ data, setData }) => {
          const sync = formSelect(["Google Calendar", "Microsoft Outlook", "Both", "None"], data.calendarSync || existing.calendarSync || "");
          sync.addEventListener("change", e => setData({ calendarSync: e.target.value }));
          return formSection("Calendar Sync", [
            formField("Sync With", sync)
          ]);
        }
      },
      {
        label: "Meetings",
        render: ({ data, setData }) => {
          const types = formInput({ placeholder: "Internal, Customer, Demo, Support", value: data.meetingTypes || existing.meetingTypes || "" });
          types.addEventListener("input", e => setData({ meetingTypes: e.target.value }));
          return formSection("Meeting Types", [
            formField("Meeting Type Names", types, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Availability",
        render: ({ data, setData }) => {
          const duration = formInput({ type: "number", placeholder: "30", value: data.defaultDuration || existing.defaultDuration || "" });
          const buffer = formInput({ type: "number", placeholder: "15", value: data.bufferMinutes || existing.bufferMinutes || "" });
          duration.addEventListener("input", e => setData({ defaultDuration: e.target.value }));
          buffer.addEventListener("input", e => setData({ bufferMinutes: e.target.value }));
          return formSection("Availability", [
            formField("Default Meeting Duration (minutes)", duration),
            formField("Buffer Between Meetings (minutes)", buffer)
          ]);
        }
      },
      {
        label: "Booking",
        render: ({ data, setData }) => {
          const bookingUrl = formInput({ placeholder: "e.g. acme.com/book", value: data.bookingUrl || existing.bookingUrl || "" });
          bookingUrl.addEventListener("input", e => setData({ bookingUrl: e.target.value }));
          return formSection("Online Booking", [
            formCheckbox("Customer Self-Booking", data.selfBooking ?? existing.selfBooking ?? false, v => setData({ selfBooking: v })),
            formField("Booking Page URL", bookingUrl)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Calendar", Object.assign({}, ...allData), pushCalendarConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 38 — IoT
// ─────────────────────────────────────────────────────────────
export function renderIotWizard({ onComplete, onCancel }) {
  const existing = getWizardData("iotConfig") || {};
  const shell = createWizardShell({
    title: "IoT",
    subtitle: "Configure IoT boxes and connected devices",
    icon: "wifi",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("iotConfig", merged);
      addActivityLog({ action: "IoT completed", module: "IoT" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "IoT Box",
        render: ({ data, setData }) => {
          const boxCount = formInput({ type: "number", placeholder: "1", value: data.boxCount || existing.boxCount || "" });
          const network = formSelect(["WiFi", "Ethernet", "Both"], data.networkConfig || existing.networkConfig || "");
          boxCount.addEventListener("input", e => setData({ boxCount: e.target.value }));
          network.addEventListener("change", e => setData({ networkConfig: e.target.value }));
          return formSection("IoT Box", [
            formField("Number of IoT Boxes", boxCount),
            formField("Network Configuration", network)
          ]);
        }
      },
      {
        label: "Devices",
        render: ({ data, setData }) => {
          const deviceTypes = formInput({ placeholder: "Printer, Scanner, Scale, Screen, Payment Terminal", value: data.deviceTypes || existing.deviceTypes || "" });
          deviceTypes.addEventListener("input", e => setData({ deviceTypes: e.target.value }));
          return formSection("Connected Devices", [
            formField("Device Types", deviceTypes, "Comma-separated list")
          ]);
        }
      },
      {
        label: "POS",
        render: ({ data, setData }) => {
          return formSection("POS Integration", [
            formCheckbox("Link IoT Devices to POS Terminals", data.posIntegration ?? existing.posIntegration ?? true, v => setData({ posIntegration: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("IoT", Object.assign({}, ...allData), pushIotConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 39 — Studio
// ─────────────────────────────────────────────────────────────
export function renderStudioWizard({ onComplete, onCancel }) {
  const existing = getWizardData("studioConfig") || {};
  const shell = createWizardShell({
    title: "Studio",
    subtitle: "Configure customisation governance and planned modifications",
    icon: "edit-3",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("studioConfig", merged);
      addActivityLog({ action: "Studio completed", module: "Studio" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Governance",
        render: ({ data, setData }) => {
          const policy = formSelect(["Admins Only", "Developers Only", "Both"], data.customFieldPolicy || existing.customFieldPolicy || "");
          policy.addEventListener("change", e => setData({ customFieldPolicy: e.target.value }));
          return formSection("Governance", [
            formField("Who Can Use Studio", policy)
          ]);
        }
      },
      {
        label: "Views",
        render: ({ data, setData }) => {
          const views = formInput({ placeholder: "List, Form, Kanban", value: data.plannedViews || existing.plannedViews || "" });
          views.addEventListener("input", e => setData({ plannedViews: e.target.value }));
          return formSection("Custom Views", [
            formField("Planned View Modifications", views, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Reports",
        render: ({ data, setData }) => {
          const reports = formInput({ placeholder: "e.g. Custom Invoice, Packing Slip", value: data.plannedReports || existing.plannedReports || "" });
          reports.addEventListener("input", e => setData({ plannedReports: e.target.value }));
          return formSection("Custom Reports", [
            formField("Planned Report Customisations", reports, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Studio", Object.assign({}, ...allData), pushStudioConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 40 — Consolidation
// ─────────────────────────────────────────────────────────────
export function renderConsolidationWizard({ onComplete, onCancel }) {
  const existing = getWizardData("consolidationConfig") || {};
  const shell = createWizardShell({
    title: "Consolidation",
    subtitle: "Configure multi-company financial consolidation",
    icon: "layers",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("consolidationConfig", merged);
      addActivityLog({ action: "Consolidation completed", module: "Consolidation" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Companies",
        render: ({ data, setData }) => {
          const companies = formInput({ placeholder: "e.g. Acme US, Acme EU, Acme APAC", value: data.subsidiaries || existing.subsidiaries || "" });
          const ownership = formInput({ placeholder: "e.g. 100, 80, 60", value: data.ownershipPct || existing.ownershipPct || "" });
          companies.addEventListener("input", e => setData({ subsidiaries: e.target.value }));
          ownership.addEventListener("input", e => setData({ ownershipPct: e.target.value }));
          return formSection("Subsidiary Companies", [
            formField("Companies to Consolidate", companies, "Comma-separated list"),
            formField("Ownership Percentage", ownership, "Comma-separated, matching order")
          ]);
        }
      },
      {
        label: "Periods",
        render: ({ data, setData }) => {
          const period = formSelect(["Monthly", "Quarterly", "Annual"], data.consolidationPeriod || existing.consolidationPeriod || "");
          period.addEventListener("change", e => setData({ consolidationPeriod: e.target.value }));
          return formSection("Consolidation Periods", [
            formField("Consolidation Period", period)
          ]);
        }
      },
      {
        label: "Elimination",
        render: ({ data, setData }) => {
          return formSection("Intercompany Elimination", [
            formCheckbox("Intercompany Elimination Rules", data.eliminationRules ?? existing.eliminationRules ?? true, v => setData({ eliminationRules: v }))
          ]);
        }
      },
      {
        label: "Currency",
        render: ({ data, setData }) => {
          const currency = formSelect(["USD", "EUR", "GBP", "AUD", "CAD"], data.consolidationCurrency || existing.consolidationCurrency || getDefaultCurrency());
          const method = formSelect(["Closing Rate", "Average Rate", "Historical Rate"], data.exchangeRateMethod || existing.exchangeRateMethod || "");
          currency.addEventListener("change", e => setData({ consolidationCurrency: e.target.value }));
          method.addEventListener("change", e => setData({ exchangeRateMethod: e.target.value }));
          return formSection("Currency", [
            formField("Consolidation Currency", currency),
            formField("Exchange Rate Method", method)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Consolidation", Object.assign({}, ...allData), pushConsolidationConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 41 — Lunch
// ─────────────────────────────────────────────────────────────
export function renderLunchWizard({ onComplete, onCancel }) {
  const existing = getWizardData("lunchConfig") || {};
  const shell = createWizardShell({
    title: "Lunch",
    subtitle: "Configure lunch suppliers, products, and employee access",
    icon: "coffee",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("lunchConfig", merged);
      addActivityLog({ action: "Lunch completed", module: "Lunch" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Suppliers",
        render: ({ data, setData }) => {
          const suppliers = formInput({ placeholder: "e.g. Joe's Deli, Pizza Palace", value: data.supplierNames || existing.supplierNames || "" });
          const deliveryDays = formInput({ placeholder: "e.g. Mon-Fri", value: data.deliveryDays || existing.deliveryDays || "" });
          const deadline = formInput({ placeholder: "e.g. 10:30", value: data.orderDeadline || existing.orderDeadline || "" });
          suppliers.addEventListener("input", e => setData({ supplierNames: e.target.value }));
          deliveryDays.addEventListener("input", e => setData({ deliveryDays: e.target.value }));
          deadline.addEventListener("input", e => setData({ orderDeadline: e.target.value }));
          return formSection("Lunch Suppliers", [
            formField("Supplier Names", suppliers, "Comma-separated list"),
            formGrid([formField("Delivery Days", deliveryDays), formField("Order Deadline Time", deadline)])
          ]);
        }
      },
      {
        label: "Products",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "e.g. Sandwich, Salad, Hot Meal, Drink", value: data.productCategories || existing.productCategories || "" });
          const priceRange = formInput({ placeholder: "e.g. 5-15", value: data.priceRange || existing.priceRange || "" });
          categories.addEventListener("input", e => setData({ productCategories: e.target.value }));
          priceRange.addEventListener("input", e => setData({ priceRange: e.target.value }));
          return formSection("Products", [
            formField("Product Categories", categories, "Comma-separated list"),
            formField("Price Range", priceRange)
          ]);
        }
      },
      {
        label: "Cash Moves",
        render: ({ data, setData }) => {
          const topUp = formInput({ placeholder: "e.g. 50", value: data.walletTopUp || existing.walletTopUp || "" });
          topUp.addEventListener("input", e => setData({ walletTopUp: e.target.value }));
          return formSection("Cash Moves", [
            formCheckbox("Cash Move Tracking", data.cashMoveTracking ?? existing.cashMoveTracking ?? true, v => setData({ cashMoveTracking: v })),
            formField("Employee Wallet Top-Up Amount", topUp)
          ]);
        }
      },
      {
        label: "Access",
        render: ({ data, setData }) => {
          const access = formSelect(["All Employees", "Selected Departments", "Selected Employees"], data.lunchAccess || existing.lunchAccess || "");
          access.addEventListener("change", e => setData({ lunchAccess: e.target.value }));
          return formSection("Access", [
            formField("Lunch Access", access)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Lunch", Object.assign({}, ...allData), pushLunchConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 42 — Referrals
// ─────────────────────────────────────────────────────────────
export function renderReferralsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("referralsConfig") || {};
  const shell = createWizardShell({
    title: "Referrals",
    subtitle: "Configure employee referral programme and rewards",
    icon: "share-2",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("referralsConfig", merged);
      addActivityLog({ action: "Referrals completed", module: "Referrals" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Programme",
        render: ({ data, setData }) => {
          const name = formInput({ placeholder: "e.g. Refer a Friend", value: data.programmeName || existing.programmeName || "" });
          const eligible = formSelect(["All Employees", "Managers Only", "Selected Departments"], data.eligibleEmployees || existing.eligibleEmployees || "");
          name.addEventListener("input", e => setData({ programmeName: e.target.value }));
          eligible.addEventListener("change", e => setData({ eligibleEmployees: e.target.value }));
          return formSection("Referral Programme", [
            formField("Programme Name", name),
            formField("Eligible Employees", eligible)
          ]);
        }
      },
      {
        label: "Rewards",
        render: ({ data, setData }) => {
          const rewardType = formSelect(["Cash", "Gift", "Points"], data.rewardType || existing.rewardType || "");
          const amount = formInput({ placeholder: "e.g. 500", value: data.rewardAmount || existing.rewardAmount || "" });
          rewardType.addEventListener("change", e => setData({ rewardType: e.target.value }));
          amount.addEventListener("input", e => setData({ rewardAmount: e.target.value }));
          return formSection("Rewards", [
            formField("Reward Type", rewardType),
            formField("Reward Amount per Hired Referral", amount)
          ]);
        }
      },
      {
        label: "Stages",
        render: ({ data, setData }) => {
          const triggerStage = formSelect(["Hired", "Offer Accepted", "Probation Complete"], data.triggerStage || existing.triggerStage || "");
          triggerStage.addEventListener("change", e => setData({ triggerStage: e.target.value }));
          return formSection("Reward Trigger", [
            formField("Stage That Triggers Reward", triggerStage)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Referrals", Object.assign({}, ...allData), pushReferralsConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 43 — Loyalty / Gift Cards
// ─────────────────────────────────────────────────────────────
export function renderLoyaltyWizard({ onComplete, onCancel }) {
  const existing = getWizardData("loyaltyConfig") || {};
  const shell = createWizardShell({
    title: "Loyalty & Gift Cards",
    subtitle: "Configure loyalty programmes, points, and rewards",
    icon: "gift",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("loyaltyConfig", merged);
      addActivityLog({ action: "Loyalty completed", module: "Loyalty" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Programme",
        render: ({ data, setData }) => {
          const type = formSelect(["Loyalty Points", "Gift Cards", "Both"], data.programmeType || existing.programmeType || "");
          type.addEventListener("change", e => setData({ programmeType: e.target.value }));
          return formSection("Programme Type", [
            formField("Programme Type", type)
          ]);
        }
      },
      {
        label: "Points",
        render: ({ data, setData }) => {
          const pointsPerCurrency = formInput({ type: "number", placeholder: "1", value: data.pointsPerCurrency || existing.pointsPerCurrency || "" });
          const minSpend = formInput({ type: "number", placeholder: "10", value: data.minimumSpend || existing.minimumSpend || "" });
          pointsPerCurrency.addEventListener("input", e => setData({ pointsPerCurrency: e.target.value }));
          minSpend.addEventListener("input", e => setData({ minimumSpend: e.target.value }));
          return formSection("Points Rules", [
            formField("Points Earned per Currency Spent", pointsPerCurrency),
            formField("Minimum Spend", minSpend)
          ]);
        }
      },
      {
        label: "Rewards",
        render: ({ data, setData }) => {
          const rewardTypes = formInput({ placeholder: "Discount, Free Product, Gift Card", value: data.rewardTypes || existing.rewardTypes || "" });
          rewardTypes.addEventListener("input", e => setData({ rewardTypes: e.target.value }));
          return formSection("Rewards", [
            formField("Reward Types", rewardTypes, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Expiry",
        render: ({ data, setData }) => {
          const expiryMonths = formInput({ type: "number", placeholder: "12", value: data.expiryMonths || existing.expiryMonths || "" });
          expiryMonths.addEventListener("input", e => setData({ expiryMonths: e.target.value }));
          return formSection("Expiry", [
            formCheckbox("Points Expiry", data.pointsExpiry ?? existing.pointsExpiry ?? false, v => setData({ pointsExpiry: v })),
            formField("Expiry (months)", expiryMonths)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Loyalty & Gift Cards", Object.assign({}, ...allData), pushLoyaltyConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 44 — Appraisals
// ─────────────────────────────────────────────────────────────
export function renderAppraisalsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("appraisalsConfig") || {};
  const shell = createWizardShell({
    title: "Appraisals",
    subtitle: "Configure appraisal cycles, goals, and feedback",
    icon: "star",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("appraisalsConfig", merged);
      addActivityLog({ action: "Appraisals completed", module: "Appraisals" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Cycle",
        render: ({ data, setData }) => {
          const frequency = formSelect(["Monthly", "Quarterly", "Bi-Annual", "Annual"], data.appraisalFrequency || existing.appraisalFrequency || "");
          frequency.addEventListener("change", e => setData({ appraisalFrequency: e.target.value }));
          return formSection("Appraisal Cycle", [
            formField("Appraisal Frequency", frequency)
          ]);
        }
      },
      {
        label: "Goals",
        render: ({ data, setData }) => {
          const goalCategories = formInput({ placeholder: "e.g. Performance, Development, Leadership", value: data.goalCategories || existing.goalCategories || "" });
          goalCategories.addEventListener("input", e => setData({ goalCategories: e.target.value }));
          return formSection("Goals", [
            formCheckbox("Goal Setting Required", data.goalSetting ?? existing.goalSetting ?? true, v => setData({ goalSetting: v })),
            formField("Goal Categories", goalCategories, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Rating",
        render: ({ data, setData }) => {
          const labels = formInput({ placeholder: "Exceptional, Good, Meets Expectations, Needs Improvement", value: data.ratingLabels || existing.ratingLabels || "Exceptional, Good, Meets Expectations, Needs Improvement" });
          labels.addEventListener("input", e => setData({ ratingLabels: e.target.value }));
          return formSection("Rating Scale", [
            formField("Rating Labels", labels, "Comma-separated list")
          ]);
        }
      },
      {
        label: "360 Feedback",
        render: ({ data, setData }) => {
          return formSection("360 Feedback", [
            formCheckbox("Peer Feedback", data.peerFeedback ?? existing.peerFeedback ?? false, v => setData({ peerFeedback: v })),
            formCheckbox("Self-Assessment", data.selfAssessment ?? existing.selfAssessment ?? true, v => setData({ selfAssessment: v }))
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Appraisals", Object.assign({}, ...allData), pushAppraisalsConfig)
      }
    ]
  });
  return shell.render();
}

// ─────────────────────────────────────────────────────────────
// WIZARD 45 — VoIP
// ─────────────────────────────────────────────────────────────
export function renderVoipWizard({ onComplete, onCancel }) {
  const existing = getWizardData("voipConfig") || {};
  const shell = createWizardShell({
    title: "VoIP",
    subtitle: "Configure VoIP provider, extensions, and call logging",
    icon: "phone",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("voipConfig", merged);
      addActivityLog({ action: "VoIP completed", module: "VoIP" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Provider",
        render: ({ data, setData }) => {
          const provider = formSelect(["Axivox", "Twilio", "OnSIP", "Other"], data.voipProvider || existing.voipProvider || "");
          const sipDomain = formInput({ placeholder: "e.g. sip.acme.com", value: data.sipDomain || existing.sipDomain || "" });
          provider.addEventListener("change", e => setData({ voipProvider: e.target.value }));
          sipDomain.addEventListener("input", e => setData({ sipDomain: e.target.value }));
          return formSection("VoIP Provider", [
            formField("Provider", provider),
            formField("SIP Domain", sipDomain)
          ]);
        }
      },
      {
        label: "Extensions",
        render: ({ data, setData }) => {
          const format = formInput({ placeholder: "e.g. 1000-1999", value: data.extensionFormat || existing.extensionFormat || "" });
          format.addEventListener("input", e => setData({ extensionFormat: e.target.value }));
          return formSection("Extensions", [
            formField("Extension Numbering Format", format),
            formCheckbox("Auto-Assign Extensions", data.autoAssign ?? existing.autoAssign ?? true, v => setData({ autoAssign: v }))
          ]);
        }
      },
      {
        label: "Call Logging",
        render: ({ data, setData }) => {
          return formSection("Call Logging", [
            formCheckbox("Log Calls to CRM", data.logToCrm ?? existing.logToCrm ?? true, v => setData({ logToCrm: v })),
            formCheckbox("Log Calls to Helpdesk", data.logToHelpdesk ?? existing.logToHelpdesk ?? false, v => setData({ logToHelpdesk: v }))
          ]);
        }
      },
      {
        label: "Voicemail",
        render: ({ data, setData }) => {
          const greeting = formInput({ placeholder: "e.g. Thank you for calling Acme...", value: data.greetingMessage || existing.greetingMessage || "" });
          greeting.addEventListener("input", e => setData({ greetingMessage: e.target.value }));
          return formSection("Voicemail", [
            formCheckbox("Voicemail to Email", data.voicemailToEmail ?? existing.voicemailToEmail ?? true, v => setData({ voicemailToEmail: v })),
            formField("Greeting Message", greeting)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("VoIP", Object.assign({}, ...allData), pushVoipConfig)
      }
    ]
  });
  return shell.render();
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WIZARD 46 â€” Master Data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function renderMasterDataWizard({ onComplete, onCancel }) {
  const existing = getWizardData("masterDataConfig") || {};
  const shell = createWizardShell({
    title: "Master Data",
    subtitle: "Configure foundational products, contacts, and prices",
    icon: "database",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("masterDataConfig", merged);
      addActivityLog({ action: "Master Data completed", module: "Master Data" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Products",
        render: ({ data, setData }) => {
          const categories = formInput({ placeholder: "Finished Goods, Components, Services", value: data.productCategories || existing.productCategories || "" });
          const units = formInput({ placeholder: "Units, Dozens, Kilograms", value: data.unitMeasures || existing.unitMeasures || "" });
          categories.addEventListener("input", e => setData({ productCategories: e.target.value }));
          units.addEventListener("input", e => setData({ unitMeasures: e.target.value }));
          return formSection("Products", [
            formField("Product Categories", categories, "Comma-separated list"),
            formField("Units of Measure", units, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Contacts",
        render: ({ data, setData }) => {
          const contactType = formSelect(["Customer", "Vendor", "Both"], data.contactType || existing.contactType || "");
          const addressFormat = formInput({ placeholder: "Company, Street, City, Country", value: data.addressFormat || existing.addressFormat || "" });
          contactType.addEventListener("change", e => setData({ contactType: e.target.value }));
          addressFormat.addEventListener("input", e => setData({ addressFormat: e.target.value }));
          return formSection("Contacts", [
            formField("Default Contact Type", contactType),
            formField("Address Format", addressFormat, "Describe the format to apply (line order, separators, etc.)")
          ]);
        }
      },
      {
        label: "Pricelists",
        render: ({ data, setData }) => {
          const multiplePricelists = formSelect(["Yes", "No"], data.multiplePricelists || existing.multiplePricelists || "");
          const currencyNotes = formInput({ placeholder: "Retail: USD / Wholesale: EUR", value: data.pricelistCurrencies || existing.pricelistCurrencies || "" });
          multiplePricelists.addEventListener("change", e => setData({ multiplePricelists: e.target.value }));
          currencyNotes.addEventListener("input", e => setData({ pricelistCurrencies: e.target.value }));
          return formSection("Pricelists", [
            formField("Multiple Pricelists", multiplePricelists),
            formField("Currency per Pricelist", currencyNotes)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Master Data", Object.assign({}, ...allData), pushMasterDataConfig)
      }
    ]
  });
  return shell.render();
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WIZARD 47 â€” Product Lifecycle (PLM)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function renderPlmWizard({ onComplete, onCancel }) {
  const existing = getWizardData("plmConfig") || {};
  const shell = createWizardShell({
    title: "PLM",
    subtitle: "Capture ECO types, approvals, and BOM linkage",
    icon: "git-branch",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("plmConfig", merged);
      addActivityLog({ action: "PLM completed", module: "PLM" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "ECO Types",
        render: ({ data, setData }) => {
          const types = formInput({ placeholder: "Prototype, Production, Fast Track", value: data.ecoTypes || existing.ecoTypes || "" });
          const approvalLevels = formInput({ placeholder: "Level 1 â€” Engineering Manager", value: data.approvalLevels || existing.approvalLevels || "" });
          types.addEventListener("input", e => setData({ ecoTypes: e.target.value }));
          approvalLevels.addEventListener("input", e => setData({ approvalLevels: e.target.value }));
          return formSection("Engineering Change Order Types", [
            formField("Type Names", types, "Comma-separated list"),
            formField("Approval Levels", approvalLevels)
          ]);
        }
      },
      {
        label: "Approval",
        render: ({ data, setData }) => {
          const approverRoles = formInput({ placeholder: "Engineering Lead, Quality Manager", value: data.approverRoles || existing.approverRoles || "" });
          const approvalStages = formInput({ placeholder: "Draft â†’ Technical Review â†’ Approved", value: data.approvalStages || existing.approvalStages || "" });
          approverRoles.addEventListener("input", e => setData({ approverRoles: e.target.value }));
          approvalStages.addEventListener("input", e => setData({ approvalStages: e.target.value }));
          return formSection("Approval Flow", [
            formField("Approver Roles", approverRoles),
            formField("Approval Stages", approvalStages)
          ]);
        }
      },
      {
        label: "BOM Integration",
        render: ({ data, setData }) => {
          const linkToBom = formSelect(["Yes", "No"], data.linkToBom || existing.linkToBom || "");
          linkToBom.addEventListener("change", e => setData({ linkToBom: e.target.value }));
          return formSection("Bill of Materials Integration", [
            formField("Link ECOs to BOMs", linkToBom)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("PLM", Object.assign({}, ...allData), pushPlmConfig)
      }
    ]
  });
  return shell.render();
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WIZARD 48 â€” Quality
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function renderQualityWizard({ onComplete, onCancel }) {
  const existing = getWizardData("qualityConfig") || {};
  const shell = createWizardShell({
    title: "Quality",
    subtitle: "Define control points, failure reasons, and alerts",
    icon: "shield-check",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("qualityConfig", merged);
      addActivityLog({ action: "Quality completed", module: "Quality" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Control Points",
        render: ({ data, setData }) => {
          const controlPoints = formInput({ placeholder: "Receipt - Supplier A, Manufacturing - Line 1", value: data.controlPoints || existing.controlPoints || "" });
          controlPoints.addEventListener("input", e => setData({ controlPoints: e.target.value }));
          return formSection("Quality Control Points", [
            formField("Control Points", controlPoints, "List by process: Receipt, Manufacturing, Delivery, etc.")
          ]);
        }
      },
      {
        label: "Failure Reasons",
        render: ({ data, setData }) => {
          const failureReasons = formInput({ placeholder: "Damaged Packaging, Missing Parts", value: data.failureReasons || existing.failureReasons || "" });
          failureReasons.addEventListener("input", e => setData({ failureReasons: e.target.value }));
          return formSection("Failure Reasons", [
            formField("Reason Categories", failureReasons, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Alerts",
        render: ({ data, setData }) => {
          const alertWorkflow = formInput({ placeholder: "Notify Quality Team, escalate after 24h", value: data.alertWorkflow || existing.alertWorkflow || "" });
          const responsibleTeam = formInput({ placeholder: "Quality Team / Manufacturing Lead", value: data.responsibleTeam || existing.responsibleTeam || "" });
          alertWorkflow.addEventListener("input", e => setData({ alertWorkflow: e.target.value }));
          responsibleTeam.addEventListener("input", e => setData({ responsibleTeam: e.target.value }));
          return formSection("Alerts", [
            formField("Alert Workflow", alertWorkflow),
            formField("Responsible Team", responsibleTeam)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Quality", Object.assign({}, ...allData), pushQualityConfig)
      }
    ]
  });
  return shell.render();
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WIZARD 49 â€” Documents
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function renderDocumentsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("documentsConfig") || {};
  const shell = createWizardShell({
    title: "Documents",
    subtitle: "Plan workspace structure, access, and tags",
    icon: "folder",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("documentsConfig", merged);
      addActivityLog({ action: "Documents completed", module: "Documents" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Workspace Structure",
        render: ({ data, setData }) => {
          const workspaces = formInput({ placeholder: "HR, Finance, Legal, Operations", value: data.workspaceNames || existing.workspaceNames || "" });
          workspaces.addEventListener("input", e => setData({ workspaceNames: e.target.value }));
          return formSection("Workspace Structure", [
            formField("Top-Level Workspace Names", workspaces, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Access Rights",
        render: ({ data, setData }) => {
          const access = formSelect(["All Employees", "Internal Users", "Managers Only"], data.workspaceAccess || existing.workspaceAccess || "");
          const accessNotes = formInput({ placeholder: "HR: Managers only, Finance: Controllers", value: data.accessNotes || existing.accessNotes || "" });
          access.addEventListener("change", e => setData({ workspaceAccess: e.target.value }));
          accessNotes.addEventListener("input", e => setData({ accessNotes: e.target.value }));
          return formSection("Access Rights", [
            formField("Default Access Level", access),
            formField("Access Notes", accessNotes, "Describe workspace-specific exceptions")
          ]);
        }
      },
      {
        label: "Tags",
        render: ({ data, setData }) => {
          const tags = formInput({ placeholder: "Contracts, Policies, Templates", value: data.documentTags || existing.documentTags || "" });
          tags.addEventListener("input", e => setData({ documentTags: e.target.value }));
          return formSection("Document Tags", [
            formField("Tag Categories", tags, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Documents", Object.assign({}, ...allData), pushDocumentsConfig)
      }
    ]
  });
  return shell.render();
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WIZARD 50 â€” Sign
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function renderSignWizard({ onComplete, onCancel }) {
  const existing = getWizardData("signConfig") || {};
  const shell = createWizardShell({
    title: "Sign",
    subtitle: "Define templates, signatories, and reminders",
    icon: "pen-tool",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("signConfig", merged);
      addActivityLog({ action: "Sign completed", module: "Sign" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Templates",
        render: ({ data, setData }) => {
          const templates = formInput({ placeholder: "NDA, Employment Contract", value: data.templateNames || existing.templateNames || "" });
          const documentTypes = formInput({ placeholder: "Sales, HR, Operations", value: data.documentTypes || existing.documentTypes || "" });
          templates.addEventListener("input", e => setData({ templateNames: e.target.value }));
          documentTypes.addEventListener("input", e => setData({ documentTypes: e.target.value }));
          return formSection("Templates", [
            formField("Template Names", templates, "Comma-separated list"),
            formField("Document Types", documentTypes)
          ]);
        }
      },
      {
        label: "Signatories",
        render: ({ data, setData }) => {
          const roles = formInput({ placeholder: "Customer, Employee, Manager, Witness", value: data.signatoryRoles || existing.signatoryRoles || "" });
          roles.addEventListener("input", e => setData({ signatoryRoles: e.target.value }));
          return formSection("Signatories", [
            formField("Signatory Roles", roles)
          ]);
        }
      },
      {
        label: "Reminders",
        render: ({ data, setData }) => {
          const reminderDays = formInput({ type: "number", placeholder: "3", value: data.reminderDays || existing.reminderDays || "" });
          reminderDays.addEventListener("input", e => setData({ reminderDays: e.target.value }));
          return formSection("Reminders", [
            formCheckbox("Send Automatic Reminders", data.automaticReminder ?? existing.automaticReminder ?? true, v => setData({ automaticReminder: v })),
            formField("Reminder Days Before Expiry", reminderDays)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Sign", Object.assign({}, ...allData), pushSignConfig)
      }
    ]
  });
  return shell.render();
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WIZARD 51 â€” Approvals
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function renderApprovalsWizard({ onComplete, onCancel }) {
  const existing = getWizardData("approvalsConfig") || {};
  const shell = createWizardShell({
    title: "Approvals",
    subtitle: "Map approval types, approvers, and escalation",
    icon: "check-circle",
    onComplete: (data) => {
      const merged = Object.assign({}, ...data);
      setWizardData("approvalsConfig", merged);
      addActivityLog({ action: "Approvals completed", module: "Approvals" });
      onComplete(merged);
    },
    onCancel,
    steps: [
      {
        label: "Approval Types",
        render: ({ data, setData }) => {
          const approvalTypes = formInput({ placeholder: "Purchase, HR, IT, Travel", value: data.approvalTypes || existing.approvalTypes || "" });
          approvalTypes.addEventListener("input", e => setData({ approvalTypes: e.target.value }));
          return formSection("Approval Types", [
            formField("Approval Categories", approvalTypes, "Comma-separated list")
          ]);
        }
      },
      {
        label: "Approvers",
        render: ({ data, setData }) => {
          const approverAssignments = formInput({ placeholder: "Purchase â€” CFO, HR â€” People Director", value: data.approverAssignments || existing.approverAssignments || "" });
          approverAssignments.addEventListener("input", e => setData({ approverAssignments: e.target.value }));
          return formSection("Approvers", [
            formField("Approver Assignment per Category", approverAssignments)
          ]);
        }
      },
      {
        label: "Escalation",
        render: ({ data, setData }) => {
          const escalationPolicy = formInput({ placeholder: "Escalate to COO after 3 days", value: data.escalationPolicy || existing.escalationPolicy || "" });
          const maxDays = formInput({ type: "number", placeholder: "3", value: data.maximumWaitDays || existing.maximumWaitDays || "" });
          escalationPolicy.addEventListener("input", e => setData({ escalationPolicy: e.target.value }));
          maxDays.addEventListener("input", e => setData({ maximumWaitDays: e.target.value }));
          return formSection("Escalation", [
            formField("Escalation Policy", escalationPolicy),
            formField("Maximum Wait Days", maxDays)
          ]);
        }
      },
      {
        label: "Review",
        render: ({ allData }) => pushSummaryStep("Approvals", Object.assign({}, ...allData), pushApprovalsConfig)
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
    "company-setup":           () => renderCompanySetupWizard(props),
    "master-data-setup":       () => renderMasterDataWizard(props),
    "users-access":            () => renderUsersAccessWizard(props),
    "chart-of-accounts":       () => renderChartOfAccountsWizard(props),
    "sales-setup":             () => renderSalesConfigWizard(props),
    "crm-setup":               () => renderCrmConfigWizard(props),
    "inventory-setup":         () => renderInventoryConfigWizard(props),
    "accounting-setup":        () => renderAccountingConfigWizard(props),
    "purchase-setup":          () => renderPurchaseConfigWizard(props),
    "manufacturing-setup":     () => renderManufacturingConfigWizard(props),
    "plm-setup":               () => renderPlmWizard(props),
    "quality-setup":           () => renderQualityWizard(props),
    "hr-setup":                () => renderHrPayrollWizard(props),
    "website-setup":           () => renderWebsiteEcommerceWizard(props),
    "pos-setup":               () => renderPosWizard(props),
    "field-service-setup":     () => renderFieldServiceWizard(props),
    "maintenance-setup":       () => renderMaintenanceWizard(props),
    "rental-setup":            () => renderRentalWizard(props),
    "repairs-setup":           () => renderRepairsWizard(props),
    "subscriptions-setup":     () => renderSubscriptionsWizard(props),
    "timesheets-setup":        () => renderTimesheetsWizard(props),
    "expenses-setup":          () => renderExpensesWizard(props),
    "attendance-setup":        () => renderAttendanceWizard(props),
    "recruitment-setup":       () => renderRecruitmentWizard(props),
    "fleet-setup":             () => renderFleetWizard(props),
    "events-setup":            () => renderEventsWizard(props),
    "email-marketing-setup":   () => renderEmailMarketingWizard(props),
    "helpdesk-setup":          () => renderHelpdeskWizard(props),
    "payroll-setup":           () => renderPayrollWizard(props),
    "planning-setup":          () => renderPlanningWizard(props),
    "approvals-setup":         () => renderApprovalsWizard(props),
    "knowledge-setup":         () => renderKnowledgeWizard(props),
    "documents-setup":         () => renderDocumentsWizard(props),
    "sign-setup":              () => renderSignWizard(props),
    "discuss-setup":           () => renderDiscussWizard(props),
    "outgoing-mail-setup":     () => renderOutgoingMailWizard(props),
    "incoming-mail-setup":     () => renderIncomingMailWizard(props),
    "accounting-reports-setup": () => renderAccountingReportsWizard(props),
    "spreadsheet-setup":       () => renderSpreadsheetWizard(props),
    "live-chat-setup":         () => renderLiveChatWizard(props),
    "whatsapp-setup":          () => renderWhatsappWizard(props),
    "sms-marketing-setup":     () => renderSmsMarketingWizard(props),
    "calendar-setup":          () => renderCalendarWizard(props),
    "iot-setup":               () => renderIotWizard(props),
    "studio-setup":            () => renderStudioWizard(props),
    "consolidation-setup":     () => renderConsolidationWizard(props),
    "lunch-setup":             () => renderLunchWizard(props),
    "referrals-setup":         () => renderReferralsWizard(props),
    "loyalty-setup":           () => renderLoyaltyWizard(props),
    "appraisals-setup":        () => renderAppraisalsWizard(props),
    "voip-setup":              () => renderVoipWizard(props)
  };

  if (!wizardId || !WIZARD_MAP[wizardId]) {
    return renderWizardLauncher(onNavigate);
  }

  return WIZARD_MAP[wizardId]();
}

function renderWizardLauncher(onNavigate) {
  const WIZARD_CARDS = [
    { id: "company-setup",           label: "Company Setup",       icon: "building-2",       desc: "Name, address, currency, fiscal year" },
    { id: "master-data-setup",       label: "Master Data",         icon: "database",         desc: "Products, contacts, pricelists" },
    { id: "users-access",            label: "Users & Access",      icon: "users",            desc: "Add team members and roles" },
    { id: "chart-of-accounts",       label: "Chart of Accounts",   icon: "landmark",         desc: "Load standard accounts for your country" },
    { id: "sales-setup",             label: "Sales",               icon: "tag",              desc: "Teams, pricelists, payment terms" },
    { id: "crm-setup",               label: "CRM",                 icon: "target",           desc: "Pipeline stages, lead sources" },
    { id: "inventory-setup",         label: "Inventory",           icon: "package",          desc: "Warehouses, locations, routes" },
    { id: "accounting-setup",        label: "Accounting",          icon: "calculator",       desc: "Banks, journals, taxes" },
    { id: "purchase-setup",          label: "Purchase",            icon: "shopping-cart",    desc: "PO rules, approval workflows" },
    { id: "manufacturing-setup",     label: "Manufacturing",       icon: "factory",          desc: "Workcenters, BOM routes" },
    { id: "plm-setup",               label: "PLM",                 icon: "git-branch",       desc: "ECO types, approvals, BOM link" },
    { id: "quality-setup",           label: "Quality",             icon: "shield-check",     desc: "Control points, failures, alerts" },
    { id: "hr-setup",                label: "HR & Payroll",        icon: "user-check",       desc: "Departments, positions, payroll" },
    { id: "website-setup",           label: "Website",             icon: "globe",            desc: "Online store, payment providers" },
    { id: "pos-setup",               label: "Point of Sale",       icon: "monitor",          desc: "POS terminals, payment methods" },
    { id: "field-service-setup",     label: "Field Service",       icon: "wrench",           desc: "Service teams, tasks, equipment" },
    { id: "maintenance-setup",       label: "Maintenance",         icon: "settings",         desc: "Equipment, preventive & corrective" },
    { id: "rental-setup",            label: "Rental",              icon: "key",              desc: "Rental products, pricing, returns" },
    { id: "repairs-setup",           label: "Repairs",             icon: "tool",             desc: "Repair workflows, parts, warranty" },
    { id: "subscriptions-setup",     label: "Subscriptions",       icon: "repeat",           desc: "Plans, renewals, churn tracking" },
    { id: "timesheets-setup",        label: "Timesheets",          icon: "clock",            desc: "Policies, approval, invoicing" },
    { id: "expenses-setup",          label: "Expenses",            icon: "receipt",          desc: "Categories, approval, accounting" },
    { id: "attendance-setup",        label: "Attendance",          icon: "user-check",       desc: "Check-in, schedules, overtime" },
    { id: "recruitment-setup",       label: "Recruitment",         icon: "user-plus",        desc: "Pipeline, interviews, communication" },
    { id: "fleet-setup",             label: "Fleet",               icon: "truck",            desc: "Vehicles, drivers, service contracts" },
    { id: "events-setup",            label: "Events",              icon: "calendar",         desc: "Event types, registration, tickets" },
    { id: "email-marketing-setup",   label: "Email Marketing",     icon: "mail",             desc: "Mailing lists, sender, campaigns" },
    { id: "helpdesk-setup",          label: "Helpdesk",            icon: "headphones",       desc: "Teams, SLA, support channels" },
    { id: "payroll-setup",           label: "Payroll",             icon: "dollar-sign",      desc: "Structures, salary rules, accounting" },
    { id: "planning-setup",          label: "Planning",            icon: "layout",           desc: "Roles, shifts, publication" },
    { id: "approvals-setup",         label: "Approvals",           icon: "check-circle",     desc: "Types, approvers, escalation" },
    { id: "knowledge-setup",         label: "Knowledge",           icon: "book-open",        desc: "Articles, access, templates" },
    { id: "documents-setup",         label: "Documents",           icon: "folder",           desc: "Workspaces, access, tags" },
    { id: "sign-setup",              label: "Sign",                icon: "pen-tool",         desc: "Templates, signatories, reminders" },
    { id: "discuss-setup",           label: "Discuss",             icon: "message-circle",   desc: "Channels, policies, notifications" },
    { id: "outgoing-mail-setup",     label: "Outgoing Mail",       icon: "send",             desc: "SMTP server, sender identity" },
    { id: "incoming-mail-setup",     label: "Incoming Mail",       icon: "inbox",            desc: "IMAP/POP3, catchall, aliases" },
    { id: "accounting-reports-setup", label: "Accounting Reports", icon: "bar-chart-2",      desc: "P&L, tax reports, custom reports" },
    { id: "spreadsheet-setup",       label: "Spreadsheet",         icon: "grid",             desc: "Templates, data sources, access" },
    { id: "live-chat-setup",         label: "Live Chat",           icon: "message-square",   desc: "Channels, chatbot, widget" },
    { id: "whatsapp-setup",          label: "WhatsApp",            icon: "smartphone",       desc: "Business account, templates, triggers" },
    { id: "sms-marketing-setup",     label: "SMS Marketing",       icon: "message-square",   desc: "Provider, sender, campaigns" },
    { id: "calendar-setup",          label: "Calendar",            icon: "calendar",         desc: "Sync, meeting types, booking" },
    { id: "iot-setup",               label: "IoT",                 icon: "wifi",             desc: "IoT boxes, devices, POS integration" },
    { id: "studio-setup",            label: "Studio",              icon: "edit-3",           desc: "Customisation governance, views" },
    { id: "consolidation-setup",     label: "Consolidation",       icon: "layers",           desc: "Multi-company financial consolidation" },
    { id: "lunch-setup",             label: "Lunch",               icon: "coffee",           desc: "Suppliers, products, cash moves" },
    { id: "referrals-setup",         label: "Referrals",           icon: "share-2",          desc: "Programme, rewards, trigger stages" },
    { id: "loyalty-setup",           label: "Loyalty & Gift Cards", icon: "gift",            desc: "Points, rewards, expiry" },
    { id: "appraisals-setup",        label: "Appraisals",          icon: "star",             desc: "Cycles, goals, 360 feedback" },
    { id: "voip-setup",              label: "VoIP",                icon: "phone",            desc: "Provider, extensions, call logging" }
  ];

  return el("div", { style: "max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;" }, [
    el("div", {}, [
      el("span", { style: "display: inline-block; font-size: 11px; letter-spacing: 0.1em; color: #92400e; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 6px; padding: 3px 10px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;", text: "Configuration Wizards" }),
      el("h2", { style: "font-size: 24px; font-weight: 700; color: #0c1a30; font-family: Inter, sans-serif;", text: "Module Setup" }),
      el("p", { style: "font-size: 14px; color: #64748b; margin-top: 4px;", text: "Complete each wizard to configure your Odoo modules. Data flows automatically between wizards." })
    ]),
    el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px;" },
      WIZARD_CARDS.map(w => {
        const completedWizards = getCompletedWizards();
        const done = !!getWizardData(toCamelKey(w.id)) || completedWizards.includes(w.id);
        const statusBadge = done
          ? el("span", { style: "display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #065f46; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 6px; padding: 2px 8px; margin-left: auto; flex-shrink: 0;", text: "Done" })
          : null;
        const card = el("button", {
          style: "text-align: left; display: flex; align-items: center; gap: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;",
          onclick: () => onNavigate("wizard-" + w.id)
        }, [
          el("div", { style: `width: 44px; height: 44px; border-radius: 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;` }, [
            (() => { const ic = lucideIcon(done ? "check" : w.icon, 20); ic.style.color = done ? "#065f46" : "#92400e"; return ic; })()
          ]),
          el("div", { style: "flex: 1; min-width: 0;" }, [
            el("h4", { style: "font-size: 15px; font-weight: 600; color: #0c1a30; margin-bottom: 2px;", text: w.label }),
            el("p", { style: "font-size: 12px; color: #64748b;", text: w.desc })
          ]),
          statusBadge
        ]);
        card.onmouseenter = () => { card.style.borderColor = "#f59e0b"; card.style.boxShadow = "0 2px 8px rgba(245,158,11,0.1)"; };
        card.onmouseleave = () => { card.style.borderColor = "#e2e8f0"; card.style.boxShadow = "none"; };
        return card;
      })
    )
  ]);
}

function toCamelKey(id) {
  const map = {
    "company-setup": "companySetup",
    "master-data-setup": "masterDataConfig",
    "users-access": "usersAccess",
    "chart-of-accounts": "chartOfAccounts",
    "sales-setup": "salesConfig",
    "crm-setup": "crmConfig",
    "inventory-setup": "inventoryConfig",
    "accounting-setup": "accountingConfig",
    "purchase-setup": "purchaseConfig",
    "manufacturing-setup": "manufacturingConfig",
    "plm-setup": "plmConfig",
    "quality-setup": "qualityConfig",
    "hr-setup": "hrPayrollConfig",
    "website-setup": "websiteEcommerce",
    "pos-setup": "posConfig",
    "field-service-setup": "fieldServiceConfig",
    "maintenance-setup": "maintenanceConfig",
    "rental-setup": "rentalConfig",
    "repairs-setup": "repairsConfig",
    "subscriptions-setup": "subscriptionsConfig",
    "timesheets-setup": "timesheetsConfig",
    "expenses-setup": "expensesConfig",
    "attendance-setup": "attendanceConfig",
    "recruitment-setup": "recruitmentConfig",
    "fleet-setup": "fleetConfig",
    "events-setup": "eventsConfig",
    "email-marketing-setup": "emailMarketingConfig",
    "helpdesk-setup": "helpdeskConfig",
    "payroll-setup": "payrollConfig",
    "planning-setup": "planningConfig",
    "approvals-setup": "approvalsConfig",
    "knowledge-setup": "knowledgeConfig",
    "documents-setup": "documentsConfig",
    "sign-setup": "signConfig",
    "discuss-setup": "discussConfig",
    "outgoing-mail-setup": "outgoingMailConfig",
    "incoming-mail-setup": "incomingMailConfig",
    "accounting-reports-setup": "accountingReportsConfig",
    "spreadsheet-setup": "spreadsheetConfig",
    "live-chat-setup": "liveChatConfig",
    "whatsapp-setup": "whatsappConfig",
    "sms-marketing-setup": "smsMarketingConfig",
    "calendar-setup": "calendarConfig",
    "iot-setup": "iotConfig",
    "studio-setup": "studioConfig",
    "consolidation-setup": "consolidationConfig",
    "lunch-setup": "lunchConfig",
    "referrals-setup": "referralsConfig",
    "loyalty-setup": "loyaltyConfig",
    "appraisals-setup": "appraisalsConfig",
    "voip-setup": "voipConfig"
  };
  return map[id] || null;
}
