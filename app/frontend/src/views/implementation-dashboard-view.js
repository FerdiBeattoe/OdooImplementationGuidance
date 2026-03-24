import { el } from "../lib/dom.js";
import { getActivityLog, getAllRoadmapStatuses, getImplementationState } from "../state/implementationStore.js";

const MODULES = [
  { id: "company-setup",      label: "Company Setup",           icon: "business",         wizardId: "company-setup" },
  { id: "sales",              label: "Sales",                   icon: "sell",             wizardId: "sales-setup" },
  { id: "crm",                label: "CRM",                     icon: "person_pin",       wizardId: "crm-setup" },
  { id: "inventory",          label: "Inventory",               icon: "inventory_2",      wizardId: "inventory-setup" },
  { id: "accounting",         label: "Accounting",              icon: "account_balance",  wizardId: "accounting-setup" },
  { id: "purchase",           label: "Purchase",                icon: "shopping_cart",    wizardId: "purchase-setup" },
  { id: "manufacturing",      label: "Manufacturing",           icon: "factory",          wizardId: "manufacturing-setup" },
  { id: "hr",                 label: "HR",                      icon: "group",            wizardId: "hr-setup" },
  { id: "website",            label: "Website",                 icon: "language",         wizardId: "website-setup" },
  { id: "pos",                label: "Point of Sale",           icon: "point_of_sale",    wizardId: "pos-setup" },
  { id: "email",              label: "Email & Communication",   icon: "mail",             wizardId: "company-setup" },
  { id: "reporting",          label: "Reporting",               icon: "analytics",        wizardId: "analytics-setup" }
];

const NEXT_TASKS = [
  { module: "Company Setup",  desc: "Enter company name, address and tax details",      time: "~10 min", wizardId: "company-setup" },
  { module: "Users & Access", desc: "Add team members and set their access rights",     time: "~15 min", wizardId: "users-access" },
  { module: "Chart of Accounts", desc: "Select country and review default accounts",   time: "~20 min", wizardId: "chart-of-accounts" }
];

export function renderImplementationDashboardView({ onNavigate }) {
  const roadmapStatuses = getAllRoadmapStatuses();
  const implState = getImplementationState();
  const activityLog = getActivityLog();

  // Calculate metrics
  const completedWizards = Object.values(implState.wizardData || {}).filter(Boolean).length;
  const totalWizards = 12;
  const completedSteps = Object.values(roadmapStatuses).filter(s => s === "complete").length;
  const totalSteps = 30;
  const importedRecords = Object.values(implState.importedData || {}).reduce((acc, arr) => acc + arr.length, 0);
  const overallPct = Math.round((completedWizards / totalWizards) * 100);

  return el("div", { className: "max-w-7xl mx-auto space-y-8" }, [
    // ── Page title ─────────────────────────────────────────
    el("div", {}, [
      el("p", { className: "text-xs font-bold tracking-widest text-secondary uppercase mb-1", text: "Odoo 19 Implementation" }),
      el("h2", { className: "font-headline text-2xl font-bold text-on-surface", text: "Implementation Dashboard" })
    ]),

    // ── Top metric cards ──────────────────────────────────
    el("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4" }, [
      metricCard("Modules Configured", `${completedWizards}/${totalWizards}`, "tune", "secondary"),
      metricCard("Data Imported", `${importedRecords} records`, "upload_file", "tertiary"),
      metricCard("Steps Complete", `${completedSteps}/${totalSteps}`, "task_alt", "primary"),
      metricCard("Est. Time Remaining", estimateTimeRemaining(completedWizards, totalWizards), "schedule", "outline")
    ]),

    // ── Middle row ────────────────────────────────────────
    el("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-6" }, [
      // LEFT 60%: Implementation Progress
      el("div", { className: "lg:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden" }, [
        el("div", { className: "px-6 py-5 border-b border-outline-variant/10" }, [
          el("div", { className: "flex items-center justify-between" }, [
            el("h3", { className: "font-headline text-base font-bold text-on-surface", text: "Implementation Progress" }),
            el("span", { className: "text-2xl font-extrabold text-primary", text: `${overallPct}%` })
          ]),
          el("div", { className: "mt-3 h-2 bg-secondary-container rounded-full overflow-hidden" }, [
            el("div", {
              className: "h-full bg-secondary rounded-full transition-all duration-500",
              style: `width: ${overallPct}%; box-shadow: 0 0 12px rgba(19,103,123,0.3)`
            })
          ])
        ]),
        el("div", { className: "px-6 py-4 space-y-3" },
          MODULES.map(mod => {
            const data = implState.wizardData?.[toCamelKey(mod.id)];
            const status = data ? "complete" : roadmapStatuses[mod.id] === "in-progress" ? "in-progress" : "not-started";
            const pct = status === "complete" ? 100 : status === "in-progress" ? 40 : 0;
            return el("div", {
              className: "flex items-center gap-3 py-1.5 group cursor-pointer hover:bg-surface-container-low rounded-lg px-2 -mx-2 transition-colors",
              onclick: () => onNavigate("wizard-" + mod.wizardId)
            }, [
              el("span", { className: "material-symbols-outlined text-[20px] text-on-surface-variant flex-shrink-0", text: mod.icon }),
              el("span", { className: "text-sm text-on-surface font-medium flex-1 min-w-0 truncate", text: mod.label }),
              el("div", { className: "w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden flex-shrink-0" }, [
                el("div", {
                  className: `h-full rounded-full ${status === "complete" ? "bg-secondary" : status === "in-progress" ? "bg-primary" : "bg-surface-container-highest"}`,
                  style: `width: ${pct}%`
                })
              ]),
              statusBadge(status)
            ]);
          })
        )
      ]),
      // RIGHT 40%: What's Next
      el("div", { className: "lg:col-span-2 space-y-4" }, [
        el("div", { className: "bg-primary text-on-primary rounded-xl p-6 shadow-sm" }, [
          el("p", { className: "text-xs font-bold uppercase tracking-widest mb-2 opacity-80", text: "Ready to continue?" }),
          el("h3", { className: "font-headline text-xl font-bold mb-4", text: "Jump Back In" }),
          el("button", {
            className: "w-full bg-white text-primary font-bold text-sm py-3 rounded-xl hover:bg-primary-fixed transition-colors active:scale-95",
            onclick: () => onNavigate("implementation-roadmap")
          }, [
            el("span", { text: "Open Roadmap" })
          ])
        ]),
        el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden" }, [
          el("div", { className: "px-5 py-4 border-b border-outline-variant/10" }, [
            el("h4", { className: "font-headline text-sm font-bold text-on-surface", text: "Next Steps" })
          ]),
          el("div", { className: "divide-y divide-outline-variant/10" },
            NEXT_TASKS.map(task => el("div", { className: "px-5 py-4" }, [
              el("div", { className: "flex items-start justify-between gap-2 mb-2" }, [
                el("span", { className: "text-xs font-bold text-secondary uppercase tracking-wide", text: task.module })
              ]),
              el("p", { className: "text-sm text-on-surface font-medium mb-1", text: task.desc }),
              el("div", { className: "flex items-center justify-between" }, [
                el("span", { className: "text-xs text-on-surface-variant flex items-center gap-1" }, [
                  el("span", { className: "material-symbols-outlined text-[14px]", text: "schedule" }),
                  el("span", { text: task.time })
                ]),
                el("button", {
                  className: "text-xs font-semibold text-primary hover:underline",
                  onclick: () => onNavigate("wizard-" + task.wizardId)
                }, [el("span", { text: "Start →" })])
              ])
            ]))
          )
        ])
      ])
    ]),

    // ── Recent Activity ───────────────────────────────────
    el("div", { className: "bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden" }, [
      el("div", { className: "px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between" }, [
        el("h4", { className: "font-headline text-sm font-bold text-on-surface uppercase tracking-widest", text: "Recent Activity" }),
        el("span", { className: "text-xs text-on-surface-variant", text: `${activityLog.length} events` })
      ]),
      activityLog.length === 0
        ? el("div", { className: "px-6 py-8 text-center text-on-surface-variant text-sm" }, [
            el("span", { className: "material-symbols-outlined text-4xl block mb-2 opacity-30", text: "history" }),
            el("p", { text: "No activity yet. Start by completing a wizard step." })
          ])
        : el("div", { className: "divide-y divide-outline-variant/10" },
            activityLog.slice(0, 10).map(item => activityItem(item))
          )
    ])
  ]);
}

