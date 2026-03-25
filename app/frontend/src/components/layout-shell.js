import { getProjectStoreRecordId, getProjectStoreRecordLabel, renderConnectionCapabilityLabel } from "/shared/index.js";
import { el } from "../lib/dom.js";

const NAV_ITEMS = [
  { id: "new-project",          icon: "add",                label: "New Project" },
  { id: "dashboard",            icon: "dashboard",          label: "Dashboard" },
  { id: "implementation-roadmap", icon: "route",          label: "Implementation Roadmap" },
  { id: "module-setup",         icon: "tune",               label: "Module Setup" },
  { id: "data-import",          icon: "upload_file",        label: "Data Import" },
  { id: "knowledge-base",       icon: "menu_book",          label: "Knowledge Base" },
  { id: "analytics",            icon: "bar_chart",          label: "Analytics" }
];

export function renderLayoutShell({ project, content, notifications, onNavigate, onSave, onResume, onConnect, onDisconnect }) {
  const savedProjects = (project.savedProjects || []).filter((item) => getProjectStoreRecordId(item));
  const currentView = project.workflowState?.currentView || "dashboard";
  const connectionStatus = project.connectionState?.status || "disconnected";
  const isConnected = connectionStatus === "connected";
  const instanceUrl = project.connectionState?.url || null;
  const companyName = project.connectionState?.companyName || null;

  // ── Mobile hamburger state ────────────────────────────────
  let sidebarOpen = false;
  const sidebarEl = buildSidebar(project, currentView, onNavigate, onSave, savedProjects, onResume, isConnected, instanceUrl, () => {
    sidebarOpen = false;
    sidebarEl.classList.remove("pd-sidebar--open");
    overlay.classList.add("hidden");
  });

  const overlay = el("div", {
    className: "fixed inset-0 bg-black/50 z-30 hidden md:hidden",
    onclick: () => {
      sidebarOpen = false;
      sidebarEl.classList.remove("pd-sidebar--open");
      overlay.classList.add("hidden");
    }
  });

  // ── Top Header — clean white surface, shadow-sm ───────────
  const currentNavItem = NAV_ITEMS.find(n => currentView.startsWith(n.id) || currentView === n.id);
  const sectionTitle = currentNavItem?.label || "Dashboard";

  const topHeader = el("header", {
    className: "pd-header",
    style: "position: fixed; top: 0; right: 0; left: 260px; z-index: 40;"
  }, [
    el("div", { className: "flex items-center gap-4" }, [
      el("button", {
        className: "md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors",
        onclick: () => {
          sidebarOpen = !sidebarOpen;
          sidebarEl.classList.toggle("pd-sidebar--open", sidebarOpen);
          overlay.classList.toggle("hidden", !sidebarOpen);
        },
        "aria-label": "Toggle sidebar"
      }, [
        el("span", { className: "material-symbols-outlined text-[#94a3b8]", text: "menu" })
      ]),
      el("h1", {
        className: "pd-header__title",
        text: sectionTitle
      })
    ]),
    el("div", { className: "flex items-center gap-3" }, [
      el("div", { className: "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e293b] border border-[rgba(148,163,184,0.1)]" }, [
        el("span", {
          className: `w-2 h-2 rounded-full ${isConnected ? "bg-[#22c55e]" : "bg-[#ef4444]"}`,
          style: isConnected ? "box-shadow: 0 0 8px #22c55e;" : "box-shadow: 0 0 8px #ef4444;"
        }),
        el("span", {
          className: "text-xs font-medium",
          style: `color: ${isConnected ? "#22c55e" : "#ef4444"};`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected"
        })
      ]),
      isConnected
        ? el("button", {
            className: "pd-btn pd-btn--primary",
            onclick: onSave
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "sync" }),
            el("span", { className: "hidden sm:inline", text: "Sync to Odoo" })
          ])
        : el("button", {
            className: "pd-btn pd-btn--primary",
            onclick: () => onNavigate("connection-wizard")
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "link" }),
            el("span", { className: "hidden sm:inline", text: "Connect Odoo" })
          ]),
      el("div", {
        className: "w-9 h-9 flex items-center justify-center text-sm font-bold rounded-full",
        style: "background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white;"
      }, [
        el("span", { text: companyName ? companyName.substring(0, 2).toUpperCase() : "US" })
      ])
    ])
  ]);

  // ── Notifications ────────────────────────────────────────
  const notificationBar = notifications?.length
    ? el("div", { className: "fixed top-20 right-4 z-50 space-y-2 max-w-sm" },
        notifications.map(n => el("div", {
          className: "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl border",
          style: n.type === "error"
            ? "background: rgba(239, 68, 68, 0.1); color: #fca5a5; border-color: rgba(239, 68, 68, 0.2);"
            : n.type === "success"
              ? "background: rgba(34, 197, 94, 0.1); color: #86efac; border-color: rgba(34, 197, 94, 0.2);"
              : "background: rgba(30, 41, 59, 0.8); color: #f8fafc; border-color: rgba(148, 163, 184, 0.1);"
        }, [
          el("span", {
            className: "material-symbols-outlined text-[18px]",
            text: n.type === "error" ? "error" : n.type === "success" ? "check_circle" : "info"
          }),
          el("span", { text: n.message })
        ]))
      )
    : null;

  // ── Main Area ─────────────────────────────────────────────
  const mainArea = el("main", {
    id: "main-content",
    className: "pd-main",
    style: "padding-top: 80px;"
  }, [content]);

  // ── Responsive: override left on small screens ─────────────
  const mobileStyle = el("style", {}, [
    "@media (max-width: 768px) { .pd-header { left: 0 !important; } .pd-main { margin-left: 0 !important; } }"
  ]);

  return el("div", {
    className: "pd-app",
    style: "background: #0f172a; min-height: 100vh;"
  }, [
    mobileStyle,
    overlay,
    sidebarEl,
    topHeader,
    notificationBar,
    mainArea
  ]);
}

