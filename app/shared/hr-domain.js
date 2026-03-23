export const HR_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-hr-employee-structure",
    area: "Employee structure",
    title: "Employee and department structure baseline defined",
    stageId: "extended-modules",
    domainId: "hr",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "hrEmployeeStructure",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting HR structure baseline evidence",
    initialBlockedReason:
      "Employee and department structure must be explicit before approval relationships and access-dependent HR work are treated as controlled."
  },
  {
    id: "checkpoint-hr-approval-relationships",
    area: "Approval relationships",
    title: "Manager and approval relationships bounded",
    stageId: "extended-modules",
    domainId: "hr",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with project owner input",
    guidanceKey: "hrApprovalRelationships",
    dependencyIds: ["checkpoint-hr-employee-structure"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting manager and approval relationship evidence",
    initialBlockedReason:
      "Manager and approval relationships cannot be treated as go-live controlled before the employee structure baseline is explicit."
  }
];

export function isHrCheckpoint(checkpoint) {
  return checkpoint?.domainId === "hr";
}
