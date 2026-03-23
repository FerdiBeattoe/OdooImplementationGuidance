export const MASTER_DATA_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-master-data-core-ownership",
    area: "Core record ownership",
    title: "Core master-data ownership defined",
    stageId: "master-data",
    domainId: "master-data",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Data owner",
    guidanceKey: "masterDataOwnership",
    dependencyIds: ["checkpoint-project-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting master-data ownership evidence",
    initialBlockedReason: "Core record ownership must be explicit before shared data can be treated as controlled."
  },
  {
    id: "checkpoint-master-data-structure",
    area: "Classification structure",
    title: "Shared classification structure defined",
    stageId: "master-data",
    domainId: "master-data",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Data owner",
    guidanceKey: "masterDataStructure",
    dependencyIds: ["checkpoint-master-data-core-ownership"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting shared structure evidence",
    initialBlockedReason: "Shared structure cannot be treated as controlled before ownership is explicit."
  },
  {
    id: "checkpoint-master-data-readiness",
    area: "Downstream data readiness",
    title: "Downstream master-data readiness bounded",
    stageId: "master-data",
    domainId: "master-data",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Data owner",
    guidanceKey: "masterDataReadiness",
    dependencyIds: ["checkpoint-master-data-structure"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting downstream master-data readiness evidence",
    initialBlockedReason: "Downstream master-data readiness remains blocked until shared structure is controlled."
  }
];

export function isMasterDataCheckpoint(checkpoint) {
  return checkpoint?.domainId === "master-data";
}
