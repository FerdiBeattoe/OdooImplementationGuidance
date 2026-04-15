import { renderAccountingReportsWizard } from "./accounting-reports-wizard.js";
import { renderAccountingWizard } from "./accounting-wizard.js";
import { renderAppraisalsWizard } from "./appraisals-wizard.js";
import { renderAttendanceWizard } from "./attendance-wizard.js";
import { renderApprovalsWizard } from "./approvals-wizard.js";
import { renderCalendarWizard } from "./calendar-wizard.js";
import { renderConsolidationWizard } from "./consolidation-wizard.js";
import { renderCrmWizard } from "./crm-wizard.js";
import { renderDiscussWizard } from "./discuss-wizard.js";
import { renderDocumentsWizard } from "./documents-wizard.js";
import { renderEmailMarketingWizard } from "./email-marketing-wizard.js";
import { renderEventsWizard } from "./events-wizard.js";
import { renderExpensesWizard } from "./expenses-wizard.js";
import { renderFieldServiceWizard } from "./field-service-wizard.js";
import { renderFleetWizard } from "./fleet-wizard.js";
import { renderHelpdeskWizard } from "./helpdesk-wizard.js";
import { renderHrWizard } from "./hr-wizard.js";
import { renderIncomingMailWizard } from "./incoming-mail-wizard.js";
import { renderInventoryWizard } from "./inventory-wizard.js";
import { renderIotWizard } from "./iot-wizard.js";
import { renderKnowledgeWizard } from "./knowledge-wizard.js";
import { renderLiveChatWizard } from "./live-chat-wizard.js";
import { renderLoyaltyWizard } from "./loyalty-wizard.js";
import { renderLunchWizard } from "./lunch-wizard.js";
import { renderMasterDataWizard } from "./master-data-wizard.js";
import { renderMaintenanceWizard } from "./maintenance-wizard.js";
import { renderManufacturingWizard } from "./manufacturing-wizard.js";
import { renderOutgoingMailWizard } from "./outgoing-mail-wizard.js";
import { renderPlmWizard } from "./plm-wizard.js";
import { renderPosWizard } from "./pos-wizard.js";
import { renderProjectsWizard } from "./projects-wizard.js";
import { renderPurchaseWizard } from "./purchase-wizard.js";
import { renderQualityWizard } from "./quality-wizard.js";
import { renderSalesWizard } from "./sales-wizard.js";
import { renderSignWizard } from "./sign-wizard.js";
import { renderSubscriptionsWizard } from "./subscriptions-wizard.js";
import { renderUsersRolesWizard } from "./users-roles-wizard.js";
import { renderWebsiteEcommerceWizard } from "./website-ecommerce-wizard.js";

const GOVERNED_WIZARD_RENDERERS = Object.freeze({
  "accounting-reports-setup": renderAccountingReportsWizard,
  "accounting-setup": renderAccountingWizard,
  "appraisals-setup": renderAppraisalsWizard,
  "attendance-setup": renderAttendanceWizard,
  "approvals-setup": renderApprovalsWizard,
  "calendar-setup": renderCalendarWizard,
  "consolidation-setup": renderConsolidationWizard,
  "crm-setup": renderCrmWizard,
  "discuss-setup": renderDiscussWizard,
  "documents-setup": renderDocumentsWizard,
  "email-marketing-setup": renderEmailMarketingWizard,
  "events-setup": renderEventsWizard,
  "expenses-setup": renderExpensesWizard,
  "field-service-setup": renderFieldServiceWizard,
  "fleet-setup": renderFleetWizard,
  "helpdesk-setup": renderHelpdeskWizard,
  "hr-setup": renderHrWizard,
  "incoming-mail-setup": renderIncomingMailWizard,
  "inventory-setup": renderInventoryWizard,
  "iot-setup": renderIotWizard,
  "knowledge-setup": renderKnowledgeWizard,
  "live-chat-setup": renderLiveChatWizard,
  "loyalty-setup": renderLoyaltyWizard,
  "lunch-setup": renderLunchWizard,
  "maintenance-setup": renderMaintenanceWizard,
  "master-data-setup": renderMasterDataWizard,
  "manufacturing-setup": renderManufacturingWizard,
  "outgoing-mail-setup": renderOutgoingMailWizard,
  "pos-setup": renderPosWizard,
  "plm-setup": renderPlmWizard,
  "projects-setup": renderProjectsWizard,
  "purchase-setup": renderPurchaseWizard,
  "quality-setup": renderQualityWizard,
  "sales-setup": renderSalesWizard,
  "sign-setup": renderSignWizard,
  "subscriptions-setup": renderSubscriptionsWizard,
  "users-access": renderUsersRolesWizard,
  "website-setup": renderWebsiteEcommerceWizard,
});

export function getGovernedWizardRenderer(wizardId, props = {}) {
  const renderWizard = GOVERNED_WIZARD_RENDERERS[wizardId];
  return typeof renderWizard === "function" ? renderWizard(props) : null;
}
