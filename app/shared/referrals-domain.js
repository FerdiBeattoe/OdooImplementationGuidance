export const REFERRALS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-referrals-stage-setup",
    area: "Stage setup",
    title: "Referral stage setup defined",
    stageId: "extended-modules",
    domainId: "referrals",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "referralsStageSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting referral stage setup confirmation",
    initialBlockedReason:
      "Referral stage setup must be explicit before reward policies and eligibility rules are treated as controlled."
  },
  {
    id: "checkpoint-referrals-reward-policy",
    area: "Reward policy",
    title: "Reward policy baseline defined",
    stageId: "extended-modules",
    domainId: "referrals",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with finance input",
    guidanceKey: "referralsRewardPolicy",
    dependencyIds: ["checkpoint-referrals-stage-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting reward policy baseline confirmation",
    initialBlockedReason:
      "Reward policy baseline cannot be treated as controlled before the referral stage setup is explicit."
  },
  {
    id: "checkpoint-referrals-eligibility-rules",
    area: "Eligibility rules",
    title: "Employee eligibility rules scope bounded",
    stageId: "extended-modules",
    domainId: "referrals",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "referralsEligibilityRules",
    dependencyIds: ["checkpoint-referrals-reward-policy"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting employee eligibility rules scope confirmation",
    initialBlockedReason:
      "Employee eligibility rules scope cannot be treated as go-live controlled before the reward policy baseline is explicit."
  },
  {
    id: "checkpoint-referrals-tracking-configuration",
    area: "Tracking configuration",
    title: "Tracking configuration assumptions bounded",
    stageId: "extended-modules",
    domainId: "referrals",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "referralsTrackingConfiguration",
    dependencyIds: ["checkpoint-referrals-eligibility-rules"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting tracking configuration decision confirmation",
    initialBlockedReason: ""
  }
];

export function isReferralsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "referrals";
}
