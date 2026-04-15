// ---------------------------------------------------------------------------
// Implementation Dashboard — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Landing dashboard for implementation progress. Reads real pipeline
//   runtime state (checkpoint records, activated domains) from pipelineStore
//   and renders KPIs, per-domain cards, and a go-live readiness indicator.
//   No synthetic KPIs. No client-side completion inference.
//
// Hard rules:
//   I1  Reads state from pipelineStore only — never fabricates runtime data.
//   I2  runtime_state is never mutated or re-shaped after receipt.
//   I3  Completion counts and percentages are computed from
//       runtime_state checkpoint records only.
//   I4  Domain labels derive from domain key — no hardcoded display strings.
//   I5  Re-fetch is time-bounded and always routes through pipelineStore.
//   I6  Configuration completion ≠ operational readiness — go-live indicator
//       reflects actual checkpoint/domain state only.
// ---------------------------------------------------------------------------

import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { pipelineStore } from "../state/pipeline-store.js";
import { getState } from "../state/app-store.js";
import {
  getCheckpointRecords,
  getActivatedDomainIds,
  deriveCompletionPercentage,
  deriveDomainStatus,
  humanizeDomainId,
} from "./pipeline-dashboard.js";

// ---------------------------------------------------------------------------
// Poll configuration
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 60000;
let _pollTimer = null;

// ---------------------------------------------------------------------------
// Domain → lucide icon mapping (display only — no behavior derived from this)
// ---------------------------------------------------------------------------

const DOMAIN_TO_ICON = {
  foundation:         "building",
  users_roles:        "users",
  master_data:        "database",
  crm:                "target",
  sales:              "tag",
  purchase:           "shopping-cart",
  inventory:          "package",
  manufacturing:      "factory",
  plm:                "git-branch",
  accounting:         "calculator",
  pos:                "monitor",
  website_ecommerce:  "globe",
  projects:           "briefcase",
  hr:                 "user-check",
  quality:            "shield-check",
  maintenance:        "wrench",
  repairs:            "hammer",
  documents:          "folder",
  sign:               "pen-tool",
  approvals:          "check-circle",
  field_service:      "wrench",
  rental:             "calendar",
  subscriptions:      "repeat",
};

// ---------------------------------------------------------------------------
// Domain → wizard id mapping (used by "Configure" button routing)
// ---------------------------------------------------------------------------

const DOMAIN_TO_WIZARD = {
  foundation:         "company-setup",
  users_roles:        "users-access",
  master_data:        "master-data-setup",
  crm:                "crm-setup",
  sales:              "sales-setup",
  purchase:           "purchase-setup",
  inventory:          "inventory-setup",
  manufacturing:      "manufacturing-setup",
  plm:                "plm-setup",
  accounting:         "accounting-setup",
  pos:                "pos-setup",
  website_ecommerce:  "website-setup",
  projects:           "projects-setup",
  hr:                 "hr-setup",
  quality:            "quality-setup",
  maintenance:        "maintenance-setup",
  repairs:            "repairs-setup",
  documents:          "documents-setup",
  sign:               "sign-setup",
  approvals:          "approvals-setup",
  field_service:      "field-service-setup",
  rental:             "rental-setup",
  subscriptions:      "subscriptions-setup",
};

function iconForDomain(domainId) {
  return DOMAIN_TO_ICON[domainId] || "layers";
}

function wizardForDomain(domainId) {
  return DOMAIN_TO_WIZARD[domainId] || null;
}

// ---------------------------------------------------------------------------
// resolveProjectId
//
// Prefers the project_id already present on runtime_state. Falls back to
// the active project from the app-store. Returns null if neither is set —
// in which case fetchPipelineState is a no-op.
// ---------------------------------------------------------------------------

function resolveProjectId() {
  const ps = pipelineStore.getState();
  const runtimeProjectId = ps?.runtime_state?.project_identity?.project_id;
  if (typeof runtimeProjectId === "string" && runtimeProjectId.trim()) {
    return runtimeProjectId.trim();
  }
  const s = getState();
  const activeProjectId = s?.activeProject?.projectIdentity?.projectId;
  if (typeof activeProjectId === "string" && activeProjectId.trim()) {
    return activeProjectId.trim();
  }
  return null;
}

