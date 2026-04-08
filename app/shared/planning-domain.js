export const PLANNING_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-planning-role-setup",
    area: "Role setup",
    title: "Planning role baseline defined",
    stageId: "extended-modules",
    domainId: "planning",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead",
    guidanceKey: "planningRoleSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting planning role baseline confirmation",
    initialBlockedReason:
      "Planning role baseline must be explicit before shift templates and resource allocation are treated as controlled."
  },
  {
    id: "checkpoint-planning-shift-template",
    area: "Shift template",
    title: "Shift template baseline defined",
    stageId: "extended-modules",
    domainId: "planning",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead",
    guidanceKey: "planningShiftTemplate",
    dependencyIds: ["checkpoint-planning-role-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting shift template baseline confirmation",
    initialBlockedReason:
      "Shift template baseline cannot be treated as controlled before the planning role baseline is explicit."
  },
  {
    id: "checkpoint-planning-resource-allocation",
    area: "Resource allocation",
    title: "Resource allocation policy bounded",
    stageId: "extended-modules",
    domainId: "planning",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead with HR input",
    guidanceKey: "planningResourceAllocation",
    dependencyIds: ["checkpoint-planning-shift-template"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting resource allocation policy confirmation",
    initialBlockedReason:
      "Resource allocation policy cannot be treated as go-live controlled before the shift template baseline is explicit."
  },
  {
    id: "checkpoint-planning-publish-workflow",
    area: "Publish workflow",
    title: "Publish workflow assumptions bounded",
    stageId: "extended-modules",
    domainId: "planning",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead with management input",
    guidanceKey: "planningPublishWorkflow",
    dependencyIds: ["checkpoint-planning-resource-allocation"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting publish workflow decision confirmation",
    initialBlockedReason: ""
  }
];

export function isPlanningCheckpoint(checkpoint) {
  return checkpoint?.domainId === "planning";
}
