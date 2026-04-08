export const PAYROLL_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-payroll-structure-setup",
    area: "Structure setup",
    title: "Payroll structure baseline defined",
    stageId: "extended-modules",
    domainId: "payroll",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with finance input",
    guidanceKey: "payrollStructureSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting payroll structure baseline confirmation",
    initialBlockedReason:
      "Payroll structure baseline must be explicit before salary rules and payslip workflows are treated as controlled."
  },
  {
    id: "checkpoint-payroll-salary-rules",
    area: "Salary rules",
    title: "Salary rules baseline defined",
    stageId: "extended-modules",
    domainId: "payroll",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with finance input",
    guidanceKey: "payrollSalaryRules",
    dependencyIds: ["checkpoint-payroll-structure-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting salary rules baseline confirmation",
    initialBlockedReason:
      "Salary rules baseline cannot be treated as controlled before the payroll structure baseline is explicit."
  },
  {
    id: "checkpoint-payroll-payslip-workflow",
    area: "Payslip workflow",
    title: "Payslip workflow scope bounded",
    stageId: "extended-modules",
    domainId: "payroll",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with finance input",
    guidanceKey: "payrollPayslipWorkflow",
    dependencyIds: ["checkpoint-payroll-salary-rules"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting payslip workflow scope confirmation",
    initialBlockedReason:
      "Payslip workflow scope cannot be treated as go-live controlled before the salary rules baseline is explicit."
  },
  {
    id: "checkpoint-payroll-accounting-linkage",
    area: "Accounting linkage",
    title: "Payroll accounting linkage assumptions bounded",
    stageId: "extended-modules",
    domainId: "payroll",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead with HR input",
    guidanceKey: "payrollAccountingLinkage",
    dependencyIds: ["checkpoint-payroll-payslip-workflow"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting payroll accounting linkage decision confirmation",
    initialBlockedReason: ""
  }
];

export function isPayrollCheckpoint(checkpoint) {
  return checkpoint?.domainId === "payroll";
}
