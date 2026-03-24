import { createAuditEntry } from "./audit-log.js";
import { createInspectionRecord } from "./inspection-model.js";
import { getDomainSupport } from "./domain-capabilities.js";
import { requiresBranchTarget } from "./target-matrix.js";

export function createInitialPreviewState() {
  return {
    previews: []
  };
}

export function normalizePreviewState(state = {}) {
  return {
    previews: Array.isArray(state?.previews) ? state.previews.map((preview) => normalizePreviewRecord(preview)) : []
  };
}

export function normalizePreviewRecord(preview = {}) {
  return {
    id: preview.id || `preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    domainId: preview.domainId || "",
    title: preview.title || "",
    targetModel: preview.targetModel || "",
    targetIdentifier: preview.targetIdentifier || "",
    operation: preview.operation || "",
    intendedChanges: Array.isArray(preview.intendedChanges) ? preview.intendedChanges : [],
    safetyClass: preview.safetyClass || "blocked",
    prerequisites: Array.isArray(preview.prerequisites) ? preview.prerequisites : [],
    downstreamImpact: preview.downstreamImpact || "",
    deploymentTarget: preview.deploymentTarget || "",
    branchTarget: preview.branchTarget || "",
    confirmationRequired: Boolean(preview.confirmationRequired),
    executable: Boolean(preview.executable),
    blockedReason: preview.blockedReason || "",
    createdAt: preview.createdAt || new Date().toISOString()
  };
}

export function generateDomainPreview(project, domainId, inspectionInput) {
  const support = getDomainSupport(domainId);
  const inspection = inspectionInput || project?.inspectionState?.domains?.[domainId] || createInspectionRecord(domainId);
  const previews = [];
  const auditEntries = [];
  const deploymentTarget = project?.projectIdentity?.deployment || "";
  const branchTarget = project?.environmentContext?.target?.targetBranch || project?.environmentContext?.target?.targetEnvironment || "";
  const branchRequired = requiresBranchTarget(project?.projectIdentity || {});

  for (const moduleStatus of inspection.moduleStatus || []) {
    if (moduleStatus.state !== "installed") {
      const preview = normalizePreviewRecord({
        domainId,
        title: `Install ${moduleStatus.module}`,
        targetModel: "ir.module.module",
        targetIdentifier: moduleStatus.module,
        operation: "install_module",
        intendedChanges: [{ field: "state", from: moduleStatus.state, to: "installed" }],
        safetyClass: branchRequired ? "conditional" : "blocked",
        prerequisites: [
          "Supported live application-layer connection",
          "Operator review of downstream module impact"
        ],
        downstreamImpact: "Module activation changes which governed setup surfaces are available in the target environment.",
        deploymentTarget,
        branchTarget,
        confirmationRequired: true,
        executable: false,
        blockedReason: branchRequired
          ? "Module activation preview is available, but execution remains blocked in this build."
          : "Module activation execution is not enabled in this build."
      });

      previews.push(preview);
      auditEntries.push(
        createAuditEntry({
          kind: "preview",
          actor: "ui-user",
          domainId,
          previewId: preview.id,
          targetModel: preview.targetModel,
          targetIdentifier: preview.targetIdentifier,
          operation: preview.operation,
          safetyClass: preview.safetyClass,
          prerequisiteStatus: preview.prerequisites.length ? "identified" : "not-required",
          prerequisites: preview.prerequisites,
          deploymentTarget: preview.deploymentTarget,
          branchTarget: preview.branchTarget,
          status: "generated",
          summary: preview.title
        })
      );
    }
  }

  if (support.executeSupport && inspection.status === "complete") {
    const configPreviews = generateConfigurationPreviews(project, domainId, inspection, {
      deploymentTarget,
      branchTarget
    });
    previews.push(...configPreviews);
    auditEntries.push(
      ...configPreviews.map((preview) =>
        createAuditEntry({
          kind: "preview",
          actor: "ui-user",
          domainId,
          previewId: preview.id,
          targetModel: preview.targetModel,
          targetIdentifier: preview.targetIdentifier,
          operation: preview.operation,
          safetyClass: preview.safetyClass,
          prerequisiteStatus: preview.prerequisites.length ? "identified" : "not-required",
          prerequisites: preview.prerequisites,
          deploymentTarget: preview.deploymentTarget,
          branchTarget: preview.branchTarget,
          status: "generated",
          summary: preview.title
        })
      )
    );
  }

  return { previews, auditEntries };
}

function generateConfigurationPreviews(project, domainId, inspection, context) {
  switch (domainId) {
    case "foundation-company-localization":
      return generateFoundationPreviews(project, inspection, context);
    case "master-data":
      return generateMasterDataPreviews(project, inspection, context);
    case "inventory":
      return generateInventoryPreviews(project, inspection, context);
    case "crm":
      return generateCrmPreviews(project, inspection, context);
    case "sales":
      return generateSalesPreviews(project, inspection, context);
    case "purchase":
      return generatePurchasePreviews(project, inspection, context);
    case "manufacturing-mrp":
      return generateManufacturingPreviews(project, inspection, context);
    case "website-ecommerce":
      return generateWebsiteEcommercePreviews(project, inspection, context);
    case "pos":
      return generatePosPreviews(project, inspection, context);
    default:
      return [];
  }
}

function generateFoundationPreviews(project, inspection, context) {
  const company = Array.isArray(inspection.records?.companies) ? inspection.records.companies[0] : null;
  const nextName = project?.projectIdentity?.organizationName?.trim();

  if (!company || !nextName || company.name === nextName) {
    return [];
  }

  return [
    normalizePreviewRecord({
      domainId: "foundation-company-localization",
      title: `Update company name to ${nextName}`,
      targetModel: "res.company",
      targetIdentifier: String(company.id),
      operation: "write",
      intendedChanges: [{ field: "name", from: company.name || "", to: nextName }],
      safetyClass: "safe",
      prerequisites: ["Foundational localization checkpoint review"],
      downstreamImpact: "Changes displayed company identity across implementation surfaces.",
      deploymentTarget: context.deploymentTarget,
      branchTarget: context.branchTarget,
      confirmationRequired: true,
      executable: true
    })
  ];
}

function generateMasterDataPreviews(project, inspection, context) {
  const previews = [];
  const moduleState = new Map((inspection.moduleStatus || []).map((item) => [item.module, item.state]));
  const partnerModelReady = inspection.modelStatus?.["res.partner.category"] !== "unavailable";
  const productModelReady = inspection.modelStatus?.["product.category"] !== "unavailable";
  const uomModelReady = inspection.modelStatus?.["uom.category"] !== "unavailable";
  const productModuleInstalled = moduleState.get("product") === "installed";
  const uomModuleInstalled = moduleState.get("uom") === "installed";

  const existingPartnerCategoryNames = new Set(
    (inspection.records?.partnerCategories || []).map((record) => normalizeComparableName(record.name))
  );
  const existingProductCategoryNames = new Set(
    (inspection.records?.productCategories || []).map((record) => normalizeComparableName(record.name))
  );
  const existingUomCategoryNames = new Set(
    (inspection.records?.uomCategories || []).map((record) => normalizeComparableName(record.name))
  );
  const stagedPartnerCategoryNames = new Set();
  const stagedProductCategoryNames = new Set();
  const stagedUomCategoryNames = new Set();

  for (const record of project?.masterDataConfiguration?.partnerCategoryCapture || []) {
    if (!record.inScope) {
      continue;
    }

    const categoryName = String(record.categoryName || "").trim();
    const normalizedName = normalizeComparableName(categoryName);

    if (!categoryName) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: "Create partner classification",
          targetModel: "res.partner.category",
          targetIdentifier: record.key,
          operation: "create",
          intendedChanges: [],
          safetyClass: "blocked",
          prerequisites: ["Category name is required."],
          downstreamImpact: "Partner classification supports controlled customer/vendor segmentation downstream.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Partner classification creation is blocked until a category name is provided."
        })
      );
      continue;
    }

    if (!partnerModelReady) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: `Create partner classification ${categoryName}`,
          targetModel: "res.partner.category",
          targetIdentifier: categoryName,
          operation: "create",
          intendedChanges: [{ field: "name", from: "", to: categoryName }],
          safetyClass: "blocked",
          prerequisites: ["Partner classification model must be available in the live environment."],
          downstreamImpact: "Partner classification supports controlled customer/vendor segmentation downstream.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Partner classification model is unavailable in the live environment."
        })
      );
      continue;
    }

    if (existingPartnerCategoryNames.has(normalizedName) || stagedPartnerCategoryNames.has(normalizedName)) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: `Create partner classification ${categoryName}`,
          targetModel: "res.partner.category",
          targetIdentifier: categoryName,
          operation: "create",
          intendedChanges: [{ field: "name", from: categoryName, to: categoryName }],
          safetyClass: "blocked",
          prerequisites: ["Partner classification name must be unique in live and staged records."],
          downstreamImpact: "Partner classification supports controlled customer/vendor segmentation downstream.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Partner classification already exists or is duplicated in capture."
        })
      );
      continue;
    }

    stagedPartnerCategoryNames.add(normalizedName);
    previews.push(
      normalizePreviewRecord({
        domainId: "master-data",
        title: `Create partner classification ${categoryName}`,
        targetModel: "res.partner.category",
        targetIdentifier: categoryName,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: categoryName }],
        safetyClass: "safe",
        prerequisites: ["Master Data structure checkpoint remains in scope."],
        downstreamImpact: "Adds a bounded shared partner classification record for downstream segmentation.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      })
    );
  }

  for (const record of project?.masterDataConfiguration?.productCategoryCapture || []) {
    if (!record.inScope) {
      continue;
    }

    const categoryName = String(record.categoryName || "").trim();
    const normalizedName = normalizeComparableName(categoryName);
    const parentName = String(record.parentCategoryName || "").trim();
    const normalizedParentName = normalizeComparableName(parentName);

    if (!categoryName) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: "Create product category",
          targetModel: "product.category",
          targetIdentifier: record.key,
          operation: "create",
          intendedChanges: [],
          safetyClass: "blocked",
          prerequisites: ["Category name is required."],
          downstreamImpact: "Product categories shape downstream product governance in Sales, Purchase, and Inventory.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Product category creation is blocked until a category name is provided."
        })
      );
      continue;
    }

    if (!productModuleInstalled) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: `Create product category ${categoryName}`,
          targetModel: "product.category",
          targetIdentifier: categoryName,
          operation: "create",
          intendedChanges: [{ field: "name", from: "", to: categoryName }],
          safetyClass: "blocked",
          prerequisites: ["Product module must be installed before product categories can be created."],
          downstreamImpact: "Product categories shape downstream product governance in Sales, Purchase, and Inventory.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Product module is not installed in the live environment."
        })
      );
      continue;
    }

    if (!productModelReady) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: `Create product category ${categoryName}`,
          targetModel: "product.category",
          targetIdentifier: categoryName,
          operation: "create",
          intendedChanges: [{ field: "name", from: "", to: categoryName }],
          safetyClass: "blocked",
          prerequisites: ["Product category model must be available in the live environment."],
          downstreamImpact: "Product categories shape downstream product governance in Sales, Purchase, and Inventory.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Product category model is unavailable in the live environment."
        })
      );
      continue;
    }

    if (existingProductCategoryNames.has(normalizedName) || stagedProductCategoryNames.has(normalizedName)) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: `Create product category ${categoryName}`,
          targetModel: "product.category",
          targetIdentifier: categoryName,
          operation: "create",
          intendedChanges: [{ field: "name", from: categoryName, to: categoryName }],
          safetyClass: "blocked",
          prerequisites: ["Product category name must be unique in live and staged records."],
          downstreamImpact: "Product categories shape downstream product governance in Sales, Purchase, and Inventory.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Product category already exists or is duplicated in capture."
        })
      );
      continue;
    }

    const parentCategory = (inspection.records?.productCategories || []).find(
      (item) => normalizeComparableName(item.name) === normalizedParentName
    );

    if (parentName && !parentCategory) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: `Create product category ${categoryName}`,
          targetModel: "product.category",
          targetIdentifier: categoryName,
          operation: "create",
          intendedChanges: [{ field: "name", from: "", to: categoryName }],
          safetyClass: "conditional",
          prerequisites: ["Specified parent category must already exist in live inspection."],
          downstreamImpact: "Product categories shape downstream product governance in Sales, Purchase, and Inventory.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Parent product category is not currently present in live inspection."
        })
      );
      continue;
    }

    stagedProductCategoryNames.add(normalizedName);
    const intendedChanges = [{ field: "name", from: "", to: categoryName }];

    if (parentCategory) {
      intendedChanges.push({ field: "parent_id", from: "", to: String(parentCategory.id) });
    }

    previews.push(
      normalizePreviewRecord({
        domainId: "master-data",
        title: `Create product category ${categoryName}`,
        targetModel: "product.category",
        targetIdentifier: parentCategory ? `${parentCategory.id}:${categoryName}` : categoryName,
        operation: "create",
        intendedChanges,
        safetyClass: "safe",
        prerequisites: ["Master Data structure checkpoint remains in scope.", "Product module is installed."],
        downstreamImpact: "Adds bounded shared product classification used by Sales, Purchase, and Inventory.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      })
    );
  }

  for (const record of project?.masterDataConfiguration?.uomCategoryCapture || []) {
    if (!record.inScope) {
      continue;
    }

    const categoryName = String(record.categoryName || "").trim();
    const normalizedName = normalizeComparableName(categoryName);

    if (!categoryName) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: "Create unit category",
          targetModel: "uom.category",
          targetIdentifier: record.key,
          operation: "create",
          intendedChanges: [],
          safetyClass: "blocked",
          prerequisites: ["Category name is required."],
          downstreamImpact: "Unit categories support downstream product quantity and conversion consistency.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Unit category creation is blocked until a category name is provided."
        })
      );
      continue;
    }

    if (!uomModuleInstalled || !uomModelReady) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: `Create unit category ${categoryName}`,
          targetModel: "uom.category",
          targetIdentifier: categoryName,
          operation: "create",
          intendedChanges: [{ field: "name", from: "", to: categoryName }],
          safetyClass: "blocked",
          prerequisites: ["Unit-of-measure module and model must be available in the live environment."],
          downstreamImpact: "Unit categories support downstream product quantity and conversion consistency.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Unit-of-measure category model is unavailable in the live environment."
        })
      );
      continue;
    }

    if (existingUomCategoryNames.has(normalizedName) || stagedUomCategoryNames.has(normalizedName)) {
      previews.push(
        normalizePreviewRecord({
          domainId: "master-data",
          title: `Create unit category ${categoryName}`,
          targetModel: "uom.category",
          targetIdentifier: categoryName,
          operation: "create",
          intendedChanges: [{ field: "name", from: categoryName, to: categoryName }],
          safetyClass: "blocked",
          prerequisites: ["Unit category name must be unique in live and staged records."],
          downstreamImpact: "Unit categories support downstream product quantity and conversion consistency.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Unit category already exists or is duplicated in capture."
        })
      );
      continue;
    }

    stagedUomCategoryNames.add(normalizedName);
    previews.push(
      normalizePreviewRecord({
        domainId: "master-data",
        title: `Create unit category ${categoryName}`,
        targetModel: "uom.category",
        targetIdentifier: categoryName,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: categoryName }],
        safetyClass: "safe",
        prerequisites: ["Master Data readiness checkpoint remains in scope.", "Unit-of-measure module is installed."],
        downstreamImpact: "Adds bounded shared unit-category scaffolding used by product structures.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      })
    );
  }

  return previews;
}

function generateInventoryPreviews(project, inspection, context) {
  const warehouseRecords = inspection.records?.warehouses || [];
  const operationTypeRecords = inspection.records?.operationTypes || [];
  const existingByCode = new Set((inspection.records?.warehouses || []).map((warehouse) => warehouse.code));
  const previews = (project?.inventoryConfiguration?.warehouses || [])
    .filter((record) => record.inScope && record.code && record.warehouseName && !existingByCode.has(record.code))
    .map((record) =>
      normalizePreviewRecord({
        domainId: "inventory",
        title: `Create warehouse ${record.warehouseName}`,
        targetModel: "stock.warehouse",
        targetIdentifier: record.code,
        operation: "create",
        intendedChanges: [
          { field: "name", from: "", to: record.warehouseName },
          { field: "code", from: "", to: record.code }
        ],
        safetyClass: "safe",
        prerequisites: ["Inventory warehouse setup checkpoint remains in scope."],
        downstreamImpact: "Adds a new warehouse structure for downstream inventory flow design.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      })
    );

  for (const record of project?.inventoryConfiguration?.operationTypes || []) {
    if (!record.inScope || !record.operationTypeName || !record.operationTypeKey) {
      continue;
    }

    const linkedWarehouseRecord = (project?.inventoryConfiguration?.warehouses || []).find(
      (warehouse) => warehouse.key === record.linkedWarehouseKey
    );
    const liveWarehouse = warehouseRecords.find(
      (warehouse) => warehouse.code && warehouse.code === linkedWarehouseRecord?.code
    );
    const flowCode = normalizeOperationFlowCode(record.flowCategory || record.operationTypeKey);
    const duplicate = operationTypeRecords.find(
      (operationType) =>
        operationType.name === record.operationTypeName ||
        (operationType.code === flowCode && Number(operationType.warehouseId || 0) === Number(liveWarehouse?.id || 0))
    );

    if (duplicate) {
      continue;
    }

    if (!linkedWarehouseRecord || !linkedWarehouseRecord.code || !liveWarehouse) {
      previews.push(
        normalizePreviewRecord({
          domainId: "inventory",
          title: `Create operation type ${record.operationTypeName}`,
          targetModel: "stock.picking.type",
          targetIdentifier: record.operationTypeKey,
          operation: "create",
          intendedChanges: [
            { field: "name", from: "", to: record.operationTypeName },
            { field: "code", from: "", to: flowCode || "" }
          ],
          safetyClass: "conditional",
          prerequisites: ["Linked warehouse must already exist in the live environment."],
          downstreamImpact: "Adds a controlled stock operation type after warehouse structure is established.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Operation type creation remains blocked until the linked warehouse is visible in live inspection."
        })
      );
      continue;
    }

    if (!flowCode) {
      previews.push(
        normalizePreviewRecord({
          domainId: "inventory",
          title: `Create operation type ${record.operationTypeName}`,
          targetModel: "stock.picking.type",
          targetIdentifier: record.operationTypeKey,
          operation: "create",
          intendedChanges: [{ field: "name", from: "", to: record.operationTypeName }],
          safetyClass: "blocked",
          prerequisites: ["Recognized inventory flow category is required."],
          downstreamImpact: "Adds a controlled stock operation type after warehouse structure is established.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: false,
          blockedReason: "Operation type creation is blocked until the flow category maps to a supported Odoo operation code."
        })
      );
      continue;
    }

    previews.push(
      normalizePreviewRecord({
        domainId: "inventory",
        title: `Create operation type ${record.operationTypeName}`,
        targetModel: "stock.picking.type",
        targetIdentifier: `${liveWarehouse.id}:${flowCode}:${record.operationTypeName}`,
        operation: "create",
        intendedChanges: [
          { field: "name", from: "", to: record.operationTypeName },
          { field: "code", from: "", to: flowCode },
          { field: "warehouse_id", from: "", to: String(liveWarehouse.id) }
        ],
        safetyClass: "safe",
        prerequisites: ["Linked warehouse exists in the live environment.", "Inventory operation-types checkpoint remains in scope."],
        downstreamImpact: "Adds a controlled stock operation type aligned to the inspected warehouse structure.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      })
    );
  }

  return previews;
}

function generateCrmPreviews(project, inspection, context) {
  const existingStages = new Set((inspection.records?.stages || []).map((stage) => stage.name));
  const previews = (project?.crmConfiguration?.pipelineCapture || [])
    .filter((record) => record.inScope && record.stageLabel && !existingStages.has(record.stageLabel))
    .map((record) =>
      normalizePreviewRecord({
        domainId: "crm",
        title: `Create CRM stage ${record.stageLabel}`,
        targetModel: "crm.stage",
        targetIdentifier: record.stageLabel,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: record.stageLabel }],
        safetyClass: "safe",
        prerequisites: ["CRM pipeline governance checkpoint remains in scope."],
        downstreamImpact: "Adds a new pipeline stage for governed opportunity flow.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      })
    );

  const existingTeams = new Set((inspection.records?.teams || []).map((team) => team.name));
  previews.push(
    ...(project?.crmConfiguration?.activityDisciplineCapture || [])
      .filter((record) => record.inScope && record.salesTeamLabel && !existingTeams.has(record.salesTeamLabel))
      .map((record) =>
        normalizePreviewRecord({
          domainId: "crm",
          title: `Create CRM sales team ${record.salesTeamLabel}`,
          targetModel: "crm.team",
          targetIdentifier: record.salesTeamLabel,
          operation: "create",
          intendedChanges: [
            { field: "name", from: "", to: record.salesTeamLabel },
            { field: "alias_name", from: "", to: normalizeAlias(record.salesTeamLabel) }
          ],
          safetyClass: "safe",
          prerequisites: ["CRM sales-team ownership checkpoint remains in scope."],
          downstreamImpact: "Adds a governed CRM sales team scaffold without changing live leads or opportunities.",
          deploymentTarget: context.deploymentTarget,
          branchTarget: context.branchTarget,
          confirmationRequired: true,
          executable: true
        })
      )
  );

  return previews;
}

function normalizeOperationFlowCode(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (["receipt", "receipts", "inbound", "incoming", "in"].includes(normalized)) {
    return "incoming";
  }

  if (["delivery", "deliveries", "outbound", "outgoing", "out"].includes(normalized)) {
    return "outgoing";
  }

  if (["internal", "internal transfer", "internal transfers", "int"].includes(normalized)) {
    return "internal";
  }

  return "";
}

function normalizeAlias(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function normalizeComparableName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function generateSalesPreviews(project, inspection, context) {
  const previews = [];
  
  for (const record of project?.salesConfiguration?.processCapture || []) {
    if (record.inScope && record.quoteFlowMode) {
      previews.push(normalizePreviewRecord({
        domainId: "sales",
        title: `Create Sales Team for ${record.quoteFlowMode}`,
        targetModel: "crm.team",
        targetIdentifier: record.quoteFlowMode,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: record.quoteFlowMode }],
        safetyClass: "safe",
        prerequisites: ["Sales process checkpoint remains in scope."],
        downstreamImpact: "Creates a bounded sales team scaffold to support quote flow.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      }));
    }
  }

  for (const record of project?.salesConfiguration?.pricingCapture || []) {
    if (record.inScope && record.pricingApproachLabel) {
      previews.push(normalizePreviewRecord({
        domainId: "sales",
        title: `Create Pricelist for ${record.pricingApproachLabel}`,
        targetModel: "product.pricelist",
        targetIdentifier: record.pricingApproachLabel,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: record.pricingApproachLabel }],
        safetyClass: "safe",
        prerequisites: ["Sales pricing checkpoint remains in scope."],
        downstreamImpact: "Creates a fundamental pricelist scaffold for order pricing.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      }));
    }
  }
  
  return previews;
}

function generatePurchasePreviews(project, inspection, context) {
  const previews = [];
  
  for (const record of project?.purchaseConfiguration?.vendorPricingCapture || []) {
    if (record.inScope && record.pricingApproachLabel) {
      previews.push(normalizePreviewRecord({
        domainId: "purchase",
        title: `Create Vendor Category for ${record.pricingApproachLabel}`,
        targetModel: "res.partner.category",
        targetIdentifier: `Vendor-${record.pricingApproachLabel}`,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: `Vendor Classification: ${record.pricingApproachLabel}` }],
        safetyClass: "safe",
        prerequisites: ["Purchase vendor pricing checkpoint remains in scope."],
        downstreamImpact: "Creates a bounded vendor classification category for procurement scoping.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      }));
    }
  }

  return previews;
}

function generateManufacturingPreviews(project, inspection, context) {
  const previews = [];
  
  for (const record of project?.manufacturingConfiguration?.productionModeCapture || []) {
    if (record.inScope && record.productionModeLabel) {
      previews.push(normalizePreviewRecord({
        domainId: "manufacturing-mrp",
        title: `Create Workcenter for ${record.productionModeLabel}`,
        targetModel: "mrp.workcenter",
        targetIdentifier: record.productionModeLabel,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: record.productionModeLabel }],
        safetyClass: "safe",
        prerequisites: ["Manufacturing production mode checkpoint remains in scope."],
        downstreamImpact: "Creates a foundational workcenter scaffold for MRP routing.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      }));
    }
  }

  return previews;
}

function generateWebsiteEcommercePreviews(project, inspection, context) {
  const previews = [];
  
  for (const record of project?.websiteEcommerceConfiguration?.deliveryHandoffCapture || []) {
    if (record.inScope && record.handoffType) {
      previews.push(normalizePreviewRecord({
        domainId: "website-ecommerce",
        title: `Create Delivery Carrier for ${record.handoffType}`,
        targetModel: "delivery.carrier",
        targetIdentifier: record.handoffType,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: record.handoffType }],
        safetyClass: "safe",
        prerequisites: ["Website delivery handoff checkpoint remains in scope."],
        downstreamImpact: "Creates a bounded delivery method scaffold for eCommerce checkout.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      }));
    }
  }

  return previews;
}

function generatePosPreviews(project, inspection, context) {
  const previews = [];
  
  for (const record of project?.posConfiguration?.invoicingPolicyCapture || []) {
    if (record.inScope && record.invoicingPolicyLabel) {
      previews.push(normalizePreviewRecord({
        domainId: "pos",
        title: `Create POS Payment Method for ${record.invoicingPolicyLabel}`,
        targetModel: "pos.payment.method",
        targetIdentifier: record.invoicingPolicyLabel,
        operation: "create",
        intendedChanges: [{ field: "name", from: "", to: record.invoicingPolicyLabel }],
        safetyClass: "safe",
        prerequisites: ["POS invoicing policy checkpoint remains in scope."],
        downstreamImpact: "Creates a foundational payment method scaffold for terminal checkout.",
        deploymentTarget: context.deploymentTarget,
        branchTarget: context.branchTarget,
        confirmationRequired: true,
        executable: true
      }));
    }
  }

  return previews;
}
