import { el } from "../lib/dom.js";
import {
  getState,
  getModuleCompletionStatus,
  getGovernedRoadmapSteps,
  getCompletedWizards
} from "../state/app-store.js";
import { getImplementationState } from "../state/implementationStore.js";

const MODULES = [
  { id: "company-setup", name: "Company Setup", icon: "business", wizardId: "company-setup" },
  { id: "users-access", name: "Users & Access", icon: "manage_accounts", wizardId: "users-access" },
  { id: "chart-of-accounts", name: "Chart of Accounts", icon: "account_balance", wizardId: "chart-of-accounts" },
  { id: "sales-setup", name: "Sales", icon: "sell", wizardId: "sales-setup" },
  { id: "crm-setup", name: "CRM", icon: "person_pin", wizardId: "crm-setup" },
  { id: "inventory-setup", name: "Inventory", icon: "inventory_2", wizardId: "inventory-setup" },
  { id: "accounting-setup", name: "Accounting", icon: "account_balance", wizardId: "accounting-setup" },
  { id: "purchase-setup", name: "Purchase", icon: "shopping_cart", wizardId: "purchase-setup" },
  { id: "manufacturing-setup", name: "Manufacturing", icon: "precision_manufacturing", wizardId: "manufacturing-setup" },
  { id: "hr-setup", name: "HR & Payroll", icon: "badge", wizardId: "hr-setup" },
  { id: "website-setup", name: "Website & eCommerce", icon: "language", wizardId: "website-setup" },
  { id: "pos-setup", name: "Point of Sale", icon: "point_of_sale", wizardId: "pos-setup" }
];

const NEXT_STEPS = [
  { id: "company-setup", name: "Company Setup", icon: "business", time: "5 min", wizardId: "company-setup" },
  { id: "users-access", name: "Users & Access", icon: "people", time: "10 min", wizardId: "users-access" },
  { id: "chart-of-accounts", name: "Chart of Accounts", icon: "account_balance", time: "15 min", wizardId: "chart-of-accounts" }
];

/**
 * Compute KPI values from governed state and implementationStore
 */
function computeKpis() {
  const moduleStatus = getModuleCompletionStatus();
  const roadmapSteps = getGovernedRoadmapSteps();
  const implState = getImplementationState();
  const importedData = implState.importedData || {};

  // Count completed roadmap steps
  const allStepIds = [];
  for (let i = 1; i <= 30; i++) allStepIds.push(`step-${i}`);
  const completedSteps = allStepIds.filter(id => roadmapSteps[id] === "complete").length;
  // Also count steps auto-derived from completed wizards (handled in roadmap-view)
  const totalSteps = 30;

  // Count imported data records
  const totalImported = Object.values(importedData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  // Compute estimated time remaining (each incomplete step ~18min avg)
  const remainingSteps = totalSteps - completedSteps;
  const estMinutes = remainingSteps * 18;
  const estHours = Math.round(estMinutes / 60);
  const estTimeLabel = estMinutes < 60 ? `~${estMinutes}m` : `~${estHours}h`;

  // Compute overall progress percentage
  const wizardWeight = 0.6; // wizards are 60% of progress
  const stepsWeight = 0.4;  // roadmap steps are 40%
  const wizardPct = moduleStatus.total > 0 ? moduleStatus.completed / moduleStatus.total : 0;
  const stepsPct = totalSteps > 0 ? completedSteps / totalSteps : 0;
  const overallPct = Math.round((wizardPct * wizardWeight + stepsPct * stepsWeight) * 100);

  return {
    modulesConfigured: `${moduleStatus.completed}/${moduleStatus.total}`,
    dataImported: totalImported > 0 ? `${totalImported} records` : "0 records",
    stepsComplete: `${completedSteps}/${totalSteps}`,
    estTimeRemaining: estTimeLabel,
    overallProgress: overallPct
  };
}

/**
 * Find next recommended steps (first 3 incomplete wizards)
 */
function computeNextSteps() {
  const completed = getCompletedWizards();
  return MODULES
    .filter(m => !completed.includes(m.id))
    .slice(0, 3)
    .map(m => ({ id: m.id, name: m.name, icon: m.icon, time: "15 min", wizardId: m.wizardId }));
}

export function renderImplementationDashboardView({ onNavigate, onOpenRoadmap }) {
  const kpis = computeKpis();
  const nextSteps = computeNextSteps();
  const completedWizards = getCompletedWizards();

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
      // KPI Cards Row
      el("div", {
        style: "display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;"
      }, [
        renderKpiCard(kpis.modulesConfigured, "Modules Configured", "settings"),
        renderKpiCard(kpis.dataImported, "Data Imported", "database"),
        renderKpiCard(kpis.stepsComplete, "Steps Complete", "checklist"),
        renderKpiCard(kpis.estTimeRemaining, "Est. Time Remaining", "schedule")
      ]),

      // Implementation Progress Section
      renderProgressSection(handleModuleClick, completedWizards, kpis.overallProgress)
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
          }, "CONTINUE YOUR JOURNEY"),
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
        }, nextSteps.length > 0
          ? nextSteps.map(step => renderNextStepItem(step, onNavigate))
          : [el("p", { style: "font-size: 13px; color: var(--ee-outline); padding: 8px;" }, "All modules configured!")]
        )
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

