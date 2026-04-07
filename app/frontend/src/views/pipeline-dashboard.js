// ---------------------------------------------------------------------------
// Pipeline Dashboard — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Main screen users land on after onboarding completes. Shows implementation
//   progress and completion status across all activated domains, with per-domain
//   card expansion, checkpoint-level actions, and a what's-left summary.
//
// Hard rules:
//   D1  Reads runtime state from pipeline-store only — never direct adapter.
//   D2  All API calls handle errors explicitly — no silent swallows.
//   D3  Carry-over block is built from persisted checkpoint_statuses — never
//       hardcoded checkpoint IDs.
//   D4  No business logic inference — derives domain/checkpoint status from
//       runtime_state fields only.
//   D5  No mutations to runtime_state after receipt.
//   D6  Domain names derive from domain key — no hardcoded display strings.
//   D7  Completion percentage calculated from live pipeline run result only.
//   D8  Navigation back to onboarding flows through the provided onNavigate
//       callback only — no direct route or app-store mutations in this view.
// ---------------------------------------------------------------------------

import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { pipelineStore } from "../state/pipeline-store.js";
import { onboardingStore } from "../state/onboarding-store.js";

export const ONBOARDING_RESUME_ROUTE = "onboarding/questions";
const REVIEW_COMMIT_BUTTON_STYLE = "display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; font-family: Inter, sans-serif;";

function navigateToQuestions(onNavigate) {
  if (onNavigate) onNavigate(ONBOARDING_RESUME_ROUTE);
}

