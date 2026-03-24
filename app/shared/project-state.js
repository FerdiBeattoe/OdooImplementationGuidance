import {
  CHECKPOINT_CLASSES,
  CHECKPOINT_RESULT_STATES,
  ODOO_VERSION,
  TARGET_STATUSES,
  VALIDATION_SOURCES,
  WORK_ITEM_STATUSES,
  WRITE_SAFETY_CLASSES
} from "./constants.js";
import { createAccountingConfigurationState, normalizeAccountingConfigurationState } from "./accounting-configuration.js";
import {
  normalizeAccountingEvidenceForCheckpoints,
  normalizeAccountingEvidenceState
} from "./accounting-evidence.js";
import { ACCOUNTING_CHECKPOINT_GROUPS, isAccountingCheckpoint } from "./accounting-domain.js";
import { APPROVALS_CHECKPOINT_GROUPS, isApprovalsCheckpoint } from "./approvals-domain.js";
import { createInitialConnectionState, normalizeConnectionState } from "./connection-state.js";
import { createCrmConfigurationState, normalizeCrmConfigurationState } from "./crm-configuration.js";
import { normalizeCrmEvidenceForCheckpoints, normalizeCrmEvidenceState } from "./crm-evidence.js";
import { CRM_CHECKPOINT_GROUPS, isCrmCheckpoint } from "./crm-domain.js";
import { DOCUMENTS_CHECKPOINT_GROUPS, isDocumentsCheckpoint } from "./documents-domain.js";
import { DOMAINS } from "./domains.js";
import { FOUNDATION_CHECKPOINT_GROUPS, isFoundationCheckpoint } from "./foundation-domain.js";
import { HR_CHECKPOINT_GROUPS, isHrCheckpoint } from "./hr-domain.js";
import { createInventoryConfigurationState, normalizeInventoryConfigurationState } from "./inventory-configuration.js";
import { normalizeInventoryEvidenceForCheckpoints } from "./inventory-evidence.js";
import { INVENTORY_CHECKPOINT_GROUPS, isInventoryCheckpoint } from "./inventory-domain.js";
import { isMasterDataCheckpoint, MASTER_DATA_CHECKPOINT_GROUPS } from "./master-data-domain.js";
import { createMasterDataConfigurationState, normalizeMasterDataConfigurationState } from "./master-data-configuration.js";
import { createManufacturingConfigurationState, normalizeManufacturingConfigurationState } from "./manufacturing-configuration.js";
import { normalizeManufacturingEvidenceForCheckpoints, normalizeManufacturingEvidenceState } from "./manufacturing-evidence.js";
import { isManufacturingCheckpoint, MANUFACTURING_CHECKPOINT_GROUPS } from "./manufacturing-domain.js";
import { PLM_CHECKPOINT_GROUPS, isPlmCheckpoint } from "./plm-domain.js";
import { createPosConfigurationState, normalizePosConfigurationState } from "./pos-configuration.js";
import { normalizePosEvidenceForCheckpoints, normalizePosEvidenceState } from "./pos-evidence.js";
import { POS_CHECKPOINT_GROUPS, isPosCheckpoint } from "./pos-domain.js";
import { PROJECTS_CHECKPOINT_GROUPS, isProjectsCheckpoint } from "./projects-domain.js";
import { createPurchaseConfigurationState, normalizePurchaseConfigurationState } from "./purchase-configuration.js";
import { normalizePurchaseEvidenceForCheckpoints, normalizePurchaseEvidenceState } from "./purchase-evidence.js";
import { createSalesConfigurationState, normalizeSalesConfigurationState } from "./sales-configuration.js";
import { isSalesCheckpoint, SALES_CHECKPOINT_GROUPS } from "./sales-domain.js";
import { normalizeSalesEvidenceForCheckpoints, normalizeSalesEvidenceState } from "./sales-evidence.js";
import { isPurchaseCheckpoint, PURCHASE_CHECKPOINT_GROUPS } from "./purchase-domain.js";
import { QUALITY_CHECKPOINT_GROUPS, isQualityCheckpoint } from "./quality-domain.js";
import { normalizeInspectionState, createInitialInspectionState } from "./inspection-model.js";
import { SIGN_CHECKPOINT_GROUPS, isSignCheckpoint } from "./sign-domain.js";
import { STAGES } from "./stages.js";
import { getCombinationError, requiresBranchTarget } from "./target-matrix.js";
import { isUsersSecurityCheckpoint, USERS_SECURITY_CHECKPOINT_GROUPS } from "./users-domain.js";
import { createWebsiteEcommerceConfigurationState, normalizeWebsiteEcommerceConfigurationState } from "./website-ecommerce-configuration.js";
import {
  normalizeWebsiteEcommerceEvidenceForCheckpoints,
  normalizeWebsiteEcommerceEvidenceState
} from "./website-ecommerce-evidence.js";
import { WEBSITE_ECOMMERCE_CHECKPOINT_GROUPS, isWebsiteEcommerceCheckpoint } from "./website-ecommerce-domain.js";
import { createInitialPreviewState, normalizePreviewState } from "./preview-engine.js";
import { createInitialExecutionState, normalizeExecutionState } from "./execution-engine.js";
import { normalizeAuditLog } from "./audit-log.js";

