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

// ── New views ────────────────────────────────────────────────
import { renderImplementationDashboardView } from "./views/implementation-dashboard-view.js";
import { renderRoadmapView } from "./views/roadmap-view.js";
import { renderModuleSetupView } from "./wizards/module-wizards.js";
import { renderDataImportView } from "./views/data-import-view.js";
import { renderKnowledgeBaseView } from "./views/knowledge-base-view.js";
import { renderAnalyticsView } from "./views/analytics-view.js";
import { renderConnectionWizardView } from "./views/connection-wizard-view.js";

// ── Legacy views (keep for backward compatibility) ────────────
import { renderDashboardView } from "./views/dashboard-view.js";
import { renderDecisionsReadinessView } from "./views/decisions-readiness-view.js";
import { renderDomainsView } from "./views/domains-view.js";
import { renderStagesView } from "./views/stages-view.js";
import { renderWizardLauncherView } from "./views/wizard-launcher-view.js";

export function renderApp(root) {
  const render = () => {
    const focusSnapshot = captureRenderFocus(root);
    const { activeProject, notifications, projectStore } = getState();
    clearNode(root);

    const currentView = activeProject.workflowState?.currentView || "dashboard";

    // ── Connection wizard: show if not connected and on first view ──
    if (currentView === "connection-wizard") {
      root.append(
        renderConnectionWizardView({
          onConnect: async (credentials) => {
            await connectProject(credentials);
            if (getState().activeProject.connectionState?.status === "connected_execute") {
              setCurrentView("dashboard");
            }
          },
          onSkip: () => setCurrentView("dashboard")
        })
      );
      restoreRenderFocus(root, focusSnapshot);
      return;
    }

    const currentViewContent = renderCurrentView(activeProject, projectStore);
    const content = el("div", {}, [currentViewContent]);

    root.append(
      renderLayoutShell({
        project: { ...activeProject, savedProjects: projectStore.projects },
        content,
        notifications,
        onNavigate: (view) => setCurrentView(view),
        onSave: () => { void persistActiveProject(); },
        onResume: (projectId) => resumeProject(projectId),
        onConnect: (credentials) => { void connectProject(credentials); },
        onDisconnect: () => { void disconnectProject(); }
      })
    );

    restoreRenderFocus(root, focusSnapshot);
  };

  subscribe(render);
  render();
  void bootstrapStore();
}

function renderCurrentView(project, projectStore) {
  const currentView = project.workflowState?.currentView || "dashboard";

  // ── Implementation Platform Views ─────────────────────────
  switch (currentView) {
    case "implementation-roadmap":
      return renderRoadmapView({
        onNavigate: (view) => setCurrentView(view)
      });

    case "module-setup":
      return renderModuleSetupView({
        wizardId: null,
        onComplete: () => setCurrentView("module-setup"),
        onCancel: () => setCurrentView("module-setup"),
        onNavigate: (view) => setCurrentView(view)
      });

    case "data-import":
      return renderDataImportView({
        onNavigate: (view) => setCurrentView(view)
      });

    case "knowledge-base":
      return renderKnowledgeBaseView();

    case "analytics":
      return renderAnalyticsView({ project });
  }

  // ── Wizard routes ─────────────────────────────────────────
  if (currentView.startsWith("wizard-")) {
    const wizardId = currentView.replace("wizard-", "");
    return renderModuleSetupView({
      wizardId,
      onComplete: (data) => {
        addCompletedWizard(wizardId);
        setCurrentView("module-setup");
      },
      onCancel: () => setCurrentView("module-setup"),
      onNavigate: (view) => setCurrentView(view)
    });
  }

  // ── Legacy views ──────────────────────────────────────────
  switch (currentView) {
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
        onInspectDomain: (domainId) => { void inspectDomain(domainId); },
        onPreviewDomain: (domainId) => { void previewDomain(domainId); },
        onExecutePreview: (preview) => { void executePreview(preview); }
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
      // Use the new implementation dashboard
      return renderImplementationDashboardView({
        onNavigate: (view, id) => setCurrentView(view, id)
      });
  }
}
