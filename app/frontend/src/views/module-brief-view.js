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

// ── label derivation for unresolved domain IDs ──────────────────────────────

function deriveDomainLabel(domainId) {
  if (!domainId) return "";
  return String(domainId)
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

// ── public entry point ──────────────────────────────────────────────────────

export function renderModuleBriefView({ domainId, onClose, onOpenWizard } = {}) {
  let currentDomain = domainId || null;

  const container = el("div", {
    style:
      "font-family: Inter, sans-serif; color: #0c1a30; max-width: 960px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;",
    dataset: { testid: "module-brief-view", domain: currentDomain || "" },
  });

  const contentEl = el("div", {
    style: "display: flex; flex-direction: column; gap: 20px;",
  });
  container.appendChild(contentEl);

  function showLoading() {
    clearNode(contentEl);
    contentEl.appendChild(
      el(
        "div",
        {
          style:
            "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 32px; text-align: center; color: #64748b; font-size: 14px;",
        },
        "Loading brief\u2026",
      ),
    );
  }

  function showDomain(nextDomainId) {
    currentDomain = nextDomainId || null;
    container.dataset.domain = currentDomain || "";
    showLoading();

    loadBriefs().then((data) => {
      // Guard against race when user clicks a different chip before data resolves
      if (currentDomain !== nextDomainId) return;

      const brief = data?.domains?.[nextDomainId];
      clearNode(contentEl);

      if (!brief) {
        contentEl.appendChild(renderMissing(nextDomainId, onClose));
        return;
      }

      renderBriefSections({
        parent: contentEl,
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
    clearNode(contentEl);
    contentEl.appendChild(renderMissing(null, onClose));
  }

  return container;
}

// ── missing / unresolved domain ─────────────────────────────────────────────

function renderMissing(domainId, onClose) {
  return el(
    "div",
    {
      style:
        "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 32px; text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center;",
      dataset: { testid: "module-brief-missing" },
    },
    [
      el(
        "div",
        {
          style:
            "color: #92400e; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 10px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;",
        },
        [lucideIcon("alert-circle", 24)],
      ),
      el(
        "h2",
        { style: "font-size: 18px; font-weight: 700; color: #0c1a30; margin: 0;" },
        "Brief unavailable",
      ),
      el(
        "p",
        { style: "font-size: 13px; color: #64748b; margin: 0; max-width: 420px;" },
        domainId
          ? `No brief is available for "${domainId}" yet.`
          : "Select a module from the dashboard to view its brief.",
      ),
      el(
        "button",
        {
          style:
            "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); color: #0c1a30; border-radius: 6px; font-weight: 600; font-size: 14px; padding: 10px 20px; cursor: pointer; font-family: Inter, sans-serif;",
          onclick: () => onClose && onClose(),
        },
        "Close",
      ),
    ],
  );
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
  parent.appendChild(renderHeader(domainId, brief, onClose));
  parent.appendChild(renderWhatItDoes(brief));
  parent.appendChild(renderBusinessBenefit(brief));

  if (Array.isArray(brief.connects_to) && brief.connects_to.length > 0) {
    parent.appendChild(renderConnectsTo(brief.connects_to, briefs, onSelectConnected));
  }

  if (Array.isArray(brief.setup_checklist) && brief.setup_checklist.length > 0) {
    parent.appendChild(renderChecklist(domainId, brief.setup_checklist));
  }

  if (brief.first_action) {
    parent.appendChild(renderFirstAction(brief));
  }

  if (Array.isArray(brief.common_mistakes) && brief.common_mistakes.length > 0) {
    parent.appendChild(renderCommonMistakes(brief.common_mistakes));
  }

  parent.appendChild(renderActionButtons(domainId, onOpenWizard, onClose));
}

// ── 1. header ───────────────────────────────────────────────────────────────

function renderHeader(domainId, brief, onClose) {
  const closeButton = el(
    "button",
    {
      style:
        "background: transparent; border: 1px solid transparent; cursor: pointer; color: #64748b; padding: 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;",
      dataset: { testid: "module-brief-close" },
      onclick: () => onClose && onClose(),
      "aria-label": "Close module brief",
      title: "Close",
    },
    [lucideIcon("x", 20)],
  );
  closeButton.onmouseenter = () => {
    closeButton.style.background = "rgba(12,26,48,0.06)";
    closeButton.style.borderColor = "rgba(12,26,48,0.15)";
  };
  closeButton.onmouseleave = () => {
    closeButton.style.background = "transparent";
    closeButton.style.borderColor = "transparent";
  };

  const headerChildren = [
    el(
      "div",
      {
        style:
          "background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); border-radius: 10px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; color: #92400e; flex-shrink: 0;",
      },
      [lucideIcon(brief.icon || "package", 24)],
    ),
    el(
      "div",
      { style: "flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px;" },
      [
        el(
          "h1",
          {
            style:
              "font-size: 22px; font-weight: 700; color: #0c1a30; margin: 0; line-height: 1.2;",
          },
          brief.label || deriveDomainLabel(domainId),
        ),
        brief.estimated_setup_hours
          ? el(
              "span",
              {
                style:
                  "display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #92400e; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); border-radius: 6px; padding: 4px 10px; align-self: flex-start;",
                dataset: { testid: "module-brief-setup-time" },
              },
              [
                lucideIcon("clock", 12),
                el("span", {}, `Setup: ${brief.estimated_setup_hours}`),
              ],
            )
          : null,
      ],
    ),
    closeButton,
  ];

  return el(
    "div",
    {
      style:
        "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; display: flex; align-items: center; gap: 16px;",
      dataset: { testid: "module-brief-header" },
    },
    headerChildren,
  );
}

// ── 2. what it does (with personalisation) ─────────────────────────────────

function renderWhatItDoes(brief) {
  const section = el(
    "section",
    {
      style:
        "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 12px;",
      dataset: { testid: "module-brief-what-it-does" },
    },
    [
      el(
        "h2",
        {
          style:
            "font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; margin: 0;",
        },
        "What it does for you",
      ),
      el(
        "p",
        {
          style: "font-size: 14px; line-height: 1.6; color: #0c1a30; margin: 0;",
        },
        brief.what_it_does || "",
      ),
    ],
  );

  const personalised = getMatchedPersonalisationNotes(brief);
  personalised.forEach((note) => {
    section.appendChild(renderPersonalisedNote(note));
  });

  return section;
}

function renderPersonalisedNote(text) {
  return el(
    "div",
    {
      style:
        "background: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b; border-radius: 6px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;",
      dataset: { testid: "module-brief-personalised-note" },
    },
    [
      el(
        "span",
        {
          style:
            "font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #92400e;",
        },
        "Personalised for your business",
      ),
      el(
        "p",
        { style: "font-size: 13px; line-height: 1.5; color: #0c1a30; margin: 0;" },
        text,
      ),
    ],
  );
}

// ── 3. business benefit ─────────────────────────────────────────────────────

function renderBusinessBenefit(brief) {
  return el(
    "section",
    {
      style:
        "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 12px;",
      dataset: { testid: "module-brief-business-benefit" },
    },
    [
      el(
        "h2",
        {
          style:
            "font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; margin: 0;",
        },
        "Business benefit",
      ),
      el(
        "p",
        {
          style: "font-size: 14px; line-height: 1.6; color: #0c1a30; margin: 0;",
        },
        brief.business_benefit || "",
      ),
    ],
  );
}

// ── 4. connects to ──────────────────────────────────────────────────────────

function renderConnectsTo(connects, briefs, onSelectConnected) {
  const chips = connects.map((cid) => {
    const connectedBrief = briefs?.[cid];
    const label = connectedBrief?.label || deriveDomainLabel(cid);
    const hasBrief = Boolean(connectedBrief);

    const chip = el(
      "button",
      {
        style: hasBrief
          ? "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); color: #0c1a30; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: Inter, sans-serif; display: inline-flex; align-items: center; gap: 6px;"
          : "background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: not-allowed; font-family: Inter, sans-serif; display: inline-flex; align-items: center; gap: 6px;",
        dataset: { testid: "module-brief-connect-chip", target: cid },
        disabled: !hasBrief,
        onclick: hasBrief
          ? () => {
              if (onSelectConnected) onSelectConnected(cid);
            }
          : null,
      },
      [lucideIcon(connectedBrief?.icon || "link", 12), el("span", {}, label)],
    );
    return chip;
  });

  return el(
    "section",
    {
      style:
        "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 12px;",
      dataset: { testid: "module-brief-connects-to" },
    },
    [
      el(
        "h2",
        {
          style:
            "font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; margin: 0;",
        },
        "Connects to",
      ),
      el("div", { style: "display: flex; flex-wrap: wrap; gap: 8px;" }, chips),
    ],
  );
}

// ── 5. setup checklist ──────────────────────────────────────────────────────

function renderChecklist(domainId, items) {
  const section = el(
    "section",
    {
      style:
        "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 12px;",
      dataset: { testid: "module-brief-checklist" },
    },
  );

  const header = el("div", {
    style: "display: flex; align-items: baseline; justify-content: space-between; gap: 12px;",
  });
  const heading = el(
    "h2",
    {
      style:
        "font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; margin: 0;",
    },
    "Setup checklist",
  );
  const progress = el(
    "span",
    {
      style: "font-size: 12px; font-weight: 600; color: #0c1a30;",
      dataset: { testid: "module-brief-checklist-progress" },
    },
    "",
  );
  header.append(heading, progress);
  section.appendChild(header);

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

    const row = el(
      "label",
      {
        style: buildChecklistRowStyle(state.checked),
        dataset: {
          testid: "module-brief-checklist-item",
          itemIndex: String(index),
          checked: String(state.checked),
        },
      },
    );

    const checkbox = el("input", {
      type: "checkbox",
      checked: state.checked,
      style: "margin: 2px 0 0 0; width: 16px; height: 16px; accent-color: #f59e0b; cursor: pointer; flex-shrink: 0;",
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
      el(
        "span",
        {
          style: "font-size: 13px; line-height: 1.5; color: #0c1a30; flex: 1;",
        },
        text,
      ),
    );
    list.appendChild(row);
  });

  updateProgress();
  return section;
}

function buildChecklistRowStyle(isChecked) {
  const base =
    "display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 8px; cursor: pointer; transition: background 0.15s, border-color 0.15s;";
  if (isChecked) {
    return `${base} background: rgba(245,158,11,0.1); border: 1px solid #f59e0b;`;
  }
  return `${base} background: #ffffff; border: 1px solid #e2e8f0;`;
}

// ── 6. first action ─────────────────────────────────────────────────────────

function renderFirstAction(brief) {
  const buttons = [];
  if (brief.odoo_menu_path) {
    buttons.push(
      el(
        "div",
        {
          style:
            "display: inline-flex; align-items: center; gap: 8px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; padding: 8px 14px; font-weight: 600; font-size: 13px; font-family: Inter, sans-serif;",
          dataset: { testid: "module-brief-odoo-path" },
        },
        [lucideIcon("external-link", 14), el("span", {}, brief.odoo_menu_path)],
      ),
    );
  }

  return el(
    "section",
    {
      style:
        "background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); border-left: 3px solid #f59e0b; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 12px;",
      dataset: { testid: "module-brief-first-action" },
    },
    [
      el(
        "h2",
        {
          style:
            "font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #92400e; margin: 0;",
        },
        "First action",
      ),
      el(
        "p",
        {
          style: "font-size: 14px; line-height: 1.6; color: #0c1a30; margin: 0;",
        },
        brief.first_action,
      ),
      buttons.length > 0 ? el("div", { style: "display: flex; flex-wrap: wrap; gap: 8px;" }, buttons) : null,
    ].filter(Boolean),
  );
}

// ── 7. common mistakes (collapsible) ────────────────────────────────────────

function renderCommonMistakes(mistakes) {
  const section = el(
    "section",
    {
      style:
        "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0; display: flex; flex-direction: column; overflow: hidden;",
      dataset: { testid: "module-brief-common-mistakes" },
    },
  );

  const listWrap = el(
    "div",
    {
      style: "display: none; padding: 0 24px 20px 24px; flex-direction: column; gap: 8px;",
    },
  );

  mistakes.forEach((mistake) => {
    listWrap.appendChild(
      el(
        "div",
        {
          style:
            "display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: rgba(217,119,6,0.04); border: 1px solid rgba(217,119,6,0.2); border-left: 3px solid #d97706; border-radius: 6px;",
          dataset: { testid: "module-brief-mistake" },
        },
        [
          el(
            "span",
            {
              style: "color: #d97706; flex-shrink: 0; margin-top: 2px;",
            },
            [lucideIcon("alert-triangle", 14)],
          ),
          el(
            "span",
            { style: "font-size: 13px; line-height: 1.5; color: #0c1a30;" },
            mistake,
          ),
        ],
      ),
    );
  });

  const chevron = lucideIcon("chevron-down", 16);
  const toggle = el(
    "button",
    {
      style:
        "background: transparent; border: none; cursor: pointer; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; font-family: Inter, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; text-align: left;",
      dataset: { testid: "module-brief-common-mistakes-toggle", expanded: "false" },
    },
    [
      el("span", {}, `Common mistakes (${mistakes.length})`),
      el("span", { style: "color: #64748b; display: inline-flex; transition: transform 0.15s;" }, [chevron]),
    ],
  );

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

  const configureBtn = el(
    "button",
    {
      style:
        "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-weight: 600; font-size: 14px; padding: 10px 20px; cursor: pointer; font-family: Inter, sans-serif; display: inline-flex; align-items: center; gap: 8px;",
      dataset: { testid: "module-brief-configure" },
      onclick: () => {
        if (onOpenWizard) onOpenWizard(domainId);
      },
    },
    [lucideIcon("settings", 16), el("span", {}, "Configure in Wizard")],
  );

  const markCompleteBtn = el(
    "button",
    {
      style: buildMarkCompleteStyle(isComplete),
      dataset: { testid: "module-brief-mark-complete", complete: String(isComplete) },
    },
    [
      lucideIcon(isComplete ? "check-circle" : "circle", 16),
      el("span", {}, isComplete ? "Domain marked complete" : "Mark Domain Complete"),
    ],
  );
  markCompleteBtn.addEventListener("click", () => {
    const next = !getMarkedComplete(domainId);
    setMarkedComplete(domainId, next);
    markCompleteBtn.style.cssText = buildMarkCompleteStyle(next);
    markCompleteBtn.dataset.complete = String(next);
    clearNode(markCompleteBtn);
    markCompleteBtn.append(
      lucideIcon(next ? "check-circle" : "circle", 16),
      el("span", {}, next ? "Domain marked complete" : "Mark Domain Complete"),
    );
  });

  const skipBtn = el(
    "button",
    {
      style:
        "background: transparent; border: 1px solid transparent; color: #64748b; border-radius: 6px; font-weight: 600; font-size: 14px; padding: 10px 16px; cursor: pointer; font-family: Inter, sans-serif;",
      dataset: { testid: "module-brief-skip" },
      onclick: () => onClose && onClose(),
    },
    "Skip for now",
  );

  return el(
    "div",
    {
      style:
        "display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 8px 0 0 0;",
      dataset: { testid: "module-brief-actions" },
    },
    [configureBtn, markCompleteBtn, skipBtn],
  );
}

function buildMarkCompleteStyle(isComplete) {
  if (isComplete) {
    return "background: rgba(245,158,11,0.12); border: 1px solid #f59e0b; color: #92400e; border-radius: 6px; font-weight: 600; font-size: 14px; padding: 10px 20px; cursor: pointer; font-family: Inter, sans-serif; display: inline-flex; align-items: center; gap: 8px;";
  }
  return "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); color: #0c1a30; border-radius: 6px; font-weight: 600; font-size: 14px; padding: 10px 20px; cursor: pointer; font-family: Inter, sans-serif; display: inline-flex; align-items: center; gap: 8px;";
}
