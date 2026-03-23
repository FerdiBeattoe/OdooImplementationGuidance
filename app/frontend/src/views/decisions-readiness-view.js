import { el } from "../lib/dom.js";
import { renderCheckpointPanel } from "../components/checkpoint-panel.js";

export function renderDecisionsReadinessView(project) {
  const blocked = project.checkpoints.filter((checkpoint) => checkpoint.status === "Fail");
  const warnings = project.checkpoints.filter((checkpoint) => checkpoint.status === "Warning");

  return el("section", { className: "workspace" }, [
    header("Decisions & Readiness", "Decision status, blocker visibility, and readiness controls stay explicit. No inferred go-live readiness is allowed."),
    el("div", { className: "two-column" }, [
      readinessPanel(
        "Configuration completion",
        project.workflowState.configurationCompletionStatus,
        "Tracks setup progress only. It does not authorize go-live."
      ),
      readinessPanel(
        "Operational readiness",
        project.workflowState.operationalReadinessStatus,
        "Requires required checkpoints, go-live controls, and resolved blockers."
      )
    ]),
    el("section", { className: "panel" }, [
      el("h3", { text: "Blocked checkpoints" }),
      ...(blocked.length ? blocked.map(renderCheckpointPanel) : [el("p", { text: "No blocked checkpoints are currently recorded." })])
    ]),
    el("section", { className: "panel" }, [
      el("h3", { text: "Warnings requiring review" }),
      ...(warnings.length ? warnings.map(renderCheckpointPanel) : [el("p", { text: "No active warnings are currently recorded." })])
    ])
  ]);
}

function header(title, description) {
  return el("header", { className: "workspace__header" }, [el("h2", { text: title }), el("p", { text: description })]);
}

function readinessPanel(title, status, description) {
  return el("section", { className: "panel" }, [el("h3", { text: title }), el("p", { text: status }), el("p", { text: description })]);
}
