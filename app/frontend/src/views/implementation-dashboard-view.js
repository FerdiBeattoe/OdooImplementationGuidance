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

  return el("div", { className: "max-w-6xl mx-auto", style: "display: flex; flex-direction: column; gap: 32px; padding: 32px;" }, [
    // ── Page title ─────────────────────────────────────────
    el("div", {}, [
      el("p", {
        style: "font-family: var(--font-label); font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-primary); margin-bottom: 4px;",
        text: "ODOO 19 IMPLEMENTATION"
      }),
      el("h2", {
        style: "font-family: var(--font-headline); font-size: 28px; font-weight: 700; color: var(--color-on-surface); letter-spacing: var(--ls-snug); margin-bottom: 32px;",
        text: "Implementation Dashboard"
      })
    ]),

    // ── Top metric cards ──────────────────────────────────
    el("div", { style: "display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;" },
      [
        metricCard("Modules Configured", `${completedWizards}/${totalWizards}`, "tune"),
        metricCard("Data Imported", `${importedRecords} records`, "upload_file"),
        metricCard("Steps Complete", `${completedSteps}/${totalSteps}`, "task_alt"),
        metricCard("Est. Time Remaining", estimateTimeRemaining(completedWizards, totalWizards), "schedule")
      ]
    ),

    // ── Middle row ────────────────────────────────────────
    el("div", { style: "display: grid; grid-template-columns: 3fr 2fr; gap: 24px;" }, [
      // LEFT: Implementation Progress
      el("div", {
        style: "background: var(--color-surface); box-shadow: var(--shadow-sm); overflow: hidden;"
      }, [
        el("div", { style: "padding: 16px 24px; background: var(--color-surface-container-low);" }, [
          el("div", { style: "display: flex; align-items: center; justify-content: space-between;" }, [
            el("h3", {
              style: "font-family: var(--font-headline); font-size: 14px; font-weight: 600; color: var(--color-on-surface); letter-spacing: var(--ls-snug);",
              text: "Implementation Progress"
            }),
            el("span", {
              style: "font-family: var(--font-headline); font-size: 24px; font-weight: 700; color: var(--color-primary);",
              text: `${overallPct}%`
            })
          ]),
          el("div", { style: "margin-top: 12px; height: 4px; background: var(--color-surface-container-high); overflow: hidden;" }, [
            el("div", {
              style: `width: ${overallPct}%; height: 100%; background: var(--color-primary); transition: width 500ms ease;`
            })
          ])
        ]),
        el("div", { style: "padding: 16px 24px; display: flex; flex-direction: column; gap: 0;" },
          MODULES.map(mod => {
            const data = implState.wizardData?.[toCamelKey(mod.id)];
            const status = data ? "complete" : roadmapStatuses[mod.id] === "in-progress" ? "in-progress" : "not-started";
            const pct = status === "complete" ? 100 : status === "in-progress" ? 40 : 0;
            return el("div", {
              style: "display: flex; align-items: center; gap: 12px; padding: 8px 0; cursor: pointer; transition: background 150ms ease;",
              className: "hover-row",
              onclick: () => onNavigate("wizard-" + mod.wizardId)
            }, [
              el("span", {
                className: "material-symbols-outlined",
                style: "font-size: 20px; color: var(--color-on-surface-variant); flex-shrink: 0;",
                text: mod.icon
              }),
              el("span", {
                style: "font-family: var(--font-body); font-size: 13px; color: var(--color-on-surface); font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
                text: mod.label
              }),
              el("div", { style: "width: 80px; height: 4px; background: var(--color-surface-container-high); overflow: hidden; flex-shrink: 0;" }, [
                el("div", {
                  style: `width: ${pct}%; height: 100%; background: ${status === "complete" ? "#059669" : status === "in-progress" ? "var(--color-primary)" : "var(--color-surface-container-highest)"};`
                })
              ]),
              statusBadge(status)
            ]);
          })
        )
      ]),
      // RIGHT: What's Next
      el("div", { style: "display: flex; flex-direction: column; gap: 16px;" }, [
        // CTA Card
        el("div", {
          style: "background: var(--color-primary); color: var(--color-on-primary); padding: 24px; box-shadow: var(--shadow-sm);"
        }, [
          el("p", {
            style: "font-family: var(--font-label); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-widest); margin-bottom: 6px; opacity: 0.7;",
            text: "READY TO CONTINUE?"
          }),
          el("h3", {
            style: "font-family: var(--font-headline); font-size: 20px; font-weight: 700; margin-bottom: 16px;",
            text: "Jump Back In"
          }),
          el("button", {
            style: "width: 100%; background: #ffffff; color: var(--color-primary); font-family: var(--font-label); font-weight: 600; font-size: 13px; padding: 10px; border: none; cursor: pointer; transition: background 150ms ease; height: 36px;",
            onclick: () => onNavigate("implementation-roadmap")
          }, [
            el("span", { text: "Open Roadmap" })
          ])
        ]),
        // Next Steps Card
        el("div", {
          style: "background: var(--color-surface); box-shadow: var(--shadow-sm); overflow: hidden;"
        }, [
          el("div", { style: "padding: 16px 20px; background: var(--color-surface-container-low);" }, [
            el("h4", {
              style: "font-family: var(--font-headline); font-size: 13px; font-weight: 700; color: var(--color-on-surface); text-transform: uppercase; letter-spacing: var(--ls-widest);",
              text: "NEXT STEPS"
            })
          ]),
          el("div", {},
            NEXT_TASKS.map((task, i) => el("div", {
              style: `padding: 14px 20px;${i > 0 ? " border-top: 1px solid var(--color-surface-container-low);" : ""}`
            }, [
              el("span", {
                style: "font-family: var(--font-label); font-size: 10px; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: var(--ls-wide); display: block; margin-bottom: 4px;",
                text: task.module
              }),
              el("p", { style: "font-family: var(--font-body); font-size: 13px; color: var(--color-on-surface); font-weight: 500; margin-bottom: 4px;", text: task.desc }),
              el("div", { style: "display: flex; align-items: center; justify-content: space-between; margin-top: 8px;" }, [
                el("span", { style: "display: flex; align-items: center; gap: 4px; font-family: var(--font-body); font-size: 11px; color: var(--color-on-surface-variant);" }, [
                  el("span", { className: "material-symbols-outlined", style: "font-size: 14px;", text: "schedule" }),
                  el("span", { text: task.time })
                ]),
                el("button", {
                  style: "font-family: var(--font-label); font-size: 12px; font-weight: 600; color: var(--color-primary); background: none; border: none; cursor: pointer; text-decoration: none;",
                  onmouseenter: (e) => e.target.style.textDecoration = "underline",
                  onmouseleave: (e) => e.target.style.textDecoration = "none",
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
      style: "background: var(--color-surface); box-shadow: var(--shadow-sm); overflow: hidden;"
    }, [
      el("div", {
        style: "padding: 16px 24px; background: var(--color-surface-container-low); display: flex; align-items: center; justify-content: space-between;"
      }, [
        el("h4", {
          style: "font-family: var(--font-headline); font-size: 13px; font-weight: 700; color: var(--color-on-surface); text-transform: uppercase; letter-spacing: var(--ls-widest);",
          text: "RECENT ACTIVITY"
        }),
        el("span", { style: "font-family: var(--font-body); font-size: 12px; color: var(--color-on-surface-variant);", text: `${activityLog.length} events` })
      ]),
      activityLog.length === 0
        ? el("div", { style: "padding: 32px 24px; text-align: center; color: var(--color-on-surface-variant); font-size: 13px;" }, [
            el("span", { className: "material-symbols-outlined", style: "font-size: 36px; display: block; margin-bottom: 8px; opacity: 0.3;", text: "history" }),
            el("p", { style: "font-family: var(--font-body);", text: "No activity yet. Start by completing a wizard step." })
          ])
        : el("div", {},
            activityLog.slice(0, 10).map(item => activityItem(item))
          )
    ])
  ]);
}

function metricCard(label, value, icon) {
  return el("div", {
    style: "background: var(--color-surface); box-shadow: var(--shadow-sm); padding: 20px 24px; display: flex; flex-direction: column; gap: 8px;"
  }, [
    el("span", { className: "material-symbols-outlined", style: "font-size: 20px; color: var(--color-on-surface-variant); margin-bottom: 8px;", text: icon }),
    el("p", {
      style: "font-family: var(--font-headline); font-size: 28px; font-weight: 700; color: var(--color-primary); margin-top: 24px;",
      text: value
    }),
    el("p", {
      style: "font-family: var(--font-label); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-on-surface-variant); font-weight: 500;",
      text: label
    })
  ]);
}

function statusBadge(status) {
  const map = {
    "complete":    { bg: "rgba(16, 185, 129, 0.1)", color: "#059669", label: "Complete" },
    "in-progress": { bg: "var(--color-primary-subtle)",       color: "var(--color-primary)",       label: "In Progress" },
    "not-started": { bg: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)",  label: "Not Started" }
  };
  const s = map[status] || map["not-started"];
  return el("span", {
    style: `font-family: var(--font-label); font-size: 10px; padding: 2px 6px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide); background: ${s.bg}; color: ${s.color};`,
    text: s.label
  });
}

function activityItem(item) {
  return el("div", {
    style: "padding: 10px 24px; display: flex; align-items: flex-start; gap: 16px; transition: background 150ms ease; border-bottom: 1px solid var(--color-surface-container-low);",
    className: "activity-row"
  }, [
    el("span", {
      style: "font-size: 10px; font-family: monospace; color: var(--color-on-surface-variant); opacity: 0.6; margin-top: 2px; flex-shrink: 0; width: 80px;",
      text: formatTime(item.timestamp)
    }),
    el("div", { style: "flex: 1; min-width: 0;" }, [
      el("p", { style: "font-family: var(--font-body); font-size: 13px; color: var(--color-on-surface); font-weight: 500;", text: item.action || item.message || "Activity" }),
      item.module ? el("span", {
        style: "display: inline-block; font-size: 10px; margin-top: 4px; padding: 2px 8px; background: var(--color-primary-subtle); color: var(--color-primary); font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide);",
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
