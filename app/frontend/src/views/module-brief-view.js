// ---------------------------------------------------------------------------
// Module Brief View
// ---------------------------------------------------------------------------
//
// Renders a personalised module brief for a single domain. Shown when a user
// clicks a domain card in the implementation dashboard.
//
// Data source: /data/module-briefs.json
// Personalisation: onboardingStore.getState().answers
// Checklist persistence: localStorage keyed by domain + item index
// ---------------------------------------------------------------------------

import { el, clearNode } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { onboardingStore } from "../state/onboarding-store.js";

let briefsCache = null;
let briefsLoadPromise = null;

function loadBriefs() {
  if (briefsCache) return Promise.resolve(briefsCache);
  if (briefsLoadPromise) return briefsLoadPromise;
  briefsLoadPromise = fetch("/data/module-briefs.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      briefsCache = data;
      return data;
    })
    .catch(() => null);
  return briefsLoadPromise;
}

// ── localStorage helpers (checklist + marked-complete) ──────────────────────

function checklistKey(domainId, index) {
  return `module-brief-checklist:${domainId}:${index}`;
}

function getChecklistState(domainId, index) {
  try {
    return localStorage.getItem(checklistKey(domainId, index)) === "true";
  } catch {
    return false;
  }
}

function setChecklistState(domainId, index, checked) {
  try {
    localStorage.setItem(checklistKey(domainId, index), String(Boolean(checked)));
  } catch {
    // localStorage unavailable — non-fatal
  }
}

function completeKey(domainId) {
  return `module-brief-complete:${domainId}`;
}

function getMarkedComplete(domainId) {
  try {
    return localStorage.getItem(completeKey(domainId)) === "true";
  } catch {
    return false;
  }
}

function setMarkedComplete(domainId, value) {
  try {
    localStorage.setItem(completeKey(domainId), String(Boolean(value)));
  } catch {
    // localStorage unavailable — non-fatal
  }
}

// ── personalisation helpers ─────────────────────────────────────────────────

function answerMatches(userAnswer, ruleAnswer) {
  if (userAnswer === undefined || userAnswer === null) return false;
  if (Array.isArray(userAnswer)) {
    return userAnswer.includes(ruleAnswer);
  }
  return userAnswer === ruleAnswer;
}

function getMatchedPersonalisationNotes(brief) {
  const answers = onboardingStore.getState()?.answers || {};
  const rules = Array.isArray(brief.personalisation_rules) ? brief.personalisation_rules : [];
  const notes = [];
  rules.forEach((rule) => {
    if (!rule || !rule.question) return;
    const userAnswer = answers[rule.question]?.answer;
    if (answerMatches(userAnswer, rule.answer) && rule.adds_context) {
      notes.push(rule.adds_context);
    }
  });
  return notes;
}

// ── label derivation ────────────────────────────────────────────────────────

function deriveDomainLabel(domainId) {
  if (!domainId) return "";
  return String(domainId)
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveInstanceHost() {
  const url = onboardingStore.getState()?.connection?.url || null;
  if (!url) return "";
  try { return new URL(url).host; }
  catch { return String(url).replace(/^https?:\/\//i, "").split("/")[0]; }
}

// ── Token styles ────────────────────────────────────────────────────────────

const CANVAS_STYLE =
  "min-height: 100vh; background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), var(--color-canvas-base), var(--surface-texture); padding: var(--space-8) var(--space-5) var(--space-12); font-family: var(--font-body); color: var(--color-ink); box-sizing: border-box;";

const COLUMN_STYLE =
  "max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6);";

const LAYOUT_STYLE =
  "display: grid; grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr); gap: var(--space-5); align-items: flex-start;";

const MAIN_STYLE =
  "display: flex; flex-direction: column; gap: var(--space-5); min-width: 0;";

const ASIDE_STYLE =
  "display: flex; flex-direction: column; gap: var(--space-5); position: sticky; top: var(--space-6); min-width: 0;";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; padding: 4px 12px; border: 1px solid var(--color-line); border-radius: var(--radius-pill); background: var(--color-surface); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle);";

const HERO_H1 =
  "font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 600; letter-spacing: var(--track-tight); line-height: var(--lh-snug); color: var(--color-ink); margin: 0;";

const HERO_MUTED = "color: var(--color-muted);";

const HERO_SUB =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0; line-height: var(--lh-body);";

const PANEL_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-5) var(--space-6);";

const SECTION_EYEBROW =
  "font-family: var(--font-mono); font-size: var(--fs-tiny); font-weight: 600; letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: var(--color-muted); margin: 0 0 var(--space-3) 0;";

const BODY_TEXT =
  "font-family: var(--font-body); font-size: var(--fs-body); color: var(--color-ink); margin: 0; line-height: var(--lh-body);";

const MONO_TEXT =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-ink); margin: 0;";

