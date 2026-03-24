import { el } from "../lib/dom.js";
import { getRoadmapStepStatus, setRoadmapStepStatus } from "../state/implementationStore.js";

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

export function renderRoadmapView({ onNavigate }) {
  // Build a flat lookup of all steps
  const allSteps = PHASES.flatMap(p => p.steps);
  const stepStatusMap = {};
  allSteps.forEach(s => { stepStatusMap[s.id] = getRoadmapStepStatus(`step-${s.id}`); });

  const container = el("div", { className: "max-w-3xl mx-auto space-y-8" });

  function rerender() {
    // Clear and rebuild
    while (container.firstChild) container.removeChild(container.firstChild);

    container.append(
      el("div", { className: "mb-6" }, [
        el("p", { className: "text-xs font-bold uppercase tracking-widest text-secondary mb-1", text: "Odoo 19 Setup" }),
        el("h2", { className: "font-headline text-2xl font-bold text-on-surface", text: "Implementation Roadmap" }),
        el("p", { className: "text-sm text-on-surface-variant mt-1", text: "Follow these phases in order for the best results. Steps with unmet dependencies are locked." })
      ])
    );

    PHASES.forEach(phase => {
      const phaseEl = buildPhase(phase, stepStatusMap, onNavigate, (stepId, status) => {
        stepStatusMap[stepId] = status;
        setRoadmapStepStatus(`step-${stepId}`, status);
        rerender();
      });
      container.append(phaseEl);
    });
  }

  rerender();
  return container;
}

function buildPhase(phase, stepStatusMap, onNavigate, onStatusChange) {
  const colorMap = {
    primary:   { accent: "bg-primary text-on-primary",     connector: "bg-primary",   label: "text-primary" },
    secondary: { accent: "bg-secondary text-on-secondary", connector: "bg-secondary", label: "text-secondary" },
    tertiary:  { accent: "bg-tertiary text-on-tertiary",   connector: "bg-tertiary",  label: "text-tertiary" }
  };
  const c = colorMap[phase.color] || colorMap.primary;

  const completedCount = phase.steps.filter(s => stepStatusMap[s.id] === "complete").length;

  return el("div", { className: "space-y-1" }, [
    // Phase header
    el("div", { className: "flex items-center gap-4 mb-4" }, [
      el("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.accent}` }, [
        el("span", { text: String(PHASES.findIndex(p => p.id === phase.id) + 1) })
      ]),
      el("div", { className: "flex-1" }, [
        el("h3", { className: `font-headline text-base font-bold ${c.label}`, text: phase.label }),
        el("p", { className: "text-xs text-on-surface-variant", text: `${completedCount}/${phase.steps.length} steps complete` })
      ])
    ]),
    // Steps
    el("div", { className: "relative ml-4 pl-8 border-l-2 border-surface-container-high space-y-3" },
      phase.steps.map(step => {
        const status = stepStatusMap[step.id] || "todo";
        const depsOk = step.deps.every(d => stepStatusMap[d] === "complete");
        const locked = !depsOk;

        return buildStep(step, status, locked, c, onNavigate, onStatusChange);
      })
    )
  ]);
}

function buildStep(step, status, locked, colorScheme, onNavigate, onStatusChange) {
  const statusConfig = {
    complete:    { icon: "check_circle", dotClass: "bg-secondary text-on-secondary",        rowClass: "opacity-100" },
    "in-progress":{ icon: "pending",    dotClass: "bg-primary text-on-primary",             rowClass: "opacity-100" },
    todo:        { icon: "radio_button_unchecked", dotClass: "bg-surface-container-highest text-outline", rowClass: locked ? "opacity-40" : "opacity-100" }
  };
  const cfg = statusConfig[status] || statusConfig.todo;

  const card = el("div", {
    className: `relative bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-4 transition-all ${cfg.rowClass} ${locked ? "cursor-not-allowed" : "cursor-pointer hover:shadow-md hover:border-outline-variant/30"}`
  }, [
    // Dot on timeline
    el("div", {
      className: `absolute -left-[2.6rem] top-4 w-5 h-5 rounded-full flex items-center justify-center ${cfg.dotClass} shadow-sm`,
      style: "transform: translateX(-50%)"
    }, [
      el("span", { className: "material-symbols-outlined text-[14px]", text: cfg.icon })
    ]),
    el("div", { className: "flex items-start justify-between gap-3" }, [
      el("div", { className: "flex-1 min-w-0" }, [
        el("div", { className: "flex items-center gap-2 mb-1" }, [
          el("span", { className: "text-[11px] font-bold text-on-surface-variant uppercase tracking-wide", text: `Step ${step.id}` }),
          locked ? el("span", {
            className: "badge badge--neutral text-[10px]",
            text: "Locked"
          }) : null
        ]),
        el("p", { className: "text-sm font-semibold text-on-surface", text: step.title }),
        el("div", { className: "flex items-center gap-3 mt-2" }, [
          el("span", { className: "text-xs text-on-surface-variant flex items-center gap-1" }, [
            el("span", { className: "material-symbols-outlined text-[13px]", text: "schedule" }),
            el("span", { text: step.est })
          ])
        ])
      ]),
      el("div", { className: "flex items-center gap-2 flex-shrink-0" }, [
        statusDropdown(step.id, status, locked, onStatusChange),
        !locked
          ? el("button", {
              className: "text-xs font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg hover:bg-primary-fixed/20 transition-colors",
              onclick: (e) => { e.stopPropagation(); onNavigate("wizard-" + step.wizardId); }
            }, [el("span", { text: "Open →" })])
          : null
      ])
    ])
  ]);

  return card;
}

function statusDropdown(stepId, currentStatus, locked, onStatusChange) {
  const sel = el("select", {
    className: "text-xs font-semibold border border-outline-variant/30 rounded-lg px-2 py-1 bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary",
    disabled: locked ? "disabled" : null,
    onchange: (e) => onStatusChange(stepId, e.target.value)
  }, [
    el("option", { value: "todo",        selected: currentStatus === "todo"        ? "selected" : null, text: "Todo" }),
    el("option", { value: "in-progress", selected: currentStatus === "in-progress" ? "selected" : null, text: "In Progress" }),
    el("option", { value: "complete",    selected: currentStatus === "complete"    ? "selected" : null, text: "Complete" })
  ]);
  return sel;
}
