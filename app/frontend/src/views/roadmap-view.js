import { el } from "../lib/dom.js";
import {
  getGovernedRoadmapStep,
  setGovernedRoadmapStep,
  getCompletedWizards,
  persistActiveProject
} from "../state/app-store.js";

const PHASES = [
  {
    id: "phase-1",
    label: "Phase 1 — Foundation",
    color: "secondary",
    steps: [
      { id: 1, title: "Connect to Odoo 19 instance",     est: "10 min", wizardId: "connection",         deps: [] },
      { id: 2, title: "Company information and settings", est: "15 min", wizardId: "company-setup",      deps: [1] },
      { id: 3, title: "Users and access rights",          est: "20 min", wizardId: "users-access",       deps: [2] },
      { id: 4, title: "Chart of accounts",                est: "25 min", wizardId: "chart-of-accounts",  deps: [2] },
      { id: 5, title: "Fiscal year and tax configuration",est: "15 min", wizardId: "accounting-setup",   deps: [4] }
    ]
  },
  {
    id: "phase-2",
    label: "Phase 2 — Sales & CRM",
    color: "primary",
    steps: [
      { id: 6,  title: "Sales teams and pipeline stages",  est: "20 min", wizardId: "sales-setup",  deps: [3] },
      { id: 7,  title: "Pricelists and currencies",         est: "15 min", wizardId: "sales-setup",  deps: [6] },
      { id: 8,  title: "Customer data import",              est: "30 min", wizardId: "data-import",  deps: [2] },
      { id: 9,  title: "CRM lead sources and tags",         est: "15 min", wizardId: "crm-setup",    deps: [6] },
      { id: 10, title: "Email templates",                   est: "20 min", wizardId: "company-setup",deps: [2] }
    ]
  },
  {
    id: "phase-3",
    label: "Phase 3 — Inventory & Purchasing",
    color: "tertiary",
    steps: [
      { id: 11, title: "Warehouses and locations",          est: "20 min", wizardId: "inventory-setup", deps: [2] },
      { id: 12, title: "Product categories",                est: "15 min", wizardId: "inventory-setup", deps: [11] },
      { id: 13, title: "Products and variants (grid import)",est: "45 min",wizardId: "data-import",     deps: [12] },
      { id: 14, title: "Suppliers and purchase orders",     est: "25 min", wizardId: "purchase-setup",  deps: [11] },
      { id: 15, title: "Reordering rules",                  est: "15 min", wizardId: "inventory-setup", deps: [13, 14] }
    ]
  },
  {
    id: "phase-4",
    label: "Phase 4 — Accounting & Finance",
    color: "secondary",
    steps: [
      { id: 16, title: "Bank accounts and journals",        est: "20 min", wizardId: "accounting-setup",deps: [4] },
      { id: 17, title: "Payment terms",                     est: "10 min", wizardId: "sales-setup",     deps: [4] },
      { id: 18, title: "Tax rules and fiscal positions",    est: "20 min", wizardId: "accounting-setup",deps: [5] },
      { id: 19, title: "Opening balances",                  est: "30 min", wizardId: "data-import",     deps: [16] },
      { id: 20, title: "Invoice templates",                 est: "15 min", wizardId: "accounting-setup",deps: [16] }
    ]
  },
  {
    id: "phase-5",
    label: "Phase 5 — Operations",
    color: "primary",
    steps: [
      { id: 21, title: "Manufacturing routes",              est: "20 min", wizardId: "manufacturing-setup",deps: [11] },
      { id: 22, title: "Bill of materials (grid import)",   est: "40 min", wizardId: "data-import",        deps: [13, 21] },
      { id: 23, title: "HR departments and job positions",  est: "20 min", wizardId: "hr-setup",           deps: [3] },
      { id: 24, title: "Employees (grid import)",           est: "30 min", wizardId: "data-import",        deps: [23] },
      { id: 25, title: "Leave types and payroll rules",     est: "25 min", wizardId: "hr-setup",           deps: [23] }
    ]
  },
  {
    id: "phase-6",
    label: "Phase 6 — Go-Live Checks",
    color: "tertiary",
    steps: [
      { id: 26, title: "User acceptance testing checklist",est: "60 min", wizardId: "dashboard",         deps: [5, 15, 20, 25] },
      { id: 27, title: "Data validation",                   est: "30 min", wizardId: "analytics",         deps: [26] },
      { id: 28, title: "Security audit",                    est: "30 min", wizardId: "users-access",      deps: [3] },
      { id: 29, title: "Backup configuration",              est: "20 min", wizardId: "dashboard",         deps: [26] },
      { id: 30, title: "Go-live sign-off",                  est: "15 min", wizardId: "dashboard",         deps: [26, 27, 28, 29] }
    ]
  }
];