const CHIP_BASE =
  "display: inline-flex; align-items: center; padding: 4px 10px; border-radius: var(--radius-pill); font-family: var(--font-mono); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow);";

const CHIP_NEUTRAL = `${CHIP_BASE} background: var(--color-chip-bg); color: var(--color-chip-fg);`;
const CHIP_READY = `${CHIP_BASE} background: var(--color-chip-ready-bg); color: var(--color-chip-ready-fg);`;
const CHIP_REVIEW = `${CHIP_BASE} background: var(--color-chip-review-bg); color: var(--color-chip-review-fg);`;

const PILL_PRIMARY =
  "display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); border: 1px solid var(--color-pill-primary-bg); font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; cursor: pointer; transition: all var(--dur-base) var(--ease);";

const PILL_SECONDARY =
  "display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); border: 1px solid var(--color-pill-secondary-border); font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; cursor: pointer; transition: all var(--dur-base) var(--ease);";

const GHOST_BTN =
  "display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: var(--radius-pill); background: transparent; color: var(--color-muted); border: 1px solid transparent; font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; cursor: pointer; transition: all var(--dur-base) var(--ease);";

const CALLOUT_READY =
  "background: var(--color-chip-ready-bg); border-left: 3px solid var(--color-ink); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); display: flex; flex-direction: column; gap: 4px;";

const CALLOUT_REVIEW =
  "background: var(--color-chip-review-bg); border-left: 3px solid var(--color-chip-review-fg); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); display: flex; flex-direction: column; gap: 4px;";

// ── public entry point ──────────────────────────────────────────────────────

export function renderModuleBriefView({ domainId, onClose, onOpenWizard } = {}) {
  let currentDomain = domainId || null;

  const container = el("div", {
    style: CANVAS_STYLE,
    dataset: { testid: "module-brief-view", domain: currentDomain || "" },
  });

  const column = el("div", { style: COLUMN_STYLE });
  container.appendChild(column);

  function showLoading() {
    clearNode(column);
    column.appendChild(
      el("div", {
        style: `${PANEL_STYLE} text-align: center; color: var(--color-muted);`,
      }, "Loading brief…"),
    );
  }

  function showDomain(nextDomainId) {
    currentDomain = nextDomainId || null;
    container.dataset.domain = currentDomain || "";
    showLoading();

    loadBriefs().then((data) => {
      if (currentDomain !== nextDomainId) return;

      const brief = data?.domains?.[nextDomainId];
      clearNode(column);

      if (!brief) {
        column.appendChild(renderMissing(nextDomainId, onClose));
        return;
      }

      renderBriefSections({
        parent: column,
        domainId: nextDomainId,
        brief,
        briefs: data.domains,
        onClose,
        onOpenWizard,
        onSelectConnected: (cid) => showDomain(cid),
      });
    });
  }

  if (currentDomain) {
    showDomain(currentDomain);
  } else {
    clearNode(column);
    column.appendChild(renderMissing(null, onClose));
  }

  return container;
}

// ── missing / unresolved domain ─────────────────────────────────────────────

