import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { getState } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";

const PAGE_SIZE = 50;

const CANVAS_STYLE =
  "background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), " +
  "var(--color-canvas-base), var(--surface-texture); " +
  "padding: var(--space-6) var(--space-7) var(--space-8); " +
  "font-family: var(--font-body); color: var(--color-ink);";

const PANEL_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-panel);";

const CARD_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-card);";

const PILL_SECONDARY =
  "display: inline-flex; align-items: center; gap: 8px; " +
  "padding: 9px 16px; border-radius: var(--radius-pill); " +
  "background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); " +
  "border: 1px solid var(--color-pill-secondary-border); " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "cursor: pointer; transition: all var(--dur-base) var(--ease);";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; " +
  "padding: 4px 12px; border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-pill); background: var(--color-surface); " +
  "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; " +
  "text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); " +
  "color: var(--color-subtle);";

const MONO_META_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted);";

const FIELD_STYLE =
  "width: 100%; box-sizing: border-box; " +
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-input); padding: 10px 12px; " +
  "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-ink); " +
  "outline: none; transition: border-color var(--dur-fast) var(--ease);";

const FIELD_LABEL_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-micro); " +
  "text-transform: uppercase; letter-spacing: var(--track-eyebrow); " +
  "font-weight: 600; color: var(--color-muted);";

const WRITE_ACTIONS = new Set(["checkpoint_executed", "commit_approved"]);

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "checkpoint_confirmed", label: "Checkpoint Confirmed" },
  { value: "checkpoint_executed", label: "Checkpoint Executed" },
  { value: "pipeline_run", label: "Pipeline Run" },
  { value: "member_invited", label: "Member Invited" },
  { value: "member_removed", label: "Member Removed" },
  { value: "member_role_changed", label: "Role Changed" },
  { value: "commit_approved", label: "Commit Approved" },
  { value: "commit_cancelled", label: "Commit Cancelled" },
  { value: "report_generated", label: "Report Generated" },
];

const ACTION_LABELS = {
  checkpoint_confirmed: "confirmed a checkpoint",
  checkpoint_executed: "executed a checkpoint",
  pipeline_run: "ran the pipeline",
  member_invited: "invited a team member",
  member_removed: "removed a team member",
  member_role_changed: "changed a member's role",
  commit_approved: "committed changes to Odoo",
  commit_cancelled: "cancelled a commit",
  report_generated: "generated a pre-commit report",
};

function bindFocusBorder(node) {
  if (!node) return;
  node.addEventListener("focus", () => {
    node.style.borderColor = "var(--color-ink)";
  });
  node.addEventListener("blur", () => {
    node.style.borderColor = "var(--color-line)";
  });
}

function resolveProjectId(project) {
  const onboardingState = onboardingStore.getState();
  const storeProject = getState().activeProject;
  return (
    onboardingState?.connection?.project_id ||
    project?.projectIdentity?.projectId ||
    storeProject?.projectIdentity?.projectId ||
    null
  );
}

function deriveInstanceHost(url, database) {
  const raw = typeof url === "string" ? url.trim() : "";
  if (raw) {
    try {
      return new URL(raw).hostname;
    } catch {
      const stripped = raw.replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
      if (stripped) return stripped;
    }
  }
  const db = typeof database === "string" ? database.trim() : "";
  return db || "NEW";
}

function buildHeaders(token, includeJson = true) {
  const headers = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readJsonResponse(response) {
  const raw = await response.text();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

async function requestAuditJson(url, token) {
  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token, false),
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) throw new Error(payload.error || "Failed to load audit log.");
  if (payload?.error) throw new Error(payload.error);
  return payload;
}

function parseExportFilename(contentDisposition) {
  if (!contentDisposition) return "";
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try { return decodeURIComponent(utf8Match[1]); } catch { return utf8Match[1]; }
  }
  const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return simpleMatch?.[1] || "";
}

