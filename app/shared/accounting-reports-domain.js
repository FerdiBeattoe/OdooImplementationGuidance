export const ACCOUNTING_REPORTS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-accounting-reports-financial-baseline",
    area: "Financial report baseline",
    title: "Financial report baseline defined",
    stageId: "extended-modules",
    domainId: "accounting-reports",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "accountingReportsFinancialBaseline",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting financial report baseline confirmation",
    initialBlockedReason:
      "Financial report baseline must be explicit before tax report mapping and custom report structures are treated as controlled."
  },
  {
    id: "checkpoint-accounting-reports-tax-mapping",
    area: "Tax report mapping",
    title: "Tax report mapping defined",
    stageId: "extended-modules",
    domainId: "accounting-reports",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead with tax input",
    guidanceKey: "accountingReportsTaxMapping",
    dependencyIds: ["checkpoint-accounting-reports-financial-baseline"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting tax report mapping confirmation",
    initialBlockedReason:
      "Tax report mapping cannot be treated as controlled before the financial report baseline is explicit."
  },
  {
    id: "checkpoint-accounting-reports-custom-structure",
    area: "Custom report structure",
    title: "Custom report structure scope bounded",
    stageId: "extended-modules",
    domainId: "accounting-reports",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "accountingReportsCustomStructure",
    dependencyIds: ["checkpoint-accounting-reports-tax-mapping"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting custom report structure scope confirmation",
    initialBlockedReason:
      "Custom report structure scope cannot be treated as go-live controlled before the tax report mapping is explicit."
  },
  {
    id: "checkpoint-accounting-reports-fiscal-year",
    area: "Fiscal year reporting",
    title: "Fiscal year reporting setup assumptions bounded",
    stageId: "extended-modules",
    domainId: "accounting-reports",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "accountingReportsFiscalYear",
    dependencyIds: ["checkpoint-accounting-reports-custom-structure"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting fiscal year reporting setup decision confirmation",
    initialBlockedReason: ""
  }
];

export function isAccountingReportsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "accounting-reports";
}
