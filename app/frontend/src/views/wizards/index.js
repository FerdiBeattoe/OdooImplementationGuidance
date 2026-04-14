import { renderCrmWizard } from "./crm-wizard.js";

const GOVERNED_WIZARD_RENDERERS = Object.freeze({
  "crm-setup": renderCrmWizard,
});

export function getGovernedWizardRenderer(wizardId, props = {}) {
  const renderWizard = GOVERNED_WIZARD_RENDERERS[wizardId];
  return typeof renderWizard === "function" ? renderWizard(props) : null;
}
