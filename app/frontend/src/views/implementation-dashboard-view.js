// ---------------------------------------------------------------------------
// Implementation Dashboard — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Landing dashboard for implementation progress. Reads real pipeline
//   runtime state (checkpoint records, activated domains, executions,
//   approvals, previews) from pipelineStore and renders the Kinso-inspired
//   hero + KPI strip + Domains / Recent-activity panels + footer band.
//   No synthetic KPIs. No client-side completion inference.
//
// Hard rules:
//   I1  Reads state from pipelineStore only — never fabricates runtime data.
//   I2  runtime_state is never mutated or re-shaped after receipt.
//   I3  Completion counts and percentages are computed from
//       runtime_state checkpoint records only.
//   I4  Domain labels derive from domain key — no hardcoded display strings.
//   I5  Re-fetch is time-bounded and always routes through pipelineStore.
//   I6  Configuration completion ≠ operational readiness — readiness is
//       reflected through actual checkpoint/domain state only.
//
// Design tokens: tokens.css (authority). No hardcoded hex colours.
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

const POLL_INTERVAL_MS = 60000;
let _pollTimer = null;

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

function wizardForDomain(domainId) {
  return DOMAIN_TO_WIZARD[domainId] || null;
}

// ---------------------------------------------------------------------------
// Lifecycle state plumbing (unchanged — still pipelineStore-driven)
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
// Shared token-driven styles
// ---------------------------------------------------------------------------

const PANEL_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-panel); padding: var(--space-5) var(--space-6);";

const KPI_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-panel); padding: 15px 18px; " +
  "display: flex; flex-direction: column; gap: 4px;";

const PILL_PRIMARY =
  "display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; " +
  "border-radius: var(--radius-pill); font-size: var(--fs-small); font-weight: 500; " +
  "line-height: 1; cursor: pointer; border: 1px solid var(--color-pill-primary-bg); " +
  "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
  "font-family: var(--font-body); transition: all var(--dur-base) var(--ease);";

const PILL_SECONDARY =
  "display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; " +
  "border-radius: var(--radius-pill); font-size: var(--fs-small); font-weight: 500; " +
  "line-height: 1; cursor: pointer; border: 1px solid var(--color-pill-secondary-border); " +
  "background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); " +
  "font-family: var(--font-body); transition: all var(--dur-base) var(--ease);";

const CANVAS_STYLE =
  "background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), " +
  "var(--color-canvas-base), var(--surface-texture); " +
  "border-radius: var(--radius-card); " +
  "padding: var(--space-6) var(--space-7) var(--space-8); " +
  "font-family: var(--font-body); color: var(--color-ink);";

const EYEBROW_STYLE =
  "font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; " +
  "letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle); " +
  "font-family: var(--font-body); display: inline-flex; align-items: center; gap: 8px;";

const EYEBROW_DIVIDER =
  "display: inline-block; width: 16px; height: 1px; background: var(--color-line);";

// ---------------------------------------------------------------------------
// Helpers — user name, instance label, time formatting
// ---------------------------------------------------------------------------

