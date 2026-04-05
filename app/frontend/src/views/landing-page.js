// ---------------------------------------------------------------------------
// Landing Page — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Pattern: pure function returning a DOM node. No local state.
// Uses el() from lib/dom.js — same pattern as all other views.
//
// Sections:
//   1 — Hero
//   2 — How it works (3 steps)
//   3 — Returning user
//   4 — Footer
// ---------------------------------------------------------------------------

import { el } from "../lib/dom.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { pipelineStore } from "../state/pipeline-store.js";

// ---------------------------------------------------------------------------
// SESSION_STORAGE_KEY — localStorage key for project_id persistence
// ---------------------------------------------------------------------------

export const SESSION_STORAGE_KEY = "odoo_impl_project_id";

// ---------------------------------------------------------------------------
// readStoredProjectId
//
// Reads project_id from localStorage. Returns null when localStorage is
// unavailable or the key is absent.
// ---------------------------------------------------------------------------

export function readStoredProjectId() {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// writeStoredProjectId
//
// Persists project_id to localStorage. Silent on error.
// ---------------------------------------------------------------------------

export function writeStoredProjectId(projectId) {
  try {
    if (projectId) {
      localStorage.setItem(SESSION_STORAGE_KEY, projectId);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable — non-fatal
  }
}

// ---------------------------------------------------------------------------
// clearSession
//
// Clears localStorage session key. Stores are reset by callers.
// Call this on explicit "Start new implementation" actions.
// ---------------------------------------------------------------------------

export function clearSession() {
  onboardingStore.reset();
  pipelineStore.reset();
  writeStoredProjectId(null);
}

// ---------------------------------------------------------------------------
// resolveSession
//
// Returns the active project_id if a session exists, otherwise null.
// Checks onboarding-store first, then pipeline-store.
// Does not read localStorage — that is the app layer's responsibility.
// ---------------------------------------------------------------------------

export function resolveSession() {
  const ob = onboardingStore.getState();
  if (ob.connection && ob.connection.project_id) {
    return ob.connection.project_id;
  }
  const ps = pipelineStore.getState();
  if (ps.connection_project_id) {
    return ps.connection_project_id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// resolveLastActiveView
//
// Returns the view name the session should resume at.
// Reads from onboarding-store screen to determine wizard position.
// ---------------------------------------------------------------------------

export function resolveLastActiveView() {
  const ob = onboardingStore.getState();
  if (ob.connection && ob.connection.project_id) {
    // User has a registered connection — if past connect-account they are
    // in the onboarding flow; if confirmed they are in the pipeline.
    if (ob.confirmed || ob.screen === "summary") {
      return "pipeline-dashboard";
    }
    return "onboarding";
  }
  const ps = pipelineStore.getState();
  if (ps.connection_project_id) {
    return "pipeline-dashboard";
  }
  return "onboarding";
}

// ---------------------------------------------------------------------------
// bootstrapSessionFromStorage
//
// On app load: if localStorage has a stored project_id and both stores are
// empty, set the onboarding-store connection.project_id so that
// resolveSession() can find the session on first render.
//
// Does NOT make any backend calls — store and localStorage state only.
// ---------------------------------------------------------------------------

export function bootstrapSessionFromStorage() {
  const stored = readStoredProjectId();
  if (!stored) return;

  const ob = onboardingStore.getState();
  const ps = pipelineStore.getState();

  const alreadyHasSession =
    (ob.connection && ob.connection.project_id) ||
    ps.connection_project_id;

  if (!alreadyHasSession) {
    // Restore the connection project_id into the onboarding store connection
    // object so session detection works uniformly.
    ob.connection.project_id = stored;
  }
}

// ---------------------------------------------------------------------------
// resolveRouteView
//
// Maps a logical route name ("landing", "onboarding", "pipeline",
// "dashboard") to the concrete view name to render, applying session
// awareness.
//
// @param {string} route    — inbound route name
// @param {string|null} session — result of resolveSession(), may be null
// @param {object} [opts]
// @param {string|null} [opts.noSessionMessage] — message set when protected
//        route was accessed without a session
// @returns {{ view: string, noSessionMessage: string|null }}
// ---------------------------------------------------------------------------

export function resolveRouteView(route, session, opts = {}) {
  switch (route) {
    case "landing":
      if (session) {
        // Has session — redirect to last active screen
        return { view: resolveLastActiveView(), noSessionMessage: null };
      }
      return { view: "landing", noSessionMessage: opts.noSessionMessage || null };

    case "onboarding":
      if (session) {
        const lastView = resolveLastActiveView();
        return { view: lastView === "onboarding" ? "onboarding" : lastView, noSessionMessage: null };
      }
      // No session — normal onboarding flow from Screen 0a
      return { view: "onboarding", noSessionMessage: null };

    case "pipeline":
    case "dashboard":
      if (session) {
        return { view: "pipeline-dashboard", noSessionMessage: null };
      }
      // No session — redirect to landing with a message
      return {
        view: "landing",
        noSessionMessage: "Start your implementation to access the dashboard"
      };

    default:
      // Unknown route — treat as landing
      if (session) {
        return { view: resolveLastActiveView(), noSessionMessage: null };
      }
      return { view: "landing", noSessionMessage: null };
  }
}

// ---------------------------------------------------------------------------
// renderLandingPage
//
// @param {object} props
// @param {Function} props.onStart    — navigates to onboarding wizard
// @param {Function} props.onContinue — navigates to last active screen
//                                      (or onboarding if no session)
// @param {string|null} [props.noSessionMessage]
//                    — shown when a user tries to reach a protected view
//                      with no session
// ---------------------------------------------------------------------------

export function renderLandingPage({ onStart, onContinue, noSessionMessage = null } = {}) {
  const storedProjectId = readStoredProjectId();
  const returningSectionStyle = storedProjectId ? null : "display: none;";

  const container = el("div", { className: "lp-page" }, [
    // ── Section 1: Hero ───────────────────────────────────────────────────
    el("section", { className: "lp-hero" }, [
      el("div", { className: "lp-hero__inner" }, [
        el("span", { className: "lp-badge" }, "Odoo 19"),
        el("h1", { className: "lp-hero__heading" },
          "Implement Odoo the way your business works"
        ),
        el("p", { className: "lp-hero__sub" },
          "Answer a few questions about your business. We set up Odoo around your processes — not the other way around."
        ),
        noSessionMessage
          ? el("p", { className: "lp-notice" }, noSessionMessage)
          : null,
        el("button", {
          className: "lp-cta-btn",
          onclick: () => onStart && onStart()
        }, "Start your implementation")
      ])
    ]),

    // ── Section 2: How it works ───────────────────────────────────────────
    el("section", { className: "lp-how" }, [
      el("div", { className: "lp-how__inner" }, [
        el("h2", { className: "lp-section-heading" }, "How it works"),
        el("ol", { className: "lp-steps" }, [
          renderStep(
            "1",
            "Choose your industry",
            "We tailor the setup to your sector from the start."
          ),
          renderStep(
            "2",
            "Answer questions about your business",
            "Tell us how you work. We activate only what you need."
          ),
          renderStep(
            "3",
            "We configure Odoo for you",
            "Guided, governed writes to your live Odoo instance."
          )
        ])
      ])
    ]),

    // ── Section 3: Returning user ─────────────────────────────────────────
    el("section", { className: "lp-returning", style: returningSectionStyle }, [
      el("div", { className: "lp-returning__inner" }, [
        el("p", { className: "lp-returning__label" }, "Already started?"),
        el("button", {
          className: "lp-continue-link",
          onclick: () => {
            if (onContinue) onContinue(storedProjectId);
          }
        }, "Continue your implementation \u2192")
      ])
    ]),

    // ── Section 4: Footer ─────────────────────────────────────────────────
    el("footer", { className: "lp-footer" }, [
      el("p", { className: "lp-footer__line" }, "Odoo 19 \u2014 Community and Enterprise")
    ])
  ]);

  return container;
}

// ---------------------------------------------------------------------------
// renderStep — private helper
// ---------------------------------------------------------------------------

function renderStep(number, title, description) {
  return el("li", { className: "lp-step" }, [
    el("span", { className: "lp-step__num" }, number),
    el("div", { className: "lp-step__body" }, [
      el("strong", { className: "lp-step__title" }, title),
      el("p", { className: "lp-step__desc" }, description)
    ])
  ]);
}
