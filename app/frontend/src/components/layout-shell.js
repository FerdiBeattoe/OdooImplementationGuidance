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

  // ── Top Header ───────────────────────────────────────────
  const currentNavItem = NAV_ITEMS.find(n => currentView.startsWith(n.id) || currentView === n.id);
  const sectionTitle = currentNavItem?.label || "Dashboard";

  const topHeader = el("header", {
    className: "fixed top-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex items-center justify-between px-6 py-3",
    style: "left: 256px;"
  }, [
    // Left: hamburger (mobile) + section title
    el("div", { className: "flex items-center gap-4" }, [
      el("button", {
        className: "md:hidden p-2 rounded-lg hover:bg-surface-container transition-colors",
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
        className: "font-headline text-lg font-bold text-on-surface tracking-tight",
        text: sectionTitle
      })
    ]),
    // Right: connection status + sync button
    el("div", { className: "flex items-center gap-3" }, [
      // Connection status indicator
      el("div", { className: "hidden sm:flex items-center gap-2" }, [
        el("span", {
          className: `w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-error"}`,
          title: isConnected ? "Connected" : "Not connected"
        }),
        el("span", {
          className: `text-xs font-medium ${isConnected ? "text-green-700" : "text-error"}`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected"
        })
      ]),
      // Sync to Odoo button
      isConnected
        ? el("button", {
            className: "flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all",
            onclick: onSave
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "sync" }),
            el("span", { className: "hidden sm:inline", text: "Sync to Odoo" })
          ])
        : el("button", {
            className: "flex items-center gap-2 bg-surface-container-high text-on-surface-variant text-sm font-medium px-4 py-2 rounded-lg hover:bg-surface-container-highest transition-all",
            onclick: () => onNavigate("dashboard")
          }, [
            el("span", { className: "material-symbols-outlined text-[18px]", text: "link" }),
            el("span", { className: "hidden sm:inline", text: "Connect Odoo" })
          ]),
      el("div", { className: "w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold" }, [
        el("span", { text: companyName ? companyName.substring(0, 2).toUpperCase() : "US" })
      ])
    ])
  ]);

  // ── Notifications ────────────────────────────────────────
  const notificationBar = notifications?.length
    ? el("div", { className: "fixed top-16 right-4 z-50 space-y-2 max-w-sm" },
        notifications.map(n => el("div", {
          className: `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            n.type === "error" ? "bg-error-container text-on-error-container" :
            n.type === "success" ? "bg-secondary-container text-on-secondary-container" :
            "bg-surface-container-lowest text-on-surface border border-outline-variant/30"
          }`
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
    style: "margin-left: 256px;"
  }, [content]);

  // ── Responsive: override left on small screens ─────────────
  const mobileStyle = el("style", {}, [
    "@media (max-width: 767px) { header[style] { left: 0 !important; } main[style] { margin-left: 0 !important; } }"
  ]);

  return el("div", { className: "app-wrapper bg-background font-body text-on-surface" }, [
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
      className: `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium tracking-wide transition-colors duration-150 text-left ${
        isActive
          ? "bg-primary-fixed/50 text-primary font-semibold"
          : "text-slate-600 hover:bg-slate-200/70"
      }`,
      onclick: () => {
        onNavigate(item.id);
        if (onClose) onClose();
      }
    }, [
      el("span", {
        className: `material-symbols-outlined text-[20px] ${isActive ? "text-primary" : "text-slate-500"}`,
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
    className: "sidebar h-screen w-64 fixed left-0 top-0 z-40 bg-slate-50 border-r border-slate-200/70 flex flex-col overflow-y-auto"
  }, [
    // Logo / Project Name
    el("div", { className: "px-5 py-5 border-b border-slate-200/70" }, [
      el("div", { className: "flex items-center gap-3 mb-1" }, [
        el("div", { className: "w-8 h-8 rounded-lg primary-gradient flex items-center justify-center flex-shrink-0" }, [
          el("span", { className: "material-symbols-outlined text-white text-[18px]", text: "hub" })
        ]),
        el("span", { className: "font-headline font-extrabold text-on-surface text-sm tracking-tight leading-tight", text: "Odoo Setup Portal" })
      ]),
      el("p", { className: "text-[11px] uppercase tracking-widest text-on-surface-variant/60 font-semibold ml-11", text: "v19 Implementation" })
    ]),
    // Project name pill
    el("div", { className: "px-4 py-3" }, [
      el("div", { className: "bg-surface-container-low rounded-lg px-3 py-2 flex items-center gap-2" }, [
        el("span", { className: "material-symbols-outlined text-[16px] text-on-surface-variant", text: "folder" }),
        el("span", { className: "text-[12px] font-semibold text-on-surface truncate", text: projectName })
      ])
    ]),
    // Navigation
    el("nav", { className: "flex-1 px-3 space-y-0.5" }, navLinks),
    // Bottom section
    el("div", { className: "px-4 py-4 border-t border-slate-200/70 space-y-3" }, [
      // Save button
      el("button", {
        className: "w-full flex items-center justify-center gap-2 primary-gradient text-on-primary py-2.5 rounded-xl font-semibold text-sm shadow-sm active:scale-95 transition-all",
        onclick: onSave
      }, [
        el("span", { className: "material-symbols-outlined text-[18px]", text: "save" }),
        el("span", { text: "Save Progress" })
      ]),
      // Resume dropdown
      savedProjects.length
        ? el("select", {
            className: "w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-2 py-2 text-xs text-on-surface-variant font-medium",
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
        className: `flex items-center gap-2 px-3 py-2 rounded-lg ${isConnected ? "bg-green-50" : "bg-error-container/30"}`
      }, [
        el("span", { className: `w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? "bg-green-500" : "bg-error"}` }),
        el("span", {
          className: `text-[11px] font-medium truncate ${isConnected ? "text-green-700" : "text-on-error-container"}`,
          text: isConnected ? (instanceUrl || "Connected") : "Not connected",
          title: isConnected ? instanceUrl : "No Odoo instance connected"
        })
      ])
    ])
  ]);
}
