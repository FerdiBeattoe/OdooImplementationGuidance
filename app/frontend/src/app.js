import { clearNode, el } from "./lib/dom.js";
import { captureRenderFocus, restoreRenderFocus } from "./lib/render-focus.js";
import {
  addAccountingConfiguration,
  addCrmConfiguration,
  addManufacturingConfiguration,
  addMasterDataConfiguration,
  addPosConfiguration,
  addPurchaseConfiguration,
  addSalesConfiguration,
  addInventoryConfiguration,
  addWebsiteEcommerceConfiguration,
  bootstrapStore,
  connectProject,
  deferCheckpoint,
  disconnectProject,
  executePreview,
  getAccountingConfigurationModel,
  getAccountingCheckpointGroups,
  inspectDomain,
  getCrmCheckpointGroups,
  getCrmConfigurationModel,
  getDocumentsCheckpointGroups,
  getHrCheckpointGroups,
  getInventoryCheckpointGroups,
  getMasterDataConfigurationModel,
  getManufacturingCheckpointGroups,
  getManufacturingConfigurationModel,
  getInventoryConfigurationModel,
  getPosCheckpointGroups,
  getPosConfigurationModel,
  getProjectsCheckpointGroups,
  getPurchaseConfigurationModel,
  getPurchaseCheckpointGroups,
  getQualityCheckpointGroups,
  getProjectSummary,
  getSalesConfigurationModel,
  getScaffoldCheckpointGroups,
  getSalesCheckpointGroups,
  getSignCheckpointGroups,
  getState,
  previewDomain,
  getApprovalsCheckpointGroups,
  getPlmCheckpointGroups,
  getWebsiteEcommerceCheckpointGroups,
  getWebsiteEcommerceConfigurationModel,
  persistActiveProject,
  resumeProject,
  setCurrentView,
  openDashboardSection,
  subscribe,
  updateAccountingConfiguration,
  updateAccountingEvidence,
  updateCheckpoint,
  updateCrmConfiguration,
  updateCrmEvidence,
  updateEnvironmentContext,
  updateInventoryConfiguration,
  updateInventoryEvidence,
  updateManufacturingConfiguration,
  updateMasterDataConfiguration,
  updateManufacturingEvidence,
  updatePosConfiguration,
  updatePosEvidence,
  updatePurchaseConfiguration,
  updatePurchaseEvidence,
  updateSalesConfiguration,
  updateSalesEvidence,
  updateWebsiteEcommerceConfiguration,
  updateWebsiteEcommerceEvidence,
  updateProjectIdentity,
  addCompletedWizard
} from "./state/app-store.js";
import { renderLayoutShell } from "./components/layout-shell.js";
import { renderConnectionPage } from "./views/connection-page.js";
import { renderDashboardView } from "./views/dashboard-view.js";
import { renderDecisionsReadinessView } from "./views/decisions-readiness-view.js";
import { renderDomainsView } from "./views/domains-view.js";
import { renderStagesView } from "./views/stages-view.js";
import { renderWizardLauncherView } from "./views/wizard-launcher-view.js";

// Import wizards
import { renderDatabaseCreationWizard } from "../../../src/wizards/DatabaseCreationWizard.js";
import { renderCompanySetupWizard } from "../../../src/wizards/CompanySetupWizard.js";
import { renderMasterDataWizard } from "../../../src/wizards/MasterDataWizard.js";
import { renderCrmSetupWizard } from "../../../src/wizards/operations/CrmSetupWizard.js";
import { renderSalesSetupWizard } from "../../../src/wizards/operations/SalesSetupWizard.js";
import { renderInventorySetupWizard } from "../../../src/wizards/operations/InventorySetupWizard.js";
import { renderPurchaseSetupWizard } from "../../../src/wizards/operations/PurchaseSetupWizard.js";
import { renderManufacturingSetupWizard } from "../../../src/wizards/manufacturing/ManufacturingSetupWizard.js";
import { renderAccountingSetupWizard } from "../../../src/wizards/finance/AccountingSetupWizard.js";
import { renderGoLiveReadinessWizard } from "../../../src/wizards/finance/GoLiveReadinessWizard.js";

