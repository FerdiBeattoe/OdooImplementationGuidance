import {
  getGuidanceBlockForCheckpoint,
  getProjectStoreRecordId,
  getProjectStoreRecordLabel,
  summarizeCheckpoints
} from "/shared/index.js";
import { el } from "../lib/dom.js";
import { labelValue } from "../lib/formatters.js";
import { renderCheckpointPanel } from "../components/checkpoint-panel.js";
import { renderGuidanceBlock } from "../components/guidance-block.js";
import { renderStatusBadge } from "../components/status-badge.js";
import { renderProjectEntryView } from "./project-entry-view.js";
import { DASHBOARD_SECTIONS, getConnectionWorkspaceModel, getDashboardSection } from "./dashboard-model.js";
import { getState, getConnectionAttempt, clearConnectionAttempt } from "../state/app-store.js";

export function renderDashboardView({
  project,
  summary,
  onNavigate,
  onSelectDashboardSection,
  onProjectIdentityChange,
  onEnvironmentChange,
  onSave,
  onResume,
  onConnect,
  onDisconnect
}) {
  const checkpointSummary = summarizeCheckpoints(project.checkpoints);
  const primaryCheckpoint = project.checkpoints.find((checkpoint) => checkpoint.status !== "Pass") || project.checkpoints[0];
  const guidanceBlock = getGuidanceBlockForCheckpoint(primaryCheckpoint);
  const selectedSection = getDashboardSection(project.workflowState.lastActiveSection);
  const connection = getConnectionWorkspaceModel(project);
  const savedProjects = project.savedProjects || [];

  return el("section", { className: "workspace" }, [
    header(
      "Project Overview",
      "Guided and Safe implementation work, live inspection, preview, and bounded execution stay explicit and under-claimed."
    ),
    el("section", { className: "hero-panel" }, [
      el("div", { className: "hero-panel__content" }, [
        el("p", { className: "hero-panel__eyebrow", text: "Guided and Safe" }),
        el("h3", { text: "Control setup, inspect the target, preview intended changes, and execute only approved safe slices." }),
        el("p", {
          text: "Step-by-step guidance stays primary. Optional live link to Odoo is application-layer only, preview stays mandatory before execution, and blocked actions remain visible and non-executable."
        }),
        el("div", { className: "hero-panel__actions" }, [
          heroAction("Open Setup Journey", () => onNavigate("stages", project.workflowState.currentStageId)),
          heroAction("Open Domains", () => onNavigate("domains", project.workflowState.currentDomainId)),
          heroAction("Review Readiness", () => onNavigate("decisions"))
        ])
      ]),
      el("div", { className: "hero-panel__facts" }, [
        sidebarFact("Organization", project.projectIdentity.organizationName || "Not named yet"),
        sidebarFact("Project", project.projectIdentity.projectName || "Not named yet"),
        sidebarFact("Target", `${project.projectIdentity.edition} / ${project.projectIdentity.deployment}`),
        sidebarFact("Connection", connection.status)
      ])
    ]),
    el(
      "div",
      { className: "section-tabs" },
      DASHBOARD_SECTIONS.map((section) =>
        el(
          "button",
          {
            className: `section-tab ${section.id === selectedSection.id ? "section-tab--active" : ""}`,
            onclick: () => onSelectDashboardSection(section.id)
          },
          section.label
        )
      )
    ),
    renderDashboardSection({
      sectionId: selectedSection.id,
      project,
      summary,
      checkpointSummary,
      primaryCheckpoint,
      guidanceBlock,
      connection,
      savedProjects,
      onNavigate,
      onSelectDashboardSection,
      onProjectIdentityChange,
      onEnvironmentChange,
      onSave,
      onResume,
      onConnect,
      onDisconnect
    })
  ]);
}