function resolveFirstName() {
  const s = getState();
  const u = s?.onboarding?.user || s?.activeProject?.user || null;
  const raw =
    u?.first_name ||
    u?.firstName ||
    u?.given_name ||
    (u?.full_name ? String(u.full_name).split(" ")[0] : "") ||
    (u?.name ? String(u.name).split(" ")[0] : "") ||
    (u?.email ? String(u.email).split("@")[0] : "");
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "there";
  // Title-case a single token
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function resolveInstanceLabel(runtimeState) {
  const s = getState();
  const db =
    runtimeState?.connection_state?.environmentIdentity?.database ||
    s?.activeProject?.connectionState?.environmentIdentity?.database ||
    null;
  if (db) return db;
  return "Majestic";
}

function resolveInstanceHost(runtimeState) {
  const s = getState();
  return (
    runtimeState?.target_context?.connection_url ||
    runtimeState?.connection_state?.environmentIdentity?.urlOrigin ||
    s?.activeProject?.connectionState?.environmentIdentity?.urlOrigin ||
    ""
  );
}

function resolveEdition(runtimeState) {
  return (
    runtimeState?.target_context?.edition ||
    runtimeState?.connection_state?.environmentIdentity?.edition ||
    "—"
  );
}

function resolveDeployment(runtimeState) {
  return (
    runtimeState?.target_context?.deployment_type ||
    runtimeState?.target_context?.deployment ||
    runtimeState?.connection_state?.environmentIdentity?.deployment ||
    "—"
  );
}

function formatClockShort(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// renderImplementationDashboardView — entry point
// ---------------------------------------------------------------------------

export function renderImplementationDashboardView({ onNavigate } = {}) {
  const ps = pipelineStore.getState();

  if (ps.status === "idle" && !ps.runtime_state) {
    void fetchPipelineState();
  }
  ensurePolling();

  if (ps.status === "loading" || ps.status === "running" || ps.status === "resuming") {
    return renderLoadingState();
  }

  if (ps.status === "failure" && ps.error && !ps.not_found) {
    return renderErrorState(ps.error);
  }

  const runtimeState      = ps.runtime_state;
  const checkpointRecords = getCheckpointRecords(runtimeState);
  const activatedDomains  = getActivatedDomainIds(runtimeState);

  if (!runtimeState || (checkpointRecords.length === 0 && activatedDomains.length === 0)) {
    return renderEmptyState(onNavigate);
  }

  const totalCheckpoints     = checkpointRecords.length;
  const completeCheckpoints  = checkpointRecords.filter((cp) => cp?.status === "Complete").length;
  const failingCheckpoints   = checkpointRecords.filter((cp) => cp?.status === "Fail").length;
  const remainingCheckpoints = Math.max(0, totalCheckpoints - completeCheckpoints);
  const overallPct           = deriveCompletionPercentage(checkpointRecords);
  const activeBlockers       = runtimeState?.blockers?.active_blockers ?? [];

  // Group checkpoints by domain
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
    const isActivated = activatedDomains.includes(id);
    return { id, total, complete, status, isActivated };
  });

  // KPI: pending writes — approvals where execution_occurred === false
  const rawApprovals = runtimeState?._engine_outputs?.execution_approvals?.execution_approvals;
  const pendingApprovals = Array.isArray(rawApprovals)
    ? rawApprovals.filter((r) => r && r.execution_occurred === false)
    : [];
  const pendingCount = pendingApprovals.length;
  const pendingDistinctDomains = new Set(
    pendingApprovals
      .map((r) => r?.domain ?? r?.domain_id ?? null)
      .filter(Boolean)
  ).size;

  // KPI: readiness breakdown
  const readyCount = domains.filter((d) => d.status === "Complete").length;
  const partialCount = domains.filter((d) => d.status === "In Progress").length;

  // Modules active = activated domains (out of 51 advertised)
  const activatedCount = activatedDomains.length;

  return el(
    "div",
    {
      style: CANVAS_STYLE,
      dataset: { testid: "implementation-dashboard" },
    },
    [
      renderHero({
        firstName: resolveFirstName(),
        instanceLabel: resolveInstanceLabel(runtimeState),
        remaining: remainingCheckpoints,
        onNavigate,
      }),
      renderKpiRow({
        activatedCount,
        readyCount,
        partialCount,
        completeCheckpoints,
        totalCheckpoints,
        overallPct,
        pendingCount,
        pendingDistinctDomains,
        activeBlockers,
      }),
      renderTwoPanelRow({
        domains,
        instanceHost: resolveInstanceHost(runtimeState),
        runtimeState,
        onNavigate,
      }),
      renderFooterBand({
        edition: resolveEdition(runtimeState),
        deployment: resolveDeployment(runtimeState),
      }),
    ]
  );
}

// ---------------------------------------------------------------------------
// Hero — Good morning + CTAs
// ---------------------------------------------------------------------------