// ---------------------------------------------------------------------------
// fetchPipelineState
//
// Routes through pipelineStore, which calls POST /api/pipeline/state/load
// via the pipeline adapter. Re-uses the existing governed transport — no
// new backend surface introduced. Lifecycle (loading/success/failure/
// not_found) is tracked on the store and drives this view's render states.
// ---------------------------------------------------------------------------

export async function fetchPipelineState() {
  const projectId = resolveProjectId();
  if (!projectId) return;
  try {
    await pipelineStore.loadPipelineState(projectId);
  } catch {
    // Store records failure — no throw from UI layer.
  }
}

function ensurePolling() {
  if (_pollTimer != null) return;
  if (typeof setInterval !== "function") return;
  _pollTimer = setInterval(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    void fetchPipelineState();
  }, POLL_INTERVAL_MS);
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const CARD_STYLE =
  "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;";

const AMBER_BUTTON_STYLE =
  "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); " +
  "color: #92400e; border-radius: 6px; font-weight: 600; font-size: 13px; " +
  "padding: 8px 14px; cursor: pointer; font-family: Inter, sans-serif;";

const SECONDARY_BUTTON_STYLE =
  "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); " +
  "color: #0c1a30; border-radius: 6px; font-weight: 600; font-size: 13px; " +
  "padding: 8px 14px; cursor: pointer; font-family: Inter, sans-serif;";

// ---------------------------------------------------------------------------
// renderImplementationDashboardView — entry point
// ---------------------------------------------------------------------------

export function renderImplementationDashboardView({ onNavigate } = {}) {
  const ps = pipelineStore.getState();

  // On mount, trigger a fetch when the store hasn't been hydrated yet.
  if (ps.status === "idle" && !ps.runtime_state) {
    void fetchPipelineState();
  }
  ensurePolling();

  // ── Loading state (covers running / loading / resuming) ──────────────────
  if (ps.status === "loading" || ps.status === "running" || ps.status === "resuming") {
    return renderLoadingState();
  }

  // ── Error state (explicit failure, not a benign not_found) ───────────────
  if (ps.status === "failure" && ps.error && !ps.not_found) {
    return renderErrorState(ps.error);
  }

  const runtimeState      = ps.runtime_state;
  const checkpointRecords = getCheckpointRecords(runtimeState);
  const activatedDomains  = getActivatedDomainIds(runtimeState);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!runtimeState || (checkpointRecords.length === 0 && activatedDomains.length === 0)) {
    return renderEmptyState(onNavigate);
  }

  // ── KPIs (real, derived from runtime_state) ───────────────────────────────
  const totalCheckpoints    = checkpointRecords.length;
  const completeCheckpoints = checkpointRecords.filter((cp) => cp?.status === "Complete").length;
  const failingCheckpoints  = checkpointRecords.filter((cp) => cp?.status === "Fail").length;
  const remainingCheckpoints = Math.max(0, totalCheckpoints - completeCheckpoints);
  const overallPct          = deriveCompletionPercentage(checkpointRecords);
  const activeBlockers      = runtimeState?.blockers?.active_blockers ?? [];

  // Group checkpoints by domain for per-domain cards
  const byDomain = {};
  for (const cp of checkpointRecords) {
    const domainId = cp?.domain ?? cp?.domain_id ?? "unknown";
    if (!byDomain[domainId]) byDomain[domainId] = [];
    byDomain[domainId].push(cp);
  }

  const allDomainIds = new Set([...activatedDomains, ...Object.keys(byDomain)]);
  const domainIds = Array.from(allDomainIds).filter((id) => id && id !== "unknown");

  const domains = domainIds.map((id) => {
    const cps = byDomain[id] || [];
    const total = cps.length;
    const complete = cps.filter((c) => c?.status === "Complete").length;
    const status = deriveDomainStatus(cps, activeBlockers);
    return { id, total, complete, status };
  });

  const domainsComplete = domains.filter((d) => d.status === "Complete").length;
  const isGoLiveReady = domains.length > 0 && domainsComplete === domains.length && failingCheckpoints === 0;

  return el(
    "div",
    {
      style: "display: flex; flex-direction: column; gap: 24px; font-family: Inter, sans-serif;",
      dataset: { testid: "implementation-dashboard" },
    },
    [
      renderSummaryBar({
        overallPct,
        domainsComplete,
        domainsTotal: domains.length,
        remainingCheckpoints,
        isGoLiveReady,
      }),
      renderProgressCard({
        overallPct,
        completeCheckpoints,
        totalCheckpoints,
      }),
      renderDomainsGrid({ domains, onNavigate }),
    ]
  );
}

