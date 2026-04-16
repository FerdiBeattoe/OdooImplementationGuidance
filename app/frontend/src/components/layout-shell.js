import { getProjectStoreRecordId, getProjectStoreRecordLabel } from "/shared/index.js";
import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { startTour, resetTour } from "../components/onboarding-tour.js";
import { renderThemeToggle } from "../components/theme-toggle.js";

const PRIMARY_NAV = [
  { id: "dashboard",         label: "Dashboard" },
  { id: "module-setup",      label: "Module setup" },
  { id: "pipeline",          label: "Pipeline" },
  { id: "pre-commit-report", label: "Pre-commit" }
];

const SECONDARY_NAV = [
  { id: "implementation-roadmap", label: "Roadmap" },
  { id: "data-import",            label: "Data import" },
  { id: "knowledge-base",         label: "Knowledge base" },
  { id: "analytics",              label: "Analytics" },
  { id: "audit-log",              label: "Audit log" }
];

const NAV_LINK_BASE =
  "background: none; border: none; cursor: pointer; font-family: var(--font-body); " +
  "font-size: var(--fs-small); padding: 8px 4px; transition: color var(--dur-base) var(--ease);";

const MENU_PANEL =
  "position: absolute; top: calc(100% + 6px); background: var(--color-surface); " +
  "border: 1px solid var(--color-line); border-radius: var(--radius-panel); " +
  "box-shadow: var(--shadow-menu); padding: var(--space-1); min-width: 200px; " +
  "z-index: 60; display: flex; flex-direction: column; gap: 2px;";

const MENU_ITEM =
  "background: none; border: none; cursor: pointer; font-family: var(--font-body); " +
  "font-size: var(--fs-small); color: var(--color-ink); padding: var(--space-2) var(--space-3); " +
  "border-radius: var(--radius-chip); text-align: left; display: flex; align-items: center; " +
  "gap: var(--space-2); transition: background var(--dur-fast) var(--ease); width: 100%;";

const MENU_SECTION_LABEL =
  "font-size: var(--fs-tiny); text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); " +
  "font-weight: 600; color: var(--color-muted); padding: var(--space-2) var(--space-3) var(--space-1);";

const MENU_DIVIDER = "height: 1px; background: var(--color-line); margin: var(--space-1) 0;";

function isViewActive(currentView, navId) {
  if (currentView === navId) return true;
  if (navId === "module-setup" && currentView.startsWith("wizard-")) return true;
  if (navId === "dashboard" && (currentView === "overview")) return true;
  if (navId === "pipeline" && currentView.startsWith("pipeline")) return true;
  if (navId === "pre-commit-report" && currentView === "pre-commit-report") return true;
  return false;
}

function navLink(item, currentView, onClick) {
  const active = isViewActive(currentView, item.id);
  const btn = el("button", {
    type: "button",
    style:
      NAV_LINK_BASE +
      ` color: ${active ? "var(--color-ink)" : "var(--color-subtle)"};` +
      ` font-weight: ${active ? "500" : "400"};`,
    onclick: onClick
  }, [
    el("span", { text: item.label })
  ]);
  if (!active) {
    btn.onmouseenter = () => { btn.style.color = "var(--color-ink)"; };
    btn.onmouseleave = () => { btn.style.color = "var(--color-subtle)"; };
  }
  return btn;
}

function menuItem(label, iconName, onClick) {
  const btn = el("button", { type: "button", style: MENU_ITEM, onclick: onClick });
  if (iconName) {
    const ic = lucideIcon(iconName, 14);
    ic.style.color = "var(--color-subtle)";
    btn.append(ic);
  }
  btn.append(el("span", { text: label }));
  btn.onmouseenter = () => { btn.style.background = "var(--color-line-soft)"; };
  btn.onmouseleave = () => { btn.style.background = "transparent"; };
  return btn;
}