export function renderApp(root) {
  const render = () => {
    const focusSnapshot = captureRenderFocus(root);
    const { activeProject, notifications, projectStore } = getState();
    clearNode(root);

    // First-time user: show the non-technical connection page
    const isFirstVisit = !activeProject.projectIdentity.projectName &&
      activeProject.workflowState.currentView === "dashboard";

    if (isFirstVisit) {
      root.append(
        renderConnectionPage(
          activeProject,
          (identityPatch) => updateProjectIdentity(identityPatch),
          (envPatch) => updateEnvironmentContext(envPatch),
          () => setCurrentView("dashboard")
        )
      );
      restoreRenderFocus(root, focusSnapshot);
      return;
    }

    const currentViewContent = renderCurrentView(activeProject);
    const content = el("div", {}, [currentViewContent]);

    root.append(
      renderLayoutShell({
        project: { ...activeProject, savedProjects: projectStore.projects },
        content,
        notifications,
        onNavigate: (view) => setCurrentView(view),
        onSave: () => {
          void persistActiveProject();
        },
        onResume: (projectId) => resumeProject(projectId),
        onConnect: (credentials) => {
          void connectProject(credentials);
        },
        onDisconnect: () => {
          void disconnectProject();
        }
      })
    );

    restoreRenderFocus(root, focusSnapshot);
  };

  subscribe(render);
  void bootstrapStore().then(render);
  render();
}

