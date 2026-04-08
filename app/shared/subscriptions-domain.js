export const SUBSCRIPTIONS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-subscriptions-plan-setup",
    area: "Plan setup",
    title: "Subscription plan baseline defined",
    stageId: "extended-modules",
    domainId: "subscriptions",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Subscriptions lead",
    guidanceKey: "subscriptionsPlanSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting subscription plan baseline confirmation",
    initialBlockedReason:
      "Subscription plan baseline must be explicit before recurring billing and renewal workflows are treated as controlled."
  },
  {
    id: "checkpoint-subscriptions-recurring-billing",
    area: "Recurring billing",
    title: "Recurring billing rules defined",
    stageId: "extended-modules",
    domainId: "subscriptions",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Subscriptions lead with accounting input",
    guidanceKey: "subscriptionsRecurringBilling",
    dependencyIds: ["checkpoint-subscriptions-plan-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting recurring billing rules confirmation",
    initialBlockedReason:
      "Recurring billing rules cannot be treated as controlled before the subscription plan baseline is explicit."
  },
  {
    id: "checkpoint-subscriptions-churn-renewal",
    area: "Churn and renewal",
    title: "Churn and renewal workflow bounded",
    stageId: "extended-modules",
    domainId: "subscriptions",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Subscriptions lead with operations input",
    guidanceKey: "subscriptionsChurnRenewal",
    dependencyIds: ["checkpoint-subscriptions-recurring-billing"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting churn and renewal workflow confirmation",
    initialBlockedReason:
      "Churn and renewal workflow cannot be treated as go-live controlled before recurring billing rules are explicit."
  },
  {
    id: "checkpoint-subscriptions-customer-portal",
    area: "Customer portal",
    title: "Customer portal access assumptions bounded",
    stageId: "extended-modules",
    domainId: "subscriptions",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Subscriptions lead with customer service input",
    guidanceKey: "subscriptionsCustomerPortal",
    dependencyIds: ["checkpoint-subscriptions-churn-renewal"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting customer portal access decision confirmation",
    initialBlockedReason: ""
  }
];

export function isSubscriptionsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "subscriptions";
}