function buildTeamHeaders(token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function renderPipelineIcon(name, size) {
  const normalized = String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])([0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .toLowerCase();

  return lucideIcon(normalized, size);
}

function isProjectLeadMember(members, onboardingState) {
  const currentUserId = onboardingState?.user?.id || null;
  const currentUserEmail = String(onboardingState?.user?.email || "").trim().toLowerCase();
  const activeMembers = Array.isArray(members)
    ? members.filter((member) => member?.accepted_at)
    : [];
  const currentMembership = activeMembers.find((member) => {
    if (currentUserId && member.account_id === currentUserId) {
      return true;
    }

    return (
      !currentUserId &&
      currentUserEmail &&
      String(member.email || "").trim().toLowerCase() === currentUserEmail
    );
  }) || null;

  return currentMembership?.role === "project_lead";
}

async function appendReviewCommitButton({ actionsEl, projectId, obState, onNavigate }) {
  if (!actionsEl || !projectId || typeof fetch !== "function") {
    return;
  }

  try {
    const onboardingState = onboardingStore.getState();
    const hasUserIdentity = Boolean(
      onboardingState?.user?.id ||
      String(onboardingState?.user?.email || "").trim()
    );
    if (!hasUserIdentity) {
      return;
    }

    const response = await fetch(`/api/team/${encodeURIComponent(projectId)}`, {
      method: "GET",
      headers: buildTeamHeaders(onboardingState?.sessionToken || obState?.sessionToken || null),
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (!response.ok || !isProjectLeadMember(payload?.members, onboardingState)) {
      return;
    }

    actionsEl.appendChild(
      el("button", {
        style: REVIEW_COMMIT_BUTTON_STYLE,
        dataset: { testid: "header-review-commit-button" },
        onClick: () => {
          if (onNavigate) onNavigate("pre-commit-report");
        },
      }, [
        renderPipelineIcon("FileCheck", 16),
        el("span", { text: "Review & Commit" }),
      ])
    );
  } catch {
    // Team membership lookup is best-effort. Hide the action when it cannot be verified.
  }
}

// ---------------------------------------------------------------------------
// humanizeDomainId — derives a human-readable label from a domain key.
// "master_data" → "Master Data", "users_roles" → "Users Roles"
// No hardcoded map — pure derivation from the ID.
// ---------------------------------------------------------------------------

export function humanizeDomainId(domainId) {
  if (typeof domainId !== "string" || !domainId) return domainId || "";
  return domainId
    .split(/[_\-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ---------------------------------------------------------------------------
// buildCarryOverBlock
//
// Builds checkpoint_statuses from persisted runtime_state.
// Never hardcodes checkpoint IDs — reads from runtime_state.checkpoints.records
// and runtime_state.checkpoint_statuses.
//
// @param {object} runtimeState
// @returns {object} — { [checkpoint_id]: status }
// ---------------------------------------------------------------------------

export function buildCarryOverBlock(runtimeState) {
  if (!runtimeState) return {};

  // Primary source: checkpoint_statuses flat map (server-maintained)
  const flat = runtimeState.checkpoint_statuses;
  if (flat && typeof flat === "object" && !Array.isArray(flat)) {
    // Return a copy with only Complete entries (the only meaningful carry-over)
    const result = {};
    for (const [id, status] of Object.entries(flat)) {
      if (status === "Complete") result[id] = "Complete";
    }
    if (Object.keys(result).length > 0) return result;
  }

  // Fallback: derive from checkpoints.records statuses
  const records = runtimeState.checkpoints?.records;
  if (!Array.isArray(records)) return {};

  const result = {};
  for (const cp of records) {
    if (cp && cp.checkpoint_id && cp.status === "Complete") {
      result[cp.checkpoint_id] = "Complete";
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// getCheckpointRecords — extracts the flat checkpoint records array from
// runtime_state, regardless of whether checkpoints is an array or container.
// ---------------------------------------------------------------------------

export function getCheckpointRecords(runtimeState) {
  if (!runtimeState) return [];
  const checkpoints = runtimeState.checkpoints;
  if (!checkpoints) return [];
  // Container shape: { records: [...], engine_version, generated_at }
  if (checkpoints.records && Array.isArray(checkpoints.records)) {
    return checkpoints.records;
  }
  // Direct array shape (historical)
  if (Array.isArray(checkpoints)) return checkpoints;
  return [];
}

// ---------------------------------------------------------------------------
// getActivatedDomainIds — extracts list of activated domain IDs.
// ---------------------------------------------------------------------------

export function getActivatedDomainIds(runtimeState) {
  if (!runtimeState) return [];
  const domains = runtimeState.activated_domains?.domains;
  if (!Array.isArray(domains)) return [];
  return domains
    .map((d) => (typeof d === "string" ? d : d?.domain_id ?? d?.id ?? null))
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// deriveCompletionPercentage
//
// Complete checkpoints / Total activated checkpoints × 100, rounded.
//
// @param {Array} checkpointRecords
// @returns {number} 0..100
// ---------------------------------------------------------------------------

export function deriveCompletionPercentage(checkpointRecords) {
  if (!Array.isArray(checkpointRecords) || checkpointRecords.length === 0) return 0;
  const total    = checkpointRecords.length;
  const complete = checkpointRecords.filter((cp) => cp?.status === "Complete").length;
  return Math.round((complete / total) * 100);
}

// ---------------------------------------------------------------------------
// deriveDomainStatus
//
// Derives the display status for a domain based on its checkpoints and blockers.
//
// @param {Array}  domainCps     — checkpoint records for this domain
// @param {Array}  activeBlockers — runtime_state.blockers.active_blockers
// @returns {"Not Started"|"In Progress"|"Complete"|"Blocked"}
// ---------------------------------------------------------------------------

export function deriveDomainStatus(domainCps, activeBlockers) {
  if (!Array.isArray(domainCps) || domainCps.length === 0) return "Not Started";

  // Blocked if any active blocker references a checkpoint in this domain
  if (Array.isArray(activeBlockers) && activeBlockers.length > 0) {
    const domainIds = new Set(domainCps.map((cp) => cp.checkpoint_id));
    const hasBlocker = activeBlockers.some(
      (b) => b && (domainIds.has(b.source_checkpoint_id) || domainIds.has(b.checkpoint_id))
    );
    if (hasBlocker) return "Blocked";
  }

  const total    = domainCps.length;
  const complete = domainCps.filter((cp) => cp?.status === "Complete").length;

  if (complete === 0)     return "Not Started";
  if (complete === total) return "Complete";
  return "In Progress";
}

// ---------------------------------------------------------------------------
// deriveNextAction
//
// Derives the "next action" label for a domain or checkpoint row.
//
// @param {Array}  domainCps     — checkpoint records for domain (sorted)
// @param {Array}  activeBlockers
// @param {string} domainStatus
// @returns {string}
// ---------------------------------------------------------------------------

export function deriveNextAction(domainCps, activeBlockers, domainStatus) {
  if (domainStatus === "Complete") return "Done";

  if (domainStatus === "Blocked") {
    // Find what is blocking
    if (Array.isArray(activeBlockers) && activeBlockers.length > 0) {
      const domainIds = new Set(domainCps.map((cp) => cp.checkpoint_id));
      const blocker = activeBlockers.find(
        (b) => b && (domainIds.has(b.source_checkpoint_id) || domainIds.has(b.checkpoint_id))
      );
      if (blocker) {
        const dep = blocker.blocking_checkpoint_id || blocker.blocked_by || "";
        return dep ? `Blocked — waiting on ${dep}` : "Blocked — dependency unresolved";
      }
    }
    return "Blocked";
  }

  // Find first incomplete checkpoint
  const next = domainCps.find((cp) => cp?.status !== "Complete");
  if (!next) return "Done";

  if (next.execution_relevance === "Executable")    return "Ready to execute";
  if (next.validation_source === "User_Confirmed")  return "Confirmation required";
  if (next.execution_relevance === "Informational") return "Confirmation required";
  return "Pending";
}

// ---------------------------------------------------------------------------
// derivePriorityScore — for "next highest priority" across all domains.
// Lower = higher priority.
// Executable Safe = 0, Executable Conditional = 1, User_Confirmed = 2
// ---------------------------------------------------------------------------

export function derivePriorityScore(cp) {
  if (!cp || cp.status === "Complete") return Infinity;
  if (cp.execution_relevance === "Executable" && cp.safety_class === "Safe")        return 0;
  if (cp.execution_relevance === "Executable" && cp.safety_class === "Conditional") return 1;
  if (cp.validation_source === "User_Confirmed")                                     return 2;
  if (cp.execution_relevance === "Informational")                                    return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// findHighestPriorityCheckpoint — returns the single highest priority
// unblocked, incomplete checkpoint across all domain checkpoints.
// ---------------------------------------------------------------------------

export function findHighestPriorityCheckpoint(checkpointRecords, activeBlockers) {
  if (!Array.isArray(checkpointRecords)) return null;

  const blockedIds = new Set();
  if (Array.isArray(activeBlockers)) {
    for (const b of activeBlockers) {
      if (b?.source_checkpoint_id) blockedIds.add(b.source_checkpoint_id);
      if (b?.checkpoint_id)        blockedIds.add(b.checkpoint_id);
    }
  }

  let best = null;
  let bestScore = Infinity;

  for (const cp of checkpointRecords) {
    if (!cp || cp.status === "Complete") continue;
    if (blockedIds.has(cp.checkpoint_id))  continue;
    const score = derivePriorityScore(cp);
    if (score < bestScore) {
      bestScore = score;
      best = cp;
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// renderPipelineDashboard
//
// Main entry point for the pipeline dashboard view.
// Accepts callbacks for navigation and API actions.
//
// @param {object} props
// @param {Function} props.onNavigate    — (view) → void, for routing
// @param {Function} [props.onRun]       — called to run pipeline (refreshes)
// @param {Function} [props.onLoad]      — called to load persisted state
// @param {Function} [props.onApply]     — called for governed apply
// @param {Function} [props.onSave]      — called to save state
// ---------------------------------------------------------------------------

export function renderPipelineDashboard({ onNavigate, onRun, onLoad, onApply, onSave }) {
  const psState   = pipelineStore.getState();
  const obState   = onboardingStore.getState();

  return renderDashboardContent({
    psState,
    obState,
    onNavigate,
    onRun,
    onLoad,
    onApply,
    onSave,
  });
}

// ---------------------------------------------------------------------------
// renderDashboardContent
//
// Separated from renderPipelineDashboard so it is directly callable in tests
// with explicit state objects.
//
// @param {object} params
// @param {object} params.psState     — pipeline store state
// @param {object} params.obState     — onboarding store state
// @param {Function} params.onNavigate
// @param {Function} [params.onRun]
// @param {Function} [params.onLoad]
// @param {Function} [params.onApply]
// @param {Function} [params.onSave]
// ---------------------------------------------------------------------------

export function renderDashboardContent({ psState, obState, onNavigate, onRun, onLoad, onApply, onSave }) {
  const root = el("div", { className: "pd-root", dataset: { testid: "pipeline-dashboard" } });

  // ── Loading state ─────────────────────────────────────────────────────────
  if (psState.status === "running" || psState.status === "loading" ||
      psState.status === "resuming") {
    root.appendChild(
      el("div", { className: "pd-loading", dataset: { testid: "dashboard-loading" } }, [
        el("span", { text: "Loading implementation status..." })
      ])
    );
    root.appendChild(renderRefreshButton(psState, obState, onRun, onLoad));
    return root;
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (psState.status === "failure" && psState.error) {
    root.appendChild(
      el("div", { className: "pd-error-banner", dataset: { testid: "dashboard-error" } }, [
        el("span", { text: `Error loading pipeline: ${psState.error}` })
      ])
    );
    root.appendChild(renderRefreshButton(psState, obState, onRun, onLoad));
    return root;
  }

  const runtimeState     = psState.runtime_state;
  const checkpointRecords = getCheckpointRecords(runtimeState);
  const activatedDomains  = getActivatedDomainIds(runtimeState);
  const activeBlockers    = runtimeState?.blockers?.active_blockers ?? [];
  const completionPct     = deriveCompletionPercentage(checkpointRecords);
  const savedAt           = psState.saved_at ?? runtimeState?.orchestrated_at ?? null;

  // ── Section 5: Deferred questions banner (shown before domain grid) ───────
  const deferredCount = getDeferredCount(obState);
  if (deferredCount > 0) {
    root.appendChild(renderDeferredBanner(deferredCount, onNavigate));
  }

  // ── Section 1: Implementation header ─────────────────────────────────────
  root.appendChild(
    renderHeader({
      runtimeState,
      obState,
      completionPct,
      savedAt,
      checkpointRecords,
      onNavigate,
    })
  );

  // ── Section 2 + 3: Domain progress cards (with expandable checkpoints) ───
  root.appendChild(
    renderDomainsSection({
      activatedDomains,
      checkpointRecords,
      activeBlockers,
      runtimeState,
      onApply,
      onRun,
      onLoad,
      psState,
      obState,
      onNavigate,
    })
  );

  // ── Section 4: What's left summary ───────────────────────────────────────
  root.appendChild(
    renderSummarySection({
      checkpointRecords,
      activatedDomains,
      activeBlockers,
      psState,
      obState,
      onRun,
      onLoad,
    })
  );

  return root;
}

// ---------------------------------------------------------------------------
// getDeferredCount — reads from onboarding-store answers
// ---------------------------------------------------------------------------

export function getDeferredCount(obState) {
  if (!obState || !obState.answers) return 0;
  return Object.values(obState.answers).filter((a) => a && a.deferred === true).length;
}

// ---------------------------------------------------------------------------
// renderDeferredBanner — Section 5
// ---------------------------------------------------------------------------

function renderDeferredBanner(count, onNavigate) {
  return el(
    "div",
    { className: "pd-deferred-banner", dataset: { testid: "deferred-banner" } },
    [
      el("span", {
        className: "pd-deferred-banner-text",
        text: `You have ${count} unanswered question${count === 1 ? "" : "s"} that may affect your implementation scope`,
      }),
      el("button", {
        className: "pd-deferred-banner-link",
        dataset: { testid: "deferred-banner-link" },
        text: "Review deferred questions →",
        onClick: () => {
          navigateToQuestions(onNavigate);
        },
      }),
    ]
  );
}

// ---------------------------------------------------------------------------
// renderHeader — Section 1
// ---------------------------------------------------------------------------

function renderHeader({ runtimeState, obState, completionPct, savedAt, checkpointRecords, onNavigate }) {
  const projectId   = runtimeState?.project_identity?.project_id ?? "—";
  const instanceUrl = runtimeState?.target_context?.connection_url ??
                      obState?.connection?.url ?? null;
  const industryName = obState?.industry_name ?? null;
  const totalCps    = checkpointRecords.length;
  const completeCps = checkpointRecords.filter((cp) => cp?.status === "Complete").length;

  const displayTitle = instanceUrl
    ? `${projectId} (${instanceUrl})`
    : projectId;

  const headerActions = el("div", {
    style: "display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex-wrap: wrap;",
  }, [
    el("button", {
      className: "pd-header-review-link",
      dataset: { testid: "header-review-answers-link" },
      text: "Review or update answers",
      onClick: () => {
        navigateToQuestions(onNavigate);
      },
    }),
  ]);

  void appendReviewCommitButton({
    actionsEl: headerActions,
    projectId: typeof projectId === "string" ? projectId.trim() : "",
    obState,
    onNavigate,
  });

  return el(
    "div",
    { className: "pd-header-card", dataset: { testid: "dashboard-header" } },
    [
      el("div", { className: "pd-header-top" }, [
        el("h1", { className: "pd-header-title", text: displayTitle }),
        headerActions,
      ]),

      el("div", { className: "pd-header-meta" }, [
        industryName
          ? el("div", { className: "pd-header-meta-item" }, [
              el("span", { className: "pd-header-meta-label", text: "Industry: " }),
              el("span", { text: industryName }),
            ])
          : null,
        el("div", { className: "pd-header-meta-item" }, [
          el("span", { className: "pd-header-meta-label", text: "Checkpoints: " }),
          el("span", { dataset: { testid: "header-checkpoint-count" }, text: `${completeCps} of ${totalCps} complete` }),
        ]),
      ]),

      el("div", { className: "pd-progress-row" }, [
        el("div", { className: "pd-progress-bar-wrap" }, [
          el("div", {
            className: "pd-progress-bar-fill",
            style: `width: ${completionPct}%`,
            dataset: { testid: "header-progress-bar" },
          }),
        ]),
        el("span", {
          className: "pd-progress-label",
          dataset: { testid: "header-progress-pct" },
          text: `${completionPct}%`,
        }),
      ]),

      savedAt
        ? el("div", {
            className: "pd-last-activity",
            dataset: { testid: "header-last-activity" },
            text: `Last activity: ${savedAt}`,
          })
        : null,
    ]
  );
}

// ---------------------------------------------------------------------------
// renderDomainsSection — Section 2 + 3
//
// Groups checkpoints by domain (using the "domain" field on each record).
// Shows only domains that appear in activatedDomains OR that have checkpoint
// records — whichever is non-empty.
// ---------------------------------------------------------------------------

function renderDomainsSection({
  activatedDomains,
  checkpointRecords,
  activeBlockers,
  runtimeState,
  onApply,
  onRun,
  onLoad,
  psState,
  obState,
  onNavigate,
}) {
  // Build domain → checkpoint map from records
  const byDomain = {};
  for (const cp of checkpointRecords) {
    const domId = cp?.domain ?? cp?.domain_id ?? "unknown";
    if (!byDomain[domId]) byDomain[domId] = [];
    byDomain[domId].push(cp);
  }

  // Union: activated domain IDs + domains that have records
  const allDomainIds = new Set([...activatedDomains, ...Object.keys(byDomain)]);
  // Remove "unknown" if no real domain was found
  if (byDomain["unknown"]?.length > 0 && activatedDomains.length > 0) {
    // keep "unknown" only if there are actual checkpoint records
  }

  const domainIds = Array.from(allDomainIds).filter((id) => id && id !== "unknown" || byDomain[id]?.length > 0);

  if (domainIds.length === 0) {
    return el(
      "div",
      { className: "pd-domain-grid", dataset: { testid: "domain-grid" } },
      [
        el("div", {
          style: "padding: 32px; text-align: center; color: var(--ee-outline); font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 0;",
          dataset: { testid: "no-domains-message" },
        }, [
          el("span", { text: "No domains activated yet. Complete onboarding to activate your implementation domains." }),
          el("button", {
            style: "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-weight: 600; font-size: 14px; padding: 10px 24px; cursor: pointer; margin-top: 16px;",
            onclick: () => { if (onNavigate) onNavigate("onboarding"); },
            dataset: { testid: "empty-state-onboarding-cta" },
          }, [el("span", { text: "Complete onboarding to get started \u2192" })]),
        ]),
      ]
    );
  }

  const cards = domainIds.map((domainId) => {
    const domainCps = byDomain[domainId] || [];
    return renderDomainCard({
      domainId,
      domainCps,
      activeBlockers,
      runtimeState,
      onApply,
      onRun,
      onLoad,
      psState,
      obState,
    });
  });

  return el("div", { className: "pd-domain-grid", dataset: { testid: "domain-grid" } }, cards);
}

// ---------------------------------------------------------------------------
// renderDomainCard — one card per activated domain (Section 2 + 3)
// ---------------------------------------------------------------------------

function renderDomainCard({
  domainId,
  domainCps,
  activeBlockers,
  runtimeState,
  onApply,
  onRun,
  onLoad,
  psState,
  obState,
}) {
  const domainName   = humanizeDomainId(domainId);
  const domainStatus = deriveDomainStatus(domainCps, activeBlockers);
  const nextAction   = deriveNextAction(domainCps, activeBlockers, domainStatus);
  const total        = domainCps.length;
  const complete     = domainCps.filter((cp) => cp?.status === "Complete").length;
  const pct          = total > 0 ? Math.round((complete / total) * 100) : 0;

  const statusBadgeClass = {
    "Not Started": "pd-domain-status-badge--not-started",
    "In Progress":  "pd-domain-status-badge--in-progress",
    "Complete":     "pd-domain-status-badge--complete",
    "Blocked":      "pd-domain-status-badge--blocked",
  }[domainStatus] || "pd-domain-status-badge--not-started";

  const fillClass = {
    "Complete": "pd-domain-progress-bar-fill--complete",
    "Blocked":  "pd-domain-progress-bar-fill--blocked",
  }[domainStatus] || "";

  // Checkpoint list (Section 3) — hidden until expanded
  const checkpointList = el(
    "div",
    { className: "pd-checkpoint-list", dataset: { testid: `checkpoint-list-${domainId}` } },
    domainCps.map((cp) =>
      renderCheckpointRow({
        cp,
        activeBlockers,
        runtimeState,
        onApply,
        onRun,
        onLoad,
        psState,
        obState,
      })
    )
  );

  const expandHint = el("div", { className: "pd-domain-expand-hint" }, [
    el("span", { text: "Click to see checkpoints" }),
  ]);

  const card = el(
    "div",
    {
      className: "pd-domain-card",
      dataset: {
        testid: `domain-card-${domainId}`,
        domainId,
      },
    },
    [
      // Card header
      el("div", { className: "pd-domain-card-header" }, [
        el("span", { className: "pd-domain-name", text: domainName }),
        el("span", {
          className: `pd-domain-status-badge ${statusBadgeClass}`,
          dataset: { testid: `domain-status-${domainId}` },
          text: domainStatus,
        }),
      ]),

      // Progress bar
      el("div", { className: "pd-domain-card-progress" }, [
        el("div", { className: "pd-domain-progress-bar-wrap" }, [
          el("div", {
            className: `pd-domain-progress-bar-fill ${fillClass}`,
            style: `width: ${pct}%`,
            dataset: { testid: `domain-progress-bar-${domainId}` },
          }),
        ]),
        el("span", {
          className: "pd-domain-progress-count",
          dataset: { testid: `domain-progress-count-${domainId}` },
          text: `${complete} of ${total} complete`,
        }),
      ]),

      // Next action
      el("div", {
        className: "pd-domain-next-action",
        dataset: { testid: `domain-next-action-${domainId}` },
        text: nextAction,
      }),

      // Section 3: Checkpoint list (expandable)
      checkpointList,

      // Expand hint
      expandHint,
    ]
  );

  // Toggle expansion on click
  card.addEventListener("click", (e) => {
    // Don't collapse when clicking buttons inside the card
    if (e.target.closest("button")) return;
    const isExpanded = card.classList.contains("pd-domain-card--expanded");
    card.classList.toggle("pd-domain-card--expanded", !isExpanded);
  });

  return card;
}

// ---------------------------------------------------------------------------
// renderCheckpointRow — one row per checkpoint (Section 3)
// ---------------------------------------------------------------------------

function renderCheckpointRow({
  cp,
  activeBlockers,
  runtimeState,
  onApply,
  onRun,
  onLoad,
  psState,
  obState,
}) {
  const id     = cp?.checkpoint_id ?? "—";
  const status = cp?.status ?? "Not_Started";
  const rel    = cp?.execution_relevance ?? "Informational";
  const safety = cp?.safety_class ?? "Not_Applicable";
  const vsrc   = cp?.validation_source ?? "";
  const name   = cp?.checkpoint_name ?? id;

  // Check if this checkpoint has an active blocker
  const isBlocked = Array.isArray(activeBlockers) && activeBlockers.some(
    (b) => b && (b.source_checkpoint_id === id || b.checkpoint_id === id)
  );

  const blocker = isBlocked && Array.isArray(activeBlockers)
    ? activeBlockers.find((b) => b && (b.source_checkpoint_id === id || b.checkpoint_id === id))
    : null;

  const statusIconClass = {
    "Complete":    "pd-checkpoint-status-icon--complete",
    "Not_Started": "pd-checkpoint-status-icon--not-started",
    "Blocked":     "pd-checkpoint-status-icon--blocked",
  }[status] || "pd-checkpoint-status-icon--not-started";

  const statusIconText = status === "Complete" ? "✓" : (isBlocked ? "!" : "○");

  const relClass = rel === "Executable"
    ? "pd-checkpoint-tag pd-checkpoint-tag--executable"
    : "pd-checkpoint-tag";

  const safetyClass = safety === "Safe"
    ? "pd-checkpoint-tag pd-checkpoint-tag--safe"
    : safety === "Conditional"
      ? "pd-checkpoint-tag pd-checkpoint-tag--conditional"
      : "pd-checkpoint-tag";

  // Inline error container (populated by action handlers)
  const inlineErrorEl = el("div", {
    className: "pd-checkpoint-inline-error",
    style: "display: none",
    dataset: { testid: `checkpoint-inline-error-${id}` },
  });

  // Action area
  const actionArea = el("div", {
    className: "pd-checkpoint-action",
    dataset: { testid: `checkpoint-action-${id}` },
  });

  if (status === "Complete") {
    actionArea.appendChild(
      el("span", { text: "✓", style: "color: #137333; font-weight: 700; font-size: 16px;" })
    );
  } else if (isBlocked || status === "Blocked") {
    actionArea.appendChild(
      el("button", {
        className: "pd-btn pd-btn--secondary",
        disabled: true,
        text: "Blocked",
        dataset: { testid: `checkpoint-blocked-btn-${id}` },
      })
    );
  } else if (rel === "Executable") {
    // Find approval for this checkpoint from execution_approvals
    const approval = findApprovalForCheckpoint(id, runtimeState);
    const btn = el("button", {
      className: "pd-btn pd-btn--primary",
      text: "Execute",
      dataset: { testid: `checkpoint-execute-btn-${id}`, checkpointId: id },
      onClick: () => handleExecute({ cp, approval, runtimeState, inlineErrorEl, onApply, onRun, onLoad, psState, obState }),
    });
    actionArea.appendChild(btn);
  } else if (vsrc === "User_Confirmed" || rel === "Informational") {
    const confirmToggleBtn = el("button", {
      className: "pd-btn pd-btn--confirm",
      text: "Confirm",
      dataset: { testid: `checkpoint-confirm-btn-${id}`, checkpointId: id },
    });

    // Inline confirm panel (hidden until toggled)
    const confirmPanel = renderConfirmPanel({
      cp,
      obState,
      runtimeState,
      inlineErrorEl,
      onRun,
      onLoad,
      psState,
      obState,
      onToggle: () => {
        const shown = confirmPanel.style.display !== "none";
        confirmPanel.style.display = shown ? "none" : "flex";
      },
    });
    confirmPanel.style.display = "none";

    confirmToggleBtn.addEventListener("click", () => {
      const shown = confirmPanel.style.display !== "none";
      confirmPanel.style.display = shown ? "none" : "flex";
    });

    actionArea.appendChild(confirmToggleBtn);
    actionArea.appendChild(confirmPanel);
  }

  return el("div", {
    className: "pd-checkpoint-row",
    dataset: { testid: `checkpoint-row-${id}` },
  }, [
    // Status icon
    el("div", { className: `pd-checkpoint-status-icon ${statusIconClass}`, text: statusIconText }),

    // Body
    el("div", { className: "pd-checkpoint-body" }, [
      el("div", { className: "pd-checkpoint-id", text: id }),
      el("div", { className: "pd-checkpoint-name", text: name }),
      el("div", { className: "pd-checkpoint-meta" }, [
        el("span", { className: relClass,   text: rel }),
        el("span", { className: safetyClass, text: safety }),
        el("span", { className: "pd-checkpoint-tag", text: vsrc || "—" }),
      ]),
      blocker
        ? el("div", {
            className: "pd-checkpoint-blocker",
            dataset: { testid: `checkpoint-blocker-text-${id}` },
            text: `Blocked by: ${blocker.blocking_checkpoint_id || blocker.blocked_by || "dependency"}`,
          })
        : null,
      inlineErrorEl,
    ]),

    // Action
    actionArea,
  ]);
}

// ---------------------------------------------------------------------------
// findApprovalForCheckpoint
//
// Looks up the execution approval for a checkpoint_id from runtime_state.
// Returns the approval object or null.
// ---------------------------------------------------------------------------

function findApprovalForCheckpoint(checkpointId, runtimeState) {
  const approvals =
    runtimeState?._engine_outputs?.execution_approvals?.execution_approvals;
  if (!Array.isArray(approvals)) return null;
  return (
    approvals.find(
      (a) =>
        a &&
        a.checkpoint_id === checkpointId &&
        a.execution_occurred === false
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// handleExecute — calls onApply with the approval for this checkpoint.
// On success: triggers a dashboard refresh.
// On error: shows inline error.
// ---------------------------------------------------------------------------

async function handleExecute({ cp, approval, runtimeState, inlineErrorEl, onApply, onRun, onLoad, psState, obState }) {
  inlineErrorEl.style.display = "none";

  if (!onApply) {
    showInlineError(inlineErrorEl, "Execute action not available.");
    return;
  }

  if (!approval || !approval.approval_id) {
    showInlineError(inlineErrorEl, "No execution approval available for this checkpoint.");
    return;
  }

  // Find the preview for this approval to determine the operation
  const previewId = approval.preview_id;
  const previews  = runtimeState?.previews;
  const preview   = Array.isArray(previews) && previewId
    ? previews.find((p) => p?.preview_id === previewId) ?? null
    : null;

  if (!preview) {
    showInlineError(inlineErrorEl, "No preview record found — cannot execute without a resolved operation.");
    return;
  }

  if (!preview.target_model || !preview.target_operation) {
    showInlineError(inlineErrorEl, "Preview missing target_model or target_operation — cannot execute.");
    return;
  }

  const projectId = (runtimeState?.project_identity?.project_id ?? "").trim();

  const operation = {
    model:  preview.target_model,
    method: preview.target_operation,
    values: preview.intended_changes ?? {},
  };

  // For write operations, include ids if present in intended_changes context
  // (the approval/preview carry the full context — no user input required here)

  try {
    await onApply({
      approval_id:        approval.approval_id,
      runtime_state:      runtimeState,
      operation,
      connection_context: { project_id: projectId },
    });
    // Refresh dashboard after apply
    await triggerRefresh({ psState, obState, onRun, onLoad });
  } catch (e) {
    showInlineError(inlineErrorEl, e?.message ?? "Execute failed.");
  }
}

// ---------------------------------------------------------------------------
// renderConfirmPanel — inline panel for User_Confirmed checkpoints
// ---------------------------------------------------------------------------

function renderConfirmPanel({ cp, obState, runtimeState, inlineErrorEl, onRun, onLoad, psState }) {
  const id         = cp?.checkpoint_id ?? "";
  const projectId  = runtimeState?.project_identity?.project_id ?? "";
  const actor      = obState?.connection?.url
    ? (obState?.connection?.project_id ?? projectId)
    : projectId;

  const evidenceInput = el("textarea", {
    placeholder: "Evidence notes (required)...",
    dataset: { testid: `confirm-evidence-${id}` },
  });

  const actorInput = el("input", {
    type: "text",
    value: actor || "",
    placeholder: "Actor (e.g. john.smith@company.com)",
    dataset: { testid: `confirm-actor-${id}` },
  });

  const submitBtn = el("button", {
    className: "pd-btn pd-btn--primary",
    text: "Submit confirmation",
    dataset: { testid: `confirm-submit-${id}` },
    onClick: async () => {
      const evidence = evidenceInput.value?.trim();
      const actorVal = actorInput.value?.trim();

      if (!evidence) {
        showInlineError(inlineErrorEl, "Evidence notes are required.");
        return;
      }

      inlineErrorEl.style.display = "none";

      try {
        const res = await fetch("/api/pipeline/checkpoint/confirm", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            project_id:    projectId,
            checkpoint_id: id,
            status:        "Complete",
            evidence,
            actor:         actorVal || null,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          showInlineError(
            inlineErrorEl,
            data.error ?? `Confirmation failed (HTTP ${res.status})`
          );
          return;
        }

        // Success — refresh dashboard
        await triggerRefresh({ psState, obState: null, onRun, onLoad });
      } catch (e) {
        showInlineError(inlineErrorEl, e?.message ?? "Network error during confirmation.");
      }
    },
  });

  return el(
    "div",
    {
      className: "pd-confirm-panel",
      dataset: { testid: `confirm-panel-${id}` },
      // display is toggled by caller
    },
    [
      el("div", {}, [
        el("div", { className: "pd-confirm-panel-label", text: "Evidence notes *" }),
        evidenceInput,
      ]),
      el("div", {}, [
        el("div", { className: "pd-confirm-panel-label", text: "Actor" }),
        actorInput,
      ]),
      submitBtn,
    ]
  );
}

// ---------------------------------------------------------------------------
// renderSummarySection — Section 4
// ---------------------------------------------------------------------------

function renderSummarySection({
  checkpointRecords,
  activatedDomains,
  activeBlockers,
  psState,
  obState,
  onRun,
  onLoad,
}) {
  // Build domain map to check completion/blocked status
  const byDomain = {};
  for (const cp of checkpointRecords) {
    const d = cp?.domain ?? cp?.domain_id ?? "unknown";
    if (!byDomain[d]) byDomain[d] = [];
    byDomain[d].push(cp);
  }

  const allDomainIds = Array.from(
    new Set([...activatedDomains, ...Object.keys(byDomain)])
  ).filter((id) => id !== "unknown" || byDomain[id]?.length > 0);

  const totalRemaining = checkpointRecords.filter((cp) => cp?.status !== "Complete").length;
  const domainsComplete = allDomainIds.filter((id) => {
    const cps = byDomain[id] || [];
    return cps.length > 0 && cps.every((cp) => cp?.status === "Complete");
  }).length;
  const domainsBlocked = allDomainIds.filter((id) => {
    const cps = byDomain[id] || [];
    return deriveDomainStatus(cps, activeBlockers) === "Blocked";
  }).length;

  const highestPriority = findHighestPriorityCheckpoint(checkpointRecords, activeBlockers);

  return el(
    "div",
    { className: "pd-summary-card", dataset: { testid: "summary-section" } },
    [
      el("div", { className: "pd-section-header", text: "What's Left" }),

      el("div", { className: "pd-summary-stats" }, [
        el("div", { className: "pd-summary-stat" }, [
          el("div", {
            className: "pd-summary-stat-value",
            dataset: { testid: "summary-remaining-count" },
            text: String(totalRemaining),
          }),
          el("div", { className: "pd-summary-stat-label", text: "Checkpoints remaining" }),
        ]),
        el("div", { className: "pd-summary-stat" }, [
          el("div", {
            className: "pd-summary-stat-value",
            dataset: { testid: "summary-domains-complete" },
            text: String(domainsComplete),
          }),
          el("div", { className: "pd-summary-stat-label", text: "Domains complete" }),
        ]),
        el("div", { className: "pd-summary-stat" }, [
          el("div", {
            className: "pd-summary-stat-value",
            dataset: { testid: "summary-domains-blocked" },
            text: String(domainsBlocked),
          }),
          el("div", { className: "pd-summary-stat-label", text: "Domains blocked" }),
        ]),
        el("div", { className: "pd-summary-stat" }, [
          el("div", {
            className: "pd-summary-stat-value",
            dataset: { testid: "summary-total-domains" },
            text: String(allDomainIds.length),
          }),
          el("div", { className: "pd-summary-stat-label", text: "Activated domains" }),
        ]),
      ]),

      // Next highest priority checkpoint
      highestPriority
        ? el("div", { className: "pd-next-action-block", dataset: { testid: "summary-next-action" } }, [
            el("div", {}, [
              el("div", { className: "pd-next-action-label", text: "Estimated next action" }),
              el("div", {
                className: "pd-next-action-text",
                dataset: { testid: "summary-next-action-text" },
                text: `${highestPriority.checkpoint_id} — ${humanizeDomainId(highestPriority.domain ?? highestPriority.domain_id ?? "")}`,
              }),
            ]),
          ])
        : totalRemaining === 0 && checkpointRecords.length > 0
          ? el("div", { className: "pd-next-action-block", dataset: { testid: "summary-next-action" } }, [
              el("div", { className: "pd-next-action-text", text: "All checkpoints complete. Implementation ready for go-live review." }),
            ])
          : null,

      // Refresh button
      el("div", { className: "pd-summary-footer" }, [
        renderRefreshButton(psState, obState, onRun, onLoad),
      ]),
    ]
  );
}

// ---------------------------------------------------------------------------
// renderRefreshButton
// ---------------------------------------------------------------------------

function renderRefreshButton(psState, obState, onRun, onLoad) {
  const isRefreshing =
    psState.status === "running" ||
    psState.status === "loading" ||
    psState.status === "resuming";

  return el("button", {
    className: "pd-btn pd-btn--refresh",
    disabled:  isRefreshing,
    dataset:   { testid: "dashboard-refresh-btn" },
    text:      isRefreshing ? "Refreshing..." : "Refresh",
    onClick:   async () => {
      await triggerRefresh({ psState, obState, onRun, onLoad });
    },
  });
}

// ---------------------------------------------------------------------------
// triggerRefresh
//
// Steps:
//  1. Load persisted runtime state (establishes carry-over block)
//  2. Rerun pipeline with carry-over block + discovery answers
//
// Carry-over block built from persisted checkpoint_statuses — never hardcoded.
// ---------------------------------------------------------------------------

export async function triggerRefresh({ psState, obState, onRun, onLoad }) {
  // Determine project_id
  const runtimeState = psState?.runtime_state;
  const projectId =
    runtimeState?.project_identity?.project_id ??
    obState?.connection?.project_id ??
    null;

  if (!projectId) return;

  // Step 1: load persisted state
  if (onLoad) {
    await onLoad(projectId);
  }

  // Get updated state after load (re-read from store)
  const updatedState = pipelineStore.getState();
  const loadedRuntime = updatedState.runtime_state;
  const carryOver = buildCarryOverBlock(loadedRuntime);

  // Step 2: rerun pipeline with carry-over block
  if (onRun) {
    // Collect discovery answers from persisted state or onboarding store
    const discoveryAnswers =
      loadedRuntime?.discovery_answers ??
      buildDiscoveryAnswers(obState);

    const targetContext =
      loadedRuntime?.target_context ??
      { deployment_type: "on_premise", primary_country: "US", primary_currency: "USD" };

    await onRun({
      project_identity:    { project_id: projectId },
      discovery_answers:   discoveryAnswers,
      target_context:      Object.keys(targetContext).length > 0 ? targetContext : null,
      checkpoint_statuses: carryOver,
    });
  }
}

// ---------------------------------------------------------------------------
// buildDiscoveryAnswers — collects answers from onboarding store.
// Returns a discovery_answers object suitable for the pipeline run payload.
// ---------------------------------------------------------------------------

function buildDiscoveryAnswers(obState) {
  const answers = {};
  if (obState?.answers) {
    for (const [qId, entry] of Object.entries(obState.answers)) {
      answers[qId] = entry;
    }
  }
  if (obState?.industry_id) {
    answers["industry_template"] = { answer: obState.industry_id, deferred: false };
  }
  return { answers };
}

// ---------------------------------------------------------------------------
// showInlineError — sets inline error message and makes it visible
// ---------------------------------------------------------------------------

function showInlineError(el, message) {
  el.textContent = message;
  el.style.display = "block";
}