function buildMoreDropdown({ currentView, onNavigate }) {
  const wrapper = el("div", { style: "position: relative;" });

  const trigger = el("button", {
    type: "button",
    style:
      NAV_LINK_BASE +
      " color: var(--color-subtle); display: inline-flex; align-items: center; gap: 4px;",
    "aria-haspopup": "true",
    "aria-expanded": "false"
  }, [
    el("span", { text: "More" }),
    (() => {
      const ic = lucideIcon("chevron-down", 14);
      ic.style.color = "currentColor";
      return ic;
    })()
  ]);
  trigger.onmouseenter = () => { trigger.style.color = "var(--color-ink)"; };
  trigger.onmouseleave = () => { trigger.style.color = "var(--color-subtle)"; };

  let open = false;
  let panel = null;

  function close() {
    if (panel) {
      panel.remove();
      panel = null;
    }
    open = false;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClick, true);
  }

  function onDocClick(event) {
    if (wrapper.contains(event.target)) return;
    close();
  }

  function openMenu() {
    panel = el("div", { style: MENU_PANEL });
    SECONDARY_NAV.forEach((item) => {
      panel.append(menuItem(item.label, null, () => {
        close();
        onNavigate(item.id);
      }));
    });
    wrapper.append(panel);
    open = true;
    trigger.setAttribute("aria-expanded", "true");
    setTimeout(() => {
      document.addEventListener("click", onDocClick, true);
    }, 0);
  }

  trigger.onclick = () => {
    if (open) close(); else openMenu();
  };

  wrapper.append(trigger);
  return wrapper;
}

function buildSettingsCog({
  project,
  savedProjects,
  onNavigate,
  onSave,
  onResume,
  onDisconnect
}) {
  const wrapper = el("div", { style: "position: relative;" });

  const trigger = el("button", {
    type: "button",
    "aria-label": "Settings",
    "aria-haspopup": "true",
    style:
      "width: 34px; height: 34px; border-radius: var(--radius-pill); " +
      "background: var(--color-surface); border: 1px solid var(--color-line); " +
      "cursor: pointer; display: inline-flex; align-items: center; justify-content: center; " +
      "color: var(--color-subtle); transition: all var(--dur-base) var(--ease);"
  });
  const cogIcon = lucideIcon("settings", 16);
  cogIcon.style.color = "currentColor";
  trigger.append(cogIcon);
  trigger.onmouseenter = () => { trigger.style.color = "var(--color-ink)"; };
  trigger.onmouseleave = () => { trigger.style.color = "var(--color-subtle)"; };

  let open = false;
  let panel = null;

  function close() {
    if (panel) {
      panel.remove();
      panel = null;
    }
    open = false;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClick, true);
  }

  function onDocClick(event) {
    if (wrapper.contains(event.target)) return;
    close();
  }

  function openMenu() {
    panel = el("div", {
      style: MENU_PANEL + " right: 0; min-width: 260px;"
    });

    // Appearance section
    panel.append(el("div", { style: MENU_SECTION_LABEL, text: "Appearance" }));
    const themeWrapper = el("div", {
      style: "padding: 4px var(--space-3) var(--space-2);"
    }, [renderThemeToggle()]);
    panel.append(themeWrapper);

    panel.append(el("div", { style: MENU_DIVIDER }));

    // Project section
    panel.append(el("div", { style: MENU_SECTION_LABEL, text: "Project" }));
    panel.append(menuItem("Connection", "link", () => { close(); onNavigate("connection-wizard"); }));
    panel.append(menuItem("Team", "users", () => { close(); onNavigate("team"); }));
    panel.append(menuItem("Licence", "badge-check", () => { close(); onNavigate("licence"); }));
    if (typeof onSave === "function") {
      panel.append(menuItem("Save progress", "save", () => { close(); onSave(); }));
    }
    if (savedProjects && savedProjects.length > 0) {
      const resumeRow = el("div", {
        style: "padding: var(--space-2) var(--space-3);"
      });
      const select = el("select", {
        style:
          "width: 100%; font-family: var(--font-body); font-size: var(--fs-small); " +
          "color: var(--color-ink); background: var(--color-surface); " +
          "border: 1px solid var(--color-line); border-radius: var(--radius-input); " +
          "padding: 6px 8px; outline: none;",
        onchange: (event) => {
          if (event.target.value) {
            const val = event.target.value;
            event.target.value = "";
            close();
            onResume(val);
          }
        }
      }, [el("option", { value: "", text: "Resume saved project..." })]);
      savedProjects.forEach((item) => {
        select.append(el("option", {
          value: getProjectStoreRecordId(item),
          text: getProjectStoreRecordLabel(item)
        }));
      });
      resumeRow.append(select);
      panel.append(resumeRow);
    }

    panel.append(el("div", { style: MENU_DIVIDER }));

    // Account section
    panel.append(el("div", { style: MENU_SECTION_LABEL, text: "Account" }));
    panel.append(menuItem("Profile", "user", () => { close(); onNavigate("profile"); }));
    panel.append(menuItem("Take the tour", "help-circle", () => {
      close();
      resetTour();
      startTour();
    }));
    if (typeof onDisconnect === "function") {
      panel.append(menuItem("Sign out", "log-out", () => { close(); onDisconnect(); }));
    }

    wrapper.append(panel);
    open = true;
    trigger.setAttribute("aria-expanded", "true");
    setTimeout(() => {
      document.addEventListener("click", onDocClick, true);
    }, 0);
  }

  trigger.onclick = () => {
    if (open) close(); else openMenu();
  };

  wrapper.append(trigger);
  return wrapper;
}

