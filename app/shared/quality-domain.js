export const QUALITY_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-quality-control-design",
    area: "Control design",
    title: "Quality control baseline defined",
    stageId: "extended-modules",
    domainId: "quality",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Quality lead",
    guidanceKey: "qualityControlBaseline",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting quality control baseline evidence",
    initialBlockedReason:
      "Quality control baseline must be explicit before check triggers, pass/fail handling, and exception policies are treated as controlled."
  },
  {
    id: "checkpoint-quality-trigger-rules",
    area: "Trigger rules",
    title: "Quality trigger rules bounded",
    stageId: "extended-modules",
    domainId: "quality",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Quality lead with operations input",
    guidanceKey: "qualityTriggerRules",
    dependencyIds: ["checkpoint-quality-control-design"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting quality trigger rules evidence",
    initialBlockedReason:
      "Quality trigger rules cannot be treated as go-live controlled before the quality control baseline is explicit."
  }
];

export function isQualityCheckpoint(checkpoint) {
  return checkpoint?.domainId === "quality";
}
