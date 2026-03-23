export const FOUNDATION_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-project-mode",
    area: "Implementation context",
    title: "Project mode confirmed",
    stageId: "entry-project-setup",
    domainId: "foundation-company-localization",
    checkpointClass: "Foundational",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner",
    guidanceKey: "foundationProjectMode",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Pending user confirmation",
    initialBlockedReason: "Project mode must be explicitly selected before controlled progression."
  },
  {
    id: "checkpoint-foundation-localization-selection",
    area: "Localization selection",
    title: "Localization context selected",
    stageId: "foundation",
    domainId: "foundation-company-localization",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Implementation lead",
    guidanceKey: "foundationLocalization",
    dependencyIds: ["checkpoint-project-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting localization selection evidence",
    initialBlockedReason: "Localization context must be explicit before downstream structure and policy work is treated as controlled."
  },
  {
    id: "checkpoint-foundation-operating-assumptions",
    area: "Shared operating assumptions",
    title: "Shared operating assumptions defined",
    stageId: "foundation",
    domainId: "foundation-company-localization",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Implementation lead",
    guidanceKey: "foundationOperatingAssumptions",
    dependencyIds: ["checkpoint-foundation-localization-selection"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting baseline settings and shared operating assumptions",
    initialBlockedReason: "Shared operating assumptions remain blocked until localization context is controlled."
  },
  {
    id: "checkpoint-odoo-sh-target",
    area: "Deployment target context",
    title: "Odoo.sh target identified",
    stageId: "entry-project-setup",
    domainId: "foundation-company-localization",
    checkpointClass: "Foundational",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Implementation lead",
    guidanceKey: "foundationDeploymentTarget",
    dependencyIds: [],
    initialStatus: "Pass",
    initialEvidenceStatus: "Not required for current target",
    initialBlockedReason: ""
  }
];

export function isFoundationCheckpoint(checkpoint) {
  return checkpoint?.domainId === "foundation-company-localization";
}