export function createInitialProjectState() {
  const createdAt = new Date().toISOString();
  const checkpoints = createSeedCheckpoints(createdAt);
  const accountingConfiguration = createAccountingConfigurationState();
  const inventoryConfiguration = createInventoryConfigurationState();
  const masterDataConfiguration = createMasterDataConfigurationState();
  const manufacturingConfiguration = createManufacturingConfigurationState();
  const salesConfiguration = createSalesConfigurationState();
  const purchaseConfiguration = createPurchaseConfigurationState();
  const crmConfiguration = createCrmConfigurationState();
  const websiteEcommerceConfiguration = createWebsiteEcommerceConfigurationState();
  const posConfiguration = createPosConfigurationState();
  const normalizedCheckpoints = normalizeWebsiteEcommerceEvidenceForCheckpoints(
    normalizePosEvidenceForCheckpoints(
      normalizeCrmEvidenceForCheckpoints(
        normalizeManufacturingEvidenceForCheckpoints(
          normalizeInventoryEvidenceForCheckpoints(
            normalizeAccountingEvidenceForCheckpoints(
              normalizeSalesEvidenceForCheckpoints(
                normalizePurchaseEvidenceForCheckpoints(
                  applyDerivedCheckpointRules(checkpoints),
                  purchaseConfiguration
                ),
                salesConfiguration
              ),
              accountingConfiguration
            ),
            inventoryConfiguration
          ),
          manufacturingConfiguration
        ),
        crmConfiguration
      ),
      posConfiguration
    ),
    websiteEcommerceConfiguration
  );

  return {
    projectIdentity: {
      projectId: `proj-${Date.now()}`,
      projectName: "",
      organizationName: "",
      projectOwner: "",
      implementationLead: "",
      version: ODOO_VERSION,
      edition: "Community",
      deployment: "Odoo Online",
      projectMode: "New implementation"
    },
    environmentContext: {
      localizationContext: "",
      companyScope: "",
      moduleScopeSummary: "",
      target: createBranchTargetState(false)
    },
    workflowState: {
      currentView: "dashboard",
      currentStageId: STAGES[0].id,
      currentDomainId: DOMAINS[0].id,
      lastActiveSection: "overview",
      configurationCompletionStatus: "Not Started",
      operationalReadinessStatus: "Not Started"
    },
    stages: applyWorkItemSummaries(STAGES.map((stage) => createWorkItemState(stage.id, stage.label)), normalizedCheckpoints, "stageId"),
    domains: applyWorkItemSummaries(DOMAINS.map((domain) => createWorkItemState(domain.id, domain.label)), normalizedCheckpoints, "domainId"),
    checkpoints: normalizedCheckpoints,
    checkpointState: normalizedCheckpoints,
    accountingConfiguration,
    inventoryConfiguration,
    masterDataConfiguration,
    manufacturingConfiguration,
    salesConfiguration,
    purchaseConfiguration,
    crmConfiguration,
    websiteEcommerceConfiguration,
    posConfiguration,
    decisions: [],
    connectionState: createInitialConnectionState(),
    inspectionState: createInitialInspectionState(),
    previewState: createInitialPreviewState(),
    executionState: createInitialExecutionState(),
    auditLog: [],
    trainingState: {
      trainingAvailable: true,
      trainingAssigned: false,
      trainingRequiredByProjectOwner: false,
      trainingCompleted: false
    },
    metadata: {
      createdAt,
      updatedAt: createdAt
    }
  };
}

export function createWorkItemState(id, label) {
  return {
    id,
    label,
    status: "Not Started",
    blockerCount: 0,
    warningCount: 0,
    deferredCount: 0
  };
}

export function createBranchTargetState(enabled) {
  return {
    enabled,
    targetEnvironment: "",
    targetBranch: "",
    targetStatus: TARGET_STATUSES[0],
    evidenceIsEnvironmentSpecific: false
  };
}

export function createSeedCheckpoints(createdAt) {
  return [
    ...FOUNDATION_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...USERS_SECURITY_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...MASTER_DATA_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...SALES_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...CRM_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...PURCHASE_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...MANUFACTURING_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...ACCOUNTING_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...INVENTORY_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...WEBSITE_ECOMMERCE_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...POS_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...PROJECTS_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...HR_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...PLM_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...QUALITY_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...DOCUMENTS_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...SIGN_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    ),
    ...APPROVALS_CHECKPOINT_GROUPS.map((group) =>
      createCheckpoint(
        {
          id: group.id,
          title: group.title,
          stageId: group.stageId,
          domainId: group.domainId,
          checkpointClass: group.checkpointClass,
          validationSource: group.validationSource,
          writeSafetyClass: group.writeSafetyClass,
          evidenceStatus: group.initialEvidenceStatus,
          status: group.initialStatus,
          blockerReason: group.initialBlockedReason,
          checkpointOwner: group.checkpointOwnerDefault,
          dependencyIds: group.dependencyIds,
          checkpointGroup: group.area,
          guidanceKey: group.guidanceKey
        },
        createdAt
      )
    )
  ];
}

export function createCheckpoint(seed, createdAt) {
  return {
    dependencyIds: [],
    defermentFlag: false,
    defermentReason: "",
    defermentConstraint: "",
    reviewPoint: "",
    blockedReason: seed.blockerReason || "",
    blockerFlag: seed.status === "Fail",
    checkpointOwner: "",
    reviewer: "",
    evidenceReference: "",
    lastReviewedAt: "",
    lastTransitionAt: createdAt,
    lastTransitionBy: "system-seed",
    ...seed
  };
}

