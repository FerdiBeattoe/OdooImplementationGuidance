// ---------------------------------------------------------------------------
// Onboarding Tour — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Guided overlay tour shown once after the user completes the onboarding
// wizard and lands on the dashboard for the first time.
//
// 6 stops. Spotlight effect via box-shadow. Force-next (no skip/dismiss
// until the final step). localStorage gate prevents repeat display.
// ---------------------------------------------------------------------------

const TOUR_STORAGE_KEY = "project_odoo_tour_complete";

const TOUR_STOPS = [
  {
    selector: () => findNavItem("Dashboard"),
    position: "right",
    heading: "Your implementation overview",
    body: "Track progress across all modules at a glance. See what\u2019s complete, what\u2019s in progress, and what\u2019s next.",
  },
  {
    selector: () => findNavItem("Implementation Roadmap"),
    position: "right",
    heading: "Your step-by-step journey",
    body: "Follow phases in order. Each phase unlocks when the previous one is complete. The sequence matters \u2014 this is why Project Odoo exists.",
  },
  {
    selector: () => findNavItem("Module Setup"),
    position: "right",
    heading: "Configure each Odoo module",
    body: "Guided wizards walk you through every module setting. No guesswork \u2014 each field is explained and validated before anything writes to your instance.",
  },
  {
    selector: () => findNavItem("Pipeline"),
    position: "right",
    heading: "The governed engine",
    body: "Every configuration change is previewed, approved, and recorded here before it touches your Odoo instance. 124 checkpoints. Full audit trail. Nothing writes without your approval.",
  },
  {
    selector: () => findHeaderButton("Connect Odoo"),
    position: "below",
    heading: "Connect your Odoo instance",
    body: "Link your live Odoo 19 instance to start executing governed writes. You\u2019ll need your instance URL, database name, and credentials.",
  },
  {
    selector: () => findButtonByText("Save Progress"),
    position: "right",
    heading: "Your progress is always saved",
    body: "Project Odoo saves your answers, checkpoint completions, and audit trail automatically. Use this button to manually save and resume from any device.",
  },
];

// ---------------------------------------------------------------------------
// Element finders
// ---------------------------------------------------------------------------

function findNavItem(label) {
  const items = document.querySelectorAll(".ee-nav__item, .ee-nav button, nav button");
  for (const item of items) {
    if (item.textContent.trim().startsWith(label)) return item;
  }
  return null;
}

function findHeaderButton(label) {
  const btns = document.querySelectorAll(".ee-btn, button");
  for (const btn of btns) {
    if (btn.textContent.trim().includes(label)) return btn;
  }
  return null;
}

function findButtonByText(label) {
  const btns = document.querySelectorAll("button");
  for (const btn of btns) {
    if (btn.textContent.trim() === label) return btn;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function shouldShowTour() {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) !== "true";
  } catch {
    return false;
  }
}

export function resetTour() {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch { /* non-fatal */ }
}

