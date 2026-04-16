import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { getState } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";

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

const PILL_PRIMARY =
  "display: inline-flex; align-items: center; gap: 8px; " +
  "padding: 9px 16px; border-radius: var(--radius-pill); " +
  "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
  "border: 1px solid var(--color-pill-primary-bg); " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "cursor: pointer; transition: all var(--dur-base) var(--ease);";

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

const ROLE_OPTIONS = [
  { value: "project_lead", label: "Project Lead" },
  { value: "implementor", label: "Implementor" },
  { value: "reviewer", label: "Reviewer" },
  { value: "stakeholder", label: "Stakeholder" },
];
const INVITE_ROLE_OPTIONS = ROLE_OPTIONS.filter((role) => role.value !== "project_lead");
const READ_ONLY_ROLES = new Set(["reviewer", "stakeholder"]);

const ROLE_DESCRIPTIONS = {
  implementor: "Can configure checkpoints and run the pipeline. Cannot commit changes to Odoo.",
  reviewer: "Read-only. Can view progress and audit trail but cannot modify configuration.",
  stakeholder: "Read-only. Dashboard and report access for business oversight.",
};

function renderTeamIcon(name, size) {
  const normalized = String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])([0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .toLowerCase();
  return lucideIcon(normalized, size);
}

function bindFocusBorder(node) {
  if (!node) return;
  node.addEventListener("focus", () => { node.style.borderColor = "var(--color-ink)"; });
  node.addEventListener("blur", () => { node.style.borderColor = "var(--color-line)"; });
}

function roleLabel(role) {
  const match = ROLE_OPTIONS.find((option) => option.value === role);
  return match ? match.label : "";
}

function createRoleBadge(role) {
  const label = roleLabel(role);
  if (!label) return null;
  let bg = "var(--color-chip-bg)";
  let fg = "var(--color-chip-fg)";
  if (role === "project_lead") {
    bg = "var(--color-pill-primary-bg)";
    fg = "var(--color-pill-primary-fg)";
  } else if (role === "implementor") {
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

function formatShortDate(value, fallback = "Date unavailable") {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  }).format(parsed);
}

function getInitials(fullName) {
  const words = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "TM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
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
    try { return new URL(raw).hostname; }
    catch {
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

async function requestTeamJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJsonResponse(response);
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  if (payload?.error) throw new Error(payload.error);
  return payload;
}

function createFieldShell(label, control) {
  return el("label", {
    style: "display: flex; flex-direction: column; gap: 6px;",
  }, [
    el("span", { style: FIELD_LABEL_STYLE, text: label }),
    control,
  ]);
}

export function renderTeamView({ project } = {}) {
  const projectId = resolveProjectId(project);
  const container = el("section", {
    style: `${CANVAS_STYLE} max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-5);`,
    dataset: { testid: "team-view" },
  });
  const contentEl = el("div");
  const modalHost = el("div");
  const toastHost = el("div", {
    style:
      "position: fixed; right: var(--space-6); bottom: var(--space-6); z-index: 120; " +
      "display: flex; flex-direction: column; gap: var(--space-3);",
  });
  const state = {
    loading: true,
    error: null,
    members: [],
    inviteModalOpen: false,
    inviteSubmitting: false,
    inviteError: "",
    inviteForm: { fullName: "", email: "", role: "implementor" },
  };
  let latestLoadId = 0;
  let toastTimer = null;

  container.append(contentEl, modalHost, toastHost);

  function showToast(message) {
    clearNode(toastHost);
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    const toast = el("div", {
      style:
        "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
        "padding: var(--space-3) var(--space-5); border-radius: var(--radius-pill); " +
        "font-family: var(--font-body); font-size: var(--fs-small); " +
        "box-shadow: var(--shadow-menu); max-width: 320px;",
      text: message,
    });
    toastHost.append(toast);
    toastTimer = setTimeout(() => {
      clearNode(toastHost);
      toastTimer = null;
    }, 3000);
  }

  function getDerivedState() {
    const onboardingState = onboardingStore.getState();
    const currentUserId = onboardingState?.user?.id || null;
    const currentUserEmail = String(onboardingState?.user?.email || "").trim().toLowerCase();
    const activeMembers = state.members.filter((member) => member.accepted_at);
    const pendingMembers = state.members.filter((member) => !member.accepted_at);
    const currentMembership = activeMembers.find((member) => {
      if (currentUserId && member.account_id === currentUserId) return true;
      return !currentUserId && currentUserEmail &&
        String(member.email || "").trim().toLowerCase() === currentUserEmail;
    }) || null;
    const currentRole = currentMembership?.role || null;
    const isProjectLead = currentRole === "project_lead";
    const isReadOnly = READ_ONLY_ROLES.has(currentRole);
    const leadCount = activeMembers.filter((member) => member.role === "project_lead").length;
    const activeMembersExcludingSelf = activeMembers.filter((member) => {
      if (currentMembership?.id) return member.id !== currentMembership.id;
      if (currentUserId) return member.account_id !== currentUserId;
      if (currentUserEmail) return String(member.email || "").trim().toLowerCase() !== currentUserEmail;
      return true;
    });
    const host = deriveInstanceHost(onboardingState?.connection?.url || "", onboardingState?.connection?.database || "");
    return {
      onboardingState, currentUserId, activeMembers, pendingMembers, currentMembership,
      currentRole, isProjectLead, isReadOnly, leadCount, activeMembersExcludingSelf, host,
    };
  }

  async function loadMembers() {
    if (!projectId) {
      state.loading = false;
      state.error = "Team membership is unavailable until this project has an ID.";
      render();
      return;
    }
    const requestId = ++latestLoadId;
    state.loading = true;
    state.error = null;
    render();
    try {
      const token = onboardingStore.getState()?.sessionToken || null;
      const payload = await requestTeamJson(`/api/team/${encodeURIComponent(projectId)}`, {
        method: "GET",
        headers: buildHeaders(token, false),
      });
      if (requestId !== latestLoadId) return;
      state.members = Array.isArray(payload.members) ? payload.members : [];
      state.error = null;
    } catch (error) {
      if (requestId !== latestLoadId) return;
      state.error = error instanceof Error ? error.message : "Failed to load team members.";
    } finally {
      if (requestId === latestLoadId) {
        state.loading = false;
        render();
      }
    }
  }

  function openInviteModal() {
    state.inviteModalOpen = true;
    state.inviteSubmitting = false;
    state.inviteError = "";
    state.inviteForm = { fullName: "", email: "", role: "implementor" };
    render();
  }

  function closeInviteModal() {
    state.inviteModalOpen = false;
    state.inviteSubmitting = false;
    state.inviteError = "";
    render();
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();
    const email = String(state.inviteForm.email || "").trim();
    const fullName = String(state.inviteForm.fullName || "").trim();
    const role = String(state.inviteForm.role || "").trim();
    if (!fullName || !email) {
      state.inviteError = "Full name and email are required.";
      render();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      state.inviteError = "Enter a valid email address.";
      render();
      return;
    }
    state.inviteSubmitting = true;
    state.inviteError = "";
    render();
    try {
      const token = onboardingStore.getState()?.sessionToken || null;
      await requestTeamJson("/api/team/invite", {
        method: "POST",
        headers: buildHeaders(token, true),
        body: JSON.stringify({ projectId, email, fullName, role }),
      });
      closeInviteModal();
      await loadMembers();
      showToast(`Invite sent to ${email}`);
    } catch (error) {
      state.inviteSubmitting = false;
      state.inviteError = error instanceof Error ? error.message : "Failed to send invite.";
      render();
    }
  }

  async function handleRoleChange(member, nextRole) {
    if (!nextRole || nextRole === member.role) return;
    try {
      const token = onboardingStore.getState()?.sessionToken || null;
      await requestTeamJson(
        `/api/team/${encodeURIComponent(projectId)}/${encodeURIComponent(member.id)}`,
        {
          method: "PATCH",
          headers: buildHeaders(token, true),
          body: JSON.stringify({ role: nextRole }),
        }
      );
      await loadMembers();
      showToast("Role updated");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update role.");
    }
  }

  async function handleDelete(member, { confirmPrompt } = {}) {
    if (confirmPrompt && typeof window !== "undefined" && !window.confirm(confirmPrompt)) return;
    try {
      const token = onboardingStore.getState()?.sessionToken || null;
      await requestTeamJson(
        `/api/team/${encodeURIComponent(projectId)}/${encodeURIComponent(member.id)}`,
        { method: "DELETE", headers: buildHeaders(token, false) }
      );
      await loadMembers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update team membership.");
    }
  }

  function renderAvatar(fullName) {
    return el("div", {
      style:
        "width: 40px; height: 40px; border-radius: 50%; " +
        "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
        "display: flex; align-items: center; justify-content: center; " +
        "font-family: var(--font-mono); font-size: var(--fs-small); font-weight: 600; " +
        "flex-shrink: 0;",
      text: getInitials(fullName),
    });
  }

  function renderMemberCard(member, derivedState) {
    const lastLeadLocked = member.role === "project_lead" && derivedState.leadCount <= 1;
    const tooltip = lastLeadLocked ? "You are the only project lead" : null;
    const select = el("select", {
      style:
        "background: var(--color-surface); border: 1px solid var(--color-line); " +
        "border-radius: var(--radius-input); padding: 8px 10px; " +
        "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-ink); " +
        "outline: none; transition: border-color var(--dur-fast) var(--ease);",
      disabled: lastLeadLocked,
      title: tooltip,
      onchange: (event) => { void handleRoleChange(member, event.target.value); },
    }, ROLE_OPTIONS.map((option) => el("option", {
      value: option.value,
      selected: member.role === option.value,
      text: option.label,
    })));
    bindFocusBorder(select);

    const removeButton = el("button", {
      type: "button",
      style:
        "border: none; background: transparent; color: var(--color-muted); " +
        "padding: 8px; border-radius: var(--radius-chip); cursor: pointer; " +
        "display: inline-flex; align-items: center; justify-content: center; " +
        "transition: color var(--dur-fast) var(--ease);",
      disabled: lastLeadLocked,
      title: tooltip,
      onclick: () => {
        void handleDelete(member, { confirmPrompt: `Remove ${member.full_name} from the project?` });
      },
    }, [renderTeamIcon("trash-2", 15)]);

    if (!lastLeadLocked) {
      removeButton.onmouseenter = () => { removeButton.style.color = "var(--color-chip-review-fg)"; };
      removeButton.onmouseleave = () => { removeButton.style.color = "var(--color-muted)"; };
    } else {
      removeButton.style.cursor = "not-allowed";
      removeButton.style.opacity = "0.55";
      select.style.cursor = "not-allowed";
      select.style.opacity = "0.7";
    }

    return el("div", {
      style:
        `${CARD_STYLE} padding: var(--space-4) var(--space-5); ` +
        `display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);`,
    }, [
      el("div", {
        style: "display: flex; align-items: center; gap: var(--space-3); min-width: 0; flex: 1;",
      }, [
        renderAvatar(member.full_name),
        el("div", {
          style: "display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1;",
        }, [
          el("div", {
            style: "display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;",
          }, [
            el("span", {
              style: "font-size: var(--fs-body); font-weight: 600; color: var(--color-ink);",
              text: member.full_name,
            }),
            createRoleBadge(member.role),
          ]),
          el("span", {
            style:
              "font-family: var(--font-mono); font-size: var(--fs-small); " +
              "color: var(--color-muted); word-break: break-word;",
            text: member.email,
          }),
          el("span", {
            style:
              "font-family: var(--font-mono); font-size: var(--fs-tiny); " +
              "color: var(--color-subtle);",
            text: `Joined ${formatShortDate(member.accepted_at, formatShortDate(member.created_at))}`,
          }),
        ]),
      ]),
      derivedState.isProjectLead
        ? el("div", {
            style: "display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0;",
          }, [select, removeButton])
        : null,
    ]);
  }

  function renderPendingInviteRow(member, derivedState) {
    const revokeButton = derivedState.isProjectLead
      ? (() => {
          const button = el("button", {
            type: "button",
            style:
              "border: none; background: transparent; color: var(--color-muted); " +
              "padding: 6px; border-radius: var(--radius-chip); cursor: pointer; " +
              "display: inline-flex; align-items: center; justify-content: center; " +
              "transition: color var(--dur-fast) var(--ease);",
            onclick: () => { void handleDelete(member); },
            title: "Revoke invite",
          }, [renderTeamIcon("x", 16)]);
          button.onmouseenter = () => { button.style.color = "var(--color-chip-review-fg)"; };
          button.onmouseleave = () => { button.style.color = "var(--color-muted)"; };
          return button;
        })()
      : null;

    return el("div", {
      style:
        "display: flex; align-items: center; justify-content: space-between; " +
        "gap: var(--space-3); padding: var(--space-3) 0; " +
        "border-bottom: 1px solid var(--color-line-soft);",
    }, [
      el("div", {
        style:
          "display: flex; align-items: center; gap: var(--space-2); " +
          "flex-wrap: wrap; min-width: 0;",
      }, [
        el("span", {
          style:
            "font-family: var(--font-mono); font-size: var(--fs-small); " +
            "font-weight: 500; color: var(--color-ink); word-break: break-word;",
          text: member.email,
        }),
        createRoleBadge(member.role),
        el("span", {
          style:
            "font-family: var(--font-mono); font-size: var(--fs-tiny); " +
            "color: var(--color-subtle);",
          text: `Invited ${formatShortDate(member.created_at)}`,
        }),
      ]),
      revokeButton,
    ]);
  }

  function renderInviteModal() {
    const fullNameInput = el("input", {
      type: "text",
      value: state.inviteForm.fullName,
      placeholder: "Jane Smith",
      style: FIELD_STYLE,
      oninput: (event) => { state.inviteForm.fullName = event.target.value; },
    });
    bindFocusBorder(fullNameInput);

    const emailInput = el("input", {
      type: "email",
      value: state.inviteForm.email,
      placeholder: "jane@company.com",
      style: `${FIELD_STYLE} font-family: var(--font-mono);`,
      oninput: (event) => { state.inviteForm.email = event.target.value; },
    });
    bindFocusBorder(emailInput);

    const roleDescriptionEl = el("div", {
      style:
        `${PANEL_STYLE} padding: var(--space-3) var(--space-4); ` +
        `font-size: var(--fs-small); color: var(--color-body); ` +
        `line-height: var(--lh-body); background: var(--color-canvas-base);`,
      text: ROLE_DESCRIPTIONS[state.inviteForm.role] || "",
    });

    const roleSelect = el("select", {
      style: FIELD_STYLE,
      onchange: (event) => {
        state.inviteForm.role = event.target.value;
        roleDescriptionEl.textContent = ROLE_DESCRIPTIONS[event.target.value] || "";
      },
    }, INVITE_ROLE_OPTIONS.map((option) => el("option", {
      value: option.value,
      selected: state.inviteForm.role === option.value,
      text: option.label,
    })));
    bindFocusBorder(roleSelect);

    const closeButton = el("button", {
      type: "button",
      style:
        "border: none; background: transparent; color: var(--color-muted); " +
        "padding: 6px; border-radius: var(--radius-chip); cursor: pointer; " +
        "display: inline-flex; align-items: center; justify-content: center;",
      onclick: closeInviteModal,
      "aria-label": "Close invite modal",
    }, [renderTeamIcon("x", 18)]);

    return el("div", {
      style:
        "position: fixed; inset: 0; background: rgba(0,0,0,0.5); " +
        "display: flex; align-items: center; justify-content: center; " +
        "padding: var(--space-6); z-index: 100;",
      onclick: (event) => {
        if (event.target === event.currentTarget) closeInviteModal();
      },
    }, [
      el("div", {
        style:
          `width: 100%; max-width: 480px; ${CARD_STYLE} ` +
          `padding: var(--space-7); box-shadow: var(--shadow-menu); ` +
          `display: flex; flex-direction: column; gap: var(--space-4);`,
      }, [
        el("div", {
          style:
            "display: flex; align-items: flex-start; justify-content: space-between; " +
            "gap: var(--space-3);",
        }, [
          el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" }, [
            el("span", { style: EYEBROW_STYLE, text: "INVITE" }),
            el("h2", {
              style:
                "margin: 0; font-size: var(--fs-h2); font-weight: 600; " +
                "color: var(--color-ink); letter-spacing: var(--track-tight);",
              text: "Invite a team member",
            }),
          ]),
          closeButton,
        ]),
        el("form", {
          style: "display: flex; flex-direction: column; gap: var(--space-4);",
          onsubmit: (event) => { void handleInviteSubmit(event); },
        }, [
          createFieldShell("Full name", fullNameInput),
          createFieldShell("Email", emailInput),
          createFieldShell("Role", roleSelect),
          roleDescriptionEl,
          state.inviteError
            ? el("div", {
                style: "font-size: var(--fs-small); color: var(--color-chip-review-fg);",
                text: state.inviteError,
              })
            : null,
          el("div", {
            style: "display: flex; justify-content: flex-end; gap: var(--space-3);",
          }, [
            el("button", {
              type: "button",
              style: PILL_SECONDARY,
              onclick: closeInviteModal,
              text: "Cancel",
            }),
            el("button", {
              type: "submit",
              disabled: state.inviteSubmitting,
              style: `${PILL_PRIMARY}${state.inviteSubmitting ? " opacity: 0.75; cursor: wait;" : ""}`,
              text: state.inviteSubmitting ? "Sending..." : "Send invite",
            }),
          ]),
        ]),
      ]),
    ]);
  }

  function renderEmptyState(derivedState) {
    const icon = renderTeamIcon("users", 40);
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
        text: "Your team is just you for now.",
      }),
      el("p", {
        style:
          "margin: 0; font-size: var(--fs-body); color: var(--color-muted); " +
          "max-width: 420px; line-height: var(--lh-body);",
        text: "Invite collaborators to track who approves each checkpoint.",
      }),
      derivedState.isProjectLead
        ? el("button", {
            type: "button",
            style: PILL_PRIMARY,
            onclick: openInviteModal,
          }, [
            renderTeamIcon("user-plus", 16),
            el("span", { text: "Invite your first team member" }),
          ])
        : null,
    ]);
  }

  function renderContent() {
    const derivedState = getDerivedState();
    const headerInviteButton = derivedState.isProjectLead
      ? el("button", {
          type: "button",
          style: PILL_PRIMARY,
          onclick: openInviteModal,
        }, [
          renderTeamIcon("user-plus", 16),
          el("span", { text: "Invite member" }),
        ])
      : null;

    const activeCount = derivedState.activeMembers.length;
    const pendingCount = derivedState.pendingMembers.length;
    const metaText = state.loading
      ? "Loading..."
      : `${activeCount} ${activeCount === 1 ? "member" : "members"}  ·  ${pendingCount} pending invites`;

    const activeSection = state.loading
      ? el("div", {
          style: `${PANEL_STYLE} padding: var(--space-5); color: var(--color-muted); font-size: var(--fs-small);`,
          text: "Loading team members...",
        })
      : state.error
        ? el("div", {
            style:
              "background: var(--color-chip-review-bg); " +
              "border: 1px solid var(--color-chip-review-fg); " +
              "border-radius: var(--radius-panel); " +
              "padding: var(--space-3) var(--space-4); " +
              "color: var(--color-chip-review-fg); font-size: var(--fs-small);",
            text: state.error,
          })
        : derivedState.activeMembersExcludingSelf.length === 0 && derivedState.activeMembers.length <= 1
          ? renderEmptyState(derivedState)
          : el("div", {
              style: "display: flex; flex-direction: column; gap: var(--space-3);",
            }, derivedState.activeMembers.map((member) => renderMemberCard(member, derivedState)));

    const pendingSection = !state.loading && !state.error && derivedState.pendingMembers.length > 0
      ? el("section", {
          style:
            `${PANEL_STYLE} padding: var(--space-4) var(--space-5); ` +
            `display: flex; flex-direction: column; gap: var(--space-2);`,
        }, [
          el("div", {
            style:
              "font-size: var(--fs-micro); text-transform: uppercase; " +
              "letter-spacing: var(--track-eyebrow-strong); " +
              "color: var(--color-subtle); font-weight: 600;",
            text: "Pending invites",
          }),
          ...derivedState.pendingMembers.map((member, index) => {
            const row = renderPendingInviteRow(member, derivedState);
            if (index === derivedState.pendingMembers.length - 1) {
              row.style.borderBottom = "none";
            }
            return row;
          }),
        ])
      : null;

    return el("div", {
      style: "display: flex; flex-direction: column; gap: var(--space-5);",
    }, [
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
          el("span", { style: EYEBROW_STYLE, text: `TEAM · ${derivedState.host}` }),
          el("h1", {
            style:
              "margin: 0; font-size: var(--fs-h1); font-weight: 600; " +
              "letter-spacing: var(--track-tight); line-height: var(--lh-snug); " +
              "color: var(--color-ink); font-family: var(--font-body);",
            text: "Team",
          }),
          el("div", { style: MONO_META_STYLE, text: metaText }),
        ]),
        headerInviteButton,
      ]),
      derivedState.isReadOnly
        ? el("div", {
            style:
              `${PANEL_STYLE} padding: var(--space-3) var(--space-4); ` +
              `display: flex; align-items: center; gap: var(--space-3); ` +
              `color: var(--color-body); font-size: var(--fs-small);`,
          }, [
            (() => {
              const icon = renderTeamIcon("info", 16);
              icon.style.color = "var(--color-subtle)";
              icon.style.flexShrink = "0";
              return icon;
            })(),
            el("span", {
              text: "You have read-only access to this section. Contact your project lead to make changes.",
            }),
          ])
        : null,
      activeSection,
      pendingSection,
    ]);
  }

  function render() {
    clearNode(contentEl);
    clearNode(modalHost);
    contentEl.append(renderContent());
    if (state.inviteModalOpen) modalHost.append(renderInviteModal());
  }

  render();
  queueMicrotask(() => { void loadMembers(); });

  return container;
}