export function validateProjectSetup(projectIdentity) {
  const error = getCombinationError(projectIdentity);

  if (projectIdentity.version !== ODOO_VERSION) {
    return "Only Odoo 19 is supported.";
  }

  return error;
}

export function normalizeProjectState(state = createInitialProjectState()) {
  const normalized = structuredClone(state || createInitialProjectState());
  normalized.projectIdentity.version = ODOO_VERSION;
  normalized.environmentContext.target.enabled = requiresBranchTarget(normalized.projectIdentity);
  normalized.connectionState = normalizeConnectionState(normalized.connectionState, normalized.projectIdentity);
  normalized.inspectionState = normalizeInspectionState(normalized.inspectionState);
  normalized.previewState = normalizePreviewState(normalized.previewState);
  normalized.executionState = normalizeExecutionState(normalized.executionState);
  normalized.auditLog = normalizeAuditLog(normalized.auditLog);
  normalized.accountingConfiguration = normalizeAccountingConfigurationState(normalized.accountingConfiguration);
  normalized.inventoryConfiguration = normalizeInventoryConfigurationState(normalized.inventoryConfiguration);
  normalized.masterDataConfiguration = normalizeMasterDataConfigurationState(normalized.masterDataConfiguration);
  normalized.manufacturingConfiguration = normalizeManufacturingConfigurationState(normalized.manufacturingConfiguration);
  normalized.salesConfiguration = normalizeSalesConfigurationState(normalized.salesConfiguration);
  normalized.purchaseConfiguration = normalizePurchaseConfigurationState(normalized.purchaseConfiguration);
  normalized.crmConfiguration = normalizeCrmConfigurationState(normalized.crmConfiguration);
  normalized.websiteEcommerceConfiguration = normalizeWebsiteEcommerceConfigurationState(normalized.websiteEcommerceConfiguration);
  normalized.posConfiguration = normalizePosConfigurationState(normalized.posConfiguration);
  normalized.checkpoints = ensureSeededCheckpoints(normalized.checkpoints || []);
  normalized.checkpoints = normalizeWebsiteEcommerceEvidenceForCheckpoints(
    normalizePosEvidenceForCheckpoints(
      normalizeCrmEvidenceForCheckpoints(
        normalizeManufacturingEvidenceForCheckpoints(
          normalizeInventoryEvidenceForCheckpoints(
            normalizeAccountingEvidenceForCheckpoints(
              normalizeSalesEvidenceForCheckpoints(
                normalizePurchaseEvidenceForCheckpoints(
                  applyDerivedCheckpointRules(normalized.checkpoints || []),
                  normalized.purchaseConfiguration
                ),
                normalized.salesConfiguration
              ),
              normalized.accountingConfiguration
            ),
            normalized.inventoryConfiguration
          ),
          normalized.manufacturingConfiguration
        ),
        normalized.crmConfiguration
      ),
      normalized.posConfiguration
    ),
    normalized.websiteEcommerceConfiguration
  );
  normalized.checkpointState = normalized.checkpoints;
  normalized.stages = applyWorkItemSummaries(normalized.stages || [], normalized.checkpoints, "stageId");
  normalized.domains = applyWorkItemSummaries(normalized.domains || [], normalized.checkpoints, "domainId");
  normalized.projectName = normalized.projectIdentity.projectName;
  normalized.organizationName = normalized.projectIdentity.organizationName;
  normalized.projectOwner = normalized.projectIdentity.projectOwner;
  normalized.implementationLead = normalized.projectIdentity.implementationLead;
  normalized.edition = normalized.projectIdentity.edition;
  normalized.deployment = normalized.projectIdentity.deployment;
  normalized.projectMode = normalized.projectIdentity.projectMode;
  if (normalized.metadata) normalized.metadata.updatedAt = new Date().toISOString();
  return normalized;
}

export function validateProjectEntry(projectIdentity) {
  const error = validateProjectSetup(projectIdentity);
  return {
    valid: !error,
    errors: error ? [error] : []
  };
}

export function setProjectIdentity(state, patch) {
  const nextState = normalizeProjectState({
    ...state,
    projectIdentity: {
      ...state.projectIdentity,
      ...patch
    }
  });

  return {
    state: nextState,
    validation: validateProjectEntry(nextState.projectIdentity)
  };
}

export function seedCheckpointState() {
  return createSeedCheckpoints(new Date().toISOString());
}

export function getProjectSummary(state = createInitialProjectState()) {
  const summary = { blocked: 0, warnings: 0, deferred: 0, passed: 0, complete: 0 };
  for (const checkpoint of state.checkpointState || state.checkpoints || []) {
    if (checkpoint.status === "Fail" || checkpoint.status === "Blocked") {
      summary.blocked += 1;
    }
    if (checkpoint.status === "Warning") {
      summary.warnings += 1;
    }
    if (checkpoint.defermentFlag) {
      summary.deferred += 1;
    }
    if (checkpoint.status === "Pass") {
      summary.passed += 1;
    }
    if (checkpoint.status === "Complete") {
      summary.complete += 1;
    }
  }
  return summary;
}

