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
  updateProjectIdentity
} from "./state/app-store.js";
import { renderLayoutShell } from "./components/layout-shell.js";
import { renderConnectionPage } from "./views/connection-page.js";
import { renderDashboardView } from "./views/dashboard-view.js";
import { renderDecisionsReadinessView } from "./views/decisions-readiness-view.js";
import { renderDomainsView } from "./views/domains-view.js";
import { renderStagesView } from "./views/stages-view.js";

export function renderApp(root) {
  const render = () => {
    const focusSnapshot = captureRenderFocus(root);
    const { activeProject, notifications, projectStore } = getState();
    clearNode(root);

    // ── First-time user: show the non-technical connection page
    //    bypassing the full layout shell until they press Begin.
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
        onSelectDomain: (domainId) => setCurrentView("domains", domainId)
        ,
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
