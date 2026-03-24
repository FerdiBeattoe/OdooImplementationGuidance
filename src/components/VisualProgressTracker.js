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
    showPercentages = true,
    showIcons = true,
    layout = "horizontal",
    onStepClick = () => {},
    compact = false,
    theme = "default"
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
    className: `vpt-container vpt-container--${layout} vpt-container--${theme} ${compact ? "vpt-container--compact" : ""}`,
    dataset: { testid: "visual-progress-tracker" }
  });

  function calculateProgress() {
    const total = state.steps.length;
    const complete = state.steps.filter(s => s.state === STEP_STATES.COMPLETE).length;
    const percent = Math.round((complete / total) * 100);
    return { total, complete, percent };
  }

  function getStepIcon(step) {
    if (step.icon) return step.icon;
    return ICONS[step.type] || ICONS.default;
  }

  function getStepStateClass(stepState) {
    switch (stepState) {
      case STEP_STATES.COMPLETE: return "vpt-step--complete";
      case STEP_STATES.ACTIVE: return "vpt-step--active";
      case STEP_STATES.BLOCKED: return "vpt-step--blocked";
      case STEP_STATES.SKIPPED: return "vpt-step--skipped";
      default: return "vpt-step--pending";
    }
  }

  function renderProgressHeader() {
    const { complete, total, percent } = calculateProgress();

    return el("div", { className: "vpt-header" }, [
      el("div", { className: "vpt-header__left" }, [
        el("h3", { className: "vpt-header__title", text: "Implementation Progress" }),
        el("span", { className: "vpt-header__subtitle", text: `${complete} of ${total} steps completed` })
      ]),
      showPercentages
        ? el("div", { className: "vpt-header__right" }, [
            el("span", { className: "vpt-percentage", text: `${percent}%` })
          ])
        : null
    ]);
  }

  function renderProgressBar() {
    const { percent } = calculateProgress();

    return el("div", { className: "vpt-progress-bar" }, [
      el("div", {
        className: "vpt-progress-fill",
        style: `width: ${percent}%`,
        dataset: { percent: String(percent) }
      })
    ]);
  }

  function renderStepIndicator(step) {
    const isClickable = step.state !== STEP_STATES.BLOCKED;
    const stateClass = getStepStateClass(step.state);
    const icon = showIcons ? getStepIcon(step) : null;

    const indicator = el("div", {
      className: `vpt-step ${stateClass}`,
      dataset: { stepId: step.id, stepState: step.state },
      onclick: isClickable ? () => onStepClick(step) : null
    }, [
      el("div", { className: "vpt-step__marker" }, [
        icon ? el("span", { className: "vpt-step__icon", text: icon }) : null,
        step.state === STEP_STATES.COMPLETE
          ? el("span", { className: "vpt-step__check", text: "✓" })
          : el("span", { className: "vpt-step__number", text: String(step.number) })
      ]),
      el("div", { className: "vpt-step__content" }, [
        el("span", { className: "vpt-step__label", text: step.label }),
        step.description && !compact
          ? el("span", { className: "vpt-step__description", text: step.description })
          : null,
        step.estimatedTime && !compact
          ? el("span", { className: "vpt-step__time", text: `~${step.estimatedTime}` })
          : null
      ])
    ]);

    return indicator;
  }

  function renderConnector(index) {
    if (index >= state.steps.length - 1) return null;

    const currentStep = state.steps[index];
    const nextStep = state.steps[index + 1];
    const isConnected = currentStep.state === STEP_STATES.COMPLETE;

    return el("div", {
      className: `vpt-connector ${isConnected ? "vpt-connector--complete" : ""}`
    });
  }

  function renderSteps() {
    const stepsContainer = el("div", { className: `vpt-steps vpt-steps--${layout}` });

    state.steps.forEach((step, index) => {
      stepsContainer.appendChild(renderStepIndicator(step));
      const connector = renderConnector(index);
      if (connector) stepsContainer.appendChild(connector);
    });

    return stepsContainer;
  }

  function render() {
    container.innerHTML = "";
    container.appendChild(renderProgressHeader());
    container.appendChild(renderProgressBar());
    container.appendChild(renderSteps());
    return container;
  }

  function update(newOptions) {
    if (newOptions.steps) {
      state.steps = newOptions.steps.map((step, index) => ({
        ...step,
        number: index + 1,
        state: step.id === newOptions.currentStepId ? STEP_STATES.ACTIVE : step.state || STEP_STATES.PENDING
      }));
    }
    if (newOptions.currentStepId) {
      state.currentStepId = newOptions.currentStepId;
      state.steps = state.steps.map(step => ({
        ...step,
        state: step.id === newOptions.currentStepId ? STEP_STATES.ACTIVE : step.state
      }));
    }
    return render();
  }

  function setStepState(stepId, stepState) {
    state.steps = state.steps.map(step =>
      step.id === stepId ? { ...step, state: stepState } : step
    );
    return render();
  }

  function getStepState(stepId) {
    const step = state.steps.find(s => s.id === stepId);
    return step ? step.state : null;
  }

  render();

  return {
    element: container,
    render,
    update,
    setStepState,
    getStepState,
    calculateProgress,
    STEPS: STEP_STATES
  };
}

export function createMobileProgressTracker(options = {}) {
  return createVisualProgressTracker({
    ...options,
    layout: "vertical",
    compact: true,
    showPercentages: true
  });
}

export function createDomainProgressTracker(domains, options = {}) {
  const steps = domains.map(domain => ({
    id: domain.id,
    label: domain.label,
    type: domain.type || "default",
    icon: ICONS[domain.type] || ICONS.default,
    description: domain.description,
    state: domain.state || STEP_STATES.PENDING
  }));

  return createVisualProgressTracker({
    steps,
    ...options
  });
}

export function createWizardProgressTracker(wizardSteps, options = {}) {
  const steps = wizardSteps.map((step, index) => ({
    id: step.id || `step-${index}`,
    label: step.label || step.title,
    type: step.type || "default",
    icon: step.icon,
    description: step.description,
    estimatedTime: step.estimatedTime,
    state: step.state || STEP_STATES.PENDING
  }));

  return createVisualProgressTracker({
    steps,
    ...options
  });
}

export { ICONS, STEP_STATES };
