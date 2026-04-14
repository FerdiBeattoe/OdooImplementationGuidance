import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import {
  getState,
  getModuleCompletionStatus,
  getGovernedRoadmapSteps,
  getCompletedWizards
} from "../state/app-store.js";
import { getImplementationState } from "../state/implementationStore.js";
import { pipelineStore } from "../state/pipeline-store.js";

const MODULES = [
  { id: "users-access", name: "Users & Roles", icon: "users", wizardId: "users-access" },
  { id: "master-data-setup", name: "Master Data", icon: "database", wizardId: "master-data-setup" },
  { id: "crm-setup", name: "CRM", icon: "target", wizardId: "crm-setup" },
  { id: "sales-setup", name: "Sales", icon: "tag", wizardId: "sales-setup" },
  { id: "purchase-setup", name: "Purchase", icon: "shopping-cart", wizardId: "purchase-setup" },
  { id: "accounting-setup", name: "Accounting", icon: "calculator", wizardId: "accounting-setup" },
  { id: "manufacturing-setup", name: "Manufacturing", icon: "factory", wizardId: "manufacturing-setup" },
  { id: "pos-setup", name: "Point of Sale", icon: "monitor", wizardId: "pos-setup" },
  { id: "website-setup", name: "Website & eCommerce", icon: "globe", wizardId: "website-setup" },
  { id: "projects-setup", name: "Projects", icon: "briefcase", wizardId: "projects-setup" },
  { id: "quality-setup", name: "Quality", icon: "shield-check", wizardId: "quality-setup" },
  { id: "inventory-setup", name: "Inventory", icon: "package", wizardId: "inventory-setup" },
  { id: "hr-setup", name: "HR", icon: "user-check", wizardId: "hr-setup" },
  { id: "plm-setup", name: "PLM", icon: "git-branch", wizardId: "plm-setup" },
  { id: "documents-setup", name: "Documents", icon: "folder", wizardId: "documents-setup" },
  { id: "sign-setup", name: "Sign", icon: "pen-tool", wizardId: "sign-setup" },
  { id: "approvals-setup", name: "Approvals", icon: "check-circle", wizardId: "approvals-setup" },
  { id: "subscriptions-setup", name: "Subscriptions", icon: "repeat", wizardId: "subscriptions-setup" },
  { id: "field-service-setup", name: "Field Service", icon: "wrench", wizardId: "field-service-setup" }
];

const NEXT_STEPS = [
  { id: "users-access", name: "Users & Roles", icon: "users", time: "10 min", wizardId: "users-access" },
  { id: "master-data-setup", name: "Master Data", icon: "database", time: "15 min", wizardId: "master-data-setup" },
  { id: "crm-setup", name: "CRM", icon: "target", time: "15 min", wizardId: "crm-setup" }
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

  // Determine if onboarding is incomplete
  const psState = pipelineStore.getState();
  const hasActivatedDomains = (psState.runtime_state?.activated_domains ?? []).length > 0;
  const onboardingIncomplete = !hasActivatedDomains && completedWizards.length === 0;

  return el("div", {
    style: "display: flex; flex-direction: column; gap: 0;"
  }, [
    // Onboarding banner (shown only when onboarding is incomplete)
    onboardingIncomplete
      ? el("div", {
          style: "background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;",
          dataset: { testid: "onboarding-banner" },
        }, [
          el("div", {}, [
            el("h3", {
              style: "font-size: 16px; font-weight: 600; color: #0c1a30; margin: 0 0 4px;",
            }, "Complete your business assessment"),
            el("p", {
              style: "font-size: 13px; color: #64748b; margin: 0;",
            }, "Answer 34 questions about your business to activate your Odoo implementation domains."),
          ]),
          el("button", {
            style: "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-weight: 600; font-size: 14px; padding: 10px 24px; cursor: pointer; white-space: nowrap; margin-left: 24px;",
            onclick: () => { if (onNavigate) onNavigate("onboarding"); },
            dataset: { testid: "onboarding-banner-cta" },
          }, "Start assessment \u2192"),
        ])
      : null,

    el("div", {
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
        renderKpiCard(kpis.dataImported, "Data Imported", "upload"),
        renderKpiCard(kpis.stepsComplete, "Steps Complete", "check-circle"),
        renderKpiCard(kpis.estTimeRemaining, "Est. Time Remaining", "clock")
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
        style: "background: #0c1a30; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 16px;"
      }, [
        el("div", {}, [
          el("p", {
            style: "font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(245,158,11,0.8); margin-bottom: 8px;"
          }, "CONTINUE YOUR JOURNEY"),
          el("h3", {
            style: "font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 16px;"
          }, "Jump Back In")
        ]),
        el("button", {
          style: "background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b; border-radius: 6px; font-weight: 600; font-size: 13px; padding: 8px 16px; cursor: pointer; width: 100%;",
          onclick: () => onNavigate("implementation-roadmap")
        }, "Open Roadmap")
      ]),

      // Next Steps Section
      el("div", {
        style: "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;"
      }, [
        el("h4", {
          style: "font-size: 11px; letter-spacing: 0.1em; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 12px;"
        }, "NEXT STEPS"),
        el("div", {
          style: "display: flex; flex-direction: column; gap: 0;"
        }, nextSteps.length > 0
          ? nextSteps.map(step => renderNextStepItem(step, onNavigate))
          : [el("p", { style: "font-size: 13px; color: #64748b; padding: 8px;" }, "All modules configured!")]
        )
      ])
    ])
  ]),
  ]);
}