// ---------------------------------------------------------------------------
// renderSummaryBar — top strip with the 4 headline KPIs
// ---------------------------------------------------------------------------

function renderSummaryBar({
  overallPct,
  domainsComplete,
  domainsTotal,
  remainingCheckpoints,
  isGoLiveReady,
}) {
  const readinessLabel = isGoLiveReady ? "Go-Live Ready" : "Not Ready";
  const readinessIcon  = isGoLiveReady ? "check-circle-2" : "clock";
  const readinessColor = isGoLiveReady ? "#065f46" : "#92400e";
  const readinessBg    = isGoLiveReady
    ? "rgba(16,185,129,0.08)"
    : "rgba(245,158,11,0.08)";
  const readinessBorder = isGoLiveReady
    ? "1px solid rgba(16,185,129,0.25)"
    : "1px solid rgba(245,158,11,0.25)";

  return el(
    "div",
    {
      style: `${CARD_STYLE} padding: 20px 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;`,
      dataset: { testid: "summary-bar" },
    },
    [
      renderSummaryTile({
        value: `${overallPct}%`,
        label: "Overall Progress",
        testid: "summary-overall-progress",
        accent: "#f59e0b",
      }),
      renderSummaryTile({
        value: `${domainsComplete} / ${domainsTotal}`,
        label: "Domains Complete",
        testid: "summary-domains-complete",
        accent: "#0c1a30",
      }),
      renderSummaryTile({
        value: String(remainingCheckpoints),
        label: "Checkpoints Remaining",
        testid: "summary-checkpoints-remaining",
        accent: "#0c1a30",
      }),
      el(
        "div",
        {
          style: `display: flex; flex-direction: column; gap: 6px; justify-content: center; align-items: flex-start; background: ${readinessBg}; border: ${readinessBorder}; border-radius: 8px; padding: 12px 16px;`,
          dataset: { testid: "summary-go-live" },
        },
        [
          el(
            "div",
            { style: `display: flex; align-items: center; gap: 8px; color: ${readinessColor};` },
            [
              lucideIcon(readinessIcon, 18),
              el(
                "span",
                {
                  style: `font-size: 14px; font-weight: 700; color: ${readinessColor};`,
                  dataset: { testid: "summary-go-live-label" },
                },
                readinessLabel
              ),
            ]
          ),
          el(
            "span",
            {
              style: "font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em;",
            },
            "Go-Live Readiness"
          ),
        ]
      ),
    ]
  );
}

function renderSummaryTile({ value, label, testid, accent }) {
  return el(
    "div",
    {
      style: "display: flex; flex-direction: column; gap: 4px; justify-content: center;",
      dataset: { testid },
    },
    [
      el(
        "span",
        {
          style: `font-size: 28px; font-weight: 700; color: ${accent}; line-height: 1; font-family: Inter, sans-serif;`,
        },
        value
      ),
      el(
        "span",
        {
          style: "font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em;",
        },
        label
      ),
    ]
  );
}

// ---------------------------------------------------------------------------
// renderProgressCard — overall implementation progress bar
// ---------------------------------------------------------------------------

