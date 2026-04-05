import {
  ACCOUNTING_CHECKPOINT_GROUPS,
  addAccountingConfigurationRecord,
  addCrmConfigurationRecord,
  addManufacturingConfigurationRecord,
  addMasterDataConfigurationRecord,
  addPosConfigurationRecord,
  addPurchaseConfigurationRecord,
  addSalesConfigurationRecord,
  addWebsiteEcommerceConfigurationRecord,
  updateCrmEvidenceRecord,
  updateManufacturingEvidenceRecord,
  updatePosEvidenceRecord,
  updatePurchaseEvidenceRecord,
  updateSalesEvidenceRecord,
  updateAccountingEvidenceRecord,
  addInventoryConfigurationRecord,
  classifyActionSafety,
  createInitialProjectState,
  deferCheckpointRecord,
  CRM_CHECKPOINT_GROUPS,
  DOCUMENTS_CHECKPOINT_GROUPS,
  FOUNDATION_CHECKPOINT_GROUPS,
  getAccountingConfigurationSections,
  getCrmConfigurationSections,
  getCheckpointDefermentEligibility,
  getInventoryConfigurationSections,
  getMasterDataConfigurationSections,
  getManufacturingConfigurationSections,
  MANUFACTURING_CHECKPOINT_GROUPS,
  getPosConfigurationSections,
  getPurchaseConfigurationSections,
  PURCHASE_CHECKPOINT_GROUPS,
  PROJECTS_CHECKPOINT_GROUPS,
  APPROVALS_CHECKPOINT_GROUPS,
  getSalesConfigurationSections,
  getWebsiteEcommerceConfigurationSections,
  INVENTORY_CHECKPOINT_GROUPS,
  MASTER_DATA_CHECKPOINT_GROUPS,
  normalizeProjectState,
  normalizeProjectStorePayload,
  PLM_CHECKPOINT_GROUPS,
  SALES_CHECKPOINT_GROUPS,
  SIGN_CHECKPOINT_GROUPS,
  summarizeCheckpoints,
  updateAccountingConfigurationRecord,
  updateCrmConfigurationRecord,
  updateInventoryConfigurationRecord,
  updateManufacturingConfigurationRecord,
  updateMasterDataConfigurationRecord,
  updatePosConfigurationRecord,
  updatePurchaseConfigurationRecord,
  updateSalesConfigurationRecord,
  updateInventoryEvidenceRecord,
  updateCheckpointRecord,
  updateWebsiteEcommerceConfigurationRecord,
  updateWebsiteEcommerceEvidenceRecord,
  WEBSITE_ECOMMERCE_CHECKPOINT_GROUPS,
  QUALITY_CHECKPOINT_GROUPS,
  HR_CHECKPOINT_GROUPS,
  getProjectStoreRecordId,
  USERS_SECURITY_CHECKPOINT_GROUPS,
  validateProjectSetup,
  validateStateShape,
  getCombinationError
} from "/shared/index.js";
import {
  connectProject as connectProjectRequest,
  disconnectProject as disconnectProjectRequest,
  inspectDomain as inspectDomainRequest,
  loadProjectStore,
  previewDomain as previewDomainRequest,
  saveProjectStore,
  validateConnection as validateConnectionRequest
} from "./persistence.js";

const listeners = new Set();

const state = {
  projectStore: { projects: [], savedAt: null },
  activeProject: createInitialProjectState(),
  notifications: []
};

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

export async function connectProject(credentials) {
  // Store credentials attempt (password will be cleared after, others preserved)
  state.activeProject = normalizeProjectState({
    ...state.activeProject,
    _connectionAttempt: {
      url: credentials.url,
      database: credentials.database,
      username: credentials.username,
      // Password NOT stored for security
      attemptedAt: new Date().toISOString()
    }
  });

  try {
    state.activeProject = normalizeProjectState(await connectProjectRequest(state.activeProject, credentials));
    // Clear connection attempt on success - credentials no longer needed
    state.activeProject._connectionAttempt = null;
    pushNotification("Live Odoo connection established.", "success");
  } catch (error) {
    // Preserve credentials for retry (except password)
    state.activeProject = normalizeProjectState({
      ...state.activeProject,
      connectionState: {
        ...state.activeProject.connectionState,
        status: "failed",
        lastError: error.message,
        lastErrorAt: new Date().toISOString(),
        errorDetails: categorizeConnectionError(error.message)
      }
    });
    pushNotification(`Connection failed: ${error.message}`, "error");
  }
  notify();
}