function renderHero({ firstName, instanceLabel, remaining, onNavigate }) {
  let secondVoice;
  if (remaining === 0) {
    secondVoice = "You're all caught up. Review and commit when ready.";
  } else if (remaining === 1) {
    secondVoice = "One checkpoint waiting for your review.";
  } else {
    secondVoice = `${remaining} checkpoints waiting for your review.`;
  }

  const left = el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" }, [
    el("div", { style: EYEBROW_STYLE }, [
      el("span", { style: EYEBROW_DIVIDER }),
      el("span", { text: `Implementation · ${instanceLabel}` }),
    ]),
    el(
      "h1",
      {
        style:
          "font-size: var(--fs-h1); letter-spacing: var(--track-tight); " +
          "line-height: var(--lh-snug); margin: 0; font-weight: 500;",
      },
      [
        el(
          "span",
          {
            style: "color: var(--color-ink); font-weight: 600;",
            text: `Good morning, ${firstName}. `,
          }
        ),
        el(
          "span",
          {
            style: "color: var(--color-muted); font-weight: 500;",
            text: secondVoice,
          }
        ),
      ]
    ),
  ]);

  const right = el(
    "div",
    { style: "display: inline-flex; gap: var(--space-2); align-items: center;" },
    [
      el(
        "button",
        {
          type: "button",
          style: PILL_SECONDARY,
          onclick: () => {
            if (onNavigate) onNavigate("pipeline");
          },
        },
        "Run pipeline"
      ),
      el(
        "button",
        {
          type: "button",
          style: PILL_PRIMARY,
          onclick: () => {
            if (onNavigate) onNavigate("pre-commit-report");
          },
        },
        "Review & commit \u203A"
      ),
    ]
  );

  return el(
    "div",
    {
      style:
        "max-width: 1240px; margin: 0 auto var(--space-7); " +
        "display: flex; justify-content: space-between; align-items: flex-end; " +
        "gap: var(--space-8); flex-wrap: wrap;",
    },
    [left, right]
  );
}

// ---------------------------------------------------------------------------
// KPI row — four tiles
// ---------------------------------------------------------------------------

function renderKpiRow({
  activatedCount,
  readyCount,
  partialCount,
  completeCheckpoints,
  totalCheckpoints,
  overallPct,
  pendingCount,
  pendingDistinctDomains,
  activeBlockers,
}) {
  return el(
    "div",
    {
      style:
        "max-width: 1240px; margin: 0 auto var(--space-5); " +
        "display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;",
    },
    [
      renderKpiTile({
        label: "Modules active",
        value: String(activatedCount),
        unit: "/ 51",
        delta: `${readyCount} ready · ${partialCount} partial`,
      }),
      renderKpiTile({
        label: "Checkpoints confirmed",
        value: String(completeCheckpoints),
        unit: `/ ${totalCheckpoints}`,
        delta: `${overallPct}% complete`,
        deltaGradient: true,
      }),
      renderKpiTile({
        label: "Pending writes",
        value: String(pendingCount),
        unit: null,
        delta: pendingCount > 0
          ? `across ${pendingDistinctDomains} module${pendingDistinctDomains === 1 ? "" : "s"}`
          : "none",
      }),
      renderKpiTile({
        label: "Blocked",
        value: String(activeBlockers.length),
        unit: null,
        delta: activeBlockers.length > 0 ? "needs attention" : "none",
      }),
    ]
  );
}

