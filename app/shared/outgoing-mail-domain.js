export const OUTGOING_MAIL_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-outgoing-mail-smtp-configuration",
    area: "SMTP configuration",
    title: "SMTP server configuration defined",
    stageId: "extended-modules",
    domainId: "outgoing-mail",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "outgoingMailSmtpConfiguration",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting SMTP server configuration confirmation",
    initialBlockedReason:
      "SMTP server configuration must be explicit before sender address policies and deliverability are treated as controlled."
  },
  {
    id: "checkpoint-outgoing-mail-sender-address",
    area: "Sender address policy",
    title: "Sender address policy defined",
    stageId: "extended-modules",
    domainId: "outgoing-mail",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "outgoingMailSenderAddress",
    dependencyIds: ["checkpoint-outgoing-mail-smtp-configuration"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting sender address policy confirmation",
    initialBlockedReason:
      "Sender address policy cannot be treated as controlled before the SMTP server configuration is explicit."
  },
  {
    id: "checkpoint-outgoing-mail-alias-setup",
    area: "Email alias setup",
    title: "Email alias setup per document type bounded",
    stageId: "extended-modules",
    domainId: "outgoing-mail",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with operations input",
    guidanceKey: "outgoingMailAliasSetup",
    dependencyIds: ["checkpoint-outgoing-mail-sender-address"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting email alias setup confirmation",
    initialBlockedReason:
      "Email alias setup cannot be treated as controlled before the sender address policy is explicit."
  },
  {
    id: "checkpoint-outgoing-mail-deliverability",
    area: "Deliverability baseline",
    title: "Deliverability baseline bounded",
    stageId: "extended-modules",
    domainId: "outgoing-mail",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "outgoingMailDeliverability",
    dependencyIds: ["checkpoint-outgoing-mail-alias-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting deliverability baseline confirmation",
    initialBlockedReason:
      "Deliverability baseline cannot be treated as go-live controlled before the email alias setup is explicit."
  },
  {
    id: "checkpoint-outgoing-mail-test-send",
    area: "Test send verification",
    title: "Test send verification assumptions bounded",
    stageId: "extended-modules",
    domainId: "outgoing-mail",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "outgoingMailTestSend",
    dependencyIds: ["checkpoint-outgoing-mail-deliverability"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting test send verification decision confirmation",
    initialBlockedReason: ""
  }
];

export function isOutgoingMailCheckpoint(checkpoint) {
  return checkpoint?.domainId === "outgoing-mail";
}