export function validateStateShape(state) {
  const checkpoints = state?.checkpoints || [];
  const inventoryCheckpoints = checkpoints.filter((checkpoint) => isInventoryCheckpoint(checkpoint));
  const accountingCheckpoints = checkpoints.filter((checkpoint) => isAccountingCheckpoint(checkpoint));
  const salesCheckpoints = checkpoints.filter((checkpoint) => isSalesCheckpoint(checkpoint));
  const purchaseCheckpoints = checkpoints.filter((checkpoint) => isPurchaseCheckpoint(checkpoint));
  const manufacturingCheckpoints = checkpoints.filter((checkpoint) => isManufacturingCheckpoint(checkpoint));
  const crmCheckpoints = checkpoints.filter((checkpoint) => isCrmCheckpoint(checkpoint));
  const websiteCheckpoints = checkpoints.filter((checkpoint) => isWebsiteEcommerceCheckpoint(checkpoint));
  const posCheckpoints = checkpoints.filter((checkpoint) => isPosCheckpoint(checkpoint));

  if (!state?.projectIdentity?.projectId || !Array.isArray(state?.stages) || !Array.isArray(state?.domains)) {
    return "Invalid project state structure.";
  }

  if (state.projectIdentity.version !== ODOO_VERSION) {
    return "Only Odoo 19 project states are valid.";
  }

  if (!checkpoints.length) {
    return "At least one checkpoint record is required.";
  }

  for (const checkpoint of checkpoints) {
    if (!CHECKPOINT_CLASSES.includes(checkpoint.checkpointClass)) {
      return `Checkpoint class is invalid for ${checkpoint.id}.`;
    }

    if (!CHECKPOINT_RESULT_STATES.includes(checkpoint.status)) {
      return `Checkpoint result state is invalid for ${checkpoint.id}.`;
    }

    const hasProvenanceFields =
      Object.prototype.hasOwnProperty.call(checkpoint, "checkpointOwner") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "reviewer") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "evidenceReference") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "blockedReason") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "defermentReason") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "defermentConstraint") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "reviewPoint") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "lastReviewedAt") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "lastTransitionAt") &&
      Object.prototype.hasOwnProperty.call(checkpoint, "lastTransitionBy");

    if (!hasProvenanceFields) {
      return `Checkpoint provenance fields are missing for ${checkpoint.id}.`;
    }

    if (!VALIDATION_SOURCES.includes(checkpoint.validationSource)) {
      return `Checkpoint validation source is invalid for ${checkpoint.id}.`;
    }

    if (!WRITE_SAFETY_CLASSES.includes(checkpoint.writeSafetyClass)) {
      return `Checkpoint write safety class is invalid for ${checkpoint.id}.`;
    }

    if (isPassSupportRestrictedCheckpoint(checkpoint) && checkpoint.status === "Pass" && !hasAccountablePassSupport(checkpoint)) {
      return `Checkpoint pass support is insufficient for ${checkpoint.id}.`;
    }
  }

  if (
    requiresBranchTarget(state.projectIdentity) &&
    !state.environmentContext?.target?.targetBranch?.trim()
  ) {
    return "Branch or environment target is required for Odoo.sh Enterprise work.";
  }

  if (!TARGET_STATUSES.includes(state.environmentContext?.target?.targetStatus)) {
    return "Branch target status is invalid.";
  }

  if (!WORK_ITEM_STATUSES.includes(state.workflowState.configurationCompletionStatus)) {
    return "Configuration completion status is invalid.";
  }

  if (!WORK_ITEM_STATUSES.includes(state.workflowState.operationalReadinessStatus)) {
    return "Operational readiness status is invalid.";
  }

  const connectionState = normalizeConnectionState(state.connectionState, state.projectIdentity);

  if (!connectionState.supported && connectionState.status !== "unsupported") {
    return "Connection state support flags are invalid.";
  }

  const inspectionState = normalizeInspectionState(state.inspectionState);
  const previewState = normalizePreviewState(state.previewState);
  const executionState = normalizeExecutionState(state.executionState);
  const auditLog = normalizeAuditLog(state.auditLog);

  if (typeof inspectionState.domains !== "object") {
    return "Inspection state is invalid.";
  }

  if (!Array.isArray(previewState.previews) || !Array.isArray(executionState.executions) || !Array.isArray(auditLog)) {
    return "Preview, execution, or audit state is invalid.";
  }

  const accountingConfiguration = normalizeAccountingConfigurationState(state.accountingConfiguration);
  const configuration = normalizeInventoryConfigurationState(state.inventoryConfiguration);
  const masterDataConfiguration = normalizeMasterDataConfigurationState(state.masterDataConfiguration);
  const salesConfiguration = normalizeSalesConfigurationState(state.salesConfiguration);
  const purchaseConfiguration = normalizePurchaseConfigurationState(state.purchaseConfiguration);
  const manufacturingConfiguration = normalizeManufacturingConfigurationState(state.manufacturingConfiguration);
  const crmConfiguration = normalizeCrmConfigurationState(state.crmConfiguration);
  const websiteEcommerceConfiguration = normalizeWebsiteEcommerceConfigurationState(state.websiteEcommerceConfiguration);
  const posConfiguration = normalizePosConfigurationState(state.posConfiguration);

  if (
    !Array.isArray(accountingConfiguration.policyCapture) ||
    !Array.isArray(accountingConfiguration.stockMappingCapture) ||
    !Array.isArray(accountingConfiguration.landedCostCapture)
  ) {
    return "Accounting configuration structure is invalid.";
  }

  if (
    !Array.isArray(configuration.warehouses) ||
    !Array.isArray(configuration.operationTypes) ||
    !Array.isArray(configuration.routes)
  ) {
    return "Inventory configuration structure is invalid.";
  }

  if (
    !Array.isArray(masterDataConfiguration.partnerCategoryCapture) ||
    !Array.isArray(masterDataConfiguration.productCategoryCapture) ||
    !Array.isArray(masterDataConfiguration.uomCategoryCapture)
  ) {
    return "Master Data configuration structure is invalid.";
  }

  if (
    !Array.isArray(salesConfiguration.processCapture) ||
    !Array.isArray(salesConfiguration.pricingCapture) ||
    !Array.isArray(salesConfiguration.quotationControlCapture) ||
    !Array.isArray(salesConfiguration.fulfillmentHandoffCapture)
  ) {
    return "Sales configuration structure is invalid.";
  }

  if (
    !Array.isArray(purchaseConfiguration.processCapture) ||
    !Array.isArray(purchaseConfiguration.vendorPricingCapture) ||
    !Array.isArray(purchaseConfiguration.approvalControlCapture) ||
    !Array.isArray(purchaseConfiguration.inboundHandoffCapture)
  ) {
    return "Purchase configuration structure is invalid.";
  }

  if (
    !Array.isArray(manufacturingConfiguration.productionModeCapture) ||
    !Array.isArray(manufacturingConfiguration.bomGovernanceCapture) ||
    !Array.isArray(manufacturingConfiguration.routingControlCapture) ||
    !Array.isArray(manufacturingConfiguration.productionHandoffCapture)
  ) {
    return "Manufacturing configuration structure is invalid.";
  }

  if (
    !Array.isArray(crmConfiguration.pipelineCapture) ||
    !Array.isArray(crmConfiguration.activityDisciplineCapture) ||
    !Array.isArray(crmConfiguration.quotationHandoffCapture)
  ) {
    return "CRM configuration structure is invalid.";
  }

  if (
    !Array.isArray(websiteEcommerceConfiguration.storefrontCapture) ||
    !Array.isArray(websiteEcommerceConfiguration.checkoutCapture) ||
    !Array.isArray(websiteEcommerceConfiguration.deliveryHandoffCapture)
  ) {
    return "Website / eCommerce configuration structure is invalid.";
  }

  if (
    !Array.isArray(posConfiguration.sessionPolicyCapture) ||
    !Array.isArray(posConfiguration.invoicingPolicyCapture)
  ) {
    return "POS configuration structure is invalid.";
  }

  for (const checkpoint of inventoryCheckpoints) {
    const evidence = checkpoint.inventoryEvidence;

    if (!evidence || typeof evidence !== "object") {
      return `Inventory evidence state is missing for ${checkpoint.id}.`;
    }

    const hasEvidenceFields =
      Object.prototype.hasOwnProperty.call(evidence, "mode") &&
      Object.prototype.hasOwnProperty.call(evidence, "summary") &&
      Object.prototype.hasOwnProperty.call(evidence, "sourceLabel") &&
      Object.prototype.hasOwnProperty.call(evidence, "notes") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedActor") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedAt");

    if (!hasEvidenceFields) {
      return `Inventory evidence state is incomplete for ${checkpoint.id}.`;
    }
  }

  for (const checkpoint of accountingCheckpoints) {
    const evidence = normalizeAccountingEvidenceState(
      checkpoint.accountingEvidence,
      checkpoint.id,
      accountingConfiguration
    );

    if (!evidence || typeof evidence !== "object") {
      return `Accounting evidence state is missing for ${checkpoint.id}.`;
    }

    const hasEvidenceFields =
      Object.prototype.hasOwnProperty.call(evidence, "mode") &&
      Object.prototype.hasOwnProperty.call(evidence, "summary") &&
      Object.prototype.hasOwnProperty.call(evidence, "sourceLabel") &&
      Object.prototype.hasOwnProperty.call(evidence, "notes") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedActor") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedAt");

    if (!hasEvidenceFields) {
      return `Accounting evidence state is incomplete for ${checkpoint.id}.`;
    }

    if (!["none", "design_capture", "user_asserted"].includes(evidence.mode)) {
      return `Accounting evidence mode is invalid for ${checkpoint.id}.`;
    }
  }

  for (const checkpoint of salesCheckpoints) {
    const evidence = normalizeSalesEvidenceState(
      checkpoint.salesEvidence,
      checkpoint.id,
      salesConfiguration
    );

    if (!evidence || typeof evidence !== "object") {
      return `Sales evidence state is missing for ${checkpoint.id}.`;
    }

    const hasEvidenceFields =
      Object.prototype.hasOwnProperty.call(evidence, "mode") &&
      Object.prototype.hasOwnProperty.call(evidence, "summary") &&
      Object.prototype.hasOwnProperty.call(evidence, "sourceLabel") &&
      Object.prototype.hasOwnProperty.call(evidence, "notes") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedActor") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedAt");

    if (!hasEvidenceFields) {
      return `Sales evidence state is incomplete for ${checkpoint.id}.`;
    }

    if (!["none", "design_capture", "user_asserted"].includes(evidence.mode)) {
      return `Sales evidence mode is invalid for ${checkpoint.id}.`;
    }
  }

  for (const checkpoint of purchaseCheckpoints) {
    const evidence = normalizePurchaseEvidenceState(
      checkpoint.purchaseEvidence,
      checkpoint.id,
      purchaseConfiguration
    );

    if (!evidence || typeof evidence !== "object") {
      return `Purchase evidence state is missing for ${checkpoint.id}.`;
    }

    const hasEvidenceFields =
      Object.prototype.hasOwnProperty.call(evidence, "mode") &&
      Object.prototype.hasOwnProperty.call(evidence, "summary") &&
      Object.prototype.hasOwnProperty.call(evidence, "sourceLabel") &&
      Object.prototype.hasOwnProperty.call(evidence, "notes") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedActor") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedAt");

    if (!hasEvidenceFields) {
      return `Purchase evidence state is incomplete for ${checkpoint.id}.`;
    }

    if (!["none", "design_capture", "user_asserted"].includes(evidence.mode)) {
      return `Purchase evidence mode is invalid for ${checkpoint.id}.`;
    }
  }

  for (const checkpoint of manufacturingCheckpoints) {
    const evidence = normalizeManufacturingEvidenceState(
      checkpoint.manufacturingEvidence,
      checkpoint.id,
      manufacturingConfiguration
    );

    if (!evidence || typeof evidence !== "object") {
      return `Manufacturing evidence state is missing for ${checkpoint.id}.`;
    }

    const hasEvidenceFields =
      Object.prototype.hasOwnProperty.call(evidence, "mode") &&
      Object.prototype.hasOwnProperty.call(evidence, "summary") &&
      Object.prototype.hasOwnProperty.call(evidence, "sourceLabel") &&
      Object.prototype.hasOwnProperty.call(evidence, "notes") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedActor") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedAt");

    if (!hasEvidenceFields) {
      return `Manufacturing evidence state is incomplete for ${checkpoint.id}.`;
    }

    if (!["none", "design_capture", "user_asserted"].includes(evidence.mode)) {
      return `Manufacturing evidence mode is invalid for ${checkpoint.id}.`;
    }
  }

  for (const checkpoint of crmCheckpoints) {
    const evidence = normalizeCrmEvidenceState(
      checkpoint.crmEvidence,
      checkpoint.id,
      crmConfiguration
    );

    if (!evidence || typeof evidence !== "object") {
      return `CRM evidence state is missing for ${checkpoint.id}.`;
    }

    const hasEvidenceFields =
      Object.prototype.hasOwnProperty.call(evidence, "mode") &&
      Object.prototype.hasOwnProperty.call(evidence, "summary") &&
      Object.prototype.hasOwnProperty.call(evidence, "sourceLabel") &&
      Object.prototype.hasOwnProperty.call(evidence, "notes") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedActor") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedAt");

    if (!hasEvidenceFields) {
      return `CRM evidence state is incomplete for ${checkpoint.id}.`;
    }

    if (!["none", "design_capture", "user_asserted"].includes(evidence.mode)) {
      return `CRM evidence mode is invalid for ${checkpoint.id}.`;
    }
  }

  for (const checkpoint of websiteCheckpoints) {
    const evidence = normalizeWebsiteEcommerceEvidenceState(
      checkpoint.websiteEcommerceEvidence,
      checkpoint.id,
      websiteEcommerceConfiguration
    );

    if (!evidence || typeof evidence !== "object") {
      return `Website / eCommerce evidence state is missing for ${checkpoint.id}.`;
    }

    const hasEvidenceFields =
      Object.prototype.hasOwnProperty.call(evidence, "mode") &&
      Object.prototype.hasOwnProperty.call(evidence, "summary") &&
      Object.prototype.hasOwnProperty.call(evidence, "sourceLabel") &&
      Object.prototype.hasOwnProperty.call(evidence, "notes") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedActor") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedAt");

    if (!hasEvidenceFields) {
      return `Website / eCommerce evidence state is incomplete for ${checkpoint.id}.`;
    }

    if (!["none", "design_capture", "user_asserted"].includes(evidence.mode)) {
      return `Website / eCommerce evidence mode is invalid for ${checkpoint.id}.`;
    }
  }

  for (const checkpoint of posCheckpoints) {
    const evidence = normalizePosEvidenceState(
      checkpoint.posEvidence,
      checkpoint.id,
      posConfiguration
    );

    if (!evidence || typeof evidence !== "object") {
      return `POS evidence state is missing for ${checkpoint.id}.`;
    }

    const hasEvidenceFields =
      Object.prototype.hasOwnProperty.call(evidence, "mode") &&
      Object.prototype.hasOwnProperty.call(evidence, "summary") &&
      Object.prototype.hasOwnProperty.call(evidence, "sourceLabel") &&
      Object.prototype.hasOwnProperty.call(evidence, "notes") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedActor") &&
      Object.prototype.hasOwnProperty.call(evidence, "recordedAt");

    if (!hasEvidenceFields) {
      return `POS evidence state is incomplete for ${checkpoint.id}.`;
    }

    if (!["none", "design_capture", "user_asserted"].includes(evidence.mode)) {
      return `POS evidence mode is invalid for ${checkpoint.id}.`;
    }
  }

  return "";
}

