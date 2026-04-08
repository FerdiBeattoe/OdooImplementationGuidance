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
    targetLevel: 3,
    inspectModels: ["res.users", "res.groups"],
    previewSupport: true,
    executeSupport: true,
    moduleNames: ["base"],
    summary: "User/group inspection with bounded user provisioning and group assignment. Writes are bounded to implementation-safe fields only (name, login, email, groups_id for res.users; name, implied_ids for res.groups). No password mutation, no MFA bypass, no ir.rule writes.",
    // Model-by-model risk classification:
    // res.users  — BOUNDED SAFE: create/write limited to implementation provisioning
    //              fields (name, login, email, groups_id). Password, MFA, and
    //              security-sensitive fields are excluded from allowed values.
    // res.groups — BOUNDED SAFE: create/write limited to name and implied_ids for
    //              implementation group scaffolding. No ir.rule or ir.model.access
    //              writes — group membership cascading is handled by Odoo's ORM
    //              through the application layer (execute_kw), not by direct mutation.
    executeSafeModels: ["res.users", "res.groups"],
    executeGuardedModels: []
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
    summary: "Accounting inspection with bounded journal/tax/account scaffolding. account.account writes are bounded to implementation-safe fields (code, name, account_type) for chart of accounts provisioning. Localization-sensitive structural changes require admin confirmation.",
    executeSafeModels: ["account.journal", "account.tax", "account.account"],
    executeGuardedModels: []
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
    summary: "HR inspection with bounded department/job/employee scaffolding. hr.employee writes are bounded to implementation-safe fields (name, job_id, department_id, work_email) for employee provisioning. Payroll, leave, and contract fields are excluded.",
    // Model-by-model risk classification:
    // hr.department — SAFE (live-executable): reference/config model. Creating a
    //                 department is a low-risk organizational label. No cascading
    //                 security, financial, or payroll side-effects.
    // hr.job        — SAFE (live-executable): reference/config model. Job positions
    //                 are labels used for recruitment and org charts. No cascading
    //                 side-effects.
    // hr.employee   — BOUNDED SAFE: create/write limited to implementation
    //                 provisioning fields (name, job_id, department_id, work_email).
    //                 Payroll (hr.payslip), leave (hr.leave.allocation), and contract
    //                 (hr.contract) fields are excluded. The ORM application layer
    //                 handles res.partner auto-creation safely through execute_kw.
    executeSafeModels: ["hr.department", "hr.job", "hr.employee"],
    executeGuardedModels: []
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
  },
  "field-service": {
    targetLevel: 2,
    inspectModels: ["project.task"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["industry_fsm"],
    summary: "Field Service inspection with job preview and scheduling guidance only."
  },
  maintenance: {
    targetLevel: 2,
    inspectModels: ["maintenance.equipment"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["maintenance"],
    summary: "Maintenance inspection with equipment/setup preview only."
  },
  rental: {
    targetLevel: 2,
    inspectModels: ["product.template"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["rental"],
    summary: "Rental inspection with product and contract preview only."
  },
  repairs: {
    targetLevel: 2,
    inspectModels: ["repair.order"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["repair"],
    summary: "Repairs inspection with work order preview only."
  },
  subscriptions: {
    targetLevel: 2,
    inspectModels: ["sale.subscription.plan"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["sale_subscription"],
    summary: "Subscriptions inspection with plan/setup preview only."
  },
  timesheets: {
    targetLevel: 2,
    inspectModels: ["hr.timesheet"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["hr_timesheet"],
    summary: "Timesheets inspection with entry/setup preview only."
  },
  expenses: {
    targetLevel: 2,
    inspectModels: ["hr.expense"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["hr_expense"],
    summary: "Expenses inspection with report/setup preview only."
  },
  attendance: {
    targetLevel: 2,
    inspectModels: ["hr.attendance"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["hr_attendance"],
    summary: "Attendance inspection with check-in/out preview only."
  },
  recruitment: {
    targetLevel: 2,
    inspectModels: ["hr.applicant"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["hr_recruitment"],
    summary: "Recruitment inspection with pipeline/application preview only."
  },
  fleet: {
    targetLevel: 2,
    inspectModels: ["fleet.vehicle"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["fleet"],
    summary: "Fleet inspection with vehicle/setup preview only."
  },
  events: {
    targetLevel: 2,
    inspectModels: ["event.event"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["event"],
    summary: "Events inspection with event/campaign preview only."
  },
  "email-marketing": {
    targetLevel: 2,
    inspectModels: ["mailing.mailing"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["mass_mailing"],
    summary: "Email Marketing inspection with mailing preview only."
  },
  helpdesk: {
    targetLevel: 2,
    inspectModels: ["helpdesk.ticket"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["helpdesk"],
    summary: "Helpdesk inspection with ticket/setup preview only."
  },
  payroll: {
    targetLevel: 2,
    inspectModels: ["hr.payslip"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["hr_payroll"],
    summary: "Payroll inspection with payslip/setup preview only."
  },
  planning: {
    targetLevel: 2,
    inspectModels: ["planning.slot"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["planning"],
    summary: "Planning inspection with shift/setup preview only."
  },
  knowledge: {
    targetLevel: 2,
    inspectModels: ["knowledge.article"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["knowledge"],
    summary: "Knowledge inspection with article/setup preview only."
  },
  discuss: {
    targetLevel: 2,
    inspectModels: ["mail.channel"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["mail"],
    summary: "Discuss inspection with channel/messaging preview only."
  },
  "outgoing-mail": {
    targetLevel: 2,
    inspectModels: ["ir.mail_server"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["base"],
    summary: "Outgoing Mail inspection with SMTP/sender preview only."
  },
  "incoming-mail": {
    targetLevel: 2,
    inspectModels: ["fetchmail.server"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["fetchmail"],
    summary: "Incoming Mail inspection with IMAP/POP3 preview only."
  },
  "accounting-reports": {
    targetLevel: 2,
    inspectModels: ["account.report"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["account_reports"],
    summary: "Accounting Reports inspection with report structure preview only."
  },
  spreadsheet: {
    targetLevel: 2,
    inspectModels: ["spreadsheet.template"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["spreadsheet"],
    summary: "Spreadsheet inspection with template/setup preview only."
  },
  "live-chat": {
    targetLevel: 2,
    inspectModels: ["im_livechat.channel"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["im_livechat"],
    summary: "Live Chat inspection with channel/operator preview only."
  },
  whatsapp: {
    targetLevel: 2,
    inspectModels: ["whatsapp.template"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["whatsapp"],
    summary: "WhatsApp inspection with template/account preview only."
  },
  "sms-marketing": {
    targetLevel: 2,
    inspectModels: ["sms.sms"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["sms"],
    summary: "SMS Marketing inspection with provider/campaign preview only."
  },
  calendar: {
    targetLevel: 2,
    inspectModels: ["calendar.event"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["calendar"],
    summary: "Calendar inspection with event/sync preview only."
  },
  iot: {
    targetLevel: 2,
    inspectModels: ["iot.device"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["iot"],
    summary: "IoT inspection with device/box preview only."
  },
  studio: {
    targetLevel: 2,
    inspectModels: ["ir.model"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["web_studio"],
    summary: "Studio inspection with customisation/setup preview only."
  },
  consolidation: {
    targetLevel: 2,
    inspectModels: ["consolidation.company"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["account_consolidation"],
    summary: "Consolidation inspection with company/period preview only."
  },
  lunch: {
    targetLevel: 2,
    inspectModels: ["lunch.supplier"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["lunch"],
    summary: "Lunch inspection with supplier/product preview only."
  },
  referrals: {
    targetLevel: 2,
    inspectModels: ["hr.referral.stage"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["hr_referral"],
    summary: "Referrals inspection with stage/reward preview only."
  },
  loyalty: {
    targetLevel: 2,
    inspectModels: ["loyalty.program"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["loyalty"],
    summary: "Loyalty inspection with program/reward preview only."
  },
  appraisals: {
    targetLevel: 2,
    inspectModels: ["hr.appraisal"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["hr_appraisal"],
    summary: "Appraisals inspection with cycle/goal preview only."
  },
  voip: {
    targetLevel: 2,
    inspectModels: ["voip.provider"],
    previewSupport: true,
    executeSupport: false,
    moduleNames: ["voip"],
    summary: "VoIP inspection with provider/extension preview only."
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