function renderProgressCard({ overallPct, completeCheckpoints, totalCheckpoints }) {
  return el(
    "div",
    {
      style: `${CARD_STYLE} padding: 24px;`,
      dataset: { testid: "progress-card" },
    },
    [
      el(
        "div",
        {
          style: "display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px;",
        },
        [
          el(
            "h2",
            { style: "font-size: 16px; font-weight: 600; color: #0c1a30; margin: 0;" },
            "Implementation Progress"
          ),
          el(
            "span",
            {
              style: "font-size: 13px; color: #64748b;",
              dataset: { testid: "progress-count" },
            },
            `${completeCheckpoints} of ${totalCheckpoints} checkpoints complete`
          ),
        ]
      ),
      el(
        "div",
        {
          style: "height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;",
        },
        [
          el("div", {
            style: `height: 100%; width: ${overallPct}%; background: #f59e0b; border-radius: 4px; transition: width 300ms ease;`,
            dataset: { testid: "progress-bar-fill" },
          }),
        ]
      ),
    ]
  );
}

// ---------------------------------------------------------------------------
// renderDomainsGrid — per-domain cards
// ---------------------------------------------------------------------------

function renderDomainsGrid({ domains, onNavigate }) {
  if (domains.length === 0) {
    return el(
      "div",
      {
        style: `${CARD_STYLE} padding: 32px; text-align: center; color: #64748b; font-size: 14px;`,
        dataset: { testid: "domain-grid-empty" },
      },
      "No activated domains yet. Complete onboarding to activate your implementation domains."
    );
  }

  return el(
    "div",
    {
      style: "display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;",
      dataset: { testid: "domain-grid" },
    },
    domains.map((d) => renderDomainCard(d, onNavigate))
  );
}

function renderDomainCard({ id, total, complete, status }, onNavigate) {
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;
  const displayName = humanizeDomainId(id);
  const wizardId = wizardForDomain(id);

  const badge = renderStatusBadge(status);
  const barColor = status === "Complete"
    ? "#10b981"
    : status === "Blocked"
      ? "#dc2626"
      : "#f59e0b";

  const actions = el(
    "div",
    { style: "display: flex; gap: 8px; flex-wrap: wrap;" },
    [
      el(
        "button",
        {
          style: wizardId ? AMBER_BUTTON_STYLE : `${AMBER_BUTTON_STYLE} opacity: 0.5; cursor: not-allowed;`,
          dataset: { testid: `domain-configure-${id}` },
          disabled: !wizardId,
          onclick: () => {
            if (wizardId && onNavigate) onNavigate(`wizard-${wizardId}`);
          },
        },
        "Configure"
      ),
      el(
        "button",
        {
          style: SECONDARY_BUTTON_STYLE,
          dataset: { testid: `domain-view-checkpoints-${id}` },
          onclick: () => {
            if (onNavigate) onNavigate("pipeline-dashboard");
          },
        },
        "View Checkpoints"
      ),
    ]
  );

  return el(
    "div",
    {
      style: `${CARD_STYLE} padding: 20px; display: flex; flex-direction: column; gap: 14px;`,
      dataset: { testid: `domain-card-${id}`, domainId: id },
    },
    [
      // Header: icon + name + status badge
      el(
        "div",
        { style: "display: flex; align-items: center; gap: 12px;" },
        [
          el(
            "div",
            {
              style: "background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); border-radius: 10px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #92400e; flex-shrink: 0;",
            },
            [lucideIcon(iconForDomain(id), 20)]
          ),
          el(
            "span",
            {
              style: "font-size: 15px; font-weight: 600; color: #0c1a30; flex: 1;",
              dataset: { testid: `domain-name-${id}` },
            },
            displayName
          ),
          badge,
        ]
      ),

      // Checkpoint count + progress bar
      el(
        "div",
        { style: "display: flex; flex-direction: column; gap: 6px;" },
        [
          el(
            "div",
            {
              style: "display: flex; justify-content: space-between; font-size: 12px; color: #64748b;",
            },
            [
              el(
                "span",
                { dataset: { testid: `domain-checkpoints-${id}` } },
                `${complete} of ${total} checkpoint${total === 1 ? "" : "s"} complete`
              ),
              el("span", {}, `${pct}%`),
            ]
          ),
          el(
            "div",
            {
              style: "height: 6px; background: #f1f5f9; border-radius: 4px; overflow: hidden;",
            },
            [
              el("div", {
                style: `height: 100%; width: ${pct}%; background: ${barColor}; border-radius: 4px; transition: width 300ms ease;`,
                dataset: { testid: `domain-progress-bar-${id}` },
              }),
            ]
          ),
        ]
      ),

      actions,
    ]
  );
}

