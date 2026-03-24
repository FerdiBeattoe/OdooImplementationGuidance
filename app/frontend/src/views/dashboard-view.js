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
  return el("div", { className: "stack" }, [
    el("div", { className: "summary-grid" }, [
      summaryCard("Configuration", project.workflowState.configurationCompletionStatus, renderStatusBadge(project.workflowState.configurationCompletionStatus)),
      summaryCard("Readiness", project.workflowState.operationalReadinessStatus, renderStatusBadge(project.workflowState.operationalReadinessStatus)),
      summaryCard("Connection", connection.status, null),
      summaryCard("Needs Attention", String(checkpointSummary.blocked + checkpointSummary.warnings), null),
      summaryCard("Saved Projects", String(summary.savedProjects), null)
    ]),
    el("div", { className: "two-column" }, [
      el("section", { className: "panel panel--strong" }, [
        el("h3", { text: "Next governed step" }),
        el("p", {
          text: primaryCheckpoint ? primaryCheckpoint.title : "No checkpoint is currently selected."
        }),
        el("p", {
          className: "subtle",
          text:
            primaryCheckpoint?.status === "Fail"
              ? "This checkpoint remains blocking."
              : "Review the checkpoint, then inspect, preview, or execute only where the domain capability panel marks those actions as supported."
        }),
        el("div", { className: "hero-panel__actions" }, [
          heroAction("Open Setup Journey", () => onNavigate("stages", project.workflowState.currentStageId)),
          heroAction("Open Domains", () => onNavigate("domains", project.workflowState.currentDomainId)),
          heroAction("Launch Setup Wizard", () => onNavigate("wizard-launcher"))
        ])
      ]),
      el("section", { className: "panel" }, [
        el("h3", { text: "Project truth" }),
        el("p", { text: labelValue("Owner", project.projectIdentity.projectOwner || "Not recorded") }),
        el("p", { text: labelValue("Current stage", project.workflowState.currentStageId || "Not set") }),
        el("p", { text: labelValue("Current domain", project.workflowState.currentDomainId || "Not set") }),
        el("div", { className: "info-box" }, [
          el("strong", { text: "Execution boundary" }),
          el("p", { text: "This product never upgrades blocked or conditional actions into permitted actions silently." })
        ])
      ])
    ]),
    primaryCheckpoint ? renderCheckpointPanel(primaryCheckpoint) : null,
    guidanceBlock ? renderGuidanceBlock(guidanceBlock) : null
  ]);
}

function renderConnectionSection(connection, onNavigate, onSelectDashboardSection, project, onConnect, onDisconnect) {
  const urlInput = el("input", { placeholder: "https://your-odoo.example.com" });
  const databaseInput = el("input", { placeholder: "Database name" });
  const usernameInput = el("input", { placeholder: "Username" });
  const passwordInput = el("input", { type: "password", placeholder: "Password" });

  return el("div", { className: "stack" }, [
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
        heroAction("Disconnect", () => onDisconnect())
      ])
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