/**
 * Categorize connection errors for user-friendly messaging
 */
function categorizeConnectionError(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('authentication') || lowerMsg.includes('login') || lowerMsg.includes('password')) {
    return {
      category: 'authentication',
      userMessage: 'Invalid username or password. Please check your credentials.',
      preserveFields: ['url', 'database', 'username']
    };
  }
  
  if (lowerMsg.includes('database') || lowerMsg.includes('db')) {
    return {
      category: 'database',
      userMessage: 'Database not found. Please verify the database name.',
      preserveFields: ['url', 'username']
    };
  }
  
  if (lowerMsg.includes('url') || lowerMsg.includes('host') || lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
    return {
      category: 'url',
      userMessage: 'Cannot reach Odoo server. Please check the URL and ensure the server is accessible.',
      preserveFields: ['database', 'username']
    };
  }
  
  if (lowerMsg.includes('version') || lowerMsg.includes('unsupported')) {
    return {
      category: 'version',
      userMessage: 'This guide only supports Odoo 19. Please connect to an Odoo 19 instance.',
      preserveFields: ['url', 'database', 'username']
    };
  }
  
  if (lowerMsg.includes('https') || lowerMsg.includes('ssl') || lowerMsg.includes('tls')) {
    return {
      category: 'https',
      userMessage: 'HTTPS connection required. Please ensure your Odoo instance uses HTTPS.',
      preserveFields: ['url', 'database', 'username']
    };
  }
  
  return {
    category: 'unknown',
    userMessage: 'Connection failed. Please check all fields and try again.',
    preserveFields: ['url', 'database', 'username']
  };
}

/**
 * Get stored connection attempt for form pre-fill
 */
export function getConnectionAttempt() {
  return state.activeProject?._connectionAttempt || null;
}

/**
 * Clear connection attempt data
 */
export function clearConnectionAttempt() {
  state.activeProject = normalizeProjectState({
    ...state.activeProject,
    _connectionAttempt: null
  });
  notify();
}

export async function disconnectProject() {
  try {
    state.activeProject = normalizeProjectState(await disconnectProjectRequest(state.activeProject));
    pushNotification("Live Odoo connection removed.", "success");
  } catch (error) {
    pushNotification(error.message, "error");
  }
  notify();
}

export async function inspectDomain(domainId) {
  try {
    state.activeProject = normalizeProjectState(await inspectDomainRequest(state.activeProject, domainId));
    pushNotification(`Inspection completed for ${domainId}.`, "success");
  } catch (error) {
    pushNotification(error.message, "error");
  }
  notify();
}

export async function previewDomain(domainId) {
  try {
    state.activeProject = normalizeProjectState(await previewDomainRequest(state.activeProject, domainId));
    pushNotification(`Preview generated for ${domainId}.`, "success");
  } catch (error) {
    pushNotification(error.message, "error");
  }
  notify();
}

export async function bootstrapStore() {
  try {
    state.projectStore = normalizeProjectStorePayload(await loadProjectStore());

    // Auto-resume the most recently saved project to survive refresh
    const projects = state.projectStore.projects || [];
    if (projects.length > 0 && !state.activeProject.projectIdentity?.projectId) {
      const mostRecent = projects[0]; // projects are ordered newest first
      state.activeProject = normalizeProjectState(mostRecent);
      // Sync governed captures to implementationStore for cross-wizard dropdowns
      syncGovernedToImplementationStore();
    }

    notify();

    // Validate connection health after restore — don't block bootstrap on this
    const connStatus = state.activeProject?.connectionState?.status || "not_connected";
    if (connStatus.startsWith("connected")) {
      try {
        const validation = await validateConnectionRequest(state.activeProject);
        if (!validation.valid) {
          // Connection is stale — update state truthfully
          state.activeProject = normalizeProjectState({
            ...state.activeProject,
            connectionState: {
              ...state.activeProject.connectionState,
              status: "not_connected",
              capabilityLevel: "manual-only",
              lastError: validation.reason || "Connection expired.",
              lastErrorAt: new Date().toISOString(),
              availableFeatures: { inspect: false, preview: false, execute: false }
            }
          });
          pushNotification("Previous Odoo connection expired. Please reconnect.", "warning");
          notify();
        }
      } catch {
        // Validation endpoint unreachable — degrade gracefully
        // Don't clear connection state since backend may just be starting up
      }
    }
  } catch (error) {
    pushNotification(error.message, "error");
  }
}

