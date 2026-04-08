export const INCOMING_MAIL_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-incoming-mail-server-setup",
    area: "Server setup",
    title: "IMAP/POP3 server setup defined",
    stageId: "extended-modules",
    domainId: "incoming-mail",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "incomingMailServerSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting IMAP/POP3 server setup confirmation",
    initialBlockedReason:
      "IMAP/POP3 server setup must be explicit before catchall address and alias mapping are treated as controlled."
  },
  {
    id: "checkpoint-incoming-mail-catchall-address",
    area: "Catchall address",
    title: "Catchall address configuration defined",
    stageId: "extended-modules",
    domainId: "incoming-mail",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "incomingMailCatchallAddress",
    dependencyIds: ["checkpoint-incoming-mail-server-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting catchall address configuration confirmation",
    initialBlockedReason:
      "Catchall address configuration cannot be treated as controlled before the IMAP/POP3 server setup is explicit."
  },
  {
    id: "checkpoint-incoming-mail-alias-mapping",
    area: "Alias mapping",
    title: "Document alias mapping scope bounded",
    stageId: "extended-modules",
    domainId: "incoming-mail",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with operations input",
    guidanceKey: "incomingMailAliasMapping",
    dependencyIds: ["checkpoint-incoming-mail-catchall-address"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting document alias mapping scope confirmation",
    initialBlockedReason:
      "Document alias mapping scope cannot be treated as go-live controlled before the catchall address configuration is explicit."
  },
  {
    id: "checkpoint-incoming-mail-routing-rules",
    area: "Routing rules",
    title: "Incoming mail routing rules assumptions bounded",
    stageId: "extended-modules",
    domainId: "incoming-mail",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with operations input",
    guidanceKey: "incomingMailRoutingRules",
    dependencyIds: ["checkpoint-incoming-mail-alias-mapping"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting incoming mail routing rules decision confirmation",
    initialBlockedReason: ""
  }
];

export function isIncomingMailCheckpoint(checkpoint) {
  return checkpoint?.domainId === "incoming-mail";
}