function humanizeToken(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getActionLabel(action) {
  return ACTION_LABELS[action] || humanizeToken(action || "unknown action").toLowerCase();
}

function isWriteAction(action) {
  return WRITE_ACTIONS.has(action);
}

function roleLabel(role) {
  if (role === "project_lead") return "Project Lead";
  if (role === "implementor") return "Implementor";
  if (role === "reviewer") return "Reviewer";
  if (role === "stakeholder") return "Stakeholder";
  return role ? humanizeToken(role) : "";
}

function roleChip(role) {
  const label = roleLabel(role);
  if (!label) return null;
  let bg = "var(--color-chip-bg)";
  let fg = "var(--color-chip-fg)";
  if (role === "implementor") {
    bg = "var(--color-chip-review-bg)";
    fg = "var(--color-chip-review-fg)";
  } else if (role === "reviewer") {
    bg = "var(--color-chip-ready-bg)";
    fg = "var(--color-chip-ready-fg)";
  }
  return el("span", {
    style:
      `display: inline-flex; align-items: center; padding: 2px 8px; ` +
      `border-radius: var(--radius-pill); background: ${bg}; color: ${fg}; ` +
      `font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600;`,
    text: label,
  });
}

function formatAuditTimestamp(value) {
  if (!value) return "Timestamp unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Timestamp unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function toIsoDate(value, endOfDay = false) {
  if (!value) return "";
  const parsed = new Date(`${value}${endOfDay ? "T23:59:59.999" : "T00:00:00.000"}`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function hasActiveFilters(filters) {
  return Boolean(filters.actor || filters.action || filters.domain || filters.from || filters.to);
}

function normalizeDetails(details) {
  if (Array.isArray(details)) return details;
  if (details && typeof details === "object") return details;
  if (typeof details === "string" && details.trim()) {
    try { return JSON.parse(details); } catch { return { value: details }; }
  }
  if (details === null || details === undefined || details === "") return {};
  return { value: details };
}

function stringifyDetails(details) {
  try {
    return JSON.stringify(normalizeDetails(details), null, 2);
  } catch {
    return JSON.stringify({ value: "Unable to render details." }, null, 2);
  }
}

function normalizeAuditEntry(entry, index) {
  const actorObject = entry?.actor && typeof entry.actor === "object" ? entry.actor : null;
  const actorName = String(
    entry?.actor_name || entry?.actorName || actorObject?.full_name ||
    actorObject?.name || entry?.user_name || entry?.userName || "Unknown actor"
  ).trim() || "Unknown actor";
  const actorRole = String(
    entry?.actor_role || entry?.actorRole || actorObject?.role || entry?.role || ""
  ).trim();
  const action = String(entry?.action || entry?.event || entry?.type || "").trim() || "unknown_action";
  const domain = String(entry?.domain || entry?.domain_id || entry?.domainId || "").trim();
  const checkpointId = String(entry?.checkpoint_id || entry?.checkpointId || "").trim();
  const timestamp = entry?.timestamp || entry?.created_at || entry?.occurred_at ||
    entry?.executed_at || entry?.confirmed_at || "";
  const id = String(
    entry?.id || entry?.audit_id || entry?.auditId ||
    `${timestamp}-${action}-${actorName}-${checkpointId || index}`
  );
  return {
    id, actorName, actorRole, action, domain, checkpointId, timestamp,
    details: normalizeDetails(entry?.details),
  };
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    const leftTime = new Date(left.timestamp).getTime();
    const rightTime = new Date(right.timestamp).getTime();
    const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
    return safeRight - safeLeft;
  });
}

function mergeEntries(existingEntries, newEntries) {
  const merged = new Map();
  existingEntries.forEach((entry) => merged.set(entry.id, entry));
  newEntries.forEach((entry) => merged.set(entry.id, entry));
  return sortEntries([...merged.values()]);
}

function buildAuditUrl(projectId, filters, options = {}) {
  const params = new URLSearchParams();
  if (filters.actor) params.set("actor", filters.actor.trim());
  if (filters.action) params.set("action", filters.action);
  if (filters.domain) params.set("domain", filters.domain.trim());
  const fromIso = toIsoDate(filters.from, false);
  const toIso = toIsoDate(filters.to, true);
  if (fromIso) params.set("from", fromIso);
  if (toIso) params.set("to", toIso);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));
  const basePath = options.exportMode
    ? `/api/audit/${encodeURIComponent(projectId)}/export`
    : `/api/audit/${encodeURIComponent(projectId)}`;
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function createFieldShell(label, control, style = "") {
  return el("label", {
    style: `display: flex; flex-direction: column; gap: 6px;${style ? ` ${style}` : ""}`,
  }, [
    el("span", { style: FIELD_LABEL_STYLE, text: label }),
    control,
  ]);
}

