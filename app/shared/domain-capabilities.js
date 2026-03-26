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
    summary: "User/group inspection (preview-only). res.users writes are guarded: user creation triggers security group assignment, password policies, and two-factor enrollment that require admin UI confirmation. res.groups writes can cascade access rule changes across the instance.",
    // Model-by-model risk classification:
    // res.users  — GUARDED (preview-only): creating/writing users triggers security group
    //              membership, password policy enforcement, MFA enrollment, and email
    //              invitation workflows. A bad write can lock out the admin or grant
    //              unintended access. Genuinely high-risk for automated execution.
    // res.groups — GUARDED (preview-only): writing group membership or implied_ids
    //              cascades access rule changes (ir.rule, ir.model.access) across the
    //              instance. Not safely automatable without full ACL audit.
    executeSafeModels: [],
    executeGuardedModels: ["res.users", "res.groups"]
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
    targetLevel: 3,
    inspectModels: ["account.journal", "account.tax", "account.account"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["account"],
    summary: "Accounting inspection with bounded journal/tax scaffolding. account.account writes are guarded (chart of accounts structure is localization-sensitive).",
    executeSafeModels: ["account.journal", "account.tax"],
    executeGuardedModels: ["account.account"]
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
    targetLevel: 3,
    inspectModels: ["hr.employee", "hr.department", "hr.job"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["hr"],
    summary: "HR inspection with bounded department/job scaffolding. hr.employee writes are guarded (linked to user accounts, payroll, and leave allocations).",
    // Model-by-model risk classification:
    // hr.department — SAFE (live-executable): reference/config model. Creating a
    //                 department is a low-risk organizational label. No cascading
    //                 security, financial, or payroll side-effects.
    // hr.job        — SAFE (live-executable): reference/config model. Job positions
    //                 are labels used for recruitment and org charts. No cascading
    //                 side-effects.
    // hr.employee   — GUARDED (preview-only): employee records are linked to
    //                 res.users (login access), payroll (hr.payslip), leave
    //                 allocations (hr.leave.allocation), and contract terms
    //                 (hr.contract). Creating an employee can auto-create a
    //                 res.partner and optionally a res.users. Incorrect writes
    //                 can affect payroll calculations and leave balances.
    executeSafeModels: ["hr.department", "hr.job"],
    executeGuardedModels: ["hr.employee"]
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
