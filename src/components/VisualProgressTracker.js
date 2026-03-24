import { el } from "../../app/frontend/src/lib/dom.js";

const ICONS = {
  database: "🗄️",
  company: "🏢",
  users: "👥",
  localization: "🌍",
  accounting: "📊",
  sales: "🛒",
  purchase: "📦",
  inventory: "📍",
  manufacturing: "🏭",
  crm: "🤝",
  website: "🌐",
  pos: "💳",
  quality: "✅",
  maintenance: "🔧",
  plm: "📐",
  project: "📋",
  hr: "👤",
  fleet: "🚗",
  rental: "🔑",
  subscription: "🔄",
  default: "⚙️"
};

const STEP_STATES = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETE: "complete",
  BLOCKED: "blocked",
  SKIPPED: "skipped"
};

export function createVisualProgressTracker(options = {}) {
  const {
    steps = [],
    currentStepId = null,
    layout = "horizontal",
    onStepClick = () => {},
    compact = false
  } = options;

  let state = {
    steps: steps.map((step, index) => ({
      ...step,
      number: index + 1,
      state: step.id === currentStepId ? STEP_STATES.ACTIVE : step.state || STEP_STATES.PENDING
    })),
    currentStepId
  };

  const container = el("div", {
    className: "step-indicator",
    dataset: { testid: "visual-progress-tracker" }
  });

  function getStepIcon(step) {
    if (step.icon) return step.icon;
    return ICONS[step.type] || ICONS.default;
  }

  function getStepStateClass(stepState) {
    switch (stepState) {
      case STEP_STATES.COMPLETE: return "step-indicator__circle--completed";
      case STEP_STATES.ACTIVE: return "step-indicator__circle--active";
      case STEP_STATES.SKIPPED: return "step-indicator__circle--pending";
      default: return "step-indicator__circle--pending";
    }
  }

  function getLineStateClass(stepState) {
    return stepState === STEP_STATES.COMPLETE ? "step-indicator__line--completed" : "";
  }

  function renderStep(step, index) {
    const isClickable = step.state !== STEP_STATES.BLOCKED;
    const circleClass = getStepStateClass(step.state);
    const isActive = step.state === STEP_STATES.ACTIVE;
    const isCompleted = step.state === STEP_STATES.COMPLETE;

    const stepEl = el("div", {
      className: `step-indicator__item ${isActive ? "step-indicator__item--active" : ""}`,
      dataset: { stepId: step.id, stepState: step.state },
      onclick: isClickable ? () => onStepClick(step) : null
    }, [
      el("div", { className: `step-indicator__circle ${circleClass}` },
        isCompleted ? [] : [el("span", { text: String(step.number) })])
      ,
      compact ? null : el("span", { className: "step-indicator__label", text: step.label })
    ]);

    return stepEl;
  }

  function renderConnector(step, index) {
    if (index >= state.steps.length - 1) return null;
    const lineClass = getLineStateClass(step.state);
    return el("div", { className: `step-indicator__line ${lineClass}` });
  }

  function render() {
    container.innerHTML = "";
    
    state.steps.forEach((step, index) => {
      container.appendChild(renderStep(step, index));
      const connector = renderConnector(step, index);
      if (connector) container.appendChild(connector);
    });

    return container;
  }

  function updateSteps(newSteps, newCurrentStepId) {
    state.steps = newSteps.map((step, index) => ({
      ...step,
      number: index + 1,
      state: step.id === newCurrentStepId ? STEP_STATES.ACTIVE : step.state || STEP_STATES.PENDING
    }));
    state.currentStepId = newCurrentStepId;
    render();
  }

  render();

  return {
    element: container,
    render,
    updateSteps
  };
}

export { STEP_STATES };
