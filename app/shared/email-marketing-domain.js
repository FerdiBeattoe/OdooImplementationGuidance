export const EMAIL_MARKETING_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-email-marketing-mailing-list",
    area: "Mailing list",
    title: "Mailing list baseline defined",
    stageId: "extended-modules",
    domainId: "email-marketing",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead",
    guidanceKey: "emailMarketingMailingList",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting mailing list baseline confirmation",
    initialBlockedReason:
      "Mailing list baseline must be explicit before sender configuration and campaign workflows are treated as controlled."
  },
  {
    id: "checkpoint-email-marketing-sender-configuration",
    area: "Sender configuration",
    title: "Sender configuration defined",
    stageId: "extended-modules",
    domainId: "email-marketing",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with IT input",
    guidanceKey: "emailMarketingSenderConfiguration",
    dependencyIds: ["checkpoint-email-marketing-mailing-list"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting sender configuration confirmation",
    initialBlockedReason:
      "Sender configuration cannot be treated as controlled before the mailing list baseline is explicit."
  },
  {
    id: "checkpoint-email-marketing-unsubscribe-policy",
    area: "Unsubscribe policy",
    title: "Unsubscribe policy scope bounded",
    stageId: "extended-modules",
    domainId: "email-marketing",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with compliance input",
    guidanceKey: "emailMarketingUnsubscribePolicy",
    dependencyIds: ["checkpoint-email-marketing-sender-configuration"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting unsubscribe policy scope confirmation",
    initialBlockedReason:
      "Unsubscribe policy scope cannot be treated as go-live controlled before the sender configuration is explicit."
  },
  {
    id: "checkpoint-email-marketing-campaign-baseline",
    area: "Campaign baseline",
    title: "Campaign baseline assumptions bounded",
    stageId: "extended-modules",
    domainId: "email-marketing",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead",
    guidanceKey: "emailMarketingCampaignBaseline",
    dependencyIds: ["checkpoint-email-marketing-unsubscribe-policy"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting campaign baseline decision confirmation",
    initialBlockedReason: ""
  }
];

export function isEmailMarketingCheckpoint(checkpoint) {
  return checkpoint?.domainId === "email-marketing";
}