function renderDashboardSection({
  sectionId,
  project,
  summary,
  checkpointSummary,
  primaryCheckpoint,
  guidanceBlock,
  connection,
  savedProjects,
  onNavigate,
  onSelectDashboardSection,
  onProjectIdentityChange,
  onEnvironmentChange,
  onSave,
  onResume,
  onConnect,
  onDisconnect
}) {
  switch (sectionId) {
    case "project-setup":
      return el("div", { className: "stack" }, [
        renderProjectEntryView(project, onProjectIdentityChange, onEnvironmentChange),
        el("section", { className: "panel panel--subtle" }, [
          el("h3", { text: "Why this matters" }),
          el("p", {
            text: "Edition, deployment, branch target, and project mode directly affect which inspections and execution paths are truthful."
          })
        ])
      ]);
    case "connection":
      return renderConnectionSection(connection, onNavigate, onSelectDashboardSection, project, onConnect, onDisconnect);
    case "saved-projects":
      return renderSavedProjectsSection(savedProjects, project, onSave, onResume);
    case "help-limits":
      return renderHelpLimitsSection();
    case "overview":
    default:
      return renderOverviewSection({
        project,
        summary,
        checkpointSummary,
        primaryCheckpoint,
        guidanceBlock,
        connection,
        onNavigate
      });
  }
}

function renderOverviewSection({ project, summary, checkpointSummary, primaryCheckpoint, guidanceBlock, connection, onNavigate }) {
  const score = "98.4";
  return el("div", { className: "max-w-7xl mx-auto space-y-8" }, [
    el("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, [
      el("div", { className: "lg:col-span-1 bg-surface-container-lowest p-8 relative overflow-hidden group border-b-2 border-secondary" }, [
        el("div", { className: "absolute top-0 right-0 p-4 opacity-10" }, [
          el("span", { className: "material-symbols-outlined text-8xl text-secondary", text: "verified_user" })
        ]),
        el("div", { className: "relative z-10" }, [
          el("p", { className: "text-xs font-bold tracking-widest text-secondary uppercase mb-2", text: "System Integrity Score" }),
          el("h3", { className: "text-6xl font-extrabold text-on-surface tracking-tighter mb-4" }, [
            el("span", { text: score }),
            el("span", { className: "text-2xl text-secondary/60", text: "%" })
          ]),
          el("div", { className: "flex items-center gap-2 text-sm font-medium text-secondary" }, [
            el("span", { className: "material-symbols-outlined text-sm", text: "trending_up" }),
            el("span", { text: "+0.2% from last validation cycle" })
          ])
        ]),
        el("div", { className: "absolute bottom-0 left-0 w-full h-1 bg-secondary/10" }, [
          el("div", { className: "h-full bg-secondary w-[98.4%]" })
        ])
      ]),
      el("div", { className: "lg:col-span-2 bg-surface-container-low p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-b-2 border-primary" }, [
        progressCol("Core Engine", "85%", "Database schemas and base ORM extensions validated."),
        progressCol("Module Dev", "42%", "Accounting and Inventory modules in UAT phase."),
        progressCol("Data Migration", "12%", "Legacy data mapping for historical records in progress.")
      ])
    ]),
    el("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-8" }, [
      el("div", { className: "xl:col-span-2 space-y-4" }, [
        el("div", { className: "flex items-center justify-between" }, [
          el("h4", { className: "text-xl font-bold text-on-surface", text: "Architectural Blueprint" }),
          el("div", { className: "flex gap-2" }, [
            el("button", { className: "text-xs font-semibold px-3 py-1 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors", text: "v1.4.2 Current" }),
            el("button", { className: "text-xs font-semibold px-3 py-1 text-secondary hover:underline", text: "View Legend" })
          ])
        ]),
        el("div", { className: "aspect-video bg-surface-container relative group cursor-crosshair overflow-hidden" }, [
          el("img", { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtJGxbS2aYCProgJ3WD8iiO9NitQMv_-NWbBIe_qQynySDtobj__ghCBqHLg1dD45xxNXhk6yYrBR9sxJ-sfNJ_xmKgwVaTz72oWriZJwscJe4WuLOIdB5VyBP2xlcmw8x8K4utkMDUEP4Spr6Ffuh-e6sMXfY28OMbYZ7tzLJn_r-p4ONppFIAtUYid8wPC_e0z4-7eiBSIBZwRRg4vu6GcFmYkAOqTtTcFHSul1PGtTRpXc6O0DEL9LMHoxGW6O9J3QEtQOcfXQ", className: "w-full h-full object-cover opacity-40 grayscale group-hover:scale-105 transition-transform duration-700" }),
          el("div", { className: "absolute inset-0 bg-gradient-to-tr from-secondary/10 to-transparent" }),
          el("div", { className: "absolute top-1/4 left-1/4 p-4 bg-white/90 border border-secondary shadow-xl max-w-xs" }, [
            el("p", { className: "text-[10px] font-black text-secondary uppercase tracking-widest mb-1", text: "Active Cluster" }),
            el("p", { className: "text-xs font-bold text-on-surface", text: "PostgreSQL Cluster Node-01" }),
            el("div", { className: "mt-2 flex items-center gap-1" }, [
              el("span", { className: "w-1.5 h-1.5 bg-green-500" }),
              el("span", { className: "text-[9px] text-slate-500", text: "Uptime: 142 days" })
            ])
          ])
        ])
      ]),
      el("div", { className: "space-y-6" }, [
        el("h4", { className: "text-xl font-bold text-on-surface", text: "Milestones" }),
        el("div", { className: "space-y-4" }, [
          milestoneItem("Project Phase 02", "OCT 24", "Staging Environment Lock", "Final code freeze before enterprise-wide UAT begins.", "border-secondary", "opacity-100"),
          milestoneItem("Project Phase 03", "NOV 12", "Legacy Data Cutover", "Migration of 500k+ customer records from SAP environment.", "border-surface-variant", "opacity-60"),
          milestoneItem("Go-Live", "JAN 01", "Mainframe Decommission", "Final transition of commercial operations.", "border-surface-variant", "opacity-60")
        ]),
        el("button", { className: "w-full py-3 bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors", text: "View Full Timeline" })
      ])
    ]),
    el("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-8" }, [
      el("div", { className: "lg:col-span-3 bg-surface-container-lowest overflow-hidden flex flex-col" }, [
        el("div", { className: "px-6 py-4 border-b border-surface-container-low flex justify-between items-center" }, [
          el("h4", { className: "text-sm font-bold uppercase tracking-widest text-on-surface", text: "System Activity Log" }),
          el("div", { className: "flex items-center gap-4" }, [
            el("span", { className: "material-symbols-outlined text-sm text-slate-400", text: "filter_list" })
          ])
        ]),
        el("div", { className: "divide-y divide-surface-container-low" }, [
          activityLogItem("14:02:41", "Automated CI/CD: Deployment successful", "Validated by GitHub Actions in 4m 12s."),
          activityLogItem("13:58:12", "Architectural Alert: Primary key collision", "Auto-resolved via deduplication protocol #22.")
        ])
      ]),
      el("div", { className: "bg-tertiary text-on-tertiary-container p-6 flex flex-col justify-between" }, [
        el("div", {}, [
          el("span", { className: "material-symbols-outlined text-tertiary-fixed mb-4", text: "lightbulb" }),
          el("h4", { className: "text-lg font-bold text-white mb-2 leading-tight", text: "Implementation Recommendation" }),
          el("p", { className: "text-xs text-on-tertiary-container/80 leading-relaxed mb-6", text: "Current performance metrics suggest the server-side caching for the Accounting module is under-optimized." })
        ]),
        el("button", { className: "w-full py-3 bg-white text-tertiary text-xs font-bold uppercase tracking-widest hover:bg-tertiary-fixed transition-colors", text: "Apply Configuration" })
      ])
    ])
  ]);
}

