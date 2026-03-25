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
    style: "display: grid; grid-template-columns: 1fr 1fr 1fr 300px; gap: 24px;"
  }, [
    // Main content area (spans 3 columns)
    el("div", { 
      style: "grid-column: span 3; display: flex; flex-direction: column; gap: 24px;"
    }, [
      // KPI Cards Row - equal spacing
      el("div", { 
        style: "display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;"
      }, [
        renderKpiCard("0/12", "Modules Configured", "settings"),
        renderKpiCard("0 records", "Data Imported", "database"),
        renderKpiCard("0/30", "Steps Complete", "checklist"),
        renderKpiCard("~9h", "Est. Time Remaining", "schedule")
      ]),
      
      // Implementation Progress Section
      renderProgressSection()
    ]),
    
    // Right Sidebar
    el("div", { 
      style: "grid-column: span 1; display: flex; flex-direction: column; gap: 24px;"
    }, [
      // Jump Back In Card
      el("div", { 
        className: "ee-card ee-card--accent",
        style: "padding: 24px; display: flex; flex-direction: column; gap: 16px;"
      }, [
        el("div", {}, [
          el("p", { 
            style: "font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.7); margin-bottom: 4px;"
          }, "READY TO CONTINUE?"),
          el("h3", { 
            style: "font-family: var(--ee-font-headline); font-size: 22px; font-weight: 700; color: white; letter-spacing: -0.02em;"
          }, "Jump Back In")
        ]),
        el("button", {
          className: "ee-btn ee-btn--lg",
          style: "background: white; color: var(--ee-primary); font-weight: 600;",
          onclick: onOpenRoadmap
        }, "Open Roadmap")
      ]),
      
      // Next Steps Section
      el("div", { 
        className: "ee-card",
        style: "padding: 0;"
      }, [
        el("div", { 
          style: "padding: 16px 20px; border-bottom: 1px solid var(--ee-surface-container);"
        }, [
          el("h4", { 
            style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-outline);"
          }, "NEXT STEPS")
        ]),
        el("div", { 
          style: "padding: 16px; display: flex; flex-direction: column; gap: 12px;"
        }, NEXT_STEPS.map(step => renderNextStepItem(step, onNavigate)))
      ])
    ])
  ]);
}

function renderKpiCard(value, label, icon) {
  return el("div", { 
    className: "ee-card",
    style: "padding: 24px; display: flex; flex-direction: column; gap: 8px; position: relative;"
  }, [
    el("div", { 
      style: "position: absolute; top: 20px; right: 20px; width: 36px; height: 36px; background: var(--ee-primary-subtle); display: flex; align-items: center; justify-content: center;"
    }, [
      el("span", { 
        className: "material-symbols-outlined",
        style: "font-size: 20px; color: var(--ee-primary);",
        text: icon 
      })
    ]),
    el("div", { 
      style: "font-family: var(--ee-font-headline); font-size: 28px; font-weight: 700; color: var(--ee-on-surface); letter-spacing: -0.02em; line-height: 1;"
    }, value),
    el("p", { 
      style: "font-size: 13px; font-weight: 500; color: var(--ee-on-surface-variant);"
    }, label)
  ]);
}

function renderProgressSection() {
  return el("div", { 
    className: "ee-card ee-card--solid",
    style: "padding: 32px; display: flex; flex-direction: column; gap: 24px;"
  }, [
    // Header with Progress
    el("div", { 
      style: "display: flex; align-items: baseline; gap: 12px;"
    }, [
      el("h2", { 
        style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); letter-spacing: -0.01em;"
      }, "Implementation Progress"),
      el("span", { 
        style: "font-size: 24px; font-weight: 700; color: var(--ee-primary);"
      }, "0%")
    ]),
    
    // Progress Bar
    el("div", { 
      style: "height: 4px; background: var(--ee-surface-container); overflow: hidden;"
    }, [
      el("div", { 
        style: "height: 100%; width: 0%; background: var(--ee-primary); transition: width 300ms ease;"
      })
    ]),
    
    // Module List (2-column grid) - equal spacing
    el("div", { 
      style: "display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 8px;"
    }, MODULES.map(module => renderModuleItem(module)))
  ]);
}

function renderModuleItem(module) {
  return el("div", { 
    className: "ee-module-item"
  }, [
    el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
      el("div", { 
        className: "ee-module-item__icon"
      }, [
        el("span", { 
          className: "material-symbols-outlined",
          text: module.icon 
        })
      ]),
      el("span", { 
        style: "font-size: 14px; font-weight: 500; color: var(--ee-on-surface);"
      }, module.name)
    ]),
    el("span", { 
      className: "ee-badge ee-badge--neutral"
    }, "NOT STARTED")
  ]);
}

function renderNextStepItem(step, onNavigate) {
  return el("div", { 
    className: "ee-step-item",
    onclick: () => onNavigate(step.id)
  }, [
    el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
      el("div", { 
        className: "ee-step-item__icon"
      }, [
        el("span", { 
          className: "material-symbols-outlined",
          text: step.icon 
        })
      ]),
      el("div", {}, [
        el("p", { 
          style: "font-size: 14px; font-weight: 500; color: var(--ee-on-surface); margin-bottom: 2px;"
        }, step.name),
        el("p", { 
          style: "font-size: 12px; color: var(--ee-outline);"
        }, step.time)
      ])
    ]),
    el("button", { 
      style: "font-size: 13px; font-weight: 600; color: var(--ee-primary); display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer;"
    }, [
      "Start",
      el("span", { className: "material-symbols-outlined", style: "font-size: 16px;", text: "arrow_forward" })
    ])
  ]);
}