function renderProgressSection(onModuleClick, completedWizards, overallProgress) {
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
      }, `${overallProgress}%`)
    ]),

    // Progress Bar
    el("div", {
      style: "height: 4px; background: var(--ee-surface-container); overflow: hidden;"
    }, [
      el("div", {
        style: `height: 100%; width: ${overallProgress}%; background: var(--ee-primary); transition: width 300ms ease;`
      })
    ]),

    // Module List (2-column grid)
    el("div", {
      style: "display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 8px;"
    }, MODULES.map(module => renderModuleItem(module, onModuleClick, completedWizards)))
  ]);
}

function renderModuleItem(module, onClick, completedWizards) {
  const isComplete = completedWizards.includes(module.id);
  const statusLabel = isComplete ? "COMPLETE" : "NOT STARTED";
  const statusStyle = isComplete
    ? "font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 10px; background: #059669; color: white; border: none;"
    : "font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 10px; background: var(--ee-surface-container-high); color: var(--ee-outline); border: 1px solid var(--ee-outline-variant);";

  return el("div", {
    className: "ee-module-item",
    style: `padding: 16px; display: flex; align-items: center; justify-content: space-between; background: var(--ee-surface-container); cursor: pointer; transition: all 150ms ease; border-left: 3px solid ${isComplete ? "#059669" : "transparent"};`,
    onmouseenter: (e) => {
      e.currentTarget.style.background = "var(--ee-surface-container-high)";
      if (!isComplete) e.currentTarget.style.borderLeftColor = "var(--ee-primary)";
    },
    onmouseleave: (e) => {
      e.currentTarget.style.background = "var(--ee-surface-container)";
      if (!isComplete) e.currentTarget.style.borderLeftColor = "transparent";
    },
    onclick: () => onClick && onClick(module.wizardId)
  }, [
    el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
      el("div", {
        style: `width: 36px; height: 36px; ${isComplete ? "background: #059669;" : "background: var(--ee-primary-subtle);"} display: flex; align-items: center; justify-content: center;`
      }, [
        el("span", {
          className: "material-symbols-outlined",
          style: `font-size: 18px; ${isComplete ? "color: white;" : "color: var(--ee-primary);"}`,
          text: isComplete ? "check" : module.icon
        })
      ]),
      el("span", {
        style: "font-size: 14px; font-weight: 500; color: var(--ee-on-surface);"
      }, module.name)
    ]),
    el("span", {
      className: "ee-badge",
      style: statusStyle
    }, statusLabel)
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
