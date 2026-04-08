export const APPRAISALS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-appraisals-cycle-setup",
    area: "Cycle setup",
    title: "Appraisal cycle setup defined",
    stageId: "extended-modules",
    domainId: "appraisals",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "appraisalsCycleSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting appraisal cycle setup confirmation",
    initialBlockedReason:
      "Appraisal cycle setup must be explicit before goal templates and rating scales are treated as controlled."
  },
  {
    id: "checkpoint-appraisals-goal-template",
    area: "Goal template",
    title: "Goal template baseline defined",
    stageId: "extended-modules",
    domainId: "appraisals",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with management input",
    guidanceKey: "appraisalsGoalTemplate",
    dependencyIds: ["checkpoint-appraisals-cycle-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting goal template baseline confirmation",
    initialBlockedReason:
      "Goal template baseline cannot be treated as controlled before the appraisal cycle setup is explicit."
  },
  {
    id: "checkpoint-appraisals-rating-scale",
    area: "Rating scale",
    title: "Rating scale configuration scope bounded",
    stageId: "extended-modules",
    domainId: "appraisals",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "appraisalsRatingScale",
    dependencyIds: ["checkpoint-appraisals-goal-template"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting rating scale configuration scope confirmation",
    initialBlockedReason:
      "Rating scale configuration scope cannot be treated as go-live controlled before the goal template baseline is explicit."
  },
  {
    id: "checkpoint-appraisals-manager-access",
    area: "Manager access",
    title: "Manager access policy assumptions bounded",
    stageId: "extended-modules",
    domainId: "appraisals",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with IT input",
    guidanceKey: "appraisalsManagerAccess",
    dependencyIds: ["checkpoint-appraisals-rating-scale"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting manager access policy decision confirmation",
    initialBlockedReason: ""
  }
];

export function isAppraisalsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "appraisals";
}