function buildInstanceBadge({ isConnected, database, uid }) {
  if (!isConnected) {
    return el("div", {
      style:
        "display: inline-flex; align-items: center; gap: 6px; " +
        "padding: 5px 12px; border-radius: var(--radius-pill); " +
        "background: var(--color-chip-review-bg); color: var(--color-chip-review-fg); " +
        "font-size: var(--fs-micro); font-weight: 500; font-family: var(--font-mono); " +
        "border: 1px solid var(--color-line);"
    }, [
      el("span", { text: "Not connected" })
    ]);
  }

  const label = database
    ? (uid != null ? `${database} · uid ${uid}` : database)
    : "Connected";

  return el("div", {
    style:
      "display: inline-flex; align-items: center; gap: 6px; " +
      "padding: 5px 12px; border-radius: var(--radius-pill); " +
      "background: var(--color-chip-bg); color: var(--color-chip-fg); " +
      "font-size: var(--fs-micro); font-weight: 500; font-family: var(--font-mono); " +
      "border: 1px solid var(--color-line);"
  }, [
    el("span", {
      style: "width: 6px; height: 6px; border-radius: 50%; background: var(--color-ink);"
    }),
    el("span", { text: label })
  ]);
}

function buildMobileNav({ currentView, onNavigate }) {
  // Hamburger dropdown for primary nav on mobile (<768px)
  const wrapper = el("div", {
    style: "position: relative;",
    "data-mobile-only": "true"
  });

  const trigger = el("button", {
    type: "button",
    "aria-label": "Menu",
    style:
      "width: 34px; height: 34px; border-radius: var(--radius-pill); " +
      "background: var(--color-surface); border: 1px solid var(--color-line); " +
      "cursor: pointer; display: inline-flex; align-items: center; justify-content: center; " +
      "color: var(--color-subtle);"
  });
  const hamburgerIcon = lucideIcon("menu", 16);
  hamburgerIcon.style.color = "currentColor";
  trigger.append(hamburgerIcon);

  let open = false;
  let panel = null;

  function close() {
    if (panel) {
      panel.remove();
      panel = null;
    }
    open = false;
    document.removeEventListener("click", onDocClick, true);
  }

  function onDocClick(event) {
    if (wrapper.contains(event.target)) return;
    close();
  }

  function openMenu() {
    panel = el("div", { style: MENU_PANEL + " left: 0;" });
    PRIMARY_NAV.forEach((item) => {
      panel.append(menuItem(item.label, null, () => {
        close();
        onNavigate(item.id);
      }));
    });
    wrapper.append(panel);
    open = true;
    setTimeout(() => {
      document.addEventListener("click", onDocClick, true);
    }, 0);
  }

  trigger.onclick = () => {
    if (open) close(); else openMenu();
  };

  wrapper.append(trigger);
  return wrapper;
}

function buildTopNav({
  project,
  savedProjects,
  currentView,
  isConnected,
  database,
  uid,
  onNavigate,
  onSave,
  onResume,
  onDisconnect
}) {
  const projectName = project.projectIdentity?.projectName || "Project Odoo";

  const brand = el("div", {
    style:
      "display: inline-flex; align-items: center; gap: var(--space-2); cursor: pointer;",
    onclick: () => onNavigate("dashboard")
  }, [
    el("img", {
      src: "/assets/logo-project-odoo.png",
      alt: "",
      style: "height: 26px; width: auto; object-fit: contain; display: block;"
    }),
    el("span", {
      style:
        "font-family: var(--font-body); font-size: 14px; font-weight: 600; " +
        "letter-spacing: var(--track-tight); color: var(--color-ink);",
      text: "Project Odoo"
    })
  ]);

  // Primary nav links, desktop only (hidden via data-desktop-only on small screens)
  const desktopLinks = el("nav", {
    style:
      "display: flex; align-items: center; gap: var(--space-5);",
    "data-desktop-only": "true",
    "aria-label": "Primary"
  },
    PRIMARY_NAV.map((item) => navLink(item, currentView, () => onNavigate(item.id)))
      .concat([buildMoreDropdown({ currentView, onNavigate })])
  );

  const right = el("div", {
    style: "display: flex; align-items: center; gap: var(--space-3);"
  }, [
    buildInstanceBadge({ isConnected, database, uid }),
    buildSettingsCog({
      project,
      savedProjects,
      onNavigate,
      onSave,
      onResume,
      onDisconnect
    })
  ]);

  const mobileNav = buildMobileNav({ currentView, onNavigate });

  const inner = el("div", {
    style:
      "max-width: 1440px; margin: 0 auto; height: 60px; " +
      "padding: 0 var(--space-6); display: flex; align-items: center; gap: var(--space-5);"
  }, [
    mobileNav,
    brand,
    el("div", {
      style: "flex: 1; display: flex; justify-content: center;",
      "data-desktop-only": "true"
    }, [desktopLinks]),
    el("div", { style: "flex: 1;", "data-mobile-spacer": "true" }),
    right
  ]);

  return el("header", {
    style:
      "position: sticky; top: 0; z-index: 50; " +
      "background: var(--color-surface); border-bottom: 1px solid var(--color-line); " +
      "font-family: var(--font-body);"
  }, [inner]);
}

