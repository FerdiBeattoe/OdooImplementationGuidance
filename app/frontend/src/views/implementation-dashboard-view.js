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

  return el("div", { className: "max-w-7xl mx-auto", style: "display: flex; flex-direction: column; gap: 32px;" }, [
    // ── Page title ─────────────────────────────────────────
    el("div", {}, [
      el("p", {
        style: "font-size: 11px; font-weight: 700; letter-spacing: var(--ls-widest); text-transform: uppercase; color: var(--color-secondary); margin-bottom: 4px;",
        text: "Odoo 19 Implementation"
      }),
      el("h2", {
        style: "font-family: var(--font-headline); font-size: 24px; font-weight: 700; color: var(--color-on-surface);",
        text: "Implementation Dashboard"
      })
    ]),

    // ── Top metric cards ──────────────────────────────────
    el("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4" },
      [
        metricCard("Modules Configured", `${completedWizards}/${totalWizards}`, "tune", "secondary"),
        metricCard("Data Imported", `${importedRecords} records`, "upload_file", "tertiary"),
        metricCard("Steps Complete", `${completedSteps}/${totalSteps}`, "task_alt", "primary"),
        metricCard("Est. Time Remaining", estimateTimeRemaining(completedWizards, totalWizards), "schedule", "outline")
      ]
    ),

    // ── Middle row ────────────────────────────────────────
    el("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-6" }, [
      // LEFT 60%: Implementation Progress
      el("div", {
        className: "lg:col-span-3",
        style: "background: var(--color-surface-container-lowest); box-shadow: var(--shadow-sm); overflow: hidden;"
      }, [
        el("div", { style: "padding: 20px 24px; background: var(--color-surface-container-low);" }, [
          el("div", { style: "display: flex; align-items: center; justify-content: space-between;" }, [
            el("h3", {
              style: "font-family: var(--font-headline); font-size: 15px; font-weight: 700; color: var(--color-on-surface);",
              text: "Implementation Progress"
            }),
            el("span", {
              style: "font-family: var(--font-headline); font-size: 24px; font-weight: 800; color: var(--color-primary);",
              text: `${overallPct}%`
            })
          ]),
          el("div", { style: "margin-top: 12px; height: 6px; background: var(--color-surface-container-high); overflow: hidden;" }, [
            el("div", {
              style: `width: ${overallPct}%; height: 100%; background: var(--color-primary); transition: width 500ms ease;`
            })
          ])
        ]),
        el("div", { style: "padding: 16px 24px; display: flex; flex-direction: column; gap: 2px;" },
          MODULES.map(mod => {
            const data = implState.wizardData?.[toCamelKey(mod.id)];
            const status = data ? "complete" : roadmapStatuses[mod.id] === "in-progress" ? "in-progress" : "not-started";
            const pct = status === "complete" ? 100 : status === "in-progress" ? 40 : 0;
            return el("div", {
              style: "display: flex; align-items: center; gap: 12px; padding: 8px; cursor: pointer; transition: background 150ms ease;",
              className: "hover:bg-surface-container-low",
              onclick: () => onNavigate("wizard-" + mod.wizardId)
            }, [
              el("span", {
                className: "material-symbols-outlined",
                style: "font-size: 20px; color: var(--color-on-surface-variant); flex-shrink: 0;",
                text: mod.icon
              }),
              el("span", {
                style: "font-size: 13px; color: var(--color-on-surface); font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
                text: mod.label
              }),
              el("div", { style: "width: 96px; height: 4px; background: var(--color-surface-container-high); overflow: hidden; flex-shrink: 0;" }, [
                el("div", {
                  style: `width: ${pct}%; height: 100%; background: ${status === "complete" ? "var(--color-secondary)" : status === "in-progress" ? "var(--color-primary)" : "var(--color-surface-container-highest)"};`
                })
              ]),
              statusBadge(status)
            ]);
          })
        )
      ]),
      // RIGHT 40%: What's Next
      el("div", { className: "lg:col-span-2", style: "display: flex; flex-direction: column; gap: 16px;" }, [
        el("div", {
          style: "background: var(--color-primary); color: var(--color-on-primary); padding: 24px; box-shadow: var(--shadow-sm);"
        }, [
          el("p", {
            style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: var(--ls-widest); margin-bottom: 8px; opacity: 0.8;",
            text: "Ready to continue?"
          }),
          el("h3", {
            style: "font-family: var(--font-headline); font-size: 20px; font-weight: 700; margin-bottom: 16px;",
            text: "Jump Back In"
          }),
          el("button", {
            style: "width: 100%; background: #fff; color: var(--color-primary); font-weight: 700; font-size: 14px; padding: 12px; border: none; cursor: pointer; transition: background 150ms ease;",
            onclick: () => onNavigate("implementation-roadmap")
          }, [
            el("span", { text: "Open Roadmap" })
          ])
        ]),
        el("div", {
          style: "background: var(--color-surface-container-lowest); box-shadow: var(--shadow-sm); overflow: hidden;"
        }, [
          el("div", { style: "padding: 16px 20px; background: var(--color-surface-container-low);" }, [
            el("h4", {
              style: "font-family: var(--font-headline); font-size: 13px; font-weight: 700; color: var(--color-on-surface); text-transform: uppercase; letter-spacing: var(--ls-widest);",
              text: "Next Steps"
            })
          ]),
          el("div", {},
            NEXT_TASKS.map((task, i) => el("div", {
              style: `padding: 16px 20px;${i > 0 ? " background: var(--color-surface-container-low);" : ""}`
            }, [
              el("div", { style: "display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px;" }, [
                el("span", {
                  style: "font-size: 11px; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: var(--ls-wide);",
                  text: task.module
                })
              ]),
              el("p", { style: "font-size: 13px; color: var(--color-on-surface); font-weight: 500; margin-bottom: 4px;", text: task.desc }),
              el("div", { style: "display: flex; align-items: center; justify-content: space-between;" }, [
                el("span", { style: "display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-on-surface-variant);" }, [
                  el("span", { className: "material-symbols-outlined", style: "font-size: 14px;", text: "schedule" }),
                  el("span", { text: task.time })
                ]),
                el("button", {
                  style: "font-size: 12px; font-weight: 600; color: var(--color-primary); background: none; border: none; cursor: pointer;",
                  onclick: () => onNavigate("wizard-" + task.wizardId)
                }, [el("span", { text: "Start →" })])
              ])
            ]))
          )
        ])
      ])
    ]),

    // ── Recent Activity ───────────────────────────────────
    el("div", {
      style: "background: var(--color-surface-container-lowest); box-shadow: var(--shadow-sm); overflow: hidden;"
    }, [
      el("div", {
        style: "padding: 16px 24px; background: var(--color-surface-container-low); display: flex; align-items: center; justify-content: space-between;"
      }, [
        el("h4", {
          style: "font-family: var(--font-headline); font-size: 13px; font-weight: 700; color: var(--color-on-surface); text-transform: uppercase; letter-spacing: var(--ls-widest);",
          text: "Recent Activity"
        }),
        el("span", { style: "font-size: 12px; color: var(--color-on-surface-variant);", text: `${activityLog.length} events` })
      ]),
      activityLog.length === 0
        ? el("div", { style: "padding: 32px 24px; text-align: center; color: var(--color-on-surface-variant); font-size: 13px;" }, [
            el("span", { className: "material-symbols-outlined", style: "font-size: 36px; display: block; margin-bottom: 8px; opacity: 0.3;", text: "history" }),
            el("p", { text: "No activity yet. Start by completing a wizard step." })
          ])
        : el("div", {},
            activityLog.slice(0, 10).map(item => activityItem(item))
          )
    ])
  ]);
}