export function updateCheckpointRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return normalizeProjectState(nextState);
  }

  const nextPatch = { ...patch };

  if (Object.prototype.hasOwnProperty.call(nextPatch, "status") && !canManuallyUpdateCheckpointStatus(checkpoint, nextPatch.status)) {
    delete nextPatch.status;
  }

  Object.assign(checkpoint, nextPatch, {
    lastTransitionAt: new Date().toISOString(),
    lastTransitionBy: "ui-user"
  });

  return normalizeProjectState(nextState);
}

export function deferCheckpointRecord(state, checkpointId, deferment) {
  const nextState = structuredClone(state);
  const normalizedState = normalizeProjectState(nextState);
  const checkpoint = normalizedState.checkpoints.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return {
      state: normalizedState,
      error: "Checkpoint not found."
    };
  }

  const eligibility = getCheckpointDefermentEligibility(checkpoint, normalizedState.checkpoints);

  if (!eligibility.allowed) {
    return {
      state: normalizedState,
      error: eligibility.reason
    };
  }

  const checkpointOwner = deferment.checkpointOwner?.trim() || checkpoint.checkpointOwner?.trim();
  const defermentReason = deferment.defermentReason?.trim();
  const defermentConstraint = deferment.defermentConstraint?.trim();
  const reviewPoint = deferment.reviewPoint?.trim();

  if (!checkpointOwner || !defermentReason || !defermentConstraint || !reviewPoint) {
    return {
      state: normalizedState,
      error: "Deferred checkpoints require owner, deferment reason, deferment constraint, and review point."
    };
  }

  const mutableCheckpoint = nextState.checkpoints.find((item) => item.id === checkpointId);

  Object.assign(mutableCheckpoint, {
    checkpointOwner,
    defermentFlag: true,
    defermentReason,
    defermentConstraint,
    reviewPoint,
    status: "Warning",
    blockerFlag: false,
    blockedReason: "",
    lastTransitionAt: new Date().toISOString(),
    lastTransitionBy: deferment.actor?.trim() || "ui-user"
  });

  return {
    state: normalizeProjectState(nextState),
    error: ""
  };
}

