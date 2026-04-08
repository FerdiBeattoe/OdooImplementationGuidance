export const VOIP_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-voip-provider-connection",
    area: "Provider connection",
    title: "VoIP provider connection defined",
    stageId: "extended-modules",
    domainId: "voip",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "voipProviderConnection",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting VoIP provider connection confirmation",
    initialBlockedReason:
      "VoIP provider connection must be explicit before extension assignment and call logging are treated as controlled."
  },
  {
    id: "checkpoint-voip-extension-assignment",
    area: "Extension assignment",
    title: "Extension assignment policy defined",
    stageId: "extended-modules",
    domainId: "voip",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "voipExtensionAssignment",
    dependencyIds: ["checkpoint-voip-provider-connection"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting extension assignment policy confirmation",
    initialBlockedReason:
      "Extension assignment policy cannot be treated as controlled before the VoIP provider connection is explicit."
  },
  {
    id: "checkpoint-voip-call-logging",
    area: "Call logging",
    title: "Call logging baseline bounded",
    stageId: "extended-modules",
    domainId: "voip",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with sales input",
    guidanceKey: "voipCallLogging",
    dependencyIds: ["checkpoint-voip-extension-assignment"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting call logging baseline confirmation",
    initialBlockedReason:
      "Call logging baseline cannot be treated as go-live controlled before the extension assignment policy is explicit."
  },
  {
    id: "checkpoint-voip-crm-integration",
    area: "CRM integration",
    title: "CRM integration assumptions bounded",
    stageId: "extended-modules",
    domainId: "voip",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with CRM input",
    guidanceKey: "voipCrmIntegration",
    dependencyIds: ["checkpoint-voip-call-logging"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting CRM integration decision confirmation",
    initialBlockedReason: ""
  }
];

export function isVoipCheckpoint(checkpoint) {
  return checkpoint?.domainId === "voip";
}
