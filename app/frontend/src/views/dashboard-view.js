import { getGuidanceBlockForCheckpoint, summarizeCheckpoints } from "/shared/index.js";
import { el } from "../lib/dom.js";
import { labelValue } from "../lib/formatters.js";
import { renderCheckpointPanel } from "../components/checkpoint-panel.js";
import { renderGuidanceBlock } from "../components/guidance-block.js";
import { renderStatusBadge } from "../components/status-badge.js";

export function renderDashboardView(project, summary) {
  const checkpointSummary = summarizeCheckpoints(project.checkpoints);
  const primaryCheckpoint = project.checkpoints.find((checkpoint) => checkpoint.status !== "Pass") || project.checkpoints[0];
  const guidanceBlock = getGuidanceBlockForCheckpoint(primaryCheckpoint);

  return el("section", { className: "workspace" }, [
    header("Dashboard", "Implementation control overview. Configuration completion and operational readiness remain separate."),
    el("div", { className: "summary-grid" }, [
      summaryCard("Project mode", project.projectIdentity.projectMode, renderStatusBadge(project.workflowState.configurationCompletionStatus)),
      summaryCard("Deployment target", `${project.projectIdentity.edition} / ${project.projectIdentity.deployment}`, null),
      summaryCard("Blocked checkpoints", String(checkpointSummary.blocked), null),
      summaryCard("Warnings", String(checkpointSummary.warnings), null),
      summaryCard("Deferred", String(checkpointSummary.deferred), null),
      summaryCard("Saved projects", String(summary.savedProjects), null)
    ]),
    el("div", { className: "two-column" }, [
      el("section", { className: "panel" }, [
        el("h3", { text: "Project context" }),
        el("p", { text: labelValue("Version", project.projectIdentity.version) }),
        el("p", { text: labelValue("Project owner", project.projectIdentity.projectOwner) }),
        el("p", { text: labelValue("Implementation lead", project.projectIdentity.implementationLead) }),
        el("p", { text: labelValue("Current stage", project.workflowState.currentStageId) }),
        el("p", { text: labelValue("Current domain", project.workflowState.currentDomainId) })
      ]),
      el("section", { className: "panel" }, [
        el("h3", { text: "Readiness split" }),
        el("p", { text: labelValue("Configuration completion", project.workflowState.configurationCompletionStatus) }),
        el("p", { text: labelValue("Operational readiness", project.workflowState.operationalReadinessStatus) }),
        el("p", {
          text:
            "The platform does not treat configuration completion as proof of go-live readiness."
        })
      ])
    ]),
    primaryCheckpoint ? renderCheckpointPanel(primaryCheckpoint) : null,
    guidanceBlock ? renderGuidanceBlock(guidanceBlock) : null
  ]);
}

function header(title, description) {
  return el("header", { className: "workspace__header" }, [el("h2", { text: title }), el("p", { text: description })]);
}

function summaryCard(label, value, badge) {
  return el("article", { className: "summary-card" }, [
    el("p", { className: "summary-card__label", text: label }),
    el("h3", { text: value }),
    badge
  ]);
}