function renderStatusBadge(status) {
  const palette = {
    "Not Started": { color: "#64748b", bg: "rgba(12,26,48,0.06)",  border: "rgba(12,26,48,0.1)" },
    "In Progress": { color: "#92400e", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
    "Complete":    { color: "#065f46", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
    "Blocked":     { color: "#991b1b", bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.25)" },
  };
  const p = palette[status] || palette["Not Started"];

  return el(
    "span",
    {
      style: `display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${p.color}; background: ${p.bg}; border: 1px solid ${p.border}; border-radius: 6px; padding: 2px 8px; white-space: nowrap;`,
      dataset: { testid: "domain-status-badge" },
    },
    status
  );
}

// ---------------------------------------------------------------------------
// Lifecycle / fallback states
// ---------------------------------------------------------------------------

function renderLoadingState() {
  return el(
    "div",
    {
      style: `${CARD_STYLE} padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: #64748b; font-family: Inter, sans-serif;`,
      dataset: { testid: "dashboard-loading" },
    },
    [
      el(
        "div",
        {
          style: "color: #f59e0b; animation: spin 1s linear infinite; display: flex;",
        },
        [lucideIcon("loader-2", 28)]
      ),
      el(
        "span",
        { style: "font-size: 14px; font-weight: 500;" },
        "Loading implementation state\u2026"
      ),
    ]
  );
}

function renderErrorState(errorMessage) {
  return el(
    "div",
    {
      style: `${CARD_STYLE} padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 12px; border-color: rgba(220,38,38,0.3); background: rgba(220,38,38,0.05); font-family: Inter, sans-serif;`,
      dataset: { testid: "dashboard-error" },
    },
    [
      el(
        "div",
        { style: "color: #b91c1c; display: flex;" },
        [lucideIcon("alert-triangle", 28)]
      ),
      el(
        "div",
        { style: "font-size: 14px; color: #991b1b; font-weight: 600; text-align: center;" },
        "Unable to load implementation state"
      ),
      el(
        "div",
        {
          style: "font-size: 12px; color: #7f1d1d; text-align: center; max-width: 480px;",
          dataset: { testid: "dashboard-error-message" },
        },
        errorMessage
      ),
      el(
        "button",
        {
          style: AMBER_BUTTON_STYLE,
          dataset: { testid: "dashboard-error-retry" },
          onclick: () => { void fetchPipelineState(); },
        },
        "Retry"
      ),
    ]
  );
}

function renderEmptyState(onNavigate) {
  return el(
    "div",
    {
      style: `${CARD_STYLE} padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; font-family: Inter, sans-serif;`,
      dataset: { testid: "dashboard-empty" },
    },
    [
      el(
        "div",
        { style: "color: #f59e0b; display: flex;" },
        [lucideIcon("clipboard-list", 32)]
      ),
      el(
        "h3",
        { style: "font-size: 16px; font-weight: 600; color: #0c1a30; margin: 0;" },
        "No pipeline data yet"
      ),
      el(
        "p",
        {
          style: "font-size: 13px; color: #64748b; margin: 0; text-align: center; max-width: 460px;",
        },
        "Complete onboarding to activate your implementation domains. Pipeline state will appear here once discovery answers are captured."
      ),
      el(
        "button",
        {
          style: AMBER_BUTTON_STYLE,
          dataset: { testid: "dashboard-empty-onboarding-cta" },
          onclick: () => {
            if (onNavigate) onNavigate("onboarding");
          },
        },
        "Start assessment \u2192"
      ),
    ]
  );
}