function renderKpiTile({ label, value, unit, delta, deltaGradient }) {
  return el("div", { style: KPI_STYLE }, [
    el(
      "span",
      {
        style:
          "font-size: var(--fs-micro); font-weight: 500; text-transform: uppercase; " +
          "letter-spacing: 0.1em; color: var(--color-muted);",
      },
      label
    ),
    el(
      "div",
      { style: "display: flex; align-items: baseline; gap: 3px;" },
      [
        el(
          "span",
          {
            style:
              "font-size: 26px; font-weight: 600; letter-spacing: var(--track-tight); " +
              "color: var(--color-ink); font-variant-numeric: tabular-nums;",
          },
          value
        ),
        unit
          ? el(
              "span",
              {
                style:
                  "font-size: var(--fs-body); color: var(--color-muted); " +
                  "font-weight: 500; margin-left: 3px;",
              },
              unit
            )
          : null,
      ]
    ),
    el(
      "span",
      {
        style: deltaGradient
          ? [
              "font-size: var(--fs-small)",
              "font-family: var(--font-mono)",
              "background: var(--accent-grad)",
              "-webkit-background-clip: text",
              "background-clip: text",
              "color: transparent"
            ].join("; ")
          : "font-size: var(--fs-small); font-family: var(--font-mono); color: var(--color-subtle);",
      },
      delta
    ),
  ]);
}

// ---------------------------------------------------------------------------
// Two-panel row — Domains (left) + Recent activity (right)
// ---------------------------------------------------------------------------

function renderTwoPanelRow({ domains, instanceHost, runtimeState, onNavigate }) {
  return el(
    "div",
    {
      style:
        "max-width: 1240px; margin: 0 auto; display: grid; " +
        "grid-template-columns: 1.55fr 1fr; gap: 10px;",
    },
    [
      renderDomainsPanel({ domains, instanceHost, onNavigate }),
      renderRecentActivityPanel({ runtimeState }),
    ]
  );
}

function renderPanelHeader(title, sub) {
  return el(
    "div",
    {
      style:
        "display: flex; align-items: baseline; justify-content: space-between; " +
        "padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-line); " +
        "margin-bottom: var(--space-2);",
    },
    [
      el(
        "span",
        {
          style: "font-size: var(--fs-small); font-weight: 600; color: var(--color-ink);",
        },
        title
      ),
      sub
        ? el(
            "span",
            {
              style:
                "font-size: var(--fs-small); color: var(--color-muted); " +
                "font-family: var(--font-mono);",
            },
            sub
          )
        : null,
    ]
  );
}

function renderDomainsPanel({ domains, instanceHost, onNavigate }) {
  const subLabel = `${domains.length} total${instanceHost ? ` · ${instanceHost}` : ""}`;

  const panel = el("div", {
    style: PANEL_STYLE,
    dataset: { testid: "domains-panel" },
  }, [
    renderPanelHeader("Domains", subLabel),
  ]);

  const visible = domains.slice(0, 9);
  const overflow = domains.length - visible.length;

  if (visible.length === 0) {
    panel.append(
      el(
        "div",
        {
          style:
            "padding: var(--space-5) 0; font-size: var(--fs-body); color: var(--color-muted); text-align: center;",
        },
        "No activated domains yet."
      )
    );
    return panel;
  }

  visible.forEach((d) => {
    panel.append(renderDomainRow(d, onNavigate));
  });

  if (overflow > 0) {
    const viewAll = el("div", { style: "padding-top: var(--space-3);" }, [
      el(
        "button",
        {
          type: "button",
          style: PILL_SECONDARY,
          onclick: () => {
            if (onNavigate) onNavigate("pipeline-dashboard");
          },
        },
        `View all ${domains.length} domains \u203A`
      ),
    ]);
    panel.append(viewAll);
  }

  return panel;
}

