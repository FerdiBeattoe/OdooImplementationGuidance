export const SMS_MARKETING_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-sms-marketing-provider-setup",
    area: "Provider setup",
    title: "SMS provider setup defined",
    stageId: "extended-modules",
    domainId: "sms-marketing",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with IT input",
    guidanceKey: "smsMarketingProviderSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting SMS provider setup confirmation",
    initialBlockedReason:
      "SMS provider setup must be explicit before sender ID configuration and compliance policies are treated as controlled."
  },
  {
    id: "checkpoint-sms-marketing-sender-id",
    area: "Sender ID configuration",
    title: "Sender ID configuration defined",
    stageId: "extended-modules",
    domainId: "sms-marketing",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with IT input",
    guidanceKey: "smsMarketingSenderId",
    dependencyIds: ["checkpoint-sms-marketing-provider-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting sender ID configuration confirmation",
    initialBlockedReason:
      "Sender ID configuration cannot be treated as controlled before the SMS provider setup is explicit."
  },
  {
    id: "checkpoint-sms-marketing-optout-compliance",
    area: "Opt-out compliance",
    title: "Opt-out compliance scope bounded",
    stageId: "extended-modules",
    domainId: "sms-marketing",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with compliance input",
    guidanceKey: "smsMarketingOptoutCompliance",
    dependencyIds: ["checkpoint-sms-marketing-sender-id"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting opt-out compliance scope confirmation",
    initialBlockedReason:
      "Opt-out compliance scope cannot be treated as go-live controlled before the sender ID configuration is explicit."
  },
  {
    id: "checkpoint-sms-marketing-campaign-baseline",
    area: "Campaign baseline",
    title: "Campaign baseline assumptions bounded",
    stageId: "extended-modules",
    domainId: "sms-marketing",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead",
    guidanceKey: "smsMarketingCampaignBaseline",
    dependencyIds: ["checkpoint-sms-marketing-optout-compliance"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting campaign baseline decision confirmation",
    initialBlockedReason: ""
  }
];

export function isSmsMarketingCheckpoint(checkpoint) {
  return checkpoint?.domainId === "sms-marketing";
}
