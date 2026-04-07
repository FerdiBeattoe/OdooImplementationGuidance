import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { getState } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";

const NAVY = "#0c1a30";
const AMBER = "#f59e0b";
const GREEN = "#16a34a";
const RED = "#dc2626";
const PURPLE = "#7c3aed";
const BLUE = "#0369a1";
const MUTED = "#6b7280";
const BORDER = "#e2e8f0";
const LIGHT_BORDER = "#d1d5db";
const SECONDARY_BUTTON = "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); color: #0c1a30; border-radius: 6px; font-family: Inter, sans-serif; font-weight: 600; cursor: pointer;";
const CARD_STYLE = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;";
const FIELD_STYLE = "width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; font-size: 14px; color: #111827; font-family: Inter, sans-serif; background: #ffffff; box-sizing: border-box;";
const PAGE_SIZE = 50;

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

const ACTION_COLORS = {
  checkpoint_confirmed: AMBER,
  checkpoint_executed: AMBER,
  commit_approved: GREEN,
  commit_cancelled: RED,
  pipeline_run: PURPLE,
  member_invited: NAVY,
  member_removed: NAVY,
  member_role_changed: NAVY,
  report_generated: BLUE,
};

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

function buildHeaders(token, includeJson = true) {
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function readJsonResponse(response) {
  const raw = await response.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function requestAuditJson(url, token) {
  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token, false),
  });

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error || "Failed to load audit log.");
  }

  if (payload?.error) {
    throw new Error(payload.error);
  }

  return payload;
}

