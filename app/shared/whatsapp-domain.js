export const WHATSAPP_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-whatsapp-account-connection",
    area: "Account connection",
    title: "WhatsApp Business account connection defined",
    stageId: "extended-modules",
    domainId: "whatsapp",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with marketing input",
    guidanceKey: "whatsappAccountConnection",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting WhatsApp Business account connection confirmation",
    initialBlockedReason:
      "WhatsApp Business account connection must be explicit before message templates and opt-in policies are treated as controlled."
  },
  {
    id: "checkpoint-whatsapp-message-template",
    area: "Message template",
    title: "Message template baseline defined",
    stageId: "extended-modules",
    domainId: "whatsapp",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with IT input",
    guidanceKey: "whatsappMessageTemplate",
    dependencyIds: ["checkpoint-whatsapp-account-connection"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting message template baseline confirmation",
    initialBlockedReason:
      "Message template baseline cannot be treated as controlled before the WhatsApp Business account connection is explicit."
  },
  {
    id: "checkpoint-whatsapp-optin-policy",
    area: "Opt-in policy",
    title: "Opt-in policy scope bounded",
    stageId: "extended-modules",
    domainId: "whatsapp",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with compliance input",
    guidanceKey: "whatsappOptinPolicy",
    dependencyIds: ["checkpoint-whatsapp-message-template"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting opt-in policy scope confirmation",
    initialBlockedReason:
      "Opt-in policy scope cannot be treated as go-live controlled before the message template baseline is explicit."
  },
  {
    id: "checkpoint-whatsapp-document-triggers",
    area: "Document triggers",
    title: "Document triggers assumptions bounded",
    stageId: "extended-modules",
    domainId: "whatsapp",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Marketing lead with operations input",
    guidanceKey: "whatsappDocumentTriggers",
    dependencyIds: ["checkpoint-whatsapp-optin-policy"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting document triggers decision confirmation",
    initialBlockedReason: ""
  }
];

export function isWhatsappCheckpoint(checkpoint) {
  return checkpoint?.domainId === "whatsapp";
}
