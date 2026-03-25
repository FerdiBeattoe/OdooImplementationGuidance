import { getProjectStoreRecordId, getProjectStoreRecordLabel, renderConnectionCapabilityLabel } from "/shared/index.js";
import { el } from "../lib/dom.js";

const NAV_ITEMS = [
  { id: "dashboard",              icon: "dashboard",          label: "Dashboard" },
  { id: "implementation-roadmap", icon: "route",              label: "Implementation Roadmap" },
  { id: "module-setup",           icon: "tune",               label: "Module Setup" },
  { id: "data-import",            icon: "upload_file",        label: "Data Import" },
  { id: "knowledge-base",         icon: "menu_book",          label: "Knowledge Base" },
  { id: "analytics",              icon: "bar_chart",          label: "Analytics" }
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
    sidebarEl.classList.remove("sidebar--open");
    overlay.classList.add("hidden");
  });

  const overlay = el("div", {
    className: "fixed inset-0 bg-black/30 z-30 hidden md:hidden",
    onclick: () => {
      sidebarOpen = false;
      sidebarEl.classList.remove("sidebar--open");
      overlay.classList.add("hidden");
    }
  });

  // ── Top Header — clean white surface, shadow-sm ───────────
  const currentNavItem = NAV_ITEMS.find(n => currentView.startsWith(n.id) || currentView === n.id);
  const sectionTitle = currentNavItem?.label || "Dashboard";

  const topHeader = el("header", {
    className: "fixed top-0 right-0 z-50 flex items-center justify-between px-6 py-3",
    style: "left: 256px; background: var(--color-surface-container-lowest); box-shadow: var(--shadow-sm);"
  }, [
    el("div", { className: "flex items-center gap-4" }, [
      el("button", {
        className: "md:hidden p-2 hover:bg-surface-container transition-colors",
        onclick: () => {
          sidebarOpen = !sidebarOpen;
          sidebarEl.classList.toggle("sidebar--open", sidebarOpen);
          overlay.classList.toggle("hidden", !sidebarOpen);
        },
        "aria-label": "Toggle sidebar"
      }, [
        el("span", { className: "material-symbols-outlined text-on-surface-variant", text: "menu" })
      ]),
      el("h1", {
        className: "font-headline text-lg font-bold text-on-surface",
        style: "letter-spacing: var(--ls-snug);",
        text: sectionTitle
      })
    ]),
    el("div", { className: "flex items-center gap-3" }, [
      el("div", { className: "hidden sm:flex items-center gap-2" }, [
        el("span", {
          className: `w-2 h-2 flex-shrink-0 ${isConnected ? "bg-green-500" : ""}`,
          style: isConnected ? "" : "background: var(--color-error);",
          title: isConnected ? "Connected" : "Not connected"
        }),
        el("span", {
          className: "text-xs font-medium",
          style: isConnected ? "color: var(--color-success);" : "color: var(--color-error);",
          text: isConnected ? (instanceUrl || "Connected") : "Not connected"
        })
      ]),
      isConnected
        ? el("button", {
            className: "flex items-center gap-2 text-sm font-semibold px-4 py-2",
            style: "background: var(--color-primary); color: var(--color-on-primary);",
            onclick: onSave
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "sync" }),
            el("span", { className: "hidden sm:inline", text: "Sync to Odoo" })
          ])
        : el("button", {
            className: "flex items-center gap-2 text-sm font-semibold px-4 py-2",
            style: "background: var(--color-primary); color: var(--color-on-primary);",
            onclick: () => onNavigate("dashboard")
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "link" }),
            el("span", { className: "hidden sm:inline", text: "Connect Odoo" })
          ]),
      el("div", {
        className: "w-8 h-8 flex items-center justify-center text-xs font-bold",
        style: "background: var(--color-primary); color: var(--color-on-primary);"
      }, [
        el("span", { text: companyName ? companyName.substring(0, 2).toUpperCase() : "US" })
      ])
    ])
  ]);

  // ── Notifications ────────────────────────────────────────
  const notificationBar = notifications?.length
    ? el("div", { className: "fixed top-16 right-4 z-50 space-y-2 max-w-sm" },
        notifications.map(n => el("div", {
          className: "flex items-center gap-3 px-4 py-3 text-sm font-medium",
          style: n.type === "error"
            ? "background: var(--color-error-container); color: var(--color-on-error-container); box-shadow: var(--shadow-md);"
            : n.type === "success"
              ? "background: var(--color-secondary-container); color: var(--color-on-secondary-container); box-shadow: var(--shadow-md);"
              : "background: var(--color-surface-container-lowest); color: var(--color-on-surface); box-shadow: var(--shadow-md);"
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
    className: "min-h-screen pt-16 p-6 md:p-8",
    style: "margin-left: 256px; background: var(--color-background);"
  }, [content]);

  // ── Responsive: override left on small screens ─────────────
  const mobileStyle = el("style", {}, [
    "@media (max-width: 767px) { header[style] { left: 0 !important; } main[style] { margin-left: 0 !important; } }"
  ]);

  return el("div", {
    className: "app-wrapper font-body",
    style: "background: var(--color-background); color: var(--color-on-surface);"
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
      (item.id === "dashboard" && (currentView === "dashboard" || currentView === "overview" || currentView === "stages" || currentView === "domains" || currentView === "decisions" || currentView === "wizard-launcher"));

    return el("button", {
      className: "sidebar-nav__item" + (isActive ? " sidebar-nav__item--active" : ""),
      style: `width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 16px; border: none; cursor: pointer; text-align: left; font-size: 13px; font-weight: ${isActive ? "600" : "500"}; letter-spacing: 0.02em; transition: background 150ms ease; color: ${isActive ? "var(--color-primary-fixed-dim)" : "var(--color-inverse-on-surface)"}; background: ${isActive ? "var(--color-primary-subtle)" : "transparent"};`,
      onclick: () => {
        onNavigate(item.id);
        if (onClose) onClose();
      }
    }, [
      el("span", {
        className: "material-symbols-outlined",
        style: `font-size: 20px; color: ${isActive ? "var(--color-primary-fixed-dim)" : "var(--text-sidebar-muted)"};`,
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
    className: "sidebar",
    style: "height: 100vh; width: 256px; position: fixed; left: 0; top: 0; z-index: 40; display: flex; flex-direction: column; overflow-y: auto; background: var(--color-inverse-surface); color: var(--color-inverse-on-surface);"
  }, [
    // Logo / Brand
    el("div", { style: "padding: 24px 20px 16px;" }, [
      el("div", { style: "display: flex; align-items: center; gap: 12px; margin-bottom: 4px;" }, [
        el("div", {
          style: "width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--gradient-primary);"
        }, [
          el("span", { className: "material-symbols-outlined", style: "color: #fff; font-size: 18px;", text: "hub" })
        ]),
        el("span", {
          style: "font-family: var(--font-headline); font-weight: 800; color: #fff; font-size: 14px; letter-spacing: var(--ls-snug); line-height: 1.2;",
          text: "Odoo Setup Portal"
        })
      ]),
      el("p", {
        style: "font-size: 11px; text-transform: uppercase; letter-spacing: var(--ls-widest); color: var(--text-sidebar-muted); font-weight: 600; margin-left: 44px;",
        text: "v19 Implementation"
      })
    ]),
    // Project name
    el("div", { style: "padding: 0 16px 12px;" }, [
      el("div", {
        style: "background: var(--bg-sidebar-hover); padding: 8px 12px; display: flex; align-items: center; gap: 8px;"
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 16px; color: var(--text-sidebar-muted);", text: "folder" }),
        el("span", {
          style: "font-size: 12px; font-weight: 600; color: var(--color-inverse-on-surface); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
          text: projectName
        })
      ])
    ]),
    // Navigation
    el("nav", { style: "flex: 1; padding: 0 8px; display: flex; flex-direction: column; gap: 2px;" }, navLinks),
    // Bottom section
    el("div", { style: "padding: 16px; display: flex; flex-direction: column; gap: 12px;" }, [
      // Save button
      el("button", {
        style: "width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--gradient-primary); color: var(--color-on-primary); padding: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: transform 150ms ease;",
        onclick: onSave
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "save" }),
        el("span", { text: "Save Progress" })
      ]),
      // Resume dropdown
      savedProjects.length
        ? el("select", {
            style: "width: 100%; background: var(--bg-sidebar-hover); border: none; padding: 8px; font-size: 12px; color: var(--text-sidebar-muted); font-weight: 500;",
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
        style: `display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: ${isConnected ? "rgba(45, 106, 60, 0.15)" : "rgba(186, 26, 26, 0.15)"};`
      }, [
        el("span", {
          style: `width: 8px; height: 8px; flex-shrink: 0; background: ${isConnected ? "var(--color-success)" : "var(--color-error)"};`
        }),
        el("span", {
          style: `font-size: 11px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${isConnected ? "#a3d9b1" : "var(--color-danger-soft)"};`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected",
          title: isConnected ? instanceUrl : "No Odoo instance connected"
        })
      ])
    ])
  ]);
}
