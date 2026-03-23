export const PLM_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-plm-change-control",
    area: "Change control design",
    title: "Engineering change control baseline defined",
    stageId: "extended-modules",
    domainId: "plm",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Engineering lead",
    guidanceKey: "plmChangeControlBaseline",
    dependencyIds: ["checkpoint-manufacturing-bom-governance"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting engineering change control baseline evidence",
    initialBlockedReason:
      "Engineering change control baseline must be explicit before ECO approval flow and BOM revision governance are treated as controlled."
  },
  {
    id: "checkpoint-plm-approval-design",
    area: "Approval design",
    title: "ECO approval design bounded",
    stageId: "extended-modules",
    domainId: "plm",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Engineering lead with manufacturing lead input",
    guidanceKey: "plmApprovalDesign",
    dependencyIds: ["checkpoint-plm-change-control"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting ECO approval design evidence",
    initialBlockedReason:
      "ECO approval design cannot be treated as go-live controlled before the engineering change control baseline is explicit."
  }
];

export function isPlmCheckpoint(checkpoint) {
  return checkpoint?.domainId === "plm";
}
