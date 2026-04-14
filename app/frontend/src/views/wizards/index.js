import { renderAccountingWizard } from "./accounting-wizard.js";
import { renderCrmWizard } from "./crm-wizard.js";
import { renderPurchaseWizard } from "./purchase-wizard.js";
import { renderSalesWizard } from "./sales-wizard.js";

const GOVERNED_WIZARD_RENDERERS = Object.freeze({
  "accounting-setup": renderAccountingWizard,
  "crm-setup": renderCrmWizard,
  "purchase-setup": renderPurchaseWizard,
  "sales-setup": renderSalesWizard,
});

export function getGovernedWizardRenderer(wizardId, props = {}) {
  const renderWizard = GOVERNED_WIZARD_RENDERERS[wizardId];
  return typeof renderWizard === "function" ? renderWizard(props) : null;
}
