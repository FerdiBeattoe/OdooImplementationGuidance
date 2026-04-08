export const DISCUSS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-discuss-channel-structure",
    area: "Channel structure",
    title: "Channel structure baseline defined",
    stageId: "extended-modules",
    domainId: "discuss",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "discussChannelStructure",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting channel structure baseline confirmation",
    initialBlockedReason:
      "Channel structure baseline must be explicit before messaging policies and notification rules are treated as controlled."
  },
  {
    id: "checkpoint-discuss-messaging-policy",
    area: "Messaging policy",
    title: "Messaging policy defined",
    stageId: "extended-modules",
    domainId: "discuss",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "discussMessagingPolicy",
    dependencyIds: ["checkpoint-discuss-channel-structure"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting messaging policy confirmation",
    initialBlockedReason:
      "Messaging policy cannot be treated as controlled before the channel structure baseline is explicit."
  },
  {
    id: "checkpoint-discuss-notification-rules",
    area: "Notification rules",
    title: "Notification rules scope bounded",
    stageId: "extended-modules",
    domainId: "discuss",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with operations input",
    guidanceKey: "discussNotificationRules",
    dependencyIds: ["checkpoint-discuss-messaging-policy"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting notification rules scope confirmation",
    initialBlockedReason:
      "Notification rules scope cannot be treated as go-live controlled before the messaging policy is explicit."
  },
  {
    id: "checkpoint-discuss-external-email",
    area: "External email integration",
    title: "External email integration assumptions bounded",
    stageId: "extended-modules",
    domainId: "discuss",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "discussExternalEmail",
    dependencyIds: ["checkpoint-discuss-notification-rules"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting external email integration decision confirmation",
    initialBlockedReason: ""
  }
];

export function isDiscussCheckpoint(checkpoint) {
  return checkpoint?.domainId === "discuss";
}
