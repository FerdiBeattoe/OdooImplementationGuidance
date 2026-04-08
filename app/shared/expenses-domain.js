export const EXPENSES_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-expenses-policy",
    area: "Expense policy",
    title: "Expense policy baseline defined",
    stageId: "extended-modules",
    domainId: "expenses",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with finance input",
    guidanceKey: "expensesPolicy",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting expense policy baseline confirmation",
    initialBlockedReason:
      "Expense policy baseline must be explicit before approval workflows and accounting linkage are treated as controlled."
  },
  {
    id: "checkpoint-expenses-approval-workflow",
    area: "Approval workflow",
    title: "Expense approval workflow defined",
    stageId: "extended-modules",
    domainId: "expenses",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with finance input",
    guidanceKey: "expensesApprovalWorkflow",
    dependencyIds: ["checkpoint-expenses-policy"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting expense approval workflow confirmation",
    initialBlockedReason:
      "Expense approval workflow cannot be treated as controlled before the expense policy baseline is explicit."
  },
  {
    id: "checkpoint-expenses-accounting-linkage",
    area: "Accounting linkage",
    title: "Expense accounting linkage bounded",
    stageId: "extended-modules",
    domainId: "expenses",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead with HR input",
    guidanceKey: "expensesAccountingLinkage",
    dependencyIds: ["checkpoint-expenses-approval-workflow"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting expense accounting linkage confirmation",
    initialBlockedReason:
      "Expense accounting linkage cannot be treated as go-live controlled before the approval workflow is explicit."
  },
  {
    id: "checkpoint-expenses-receipt-requirements",
    area: "Receipt requirements",
    title: "Receipt requirements assumptions bounded",
    stageId: "extended-modules",
    domainId: "expenses",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with compliance input",
    guidanceKey: "expensesReceiptRequirements",
    dependencyIds: ["checkpoint-expenses-accounting-linkage"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting receipt requirements decision confirmation",
    initialBlockedReason: ""
  }
];

export function isExpensesCheckpoint(checkpoint) {
  return checkpoint?.domainId === "expenses";
}