function parseExportFilename(contentDisposition) {
  if (!contentDisposition) {
    return "";
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return simpleMatch?.[1] || "";
}

function humanizeToken(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getActionLabel(action) {
  return ACTION_LABELS[action] || humanizeToken(action || "unknown action").toLowerCase();
}

function getActionColor(action) {
  return ACTION_COLORS[action] || NAVY;
}

function getRoleBadgeConfig(role) {
  switch (role) {
    case "project_lead":
      return { label: "Project Lead", background: NAVY, color: "#ffffff" };
    case "implementor":
      return { label: "Implementor", background: "rgba(245,158,11,0.15)", color: "#92400e" };
    case "reviewer":
      return { label: "Reviewer", background: "#e0f2fe", color: BLUE };
    case "stakeholder":
      return { label: "Stakeholder", background: "#f3f4f6", color: MUTED };
    default:
      return null;
  }
}

function createRoleBadge(role) {
  const config = getRoleBadgeConfig(role);
  if (!config) {
    return null;
  }

  return el("span", {
    style: `display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: ${config.background}; color: ${config.color}; font-family: Inter, sans-serif;`,
    text: config.label,
  });
}

function formatAuditTimestamp(value) {
  if (!value) {
    return "Timestamp unavailable";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Timestamp unavailable";
  }

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
  if (!value) {
    return "";
  }

  const parsed = new Date(`${value}${endOfDay ? "T23:59:59.999" : "T00:00:00.000"}`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

function hasActiveFilters(filters) {
  return Boolean(
    filters.actor ||
    filters.action ||
    filters.domain ||
    filters.from ||
    filters.to
  );
}

function normalizeDetails(details) {
  if (Array.isArray(details)) {
    return details;
  }

  if (details && typeof details === "object") {
    return details;
  }

  if (typeof details === "string" && details.trim()) {
    try {
      return JSON.parse(details);
    } catch {
      return { value: details };
    }
  }

  if (details === null || details === undefined || details === "") {
    return {};
  }

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
    entry?.actor_name ||
    entry?.actorName ||
    actorObject?.full_name ||
    actorObject?.name ||
    entry?.user_name ||
    entry?.userName ||
    "Unknown actor"
  ).trim() || "Unknown actor";

  const actorRole = String(
    entry?.actor_role ||
    entry?.actorRole ||
    actorObject?.role ||
    entry?.role ||
    ""
  ).trim();

  const action = String(entry?.action || entry?.event || entry?.type || "").trim() || "unknown_action";
  const domain = String(entry?.domain || entry?.domain_id || entry?.domainId || "").trim();
  const checkpointId = String(entry?.checkpoint_id || entry?.checkpointId || "").trim();
  const timestamp = entry?.timestamp || entry?.created_at || entry?.occurred_at || entry?.executed_at || entry?.confirmed_at || "";
  const id = String(
    entry?.id ||
    entry?.audit_id ||
    entry?.auditId ||
    `${timestamp}-${action}-${actorName}-${checkpointId || index}`
  );

  return {
    id,
    actorName,
    actorRole,
    action,
    domain,
    checkpointId,
    timestamp,
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

  existingEntries.forEach((entry) => {
    merged.set(entry.id, entry);
  });

  newEntries.forEach((entry) => {
    merged.set(entry.id, entry);
  });

  return sortEntries([...merged.values()]);
}

function buildAuditUrl(projectId, filters, options = {}) {
  const params = new URLSearchParams();

  if (filters.actor) {
    params.set("actor", filters.actor.trim());
  }

  if (filters.action) {
    params.set("action", filters.action);
  }

  if (filters.domain) {
    params.set("domain", filters.domain.trim());
  }

  const fromIso = toIsoDate(filters.from, false);
  const toIso = toIsoDate(filters.to, true);

  if (fromIso) {
    params.set("from", fromIso);
  }

  if (toIso) {
    params.set("to", toIso);
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  if (options.offset) {
    params.set("offset", String(options.offset));
  }

  const basePath = options.exportMode
    ? `/api/audit/${encodeURIComponent(projectId)}/export`
    : `/api/audit/${encodeURIComponent(projectId)}`;

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function createFieldShell(label, control, style = "") {
  return el("label", {
    style: `display: flex; flex-direction: column; gap: 6px; font-family: Inter, sans-serif;${style ? ` ${style}` : ""}`,
  }, [
    el("span", {
      style: "font-size: 13px; font-weight: 600; color: #374151;",
      text: label,
    }),
    control,
  ]);
}

function createLoadingIndicator(text = "Loading audit entries...") {
  const icon = lucideIcon("RefreshCw", 16);
  icon.style.color = MUTED;

  return el("div", {
    style: "display: inline-flex; align-items: center; gap: 8px; color: #6b7280; font-size: 14px; font-family: Inter, sans-serif; padding: 4px 0;",
  }, [
    icon,
    el("span", { text }),
  ]);
}

function createMessageBanner(message) {
  return el("div", {
    style: "background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); border-radius: 10px; padding: 14px 16px; color: #b91c1c; font-size: 14px; font-family: Inter, sans-serif;",
    text: message,
  });
}

function createEmptyState({ filtered, onClearFilters }) {
  const icon = lucideIcon(filtered ? "Search" : "ClipboardList", 48);
  icon.style.color = "#d1d5db";

  return el("div", {
    style: "text-align: center; padding-top: 60px; display: flex; flex-direction: column; align-items: center; font-family: Inter, sans-serif;",
  }, [
    icon,
    el("h3", {
      style: "font-size: 18px; font-weight: 600; color: #0c1a30; margin: 16px 0 8px;",
      text: filtered ? "No entries match your filters." : "No audit entries yet.",
    }),
    el("p", {
      style: "font-size: 14px; color: #6b7280; margin: 0; max-width: 420px;",
      text: filtered ? "Try adjusting or clearing the current filters." : "Actions taken in this project will appear here.",
    }),
    filtered
      ? el("button", {
          type: "button",
          style: `${SECONDARY_BUTTON} margin-top: 20px; padding: 10px 16px;`,
          onclick: onClearFilters,
          text: "Clear filters",
        })
      : null,
  ]);
}

function createErrorState(message, onRetry) {
  const icon = lucideIcon("AlertCircle", 48);
  icon.style.color = RED;

  return el("div", {
    style: "text-align: center; padding-top: 60px; display: flex; flex-direction: column; align-items: center; font-family: Inter, sans-serif;",
  }, [
    icon,
    el("h3", {
      style: "font-size: 18px; font-weight: 600; color: #0c1a30; margin: 16px 0 8px;",
      text: "Audit log unavailable.",
    }),
    el("p", {
      style: "font-size: 14px; color: #6b7280; margin: 0; max-width: 460px;",
      text: message,
    }),
    el("button", {
      type: "button",
      style: `${SECONDARY_BUTTON} margin-top: 20px; padding: 10px 16px;`,
      onclick: onRetry,
      text: "Retry",
    }),
  ]);
}

function renderTimelineColumn(index, totalEntries, action) {
  const dot = el("span", {
    style: `position: absolute; top: 22px; left: 50%; width: 10px; height: 10px; border-radius: 999px; background: ${getActionColor(action)}; transform: translate(-50%, -50%); box-shadow: 0 0 0 4px #ffffff;`,
  });

  const line = totalEntries > 1
    ? el("span", {
        style: `position: absolute; left: 50%; transform: translateX(-50%); top: ${index === 0 ? "22px" : "0"}; bottom: ${index === totalEntries - 1 ? "calc(100% - 22px)" : "0"}; width: 1px; background: ${BORDER};`,
      })
    : null;

  return el("div", {
    style: "width: 24px; flex-shrink: 0; position: relative; align-self: stretch;",
  }, [
    line,
    dot,
  ]);
}

function renderMetadataLine(entry) {
  if (!entry.domain && !entry.checkpointId) {
    return null;
  }

  const parts = [];

  if (entry.domain) {
    parts.push(humanizeToken(entry.domain));
  }

  if (entry.checkpointId) {
    parts.push(entry.checkpointId);
  }

  return el("div", {
    style: "font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;",
  }, parts.flatMap((part, index) => {
    const children = [el("span", { text: part })];

    if (index < parts.length - 1) {
      children.push(el("span", { text: "•" }));
    }

    return children;
  }));
}

function renderEntry(entry, index, totalEntries, expandedDetails, onToggleDetails) {
  const detailsVisible = expandedDetails.has(entry.id);
  const roleBadge = createRoleBadge(entry.actorRole);

  return el("div", {
    style: "display: flex; align-items: stretch; gap: 16px; padding-bottom: 16px;",
  }, [
    renderTimelineColumn(index, totalEntries, entry.action),
    el("article", {
      style: `${CARD_STYLE} flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;`,
    }, [
      el("div", {
        style: "display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;",
      }, [
        el("div", {
          style: "display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0;",
        }, [
          el("span", {
            style: "font-size: 14px; font-weight: 700; color: #0c1a30;",
            text: entry.actorName,
          }),
          roleBadge,
          el("span", {
            style: "font-size: 14px; color: #374151;",
            text: getActionLabel(entry.action),
          }),
        ]),
        el("span", {
          style: "font-size: 13px; color: #6b7280; white-space: nowrap;",
          text: formatAuditTimestamp(entry.timestamp),
        }),
      ]),
      renderMetadataLine(entry),
      el("div", {
        style: "display: flex; flex-direction: column; gap: 10px;",
      }, [
        el("button", {
          type: "button",
          style: "align-self: flex-start; background: none; border: none; color: #0369a1; font-size: 12px; cursor: pointer; padding: 0; font-family: Inter, sans-serif;",
          onclick: () => onToggleDetails(entry.id),
          text: detailsVisible ? "Hide details" : "Show details",
        }),
        detailsVisible
          ? el("pre", {
              style: "margin: 0; background: #f9fafb; border-radius: 6px; padding: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: #374151; overflow-x: auto; white-space: pre-wrap;",
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
    filters: {
      actor: "",
      action: "",
      domain: "",
      from: "",
      to: "",
    },
    expandedDetails: new Set(),
  };

  let latestRequestId = 0;
  let actorTimer = null;
  let domainTimer = null;

  const viewRoot = el("section", {
    style: "max-width: 1120px; margin: 0 auto; padding: 32px; font-family: Inter, sans-serif; display: flex; flex-direction: column; gap: 20px;",
    dataset: { testid: "audit-log-view" },
  });

  const exportButtonLabel = el("span", { text: "Export CSV" });
  const exportButton = el("button", {
    type: "button",
    style: `${SECONDARY_BUTTON} display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;`,
    onclick: () => {
      void handleExport();
    },
  }, [
    lucideIcon("Download", 16),
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
      if (actorTimer) {
        clearTimeout(actorTimer);
      }
      actorTimer = setTimeout(() => {
        void fetchEntries({ append: false });
      }, 300);
    },
  });

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

  const domainInput = el("input", {
    type: "text",
    placeholder: "Filter by domain",
    value: state.filters.domain,
    style: FIELD_STYLE,
    oninput: (event) => {
      state.filters.domain = event.target.value;
      render();
      if (domainTimer) {
        clearTimeout(domainTimer);
      }
      domainTimer = setTimeout(() => {
        void fetchEntries({ append: false });
      }, 300);
    },
  });

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

  const clearFiltersLink = el("button", {
    type: "button",
    style: "display: none; align-self: flex-end; background: none; border: none; color: #6b7280; font-size: 13px; cursor: pointer; padding: 0; font-family: Inter, sans-serif;",
    onclick: () => {
      clearFilters();
    },
    text: "Clear filters",
  });

  const bannerEl = el("div");
  const contentEl = el("div");
  const footerEl = el("div");

  viewRoot.append(
    el("div", {
      style: "display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;",
    }, [
      el("h1", {
        style: "font-size: 28px; font-weight: 700; color: #0c1a30; margin: 0;",
        text: "Audit Log",
      }),
      exportButton,
    ]),
    el("section", {
      style: `${CARD_STYLE} padding: 16px; display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: flex-end;`,
    }, [
      createFieldShell("Actor", actorInput, "flex: 1 1 180px; min-width: 180px;"),
      createFieldShell("Action", actionSelect, "flex: 1 1 220px; min-width: 220px;"),
      createFieldShell("Domain", domainInput, "flex: 1 1 180px; min-width: 180px;"),
      createFieldShell("Date range", el("div", {
        style: "display: flex; align-items: center; gap: 8px; min-width: 0;",
      }, [
        fromInput,
        toInput,
      ]), "flex: 1 1 260px; min-width: 260px;"),
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

  function syncControls() {
    const projectId = getResolvedProjectId();

    if (actorInput.value !== state.filters.actor) {
      actorInput.value = state.filters.actor;
    }

    if (actionSelect.value !== state.filters.action) {
      actionSelect.value = state.filters.action;
    }

    if (domainInput.value !== state.filters.domain) {
      domainInput.value = state.filters.domain;
    }

    if (fromInput.value !== state.filters.from) {
      fromInput.value = state.filters.from;
    }

    if (toInput.value !== state.filters.to) {
      toInput.value = state.filters.to;
    }

    clearFiltersLink.style.display = hasActiveFilters(state.filters) ? "inline-flex" : "none";
    exportButton.disabled = !projectId || state.exporting;
    exportButton.style.opacity = exportButton.disabled ? "0.65" : "1";
    exportButton.style.cursor = exportButton.disabled ? "not-allowed" : "pointer";
    exportButtonLabel.textContent = state.exporting ? "Exporting..." : "Export CSV";
  }

  function clearFilters() {
    state.filters = {
      actor: "",
      action: "",
      domain: "",
      from: "",
      to: "",
    };
    state.bannerError = "";
    state.expandedDetails = new Set();

    if (actorTimer) {
      clearTimeout(actorTimer);
      actorTimer = null;
    }

    if (domainTimer) {
      clearTimeout(domainTimer);
      domainTimer = null;
    }

    render();
    void fetchEntries({ append: false });
  }

  function toggleDetails(entryId) {
    if (state.expandedDetails.has(entryId)) {
      state.expandedDetails.delete(entryId);
    } else {
      state.expandedDetails.add(entryId);
    }

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

      if (requestId !== latestRequestId) {
        return;
      }

      const normalizedEntries = Array.isArray(payload.entries)
        ? payload.entries.map((entry, index) => normalizeAuditEntry(entry, nextOffset + index))
        : [];

      state.entries = append
        ? mergeEntries(state.entries, normalizedEntries)
        : sortEntries(normalizedEntries);

      const payloadTotal = Number(payload.total);
      state.total = Number.isFinite(payloadTotal) ? payloadTotal : state.entries.length;
      state.fetchError = "";
      state.bannerError = "";
    } catch (error) {
      if (requestId !== latestRequestId) {
        return;
      }

      const message = error instanceof Error ? error.message : "Failed to load audit log.";
      state.fetchError = message;
      state.bannerError = message;

      if (!append) {
        state.total = state.entries.length;
      }
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

    if (!projectId || state.exporting) {
      return;
    }

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
      const link = el("a", {
        href: downloadUrl,
        download: filename,
        style: "display: none;",
      });

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
      entry,
      index,
      state.entries.length,
      state.expandedDetails,
      toggleDetails,
    ))));

    footerEl.append(el("div", {
      style: "display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding-top: 4px;",
    }, [
      el("span", {
        style: "font-size: 14px; color: #6b7280;",
        text: `Showing ${state.entries.length} of ${state.total} entries`,
      }),
      state.entries.length < state.total
        ? el("button", {
            type: "button",
            style: `${SECONDARY_BUTTON} padding: 10px 16px;${state.loadingMore ? " opacity: 0.75; cursor: wait;" : ""}`,
            disabled: state.loadingMore,
            onclick: () => {
              void fetchEntries({ append: true });
            },
            text: state.loadingMore ? "Loading..." : "Load more",
          })
        : null,
    ]));
  }

  function render() {
    renderContent();
  }

  render();
  queueMicrotask(() => {
    void fetchEntries({ append: false });
  });

  return isMountContainer ? container : viewRoot;
}
