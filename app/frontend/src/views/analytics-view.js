import { el } from "../lib/dom.js";
import { getImplementationState, getActivityLog, getSyncHistory } from "../state/implementationStore.js";
import {
  getModuleCompletionStatus,
  getGovernedRoadmapSteps,
  getCompletedWizards,
  getState as getAppState,
} from "../state/app-store.js";
import { getCheckpointRecords } from "./pipeline-dashboard.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { pipelineStore } from "../state/pipeline-store.js";

// ── Chart.js-whitelisted hex values ─────────────────────────────
// Chart.js renders into <canvas> and cannot resolve CSS custom
// properties. These mirror the light-theme ink/muted/chip tokens in
// tokens.css. Whitelisted per the Phase 2c analytics task spec.
const CHART_COLORS = {
  ink: "#0F0F10",
  muted: "#9A9AA0",
  lineSoft: "#F4F1EC",
  review: "#6B4F3E",
  reviewSoft: "#F4EFE7",
  ready: "#0F0F10",
  readySoft: "#EFEDE7",
  fillFrom: "rgba(15, 15, 16, 0.18)",
  fillTo: "rgba(15, 15, 16, 0.00)",
};

// ── Token-based style constants ─────────────────────────────────

const CANVAS_STYLE =
  "min-height: 100vh; background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), var(--color-canvas-base), var(--surface-texture); padding: var(--space-8) var(--space-5) var(--space-12); font-family: var(--font-body); color: var(--color-ink); box-sizing: border-box;";

const COLUMN_STYLE =
  "max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6);";

const HERO_WRAP_STYLE =
  "display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-6); flex-wrap: wrap;";

const HERO_TEXT_STYLE =
  "display: flex; flex-direction: column; gap: var(--space-3); min-width: 280px;";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; padding: 4px 12px; border: 1px solid var(--color-line); border-radius: var(--radius-pill); background: var(--color-surface); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle);";

const HERO_H1 =
  "font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 600; letter-spacing: var(--track-tight); line-height: var(--lh-snug); color: var(--color-ink); margin: 0;";

const HERO_MUTED = "color: var(--color-muted);";

const HERO_SUB =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0; line-height: var(--lh-body);";

const PANEL_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-5) var(--space-6);";

const PANEL_TITLE_STYLE =
  "font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 600; color: var(--color-ink); margin: 0 0 var(--space-2) 0;";

const PANEL_CAPTION_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted); text-transform: uppercase; letter-spacing: var(--track-eyebrow); margin: 0 0 var(--space-4) 0;";

const KPI_GRID_STYLE =
  "display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4);";

const KPI_TILE_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2);";

const KPI_LABEL_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted); text-transform: uppercase; letter-spacing: var(--track-eyebrow); margin: 0;";

const KPI_VALUE_STYLE =
  "font-family: var(--font-display); font-size: var(--fs-display); font-weight: 600; color: var(--color-ink); line-height: 1; letter-spacing: var(--track-tight); margin: 0;";

const KPI_META_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-muted); margin: 0;";

const CHART_GRID_STYLE =
  "display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-4);";

const CHART_HOLDER_STYLE =
  "position: relative; height: 260px;";

const BOTTLENECK_ROW_STYLE =
  "display: grid; grid-template-columns: auto 1fr auto; gap: var(--space-4); align-items: center; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-line-soft);";

const BOTTLENECK_ID_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted);";

const BOTTLENECK_LABEL_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-body); color: var(--color-ink);";

const RANGE_GROUP_STYLE =
  "display: inline-flex; align-items: center; gap: 6px; padding: 4px; background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-pill);";

const RANGE_PILL_BASE =
  "display: inline-flex; align-items: center; padding: 6px 14px; border-radius: var(--radius-pill); font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; border: none; cursor: pointer; transition: all var(--dur-base) var(--ease);";

const RANGE_PILL_ACTIVE = `${RANGE_PILL_BASE} background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg);`;
const RANGE_PILL_IDLE = `${RANGE_PILL_BASE} background: transparent; color: var(--color-muted);`;

const CHIP_BASE =
  "display: inline-flex; align-items: center; padding: 4px 10px; border-radius: var(--radius-pill); font-family: var(--font-mono); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow);";

const CHIP_READY = `${CHIP_BASE} background: var(--color-chip-ready-bg); color: var(--color-chip-ready-fg);`;
const CHIP_REVIEW = `${CHIP_BASE} background: var(--color-chip-review-bg); color: var(--color-chip-review-fg);`;
const CHIP_NEUTRAL = `${CHIP_BASE} background: var(--color-chip-bg); color: var(--color-chip-fg);`;

