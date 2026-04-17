import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import {
  getGovernedRoadmapStep,
  setGovernedRoadmapStep,
  getCompletedWizards,
  persistActiveProject
} from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";

const CANVAS_STYLE =
  "min-height: 100vh; background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), var(--color-canvas-base), var(--surface-texture); padding: var(--space-8) var(--space-5) var(--space-16); font-family: var(--font-body); color: var(--color-ink); box-sizing: border-box;";

const COLUMN_STYLE =
  "max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-7);";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; padding: 4px 12px; border: 1px solid var(--color-line); border-radius: var(--radius-pill); background: var(--color-surface); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle);";

const HERO_H1 =
  "font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 600; letter-spacing: var(--track-tight); line-height: var(--lh-snug); color: var(--color-ink); margin: 0;";

const HERO_SUB =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0; line-height: var(--lh-body);";

const PANEL_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-5) var(--space-6);";

const PHASE_RAIL_STYLE =
  "display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); overflow-x: auto;";

const PHASE_RAIL_DOT =
  "width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;";

const PHASE_RAIL_LINE =
  "flex: 1; height: 1px; background: var(--color-line); min-width: 20px;";

const PILL_PRIMARY =
  "display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); border: 1px solid var(--color-pill-primary-bg); font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; cursor: pointer; transition: all var(--dur-base) var(--ease);";

const PILL_SECONDARY =
  "display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); border: 1px solid var(--color-pill-secondary-border); font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; cursor: pointer; transition: all var(--dur-base) var(--ease);";

const CHIP_STYLE =
  "display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--radius-pill); background: var(--color-chip-bg); color: var(--color-chip-fg); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow);";

const CHIP_READY =
  "display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--radius-pill); background: var(--color-chip-ready-bg); color: var(--color-chip-ready-fg); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow);";

const CHIP_REVIEW =
  "display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--radius-pill); background: var(--color-chip-review-bg); color: var(--color-chip-review-fg); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow);";

const PHASES = [
  {
    id: "phase-1",
    label: "Phase 1 — Foundation",
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
    steps: [
      { id: 26, title: "User acceptance testing checklist",est: "60 min", wizardId: "dashboard",         deps: [5, 15, 20, 25] },
      { id: 27, title: "Data validation",                   est: "30 min", wizardId: "analytics",         deps: [26] },
      { id: 28, title: "Security audit",                    est: "30 min", wizardId: "users-access",      deps: [3] },
      { id: 29, title: "Backup configuration",              est: "20 min", wizardId: "dashboard",         deps: [26] },
      { id: 30, title: "Go-live sign-off",                  est: "15 min", wizardId: "dashboard",         deps: [26, 27, 28, 29] }
    ]
  }
];

function deriveStepStatus(stepId, wizardId, completedWizards) {
  const governedStatus = getGovernedRoadmapStep(`step-${stepId}`);
  if (governedStatus !== "todo") {
    return governedStatus;
  }
  if (completedWizards.includes(wizardId)) {
    return "complete";
  }
  return "todo";
}

function derivePhaseStatus(phase, stepStatusMap) {
  const done = phase.steps.filter(s => stepStatusMap[s.id] === "complete").length;
  if (done === 0) return "future";
  if (done === phase.steps.length) return "done";
  return "current";
}