function metricCard(label, value, icon, color) {
  const colorMap = {
    primary:   { icon: "var(--color-primary)",   text: "var(--color-primary)" },
    secondary: { icon: "var(--color-secondary)",  text: "var(--color-secondary)" },
    tertiary:  { icon: "var(--color-tertiary)",   text: "var(--color-tertiary)" },
    outline:   { icon: "var(--color-on-surface-variant)", text: "var(--color-on-surface)" }
  };
  const c = colorMap[color] || colorMap.outline;
  return el("div", {
    style: "background: var(--color-surface-container-lowest); box-shadow: var(--shadow-sm); padding: 20px; display: flex; flex-direction: column; gap: 8px;"
  }, [
    el("div", { style: "display: flex; align-items: center; justify-content: space-between;" }, [
      el("span", { className: "material-symbols-outlined", style: `font-size: 22px; color: ${c.icon};`, text: icon }),
    ]),
    el("p", {
      style: `font-family: var(--font-headline); font-size: 22px; font-weight: 800; color: ${c.text};`,
      text: value
    }),
    el("p", {
      style: "font-size: 11px; text-transform: uppercase; letter-spacing: var(--ls-widest); color: var(--color-on-surface-variant); font-weight: 600;",
      text: label
    })
  ]);
}

function statusBadge(status) {
  const map = {
    "complete":    { bg: "var(--color-secondary-container)", color: "var(--color-on-secondary-container)", label: "Complete" },
    "in-progress": { bg: "var(--color-primary-fixed)",       color: "var(--color-on-primary-fixed)",       label: "In Progress" },
    "not-started": { bg: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)",  label: "Not Started" }
  };
  const s = map[status] || map["not-started"];
  return el("span", {
    style: `font-size: 10px; padding: 2px 8px; font-weight: 600; background: ${s.bg}; color: ${s.color};`,
    text: s.label
  });
}

function activityItem(item) {
  return el("div", {
    style: "padding: 10px 24px; display: flex; align-items: flex-start; gap: 16px; transition: background 150ms ease;",
    className: "hover:bg-surface-container-low"
  }, [
    el("span", {
      style: "font-size: 10px; font-family: var(--font-mono, monospace); color: var(--color-on-surface-variant); opacity: 0.6; margin-top: 2px; flex-shrink: 0; width: 80px;",
      text: formatTime(item.timestamp)
    }),
    el("div", { style: "flex: 1; min-width: 0;" }, [
      el("p", { style: "font-size: 13px; color: var(--color-on-surface); font-weight: 500;", text: item.action || item.message || "Activity" }),
      item.module ? el("span", {
        style: "display: inline-block; font-size: 10px; margin-top: 4px; padding: 2px 8px; background: var(--color-secondary-container); color: var(--color-on-secondary-container); font-weight: 600;",
        text: item.module
      }) : null
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