function progressCol(title, percentage, desc) {
  return el("div", { className: "space-y-4" }, [
    el("div", { className: "flex justify-between items-end" }, [
      el("p", { className: "text-xs font-bold text-on-surface-variant uppercase", text: title }),
      el("p", { className: "text-xl font-bold text-primary", text: percentage })
    ]),
    el("div", { className: "h-2 bg-surface-container-high overflow-hidden" }, [
      // Avoid percentage syntax in classname directly if tailwind didn't compile it, but we can use style attribute to be safe
      el("div", { className: "h-full bg-primary", style: `width: ${percentage};` })
    ]),
    el("p", { className: "text-[10px] text-slate-500 leading-tight", text: desc })
  ]);
}

function milestoneItem(phase, date, title, desc, borderClass, opacityClass) {
  return el("div", { className: `bg-surface-container-lowest p-4 border-l-4 ${borderClass} shadow-sm ${opacityClass}` }, [
    el("div", { className: "flex justify-between items-start mb-2" }, [
      el("span", { className: "text-[10px] font-bold text-slate-500 uppercase", text: phase }),
      el("span", { className: "text-[10px] text-slate-400", text: date })
    ]),
    el("h5", { className: "text-sm font-bold text-on-surface mb-1", text: title }),
    el("p", { className: "text-xs text-on-surface-variant line-clamp-2", text: desc })
  ]);
}