export function startTour() {
  let currentStop = 0;
  let highlightedEl = null;
  let savedStyles = {};

  // ── Overlay ─────────────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.style.cssText = "position: fixed; inset: 0; z-index: 9999; pointer-events: none;";
  document.body.appendChild(overlay);

  // ── Tooltip ─────────────────────────────────────────────────
  const tooltip = document.createElement("div");
  tooltip.style.cssText =
    "position: fixed; z-index: 10001; background: #ffffff; border-radius: 12px; " +
    "box-shadow: 0 24px 64px rgba(0,0,0,0.3); padding: 24px 28px; max-width: 320px; " +
    "pointer-events: auto; font-family: Inter, sans-serif;";
  document.body.appendChild(tooltip);

  function cleanup() {
    clearHighlight();
    overlay.remove();
    tooltip.remove();
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch { /* non-fatal */ }
  }

  function clearHighlight() {
    if (highlightedEl) {
      highlightedEl.style.boxShadow = savedStyles.boxShadow || "";
      highlightedEl.style.position = savedStyles.position || "";
      highlightedEl.style.zIndex = savedStyles.zIndex || "";
      highlightedEl.style.borderRadius = savedStyles.borderRadius || "";
      highlightedEl.style.outline = savedStyles.outline || "";
      highlightedEl.style.outlineOffset = savedStyles.outlineOffset || "";
      highlightedEl = null;
      savedStyles = {};
    }
  }

  function applyHighlight(el) {
    clearHighlight();
    if (!el) return;
    highlightedEl = el;
    savedStyles = {
      boxShadow: el.style.boxShadow,
      position: el.style.position,
      zIndex: el.style.zIndex,
      borderRadius: el.style.borderRadius,
      outline: el.style.outline,
      outlineOffset: el.style.outlineOffset,
    };
    el.style.boxShadow = "0 0 0 9999px rgba(0,0,0,0.6)";
    el.style.position = "relative";
    el.style.zIndex = "10000";
    el.style.borderRadius = "6px";
    el.style.outline = "3px solid #f59e0b";
    el.style.outlineOffset = "4px";
  }

  function renderStop() {
    const stop = TOUR_STOPS[currentStop];
    if (!stop) { cleanup(); return; }

    const target = stop.selector();
    if (!target) { cleanup(); return; }

    applyHighlight(target);

    const isLast = currentStop === TOUR_STOPS.length - 1;

    tooltip.innerHTML = "";

    // Step indicator
    const stepLabel = document.createElement("p");
    stepLabel.style.cssText = "font-size: 11px; color: #94a3b8; margin: 0 0 8px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;";
    stepLabel.textContent = `Step ${currentStop + 1} of ${TOUR_STOPS.length}`;
    tooltip.appendChild(stepLabel);

    // Heading
    const heading = document.createElement("h3");
    heading.style.cssText = "font-size: 18px; font-weight: 600; color: #0c1a30; margin: 0 0 8px 0; font-family: Inter, sans-serif;";
    heading.textContent = stop.heading;
    tooltip.appendChild(heading);

    // Body
    const body = document.createElement("p");
    body.style.cssText = "font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 20px 0; font-family: Inter, sans-serif;";
    body.textContent = stop.body;
    tooltip.appendChild(body);

    // Button
    const btn = document.createElement("button");
    btn.style.cssText =
      "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); " +
      "color: #92400e; border-radius: 6px; font-weight: 600; font-size: 14px; " +
      "padding: 10px 20px; cursor: pointer; font-family: Inter, sans-serif; width: 100%;";
    btn.textContent = isLast ? "Got it \u2014 start implementing \u2192" : "Next \u2192";
    btn.onmouseenter = () => { btn.style.background = "rgba(245,158,11,0.2)"; };
    btn.onmouseleave = () => { btn.style.background = "rgba(245,158,11,0.12)"; };
    btn.onclick = () => {
      if (isLast) {
        cleanup();
      } else {
        currentStop++;
        renderStop();
      }
    };
    tooltip.appendChild(btn);

    // Position tooltip near target
    positionTooltip(target, stop.position);
  }

  function positionTooltip(target, position) {
    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Render offscreen first to measure
    tooltip.style.visibility = "hidden";
    tooltip.style.left = "0px";
    tooltip.style.top = "0px";

    requestAnimationFrame(() => {
      const tipRect = tooltip.getBoundingClientRect();
      let left, top;

      if (position === "below") {
        left = rect.left;
        top = rect.bottom + 12;
      } else {
        // "right"
        left = rect.right + 16;
        top = rect.top + (rect.height / 2) - (tipRect.height / 2);
      }

      // Clamp to viewport
      if (left + tipRect.width > vw - 16) left = vw - tipRect.width - 16;
      if (left < 16) left = 16;
      if (top + tipRect.height > vh - 16) top = vh - tipRect.height - 16;
      if (top < 16) top = 16;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.visibility = "visible";
    });
  }

  renderStop();
}