/**
 * Derive initial step status from completed wizards.
 * If a step's wizard has been completed, auto-promote the step to "complete"
 * unless the user has manually set a different status.
 */
function deriveStepStatus(stepId, wizardId, completedWizards) {
  const governedStatus = getGovernedRoadmapStep(`step-${stepId}`);
  // If already explicitly set in governed state, use that
  if (governedStatus !== "todo") {
    return governedStatus;
  }
  // Auto-derive from wizard completion
  if (completedWizards.includes(wizardId)) {
    return "complete";
  }
  return "todo";
}

export function renderRoadmapView({ onNavigate }) {
  const allSteps = PHASES.flatMap(p => p.steps);
  const completedWizards = getCompletedWizards();
  const stepStatusMap = {};
  allSteps.forEach(s => {
    stepStatusMap[s.id] = deriveStepStatus(s.id, s.wizardId, completedWizards);
  });

  const container = el("div", { style: "max-width: 800px; margin: 0 auto; padding: 32px;" });

  function rerender() {
    while (container.firstChild) container.removeChild(container.firstChild);

    container.append(
      el("div", { style: "margin-bottom: 32px;" }, [
        el("p", { style: "font-family: var(--font-label); font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-primary); margin-bottom: 4px;", text: "PROJECTODOO" }),
        el("h2", { style: "font-family: var(--font-headline); font-size: 28px; font-weight: 700; color: var(--color-on-surface); letter-spacing: var(--ls-snug); margin-bottom: 8px;", text: "Your Odoo Journey" }),
        el("p", { style: "font-family: var(--font-body); font-size: 14px; color: var(--color-on-surface-variant); margin-top: 4px;", text: "Follow these phases in order. Progress saves automatically. ProjectOdoo guides you every step of the way." })
      ])
    );

    PHASES.forEach(phase => {
      const phaseEl = buildPhase(phase, stepStatusMap, onNavigate, (stepId, status) => {
        stepStatusMap[stepId] = status;
        // Persist to governed state (not localStorage)
        setGovernedRoadmapStep(`step-${stepId}`, status);
        // Persist to backend
        persistActiveProject();
        rerender();
      });
      container.append(phaseEl);
    });
  }

  rerender();
  return container;
}

function buildPhase(phase, stepStatusMap, onNavigate, onStatusChange) {
  const completedCount = phase.steps.filter(s => stepStatusMap[s.id] === "complete").length;

  return el("div", { style: "margin-bottom: 32px;" }, [
    // Phase header
    el("div", { style: "display: flex; align-items: center; gap: 16px; margin-bottom: 16px;" }, [
      el("div", {
        style: "width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--color-primary); color: var(--color-on-primary); font-family: var(--font-label); font-size: 12px; font-weight: 700; flex-shrink: 0;"
      }, [
        el("span", { text: String(PHASES.findIndex(p => p.id === phase.id) + 1) })
      ]),
      el("div", { style: "flex: 1;" }, [
        el("h3", { style: "font-family: var(--font-label); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-primary); margin-bottom: 2px;", text: phase.label }),
        el("p", { style: "font-family: var(--font-body); font-size: 12px; color: var(--color-on-surface-variant);", text: `${completedCount}/${phase.steps.length} steps complete` })
      ])
    ]),
    // Steps
    el("div", { style: "position: relative; margin-left: 16px; padding-left: 32px; border-left: 2px solid var(--color-surface-container-high); display: flex; flex-direction: column; gap: 12px;" },
      phase.steps.map(step => {
        const status = stepStatusMap[step.id] || "todo";
        const depsOk = step.deps.every(d => stepStatusMap[d] === "complete");
        const locked = !depsOk;

        return buildStep(step, status, locked, onNavigate, onStatusChange);
      })
    )
  ]);
}

