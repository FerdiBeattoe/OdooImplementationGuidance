export const LOYALTY_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-loyalty-program-setup",
    area: "Program setup",
    title: "Loyalty program setup defined",
    stageId: "extended-modules",
    domainId: "loyalty",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with operations input",
    guidanceKey: "loyaltyProgramSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting loyalty program setup confirmation",
    initialBlockedReason:
      "Loyalty program setup must be explicit before reward rules and expiry policies are treated as controlled."
  },
  {
    id: "checkpoint-loyalty-reward-rules",
    area: "Reward rules",
    title: "Reward rules baseline defined",
    stageId: "extended-modules",
    domainId: "loyalty",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead",
    guidanceKey: "loyaltyRewardRules",
    dependencyIds: ["checkpoint-loyalty-program-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting reward rules baseline confirmation",
    initialBlockedReason:
      "Reward rules baseline cannot be treated as controlled before the loyalty program setup is explicit."
  },
  {
    id: "checkpoint-loyalty-expiry-policy",
    area: "Point expiry policy",
    title: "Point expiry policy scope bounded",
    stageId: "extended-modules",
    domainId: "loyalty",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with finance input",
    guidanceKey: "loyaltyExpiryPolicy",
    dependencyIds: ["checkpoint-loyalty-reward-rules"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting point expiry policy scope confirmation",
    initialBlockedReason:
      "Point expiry policy scope cannot be treated as go-live controlled before the reward rules baseline is explicit."
  },
  {
    id: "checkpoint-loyalty-pos-ecommerce",
    area: "POS and eCommerce integration",
    title: "POS and eCommerce integration assumptions bounded",
    stageId: "extended-modules",
    domainId: "loyalty",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with IT input",
    guidanceKey: "loyaltyPosEcommerce",
    dependencyIds: ["checkpoint-loyalty-expiry-policy"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting POS and eCommerce integration decision confirmation",
    initialBlockedReason: ""
  }
];

export function isLoyaltyCheckpoint(checkpoint) {
  return checkpoint?.domainId === "loyalty";
}