function renderMissing(domainId, onClose) {
  return el("div", {
    style: `${PANEL_STYLE} text-align: center; display: flex; flex-direction: column; gap: var(--space-4); align-items: center;`,
    dataset: { testid: "module-brief-missing" },
  }, [
    el("div", {
      style: "width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--color-chip-review-bg); color: var(--color-chip-review-fg); display: flex; align-items: center; justify-content: center;",
    }, [lucideIcon("alert-circle", 24)]),
    el("h2", { style: HERO_H1 }, "Brief unavailable"),
    el("p", {
      style: HERO_SUB,
    }, domainId
      ? `No brief is available for "${domainId}" yet.`
      : "Select a module from the dashboard to view its brief."),
    el("button", {
      style: PILL_SECONDARY,
      onclick: () => onClose && onClose(),
    }, "Close"),
  ]);
}

// ── full brief render ───────────────────────────────────────────────────────

function renderBriefSections({
  parent,
  domainId,
  brief,
  briefs,
  onClose,
  onOpenWizard,
  onSelectConnected,
}) {
  parent.appendChild(renderHero(domainId, brief, onClose));

  const layout = el("div", { style: LAYOUT_STYLE });
  const main = el("div", { style: MAIN_STYLE });
  const aside = el("div", { style: ASIDE_STYLE });

  main.appendChild(renderWhatItDoes(brief));
  main.appendChild(renderBusinessBenefit(brief));

  if (Array.isArray(brief.setup_checklist) && brief.setup_checklist.length > 0) {
    main.appendChild(renderChecklist(domainId, brief.setup_checklist));
  }

  if (brief.first_action) {
    main.appendChild(renderFirstAction(brief));
  }

  if (Array.isArray(brief.common_mistakes) && brief.common_mistakes.length > 0) {
    main.appendChild(renderCommonMistakes(brief.common_mistakes));
  }

  main.appendChild(renderActionButtons(domainId, onOpenWizard, onClose));

  aside.appendChild(renderModelReference(brief));
  if (Array.isArray(brief.connects_to) && brief.connects_to.length > 0) {
    aside.appendChild(renderConnectsTo(brief.connects_to, briefs, onSelectConnected));
  }

  layout.append(main, aside);
  parent.appendChild(layout);
}

// ── 1. hero ─────────────────────────────────────────────────────────────────

function renderHero(domainId, brief, onClose) {
  const instanceHost = resolveInstanceHost();
  const eyebrowText = instanceHost
    ? `MODULE BRIEF · ${instanceHost}`
    : `MODULE BRIEF · ${domainId}`;

  const label = brief.label || deriveDomainLabel(domainId);
  const [firstWord, ...rest] = String(label).split(" ");
  const heading = rest.length
    ? [el("span", { text: `${firstWord} ` }), el("span", { style: HERO_MUTED, text: rest.join(" ") })]
    : [el("span", { text: label })];

  const closeBtn = el("button", {
    style: GHOST_BTN,
    dataset: { testid: "module-brief-close" },
    onclick: () => onClose && onClose(),
    "aria-label": "Close module brief",
    title: "Close",
  }, [lucideIcon("x", 16), el("span", { text: "Close" })]);

  const timeChip = brief.estimated_setup_hours
    ? el("span", {
        style: CHIP_NEUTRAL,
        dataset: { testid: "module-brief-setup-time" },
      }, [lucideIcon("clock", 11), el("span", { text: ` Setup: ${brief.estimated_setup_hours}` })])
    : null;

  const topRow = el("div", {
    style: "display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap;",
  }, [
    el("div", { style: "display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;" }, [
      el("span", { style: EYEBROW_STYLE, text: eyebrowText }),
      timeChip,
    ].filter(Boolean)),
    closeBtn,
  ]);

  return el("div", {
    style: "display: flex; flex-direction: column; gap: var(--space-3);",
    dataset: { testid: "module-brief-header" },
  }, [
    topRow,
    el("h1", { style: HERO_H1 }, heading),
    el("p", { style: HERO_SUB, text: `domain: ${domainId}` }),
  ]);
}