export function getCheckpointDefermentEligibility(checkpoint, checkpoints = []) {
  if (!checkpoint) {
    return { allowed: false, reason: "Checkpoint not found." };
  }

  if (!["Recommended", "Optional"].includes(checkpoint.checkpointClass)) {
    return {
      allowed: false,
      reason: `${checkpoint.checkpointClass} checkpoints cannot be deferred under current governance.`
    };
  }

  const unmetDependencies = getUnmetDependencies(checkpoint, checkpoints);

  if (unmetDependencies.length) {
    return {
      allowed: false,
      reason: `Checkpoint remains blocked until dependencies pass: ${unmetDependencies.map((dependency) => dependency.title).join(", ")}.`
    };
  }

  if (checkpoint.status === "Fail" || checkpoint.blockerFlag) {
    return {
      allowed: false,
      reason: "Blocked checkpoints cannot be converted into deferred items."
    };
  }

  return { allowed: true, reason: "" };
}

function applyDerivedCheckpointRules(checkpoints) {
  const nextCheckpoints = checkpoints.map((checkpoint) => ({ ...checkpoint }));
  const checkpointMap = new Map(nextCheckpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
  const seededCheckpointMap = new Map(
    createSeedCheckpoints(new Date().toISOString()).map((checkpoint) => [checkpoint.id, checkpoint])
  );

  for (const checkpoint of nextCheckpoints) {
    const unmetDependencies = getUnmetDependencies(checkpoint, nextCheckpoints, checkpointMap);

    if (unmetDependencies.length) {
      checkpoint.status = "Fail";
      checkpoint.blockerFlag = true;
      checkpoint.blockedReason = `Dependency not met: ${unmetDependencies.map((dependency) => dependency.title).join(", ")}.`;
      checkpoint.evidenceStatus = checkpoint.evidenceReference ? checkpoint.evidenceStatus : "Awaiting dependency resolution";
      continue;
    }

    if (checkpoint.status === "Fail" && !checkpoint.blockedReason) {
      checkpoint.blockerFlag = true;
    }

    const seededCheckpoint = seededCheckpointMap.get(checkpoint.id);

    if (
      checkpoint.status === "Fail" &&
      checkpoint.blockedReason?.startsWith("Dependency not met:") &&
      seededCheckpoint
    ) {
      checkpoint.blockedReason = seededCheckpoint.blockedReason || "";
      if (checkpoint.evidenceStatus === "Awaiting dependency resolution") {
        checkpoint.evidenceStatus = seededCheckpoint.evidenceStatus || "";
      }
    }

    if (checkpoint.status !== "Fail") {
      checkpoint.blockerFlag = false;
      if (checkpoint.status === "Pass" && !checkpoint.evidenceReference && isInventoryCheckpoint(checkpoint)) {
        checkpoint.status = "Warning";
        checkpoint.blockerFlag = false;
        checkpoint.blockedReason = "";
        checkpoint.evidenceStatus = "Awaiting review";
      } else if (checkpoint.status === "Pass" && isPassSupportRestrictedCheckpoint(checkpoint) && !hasAccountablePassSupport(checkpoint)) {
        checkpoint.status = "Warning";
        checkpoint.blockerFlag = false;
        checkpoint.blockedReason = "";
        checkpoint.evidenceStatus = "Awaiting accountable support";
      } else if (checkpoint.status !== "Fail") {
        checkpoint.blockedReason = "";
      }
    }
  }

  return nextCheckpoints;
}

function getUnmetDependencies(checkpoint, checkpoints, checkpointMap = new Map(checkpoints.map((item) => [item.id, item]))) {
  return (checkpoint.dependencyIds || [])
    .map((dependencyId) => checkpointMap.get(dependencyId))
    .filter((dependency) => dependency && dependency.status !== "Pass" && !dependency.defermentFlag);
}

function ensureSeededCheckpoints(checkpoints) {
  const seeded = createSeedCheckpoints(new Date().toISOString());
  const existingById = new Map((checkpoints || []).map((checkpoint) => [checkpoint.id, checkpoint]));
  const seededIds = new Set(seeded.map((checkpoint) => checkpoint.id));

  return [
    ...seeded.map((checkpoint) => ({
      ...checkpoint,
      ...(existingById.get(checkpoint.id) || {})
    })),
    ...(checkpoints || []).filter((checkpoint) => !seededIds.has(checkpoint.id))
  ];
}

function canManuallyUpdateCheckpointStatus(checkpoint, nextStatus) {
  if (!isManualPassRestrictedCheckpoint(checkpoint)) {
    return true;
  }

  if (!["Foundational", "Domain Required", "Go-Live"].includes(checkpoint.checkpointClass)) {
    return true;
  }

  return nextStatus !== "Pass";
}

function isAccountingPassRestricted(checkpoint) {
  return ["Foundational", "Domain Required", "Go-Live"].includes(checkpoint.checkpointClass);
}

function hasAccountablePassSupport(checkpoint) {
  return Boolean(
    checkpoint?.evidenceReference?.trim() &&
    checkpoint?.checkpointOwner?.trim() &&
    checkpoint?.reviewer?.trim()
  );
}

function isManualPassRestrictedCheckpoint(checkpoint) {
  if (
    isInventoryCheckpoint(checkpoint) ||
    isAccountingCheckpoint(checkpoint) ||
    isCrmCheckpoint(checkpoint) ||
    isSalesCheckpoint(checkpoint) ||
    isPurchaseCheckpoint(checkpoint) ||
    isManufacturingCheckpoint(checkpoint) ||
    isWebsiteEcommerceCheckpoint(checkpoint) ||
    isPosCheckpoint(checkpoint) ||
    isProjectsCheckpoint(checkpoint) ||
    isHrCheckpoint(checkpoint) ||
    isPlmCheckpoint(checkpoint) ||
    isQualityCheckpoint(checkpoint) ||
    isDocumentsCheckpoint(checkpoint) ||
    isSignCheckpoint(checkpoint) ||
    isApprovalsCheckpoint(checkpoint)
  ) {
    return true;
  }

  if (isFoundationCheckpoint(checkpoint)) {
    return true;
  }

  return isUsersSecurityCheckpoint(checkpoint) || isMasterDataCheckpoint(checkpoint);
}

function isPassSupportRestrictedCheckpoint(checkpoint) {
  if (!["Foundational", "Domain Required", "Go-Live"].includes(checkpoint?.checkpointClass)) {
    return false;
  }

  if (
    isAccountingCheckpoint(checkpoint) ||
    isCrmCheckpoint(checkpoint) ||
    isSalesCheckpoint(checkpoint) ||
    isPurchaseCheckpoint(checkpoint) ||
    isManufacturingCheckpoint(checkpoint) ||
    isWebsiteEcommerceCheckpoint(checkpoint) ||
    isPosCheckpoint(checkpoint) ||
    isProjectsCheckpoint(checkpoint) ||
    isHrCheckpoint(checkpoint) ||
    isPlmCheckpoint(checkpoint) ||
    isQualityCheckpoint(checkpoint) ||
    isDocumentsCheckpoint(checkpoint) ||
    isSignCheckpoint(checkpoint) ||
    isApprovalsCheckpoint(checkpoint)
  ) {
    return true;
  }

  if (isFoundationCheckpoint(checkpoint)) {
    return checkpoint.id !== "checkpoint-odoo-sh-target";
  }

  return isUsersSecurityCheckpoint(checkpoint) || isMasterDataCheckpoint(checkpoint);
}


function applyWorkItemSummaries(items, checkpoints, key) {
  return items.map((item) => {
    const scoped = checkpoints.filter((checkpoint) => checkpoint[key] === item.id);

    if (!scoped.length) {
      return item;
    }

    const blockerCount = scoped.filter((checkpoint) => checkpoint.status === "Fail").length;
    const warningCount = scoped.filter((checkpoint) => checkpoint.status === "Warning").length;
    const deferredCount = scoped.filter((checkpoint) => checkpoint.defermentFlag).length;
    const passedCount = scoped.filter((checkpoint) => checkpoint.status === "Pass").length;

    let status = "Not Started";

    if (blockerCount) {
      status = "Blocked";
    } else if (warningCount) {
      status = "In Progress";
    } else if (passedCount === scoped.length) {
      status = "Ready For Review";
    }

    return {
      ...item,
      status,
      blockerCount,
      warningCount,
      deferredCount
    };
  });
}