function createLoadingIndicator(text = "Loading audit entries...") {
  const icon = lucideIcon("refresh-cw", 16);
  icon.style.color = "var(--color-muted)";
  return el("div", {
    style:
      "display: inline-flex; align-items: center; gap: 8px; " +
      "color: var(--color-muted); font-size: var(--fs-small); " +
      "font-family: var(--font-body); padding: 4px 0;",
  }, [
    icon,
    el("span", { text }),
  ]);
}

function createMessageBanner(message) {
  return el("div", {
    style:
      "background: var(--color-chip-review-bg); " +
      "border: 1px solid var(--color-chip-review-fg); " +
      "border-radius: var(--radius-panel); " +
      "padding: var(--space-3) var(--space-4); " +
      "color: var(--color-chip-review-fg); " +
      "font-size: var(--fs-small); font-family: var(--font-body);",
    text: message,
  });
}

function createEmptyState({ filtered, onClearFilters }) {
  const icon = lucideIcon(filtered ? "search" : "clipboard-list", 40);
  icon.style.color = "var(--color-subtle)";
  return el("div", {
    style:
      `${PANEL_STYLE} padding: var(--space-8) var(--space-6); ` +
      `display: flex; flex-direction: column; align-items: center; ` +
      `text-align: center; gap: var(--space-3);`,
  }, [
    icon,
    el("h3", {
      style:
        "margin: 0; font-size: var(--fs-h3); font-weight: 600; " +
        "color: var(--color-ink); letter-spacing: var(--track-tight);",
      text: filtered ? "No entries match your filters." : "No audit entries yet.",
    }),
    el("p", {
      style:
        "margin: 0; font-size: var(--fs-body); color: var(--color-muted); " +
        "max-width: 420px; line-height: var(--lh-body);",
      text: filtered
        ? "Try adjusting or clearing the current filters."
        : "Actions taken in this project will appear here.",
    }),
    filtered
      ? el("button", {
          type: "button",
          style: PILL_SECONDARY,
          onclick: onClearFilters,
          text: "Clear filters",
        })
      : null,
  ]);
}

function createErrorState(message, onRetry) {
  const icon = lucideIcon("alert-circle", 40);
  icon.style.color = "var(--color-chip-review-fg)";
  return el("div", {
    style:
      `${PANEL_STYLE} padding: var(--space-8) var(--space-6); ` +
      `display: flex; flex-direction: column; align-items: center; ` +
      `text-align: center; gap: var(--space-3);`,
  }, [
    icon,
    el("h3", {
      style:
        "margin: 0; font-size: var(--fs-h3); font-weight: 600; " +
        "color: var(--color-ink); letter-spacing: var(--track-tight);",
      text: "Audit log unavailable.",
    }),
    el("p", {
      style:
        "margin: 0; font-size: var(--fs-body); color: var(--color-muted); " +
        "max-width: 460px; line-height: var(--lh-body);",
      text: message,
    }),
    el("button", {
      type: "button",
      style: PILL_SECONDARY,
      onclick: onRetry,
      text: "Retry",
    }),
  ]);
}

