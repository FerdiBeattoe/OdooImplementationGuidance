import { el } from "../lib/dom.js";

const MODULES = [
  { id: "company-setup", name: "Company Setup", icon: "business", wizardId: "company" },
  { id: "sales", name: "Sales", icon: "shopping_cart", wizardId: "sales" },
  { id: "crm", name: "CRM", icon: "people", wizardId: "crm" },
  { id: "inventory", name: "Inventory", icon: "inventory_2", wizardId: "inventory" },
  { id: "accounting", name: "Accounting", icon: "account_balance", wizardId: "accounting" },
  { id: "purchase", name: "Purchase", icon: "shopping_bag", wizardId: "purchase" },
  { id: "manufacturing", name: "Manufacturing", icon: "precision_manufacturing", wizardId: "manufacturing" },
  { id: "hr", name: "HR", icon: "badge", wizardId: "hr" },
  { id: "website", name: "Website", icon: "language", wizardId: "website" },
  { id: "pos", name: "Point of Sale", icon: "point_of_sale", wizardId: "pos" },
  { id: "email", name: "Email & Communication", icon: "email", wizardId: "email" },
  { id: "reporting", name: "Reporting", icon: "assessment", wizardId: "reporting" }
];

const NEXT_STEPS = [
  { id: "company", name: "Company Setup", icon: "business", time: "5 min", wizardId: "company" },
  { id: "users", name: "Users & Access", icon: "people", time: "10 min", wizardId: "users" },
  { id: "accounts", name: "Chart of Accounts", icon: "account_balance", time: "15 min", wizardId: "accounting" }
];

export function renderImplementationDashboardView({ onNavigate, onOpenRoadmap }) {
  // Handle navigation to wizard
  const handleModuleClick = (wizardId) => {
    if (wizardId && onNavigate) {
      onNavigate(`wizard-${wizardId}`);
    }
  };

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
      renderProgressSection(handleModuleClick)
    ]),
    
    // Right Sidebar
    el("div", { 
      style: "grid-column: span 1; display: flex; flex-direction: column; gap: 24px;"
    }, [
      // Jump Back In Card
      el("div", { 
        className: "ee-card ee-card--accent",
        style: "padding: 24px; display: flex; flex-direction: column; gap: 16px; background: linear-gradient(135deg, #714B67 0%, #57344f 100%);"
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
          style: "background: white; color: #714B67; font-weight: 600;",
          onclick: () => onNavigate("implementation-roadmap")
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

function renderProgressSection(onModuleClick) {
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
    }, MODULES.map(module => renderModuleItem(module, onModuleClick)))
  ]);
}

function renderModuleItem(module, onClick) {
  return el("div", { 
    className: "ee-module-item",
    style: "padding: 16px; display: flex; align-items: center; justify-content: space-between; background: var(--ee-surface-container); cursor: pointer; transition: all 150ms ease; border-left: 3px solid transparent;",
    onmouseenter: (e) => {
      e.currentTarget.style.background = "var(--ee-surface-container-high)";
      e.currentTarget.style.borderLeftColor = "var(--ee-primary)";
    },
    onmouseleave: (e) => {
      e.currentTarget.style.background = "var(--ee-surface-container)";
      e.currentTarget.style.borderLeftColor = "transparent";
    },
    onclick: () => onClick && onClick(module.wizardId)
  }, [
    el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
      el("div", { 
        style: "width: 36px; height: 36px; background: var(--ee-primary-subtle); display: flex; align-items: center; justify-content: center;"
      }, [
        el("span", { 
          className: "material-symbols-outlined",
          style: "font-size: 18px; color: var(--ee-primary);",
          text: module.icon 
        })
      ]),
      el("span", { 
        style: "font-size: 14px; font-weight: 500; color: var(--ee-on-surface);"
      }, module.name)
    ]),
    el("span", { 
      className: "ee-badge ee-badge--neutral",
      style: "font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 10px; background: var(--ee-surface-container-high); color: var(--ee-outline); border: 1px solid var(--ee-outline-variant);"
    }, "NOT STARTED")
  ]);
}

function renderNextStepItem(step, onNavigate) {
  return el("div", { 
    style: "display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--ee-surface-container); cursor: pointer; transition: all 150ms ease; border-left: 3px solid transparent;",
    onmouseenter: (e) => {
      e.currentTarget.style.background = "var(--ee-surface-container-high)";
      e.currentTarget.style.borderLeftColor = "var(--ee-primary)";
    },
    onmouseleave: (e) => {
      e.currentTarget.style.background = "var(--ee-surface-container)";
      e.currentTarget.style.borderLeftColor = "transparent";
    },
    onclick: () => onNavigate && onNavigate(`wizard-${step.wizardId}`)
  }, [
    el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
      el("div", { 
        style: "width: 32px; height: 32px; background: var(--ee-primary-subtle); display: flex; align-items: center; justify-content: center;"
      }, [
        el("span", { 
          className: "material-symbols-outlined",
          style: "font-size: 16px; color: var(--ee-primary);",
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