function buildStep(step, status, locked, onNavigate, onStatusChange) {
  const statusConfig = {
    complete:    { icon: "check", bg: "#059669", color: "#ffffff" },
    "in-progress":{ icon: String(step.id), bg: "var(--color-primary)", color: "#ffffff" },
    todo:        { icon: String(step.id), bg: "transparent", color: "var(--color-on-surface-variant)", border: "1.5px solid var(--color-outline-variant)" }
  };
  const cfg = statusConfig[status] || statusConfig.todo;

  const card = el("div", {
    style: `position: relative; background: var(--color-surface); box-shadow: var(--shadow-sm); padding: 16px 20px; display: flex; align-items: center; gap: 16px; transition: all 150ms ease; ${locked ? "opacity: 0.4; cursor: not-allowed;" : "cursor: pointer;"}`,
    onclick: () => { if (!locked) onNavigate("wizard-" + step.wizardId); }
  }, [
    // Dot on timeline
    el("div", {
      style: `position: absolute; left: -41px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: ${cfg.bg}; color: ${cfg.color}; border: ${cfg.border || "none"}; font-family: var(--font-label); font-size: ${status === "complete" ? "16px" : "12px"}; font-weight: 700;`
    }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 16px;", text: cfg.icon })
    ]),
    el("div", { style: "flex: 1; min-width: 0;" }, [
      el("div", { style: "display: flex; align-items: center; gap: 8px; margin-bottom: 4px;" }, [
        el("span", { style: "font-family: var(--font-label); font-size: 10px; font-weight: 700; color: var(--color-on-surface-variant); text-transform: uppercase; letter-spacing: var(--ls-wide);", text: `Step ${step.id}` }),
        locked ? el("span", { style: "font-size: 10px; padding: 2px 6px; background: var(--color-surface-container-high); color: var(--color-on-surface-variant); font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide);", text: "Locked" }) : null
      ]),
      el("p", { style: "font-family: var(--font-body); font-size: 14px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 2px;", text: step.title }),
      el("div", { style: "display: flex; align-items: center; gap: 12px; margin-top: 4px;" }, [
        el("span", { style: "font-family: var(--font-body); font-size: 11px; color: var(--color-on-surface-variant); display: flex; align-items: center; gap: 4px;" }, [
          el("span", { className: "material-symbols-outlined", style: "font-size: 13px;", text: "schedule" }),
          el("span", { text: step.est })
        ])
      ])
    ]),
    el("div", { style: "display: flex; align-items: center; gap: 12px; flex-shrink: 0;" }, [
      statusDropdown(step.id, status, locked, onStatusChange),
      !locked
        ? el("button", {
            style: "font-family: var(--font-label); font-size: 12px; font-weight: 600; color: var(--color-primary); background: none; border: none; cursor: pointer; text-decoration: none; padding: 4px 8px;",
            onmouseenter: (e) => e.target.style.textDecoration = "underline",
            onmouseleave: (e) => e.target.style.textDecoration = "none",
            onclick: (e) => { e.stopPropagation(); onNavigate("wizard-" + step.wizardId); }
          }, [el("span", { text: "Open →" })])
        : el("span", { className: "material-symbols-outlined", style: "font-size: 18px; color: var(--color-on-surface-variant);", text: "lock" })
    ])
  ]);

  return card;
}

function statusDropdown(stepId, currentStatus, locked, onStatusChange) {
  const sel = el("select", {
    style: "font-family: var(--font-label); font-size: 11px; font-weight: 600; border: 1px solid var(--color-outline-variant); padding: 4px 8px; background: var(--color-surface-container-low); color: var(--color-on-surface); cursor: pointer;",
    disabled: locked ? "disabled" : null,
    onchange: (e) => onStatusChange(stepId, e.target.value)
  }, [
    el("option", { value: "todo",        selected: currentStatus === "todo"        ? "selected" : null, text: "Todo" }),
    el("option", { value: "in-progress", selected: currentStatus === "in-progress" ? "selected" : null, text: "In Progress" }),
    el("option", { value: "complete",    selected: currentStatus === "complete"    ? "selected" : null, text: "Complete" })
  ]);
  return sel;
}
