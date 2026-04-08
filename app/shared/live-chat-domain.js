export const LIVE_CHAT_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-live-chat-channel-setup",
    area: "Channel setup",
    title: "Live chat channel baseline defined",
    stageId: "extended-modules",
    domainId: "live-chat",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead",
    guidanceKey: "liveChatChannelSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting live chat channel baseline confirmation",
    initialBlockedReason:
      "Live chat channel baseline must be explicit before operator assignment and chatbot configuration are treated as controlled."
  },
  {
    id: "checkpoint-live-chat-operator-assignment",
    area: "Operator assignment",
    title: "Operator assignment policy defined",
    stageId: "extended-modules",
    domainId: "live-chat",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead",
    guidanceKey: "liveChatOperatorAssignment",
    dependencyIds: ["checkpoint-live-chat-channel-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting operator assignment policy confirmation",
    initialBlockedReason:
      "Operator assignment policy cannot be treated as controlled before the live chat channel baseline is explicit."
  },
  {
    id: "checkpoint-live-chat-chatbot-baseline",
    area: "Chatbot baseline",
    title: "Chatbot baseline scope bounded",
    stageId: "extended-modules",
    domainId: "live-chat",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead with IT input",
    guidanceKey: "liveChatChatbotBaseline",
    dependencyIds: ["checkpoint-live-chat-operator-assignment"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting chatbot baseline scope confirmation",
    initialBlockedReason:
      "Chatbot baseline scope cannot be treated as controlled before the operator assignment policy is explicit."
  },
  {
    id: "checkpoint-live-chat-website-integration",
    area: "Website integration",
    title: "Website integration scope bounded",
    stageId: "extended-modules",
    domainId: "live-chat",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead with web input",
    guidanceKey: "liveChatWebsiteIntegration",
    dependencyIds: ["checkpoint-live-chat-chatbot-baseline"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting website integration scope confirmation",
    initialBlockedReason:
      "Website integration scope cannot be treated as go-live controlled before the chatbot baseline is explicit."
  },
  {
    id: "checkpoint-live-chat-offline-policy",
    area: "Offline policy",
    title: "Offline policy assumptions bounded",
    stageId: "extended-modules",
    domainId: "live-chat",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead",
    guidanceKey: "liveChatOfflinePolicy",
    dependencyIds: ["checkpoint-live-chat-website-integration"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting offline policy decision confirmation",
    initialBlockedReason: ""
  }
];

export function isLiveChatCheckpoint(checkpoint) {
  return checkpoint?.domainId === "live-chat";
}
