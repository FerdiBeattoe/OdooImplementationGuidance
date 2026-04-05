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

// ── Landing page & session routing ───────────────────────────
import {
  renderLandingPage,
  resolveSession,
  resolveLastActiveView,
  bootstrapSessionFromStorage,
  writeStoredProjectId,
  clearSession,
} from "./views/landing-page.js";

// ── New views ────────────────────────────────────────────────
import { renderImplementationDashboardView } from "./views/implementation-dashboard-view.js";
import { renderRoadmapView } from "./views/roadmap-view.js";
import { renderPipelineView } from "./views/pipeline-view.js";
import { renderPipelineDashboard, ONBOARDING_RESUME_ROUTE } from "./views/pipeline-dashboard.js";
import { pipelineStore } from "./state/pipeline-store.js";
import { renderModuleSetupView } from "./wizards/module-wizards.js";
import { renderDataImportView } from "./views/data-import-view.js";
import { renderKnowledgeBaseView } from "./views/knowledge-base-view.js";
import { renderAnalyticsView } from "./views/analytics-view.js";
import { renderConnectionWizardView } from "./views/connection-wizard-view.js";
import { renderOnboardingWizard } from "./views/onboarding-wizard.js";
import { onboardingStore } from "./state/onboarding-store.js";

// ── Legacy views (keep for backward compatibility) ────────────
import { renderDashboardView } from "./views/dashboard-view.js";
import { renderDecisionsReadinessView } from "./views/decisions-readiness-view.js";
import { renderDomainsView } from "./views/domains-view.js";
import { renderStagesView } from "./views/stages-view.js";
import { renderWizardLauncherView } from "./views/wizard-launcher-view.js";

// ---------------------------------------------------------------------------
// Re-export session helpers so callers can import from app.js directly.
// The canonical implementations live in landing-page.js to keep that module
// testable without the app-store dependency chain.
// ---------------------------------------------------------------------------
export {
  SESSION_STORAGE_KEY,
  readStoredProjectId,
  writeStoredProjectId,
  clearSession,
  bootstrapSessionFromStorage,
  resolveRouteView,
} from "./views/landing-page.js";

export { ONBOARDING_RESUME_ROUTE } from "./views/pipeline-dashboard.js";

export function handleAppNavigation(view) {
  if (!view) return;

  if (view === ONBOARDING_RESUME_ROUTE) {
    onboardingStore.resumeAtQuestions();
    setCurrentView("onboarding");
    return;
  }

  setCurrentView(view);
}