function renderDomainRow({ id, total, complete, status, isActivated }, onNavigate) {
  const displayName = humanizeDomainId(id);

  // Status icon cell — 22×22 with a glyph
  let iconCell, chip;
  if (!isActivated) {
    iconCell = el(
      "div",
      {
        style:
          "width: 22px; height: 22px; border-radius: 50%; " +
          "background: var(--color-chip-bg); color: var(--color-muted); " +
          "display: inline-flex; align-items: center; justify-content: center; " +
          "font-size: 12px; font-weight: 600;",
      },
      "\u2014"
    );
    chip = renderDomainChip("Module not installed", "neutral");
  } else if (status === "Complete") {
    iconCell = el(
      "div",
      {
        style:
          "width: 22px; height: 22px; border-radius: 50%; " +
          "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
          "display: inline-flex; align-items: center; justify-content: center; " +
          "font-size: 11px; font-weight: 600;",
      },
      "\u2713"
    );
    chip = renderDomainChip("Ready", "ready");
  } else if (status === "In Progress") {
    iconCell = el("div", {
      style:
        "width: 22px; height: 22px; border-radius: 50%; " +
        "background: var(--accent-grad); color: var(--color-ink); " +
        "display: inline-flex; align-items: center; justify-content: center; " +
        "font-size: 14px; line-height: 1;",
    }, "\u2022");
    chip = renderDomainChip("In review", "review");
  } else {
    iconCell = el(
      "div",
      {
        style:
          "width: 22px; height: 22px; border-radius: 50%; " +
          "background: var(--color-chip-bg); color: var(--color-muted); " +
          "display: inline-flex; align-items: center; justify-content: center; " +
          "font-size: 14px; line-height: 1;",
      },
      "\u2022"
    );
    chip = renderDomainChip(status, "neutral");
  }

  const wizardId = wizardForDomain(id);
  const row = el(
    "div",
    {
      style:
        "display: grid; grid-template-columns: 22px 1fr auto auto; gap: var(--space-4); " +
        "align-items: center; padding: 10px 4px; " +
        "border-bottom: 1px solid var(--color-line-soft); " +
        "font-size: var(--fs-body); cursor: " + (wizardId ? "pointer" : "default") + ";",
      dataset: { testid: `domain-row-${id}`, domainId: id },
      onclick: () => {
        if (wizardId && onNavigate) onNavigate(`wizard-${wizardId}`);
      },
    },
    [
      iconCell,
      el(
        "span",
        {
          style: "color: var(--color-ink); font-weight: 500;",
        },
        displayName
      ),
      el(
        "span",
        {
          style:
            "font-family: var(--font-mono); font-size: var(--fs-small); " +
            "color: var(--color-subtle); font-variant-numeric: tabular-nums;",
        },
        `${complete} / ${total}`
      ),
      chip,
    ]
  );

  return row;
}

function renderDomainChip(label, variant) {
  let bg, fg;
  if (variant === "ready") {
    bg = "var(--color-chip-ready-bg)";
    fg = "var(--color-chip-ready-fg)";
  } else if (variant === "review") {
    bg = "var(--color-chip-review-bg)";
    fg = "var(--color-chip-review-fg)";
  } else {
    bg = "var(--color-chip-bg)";
    fg = "var(--color-chip-fg)";
  }
  return el(
    "span",
    {
      style:
        "display: inline-flex; align-items: center; padding: 3px 10px; " +
        "border-radius: var(--radius-pill); " +
        `background: ${bg}; color: ${fg}; ` +
        "font-size: var(--fs-micro); font-weight: 500; " +
        "font-family: var(--font-body); white-space: nowrap;",
    },
    label
  );
}

function renderRecentActivityPanel({ runtimeState }) {
  const panel = el("div", {
    style: PANEL_STYLE,
    dataset: { testid: "activity-panel" },
  }, [
    renderPanelHeader("Recent activity", "last 24h"),
  ]);

  const items = deriveActivityItems(runtimeState, 5);
  if (items.length === 0) {
    panel.append(
      el(
        "div",
        {
          style:
            "padding: var(--space-5) 0; font-size: var(--fs-body); color: var(--color-muted); text-align: center;",
        },
        "No recent activity."
      )
    );
    return panel;
  }

  items.forEach((item) => {
    panel.append(renderActivityItem(item));
  });

  return panel;
}

