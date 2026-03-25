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
  const isConnected = connectionStatus.startsWith("connected");
  const instanceUrl = project.connectionState?.environmentIdentity?.urlOrigin || null;
  const companyName = project.connectionState?.companyName || null;

  // ── Mobile hamburger state ────────────────────────────────
  let sidebarOpen = false;
  const sidebarEl = buildSidebar(project, currentView, onNavigate, onSave, savedProjects, onResume, isConnected, instanceUrl, () => {
    sidebarOpen = false;
    sidebarEl.classList.remove("ee-sidebar--open");
    overlay.classList.add("hidden");
  });

  const overlay = el("div", {
    className: "fixed inset-0 bg-black/30 z-30 hidden md:hidden",
    onclick: () => {
      sidebarOpen = false;
      sidebarEl.classList.remove("ee-sidebar--open");
      overlay.classList.add("hidden");
    }
  });

  // ── Top Header ─────────────────────────────────────────────
  const currentNavItem = NAV_ITEMS.find(n => currentView.startsWith(n.id) || currentView === n.id);
  const sectionTitle = currentNavItem?.label || "Dashboard";

  const topHeader = el("header", {
    className: "ee-header"
  }, [
    el("div", { className: "flex items-center gap-4" }, [
      el("button", {
        className: "md:hidden p-2 hover:bg-black/5 transition-colors",
        onclick: () => {
          sidebarOpen = !sidebarOpen;
          sidebarEl.classList.toggle("ee-sidebar--open", sidebarOpen);
          overlay.classList.toggle("hidden", !sidebarOpen);
        },
        "aria-label": "Toggle sidebar"
      }, [
        el("span", { className: "material-symbols-outlined text-[#80747a]", text: "menu" })
      ]),
      el("h1", {
        className: "ee-header__title",
        text: sectionTitle
      })
    ]),
    el("div", { className: "flex items-center gap-3" }, [
      el("div", { 
        className: "hidden sm:flex items-center gap-2 px-3 py-1.5",
        style: "background: var(--ee-surface-container); border: 1px solid var(--ee-outline-variant);"
      }, [
        el("span", {
          className: "w-2 h-2",
          style: `background: ${isConnected ? "var(--ee-success)" : "var(--ee-error)"};`
        }),
        el("span", {
          className: "text-xs font-medium",
          style: `color: ${isConnected ? "var(--ee-success)" : "var(--ee-error)"};`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected"
        })
      ]),
      isConnected
        ? el("button", {
            className: "ee-btn ee-btn--primary",
            onclick: onSave
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "sync" }),
            el("span", { className: "hidden sm:inline", text: "Sync to Odoo" })
          ])
        : el("button", {
            className: "ee-btn ee-btn--primary",
            onclick: () => onNavigate("connection-wizard")
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "link" }),
            el("span", { className: "hidden sm:inline", text: "Connect Odoo" })
          ]),
      el("div", {
        className: "w-9 h-9 flex items-center justify-center text-sm font-bold",
        style: "background: var(--ee-primary); color: white;"
      }, [
        el("span", { text: companyName ? companyName.substring(0, 2).toUpperCase() : "US" })
      ])
    ])
  ]);

  // ── Notifications ──────────────────────────────────────────
  const notificationBar = notifications?.length
    ? el("div", { className: "fixed top-20 right-4 z-50 space-y-2 max-w-sm" },
        notifications.map(n => el("div", {
          className: "flex items-center gap-3 px-4 py-3 text-sm font-medium",
          style: n.type === "error"
            ? "background: var(--ee-error-soft); color: var(--ee-error); border: 1px solid rgba(186, 26, 26, 0.2);"
            : n.type === "success"
              ? "background: var(--ee-success-soft); color: var(--ee-success); border: 1px solid rgba(45, 106, 60, 0.2);"
              : "background: var(--ee-surface-container); color: var(--ee-on-surface); border: 1px solid var(--ee-outline-variant);"
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
    className: "ee-main"
  }, [content]);

  // ── Responsive: override left on small screens ─────────────
  const mobileStyle = el("style", {}, [
    "@media (max-width: 768px) { .ee-header { left: 0 !important; } .ee-main { margin-left: 0 !important; } }"
  ]);

  return el("div", {
    className: "ee-app"
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
      className: `ee-nav__item ${isActive ? "ee-nav__item--active" : ""}`,
      onclick: () => {
        onNavigate(item.id);
        if (onClose) onClose();
      }
    }, [
      el("span", {
        className: `material-symbols-outlined ee-nav__icon`,
        style: isActive ? "color: var(--ee-primary);" : "",
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
    className: "ee-sidebar"
  }, [
    // Logo / Brand
    el("div", { className: "ee-sidebar__brand" }, [
      el("div", { className: "ee-sidebar__logo" }, [
        el("span", { className: "material-symbols-outlined ee-sidebar__logo-icon", text: "hub" })
      ]),
      el("span", { className: "ee-sidebar__title", text: "Odoo Setup Portal" })
    ]),
    el("p", { className: "ee-sidebar__subtitle", text: "v19 Implementation" }),
    
    // Project name
    el("div", { style: "margin: 16px 8px;" }, [
      el("div", {
        style: "display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(113, 75, 103, 0.06);"
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 16px; color: var(--ee-outline);", text: "folder" }),
        el("span", {
          style: "font-size: 12px; font-weight: 600; color: var(--ee-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;",
          text: projectName
        })
      ])
    ]),
    
    // Navigation
    el("nav", { className: "ee-nav" }, navLinks),
    
    // Bottom section
    el("div", { style: "padding: 16px; display: flex; flex-direction: column; gap: 12px;" }, [
      el("button", {
        className: "ee-btn ee-btn--primary ee-btn--full",
        style: "height: 44px;",
        onclick: onSave
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "save" }),
        el("span", { text: "Save Progress" })
      ]),
      savedProjects.length
        ? el("select", {
            className: "ee-input",
            style: "height: 36px; font-size: 12px;",
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
        style: `display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: ${isConnected ? "var(--ee-success-soft)" : "var(--ee-error-soft)"}; border-left: 3px solid ${isConnected ? "var(--ee-success)" : "var(--ee-error)"};`
      }, [
        el("span", {
          className: "w-2 h-2",
          style: `background: ${isConnected ? "var(--ee-success)" : "var(--ee-error)"};`
        }),
        el("span", {
          style: `font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${isConnected ? "var(--ee-success)" : "var(--ee-error)"};`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected"
        })
      ])
    ])
  ]);
}
