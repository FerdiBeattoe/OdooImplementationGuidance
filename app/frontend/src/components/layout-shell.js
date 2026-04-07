import { getProjectStoreRecordId, getProjectStoreRecordLabel, renderConnectionCapabilityLabel } from "/shared/index.js";
import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { startTour, resetTour } from "../components/onboarding-tour.js";

const NAV_ITEMS = [
  { id: "new-project",          icon: "plus-circle",        label: "New Project" },
  { id: "dashboard",            icon: "layout-dashboard",   label: "Dashboard" },
  { id: "implementation-roadmap", icon: "map",              label: "Implementation Roadmap" },
  { id: "module-setup",         icon: "settings",           label: "Module Setup" },
  { id: "data-import",          icon: "upload",             label: "Data Import" },
  { id: "knowledge-base",       icon: "book-open",          label: "Knowledge Base" },
  { id: "analytics",            icon: "bar-chart-2",        label: "Analytics" },
  { id: "team",                 icon: "Users",              label: "Team" },
  { id: "pipeline",             icon: "git-branch",         label: "Pipeline" }
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
    className: "ee-header",
    style: "background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 0 24px; height: 56px;"
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
        (() => { const ic = lucideIcon("menu", 20); ic.style.color = "#80747a"; return ic; })()
      ]),
      el("h1", {
        className: "ee-header__title",
        style: "font-size: 18px; font-weight: 600; color: #0c1a30; font-family: Inter, sans-serif;",
        text: sectionTitle
      })
    ]),
    el("div", { className: "flex items-center gap-3" }, [
      el("div", {
        className: "hidden sm:flex items-center gap-2",
        style: `background: ${isConnected ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}; border: 1px solid ${isConnected ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}; color: ${isConnected ? "#065f46" : "#dc2626"}; border-radius: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; padding: 3px 10px;`
      }, [
        el("span", {
          className: "w-2 h-2",
          style: `background: ${isConnected ? "#059669" : "#dc2626"}; border-radius: 50%;`
        }),
        el("span", {
          style: `text-transform: uppercase; color: ${isConnected ? "#065f46" : "#dc2626"};`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected"
        })
      ]),
      isConnected
        ? el("button", {
            className: "ee-btn",
            style: "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-weight: 600; font-size: 13px; padding: 8px 16px; cursor: pointer;",
            onclick: onSave
          }, [
            lucideIcon("refresh-cw", 16),
            el("span", { className: "hidden sm:inline", text: "Sync to Odoo" })
          ])
        : el("button", {
            className: "ee-btn",
            style: "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-weight: 600; font-size: 13px; padding: 8px 16px; cursor: pointer;",
            onclick: () => onNavigate("connection-wizard")
          }, [
            lucideIcon("link", 16),
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
          lucideIcon(n.type === "error" ? "alert-circle" : n.type === "success" ? "check-circle" : "info", 18),
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

    const navBaseStyle = "border-radius: 6px; padding: 10px 12px; font-size: 14px; font-family: Inter, sans-serif; display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; cursor: pointer; border: none; outline: none;";
    const navStyle = isActive
      ? `${navBaseStyle} background: rgba(245,158,11,0.08); border-left: 2px solid #f59e0b; color: #0c1a30; font-weight: 600;`
      : `${navBaseStyle} background: transparent; border-left: 2px solid transparent; color: #64748b; font-weight: 400;`;

    const btn = el("button", {
      className: `ee-nav__item ${isActive ? "ee-nav__item--active" : ""}`,
      style: navStyle,
      onclick: () => {
        onNavigate(item.id);
        if (onClose) onClose();
      }
    }, [
      (() => { const ic = lucideIcon(item.icon, 18); ic.style.color = isActive ? "#f59e0b" : "#64748b"; ic.style.flexShrink = "0"; return ic; })(),
      item.id === "pipeline"
        ? el("span", { style: "display: flex; flex-direction: column;" }, [
            el("span", { text: item.label }),
            el("span", { style: "font-size: 11px; font-weight: 400; color: #94a3b8;", text: "Governed writes & checkpoints" })
          ])
        : el("span", { text: item.label })
    ]);

    if (!isActive) {
      btn.onmouseenter = () => { btn.style.background = "rgba(12,26,48,0.04)"; btn.style.color = "#0c1a30"; };
      btn.onmouseleave = () => { btn.style.background = "transparent"; btn.style.color = "#64748b"; };
    }

    return btn;
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
      el("img", {
        src: "/assets/logo-project-odoo.png",
        alt: "Project Odoo",
        style: "height: 48px; width: auto; max-width: 160px; object-fit: contain; display: block;"
      })
    ]),
    
    // Project name
    el("div", { style: "margin: 16px 8px;" }, [
      el("div", {
        style: "display: flex; align-items: center; gap: 8px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;"
      }, [
        (() => { const ic = lucideIcon("folder", 16); ic.style.color = "#0c1a30"; return ic; })(),
        el("span", {
          style: "font-size: 13px; font-weight: 500; color: #0c1a30; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;",
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
        style: "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-weight: 600; font-size: 13px; padding: 8px 14px; width: 100%; cursor: pointer;",
        onclick: onSave
      }, [
        lucideIcon("save", 16),
        el("span", { text: "Save Progress" })
      ]),
      el("button", {
        style: "background: none; border: none; color: #94a3b8; font-size: 12px; cursor: pointer; padding: 4px 0; text-align: left; width: 100%; font-family: Inter, sans-serif; display: flex; align-items: center; gap: 6px;",
        onclick: () => { resetTour(); startTour(); }
      }, [
        lucideIcon("help-circle", 14),
        el("span", {}, "Take the tour")
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
        style: `display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: ${isConnected ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}; border-left: 3px solid ${isConnected ? "#059669" : "#dc2626"}; border-radius: 6px;`
      }, [
        el("span", {
          className: "w-2 h-2",
          style: `background: ${isConnected ? "#059669" : "#dc2626"};`
        }),
        el("span", {
          style: `font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${isConnected ? "#065f46" : "#dc2626"};`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected"
        })
      ])
    ])
  ]);
}