// ── 2. what it does (with personalisation) ─────────────────────────────────

function renderWhatItDoes(brief) {
  const section = el("section", {
    style: PANEL_STYLE,
    dataset: { testid: "module-brief-what-it-does" },
  }, [
    el("h2", { style: SECTION_EYEBROW, text: "What it does for you" }),
    el("p", { style: BODY_TEXT, text: brief.what_it_does || "" }),
  ]);

  const personalised = getMatchedPersonalisationNotes(brief);
  if (personalised.length > 0) {
    const notesWrap = el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4);" });
    personalised.forEach((note) => notesWrap.appendChild(renderPersonalisedNote(note)));
    section.appendChild(notesWrap);
  }
  return section;
}

function renderPersonalisedNote(text) {
  return el("div", {
    style: CALLOUT_READY,
    dataset: { testid: "module-brief-personalised-note" },
  }, [
    el("span", {
      style: "font-family: var(--font-mono); font-size: var(--fs-tiny); font-weight: 600; letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: var(--color-chip-ready-fg);",
      text: "Personalised for your business",
    }),
    el("p", { style: BODY_TEXT, text }),
  ]);
}

// ── 3. business benefit ─────────────────────────────────────────────────────

function renderBusinessBenefit(brief) {
  return el("section", {
    style: PANEL_STYLE,
    dataset: { testid: "module-brief-business-benefit" },
  }, [
    el("h2", { style: SECTION_EYEBROW, text: "Business benefit" }),
    el("p", { style: BODY_TEXT, text: brief.business_benefit || "" }),
  ]);
}

// ── 4. connects to (aside) ──────────────────────────────────────────────────

function renderConnectsTo(connects, briefs, onSelectConnected) {
  const chips = connects.map((cid) => {
    const connectedBrief = briefs?.[cid];
    const label = connectedBrief?.label || deriveDomainLabel(cid);
    const hasBrief = Boolean(connectedBrief);

    const chip = el("button", {
      style: hasBrief
        ? `${CHIP_BASE} background: var(--color-chip-bg); color: var(--color-chip-fg); cursor: pointer; border: 1px solid var(--color-line);`
        : `${CHIP_BASE} background: var(--color-line-soft); color: var(--color-subtle); cursor: not-allowed; border: 1px solid var(--color-line-soft);`,
      dataset: { testid: "module-brief-connect-chip", target: cid },
      disabled: !hasBrief,
      onclick: hasBrief ? () => { if (onSelectConnected) onSelectConnected(cid); } : null,
    }, [lucideIcon(connectedBrief?.icon || "link", 11), el("span", { text: ` ${label}` })]);
    return chip;
  });

  return el("section", {
    style: PANEL_STYLE,
    dataset: { testid: "module-brief-connects-to" },
  }, [
    el("h2", { style: SECTION_EYEBROW, text: "Connects to" }),
    el("div", { style: "display: flex; flex-wrap: wrap; gap: 8px;" }, chips),
  ]);
}

// ── 4b. model reference (aside, mono) ───────────────────────────────────────

function renderModelReference(brief) {
  const rows = [];
  if (brief.odoo_menu_path) rows.push({ label: "Menu path", value: brief.odoo_menu_path });
  if (brief.primary_model) rows.push({ label: "Primary model", value: brief.primary_model });
  if (Array.isArray(brief.models)) {
    brief.models.forEach((m) => rows.push({ label: "Model", value: m }));
  }
  if (brief.estimated_setup_hours) rows.push({ label: "Setup", value: brief.estimated_setup_hours });
  if (brief.complexity) rows.push({ label: "Complexity", value: brief.complexity });

  if (rows.length === 0) {
    rows.push({ label: "Domain", value: brief.id || brief.label || "—" });
  }

  return el("section", { style: PANEL_STYLE }, [
    el("h2", { style: SECTION_EYEBROW, text: "Reference" }),
    el("div", { style: "display: flex; flex-direction: column; gap: 10px;" },
      rows.map((r) =>
        el("div", { style: "display: flex; flex-direction: column; gap: 2px;" }, [
          el("span", {
            style: "font-family: var(--font-body); font-size: var(--fs-tiny); color: var(--color-muted); text-transform: uppercase; letter-spacing: var(--track-eyebrow);",
            text: r.label,
          }),
          el("span", { style: MONO_TEXT, text: String(r.value) }),
        ])
      )
    ),
  ]);
}

