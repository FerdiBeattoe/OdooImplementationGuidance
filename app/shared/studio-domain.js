export const STUDIO_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-studio-field-governance",
    area: "Field governance",
    title: "Custom field governance policy defined",
    stageId: "extended-modules",
    domainId: "studio",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "studioFieldGovernance",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting custom field governance policy confirmation",
    initialBlockedReason:
      "Custom field governance policy must be explicit before view modifications and report customisations are treated as controlled."
  },
  {
    id: "checkpoint-studio-view-modification",
    area: "View modification",
    title: "View modification baseline defined",
    stageId: "extended-modules",
    domainId: "studio",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "studioViewModification",
    dependencyIds: ["checkpoint-studio-field-governance"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting view modification baseline confirmation",
    initialBlockedReason:
      "View modification baseline cannot be treated as controlled before the custom field governance policy is explicit."
  },
  {
    id: "checkpoint-studio-report-customisation",
    area: "Report customisation",
    title: "Report customisation scope bounded",
    stageId: "extended-modules",
    domainId: "studio",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with operations input",
    guidanceKey: "studioReportCustomisation",
    dependencyIds: ["checkpoint-studio-view-modification"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting report customisation scope confirmation",
    initialBlockedReason:
      "Report customisation scope cannot be treated as go-live controlled before the view modification baseline is explicit."
  },
  {
    id: "checkpoint-studio-access-control",
    area: "Access control",
    title: "Studio access control assumptions bounded",
    stageId: "extended-modules",
    domainId: "studio",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with management input",
    guidanceKey: "studioAccessControl",
    dependencyIds: ["checkpoint-studio-report-customisation"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting Studio access control decision confirmation",
    initialBlockedReason: ""
  }
];

export function isStudioCheckpoint(checkpoint) {
  return checkpoint?.domainId === "studio";
}
