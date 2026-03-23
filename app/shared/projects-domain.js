export const PROJECTS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-projects-structure",
    area: "Project structure",
    title: "Project structure baseline defined",
    stageId: "extended-modules",
    domainId: "projects",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner",
    guidanceKey: "projectsStructureBaseline",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting project structure baseline evidence",
    initialBlockedReason:
      "Project structure baseline must be explicit before task flow, billing linkage, and ownership decisions are treated as controlled."
  },
  {
    id: "checkpoint-projects-billing-linkage",
    area: "Billing linkage",
    title: "Project billing linkage baseline defined",
    stageId: "extended-modules",
    domainId: "projects",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner with finance lead input",
    guidanceKey: "projectsBillingLinkage",
    dependencyIds: ["checkpoint-projects-structure"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting project billing linkage evidence",
    initialBlockedReason:
      "Project billing linkage cannot be treated as go-live controlled before the project structure baseline is explicit."
  },
  {
    id: "checkpoint-projects-ownership",
    area: "Ownership and execution",
    title: "Project ownership and execution policy bounded",
    stageId: "extended-modules",
    domainId: "projects",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner",
    guidanceKey: "projectsOwnershipPolicy",
    dependencyIds: ["checkpoint-projects-structure"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting project ownership and execution policy evidence",
    initialBlockedReason: ""
  }
];

export function isProjectsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "projects";
}