// ── 5. setup checklist ──────────────────────────────────────────────────────

function renderChecklist(domainId, items) {
  const section = el("section", {
    style: PANEL_STYLE,
    dataset: { testid: "module-brief-checklist" },
  });

  const progress = el("span", {
    style: "font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted); letter-spacing: var(--track-eyebrow); text-transform: uppercase;",
    dataset: { testid: "module-brief-checklist-progress" },
  }, "");

  section.appendChild(el("div", {
    style: "display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4);",
  }, [
    el("h2", { style: SECTION_EYEBROW, text: "Setup checklist" }),
    progress,
  ]));

  const list = el("div", { style: "display: flex; flex-direction: column; gap: 8px;" });
  section.appendChild(list);

  const rows = [];

  function updateProgress() {
    const checked = rows.filter((r) => r.checked).length;
    progress.textContent = `${checked}/${rows.length} complete`;
  }

  items.forEach((text, index) => {
    const initial = getChecklistState(domainId, index);
    const state = { checked: initial };
    rows.push(state);

    const row = el("label", {
      style: buildChecklistRowStyle(state.checked),
      dataset: {
        testid: "module-brief-checklist-item",
        itemIndex: String(index),
        checked: String(state.checked),
      },
    });

    const checkbox = el("input", {
      type: "checkbox",
      checked: state.checked,
      style: "margin: 2px 0 0 0; width: 16px; height: 16px; accent-color: var(--color-ink); cursor: pointer; flex-shrink: 0;",
    });
    checkbox.addEventListener("change", () => {
      state.checked = checkbox.checked;
      setChecklistState(domainId, index, state.checked);
      row.style.cssText = buildChecklistRowStyle(state.checked);
      row.dataset.checked = String(state.checked);
      updateProgress();
    });

    row.append(
      checkbox,
      el("span", { style: "font-family: var(--font-body); font-size: var(--fs-body); line-height: var(--lh-body); color: var(--color-ink); flex: 1;", text }),
    );
    list.appendChild(row);
  });

  updateProgress();
  return section;
}

function buildChecklistRowStyle(isChecked) {
  const base =
    "display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: var(--radius-md); cursor: pointer; transition: background var(--dur-base) var(--ease), border-color var(--dur-base) var(--ease);";
  if (isChecked) {
    return `${base} background: var(--color-chip-ready-bg); border: 1px solid var(--color-ink);`;
  }
  return `${base} background: var(--color-surface); border: 1px solid var(--color-line);`;
}

// ── 6. first action ─────────────────────────────────────────────────────────

function renderFirstAction(brief) {
  const buttons = [];
  if (brief.odoo_menu_path) {
    buttons.push(
      el("div", {
        style: CHIP_NEUTRAL,
        dataset: { testid: "module-brief-odoo-path" },
      }, [lucideIcon("external-link", 11), el("span", { text: ` ${brief.odoo_menu_path}` })]),
    );
  }

  return el("section", {
    style: `${PANEL_STYLE} border-left: 3px solid var(--color-ink);`,
    dataset: { testid: "module-brief-first-action" },
  }, [
    el("h2", { style: SECTION_EYEBROW, text: "First action" }),
    el("p", { style: BODY_TEXT, text: brief.first_action }),
    buttons.length > 0 ? el("div", { style: "display: flex; flex-wrap: wrap; gap: 8px; margin-top: var(--space-3);" }, buttons) : null,
  ].filter(Boolean));
}

// ── 7. common mistakes (collapsible) ────────────────────────────────────────