export function updateProjectIdentity(patch) {
  const nextState = normalizeProjectState({
    ...state.activeProject,
    projectIdentity: {
      ...state.activeProject.projectIdentity,
      ...patch
    }
  });

  const validationError = validateProjectSetup(nextState.projectIdentity);
  state.activeProject = nextState;

  if (validationError) {
    pushNotification(validationError, "error");
  }

  syncBranchCheckpoint();
  notify();
}

export function updateEnvironmentContext(patch) {
  state.activeProject = normalizeProjectState({
    ...state.activeProject,
    environmentContext: {
      ...state.activeProject.environmentContext,
      ...patch,
      target: {
        ...state.activeProject.environmentContext.target,
        ...(patch.target || {})
      }
    }
  });
  syncBranchCheckpoint();
  notify();
}

export function updateCheckpoint(checkpointId, patch) {
  state.activeProject = updateCheckpointRecord(state.activeProject, checkpointId, patch);

  const checkpoint = state.activeProject.checkpoints.find((item) => item.id === checkpointId);
  const actionSafety = classifyActionSafety("advance-checkpoint", {
    checkpointBlocked: checkpoint?.status === "Fail"
  });

  if (actionSafety.safety === "blocked") {
    pushNotification(actionSafety.reason, "error");
  }

  notify();
}

export function deferCheckpoint(checkpointId, deferment) {
  const result = deferCheckpointRecord(state.activeProject, checkpointId, deferment);
  state.activeProject = result.state;

  if (result.error) {
    pushNotification(result.error, "error");
    notify();
    return false;
  }

  pushNotification("Checkpoint deferment recorded.", "success");
  notify();
  return true;
}

export function addInventoryConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addInventoryConfigurationRecord(state.activeProject, sectionId));
  pushNotification("Inventory capture row added.", "success");
  notify();
}

export function addAccountingConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addAccountingConfigurationRecord(state.activeProject, sectionId));
  pushNotification("Accounting capture row added.", "success");
  notify();
}

export function addSalesConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addSalesConfigurationRecord(state.activeProject, sectionId));
  pushNotification("Sales capture row added.", "success");
  notify();
}

export function addCrmConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addCrmConfigurationRecord(state.activeProject, sectionId));
  pushNotification("CRM capture row added.", "success");
  notify();
}

export function addPurchaseConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addPurchaseConfigurationRecord(state.activeProject, sectionId));
  pushNotification("Purchase capture row added.", "success");
  notify();
}

export function addManufacturingConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addManufacturingConfigurationRecord(state.activeProject, sectionId));
  pushNotification("Manufacturing capture row added.", "success");
  notify();
}

export function addMasterDataConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addMasterDataConfigurationRecord(state.activeProject, sectionId));
  pushNotification("Master Data capture row added.", "success");
  notify();
}

export function updateInventoryConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(updateInventoryConfigurationRecord(state.activeProject, sectionId, recordKey, patch));
  notify();
}

export function updateAccountingConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(updateAccountingConfigurationRecord(state.activeProject, sectionId, recordKey, patch));
  notify();
}

export function updateSalesConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(updateSalesConfigurationRecord(state.activeProject, sectionId, recordKey, patch));
  notify();
}

export function updateCrmConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(updateCrmConfigurationRecord(state.activeProject, sectionId, recordKey, patch));
  notify();
}

export function updatePurchaseConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(updatePurchaseConfigurationRecord(state.activeProject, sectionId, recordKey, patch));
  notify();
}

export function updateManufacturingConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(
    updateManufacturingConfigurationRecord(state.activeProject, sectionId, recordKey, patch)
  );
  notify();
}

export function updateMasterDataConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(
    updateMasterDataConfigurationRecord(state.activeProject, sectionId, recordKey, patch)
  );
  notify();
}

export function addWebsiteEcommerceConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addWebsiteEcommerceConfigurationRecord(state.activeProject, sectionId));
  pushNotification("Website / eCommerce capture row added.", "success");
  notify();
}

export function updateWebsiteEcommerceConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(
    updateWebsiteEcommerceConfigurationRecord(state.activeProject, sectionId, recordKey, patch)
  );
  notify();
}

export function addPosConfiguration(sectionId) {
  state.activeProject = normalizeProjectState(addPosConfigurationRecord(state.activeProject, sectionId));
  pushNotification("POS capture row added.", "success");
  notify();
}

export function updatePosConfiguration(sectionId, recordKey, patch) {
  state.activeProject = normalizeProjectState(updatePosConfigurationRecord(state.activeProject, sectionId, recordKey, patch));
  notify();
}

