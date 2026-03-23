import { STAGES } from "/shared/index.js";
import { el } from "../lib/dom.js";
import { renderCheckpointPanel } from "../components/checkpoint-panel.js";
import { renderGridBuilderShell } from "../components/grid-builder-shell.js";
import { renderStatusBadge } from "../components/status-badge.js";

export function renderStagesView(project, onSelectStage) {
  const selectedStage = STAGES.find((stage) => stage.id === project.workflowState.currentStageId) || STAGES[0];
  const stageCheckpoints = project.checkpoints.filter((checkpoint) => checkpoint.stageId === selectedStage.id);

  return el("section", { className: "workspace" }, [
    header("Stages", "Stage navigation controls sequencing. Progression is still gated by checkpoint outcomes and dependencies."),
    el(
      "div",
      { className: "list-grid" },
      STAGES.map((stage) =>
        el(
          "button",
          {
            className: `list-card ${stage.id === selectedStage.id ? "list-card--active" : ""}`,
            onclick: () => onSelectStage(stage.id)
          },
          [el("h3", { text: stage.label }), el("p", { text: stage.purpose }), renderStatusBadge(findStatus(project.stages, stage.id))]
        )
      )
    ),
    renderGridBuilderShell("Stage workspace structure", [
      { label: "Context header", value: selectedStage.label },
      { label: "Current status", value: findStatus(project.stages, selectedStage.id) },
      { label: "Checkpoint count", value: String(stageCheckpoints.length) }
    ]),
    ...stageCheckpoints.map(renderCheckpointPanel)
  ]);
}

function header(title, description) {
  return el("header", { className: "workspace__header" }, [el("h2", { text: title }), el("p", { text: description })]);
}

function findStatus(items, id) {
  return items.find((item) => item.id === id)?.status || "Not Started";
}
