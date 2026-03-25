import { el } from "../lib/dom.js";

const MODULES = [
  { id: "company-setup", name: "Company Setup", icon: "business" },
  { id: "sales", name: "Sales", icon: "shopping_cart" },
  { id: "crm", name: "CRM", icon: "people" },
  { id: "inventory", name: "Inventory", icon: "inventory_2" },
  { id: "accounting", name: "Accounting", icon: "account_balance" },
  { id: "purchase", name: "Purchase", icon: "shopping_bag" },
  { id: "manufacturing", name: "Manufacturing", icon: "precision_manufacturing" },
  { id: "hr", name: "HR", icon: "badge" },
  { id: "website", name: "Website", icon: "language" },
  { id: "pos", name: "Point of Sale", icon: "point_of_sale" },
  { id: "email", name: "Email & Communication", icon: "email" },
  { id: "reporting", name: "Reporting", icon: "assessment" }
];

const NEXT_STEPS = [
  { id: "company", name: "Company Setup", icon: "business", time: "5 min" },
  { id: "users", name: "Users & Access", icon: "people", time: "10 min" },
  { id: "accounts", name: "Chart of Accounts", icon: "account_balance", time: "15 min" }
];

export function renderImplementationDashboardView({ onNavigate, onOpenRoadmap }) {
  return el("div", { 
    className: "pd-grid pd-grid--4",
    style: "grid-template-columns: 1fr 1fr 1fr 300px; gap: 24px;"
  }, [
    // Main content area (spans 3 columns)
    el("div", { 
      className: "col-span-3",
      style: "display: flex; flex-direction: column; gap: 24px;"
    }, [
      // KPI Cards Row
      el("div", { 
        className: "pd-grid pd-grid--4",
        style: "grid-template-columns: repeat(4, 1fr); gap: 20px;"
      }, [
        renderKpiCard("0/12", "Modules Configured", "settings", true),
        renderKpiCard("0 records", "Data Imported", "database", true),
        renderKpiCard("0/30", "Steps Complete", "checklist", true),
        renderKpiCard("~9h", "Est. Time Remaining", "schedule", true)
      ]),
      
      // Implementation Progress Section
      renderProgressSection()
    ]),
    
    // Right Sidebar
    el("div", { 
      className: "col-span-1",
      style: "display: flex; flex-direction: column; gap: 24px;"
    }, [
      // Jump Back In Card
      el("div", { 
        className: "pd-card pd-card--accent",
        style: "padding: 24px; display: flex; flex-direction: column; gap: 16px;"
      }, [
        el("div", {}, [
          el("p", { 
            className: "text-xs font-semibold uppercase tracking-wider",
            style: "color: rgba(255,255,255,0.7); margin-bottom: 4px;"
          }, "READY TO CONTINUE?"),
          el("h3", { 
            className: "text-2xl font-bold",
            style: "color: white; letter-spacing: -0.02em;"
          }, "Jump Back In")
        ]),
        el("button", {
          className: "pd-btn pd-btn--lg",
          style: "background: white; color: #6366f1; font-weight: 600;",
          onclick: onOpenRoadmap
        }, "Open Roadmap")
      ]),
      
      // Next Steps Section
      el("div", { 
        className: "pd-card",
        style: "padding: 0; overflow: hidden;"
      }, [
        el("div", { 
          style: "padding: 16px 20px; border-bottom: 1px solid rgba(148,163,184,0.1);"
        }, [
          el("h4", { 
            className: "text-sm font-semibold uppercase tracking-wider",
            style: "color: #94a3b8;"
          }, "NEXT STEPS")
        ]),
        el("div", { 
          style: "padding: 16px; display: flex; flex-direction: column; gap: 12px;"
        }, NEXT_STEPS.map(step => renderNextStepItem(step, onNavigate)))
      ])
    ])
  ]);
}