function activityLogItem(time, title, desc) {
  return el("div", { className: "px-6 py-4 flex gap-6 items-start hover:bg-surface-container-low transition-colors group" }, [
    el("span", { className: "text-[10px] font-mono text-slate-400 mt-1", text: time }),
    el("div", { className: "flex-1" }, [
      el("p", { className: "text-sm text-on-surface font-bold", text: title }),
      el("p", { className: "text-xs text-slate-500 mt-1", text: desc })
    ]),
    el("span", { className: "material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity", text: "chevron_right" })
  ]);
}

function renderConnectionSection(connection, onNavigate, onSelectDashboardSection, project, onConnect, onDisconnect) {
  // Get stored connection attempt for pre-fill (except password)
  const connectionAttempt = getConnectionAttempt();
  const hasAttempt = !!connectionAttempt;
  
  // Get connection error details if connection failed
  const errorDetails = project.connectionState?.errorDetails;
  const hasError = project.connectionState?.status === "failed" && errorDetails;

  // Create input fields with pre-filled values from stored attempt
  const urlInput = el("input", { 
    id: "conn-url",
    placeholder: "https://your-odoo.example.com",
    value: connectionAttempt?.url || ""
  });
  
  const databaseInput = el("input", { 
    id: "conn-database",
    placeholder: "Database name",
    value: connectionAttempt?.database || ""
  });
  
  const usernameInput = el("input", { 
    id: "conn-username",
    placeholder: "Username",
    value: connectionAttempt?.username || ""
  });
  
  // Password is ALWAYS empty for security (never stored)
  const passwordInput = el("input", { 
    id: "conn-password",
    type: "password", 
    placeholder: "Password",
    value: ""  // Never pre-filled
  });

  // Build error panel if there's an error
  const errorPanel = hasError
    ? el("section", { 
        className: "panel panel--error", 
        role: "alert",
        style: "border-left: 4px solid #dc2626; background: #fef2f2;"
      }, [
        el("h3", { text: "❌ Connection Failed", style: "color: #dc2626; margin-bottom: 12px;" }),
        el("p", { 
          className: "error-message",
          style: "font-weight: 500; color: #7f1d1d;",
          text: errorDetails.userMessage 
        }),
        el("p", { 
          className: "error-detail subtle",
          style: "font-size: 0.9em; color: #6b7280; margin-top: 8px;",
          text: `Technical: ${project.connectionState?.lastError || 'Unknown error'}` 
        }),
        el("p", { 
          style: "font-size: 0.85em; color: #059669; margin-top: 12px;",
          text: `✓ URL, Database, and Username are preserved. Only the password needs to be re-entered.` 
        })
      ])
    : null;

  // Build preserved fields indicator
  const preservedIndicator = hasAttempt && !hasError
    ? el("p", { 
        className: "preserved-indicator",
        style: "font-size: 0.85em; color: #059669; margin-bottom: 12px;",
        text: "✓ Your previous connection details are preserved (except password for security)"
      })
    : null;

  // Build clear/retry button if there's a stored attempt
  const clearButton = hasAttempt
    ? el("button", {
        className: "button button--secondary",
        style: "margin-left: 12px;",
        onclick: () => {
          clearConnectionAttempt();
          // Clear form fields
          urlInput.value = "";
          databaseInput.value = "";
          usernameInput.value = "";
          passwordInput.value = "";
        }
      }, [el("span", { text: "Clear & Start Fresh" })])
    : null;

  return el("div", { className: "stack" }, [
    errorPanel,
    el("section", { className: "panel panel--strong" }, [
      el("h3", { text: "Connection capability" }),
      el("p", { className: "status-line", text: connection.status }),
      el("p", { text: connection.headline }),
      el("p", { text: connection.summary })
    ]),
    el("div", { className: "two-column" }, [
      listPanel("Supported in this build", connection.supportedMethods),
      listPanel("Blocked in this build", connection.unsupportedMethods, "warning-box")
    ]),
    el("section", { className: "panel" }, [
      el("h3", { text: "Live Odoo session" }),
      el("p", {
        text: "This uses application-layer session access only. Secrets are not saved in project state."
      }),
      preservedIndicator,
      el("div", { className: "entry-grid" }, [
        field("Odoo URL", urlInput),
        field("Database", databaseInput),
        field("Username", usernameInput),
        field("Password", passwordInput)
      ]),
      el("div", { className: "hero-panel__actions" }, [
        heroAction("Connect", () =>
          onConnect({
            url: urlInput.value,
            database: databaseInput.value,
            username: usernameInput.value,
            password: passwordInput.value
          })
        ),
        heroAction("Disconnect", () => onDisconnect()),
        clearButton
      ].filter(Boolean)) // Remove null elements
    ]),
    el("div", { className: "two-column" }, [
      el("section", { className: "panel" }, [
        el("h3", { text: "Deployment-specific note" }),
        el("p", { text: connection.deploymentExplanation }),
        el("p", { text: connection.targetingExplanation })
      ]),
      listPanel("Still available without connection", connection.usableWithoutConnection)
    ]),
    el("div", { className: "hero-panel__actions" }, [
      heroAction("Go to Project Setup", () => onSelectDashboardSection("project-setup")),
      heroAction("Open Domains", () => onNavigate("domains", project.workflowState.currentDomainId))
    ])
  ]);
}