function renderTimelineColumn(index, totalEntries, action) {
  const isWrite = isWriteAction(action);
  const dotStyle = isWrite
    ? "background: var(--accent-grad);"
    : "background: var(--color-subtle);";
  const dot = el("span", {
    style:
      `position: absolute; top: 18px; left: 50%; width: 6px; height: 6px; ` +
      `border-radius: 50%; transform: translate(-50%, -50%); ${dotStyle} ` +
      `box-shadow: 0 0 0 3px var(--color-surface);`,
  });
  const line = totalEntries > 1
    ? el("span", {
        style:
          `position: absolute; left: 50%; transform: translateX(-50%); ` +
          `top: ${index === 0 ? "18px" : "0"}; ` +
          `bottom: ${index === totalEntries - 1 ? "calc(100% - 18px)" : "0"}; ` +
          `width: 1px; background: var(--color-line);`,
      })
    : null;
  return el("div", {
    style: "width: 16px; flex-shrink: 0; position: relative; align-self: stretch;",
  }, [line, dot]);
}

function renderMetadataLine(entry) {
  if (!entry.domain && !entry.checkpointId) return null;
  const parts = [];
  if (entry.domain) parts.push(humanizeToken(entry.domain));
  if (entry.checkpointId) parts.push(entry.checkpointId);
  return el("div", {
    style:
      "font-family: var(--font-mono); font-size: var(--fs-small); " +
      "color: var(--color-muted); display: flex; align-items: center; " +
      "gap: 8px; flex-wrap: wrap;",
  }, parts.flatMap((part, index) => {
    const children = [el("span", { text: part })];
    if (index < parts.length - 1) children.push(el("span", { text: "·" }));
    return children;
  }));
}

function renderEntry(entry, index, totalEntries, expandedDetails, onToggleDetails) {
  const detailsVisible = expandedDetails.has(entry.id);
  const chip = roleChip(entry.actorRole);
  return el("div", {
    style: "display: flex; align-items: stretch; gap: var(--space-3); padding-bottom: var(--space-3);",
  }, [
    renderTimelineColumn(index, totalEntries, entry.action),
    el("article", {
      style:
        `${CARD_STYLE} flex: 1; padding: var(--space-3) var(--space-4); ` +
        `display: flex; flex-direction: column; gap: var(--space-2);`,
    }, [
      el("div", {
        style:
          "display: flex; align-items: flex-start; justify-content: space-between; " +
          "gap: var(--space-3); flex-wrap: wrap;",
      }, [
        el("div", {
          style: "display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; min-width: 0;",
        }, [
          el("span", {
            style: "font-size: var(--fs-body); font-weight: 600; color: var(--color-ink);",
            text: entry.actorName,
          }),
          chip,
          el("span", {
            style: "font-size: var(--fs-body); color: var(--color-body);",
            text: getActionLabel(entry.action),
          }),
        ]),
        el("span", {
          style:
            "font-family: var(--font-mono); font-size: var(--fs-small); " +
            "color: var(--color-muted); white-space: nowrap;",
          text: formatAuditTimestamp(entry.timestamp),
        }),
      ]),
      renderMetadataLine(entry),
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" }, [
        el("button", {
          type: "button",
          style:
            "align-self: flex-start; background: none; border: none; " +
            "color: var(--color-subtle); font-family: var(--font-body); " +
            "font-size: var(--fs-small); font-weight: 500; " +
            "cursor: pointer; padding: 0;",
          onclick: () => onToggleDetails(entry.id),
          text: detailsVisible ? "Hide details" : "Show details",
        }),
        detailsVisible
          ? el("pre", {
              style:
                "margin: 0; background: var(--color-canvas-base); " +
                "border: 1px solid var(--color-line-soft); " +
                "border-radius: var(--radius-chip); padding: var(--space-3); " +
                "font-family: var(--font-mono); font-size: var(--fs-small); " +
                "color: var(--color-body); overflow-x: auto; white-space: pre-wrap;",
            }, stringifyDetails(entry.details))
          : null,
      ]),
    ]),
  ]);
}

