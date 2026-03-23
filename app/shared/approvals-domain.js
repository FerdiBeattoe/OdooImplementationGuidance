export const APPROVALS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-approvals-structure",
    area: "Approval structure",
    title: "Approval structure baseline defined",
    stageId: "extended-modules",
    domainId: "approvals",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner",
    guidanceKey: "approvalsStructureBaseline",
    dependencyIds: ["checkpoint-role-approval-design"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting approval structure baseline evidence",
    initialBlockedReason:
      "Approval structure baseline must be explicit before approver authority and traceability are treated as controlled."
  },
  {
    id: "checkpoint-approvals-authority-control",
    area: "Authority control",
    title: "Approver authority and traceability bounded",
    stageId: "extended-modules",
    domainId: "approvals",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner",
    guidanceKey: "approvalsAuthorityControl",
    dependencyIds: ["checkpoint-approvals-structure"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting approver authority and traceability evidence",
    initialBlockedReason: ""
  }
];

export function isApprovalsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "approvals";
}