function renderKpiCard(value, label, icon) {
  return el("div", {
    style: "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; flex: 1; display: flex; flex-direction: column; gap: 8px; position: relative;"
  }, [
    el("div", {
      style: "position: absolute; top: 20px; right: 20px; color: #f59e0b; opacity: 0.7;"
    }, [
      lucideIcon(icon, 20)
    ]),
    el("div", {
      style: "font-family: Inter, sans-serif; font-size: 28px; font-weight: 700; color: #0c1a30; line-height: 1;"
    }, value),
    el("p", {
      style: "font-size: 12px; color: #64748b; margin-top: 4px;"
    }, label)
  ]);
}

function renderProgressSection(onModuleClick, completedWizards, overallProgress) {
  return el("div", {
    style: "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 32px; display: flex; flex-direction: column; gap: 24px;"
  }, [
    // Header with Progress
    el("div", {
      style: "display: flex; align-items: baseline; gap: 12px;"
    }, [
      el("h2", {
        style: "font-size: 16px; font-weight: 600; color: #0c1a30;"
      }, "Implementation Progress"),
      el("span", {
        style: "font-size: 24px; font-weight: 700; color: #f59e0b;"
      }, `${overallProgress}%`)
    ]),

    // Progress Bar
    el("div", {
      style: "height: 6px; background: #f1f5f9; border-radius: 4px; overflow: hidden;"
    }, [
      el("div", {
        style: `height: 100%; width: ${overallProgress}%; background: #f59e0b; border-radius: 4px; transition: width 300ms ease;`
      })
    ]),

    // Module List (2-column grid)
    el("div", {
      style: "display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 8px;"
    }, MODULES.map(module => renderModuleItem(module, onModuleClick, completedWizards)))
  ]);
}

function renderModuleItem(module, onClick, completedWizards) {
  const isComplete = completedWizards.includes(module.id);
  const statusLabel = isComplete ? "COMPLETE" : "NOT STARTED";
  const statusStyle = isComplete
    ? "display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #065f46; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 6px; padding: 2px 8px; margin-left: auto; flex-shrink: 0;"
    : "display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.1); border-radius: 6px; padding: 2px 8px; margin-left: auto; flex-shrink: 0;";

  const card = el("div", {
    style: "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: border-color 0.15s;",
    onclick: () => onClick && onClick(module.wizardId)
  }, [
    el("div", {
      style: `background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); border-radius: 10px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${isComplete ? "#065f46" : "#92400e"};`
    }, [
      lucideIcon(isComplete ? "check" : module.icon, 20)
    ]),
    el("span", {
      style: "font-size: 15px; font-weight: 600; color: #0c1a30; font-family: Inter, sans-serif;"
    }, module.name),
    el("span", { style: statusStyle }, statusLabel)
  ]);

  card.onmouseenter = () => { card.style.borderColor = "#f59e0b"; };
  card.onmouseleave = () => { card.style.borderColor = "#e2e8f0"; };

  return card;
}

function renderNextStepItem(step, onNavigate) {
  return el("div", {
    style: "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;",
    onclick: () => onNavigate && onNavigate(`wizard-${step.wizardId}`)
  }, [
    el("div", {}, [
      el("p", {
        style: "font-size: 13px; font-weight: 500; color: #0c1a30; margin: 0 0 2px;"
      }, step.name),
      el("p", {
        style: "font-size: 11px; color: #94a3b8; margin: 0;"
      }, step.time)
    ]),
    el("button", {
      style: "font-size: 12px; font-weight: 600; color: #92400e; cursor: pointer; background: none; border: none; padding: 0;"
    }, "Start \u2192")
  ]);
}