function renderCurrentView(project) {
  // Wizard routes
  if (project.workflowState.currentView.startsWith("wizard-")) {
    const wizardId = project.workflowState.currentView.replace("wizard-", "");
    return renderWizardView(project, wizardId);
  }

  switch (project.workflowState.currentView) {
    case "stages":
      return renderStagesView(project, (stageId) => setCurrentView("stages", stageId));
    case "domains":
      return renderDomainsView({
        project,
        scaffoldGroups: getScaffoldCheckpointGroups(project.workflowState.currentDomainId),
        manufacturingGroups: getManufacturingCheckpointGroups(),
        manufacturingConfigurationSections: getManufacturingConfigurationModel(),
        masterDataConfigurationSections: getMasterDataConfigurationModel(),
        crmGroups: getCrmCheckpointGroups(),
        crmConfigurationSections: getCrmConfigurationModel(),
        websiteGroups: getWebsiteEcommerceCheckpointGroups(),
        websiteConfigurationSections: getWebsiteEcommerceConfigurationModel(),
        posGroups: getPosCheckpointGroups(),
        posConfigurationSections: getPosConfigurationModel(),
        projectsGroups: getProjectsCheckpointGroups(),
        hrGroups: getHrCheckpointGroups(),
        plmGroups: getPlmCheckpointGroups(),
        qualityGroups: getQualityCheckpointGroups(),
        documentsGroups: getDocumentsCheckpointGroups(),
        signGroups: getSignCheckpointGroups(),
        approvalsGroups: getApprovalsCheckpointGroups(),
        purchaseGroups: getPurchaseCheckpointGroups(),
        purchaseConfigurationSections: getPurchaseConfigurationModel(),
        salesGroups: getSalesCheckpointGroups(),
        salesConfigurationSections: getSalesConfigurationModel(),
        accountingGroups: getAccountingCheckpointGroups(),
        accountingConfigurationSections: getAccountingConfigurationModel(),
        inventoryGroups: getInventoryCheckpointGroups(),
        inventoryConfigurationSections: getInventoryConfigurationModel(),
        onUpdateCheckpoint: updateCheckpoint,
        onDeferCheckpoint: deferCheckpoint,
        onAddManufacturingConfiguration: addManufacturingConfiguration,
        onAddMasterDataConfiguration: addMasterDataConfiguration,
        onAddCrmConfiguration: addCrmConfiguration,
        onAddWebsiteEcommerceConfiguration: addWebsiteEcommerceConfiguration,
        onAddPosConfiguration: addPosConfiguration,
        onAddSalesConfiguration: addSalesConfiguration,
        onAddPurchaseConfiguration: addPurchaseConfiguration,
        onAddAccountingConfiguration: addAccountingConfiguration,
        onAddInventoryConfiguration: addInventoryConfiguration,
        onUpdateManufacturingConfiguration: updateManufacturingConfiguration,
        onUpdateMasterDataConfiguration: updateMasterDataConfiguration,
        onUpdateCrmConfiguration: updateCrmConfiguration,
        onUpdateWebsiteEcommerceConfiguration: updateWebsiteEcommerceConfiguration,
        onUpdatePosConfiguration: updatePosConfiguration,
        onUpdateSalesConfiguration: updateSalesConfiguration,
        onUpdatePurchaseConfiguration: updatePurchaseConfiguration,
        onUpdateManufacturingEvidence: updateManufacturingEvidence,
        onUpdateCrmEvidence: updateCrmEvidence,
        onUpdateWebsiteEcommerceEvidence: updateWebsiteEcommerceEvidence,
        onUpdatePosEvidence: updatePosEvidence,
        onUpdatePurchaseEvidence: updatePurchaseEvidence,
        onUpdateSalesEvidence: updateSalesEvidence,
        onUpdateAccountingConfiguration: updateAccountingConfiguration,
        onUpdateAccountingEvidence: updateAccountingEvidence,
        onUpdateInventoryConfiguration: updateInventoryConfiguration,
        onUpdateInventoryEvidence: updateInventoryEvidence,
        onSelectDomain: (domainId) => setCurrentView("domains", domainId),
        onInspectDomain: (domainId) => {
          void inspectDomain(domainId);
        },
        onPreviewDomain: (domainId) => {
          void previewDomain(domainId);
        },
        onExecutePreview: (preview) => {
          void executePreview(preview);
        }
      });
    case "decisions":
      return renderDecisionsReadinessView(project);
    case "wizard-launcher":
      return renderWizardLauncherView(
        project,
        (wizardId) => setCurrentView(`wizard-${wizardId}`),
        () => setCurrentView("dashboard")
      );
    case "dashboard":
    default:
      return renderDashboardView({
        project,
        summary: getProjectSummary(),
        onNavigate: (view, id) => setCurrentView(view, id),
        onSelectDashboardSection: openDashboardSection,
        onProjectIdentityChange: updateProjectIdentity,
        onEnvironmentChange: updateEnvironmentContext,
        onSave: () => {
          void persistActiveProject();
        },
        onResume: (projectId) => resumeProject(projectId),
        onConnect: (credentials) => {
          void connectProject(credentials);
        },
        onDisconnect: () => {
          void disconnectProject();
        }
      });
  }
}

function renderWizardView(project, wizardId) {
  const wizardProps = {
    project,
    onComplete: () => {
      addCompletedWizard(wizardId);
      setCurrentView("wizard-launcher");
    },
    onCancel: () => setCurrentView("wizard-launcher"),
    onNavigate: (view) => setCurrentView(view)
  };

  switch (wizardId) {
    case "database-creation":
      return renderDatabaseCreationWizard(wizardProps);
    case "company-setup":
      return renderCompanySetupWizard(wizardProps);
    case "master-data":
      return renderMasterDataWizard(wizardProps);
    case "crm-setup":
      return renderCrmSetupWizard(wizardProps);
    case "sales-setup":
      return renderSalesSetupWizard(wizardProps);
    case "inventory-setup":
      return renderInventorySetupWizard(wizardProps);
    case "purchase-setup":
      return renderPurchaseSetupWizard(wizardProps);
    case "manufacturing-setup":
      return renderManufacturingSetupWizard(wizardProps);
    case "accounting-setup":
      return renderAccountingSetupWizard(wizardProps);
    case "go-live-readiness":
      return renderGoLiveReadinessWizard(wizardProps);
    default:
      return el("div", { className: "error" }, [
        el("h2", { text: "Wizard Not Found" }),
        el("p", { text: `The wizard "${wizardId}" is not available.` }),
        el("button", { text: "Return to Dashboard", onclick: () => setCurrentView("dashboard") })
      ]);
  }
}
