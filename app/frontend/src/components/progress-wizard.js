import { el } from "../lib/dom.js";

export function renderProgressWizard({ stages, currentStageId, checkpoints, onSelectStage }) {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId);
  const completedCount = stages.filter((stage, idx) => {
    if (idx >= currentIndex) return false;
    const stageCheckpoints = checkpoints.filter((cp) => cp.stageId === stage.id);
    return stageCheckpoints.every((cp) => cp.status === "Pass" || cp.defermentFlag);
  }).length;

  const progressPercent = Math.round((completedCount / stages.length) * 100);

  return el("div", { className: "progress-wizard" }, [
    el("div", { className: "progress-wizard__header" }, [
      el("h3", { text: "Your Implementation Progress" }),
      el("span", { className: "progress-wizard__percent", text: `${progressPercent}%` })
    ]),
    el("div", { className: "progress-wizard__bar" }, [
      el("div", {
        className: "progress-wizard__fill",
        style: `width: ${progressPercent}%`
      })
    ]),
    el("div", { className: "progress-wizard__steps" },
      stages.map((stage, index) => {
        const stageCheckpoints = checkpoints.filter((cp) => cp.stageId === stage.id);
        const isComplete = stageCheckpoints.every((cp) => cp.status === "Pass" || cp.defermentFlag);
        const isActive = stage.id === currentStageId;
        const isBlocked = stageCheckpoints.some((cp) => cp.status === "Fail" && !cp.defermentFlag);
        
        return el("button", {
          className: `progress-step ${isActive ? "progress-step--active" : ""} ${isComplete ? "progress-step--complete" : ""} ${isBlocked ? "progress-step--blocked" : ""}`,
          onclick: () => onSelectStage(stage.id)
        }, [
          el("span", { className: "progress-step__number", text: String(index + 1) }),
          el("span", { className: "progress-step__label", text: stage.label }),
          isComplete ? el("span", { className: "progress-step__check", text: "✓" }) : null
        ]);
      })
    )
  ]);
}

export function renderDomainProgress({ domains, currentDomainId, checkpoints, onSelectDomain }) {
  const domainList = domains.filter((d) => d.id !== "foundation-company-localization");
  const completedCount = domainList.filter((domain) => {
    const domainCheckpoints = checkpoints.filter((cp) => cp.domainId === domain.id);
    return domainCheckpoints.every((cp) => cp.status === "Pass" || cp.defermentFlag);
  }).length;

  return el("div", { className: "domain-progress" }, [
    el("h3", { text: "Domain Setup Progress" }),
    el("p", { className: "domain-progress__subtitle", text: `${completedCount} of ${domainList.length} areas configured` }),
    el("div", { className: "domain-progress__grid" },
      domainList.map((domain) => {
        const domainCheckpoints = checkpoints.filter((cp) => cp.domainId === domain.id);
        const isComplete = domainCheckpoints.every((cp) => cp.status === "Pass" || cp.defermentFlag);
        const isActive = domain.id === currentDomainId;
        const hasBlockers = domainCheckpoints.some((cp) => cp.status === "Fail" && !cp.defermentFlag);
        
        return el("button", {
          className: `domain-progress__item ${isActive ? "domain-progress__item--active" : ""} ${isComplete ? "domain-progress__item--complete" : ""} ${hasBlockers ? "domain-progress__item--blocked" : ""}`,
          onclick: () => onSelectDomain(domain.id)
        }, [
          el("span", { className: "domain-progress__name", text: domain.label }),
          isComplete
            ? el("span", { className: "domain-progress__status domain-progress__status--complete", text: "Complete" })
            : hasBlockers
              ? el("span", { className: "domain-progress__status domain-progress__status--blocked", text: "Needs Attention" })
              : el("span", { className: "domain-progress__status domain-progress__status--pending", text: "In Progress" })
        ]);
      })
    )
  ]);
}