export function updatePurchaseEvidence(checkpointId, patch) {
  state.activeProject = normalizeProjectState(updatePurchaseEvidenceRecord(state.activeProject, checkpointId, patch));
  notify();
}

export function updateSalesEvidence(checkpointId, patch) {
  state.activeProject = normalizeProjectState(updateSalesEvidenceRecord(state.activeProject, checkpointId, patch));
  notify();
}

export function updateCrmEvidence(checkpointId, patch) {
  state.activeProject = normalizeProjectState(updateCrmEvidenceRecord(state.activeProject, checkpointId, patch));
  notify();
}

export function updateAccountingEvidence(checkpointId, patch) {
  state.activeProject = normalizeProjectState(updateAccountingEvidenceRecord(state.activeProject, checkpointId, patch));
  notify();
}

export function updateManufacturingEvidence(checkpointId, patch) {
  state.activeProject = normalizeProjectState(updateManufacturingEvidenceRecord(state.activeProject, checkpointId, patch));
  notify();
}

export function updateInventoryEvidence(checkpointId, patch) {
  state.activeProject = normalizeProjectState(updateInventoryEvidenceRecord(state.activeProject, checkpointId, patch));
  notify();
}

export function updateWebsiteEcommerceEvidence(checkpointId, patch) {
  state.activeProject = normalizeProjectState(updateWebsiteEcommerceEvidenceRecord(state.activeProject, checkpointId, patch));
  notify();
}

export function updatePosEvidence(checkpointId, patch) {
  state.activeProject = normalizeProjectState(updatePosEvidenceRecord(state.activeProject, checkpointId, patch));
  notify();
}

export function setCurrentView(view, id) {
  if (view !== "dashboard") {
    const gatingIssue = getProjectEntryGatingIssue();

    if (gatingIssue) {
      pushNotification(gatingIssue, "error");
      notify();
      return;
    }
  }

  state.activeProject.workflowState.currentView = view;

  if (view === "stages" && id) {
    state.activeProject.workflowState.currentStageId = id;
  }

  if (view === "domains" && id) {
    state.activeProject.workflowState.currentDomainId = id;
  }

  notify();
}

export function openDashboardSection(sectionId) {
  state.activeProject.workflowState.lastActiveSection = sectionId;
  state.activeProject.workflowState.currentView = "dashboard";
  notify();
}

export async function persistActiveProject() {
  const gatingIssue = getProjectEntryGatingIssue({ requireSavedProject: false });

  if (gatingIssue) {
    pushNotification(gatingIssue, "error");
    notify();
    return false;
  }

  const validationError = validateStateShape(state.activeProject);

  if (validationError) {
    pushNotification(validationError, "error");
    return false;
  }

  const normalizedProjects = [...normalizeProjectStorePayload(state.projectStore).projects];
  const index = normalizedProjects.findIndex(
    (project) => getProjectStoreRecordId(project) === state.activeProject.projectIdentity.projectId
  );

  if (index >= 0) {
    normalizedProjects[index] = state.activeProject;
  } else {
    normalizedProjects.unshift(state.activeProject);
  }

  state.projectStore = normalizeProjectStorePayload(await saveProjectStore({ projects: normalizedProjects }));
  pushNotification("Project state saved.", "success");
  notify();
  return true;
}

export function resumeProject(projectId) {
  const project = normalizeProjectStorePayload(state.projectStore).projects.find(
    (candidate) => getProjectStoreRecordId(candidate) === projectId
  );

  if (!project) {
    pushNotification("Saved project not found.", "error");
    return;
  }

  state.activeProject = normalizeProjectState(project);
  // Sync governed wizard captures to implementationStore for cross-wizard dropdowns
  syncGovernedToImplementationStore();
  pushNotification("Saved project resumed.", "success");
  notify();
}

/**
 * Sync governed wizard capture data back to implementationStore.
 * This ensures cross-wizard dropdown options (users, accounts, warehouses, etc.)
 * are available after a project resume or page refresh.
 */