function getInstanceHost() {
  const state = onboardingStore.getState();
  const url = state?.connection?.url || "";
  if (!url) return "";
  try { return new URL(url).host; }
  catch { return String(url).replace(/^https?:\/\//i, "").split("/")[0]; }
}

export function renderRoadmapView({ onNavigate }) {
  const allSteps = PHASES.flatMap(p => p.steps);
  const completedWizards = getCompletedWizards();
  const stepStatusMap = {};
  allSteps.forEach(s => {
    stepStatusMap[s.id] = deriveStepStatus(s.id, s.wizardId, completedWizards);
  });

  const canvas = el("div", { style: CANVAS_STYLE });
  const container = el("div", { style: COLUMN_STYLE });
  canvas.append(container);

  function rerender() {
    while (container.firstChild) container.removeChild(container.firstChild);

    const instanceHost = getInstanceHost();
    const eyebrowText = instanceHost ? `ROADMAP · ${instanceHost}` : "ROADMAP";

    const totalDone = allSteps.filter(s => stepStatusMap[s.id] === "complete").length;
    const totalPct = Math.round((totalDone / allSteps.length) * 100);

    container.append(
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" }, [
        el("span", { style: EYEBROW_STYLE, text: eyebrowText }),
        el("h1", { style: HERO_H1 }, [
          el("span", { text: "Your implementation " }),
          el("span", { style: "color: var(--color-muted);", text: "journey" })
        ]),
        el("p", { style: HERO_SUB, text: `${totalDone} of ${allSteps.length} steps complete · ${totalPct}% done` })
      ])
    );

    const rail = el("div", { style: PHASE_RAIL_STYLE });
    PHASES.forEach((phase, idx) => {
      const status = derivePhaseStatus(phase, stepStatusMap);
      const dotBg = status === "done"
        ? "background: var(--color-ink);"
        : status === "current"
          ? "background: var(--color-ink); border: 2px solid var(--color-ink);"
          : "background: var(--color-surface); border: 1px solid var(--color-muted);";
      rail.append(el("div", { style: `${PHASE_RAIL_DOT} ${dotBg}`, title: phase.label }));
      if (idx < PHASES.length - 1) {
        rail.append(el("div", { style: PHASE_RAIL_LINE }));
      }
    });
    container.append(rail);

    PHASES.forEach((phase, idx) => {
      const phaseEl = buildPhase(phase, idx, stepStatusMap, onNavigate, (stepId, status) => {
        stepStatusMap[stepId] = status;
        setGovernedRoadmapStep(`step-${stepId}`, status);
        persistActiveProject();
        rerender();
      });
      container.append(phaseEl);
    });

    container.append(
      el("div", { style: `${PANEL_STYLE} display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap;` }, [
        el("div", {}, [
          el("div", { style: "font-family: var(--font-body); font-size: var(--fs-tiny); text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle); margin-bottom: 4px;", text: "GO-LIVE READINESS" }),
          el("div", { style: "font-family: var(--font-mono); font-size: var(--fs-body); color: var(--color-ink);", text: totalDone === allSteps.length ? "All phases complete. Ready for sign-off." : `${allSteps.length - totalDone} steps remaining across phases.` })
        ]),
        el("button", {
          style: PILL_PRIMARY,
          onclick: () => onNavigate && onNavigate("dashboard")
        }, [el("span", { text: "Open dashboard" })])
      ])
    );
  }

  rerender();
  return canvas;
}

function buildPhase(phase, phaseIdx, stepStatusMap, onNavigate, onStatusChange) {
  const completedCount = phase.steps.filter(s => stepStatusMap[s.id] === "complete").length;
  const status = derivePhaseStatus(phase, stepStatusMap);
  const leftBorderColor = status === "current"
    ? "var(--color-ink)"
    : status === "done"
      ? "var(--color-line)"
      : "var(--color-muted)";

  return el("div", {
    style: `${PANEL_STYLE} display: flex; flex-direction: column; gap: var(--space-3); border-left: 3px solid ${leftBorderColor};`
  }, [
    el("div", { style: "display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap;" }, [
      el("div", { style: "display: flex; flex-direction: column; gap: 4px;" }, [
        el("span", { style: "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle);", text: `PHASE ${phaseIdx + 1} OF ${PHASES.length}` }),
        el("h2", { style: "font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 500; color: var(--color-ink); letter-spacing: var(--track-tight); margin: 0;", text: phase.label }),
        el("p", { style: "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0;", text: `${completedCount} of ${phase.steps.length} steps complete` })
      ]),
      el("span", {
        style: status === "done" ? CHIP_READY : status === "current" ? CHIP_REVIEW : CHIP_STYLE,
        text: status === "done" ? "Complete" : status === "current" ? "In progress" : "Not started"
      })
    ]),
    el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" },
      phase.steps.map(step => {
        const stepStatus = stepStatusMap[step.id] || "todo";
        const depsOk = step.deps.every(d => stepStatusMap[d] === "complete");
        const locked = !depsOk;
        return buildStep(step, stepStatus, locked, onNavigate, onStatusChange);
      })
    )
  ]);
}