function renderKpiCard(value, label, icon, showIcon = false) {
  return el("div", { 
    className: "pd-card",
    style: "padding: 24px; display: flex; flex-direction: column; gap: 8px; position: relative; overflow: hidden;"
  }, [
    showIcon ? el("div", { 
      className: "absolute top-4 right-4",
      style: "width: 36px; height: 36px; border-radius: 10px; background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center;"
    }, [
      el("span", { 
        className: "material-symbols-outlined",
        style: "font-size: 20px; color: #6366f1;",
        text: icon 
      })
    ]) : null,
    el("div", { 
      className: "pd-metric__value",
      style: "font-size: 32px; font-weight: 700; color: #f8fafc; letter-spacing: -0.02em; line-height: 1;"
    }, value),
    el("p", { 
      className: "text-sm",
      style: "color: #94a3b8; font-weight: 500;"
    }, label)
  ]);
}

function renderProgressSection() {
  return el("div", { 
    className: "pd-card pd-card--solid",
    style: "padding: 32px; display: flex; flex-direction: column; gap: 24px;"
  }, [
    // Header with Progress
    el("div", { 
      className: "pd-progress__header",
      style: "margin-bottom: 8px;"
    }, [
      el("h2", { 
        className: "text-xl font-semibold",
        style: "color: #f8fafc; letter-spacing: -0.01em;"
      }, "Implementation Progress "),
      el("span", { 
        className: "text-2xl font-bold",
        style: "color: #6366f1;"
      }, "0%")
    ]),
    
    // Progress Bar
    el("div", { className: "pd-progress__bar" }, [
      el("div", { 
        className: "pd-progress__fill",
        style: "width: 0%;"
      })
    ]),
    
    // Module List (2-column grid)
    el("div", { 
      style: "display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 8px;"
    }, MODULES.map(module => renderModuleItem(module)))
  ]);
}

function renderModuleItem(module) {
  return el("div", { 
    className: "pd-module-item",
    style: "padding: 14px 16px;"
  }, [
    el("div", { className: "pd-module-item__left" }, [
      el("div", { 
        className: "pd-module-item__icon",
        style: "width: 36px; height: 36px; border-radius: 10px; background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center;"
      }, [
        el("span", { 
          className: "material-symbols-outlined",
          style: "font-size: 18px; color: #6366f1;",
          text: module.icon 
        })
      ]),
      el("span", { 
        className: "pd-module-item__name",
        style: "font-size: 14px; font-weight: 500; color: #f8fafc;"
      }, module.name)
    ]),
    el("span", { 
      className: "pd-badge pd-badge--neutral",
      style: "font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 10px; border-radius: 6px; background: rgba(30,41,59,0.8); color: #64748b; border: 1px solid rgba(148,163,184,0.1);"
    }, "NOT STARTED")
  ]);
}

function renderNextStepItem(step, onNavigate) {
  return el("div", { 
    style: "display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 10px; background: rgba(30,41,59,0.4); border: 1px solid rgba(148,163,184,0.08); transition: all 200ms ease; cursor: pointer;",
    onmouseenter: (e) => {
      e.currentTarget.style.background = "rgba(30,41,59,0.8)";
      e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)";
    },
    onmouseleave: (e) => {
      e.currentTarget.style.background = "rgba(30,41,59,0.4)";
      e.currentTarget.style.borderColor = "rgba(148,163,184,0.08)";
    },
    onclick: () => onNavigate(step.id)
  }, [
    el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
      el("div", { 
        style: "width: 32px; height: 32px; border-radius: 8px; background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center;"
      }, [
        el("span", { 
          className: "material-symbols-outlined",
          style: "font-size: 16px; color: #6366f1;",
          text: step.icon 
        })
      ]),
      el("div", {}, [
        el("p", { 
          className: "text-sm font-medium",
          style: "color: #f8fafc;"
        }, step.name),
        el("p", { 
          className: "text-xs",
          style: "color: #64748b;"
        }, step.time)
      ])
    ]),
    el("button", { 
      className: "text-sm font-semibold",
      style: "color: #6366f1; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer;"
    }, [
      "Start",
      el("span", { className: "material-symbols-outlined", style: "font-size: 16px;", text: "arrow_forward" })
    ])
  ]);
}
