export const POS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-pos-session-control",
    area: "Session control",
    title: "POS session control baseline defined",
    stageId: "core-operations",
    domainId: "pos",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Retail operations owner",
    guidanceKey: "posSessionControl",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting POS session control evidence",
    initialBlockedReason:
      "POS session control baseline must be explicit before cashier access and accounting-linkage decisions are treated as controlled."
  },
  {
    id: "checkpoint-pos-cashier-access",
    area: "Cashier access design",
    title: "Cashier access design bounded",
    stageId: "core-operations",
    domainId: "pos",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Retail operations owner",
    guidanceKey: "posCashierAccess",
    dependencyIds: ["checkpoint-pos-session-control"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting cashier access design evidence",
    initialBlockedReason:
      "Cashier access design cannot be treated as controlled before the POS session control baseline is explicit."
  },
  {
    id: "checkpoint-pos-accounting-linkage",
    area: "Accounting linkage",
    title: "POS accounting linkage baseline defined",
    stageId: "core-operations",
    domainId: "pos",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Retail operations owner with finance lead input",
    guidanceKey: "posAccountingLinkage",
    dependencyIds: ["checkpoint-pos-session-control", "checkpoint-pos-cashier-access"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting POS accounting linkage evidence",
    initialBlockedReason:
      "POS accounting linkage cannot be treated as go-live controlled before session control and cashier access are explicitly defined."
  }
];

export function isPosCheckpoint(checkpoint) {
  return checkpoint?.domainId === "pos";
}
