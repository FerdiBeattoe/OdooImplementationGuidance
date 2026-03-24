import { getProjectStoreRecordId, getProjectStoreRecordLabel, renderConnectionCapabilityLabel } from "/shared/index.js";
import { el } from "../lib/dom.js";

const NAV_ITEMS = [
  { id: "dashboard", icon: "dashboard", label: "Overview" },
  { id: "stages", icon: "route", label: "Timeline" },
  { id: "domains", icon: "tune", label: "Configuration" },
  { id: "decisions", icon: "health_metrics", label: "Project Health" }
];

export function renderLayoutShell({ project, content, notifications, onNavigate, onSave, onResume }) {
  const savedProjects = (project.savedProjects || []).filter((item) => getProjectStoreRecordId(item));
  const canOpenGovernedViews = savedProjects.some(
    (item) => getProjectStoreRecordId(item) === project.projectIdentity.projectId
  );
  
  const currentProjectName = project.projectIdentity.projectName || "New Project";
  const erpVersion = "Enterprise ERP v19";

  const topNav = el("nav", { className: "fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm dark:shadow-none" }, [
    el("div", { className: "flex items-center justify-between px-6 py-3 max-w-full mx-auto" }, [
      el("div", { className: "flex items-center gap-8" }, [
        el("span", { className: "text-xl font-bold tracking-tight text-plum-900 dark:text-plum-50 font-headline", text: "Odoo Implementation Portal" }),
        el("div", { className: "hidden md:flex items-center space-x-6 font-manrope text-sm font-medium" }, 
          NAV_ITEMS.map(item => el("a", {
            className: project.workflowState.currentView === item.id || (project.workflowState.currentView === "wizard-launcher" && item.id === "dashboard")
              ? "text-plum-700 dark:text-plum-300 border-b-2 border-plum-600 dark:border-plum-400 pb-1 transition-all active:scale-95 duration-200 cursor-pointer"
              : "text-slate-500 dark:text-slate-400 hover:text-plum-600 transition-all active:scale-95 duration-200 cursor-pointer",
            onclick: () => onNavigate(item.id),
            text: item.label
          }))
        )
      ]),
      el("div", { className: "flex items-center space-x-4" }, [
        el("button", { className: "p-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all rounded-full" }, [
          el("span", { className: "material-symbols-outlined text-on-surface-variant", text: "notifications" })
        ]),
        el("div", { className: "h-8 w-8 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center font-bold text-xs" }, [
          el("span", { text: "US" })
        ])
      ])
    ])
  ]);

  const resumeOptions = [el("option", { value: "", text: "Resume project..." })];
  savedProjects.forEach((item) => {
    resumeOptions.push(el("option", { value: getProjectStoreRecordId(item), text: getProjectStoreRecordLabel(item) }));
  });

  const sidebar = el("aside", { className: "h-screen w-64 fixed left-0 top-0 z-40 bg-slate-50 dark:bg-slate-900 flex flex-col p-4 space-y-2 pt-20 border-r border-slate-200" }, [
    el("div", { className: "px-4 py-6 mb-4" }, [
      el("h2", { className: "font-manrope font-extrabold text-plum-900 dark:text-plum-50 text-lg", text: currentProjectName }),
      el("p", { className: "text-[13px] tracking-wide text-slate-500 dark:text-slate-400", text: erpVersion })
    ]),
    el("nav", { className: "flex-1 space-y-1" }, 
      NAV_ITEMS.map(item => {
        const isActive = project.workflowState.currentView === item.id;
        const isDisabled = item.id !== "dashboard" && !canOpenGovernedViews;
        const btnClass = isActive 
          ? "flex items-center gap-3 bg-plum-50 dark:bg-plum-900/30 text-plum-700 dark:text-plum-300 font-semibold rounded-lg px-4 py-2 font-inter text-[13px] tracking-wide cursor-pointer w-full text-left"
          : "flex items-center gap-3 text-slate-600 dark:text-slate-400 px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors duration-150 font-inter text-[13px] tracking-wide cursor-pointer w-full text-left";
        return el("button", {
          className: btnClass + (isDisabled ? " opacity-50 cursor-not-allowed" : ""),
          onclick: () => { if (!isDisabled) onNavigate(item.id); },
          disabled: isDisabled ? "disabled" : null
        }, [
          el("span", { className: "material-symbols-outlined", text: item.icon }),
          el("span", { text: item.label })
        ]);
      })
    ),
    el("div", { className: "pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4" }, [
      el("button", { 
        className: "w-full bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl py-2.5 px-4 font-semibold text-sm mb-2 shadow-sm active:scale-95 transition-all text-center",
        onclick: onSave 
      }, [
        el("span", { text: "Save Progress" })
      ]),
      el("select", { 
        className: "w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-2 py-2 text-xs text-on-surface-variant font-medium",
        onchange: (e) => {
          if (e.target.value) {
            onResume(e.target.value);
            e.target.value = "";
          }
        }
      }, resumeOptions)
    ])
  ]);

  const mainArea = el("main", { className: "ml-64 pt-20 p-8 min-h-screen" }, [
    notifications.length
      ? el("section", { className: "mb-6 space-y-2" }, notifications.map(item =>
          el("div", { className: `p-4 rounded-xl text-sm ${item.tone === 'error' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}` }, [
            el("span", { text: item.message })
          ])
        ))
      : null,
    content
  ]);

  return el("div", { className: "app-wrapper bg-surface font-body text-on-surface" }, [
    topNav,
    sidebar,
    mainArea
  ]);
}
