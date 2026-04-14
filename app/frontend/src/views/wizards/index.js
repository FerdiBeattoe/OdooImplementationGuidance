import { renderAccountingWizard } from "./accounting-wizard.js";
import { renderCrmWizard } from "./crm-wizard.js";
import { renderMasterDataWizard } from "./master-data-wizard.js";
import { renderManufacturingWizard } from "./manufacturing-wizard.js";
import { renderPosWizard } from "./pos-wizard.js";
import { renderPurchaseWizard } from "./purchase-wizard.js";
import { renderSalesWizard } from "./sales-wizard.js";
import { renderUsersRolesWizard } from "./users-roles-wizard.js";
import { renderWebsiteEcommerceWizard } from "./website-ecommerce-wizard.js";

const GOVERNED_WIZARD_RENDERERS = Object.freeze({
  "accounting-setup": renderAccountingWizard,
  "crm-setup": renderCrmWizard,
  "master-data-setup": renderMasterDataWizard,
  "manufacturing-setup": renderManufacturingWizard,
  "pos-setup": renderPosWizard,
  "purchase-setup": renderPurchaseWizard,
  "sales-setup": renderSalesWizard,
  "users-access": renderUsersRolesWizard,
  "website-setup": renderWebsiteEcommerceWizard,
});

export function getGovernedWizardRenderer(wizardId, props = {}) {
  const renderWizard = GOVERNED_WIZARD_RENDERERS[wizardId];
  return typeof renderWizard === "function" ? renderWizard(props) : null;
}