export function renderApp(root) {
  // Bootstrap from localStorage before first render
  bootstrapSessionFromStorage();
  let forceLandingOnColdLoad = true;

  const render = () => {
    // Guard: if a text or numeric input currently has focus inside the root,
    // skip the re-render. Onboarding wizard text/numeric fields commit to store
    // only on blur; re-rendering while typing destroys the input and loses focus.
    // The blur event fires before the click event, so deferring re-render until
    // after blur+click prevents the Next button from being destroyed mid-click.
    const _focused = root?.ownerDocument?.activeElement;
    if (_focused && (_focused.tagName === "INPUT" || _focused.tagName === "TEXTAREA") && root.contains(_focused)) {
      return;
    }

    const focusSnapshot = captureRenderFocus(root);
    const { activeProject, notifications, projectStore } = getState();
    clearNode(root);

    const requestedView = activeProject.workflowState?.currentView || "dashboard";
    const rawView = forceLandingOnColdLoad ? "landing" : requestedView;

    // ── Persist project_id to localStorage whenever a session becomes available
    const _currentSession = resolveSession();
    if (_currentSession) {
      writeStoredProjectId(_currentSession);
    }

    // ── Landing page: render without layout shell ─────────────────────────
    if (rawView === "landing") {
      const session = resolveSession();
      // Write session to localStorage whenever we have one
      if (session) writeStoredProjectId(session);
      root.append(
        renderLandingPage({
          noSessionMessage: null,
          onStart: () => {
            // clearSession before setting forceLandingOnColdLoad=false so the
            // intermediate render from pipelineStore.reset() sees rawView="landing"
            // and re-renders the landing page rather than taking the protected-route
            // no-session path, preventing the wizard from stacking under the page.
            clearSession();
            forceLandingOnColdLoad = false;
            setCurrentView("onboarding");
          },
          onContinue: (projectId) => {
            forceLandingOnColdLoad = false;
            if (projectId) {
              writeStoredProjectId(projectId);
              const lastView = resolveLastActiveView();
              if (lastView === "onboarding") {
                onboardingStore.resumeAtQuestions();
              }
              setCurrentView(lastView);
            } else {
              onboardingStore.resumeAtQuestions();
              setCurrentView("onboarding");
            }
          }
        })
      );
      restoreRenderFocus(root, focusSnapshot);
      return;
    }

    // ── Onboarding wizard: render without layout shell ────────────────────
    if (rawView === "onboarding") {
      root.append(
        renderOnboardingWizard({
          onComplete: ({ projectId, runtimeState } = {}) => {
            if (runtimeState != null) {
              pipelineStore.setRuntimeState(runtimeState);
            } else if (projectId) {
              void pipelineStore.loadPipelineState(projectId);
            }
            setCurrentView("pipeline-dashboard");
          },
          onNavigate: (view) => handleAppNavigation(view),
        })
      );
      restoreRenderFocus(root, focusSnapshot);
      return;
    }

    // ── Protected route guard: pipeline/dashboard require a session ───────
    if (rawView === "pipeline" || rawView === "pipeline-dashboard" || rawView === "dashboard") {
      const session = resolveSession();
      if (session) {
        writeStoredProjectId(session);
      } else {
        root.append(
          renderLandingPage({
            noSessionMessage: "Start your implementation to access the dashboard",
            onStart: () => {
              clearSession();
              forceLandingOnColdLoad = false;
              setCurrentView("onboarding");
            },
            onContinue: () => {
              forceLandingOnColdLoad = false;
              onboardingStore.resumeAtQuestions();
              setCurrentView("onboarding");
            }
          })
        );
        restoreRenderFocus(root, focusSnapshot);
        return;
      }
    }

    const currentView = rawView;

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
        onNavigate: (view) => handleAppNavigation(view),
        onSave: () => { void persistActiveProject(); },
        onResume: (projectId) => resumeProject(projectId),
        onConnect: (credentials) => { void connectProject(credentials); },
        onDisconnect: () => { void disconnectProject(); }
      })
    );

    restoreRenderFocus(root, focusSnapshot);
  };

  subscribe(render);
  pipelineStore.subscribe(render);
  render();
  void bootstrapStore();
}

function renderCurrentView(project, projectStore) {
  const currentView = project.workflowState?.currentView || "dashboard";

  // ── Implementation Platform Views ─────────────────────────
  switch (currentView) {
    case "landing":
      return renderLandingPage({
        onStart: () => {
          clearSession();
          setCurrentView("onboarding");
        },
        onContinue: (projectId) => {
          if (projectId) {
            writeStoredProjectId(projectId);
            setCurrentView(resolveLastActiveView());
          } else {
            setCurrentView("onboarding");
          }
        }
      });

    case "implementation-roadmap":
      return renderRoadmapView({
        onNavigate: (view) => setCurrentView(view)
      });

    case "pipeline":
      return renderPipelineView({
        onRun:     (payload)            => { void pipelineStore.runPipeline(payload); },
        onLoad:    (projectId)          => { void pipelineStore.loadPipelineState(projectId); },
        onResume:  (projectId)          => { void pipelineStore.resumePipelineState(projectId); },
        onApply:   (payload)            => { void pipelineStore.applyGoverned(payload); },
        onSave:    (runtimeState)       => { void pipelineStore.savePipelineState(runtimeState); },
        onConnect: (projectId, creds)   => { void pipelineStore.registerPipelineConnection(projectId, creds); },
      });

    case "pipeline-dashboard":
      return renderPipelineDashboard({
        onNavigate: (view)        => handleAppNavigation(view),
        onRun:      (payload)     => { void pipelineStore.runPipeline(payload); },
        onLoad:     (projectId)   => { void pipelineStore.loadPipelineState(projectId); },
        onApply:    (payload)     => { void pipelineStore.applyGoverned(payload); },
        onSave:     (runtimeState)=> { void pipelineStore.savePipelineState(runtimeState); },
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
        onPreviewDomain: (domainId) => { void previewDomain(domainId); }
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