function syncGovernedToImplementationStore() {
  try {
    const captures = state.activeProject.workflowState?.wizardCaptures || {};
    // Lazy-import to avoid circular dependency
    const implStore = window.__implStoreBridge;
    if (!implStore) return;

    // Map governed captures to implementationStore wizard data keys
    const keyMap = {
      "company-setup": "companySetup",
      "users-access": "usersAccess",
      "chart-of-accounts": "chartOfAccounts",
      "sales-setup": "salesConfig",
      "crm-setup": "crmConfig",
      "inventory-setup": "inventoryConfig",
      "accounting-setup": "accountingConfig",
      "purchase-setup": "purchaseConfig",
      "manufacturing-setup": "manufacturingConfig",
      "hr-setup": "hrPayrollConfig",
      "website-setup": "websiteEcommerce",
      "pos-setup": "posConfig"
    };

    for (const [wizardId, data] of Object.entries(captures)) {
      const storeKey = keyMap[wizardId];
      if (storeKey && data) {
        implStore.setWizardData(storeKey, data);
      }
    }

    // Sync governed imported data to implementationStore for grid display
    const importedData = state.activeProject.workflowState?.importedData || {};
    for (const [entity, rows] of Object.entries(importedData)) {
      if (Array.isArray(rows) && rows.length > 0 && implStore.setImportedData) {
        implStore.setImportedData(entity, rows);
      }
    }
  } catch {
    // Best-effort sync — don't break project resume on sync failure
  }
}

export function getProjectSummary() {
  const checkpointSummary = summarizeCheckpoints(state.activeProject.checkpoints);
  return {
    ...checkpointSummary,
    savedProjects: state.projectStore.projects.length
  };
}

export function addCompletedWizard(wizardId) {
  if (!state.activeProject.workflowState.completedWizards) {
    state.activeProject.workflowState.completedWizards = [];
  }

  if (!state.activeProject.workflowState.completedWizards.includes(wizardId)) {
    state.activeProject.workflowState.completedWizards.push(wizardId);
    pushNotification(`Wizard "${wizardId}" marked as complete.`, "success");
    notify();
  }
}

export function getCompletedWizards() {
  return state.activeProject.workflowState.completedWizards || [];
}

// ── Governed Roadmap Steps ────────────────────────────────────
// Stores roadmap step status in governed project state (not localStorage)
export function setGovernedRoadmapStep(stepId, status) {
  if (!state.activeProject.workflowState.roadmapSteps) {
    state.activeProject.workflowState.roadmapSteps = {};
  }
  state.activeProject.workflowState.roadmapSteps[stepId] = status;
  notify();
}

export function getGovernedRoadmapStep(stepId) {
  return state.activeProject.workflowState.roadmapSteps?.[stepId] || "todo";
}

export function getGovernedRoadmapSteps() {
  return state.activeProject.workflowState.roadmapSteps || {};
}

// ── Wizard Capture Data (governed persistence) ────────────────
// Stores wizard output data in governed project state for modules
// that lack dedicated domain configuration functions
export function setWizardCapture(wizardId, data) {
  if (!state.activeProject.workflowState.wizardCaptures) {
    state.activeProject.workflowState.wizardCaptures = {};
  }
  state.activeProject.workflowState.wizardCaptures[wizardId] = {
    ...data,
    capturedAt: new Date().toISOString()
  };
  notify();
}

export function getWizardCapture(wizardId) {
  return state.activeProject.workflowState.wizardCaptures?.[wizardId] || null;
}

export function getAllWizardCaptures() {
  return state.activeProject.workflowState.wizardCaptures || {};
}

// ── Governed Imported Data (grid imports) ─────────────────────
// Persists grid import data in governed project state so it survives refresh
export function setGovernedImportedData(entity, rows) {
  if (!state.activeProject.workflowState.importedData) {
    state.activeProject.workflowState.importedData = {};
  }
  state.activeProject.workflowState.importedData[entity] = rows;
  notify();
}

export function getGovernedImportedData(entity) {
  return state.activeProject.workflowState.importedData?.[entity] || [];
}

export function getAllGovernedImportedData() {
  return state.activeProject.workflowState.importedData || {};
}

// ── Module Completion Status ──────────────────────────────────
export function getModuleCompletionStatus() {
  const completed = state.activeProject.workflowState.completedWizards || [];
  const allModules = [
    "company-setup", "users-access", "chart-of-accounts",
    "sales-setup", "crm-setup", "inventory-setup",
    "accounting-setup", "purchase-setup", "manufacturing-setup",
    "hr-setup", "website-setup", "pos-setup"
  ];
  return {
    completed: completed.length,
    total: allModules.length,
    modules: allModules.map(id => ({
      id,
      status: completed.includes(id) ? "complete" : "not_started"
    }))
  };
}

export function getInventoryCheckpointGroups() {
  return INVENTORY_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id),
    defermentEligibility: getCheckpointDefermentEligibility(
      state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id),
      state.activeProject.checkpoints
    )
  }));
}