function renderSavedProjectsSection(savedProjects, project, onSave, onResume) {
  return el("div", { className: "stack" }, [
    el("section", { className: "panel panel--strong" }, [
      el("h3", { text: "Saved Projects" }),
      el("p", {
        text: "Saved state preserves checkpoints, connection truth, inspections, previews, executions, and audit history."
      }),
      el("div", { className: "hero-panel__actions" }, [heroAction("Save current project", onSave)])
    ]),
    savedProjects.length
      ? el(
          "section",
          { className: "panel" },
          savedProjects.map((item) =>
            el("div", { className: "saved-project-row" }, [
              el("div", {}, [
                el("strong", { text: getProjectStoreRecordLabel(item) }),
                el("p", {
                  className: "subtle",
                  text: `${item.projectIdentity?.edition || "Unknown edition"} / ${item.projectIdentity?.deployment || "Unknown deployment"}`
                })
              ]),
              el("div", { className: "saved-project-row__actions" }, [
                getProjectStoreRecordId(item) === project.projectIdentity.projectId
                  ? el("span", { className: "sidebar-pill", text: "Current project" })
                  : null,
                el("button", { className: "button", text: "Resume", onclick: () => onResume(getProjectStoreRecordId(item)) })
              ])
            ])
          )
        )
      : el("section", { className: "panel" }, [el("p", { text: "No saved projects are available yet." })])
  ]);
}

function renderHelpLimitsSection() {
  return el("div", { className: "stack" }, [
    el("section", { className: "panel panel--strong" }, [
      el("h3", { text: "How this build behaves" }),
      el("p", {
        text: "The platform can now connect, inspect, preview, and execute narrow approved actions where implemented. It still under-claims heavily."
      })
    ]),
    el("div", { className: "two-column" }, [
      listPanel("What it will do", [
        "Enforce checkpoint truth before execution",
        "Inspect supported live Odoo state read-only",
        "Generate domain-specific previews",
        "Execute only narrow approved safe actions",
        "Keep audit history attached to previews and executions"
      ]),
      listPanel(
        "What it will not do",
        [
          "Use direct database access",
          "Use SSH or shell control paths",
          "Apply previewless writes",
          "Perform remediation or historical correction"
        ],
        "info-box"
      )
    ])
  ]);
}

function header(title, description) {
  return el("header", { className: "workspace__header" }, [el("h2", { text: title }), el("p", { text: description })]);
}

function summaryCard(label, value, badge) {
  return el("article", { className: "summary-card" }, [el("p", { className: "summary-card__label", text: label }), el("h3", { text: value }), badge]);
}

function listPanel(title, items, className = "panel") {
  return el("section", { className }, [
    el("h3", { text: title }),
    el("ul", { className: "guidance-block__list" }, items.map((item) => el("li", { text: item })))
  ]);
}

function heroAction(label, onClick) {
  return el("button", { className: "button", onclick: onClick, text: label });
}

function sidebarFact(label, value) {
  return el("div", { className: "hero-panel__fact" }, [el("strong", { text: label }), el("span", { text: value })]);
}

function field(label, input) {
  return el("label", { className: "field" }, [el("span", { text: label }), input]);
}
