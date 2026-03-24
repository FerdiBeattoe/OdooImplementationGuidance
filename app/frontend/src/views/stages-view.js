import { STAGES } from "/shared/index.js";
import { el } from "../lib/dom.js";
import { renderCheckpointPanel } from "../components/checkpoint-panel.js";
import { renderGridBuilderShell } from "../components/grid-builder-shell.js";
import { renderStatusBadge } from "../components/status-badge.js";
import { renderProgressWizard } from "../components/progress-wizard.js";

export function renderStagesView(project, onSelectStage) {
  const selectedStage = STAGES.find((stage) => stage.id === project.workflowState.currentStageId) || STAGES[0];
  const stageCheckpoints = project.checkpoints.filter((checkpoint) => checkpoint.stageId === selectedStage.id);

  return el("section", { className: "workspace" }, [
    header("Your Setup Journey", "Follow these areas in order. We'll guide you through exactly what to do in each one."),
    renderProgressWizard({
      stages: STAGES,
      currentStageId: project.workflowState.currentStageId,
      checkpoints: project.checkpoints,
      onSelectStage
    }),
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
    ...stageCheckpoints.map(renderCheckpointPanel)
  ]);
}

function header(title, description) {
  return el("header", { className: "workspace__header" }, [el("h2", { text: title }), el("p", { text: description })]);
}

function findStatus(items, id) {
  return items.find((item) => item.id === id)?.status || "Not Started";
}
