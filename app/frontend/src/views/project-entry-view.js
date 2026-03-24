import {
  DEPLOYMENTS,
  EDITIONS,
  ODOO_VERSION,
  PROJECT_MODES,
  getCombinationError
} from "/shared/index.js";
import { el } from "../lib/dom.js";
import { renderBranchTargetPanel } from "../components/branch-target-panel.js";

export function renderProjectEntryView(project, onIdentityChange, onEnvironmentChange) {
  const combinationError = getCombinationError(project.projectIdentity);
  const deploymentExplanation = getDeploymentExplanation(project.projectIdentity.deployment, project.projectIdentity.edition);

  const versionInput = el("input", {
    value: ODOO_VERSION,
    disabled: "disabled"
  });

  const nameInput = textField("Project name", project.projectIdentity.projectName, (value) =>
    onIdentityChange({ projectName: value })
  );
  const organizationInput = textField("Organization", project.projectIdentity.organizationName, (value) =>
    onIdentityChange({ organizationName: value })
  );
  const ownerInput = textField("Project owner", project.projectIdentity.projectOwner, (value) =>
    onIdentityChange({ projectOwner: value })
  );
  const leadInput = textField("Implementation lead", project.projectIdentity.implementationLead, (value) =>
    onIdentityChange({ implementationLead: value })
  );

  const editionSelect = selectField("Edition", EDITIONS, project.projectIdentity.edition, (value) =>
    onIdentityChange({ edition: value })
  );
  const deploymentSelect = selectField("Deployment", DEPLOYMENTS, project.projectIdentity.deployment, (value) =>
    onIdentityChange({ deployment: value })
  );
  const modeSelect = selectField("Project mode", PROJECT_MODES, project.projectIdentity.projectMode, (value) =>
    onIdentityChange({ projectMode: value })
  );

  const localizationInput = textField("Localization context", project.environmentContext.localizationContext, (value) =>
    onEnvironmentChange({ localizationContext: value })
  );
  const scopeInput = textField("Module/domain scope summary", project.environmentContext.moduleScopeSummary, (value) =>
    onEnvironmentChange({ moduleScopeSummary: value })
  );

  return el("section", { className: "workspace" }, [
    el("header", { className: "workspace__header" }, [
      el("h2", { text: "Project Setup" }),
      el("p", {
        text:
          "Set the supported Odoo 19 target first. This screen defines project identity, deployment context, and project mode before governed workspaces open."
      })
    ]),
    el("section", { className: "panel panel--subtle" }, [
      el("h3", { text: "Deployment meaning" }),
      el("p", { text: deploymentExplanation })
    ]),
    el("div", { className: "entry-grid" }, [
      field("Version", versionInput),
      editionSelect,
      deploymentSelect,
      modeSelect,
      nameInput,
      organizationInput,
      ownerInput,
      leadInput,
      localizationInput,
      scopeInput
    ]),
    combinationError
      ? el("p", { className: "error-banner", text: combinationError })
      : el("p", {
          className: "info-banner",
          text: "Supported combination selected. Progression still depends on checkpoint evidence."
        }),
    renderBranchTargetPanel(project.environmentContext.target, (targetPatch) =>
      onEnvironmentChange({
        target: {
          ...project.environmentContext.target,
          ...targetPatch
        }
      })
    )
  ]);
}

function field(label, input) {
  return el("label", { className: "field" }, [el("span", { text: label }), input]);
}

function textField(label, value, onChange) {
  return field(
    label,
    el("input", {
      value,
      oninput: (event) => onChange(event.target.value)
    })
  );
}

function getDeploymentExplanation(deployment, edition) {
  if (deployment === "Odoo.sh") {
    return edition === "Enterprise"
      ? "Odoo.sh means Enterprise branch-aware hosting. It changes governance and targeting requirements, not connection capability in this build."
      : "Odoo.sh is supported for Enterprise only.";
  }

  if (deployment === "On-Premise") {
    return "On-Premise means the target system is self-hosted. In this build, that affects implementation context only and does not enable live database or API connection.";
  }

  return "Odoo Online means the target system is SaaS-hosted by Odoo. In this build, it defines implementation context only and does not enable live API or database connection.";
}

function selectField(label, options, selectedValue, onChange) {
  return field(
    label,
    el(
      "select",
      {
        onchange: (event) => onChange(event.target.value)
      },
      options.map((optionValue) => {
        const option = el("option", { value: optionValue, text: optionValue });
        option.selected = optionValue === selectedValue;
        return option;
      })
    )
  );
}
