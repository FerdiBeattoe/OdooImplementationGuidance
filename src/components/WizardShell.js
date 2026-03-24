import { el } from "../../app/frontend/src/lib/dom.js";
import { createVisualProgressTracker, STEP_STATES } from "./VisualProgressTracker.js";

const WIZARD_DIRECTIONS = {
  NEXT: "next",
  PREV: "prev",
  JUMP: "jump"
};

const WIZARD_STATES = {
  IDLE: "idle",
  VALIDATING: "validating",
  SAVING: "saving",
  ERROR: "error",
  COMPLETE: "complete"
};

export function createWizardShell(options = {}) {
  const {
    id,
    title = "Setup Wizard",
    description = "",
    steps = [],
    onStepChange = () => {},
    onComplete = () => {},
    onCancel = () => {},
    onSaveProgress = () => {},
    allowJumping = false,
    showStepNumbers = true,
    persistProgress = true,
    validateOnNext = true,
    autoSave = false,
    autoSaveInterval = 30000
  } = options;

  let state = {
    currentStepIndex: 0,
    wizardState: WIZARD_STATES.IDLE,
    stepData: {},
    completedSteps: new Set(),
    skippedSteps: new Set(),
    errors: {},
    lastSaved: null,
    branchingPath: []
  };

  const container = el("div", {
    className: "wizard-shell",
    dataset: { testid: "wizard-shell", wizardId: id }
  });

  const contentArea = el("div", { className: "wizard-shell__content" });
  const footerArea = el("div", { className: "wizard-shell__footer" });
  const progressArea = el("div", { className: "wizard-shell__progress" });

  let progressTracker;
  let autoSaveTimer = null;

  function resolveVisibleSteps() {
    if (state.branchingPath.length > 0) {
      return state.branchingPath.map(stepId => steps.find(s => s.id === stepId)).filter(Boolean);
    }
    return steps;
  }

  function resolveNextStepIndex(currentIndex, direction) {
    const visibleSteps = resolveVisibleSteps();

    if (direction === WIZARD_DIRECTIONS.PREV) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (!state.skippedSteps.has(visibleSteps[i].id)) {
          return i;
        }
      }
      return currentIndex;
    }

    for (let i = currentIndex + 1; i < visibleSteps.length; i++) {
      if (!state.skippedSteps.has(visibleSteps[i].id)) {
        return i;
      }
    }
    return -1;
  }

  function evaluateBranchingLogic(step, stepData) {
    if (!step.branches || step.branches.length === 0) return null;

    for (const branch of step.branches) {
      if (evaluateCondition(branch.condition, stepData)) {
        return branch.targetStepId;
      }
    }

    return step.defaultNextStepId || null;
  }

  function evaluateCondition(condition, data) {
    if (!condition) return true;

    const { field, operator, value } = condition;
    const fieldValue = data[field];

    switch (operator) {
      case "equals": return fieldValue === value;
      case "notEquals": return fieldValue !== value;
      case "contains": return String(fieldValue).includes(value);
      case "greaterThan": return Number(fieldValue) > Number(value);
      case "lessThan": return Number(fieldValue) < Number(value);
      case "exists": return fieldValue !== undefined && fieldValue !== null;
      case "isEmpty": return !fieldValue || String(fieldValue).trim() === "";
      default: return true;
    }
  }

  async function validateStep(stepIndex, data) {
    const visibleSteps = resolveVisibleSteps();
    const step = visibleSteps[stepIndex];
    if (!step) return { valid: false, errors: { general: "Step not found" } };

    if (!step.validations || step.validations.length === 0) {
      return { valid: true, errors: {} };
    }

    const errors = {};

    for (const validation of step.validations) {
      const { field, rule, message, params = {} } = validation;
      const value = data[field];
      let isValid = true;

      switch (rule) {
        case "required":
          isValid = value !== undefined && value !== null && String(value).trim() !== "";
          break;
        case "minLength":
          isValid = String(value).length >= (params.min || 0);
          break;
        case "maxLength":
          isValid = String(value).length <= (params.max || Infinity);
          break;
        case "pattern":
          isValid = new RegExp(params.pattern).test(String(value));
          break;
        case "email":
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
          break;
        case "numeric":
          isValid = !isNaN(Number(value));
          break;
        case "range":
          const num = Number(value);
          isValid = num >= (params.min || -Infinity) && num <= (params.max || Infinity);
          break;
        case "custom":
          if (params.validator && typeof params.validator === "function") {
            isValid = await params.validator(value, data);
          }
          break;
      }

      if (!isValid) {
        errors[field] = message || `${field} is invalid`;
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  async function goToNext() {
    const visibleSteps = resolveVisibleSteps();
    const currentStep = visibleSteps[state.currentStepIndex];

    if (validateOnNext) {
      setWizardState(WIZARD_STATES.VALIDATING);
      const { valid, errors } = await validateStep(state.currentStepIndex, state.stepData);

      if (!valid) {
        state.errors = errors;
        setWizardState(WIZARD_STATES.ERROR);
        render();
        return false;
      }

      state.errors = {};
    }

    state.completedSteps.add(currentStep.id);

    const branchTarget = evaluateBranchingLogic(currentStep, state.stepData);
    if (branchTarget) {
      const targetIndex = visibleSteps.findIndex(s => s.id === branchTarget);
      if (targetIndex !== -1) {
        navigateToStep(targetIndex, WIZARD_DIRECTIONS.JUMP);
        return true;
      }
    }

    const nextIndex = resolveNextStepIndex(state.currentStepIndex, WIZARD_DIRECTIONS.NEXT);

    if (nextIndex === -1) {
      completeWizard();
      return true;
    }

    navigateToStep(nextIndex, WIZARD_DIRECTIONS.NEXT);
    return true;
  }

  function goToPrevious() {
    const prevIndex = resolveNextStepIndex(state.currentStepIndex, WIZARD_DIRECTIONS.PREV);
    if (prevIndex !== state.currentStepIndex) {
      navigateToStep(prevIndex, WIZARD_DIRECTIONS.PREV);
    }
  }

  function navigateToStep(index, direction) {
    const visibleSteps = resolveVisibleSteps();
    const previousStep = visibleSteps[state.currentStepIndex];
    const newStep = visibleSteps[index];

    state.currentStepIndex = index;
    state.wizardState = WIZARD_STATES.IDLE;
    state.errors = {};

    onStepChange({
      from: previousStep,
      to: newStep,
      direction,
      stepData: state.stepData,
      stepIndex: index,
      totalSteps: visibleSteps.length
    });

    if (persistProgress) {
      saveProgress();
    }

    render();
  }

  function jumpToStep(stepId) {
    if (!allowJumping) return;

    const visibleSteps = resolveVisibleSteps();
    const index = visibleSteps.findIndex(s => s.id === stepId);

    if (index !== -1 && (index <= Math.max(...Array.from(state.completedSteps).map(id =>
      visibleSteps.findIndex(s => s.id === id)
    )) + 1)) {
      navigateToStep(index, WIZARD_DIRECTIONS.JUMP);
    }
  }

  function setStepData(stepId, data) {
    state.stepData = {
      ...state.stepData,
      [stepId]: { ...state.stepData[stepId], ...data }
    };

    if (autoSave) {
      scheduleAutoSave();
    }
  }

  function getStepData(stepId) {
    return state.stepData[stepId] || {};
  }

  function skipStep(stepId) {
    state.skippedSteps.add(stepId);

    const visibleSteps = resolveVisibleSteps();
    const currentStep = visibleSteps[state.currentStepIndex];

    if (currentStep.id === stepId) {
      goToNext();
    }

    render();
  }

  function unskipStep(stepId) {
    state.skippedSteps.delete(stepId);
    render();
  }

  function setWizardState(newState) {
    state.wizardState = newState;
    container.dataset.state = newState;
  }

  function saveProgress() {
    const progressData = {
      wizardId: id,
      currentStepIndex: state.currentStepIndex,
      stepData: state.stepData,
      completedSteps: Array.from(state.completedSteps),
      skippedSteps: Array.from(state.skippedSteps),
      timestamp: Date.now()
    };

    state.lastSaved = new Date();
    onSaveProgress(progressData);

    try {
      localStorage.setItem(`wizard_${id}_progress`, JSON.stringify(progressData));
    } catch (e) {
      console.warn("Failed to save wizard progress to localStorage", e);
    }
  }

  function loadProgress() {
    try {
      const saved = localStorage.getItem(`wizard_${id}_progress`);
      if (saved) {
        const data = JSON.parse(saved);
        state.currentStepIndex = data.currentStepIndex || 0;
        state.stepData = data.stepData || {};
        state.completedSteps = new Set(data.completedSteps || []);
        state.skippedSteps = new Set(data.skippedSteps || []);
        state.lastSaved = new Date(data.timestamp);
        return true;
      }
    } catch (e) {
      console.warn("Failed to load wizard progress from localStorage", e);
    }
    return false;
  }

  function clearProgress() {
    try {
      localStorage.removeItem(`wizard_${id}_progress`);
    } catch (e) {
      console.warn("Failed to clear wizard progress", e);
    }
    state.completedSteps.clear();
    state.skippedSteps.clear();
    state.stepData = {};
    state.currentStepIndex = 0;
  }

  function scheduleAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(() => {
      saveProgress();
    }, autoSaveInterval);
  }

  function completeWizard() {
    setWizardState(WIZARD_STATES.COMPLETE);
    saveProgress();

    const visibleSteps = resolveVisibleSteps();
    onComplete({
      stepData: state.stepData,
      completedSteps: Array.from(state.completedSteps),
      skippedSteps: Array.from(state.skippedSteps),
      allSteps: visibleSteps.map(s => ({
        id: s.id,
        completed: state.completedSteps.has(s.id),
        skipped: state.skippedSteps.has(s.id)
      }))
    });

    render();
  }

  function getStepStatus(stepId) {
    if (state.completedSteps.has(stepId)) return STEP_STATES.COMPLETE;
    if (state.skippedSteps.has(stepId)) return STEP_STATES.SKIPPED;

    const visibleSteps = resolveVisibleSteps();
    const index = visibleSteps.findIndex(s => s.id === stepId);

    if (index === state.currentStepIndex) return STEP_STATES.ACTIVE;
    if (index < state.currentStepIndex) return STEP_STATES.BLOCKED;
    return STEP_STATES.PENDING;
  }

  function renderHeader() {
    const visibleSteps = resolveVisibleSteps();
    const currentStep = visibleSteps[state.currentStepIndex];

    return el("div", { className: "wizard-shell__header" }, [
      el("div", { className: "wizard-shell__title-area" }, [
        el("h2", { className: "wizard-shell__title", text: title }),
        description ? el("p", { className: "wizard-shell__description", text: description }) : null
      ]),
      currentStep
        ? el("div", { className: "wizard-shell__step-info" }, [
            showStepNumbers
              ? el("span", { className: "wizard-shell__step-counter", text: `Step ${state.currentStepIndex + 1} of ${visibleSteps.length}` })
              : null,
            el("span", { className: "wizard-shell__step-title", text: currentStep.title })
          ])
        : null
    ]);
  }

  function renderProgress() {
    const visibleSteps = resolveVisibleSteps();

    const progressSteps = visibleSteps.map((step, index) => ({
      id: step.id,
      label: step.title,
      icon: step.icon,
      description: step.description,
      state: getStepStatus(step.id)
    }));

    progressTracker = createVisualProgressTracker({
      steps: progressSteps,
      currentStepId: visibleSteps[state.currentStepIndex]?.id,
      layout: "horizontal",
      compact: true,
      onStepClick: allowJumping ? (step) => jumpToStep(step.id) : null
    });

    progressArea.innerHTML = "";
    progressArea.appendChild(progressTracker.element);
    return progressArea;
  }

  function renderStepContent() {
    const visibleSteps = resolveVisibleSteps();
    const currentStep = visibleSteps[state.currentStepIndex];

    if (!currentStep) {
      return el("div", { className: "wizard-shell__empty", text: "No steps configured" });
    }

    if (state.wizardState === WIZARD_STATES.COMPLETE) {
      return el("div", { className: "wizard-shell__complete" }, [
        el("div", { className: "wizard-shell__complete-icon", text: "🎉" }),
        el("h3", { text: "Setup Complete!" }),
        el("p", { text: "All steps have been completed successfully." })
      ]);
    }

    const content = el("div", { className: "wizard-shell__step" }, [
      currentStep.component
        ? currentStep.component({
            data: state.stepData[currentStep.id] || {},
            onChange: (data) => setStepData(currentStep.id, data),
            errors: state.errors,
            isActive: true
          })
        : el("div", { className: "wizard-shell__empty-step", text: currentStep.description || "Configure this step" })
    ]);

    if (state.errors && Object.keys(state.errors).length > 0) {
      const errorList = el("div", { className: "wizard-shell__errors" });
      Object.entries(state.errors).forEach(([field, message]) => {
        errorList.appendChild(
          el("div", { className: "wizard-shell__error", text: `${field}: ${message}` })
        );
      });
      content.appendChild(errorList);
    }

    return content;
  }

  function renderFooter() {
    const visibleSteps = resolveVisibleSteps();
    const isFirstStep = state.currentStepIndex === 0;
    const isLastStep = resolveNextStepIndex(state.currentStepIndex, WIZARD_DIRECTIONS.NEXT) === -1;
    const currentStep = visibleSteps[state.currentStepIndex];

    if (state.wizardState === WIZARD_STATES.COMPLETE) {
      return el("div", { className: "wizard-shell__footer" }, [
        el("button", {
          className: "button button--primary",
          text: "Finish",
          onclick: () => onComplete({ stepData: state.stepData })
        })
      ]);
    }

    return el("div", { className: "wizard-shell__footer" }, [
      el("div", { className: "wizard-shell__actions-left" }, [
        el("button", {
          className: "button",
          text: "Cancel",
          onclick: onCancel
        }),
        !isFirstStep
          ? el("button", {
              className: "button",
              text: "Previous",
              onclick: goToPrevious
            })
          : null
      ]),

      el("div", { className: "wizard-shell__actions-right" }, [
        currentStep?.allowSkip
          ? el("button", {
              className: "button button--secondary",
              text: "Skip",
              onclick: () => skipStep(currentStep.id)
            })
          : null,
        el("button", {
          className: "button button--primary",
          text: isLastStep ? "Complete" : "Next",
          disabled: state.wizardState === WIZARD_STATES.VALIDATING,
          onclick: goToNext
        })
      ]),

      state.lastSaved
        ? el("span", { className: "wizard-shell__autosave", text: `Last saved: ${state.lastSaved.toLocaleTimeString()}` })
        : null
    ]);
  }

  function render() {
    container.innerHTML = "";
    container.appendChild(renderHeader());
    container.appendChild(renderProgress());
    container.appendChild(renderStepContent());
    container.appendChild(renderFooter());
    return container;
  }

  if (persistProgress) {
    loadProgress();
  }

  render();

  return {
    element: container,
    render,
    goToNext,
    goToPrevious,
    jumpToStep,
    setStepData,
    getStepData,
    skipStep,
    unskipStep,
    saveProgress,
    loadProgress,
    clearProgress,
    getState: () => ({ ...state }),
    STEPS: STEP_STATES,
    STATES: WIZARD_STATES,
    DIRECTIONS: WIZARD_DIRECTIONS
  };
}

export { WIZARD_STATES, WIZARD_DIRECTIONS, STEP_STATES };