function buildSidebar(project, currentView, onNavigate, onSave, savedProjects, onResume, isConnected, instanceUrl, onClose) {
  const projectName = project.projectIdentity?.projectName || "New Project";

  const navLinks = NAV_ITEMS.map(item => {
    const isActive = currentView === item.id ||
      (item.id === "module-setup" && currentView.startsWith("wizard-")) ||
      (item.id === "dashboard" && (currentView === "dashboard" || currentView === "overview"));

    return el("button", {
      className: `pd-nav__item ${isActive ? "pd-nav__item--active" : ""}`,
      onclick: () => {
        onNavigate(item.id);
        if (onClose) onClose();
      }
    }, [
      el("span", {
        className: `material-symbols-outlined pd-nav__icon ${isActive ? "text-[#6366f1]" : ""}`,
        text: item.icon
      }),
      el("span", { text: item.label })
    ]);
  });

  const resumeOptions = [el("option", { value: "", text: "Resume saved project..." })];
  savedProjects.forEach(item => {
    resumeOptions.push(el("option", { value: getProjectStoreRecordId(item), text: getProjectStoreRecordLabel(item) }));
  });

  return el("aside", {
    className: "pd-sidebar"
  }, [
    // Logo / Brand
    el("div", { className: "pd-sidebar__brand" }, [
      el("div", { className: "pd-sidebar__logo" }, [
        el("span", { className: "material-symbols-outlined pd-sidebar__logo-icon", text: "hub" })
      ]),
      el("span", { className: "pd-sidebar__title", text: "Odoo Setup Portal" })
    ]),
    el("p", { className: "pd-sidebar__subtitle", text: "v19 Implementation" }),
    
    // Project name
    el("div", { className: "mb-4 px-2" }, [
      el("div", {
        className: "flex items-center gap-2 px-3 py-2 rounded-lg",
        style: "background: rgba(255,255,255,0.05);"
      }, [
        el("span", { className: "material-symbols-outlined text-[16px] text-[#64748b]", text: "folder" }),
        el("span", {
          className: "text-xs font-semibold text-[#94a3b8] truncate",
          text: projectName
        })
      ])
    ]),
    
    // Navigation
    el("nav", { className: "pd-nav" }, navLinks),
    
    // Bottom section
    el("div", { className: "pd-sidebar__actions" }, [
      el("button", {
        className: "pd-btn pd-btn--primary pd-btn--full",
        onclick: onSave
      }, [
        el("span", { className: "material-symbols-outlined text-[18px]", text: "save" }),
        el("span", { text: "Save Progress" })
      ]),
      savedProjects.length
        ? el("select", {
            className: "pd-input text-xs",
            style: "height: auto; padding: 8px;",
            onchange: (e) => {
              if (e.target.value) {
                onResume(e.target.value);
                e.target.value = "";
              }
            }
          }, resumeOptions)
        : null,
      // Connection status footer
      el("div", {
        className: "flex items-center gap-2 px-3 py-2 rounded-lg",
        style: `background: ${isConnected ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}; border: 1px solid ${isConnected ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"};`
      }, [
        el("span", {
          className: "w-2 h-2 rounded-full",
          style: `background: ${isConnected ? "#22c55e" : "#ef4444"}; box-shadow: 0 0 6px ${isConnected ? "#22c55e" : "#ef4444"};`
        }),
        el("span", {
          className: "text-[11px] font-medium truncate",
          style: `color: ${isConnected ? "#86efac" : "#fca5a5"};`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected"
        })
      ])
    ])
  ]);
}
