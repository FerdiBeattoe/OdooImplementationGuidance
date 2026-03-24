import { DOMAINS } from "./domains.js";

export const DOMAIN_CAPABILITY_LEVELS = [0, 1, 2, 3, 4];

const DOMAIN_SUPPORT = {
  "foundation-company-localization": {
    targetLevel: 3,
    inspectModels: ["res.company", "res.lang", "res.currency", "ir.module.module"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["base"],
    summary: "Company context and low-risk base setting control."
  },
  "users-roles-security": {
    targetLevel: 2,
    inspectModels: ["res.users", "res.groups"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["base"],
    summary: "Role and group inspection with preview-only governance."
  },
  "master-data": {
    targetLevel: 3,
    inspectModels: ["res.partner", "product.template", "product.category", "res.partner.category", "uom.category"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["product", "contacts", "uom"],
    summary: "Shared-data inspection with bounded create-first category scaffolding."
  },
  crm: {
    targetLevel: 4,
    inspectModels: ["crm.stage", "crm.team"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["crm"],
    summary: "Pipeline and sales-team inspection with bounded create-first scaffolding."
  },
  sales: {
    targetLevel: 4,
    inspectModels: ["product.pricelist", "sale.order", "crm.team"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["sale_management", "sale"],
    summary: "Sales baseline inspection with bounded configuration scaffolding."
  },
  purchase: {
    targetLevel: 4,
    inspectModels: ["purchase.order", "res.partner.category"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["purchase"],
    summary: "Purchase inspection with bounded configuration scaffolding."
  },
  inventory: {
    targetLevel: 4,
    inspectModels: ["stock.warehouse", "stock.picking.type", "stock.route"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["stock"],
    summary: "Inventory inspection with bounded warehouse and operation-type scaffolding."
  },
  "manufacturing-mrp": {
    targetLevel: 4,
    inspectModels: ["mrp.bom", "mrp.workcenter"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["mrp"],
    summary: "Manufacturing inspection with bounded workcenter scaffolding."
  },
  plm: {
    targetLevel: 2,
    inspectModels: ["mrp.eco", "mrp.eco.stage"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["mrp_plm"],
    summary: "PLM inspection with activation/setup preview only."
  },
  accounting: {
    targetLevel: 2,
    inspectModels: ["account.journal", "account.tax", "account.account"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["account"],
    summary: "Accounting inspection with preview-only configuration intent."
  },
  pos: {
    targetLevel: 4,
    inspectModels: ["pos.config", "pos.payment.method"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["point_of_sale"],
    summary: "POS inspection with bounded setup scaffolding."
  },
  "website-ecommerce": {
    targetLevel: 4,
    inspectModels: ["website", "payment.provider", "delivery.carrier"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["website_sale", "website"],
    summary: "Website inspection with bounded delivery method scaffolding."
  },
  projects: {
    targetLevel: 2,
    inspectModels: ["project.project", "project.task.type"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["project"],
    summary: "Projects inspection with module/setup preview only."
  },
  hr: {
    targetLevel: 2,
    inspectModels: ["hr.employee", "hr.department"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["hr"],
    summary: "HR inspection with module/setup preview only."
  },
  quality: {
    targetLevel: 2,
    inspectModels: ["quality.point", "quality.check"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["quality_control"],
    summary: "Quality inspection with module/setup preview only."
  },
  documents: {
    targetLevel: 2,
    inspectModels: ["documents.document"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["documents"],
    summary: "Documents inspection with module/setup preview only."
  },
  sign: {
    targetLevel: 2,
    inspectModels: ["sign.template", "sign.request"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["sign"],
    summary: "Sign inspection with module/setup preview only."
  },
  approvals: {
    targetLevel: 2,
    inspectModels: ["approval.category", "approval.request"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["approvals"],
    summary: "Approvals inspection with module/setup preview only."
  }
};

export function getDomainSupport(domainId) {
  return DOMAIN_SUPPORT[domainId] || {
    targetLevel: 0,
    inspectModels: [],
    previewSupport: false,
    executeSupport: false,
    moduleNames: [],
    summary: "Manual-only"
  };
}

export function getAllDomainCapabilities(project) {
  return DOMAINS.map((domain) => getDomainCapability(project, domain.id));
}

export function getDomainCapability(project, domainId) {
  const support = getDomainSupport(domainId);
  const inspection = project?.inspectionState?.domains?.[domainId] || null;
  const connectionLevel = project?.connectionState?.capabilityLevel || "manual-only";

  let currentLevel = 0;

  if (connectionLevel !== "manual-only" && inspection?.status === "complete") {
    currentLevel = 1;
  }

  if (support.previewSupport && inspection?.lastPreviewableAt) {
    currentLevel = Math.max(currentLevel, 2);
  }

  if (support.executeSupport && inspection?.lastExecutableAt) {
    currentLevel = Math.max(currentLevel, support.targetLevel >= 4 ? 4 : 3);
  }

  return {
    domainId,
    targetLevel: support.targetLevel,
    currentLevel,
    label: renderDomainCapabilityLevel(Math.min(currentLevel, support.targetLevel)),
    targetLabel: renderDomainCapabilityLevel(support.targetLevel),
    summary: support.summary,
    supportsInspection: support.inspectModels.length > 0,
    supportsPreview: support.previewSupport,
    supportsExecution: support.executeSupport
  };
}

export function renderDomainCapabilityLevel(level) {
  switch (level) {
    case 1:
      return "Inspectable";
    case 2:
      return "Previewable";
    case 3:
      return "Partially executable";
    case 4:
      return "Bounded executable";
    default:
      return "Manual-only";
  }
}