// ── Date range definitions ──────────────────────────────────────

const RANGES = [
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
  { id: "90d", label: "90d", days: 90 },
  { id: "all", label: "All", days: null },
];

function startOfWindow(days) {
  if (days === null || days === undefined) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function resolveInstanceHost(project) {
  const obState = onboardingStore.getState();
  const runtimeUrl =
    project?.connectionState?.url ??
    obState?.connection?.url ??
    null;
  if (!runtimeUrl) return "";
  try { return new URL(runtimeUrl).host; }
  catch { return String(runtimeUrl).replace(/^https?:\/\//i, "").split("/")[0]; }
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const hRem = hrs % 24;
  return hRem ? `${days}d ${hRem}h` : `${days}d`;
}

// ── Metric computation ──────────────────────────────────────────

function computeMetrics({ rangeDays, activityLog, governedRoadmap, checkpointRecords }) {
  const windowStart = startOfWindow(rangeDays);
  const inWindow = (iso) => {
    if (!iso) return false;
    if (!windowStart) return true;
    return new Date(iso) >= windowStart;
  };

  const confirmedThisWeek = checkpointRecords.filter(
    (cp) => cp?.status === "Complete" && inWindow(cp?.completed_at || cp?.updated_at)
  ).length;

  const writesExecuted = activityLog.filter(
    (e) => inWindow(e?.timestamp) &&
           (e?.status === "success" || e?.status === "partial") &&
           typeof e?.action === "string" && /push|captured|configuration/i.test(e.action)
  ).length;

  const roadmapStatuses = Object.values(governedRoadmap);
  const domainsProgressed = roadmapStatuses.filter(
    (s) => s === "complete" || s === "in-progress"
  ).length;

  const durations = [];
  const seen = new Map();
  for (const entry of activityLog) {
    if (!entry?.timestamp || !entry?.module) continue;
    if (!inWindow(entry.timestamp)) continue;
    const t = new Date(entry.timestamp).getTime();
    const prior = seen.get(entry.module);
    if (prior && t > prior && (entry.action || "").toLowerCase().includes("pushed")) {
      durations.push(t - prior);
    }
    seen.set(entry.module, t);
  }
  const avgMs = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const buckets = Math.min(rangeDays ?? 30, 30);
  const labels = [];
  const values = [];
  let running = 0;
  for (let i = buckets - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
    running += checkpointRecords.filter(
      (cp) => {
        if (cp?.status !== "Complete") return false;
        const ts = cp?.completed_at || cp?.updated_at;
        if (!ts) return false;
        const t = new Date(ts).getTime();
        return t >= d.getTime() && t < next.getTime();
      }
    ).length;
    values.push(running);
  }

  const distribution = {
    complete: roadmapStatuses.filter((s) => s === "complete").length,
    inProgress: roadmapStatuses.filter((s) => s === "in-progress").length,
    notStarted: Math.max(0, 30 - roadmapStatuses.filter((s) => s === "complete" || s === "in-progress").length),
  };

  const now = Date.now();
  const bottlenecks = checkpointRecords
    .filter((cp) => cp?.status && cp.status !== "Complete")
    .map((cp) => {
      const since = cp?.updated_at || cp?.created_at;
      const age = since ? now - new Date(since).getTime() : 0;
      return {
        id: cp?.id || cp?.checkpoint_id || "—",
        label: cp?.name || cp?.label || cp?.id || "Unnamed checkpoint",
        status: cp?.status || "Pending",
        age,
      };
    })
    .sort((a, b) => b.age - a.age)
    .slice(0, 6);

  return {
    confirmedThisWeek,
    writesExecuted,
    domainsProgressed,
    avgMs,
    velocity: { labels, values },
    distribution,
    bottlenecks,
  };
}

// ── View ────────────────────────────────────────────────────────

export function renderAnalyticsView({ project }) {
  const state = { range: "30d" };

  const root = el("div", { style: CANVAS_STYLE });
  const column = el("div", { style: COLUMN_STYLE });
  root.append(column);

  let chartInstances = [];

  function build() {
    while (column.firstChild) column.removeChild(column.firstChild);
    chartInstances.forEach((c) => { try { c.destroy(); } catch {} });
    chartInstances = [];

    const implState = getImplementationState();
    const activityLog = implState?.activityLog || getActivityLog();
    const syncHistory = implState?.syncHistory || getSyncHistory();
    const governedRoadmap = getGovernedRoadmapSteps();
    const moduleStatus = getModuleCompletionStatus();

    let checkpointRecords = [];
    try {
      const appState = getAppState();
      checkpointRecords = getCheckpointRecords(
        pipelineStore.getState()?.runtime_state ?? appState?.activeProject
      );
    } catch { checkpointRecords = []; }
    if (!Array.isArray(checkpointRecords)) checkpointRecords = [];

    const instanceHost = resolveInstanceHost(project);
    const rangeConfig = RANGES.find((r) => r.id === state.range) || RANGES[1];
    const metrics = computeMetrics({
      rangeDays: rangeConfig.days,
      activityLog,
      governedRoadmap,
      checkpointRecords,
    });

    // Hero
    const rangeControl = el("div", { style: RANGE_GROUP_STYLE },
      RANGES.map((r) =>
        el("button", {
          type: "button",
          style: r.id === state.range ? RANGE_PILL_ACTIVE : RANGE_PILL_IDLE,
          text: r.label,
          dataset: { testid: `analytics-range-${r.id}` },
          onClick: () => { state.range = r.id; build(); },
        })
      )
    );

    const hero = el("div", { style: HERO_WRAP_STYLE }, [
      el("div", { style: HERO_TEXT_STYLE }, [
        el("span", {
          style: EYEBROW_STYLE,
          text: instanceHost ? `ANALYTICS · ${instanceHost}` : "ANALYTICS · local",
        }),
        el("h1", { style: HERO_H1 }, [
          el("span", { text: "How your implementation is " }),
          el("span", { style: HERO_MUTED, text: "going" }),
        ]),
        el("p", {
          style: HERO_SUB,
          text: `window: ${rangeConfig.label} · last sync: ${syncHistory[0]?.timestamp ? new Date(syncHistory[0].timestamp).toLocaleString() : "none recorded"}`,
        }),
      ]),
      rangeControl,
    ]);

    // KPI tiles
    const kpiGrid = el("div", { style: KPI_GRID_STYLE }, [
      kpiTile({
        label: `Checkpoints confirmed · ${rangeConfig.label}`,
        value: String(metrics.confirmedThisWeek),
        meta: `${checkpointRecords.length} total governed`,
      }),
      kpiTile({
        label: `Writes executed · ${rangeConfig.label}`,
        value: String(metrics.writesExecuted),
        meta: metrics.writesExecuted ? "pushed to Odoo instance" : "no writes in window",
      }),
      kpiTile({
        label: "Domains progressed",
        value: String(metrics.domainsProgressed),
        meta: `${moduleStatus.completed}/${moduleStatus.total} wizards confirmed`,
      }),
      kpiTile({
        label: "Avg confirm → commit",
        value: formatDuration(metrics.avgMs),
        meta: metrics.avgMs ? "between paired activity events" : "insufficient paired events",
      }),
    ]);

    // Velocity + distribution
    const velocityPanel = el("div", { style: PANEL_STYLE }, [
      el("h2", { style: PANEL_TITLE_STYLE, text: "Velocity" }),
      el("p", { style: PANEL_CAPTION_STYLE, text: `cumulative confirmed checkpoints · ${rangeConfig.label}` }),
      el("div", { style: CHART_HOLDER_STYLE }, [
        el("canvas", { id: "chart-velocity" }),
      ]),
    ]);

    const distributionPanel = el("div", { style: PANEL_STYLE }, [
      el("h2", { style: PANEL_TITLE_STYLE, text: "Status distribution" }),
      el("p", { style: PANEL_CAPTION_STYLE, text: "roadmap steps" }),
      el("div", { style: CHART_HOLDER_STYLE }, [
        el("canvas", { id: "chart-distribution" }),
      ]),
    ]);

    const chartGrid = el("div", { style: CHART_GRID_STYLE }, [velocityPanel, distributionPanel]);

    // Bottlenecks panel
    const bottlenecksBody = metrics.bottlenecks.length
      ? el("div", {},
          metrics.bottlenecks.map((b) =>
            el("div", { style: BOTTLENECK_ROW_STYLE }, [
              el("span", { style: BOTTLENECK_ID_STYLE, text: String(b.id) }),
              el("span", { style: BOTTLENECK_LABEL_STYLE, text: String(b.label) }),
              el("span", {
                style: b.status === "Fail" ? CHIP_REVIEW : CHIP_NEUTRAL,
                text: `${b.status} · ${formatDuration(b.age)}`,
              }),
            ])
          )
        )
      : el("p", { style: KPI_META_STYLE, text: "No open checkpoints — nothing is stalling." });

    const bottlenecksPanel = el("div", { style: PANEL_STYLE }, [
      el("h2", { style: PANEL_TITLE_STYLE, text: "Bottlenecks" }),
      el("p", { style: PANEL_CAPTION_STYLE, text: "longest open checkpoints" }),
      bottlenecksBody,
    ]);

    // System signals (honest summary at bottom)
    const isConnected = project?.connectionState?.status?.startsWith("connected");
    const apiErrors = activityLog.filter((e) => e?.status === "error").length;
    const healthPanel = el("div", { style: PANEL_STYLE }, [
      el("h2", { style: PANEL_TITLE_STYLE, text: "System signals" }),
      el("p", { style: PANEL_CAPTION_STYLE, text: "honest read of the runtime" }),
      el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4);" }, [
        signalRow("Odoo connection", isConnected ? "Connected" : "Not connected", isConnected ? "ready" : "review"),
        signalRow("Wizards complete", `${moduleStatus.completed} of ${moduleStatus.total}`, moduleStatus.completed === moduleStatus.total ? "ready" : "neutral"),
        signalRow("API errors in log", String(apiErrors), apiErrors === 0 ? "ready" : "review"),
        signalRow("Governed checkpoints", String(checkpointRecords.length), "neutral"),
      ]),
    ]);

    column.append(hero, kpiGrid, chartGrid, bottlenecksPanel, healthPanel);

    setTimeout(() => drawCharts(metrics), 50);
  }

  function drawCharts(metrics) {
    if (typeof Chart === "undefined") return;

    const velocityCanvas = root.querySelector("#chart-velocity");
    if (velocityCanvas) {
      const ctx = velocityCanvas.getContext("2d");
      let fill = CHART_COLORS.fillFrom;
      try {
        const grad = ctx.createLinearGradient(0, 0, 0, velocityCanvas.offsetHeight || 220);
        grad.addColorStop(0, CHART_COLORS.fillFrom);
        grad.addColorStop(1, CHART_COLORS.fillTo);
        fill = grad;
      } catch {}
      try {
        const c = new Chart(velocityCanvas, {
          type: "line",
          data: {
            labels: metrics.velocity.labels,
            datasets: [{
              label: "Confirmed",
              data: metrics.velocity.values,
              borderColor: CHART_COLORS.ink,
              backgroundColor: fill,
              fill: true,
              tension: 0.32,
              pointRadius: 0,
              pointHoverRadius: 4,
              borderWidth: 2,
            }],
          },
          options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: CHART_COLORS.muted, font: { size: 11 } } },
              y: { beginAtZero: true, grid: { color: CHART_COLORS.lineSoft }, ticks: { color: CHART_COLORS.muted, font: { size: 11 }, precision: 0 } },
            },
          },
        });
        chartInstances.push(c);
      } catch {}
    }

    const distCanvas = root.querySelector("#chart-distribution");
    if (distCanvas) {
      try {
        const c = new Chart(distCanvas, {
          type: "bar",
          data: {
            labels: ["Roadmap"],
            datasets: [
              { label: "Complete",    data: [metrics.distribution.complete],    backgroundColor: CHART_COLORS.ready,     borderWidth: 0 },
              { label: "In progress", data: [metrics.distribution.inProgress], backgroundColor: CHART_COLORS.review,    borderWidth: 0 },
              { label: "Not started", data: [metrics.distribution.notStarted], backgroundColor: CHART_COLORS.lineSoft,  borderWidth: 0 },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { color: CHART_COLORS.muted, boxWidth: 10, font: { size: 11 } } },
            },
            scales: {
              x: { stacked: true, grid: { display: false }, ticks: { color: CHART_COLORS.muted, font: { size: 11 }, precision: 0 } },
              y: { stacked: true, grid: { display: false }, ticks: { display: false } },
            },
          },
        });
        chartInstances.push(c);
      } catch {}
    }
  }

  // Ensure Chart.js is present
  if (typeof Chart === "undefined") {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js";
    script.onload = () => build();
    document.head.append(script);
  }

  build();
  return root;
}

function kpiTile({ label, value, meta }) {
  return el("div", { style: KPI_TILE_STYLE }, [
    el("p", { style: KPI_LABEL_STYLE, text: label }),
    el("p", { style: KPI_VALUE_STYLE, text: value }),
    el("p", { style: KPI_META_STYLE, text: meta }),
  ]);
}

function signalRow(label, value, tone) {
  const chipStyle = tone === "ready" ? CHIP_READY : tone === "review" ? CHIP_REVIEW : CHIP_NEUTRAL;
  return el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
    el("span", { style: KPI_LABEL_STYLE, text: label }),
    el("span", { style: chipStyle, text: value }),
  ]);
}