export function renderAuditLogView(container) {
  const isMountContainer = typeof HTMLElement !== "undefined" && container instanceof HTMLElement;
  const props = isMountContainer ? {} : (container || {});
  const project = props?.project || (props?.projectIdentity ? props : null);

  const state = {
    loading: true,
    loadingMore: false,
    exporting: false,
    fetchError: "",
    bannerError: "",
    entries: [],
    total: 0,
    filters: { actor: "", action: "", domain: "", from: "", to: "" },
    expandedDetails: new Set(),
  };

  let latestRequestId = 0;
  let actorTimer = null;
  let domainTimer = null;

  const viewRoot = el("section", {
    style: `${CANVAS_STYLE} max-width: 1120px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-5);`,
    dataset: { testid: "audit-log-view" },
  });

  const exportButtonLabel = el("span", { text: "Export CSV" });
  const exportButton = el("button", {
    type: "button",
    style: PILL_SECONDARY,
    onclick: () => { void handleExport(); },
  }, [
    lucideIcon("download", 16),
    exportButtonLabel,
  ]);

  const actorInput = el("input", {
    type: "text",
    placeholder: "Filter by person",
    value: state.filters.actor,
    style: FIELD_STYLE,
    oninput: (event) => {
      state.filters.actor = event.target.value;
      render();
      if (actorTimer) clearTimeout(actorTimer);
      actorTimer = setTimeout(() => { void fetchEntries({ append: false }); }, 300);
    },
  });
  bindFocusBorder(actorInput);

  const actionSelect = el("select", {
    style: FIELD_STYLE,
    onchange: (event) => {
      state.filters.action = event.target.value;
      render();
      void fetchEntries({ append: false });
    },
  }, ACTION_OPTIONS.map((option) => el("option", {
    value: option.value,
    selected: option.value === state.filters.action,
    text: option.label,
  })));
  bindFocusBorder(actionSelect);

  const domainInput = el("input", {
    type: "text",
    placeholder: "Filter by domain",
    value: state.filters.domain,
    style: FIELD_STYLE,
    oninput: (event) => {
      state.filters.domain = event.target.value;
      render();
      if (domainTimer) clearTimeout(domainTimer);
      domainTimer = setTimeout(() => { void fetchEntries({ append: false }); }, 300);
    },
  });
  bindFocusBorder(domainInput);

  const fromInput = el("input", {
    type: "date",
    value: state.filters.from,
    style: FIELD_STYLE,
    onchange: (event) => {
      state.filters.from = event.target.value;
      render();
      void fetchEntries({ append: false });
    },
  });
  bindFocusBorder(fromInput);

  const toInput = el("input", {
    type: "date",
    value: state.filters.to,
    style: FIELD_STYLE,
    onchange: (event) => {
      state.filters.to = event.target.value;
      render();
      void fetchEntries({ append: false });
    },
  });
  bindFocusBorder(toInput);

  const clearFiltersLink = el("button", {
    type: "button",
    style:
      "display: none; align-self: flex-end; background: none; border: none; " +
      "color: var(--color-subtle); font-family: var(--font-body); " +
      "font-size: var(--fs-small); font-weight: 500; cursor: pointer; padding: 0;",
    onclick: () => { clearFilters(); },
    text: "Clear filters",
  });

  const eyebrowEl = el("span", { style: EYEBROW_STYLE, text: "AUDIT · NEW" });
  const metaEl = el("div", { style: MONO_META_STYLE, text: "" });
  const bannerEl = el("div");
  const contentEl = el("div");
  const footerEl = el("div");

  viewRoot.append(
    el("div", {
      style:
        `position: sticky; top: 0; z-index: 20; ${PANEL_STYLE} ` +
        `padding: var(--space-4) var(--space-5); ` +
        `display: flex; align-items: center; justify-content: space-between; ` +
        `gap: var(--space-4); flex-wrap: wrap;`,
    }, [
      el("div", {
        style: "display: flex; flex-direction: column; gap: var(--space-2); min-width: 240px; flex: 1 1 360px;",
      }, [
        eyebrowEl,
        el("h1", {
          style:
            "margin: 0; font-size: var(--fs-h1); font-weight: 600; " +
            "letter-spacing: var(--track-tight); line-height: var(--lh-snug); " +
            "color: var(--color-ink); font-family: var(--font-body);",
          text: "Activity",
        }),
        metaEl,
      ]),
      exportButton,
    ]),
    el("section", {
      style:
        `${PANEL_STYLE} padding: var(--space-4) var(--space-5); ` +
        `display: flex; flex-wrap: wrap; gap: var(--space-3) var(--space-4); ` +
        `align-items: flex-end;`,
    }, [
      createFieldShell("Actor", actorInput, "flex: 1 1 180px; min-width: 180px;"),
      createFieldShell("Action", actionSelect, "flex: 1 1 220px; min-width: 220px;"),
      createFieldShell("Domain", domainInput, "flex: 1 1 180px; min-width: 180px;"),
      createFieldShell("Date range", el("div", {
        style: "display: flex; align-items: center; gap: 8px; min-width: 0;",
      }, [fromInput, toInput]), "flex: 1 1 260px; min-width: 260px;"),
      clearFiltersLink,
    ]),
    bannerEl,
    contentEl,
    footerEl,
  );

  if (isMountContainer) {
    clearNode(container);
    container.append(viewRoot);
  }

  function getResolvedProjectId() {
    return resolveProjectId(project);
  }

  function getSessionToken() {
    return onboardingStore.getState()?.sessionToken || null;
  }

  function syncHeaderMeta() {
    const onboardingState = onboardingStore.getState();
    const url = onboardingState?.connection?.url || "";
    const database = onboardingState?.connection?.database || "";
    const host = deriveInstanceHost(url, database);
    eyebrowEl.textContent = `AUDIT · ${host}`;
    const totalLabel = state.total === 1 ? "event" : "events";
    const shownLabel = state.loading && state.entries.length === 0
      ? "Loading..."
      : `${state.total} ${totalLabel} total  ·  showing ${state.entries.length}`;
    metaEl.textContent = shownLabel;
  }

  function syncControls() {
    const projectId = getResolvedProjectId();
    if (actorInput.value !== state.filters.actor) actorInput.value = state.filters.actor;
    if (actionSelect.value !== state.filters.action) actionSelect.value = state.filters.action;
    if (domainInput.value !== state.filters.domain) domainInput.value = state.filters.domain;
    if (fromInput.value !== state.filters.from) fromInput.value = state.filters.from;
    if (toInput.value !== state.filters.to) toInput.value = state.filters.to;
    clearFiltersLink.style.display = hasActiveFilters(state.filters) ? "inline-flex" : "none";
    exportButton.disabled = !projectId || state.exporting;
    exportButton.style.opacity = exportButton.disabled ? "0.65" : "1";
    exportButton.style.cursor = exportButton.disabled ? "not-allowed" : "pointer";
    exportButtonLabel.textContent = state.exporting ? "Exporting..." : "Export CSV";
  }

  function clearFilters() {
    state.filters = { actor: "", action: "", domain: "", from: "", to: "" };
    state.bannerError = "";
    state.expandedDetails = new Set();
    if (actorTimer) { clearTimeout(actorTimer); actorTimer = null; }
    if (domainTimer) { clearTimeout(domainTimer); domainTimer = null; }
    render();
    void fetchEntries({ append: false });
  }

  function toggleDetails(entryId) {
    if (state.expandedDetails.has(entryId)) state.expandedDetails.delete(entryId);
    else state.expandedDetails.add(entryId);
    render();
  }

  async function fetchEntries({ append }) {
    const projectId = getResolvedProjectId();
    if (!projectId) {
      state.loading = false;
      state.loadingMore = false;
      state.fetchError = "Audit log is unavailable until this project has an ID.";
      render();
      return;
    }
    const requestId = ++latestRequestId;
    const nextOffset = append ? state.entries.length : 0;
    if (append) {
      state.loadingMore = true;
    } else {
      state.loading = true;
      state.bannerError = "";
      state.fetchError = "";
      state.expandedDetails = new Set();
    }
    render();
    try {
      const payload = await requestAuditJson(
        buildAuditUrl(projectId, state.filters, { limit: PAGE_SIZE, offset: nextOffset }),
        getSessionToken()
      );
      if (requestId !== latestRequestId) return;
      const normalized = Array.isArray(payload.entries)
        ? payload.entries.map((entry, index) => normalizeAuditEntry(entry, nextOffset + index))
        : [];
      state.entries = append ? mergeEntries(state.entries, normalized) : sortEntries(normalized);
      const payloadTotal = Number(payload.total);
      state.total = Number.isFinite(payloadTotal) ? payloadTotal : state.entries.length;
      state.fetchError = "";
      state.bannerError = "";
    } catch (error) {
      if (requestId !== latestRequestId) return;
      const message = error instanceof Error ? error.message : "Failed to load audit log.";
      state.fetchError = message;
      state.bannerError = message;
      if (!append) state.total = state.entries.length;
    } finally {
      if (requestId === latestRequestId) {
        state.loading = false;
        state.loadingMore = false;
        render();
      }
    }
  }

  async function handleExport() {
    const projectId = getResolvedProjectId();
    if (!projectId || state.exporting) return;
    state.exporting = true;
    state.bannerError = "";
    render();
    try {
      const response = await fetch(buildAuditUrl(projectId, state.filters, { exportMode: true }), {
        method: "GET",
        headers: buildHeaders(getSessionToken(), false),
      });
      if (!response.ok) {
        const payload = await readJsonResponse(response);
        throw new Error(payload.error || "Failed to export audit log.");
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const filename = parseExportFilename(response.headers.get("Content-Disposition")) || "audit-log.csv";
      const link = el("a", { href: downloadUrl, download: filename, style: "display: none;" });
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      state.bannerError = error instanceof Error ? error.message : "Failed to export audit log.";
      render();
    } finally {
      state.exporting = false;
      render();
    }
  }

  function renderContent() {
    clearNode(bannerEl);
    clearNode(contentEl);
    clearNode(footerEl);
    syncControls();
    syncHeaderMeta();

    if (state.loading && state.entries.length > 0) {
      bannerEl.append(createLoadingIndicator("Refreshing audit entries..."));
    } else if (state.bannerError && state.entries.length > 0) {
      bannerEl.append(createMessageBanner(state.bannerError));
    }

    if (state.loading && state.entries.length === 0) {
      contentEl.append(createLoadingIndicator());
      return;
    }

    if (state.fetchError && state.entries.length === 0) {
      contentEl.append(createErrorState(state.fetchError, () => {
        void fetchEntries({ append: false });
      }));
      return;
    }

    if (state.entries.length === 0) {
      contentEl.append(createEmptyState({
        filtered: hasActiveFilters(state.filters),
        onClearFilters: clearFilters,
      }));
      return;
    }

    contentEl.append(el("div", {
      style: "display: flex; flex-direction: column;",
    }, state.entries.map((entry, index) => renderEntry(
      entry, index, state.entries.length, state.expandedDetails, toggleDetails,
    ))));

    footerEl.append(el("div", {
      style:
        `${PANEL_STYLE} padding: var(--space-3) var(--space-5); ` +
        `display: flex; align-items: center; justify-content: space-between; ` +
        `gap: var(--space-3); flex-wrap: wrap;`,
    }, [
      el("span", {
        style:
          "font-family: var(--font-mono); font-size: var(--fs-small); " +
          "color: var(--color-muted);",
        text: `Showing ${state.entries.length} of ${state.total}`,
      }),
      state.entries.length < state.total
        ? el("button", {
            type: "button",
            style: `${PILL_SECONDARY}${state.loadingMore ? " opacity: 0.75; cursor: wait;" : ""}`,
            disabled: state.loadingMore,
            onclick: () => { void fetchEntries({ append: true }); },
            text: state.loadingMore ? "Loading..." : "Load more",
          })
        : null,
    ]));
  }

  function render() {
    renderContent();
  }

  render();
  queueMicrotask(() => { void fetchEntries({ append: false }); });

  return isMountContainer ? container : viewRoot;
}