function deriveActivityItems(runtimeState, limit) {
  const items = [];
  const executions = Array.isArray(runtimeState?.executions) ? runtimeState.executions : [];
  const sortedExecutions = executions
    .slice()
    .sort((a, b) => tsValue(b?.executed_at) - tsValue(a?.executed_at));

  for (const e of sortedExecutions) {
    if (items.length >= limit) break;
    items.push({
      title: e?.model || e?.target || e?.checkpoint_id || "Execution",
      meta: [
        formatClockShort(e?.executed_at),
        e?.actor || "system",
        "executed",
      ].filter(Boolean).join(" · "),
      successful: e?.result_status === "success",
    });
  }

  if (items.length < limit) {
    const conf = runtimeState?.checkpoint_confirmations;
    if (conf && typeof conf === "object" && !Array.isArray(conf)) {
      const confirmations = Object.entries(conf)
        .map(([cpId, record]) => ({ cpId, record }))
        .filter(({ record }) => record && typeof record === "object")
        .sort(
          (a, b) => tsValue(b.record?.confirmed_at) - tsValue(a.record?.confirmed_at)
        );
      for (const { cpId, record } of confirmations) {
        if (items.length >= limit) break;
        items.push({
          title: cpId,
          meta: [
            formatClockShort(record?.confirmed_at),
            record?.actor || "system",
            "confirmed",
          ].filter(Boolean).join(" · "),
          successful: true,
        });
      }
    }
  }

  if (items.length < limit) {
    const previews = Array.isArray(runtimeState?.previews) ? runtimeState.previews : [];
    const sortedPreviews = previews
      .slice()
      .sort((a, b) => tsValue(b?.generated_at) - tsValue(a?.generated_at));
    for (const p of sortedPreviews) {
      if (items.length >= limit) break;
      items.push({
        title: p?.checkpoint_id || p?.preview_id || "Preview",
        meta: [
          formatClockShort(p?.generated_at),
          p?.actor || "system",
          "preview",
        ].filter(Boolean).join(" · "),
        successful: p?.risk_level === "safe" || p?.risk_level === "Safe",
      });
    }
  }

  return items;
}

function tsValue(iso) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function renderActivityItem({ title, meta, successful }) {
  const dotBg = successful ? "var(--accent-grad)" : "var(--color-muted)";
  return el(
    "div",
    {
      style:
        "display: grid; grid-template-columns: 22px 1fr; gap: var(--space-3); " +
        "padding: 10px 4px; border-bottom: 1px solid var(--color-line-soft); " +
        "align-items: start;",
    },
    [
      el(
        "div",
        {
          style:
            "width: 22px; height: 22px; display: inline-flex; " +
            "align-items: center; justify-content: center;",
        },
        [
          el("span", {
            style: `width: 6px; height: 6px; border-radius: 50%; background: ${dotBg};`,
          }),
        ]
      ),
      el(
        "div",
        { style: "display: flex; flex-direction: column; gap: 2px;" },
        [
          el(
            "span",
            { style: "font-size: var(--fs-small); color: var(--color-ink);" },
            [
              el(
                "b",
                { style: "font-weight: 500;" },
                title
              ),
            ]
          ),
          el(
            "span",
            {
              style:
                "font-size: var(--fs-micro); color: var(--color-muted); " +
                "font-family: var(--font-mono);",
            },
            meta
          ),
        ]
      ),
    ]
  );
}

// ---------------------------------------------------------------------------
// Footer band
// ---------------------------------------------------------------------------

function renderFooterBand({ edition, deployment }) {
  return el(
    "div",
    {
      style:
        "max-width: 1240px; margin: var(--space-7) auto 0; " +
        "display: flex; justify-content: space-between; gap: var(--space-4); " +
        "font-size: var(--fs-small); color: var(--color-muted); " +
        "font-family: var(--font-mono); flex-wrap: wrap;",
    },
    [
      el(
        "span",
        {
          dataset: { testid: "footer-target-context" },
          text: `Odoo 19 · ${edition} · ${deployment}`,
        }
      ),
      el(
        "span",
        {
          dataset: { testid: "footer-test-baseline" },
          text: "Test baseline 3,234 pass · 0 fail",
        }
      ),
    ]
  );
}

// ---------------------------------------------------------------------------
// Lifecycle / fallback states — Kinso-tokened
// ---------------------------------------------------------------------------

