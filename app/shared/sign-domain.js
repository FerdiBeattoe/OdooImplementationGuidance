export const SIGN_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-sign-template-governance",
    area: "Template governance",
    title: "Signature template governance baseline defined",
    stageId: "extended-modules",
    domainId: "sign",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Implementation lead",
    guidanceKey: "signTemplateGovernance",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting signature template governance evidence",
    initialBlockedReason:
      "Signature template governance must be explicit before signer control and record traceability are treated as controlled."
  },
  {
    id: "checkpoint-sign-signer-control",
    area: "Signer control",
    title: "Signer control and traceability bounded",
    stageId: "extended-modules",
    domainId: "sign",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Implementation lead",
    guidanceKey: "signSignerControl",
    dependencyIds: ["checkpoint-sign-template-governance"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting signer control and traceability evidence",
    initialBlockedReason: ""
  }
];

export function isSignCheckpoint(checkpoint) {
  return checkpoint?.domainId === "sign";
}
