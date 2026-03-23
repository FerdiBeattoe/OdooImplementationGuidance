import { TARGET_STATUSES } from "/shared/index.js";
import { el } from "../lib/dom.js";

export function renderBranchTargetPanel(target, onUpdate) {
  if (!target.enabled) {
    return el("section", { className: "branch-target branch-target--inactive" }, [
      el("h3", { text: "Odoo.sh Targeting" }),
      el("p", { text: "Branch/environment targeting is not required for the current edition and deployment." })
    ]);
  }

  const environmentInput = el("input", {
    value: target.targetEnvironment,
    placeholder: "Production / Staging / Dev",
    oninput: (event) => onUpdate({ targetEnvironment: event.target.value })
  });
  const branchInput = el("input", {
    value: target.targetBranch,
    placeholder: "target branch",
    oninput: (event) => onUpdate({ targetBranch: event.target.value })
  });
  const statusSelect = el(
    "select",
    {
      onchange: (event) => onUpdate({ targetStatus: event.target.value })
    },
    TARGET_STATUSES.map((status) => {
      const option = el("option", { value: status, text: status });
      option.selected = status === target.targetStatus;
      return option;
    })
  );

  const evidenceCheckbox = el("input", {
    type: "checkbox",
    onchange: (event) => onUpdate({ evidenceIsEnvironmentSpecific: event.target.checked })
  });
  evidenceCheckbox.checked = target.evidenceIsEnvironmentSpecific;

  return el("section", { className: "branch-target" }, [
    el("h3", { text: "Odoo.sh Branch / Environment Target" }),
    el("p", {
      text:
        "Production and non-production targets are not interchangeable. Deployment-sensitive checkpoints remain conditional or blocked until target context is explicit."
    }),
    field("Target environment", environmentInput),
    field("Target branch", branchInput),
    field("Target status", statusSelect),
    field("Evidence is environment-specific", evidenceCheckbox)
  ]);
}

function field(label, input) {
  return el("label", { className: "branch-target__field" }, [el("span", { text: label }), input]);
}