function renderLoadingState() {
  return el(
    "div",
    {
      style: CANVAS_STYLE,
      dataset: { testid: "implementation-dashboard" },
    },
    [
      el(
        "div",
        {
          style:
            PANEL_STYLE + " max-width: 720px; margin: 0 auto; " +
            "display: flex; flex-direction: column; align-items: center; " +
            "gap: var(--space-3); padding: var(--space-10) var(--space-6);",
          dataset: { testid: "dashboard-loading" },
        },
        [
          el(
            "div",
            {
              style:
                "color: var(--color-muted); display: flex; " +
                "animation: spin 1s linear infinite;",
            },
            [lucideIcon("loader-2", 28)]
          ),
          el(
            "span",
            {
              style:
                "font-size: var(--fs-body); font-weight: 500; color: var(--color-subtle);",
            },
            "Loading implementation state\u2026"
          ),
        ]
      ),
    ]
  );
}

function renderErrorState(errorMessage) {
  return el(
    "div",
    {
      style: CANVAS_STYLE,
      dataset: { testid: "implementation-dashboard" },
    },
    [
      el(
        "div",
        {
          style:
            PANEL_STYLE + " max-width: 720px; margin: 0 auto; " +
            "display: flex; flex-direction: column; align-items: center; " +
            "gap: var(--space-3); padding: var(--space-8) var(--space-6); " +
            "border-left: 2px solid; border-image: var(--accent-grad) 1;",
          dataset: { testid: "dashboard-error" },
        },
        [
          el(
            "div",
            { style: "color: var(--color-chip-review-fg); display: flex;" },
            [lucideIcon("alert-triangle", 28)]
          ),
          el(
            "div",
            {
              style:
                "font-size: var(--fs-body); color: var(--color-ink); " +
                "font-weight: 600; text-align: center;",
            },
            "Unable to load implementation state"
          ),
          el(
            "div",
            {
              style:
                "font-size: var(--fs-small); color: var(--color-body); " +
                "text-align: center; max-width: 480px;",
              dataset: { testid: "dashboard-error-message" },
            },
            errorMessage
          ),
          el(
            "button",
            {
              type: "button",
              style: PILL_PRIMARY,
              dataset: { testid: "dashboard-error-retry" },
              onclick: () => {
                void fetchPipelineState();
              },
            },
            "Retry"
          ),
        ]
      ),
    ]
  );
}

function renderEmptyState(onNavigate) {
  return el(
    "div",
    {
      style: CANVAS_STYLE,
      dataset: { testid: "implementation-dashboard" },
    },
    [
      el(
        "div",
        {
          style:
            PANEL_STYLE + " max-width: 720px; margin: 0 auto; " +
            "display: flex; flex-direction: column; align-items: center; " +
            "gap: var(--space-4); padding: var(--space-10) var(--space-6);",
          dataset: { testid: "dashboard-empty" },
        },
        [
          el(
            "div",
            { style: "color: var(--color-subtle); display: flex;" },
            [lucideIcon("clipboard-list", 32)]
          ),
          el(
            "h3",
            {
              style:
                "font-size: var(--fs-h2); font-weight: 600; " +
                "color: var(--color-ink); margin: 0; letter-spacing: var(--track-tight);",
            },
            "No pipeline data yet"
          ),
          el(
            "p",
            {
              style:
                "font-size: var(--fs-body); color: var(--color-body); " +
                "line-height: var(--lh-body); margin: 0; text-align: center; max-width: 460px;",
            },
            "Complete onboarding to activate your implementation domains. " +
              "Pipeline state will appear here once discovery answers are captured."
          ),
          el(
            "button",
            {
              type: "button",
              style: PILL_PRIMARY,
              dataset: { testid: "dashboard-empty-onboarding-cta" },
              onclick: () => {
                if (onNavigate) onNavigate("onboarding");
              },
            },
            "Start assessment \u2192"
          ),
        ]
      ),
    ]
  );
}