export function getAccountingCheckpointGroups() {
  return ACCOUNTING_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getSalesCheckpointGroups() {
  return SALES_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getCrmCheckpointGroups() {
  return CRM_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getProjectsCheckpointGroups() {
  return PROJECTS_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getHrCheckpointGroups() {
  return HR_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getPlmCheckpointGroups() {
  return PLM_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getQualityCheckpointGroups() {
  return QUALITY_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getDocumentsCheckpointGroups() {
  return DOCUMENTS_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getSignCheckpointGroups() {
  return SIGN_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getApprovalsCheckpointGroups() {
  return APPROVALS_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getPurchaseCheckpointGroups() {
  return PURCHASE_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getManufacturingCheckpointGroups() {
  return MANUFACTURING_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getWebsiteEcommerceCheckpointGroups() {
  return WEBSITE_ECOMMERCE_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getPosCheckpointGroups() {
  return POS_CHECKPOINT_GROUPS.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getPurchaseConfigurationModel() {
  return getPurchaseConfigurationSections(state.activeProject);
}

export function getSalesConfigurationModel() {
  return getSalesConfigurationSections(state.activeProject);
}

export function getCrmConfigurationModel() {
  return getCrmConfigurationSections(state.activeProject);
}

export function getManufacturingConfigurationModel() {
  return getManufacturingConfigurationSections(state.activeProject);
}

export function getMasterDataConfigurationModel() {
  return getMasterDataConfigurationSections(state.activeProject);
}

export function getScaffoldCheckpointGroups(domainId) {
  const groups = [...FOUNDATION_CHECKPOINT_GROUPS, ...USERS_SECURITY_CHECKPOINT_GROUPS, ...MASTER_DATA_CHECKPOINT_GROUPS]
    .filter((group) => group.domainId === domainId);

  return groups.map((group) => ({
    ...group,
    checkpoint: state.activeProject.checkpoints.find((checkpoint) => checkpoint.id === group.id)
  }));
}

export function getAccountingConfigurationModel() {
  return getAccountingConfigurationSections(state.activeProject);
}

export function getInventoryConfigurationModel() {
  return getInventoryConfigurationSections(state.activeProject);
}

export function getWebsiteEcommerceConfigurationModel() {
  return getWebsiteEcommerceConfigurationSections(state.activeProject);
}

export function getPosConfigurationModel() {
  return getPosConfigurationSections(state.activeProject);
}

function syncBranchCheckpoint() {
  const branchCheckpoint = state.activeProject.checkpoints.find((item) => item.id === "checkpoint-odoo-sh-target");
  const requiresTarget = state.activeProject.environmentContext.target.enabled;

  if (!branchCheckpoint) {
    return;
  }

  if (!requiresTarget) {
    branchCheckpoint.status = "Pass";
    branchCheckpoint.blockerFlag = false;
    branchCheckpoint.blockedReason = "";
    branchCheckpoint.evidenceStatus = "Not required for current target";
    return;
  }

  const hasTarget =
    Boolean(state.activeProject.environmentContext.target.targetEnvironment) &&
    Boolean(state.activeProject.environmentContext.target.targetBranch);

  branchCheckpoint.status = hasTarget ? "Pass" : "Fail";
  branchCheckpoint.blockerFlag = !hasTarget;
  branchCheckpoint.blockedReason = hasTarget
    ? ""
    : "Odoo.sh branch/environment target must be identified before deployment-sensitive progression.";
  branchCheckpoint.evidenceStatus = hasTarget ? "Target identified" : "Awaiting branch/environment target";
}

function getProjectEntryGatingIssue(options = { requireSavedProject: true }) {
  const { edition, deployment, projectMode } = state.activeProject.projectIdentity;
  const combinationError = getCombinationError(state.activeProject.projectIdentity);

  if (combinationError) {
    return combinationError;
  }

  if (!edition || !deployment || !projectMode) {
    return "Complete project identity before opening implementation views.";
  }

  if (options.requireSavedProject && !state.activeProject.projectIdentity.projectId) {
    return "Save the project at least once before opening implementation views.";
  }

  return null;
}

function isSavedProject(projectId) {
  return state.projectStore.projects.some((project) => project.projectIdentity?.projectId === projectId);
}

function pushNotification(message, type = "info") {
  state.notifications.push({
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type,
    timestamp: new Date().toISOString()
  });

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    state.notifications = state.notifications.filter((n) => n.message !== message);
    notify();
  }, 5000);
}

function notify() {
  listeners.forEach((listener) => listener());
}
