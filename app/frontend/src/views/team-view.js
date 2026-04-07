import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { getState } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";

const NAVY = "#0c1a30";
const AMBER = "#f59e0b";
const FADED_AMBER_BUTTON = "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-family: Inter, sans-serif; font-weight: 600; cursor: pointer;";
const CARD_STYLE = "background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px;";
const ROLE_OPTIONS = [
  { value: "project_lead", label: "Project Lead" },
  { value: "implementor", label: "Implementor" },
  { value: "reviewer", label: "Reviewer" },
  { value: "stakeholder", label: "Stakeholder" },
];
const INVITE_ROLE_OPTIONS = ROLE_OPTIONS.filter((role) => role.value !== "project_lead");
const READ_ONLY_ROLES = new Set(["reviewer", "stakeholder"]);
const TEAM_BUTTON_STYLE = `${FADED_AMBER_BUTTON} display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;`;
const FIELD_STYLE = "width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; font-size: 14px; color: #111827; font-family: Inter, sans-serif; background: #ffffff; box-sizing: border-box;";

function renderTeamIcon(name, size) {
  const normalized = String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])([0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .toLowerCase();

  return lucideIcon(normalized, size);
}

function getRoleBadgeConfig(role) {
  switch (role) {
    case "project_lead":
      return { label: "Project Lead", background: NAVY, color: "#ffffff" };
    case "implementor":
      return { label: "Implementor", background: "rgba(245,158,11,0.15)", color: "#92400e" };
    case "reviewer":
      return { label: "Reviewer", background: "#e0f2fe", color: "#0369a1" };
    case "stakeholder":
    default:
      return { label: "Stakeholder", background: "#f3f4f6", color: "#6b7280" };
  }
}

function formatShortDate(value, fallback = "Date unavailable") {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function getInitials(fullName) {
  const words = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "TM";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

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

async function requestTeamJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  if (payload?.error) {
    throw new Error(payload.error);
  }

  return payload;
}

function createRoleBadge(role) {
  const config = getRoleBadgeConfig(role);
  return el("span", {
    style: `display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: ${config.background}; color: ${config.color}; font-family: Inter, sans-serif;`,
    text: config.label,
  });
}

function createFieldShell(label, control) {
  return el("label", {
    style: "display: flex; flex-direction: column; gap: 6px; font-family: Inter, sans-serif;",
  }, [
    el("span", {
      style: "font-size: 13px; font-weight: 600; color: #374151;",
      text: label,
    }),
    control,
  ]);
}

export function renderTeamView({ project } = {}) {
  const projectId = resolveProjectId(project);
  const container = el("section", {
    style: "max-width: 1080px; margin: 0 auto; padding: 32px; font-family: Inter, sans-serif;",
  });
  const contentEl = el("div");
  const modalHost = el("div");
  const toastHost = el("div", {
    style: "position: fixed; right: 24px; bottom: 24px; z-index: 90; display: flex; flex-direction: column; gap: 12px;",
  });
  const state = {
    loading: true,
    error: null,
    members: [],
    inviteModalOpen: false,
    inviteSubmitting: false,
    inviteError: "",
    inviteForm: {
      fullName: "",
      email: "",
      role: "implementor",
    },
  };
  let latestLoadId = 0;
  let toastTimer = null;

  container.append(contentEl, modalHost, toastHost);

  function showToast(message) {
    clearNode(toastHost);
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    const toast = el("div", {
      style: "background: #0c1a30; color: #ffffff; padding: 12px 20px; border-radius: 6px; font-size: 14px; box-shadow: 0 10px 25px rgba(12,26,48,0.18); max-width: 320px;",
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
      if (currentUserId && member.account_id === currentUserId) {
        return true;
      }

      return !currentUserId && currentUserEmail && String(member.email || "").trim().toLowerCase() === currentUserEmail;
    }) || null;
    const currentRole = currentMembership?.role || null;
    const isProjectLead = currentRole === "project_lead";
    const isReadOnly = READ_ONLY_ROLES.has(currentRole);
    const leadCount = activeMembers.filter((member) => member.role === "project_lead").length;
    const activeMembersExcludingSelf = activeMembers.filter((member) => {
      if (currentMembership?.id) {
        return member.id !== currentMembership.id;
      }

      if (currentUserId) {
        return member.account_id !== currentUserId;
      }

      if (currentUserEmail) {
        return String(member.email || "").trim().toLowerCase() !== currentUserEmail;
      }

      return true;
    });

    return {
      onboardingState,
      currentUserId,
      activeMembers,
      pendingMembers,
      currentMembership,
      currentRole,
      isProjectLead,
      isReadOnly,
      leadCount,
      activeMembersExcludingSelf,
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

      if (requestId !== latestLoadId) {
        return;
      }

      state.members = Array.isArray(payload.members) ? payload.members : [];
      state.error = null;
    } catch (error) {
      if (requestId !== latestLoadId) {
        return;
      }

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
    state.inviteForm = {
      fullName: "",
      email: "",
      role: "implementor",
    };
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
        body: JSON.stringify({
          projectId,
          email,
          fullName,
          role,
        }),
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
    if (!nextRole || nextRole === member.role) {
      return;
    }

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
    if (confirmPrompt && typeof window !== "undefined" && !window.confirm(confirmPrompt)) {
      return;
    }

    try {
      const token = onboardingStore.getState()?.sessionToken || null;
      await requestTeamJson(
        `/api/team/${encodeURIComponent(projectId)}/${encodeURIComponent(member.id)}`,
        {
          method: "DELETE",
          headers: buildHeaders(token, false),
        }
      );

      await loadMembers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update team membership.");
    }
  }

  function renderMemberCard(member, derivedState) {
    const lastLeadLocked = member.role === "project_lead" && derivedState.leadCount <= 1;
    const tooltip = lastLeadLocked ? "You are the only project lead" : null;
    const select = el("select", {
      style: "border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; font-size: 13px; color: #111827; font-family: Inter, sans-serif; background: #ffffff;",
      disabled: lastLeadLocked,
      title: tooltip,
      onchange: (event) => {
        void handleRoleChange(member, event.target.value);
      },
    }, ROLE_OPTIONS.map((option) => el("option", {
      value: option.value,
      selected: member.role === option.value,
      text: option.label,
    })));

    const removeButtonIcon = renderTeamIcon("Trash2", 15);
    const removeButton = el("button", {
      type: "button",
      style: "border: none; background: transparent; color: #6b7280; padding: 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;",
      disabled: lastLeadLocked,
      title: tooltip,
      onclick: () => {
        void handleDelete(member, {
          confirmPrompt: `Remove ${member.full_name} from the project?`,
        });
      },
    }, [removeButtonIcon]);

    if (!lastLeadLocked) {
      removeButton.onmouseenter = () => { removeButton.style.color = "#dc2626"; };
      removeButton.onmouseleave = () => { removeButton.style.color = "#6b7280"; };
    } else {
      removeButton.style.cursor = "not-allowed";
      removeButton.style.opacity = "0.55";
    }

    if (lastLeadLocked) {
      select.style.cursor = "not-allowed";
      select.style.opacity = "0.7";
    }

    return el("div", {
      style: `${CARD_STYLE} display: flex; align-items: center; justify-content: space-between; gap: 16px;`,
    }, [
      el("div", {
        style: "display: flex; align-items: center; gap: 16px; min-width: 0; flex: 1;",
      }, [
        el("div", {
          style: "width: 40px; height: 40px; border-radius: 999px; background: #0c1a30; color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; flex-shrink: 0;",
          text: getInitials(member.full_name),
        }),
        el("div", {
          style: "display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1;",
        }, [
          el("div", {
            style: "display: flex; align-items: center; gap: 8px; flex-wrap: wrap;",
          }, [
            el("span", {
              style: "font-size: 15px; font-weight: 700; color: #0c1a30;",
              text: member.full_name,
            }),
            createRoleBadge(member.role),
          ]),
          el("span", {
            style: "font-size: 13px; color: #6b7280; word-break: break-word;",
            text: member.email,
          }),
          el("span", {
            style: "font-size: 12px; color: #6b7280;",
            text: `Joined ${formatShortDate(member.accepted_at, formatShortDate(member.created_at))}`,
          }),
        ]),
      ]),
      derivedState.isProjectLead
        ? el("div", {
            style: "display: flex; align-items: center; gap: 8px; flex-shrink: 0;",
          }, [
            select,
            removeButton,
          ])
        : null,
    ]);
  }

  function renderPendingInviteRow(member, derivedState) {
    const revokeButton = derivedState.isProjectLead
      ? (() => {
          const button = el("button", {
            type: "button",
            style: "border: none; background: transparent; color: #6b7280; padding: 6px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;",
            onclick: () => {
              void handleDelete(member);
            },
            title: "Revoke invite",
          }, [renderTeamIcon("X", 16)]);

          button.onmouseenter = () => { button.style.color = "#dc2626"; };
          button.onmouseleave = () => { button.style.color = "#6b7280"; };
          return button;
        })()
      : null;

    return el("div", {
      style: "display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f3f4f6;",
    }, [
      el("div", {
        style: "display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0;",
      }, [
        el("span", {
          style: "font-size: 14px; font-weight: 600; color: #0c1a30; word-break: break-word;",
          text: member.email,
        }),
        createRoleBadge(member.role),
        el("span", {
          style: "font-size: 13px; color: #6b7280;",
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
      oninput: (event) => {
        state.inviteForm.fullName = event.target.value;
      },
    });
    const emailInput = el("input", {
      type: "email",
      value: state.inviteForm.email,
      placeholder: "jane@company.com",
      style: FIELD_STYLE,
      oninput: (event) => {
        state.inviteForm.email = event.target.value;
      },
    });
    const roleSelect = el("select", {
      style: FIELD_STYLE,
      onchange: (event) => {
        state.inviteForm.role = event.target.value;
      },
    }, INVITE_ROLE_OPTIONS.map((option) => el("option", {
      value: option.value,
      selected: state.inviteForm.role === option.value,
      text: option.label,
    })));

    const closeButton = el("button", {
      type: "button",
      style: "border: none; background: transparent; color: #6b7280; padding: 6px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;",
      onclick: closeInviteModal,
      "aria-label": "Close invite modal",
    }, [renderTeamIcon("X", 18)]);

    closeButton.onmouseenter = () => { closeButton.style.color = NAVY; };
    closeButton.onmouseleave = () => { closeButton.style.color = "#6b7280"; };

    return el("div", {
      style: "position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 80;",
      onclick: (event) => {
        if (event.target === event.currentTarget) {
          closeInviteModal();
        }
      },
    }, [
      el("div", {
        style: "width: 100%; max-width: 440px; background: #ffffff; border-radius: 10px; padding: 32px; position: relative; box-shadow: 0 24px 48px rgba(12,26,48,0.18);",
      }, [
        el("div", {
          style: "display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px;",
        }, [
          el("h2", {
            style: "font-size: 18px; font-weight: 700; color: #0c1a30; margin: 0;",
            text: "Invite a Team Member",
          }),
          closeButton,
        ]),
        el("form", {
          style: "display: flex; flex-direction: column; gap: 16px;",
          onsubmit: (event) => {
            void handleInviteSubmit(event);
          },
        }, [
          createFieldShell("Full name", fullNameInput),
          createFieldShell("Email", emailInput),
          createFieldShell("Role", roleSelect),
          state.inviteError
            ? el("div", {
                style: "font-size: 13px; color: #dc2626;",
                text: state.inviteError,
              })
            : null,
          el("button", {
            type: "submit",
            disabled: state.inviteSubmitting,
            style: `${FADED_AMBER_BUTTON} width: 100%; padding: 12px 18px; font-size: 14px;${state.inviteSubmitting ? " opacity: 0.75; cursor: wait;" : ""}`,
            text: state.inviteSubmitting ? "Sending..." : "Send Invite",
          }),
          el("button", {
            type: "button",
            style: "border: none; background: transparent; color: #6b7280; font-size: 14px; cursor: pointer; padding: 0; margin-top: 4px;",
            onclick: closeInviteModal,
            text: "Cancel",
          }),
        ]),
      ]),
    ]);
  }

  function renderEmptyState(derivedState) {
    return el("div", {
      style: "text-align: center; padding-top: 60px; display: flex; flex-direction: column; align-items: center;",
    }, [
      (() => {
        const icon = renderTeamIcon("Users", 48);
        icon.style.color = "#d1d5db";
        return icon;
      })(),
      el("h3", {
        style: "font-size: 18px; font-weight: 600; color: #0c1a30; margin: 16px 0 8px;",
        text: "Your team is just you for now.",
      }),
      el("p", {
        style: "font-size: 14px; color: #6b7280; margin: 0; max-width: 420px;",
        text: "Invite collaborators to track who approves each checkpoint.",
      }),
      derivedState.isProjectLead
        ? el("button", {
            type: "button",
            style: `${TEAM_BUTTON_STYLE} margin-top: 20px;`,
            onclick: openInviteModal,
          }, [
            renderTeamIcon("UserPlus", 16),
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
          style: TEAM_BUTTON_STYLE,
          onclick: openInviteModal,
        }, [
          renderTeamIcon("UserPlus", 16),
          el("span", { text: "Invite Member" }),
        ])
      : null;

    const activeSection = state.loading
      ? el("div", {
          style: `${CARD_STYLE} color: #6b7280;`,
          text: "Loading team members...",
        })
      : state.error
        ? el("div", {
            style: "background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); border-radius: 10px; padding: 16px; color: #b91c1c;",
            text: state.error,
          })
        : derivedState.activeMembersExcludingSelf.length === 0
          ? renderEmptyState(derivedState)
          : el("div", {
              style: "display: flex; flex-direction: column; gap: 12px;",
            }, derivedState.activeMembers.map((member) => renderMemberCard(member, derivedState)));

    const pendingSection = !state.loading && !state.error && derivedState.pendingMembers.length > 0
      ? el("section", {
          style: `${CARD_STYLE} margin-top: 24px;`,
        }, [
          el("div", {
            style: "font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; margin-bottom: 12px; font-weight: 600;",
            text: "Pending Invites",
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
      style: "display: flex; flex-direction: column; gap: 24px;",
    }, [
      derivedState.isReadOnly
        ? el("div", {
            style: "background: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b; border-radius: 4px; padding: 10px 16px; display: flex; align-items: center; gap: 8px;",
          }, [
            (() => {
              const icon = renderTeamIcon("Info", 15);
              icon.style.color = "#f59e0b";
              return icon;
            })(),
            el("span", {
              style: "color: #92400e; font-size: 14px;",
              text: "You have read-only access to this section. Contact your project lead to make changes.",
            }),
          ])
        : null,
      el("div", {
        style: "display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;",
      }, [
        el("h1", {
          style: "font-size: 28px; font-weight: 700; color: #0c1a30; margin: 0;",
          text: "Team",
        }),
        headerInviteButton,
      ]),
      activeSection,
      pendingSection,
    ]);
  }

  function render() {
    clearNode(contentEl);
    clearNode(modalHost);
    contentEl.append(renderContent());

    if (state.inviteModalOpen) {
      modalHost.append(renderInviteModal());
    }
  }

  render();
  queueMicrotask(() => {
    void loadMembers();
  });

  return container;
}