function buildNotificationBar(notifications) {
  if (!notifications || notifications.length === 0) return null;

  return el("div", {
    style:
      "position: fixed; top: 76px; right: var(--space-4); z-index: 70; " +
      "display: flex; flex-direction: column; gap: var(--space-2); max-width: 380px;"
  }, notifications.map((n) => {
    const isError = n.type === "error";
    const isSuccess = n.type === "success";
    const panelStyle =
      "background: var(--color-surface); border: 1px solid var(--color-line); " +
      "border-radius: var(--radius-panel); box-shadow: var(--shadow-menu); " +
      "padding: var(--space-3) var(--space-4); display: flex; align-items: flex-start; " +
      "gap: var(--space-3); font-family: var(--font-body); font-size: var(--fs-small); " +
      "color: var(--color-ink);" +
      (isError
        ? " border-left: 2px solid var(--color-chip-review-fg);"
        : isSuccess
          ? " border-left: 2px solid; border-image: var(--accent-grad) 1;"
          : "");

    const iconName = isError ? "alert-circle" : isSuccess ? "check-circle" : "info";
    const ic = lucideIcon(iconName, 16);
    ic.style.color = isError ? "var(--color-chip-review-fg)" : "var(--color-subtle)";
    ic.style.flexShrink = "0";
    ic.style.marginTop = "1px";

    return el("div", { style: panelStyle }, [
      ic,
      el("span", { style: "line-height: var(--lh-snug);", text: n.message })
    ]);
  }));
}

function ensureResponsiveStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("layout-shell-responsive")) return;
  const style = document.createElement("style");
  style.id = "layout-shell-responsive";
  style.textContent = [
    "[data-desktop-only='true'] { display: flex; }",
    "[data-mobile-only='true'] { display: none; }",
    "[data-mobile-spacer='true'] { display: none; }",
    "@media (max-width: 768px) {",
    "  [data-desktop-only='true'] { display: none !important; }",
    "  [data-mobile-only='true'] { display: inline-flex !important; }",
    "  [data-mobile-spacer='true'] { display: block !important; }",
    "}"
  ].join("\n");
  document.head.appendChild(style);
}

export function renderLayoutShell({
  project,
  content,
  notifications,
  onNavigate,
  onSave,
  onResume,
  onConnect,
  onDisconnect
}) {
  ensureResponsiveStyles();

  const savedProjects = (project.savedProjects || []).filter((item) =>
    getProjectStoreRecordId(item)
  );
  const currentView = project.workflowState?.currentView || "dashboard";
  const connectionStatus = project.connectionState?.status || "disconnected";
  const isConnected = connectionStatus.startsWith("connected");
  const database = project.connectionState?.environmentIdentity?.database || null;
  const uid = project.connectionState?.uid ?? null;

  const topNav = buildTopNav({
    project,
    savedProjects,
    currentView,
    isConnected,
    database,
    uid,
    onNavigate,
    onSave,
    onResume,
    onDisconnect
  });

  const notificationBar = buildNotificationBar(notifications);

  const mainArea = el("main", {
    id: "main-content",
    style: "display: block; min-height: calc(100vh - 60px);"
  }, [content]);

  return el("div", {
    style:
      "min-height: 100vh; background: var(--color-canvas-base); " +
      "color: var(--color-ink); font-family: var(--font-body);"
  }, [topNav, notificationBar, mainArea]);
}
