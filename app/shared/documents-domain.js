export const DOCUMENTS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-documents-workspace-governance",
    area: "Workspace governance",
    title: "Document workspace governance baseline defined",
    stageId: "extended-modules",
    domainId: "documents",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Safe",
    checkpointOwnerDefault: "Implementation lead",
    guidanceKey: "documentsWorkspaceGovernance",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting workspace governance baseline evidence",
    initialBlockedReason:
      "Document workspace governance must be explicit before access control and operational document linkage are treated as controlled."
  },
  {
    id: "checkpoint-documents-access-control",
    area: "Access control",
    title: "Document access control bounded",
    stageId: "extended-modules",
    domainId: "documents",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Safe",
    checkpointOwnerDefault: "Implementation lead",
    guidanceKey: "documentsAccessControl",
    dependencyIds: ["checkpoint-documents-workspace-governance"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting document access control evidence",
    initialBlockedReason: ""
  }
];

export function isDocumentsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "documents";
}