function renderCommonMistakes(mistakes) {
  const section = el("section", {
    style: `${PANEL_STYLE} padding: 0; overflow: hidden;`,
    dataset: { testid: "module-brief-common-mistakes" },
  });

  const listWrap = el("div", {
    style: "display: none; padding: 0 var(--space-6) var(--space-5) var(--space-6); flex-direction: column; gap: 8px;",
  });

  mistakes.forEach((mistake) => {
    listWrap.appendChild(
      el("div", {
        style: CALLOUT_REVIEW,
        dataset: { testid: "module-brief-mistake" },
      }, [
        el("span", {
          style: "color: var(--color-chip-review-fg); flex-shrink: 0;",
        }, [lucideIcon("alert-triangle", 12)]),
        el("span", { style: BODY_TEXT, text: mistake }),
      ])
    );
  });

  const chevron = lucideIcon("chevron-down", 16);
  const toggle = el("button", {
    style: `${GHOST_BTN} width: 100%; justify-content: space-between; padding: var(--space-5) var(--space-6); border-radius: 0;`,
    dataset: { testid: "module-brief-common-mistakes-toggle", expanded: "false" },
  }, [
    el("span", {
      style: "font-family: var(--font-mono); font-size: var(--fs-tiny); font-weight: 600; letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: var(--color-muted);",
      text: `Common mistakes (${mistakes.length})`,
    }),
    el("span", { style: "color: var(--color-muted); display: inline-flex; transition: transform var(--dur-base) var(--ease);" }, [chevron]),
  ]);

  let expanded = false;
  toggle.addEventListener("click", () => {
    expanded = !expanded;
    listWrap.style.display = expanded ? "flex" : "none";
    toggle.dataset.expanded = String(expanded);
    const chevronWrap = toggle.lastElementChild;
    if (chevronWrap) {
      chevronWrap.style.transform = expanded ? "rotate(180deg)" : "rotate(0deg)";
    }
  });

  section.append(toggle, listWrap);
  return section;
}

// ── 8. action buttons ───────────────────────────────────────────────────────

function renderActionButtons(domainId, onOpenWizard, onClose) {
  const isComplete = getMarkedComplete(domainId);

  const configureBtn = el("button", {
    style: PILL_PRIMARY,
    dataset: { testid: "module-brief-configure" },
    onclick: () => { if (onOpenWizard) onOpenWizard(domainId); },
  }, [lucideIcon("settings", 16), el("span", { text: "Configure in wizard" })]);

  const markCompleteBtn = el("button", {
    style: buildMarkCompleteStyle(isComplete),
    dataset: { testid: "module-brief-mark-complete", complete: String(isComplete) },
  }, [
    lucideIcon(isComplete ? "check-circle" : "circle", 16),
    el("span", { text: isComplete ? "Domain marked complete" : "Mark domain complete" }),
  ]);
  markCompleteBtn.addEventListener("click", () => {
    const next = !getMarkedComplete(domainId);
    setMarkedComplete(domainId, next);
    markCompleteBtn.style.cssText = buildMarkCompleteStyle(next);
    markCompleteBtn.dataset.complete = String(next);
    clearNode(markCompleteBtn);
    markCompleteBtn.append(
      lucideIcon(next ? "check-circle" : "circle", 16),
      el("span", { text: next ? "Domain marked complete" : "Mark domain complete" }),
    );
  });

  const skipBtn = el("button", {
    style: GHOST_BTN,
    dataset: { testid: "module-brief-skip" },
    onclick: () => onClose && onClose(),
  }, "Skip for now");

  return el("div", {
    style: "display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; padding: var(--space-2) 0 0 0;",
    dataset: { testid: "module-brief-actions" },
  }, [configureBtn, markCompleteBtn, skipBtn]);
}

function buildMarkCompleteStyle(isComplete) {
  if (isComplete) {
    return `${PILL_PRIMARY} background: var(--color-chip-ready-bg); color: var(--color-chip-ready-fg); border-color: var(--color-ink);`;
  }
  return PILL_SECONDARY;
}