function buildStep(step, status, locked, onNavigate, onStatusChange) {
  const dotStyle = status === "complete"
    ? "width: 12px; height: 12px; border-radius: 50%; background: var(--color-ink); flex-shrink: 0;"
    : status === "in-progress"
      ? "width: 12px; height: 12px; border-radius: 50%; background: var(--color-ink); border: 2px solid var(--color-surface); box-shadow: 0 0 0 2px var(--color-ink); flex-shrink: 0;"
      : "width: 12px; height: 12px; border-radius: 50%; background: var(--color-surface); border: 1px solid var(--color-muted); flex-shrink: 0;";

  const card = el("div", {
    style: `display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-line-soft); border: 1px solid var(--color-line); border-radius: var(--radius-panel); transition: all var(--dur-fast) var(--ease); ${locked ? "opacity: 0.5; cursor: not-allowed;" : "cursor: pointer;"}`,
    onclick: () => { if (!locked) onNavigate("wizard-" + step.wizardId); }
  }, [
    el("div", { style: dotStyle }),
    el("div", { style: "flex: 1; min-width: 0;" }, [
      el("div", { style: "display: flex; align-items: center; gap: var(--space-2); margin-bottom: 2px;" }, [
        el("span", { style: "font-family: var(--font-mono); font-size: var(--fs-tiny); font-weight: 500; color: var(--color-muted); text-transform: uppercase; letter-spacing: var(--track-eyebrow);", text: `Step ${step.id}` }),
        locked ? el("span", { style: CHIP_STYLE, text: "Locked" }) : null
      ]),
      el("p", { style: "font-family: var(--font-body); font-size: var(--fs-body); font-weight: 500; color: var(--color-ink); margin: 0 0 2px;", text: step.title }),
      el("div", { style: "display: flex; align-items: center; gap: var(--space-2);" }, [
        el("span", { style: "font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted); display: flex; align-items: center; gap: 4px;" }, [
          lucideIcon("clock", 12),
          el("span", { text: step.est })
        ])
      ])
    ]),
    el("div", { style: "display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0;" }, [
      statusDropdown(step.id, status, locked, onStatusChange),
      !locked
        ? el("button", {
            style: "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; color: var(--color-ink); background: none; border: none; cursor: pointer; padding: 4px 8px; text-decoration: underline; text-underline-offset: 2px;",
            onclick: (e) => { e.stopPropagation(); onNavigate("wizard-" + step.wizardId); }
          }, [el("span", { text: "Open →" })])
        : (() => { const ic = lucideIcon("lock", 16); ic.style.color = "var(--color-muted)"; return ic; })()
    ])
  ]);

  return card;
}

function statusDropdown(stepId, currentStatus, locked, onStatusChange) {
  const sel = el("select", {
    style: "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 500; border: 1px solid var(--color-line); border-radius: var(--radius-input); padding: 4px 8px; background: var(--color-surface); color: var(--color-ink); cursor: pointer;",
    disabled: locked ? "disabled" : null,
    onchange: (e) => onStatusChange(stepId, e.target.value)
  }, [
    el("option", { value: "todo",        selected: currentStatus === "todo"        ? "selected" : null, text: "Todo" }),
    el("option", { value: "in-progress", selected: currentStatus === "in-progress" ? "selected" : null, text: "In Progress" }),
    el("option", { value: "complete",    selected: currentStatus === "complete"    ? "selected" : null, text: "Complete" })
  ]);
  return sel;
}