function metricCard(label, value, icon, color) {
  const colorMap = {
    primary:   { bg: "bg-primary-fixed/30",   text: "text-primary",   icon: "text-primary" },
    secondary: { bg: "bg-secondary-container/50", text: "text-secondary", icon: "text-secondary" },
    tertiary:  { bg: "bg-tertiary-fixed/30",   text: "text-tertiary",  icon: "text-tertiary" },
    outline:   { bg: "bg-surface-container",   text: "text-on-surface",icon: "text-on-surface-variant" }
  };
  const c = colorMap[color] || colorMap.outline;
  return el("div", { className: `${c.bg} rounded-xl p-5 flex flex-col gap-2` }, [
    el("div", { className: "flex items-center justify-between" }, [
      el("span", { className: `material-symbols-outlined text-[22px] ${c.icon}`, text: icon }),
    ]),
    el("p", { className: `text-xl font-extrabold ${c.text} font-headline`, text: value }),
    el("p", { className: "text-xs text-on-surface-variant font-medium", text: label })
  ]);
}

function statusBadge(status) {
  const map = {
    "complete":    { cls: "bg-secondary-container text-on-secondary-container", label: "Complete" },
    "in-progress": { cls: "bg-primary-fixed text-on-primary-fixed",             label: "In Progress" },
    "not-started": { cls: "bg-surface-container-high text-on-surface-variant",  label: "Not Started" }
  };
  const s = map[status] || map["not-started"];
  return el("span", { className: `badge text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.cls}`, text: s.label });
}

function activityItem(item) {
  return el("div", { className: "px-6 py-3 flex items-start gap-4 hover:bg-surface-container-low transition-colors" }, [
    el("span", { className: "text-[10px] font-mono text-on-surface-variant/60 mt-1 flex-shrink-0 w-20", text: formatTime(item.timestamp) }),
    el("div", { className: "flex-1 min-w-0" }, [
      el("p", { className: "text-sm text-on-surface font-medium", text: item.action || item.message || "Activity" }),
      item.module ? el("span", { className: "badge badge--secondary text-[10px] mt-1", text: item.module }) : null
    ])
  ]);
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

function estimateTimeRemaining(done, total) {
  const remaining = total - done;
  if (remaining <= 0) return "Complete!";
  const hours = Math.round(remaining * 0.75);
  return `~${hours}h`;
}

function toCamelKey(id) {
  const map = {
    "company-setup": "companySetup",
    "sales": "salesConfig",
    "crm": "crmConfig",
    "inventory": "inventoryConfig",
    "accounting": "accountingConfig",
    "purchase": "purchaseConfig",
    "manufacturing": "manufacturingConfig",
    "hr": "hrPayrollConfig",
    "website": "websiteEcommerce",
    "pos": "posConfig",
    "email": "companySetup",
    "reporting": null
  };
  return map[id] || null;
}
