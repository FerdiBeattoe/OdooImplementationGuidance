export const CONSOLIDATION_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-consolidation-company-setup",
    area: "Company setup",
    title: "Consolidation company setup defined",
    stageId: "extended-modules",
    domainId: "consolidation",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "consolidationCompanySetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting consolidation company setup confirmation",
    initialBlockedReason:
      "Consolidation company setup must be explicit before period baselines and elimination rules are treated as controlled."
  },
  {
    id: "checkpoint-consolidation-period-baseline",
    area: "Period baseline",
    title: "Period baseline defined",
    stageId: "extended-modules",
    domainId: "consolidation",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "consolidationPeriodBaseline",
    dependencyIds: ["checkpoint-consolidation-company-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting period baseline confirmation",
    initialBlockedReason:
      "Period baseline cannot be treated as controlled before the consolidation company setup is explicit."
  },
  {
    id: "checkpoint-consolidation-elimination-rules",
    area: "Elimination rules",
    title: "Elimination rules scope bounded",
    stageId: "extended-modules",
    domainId: "consolidation",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead with accounting input",
    guidanceKey: "consolidationEliminationRules",
    dependencyIds: ["checkpoint-consolidation-period-baseline"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting elimination rules scope confirmation",
    initialBlockedReason:
      "Elimination rules scope cannot be treated as go-live controlled before the period baseline is explicit."
  },
  {
    id: "checkpoint-consolidation-intercompany-policy",
    area: "Intercompany policy",
    title: "Intercompany policy assumptions bounded",
    stageId: "extended-modules",
    domainId: "consolidation",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "consolidationIntercompanyPolicy",
    dependencyIds: ["checkpoint-consolidation-elimination-rules"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting intercompany policy decision confirmation",
    initialBlockedReason: ""
  }
];

export function isConsolidationCheckpoint(checkpoint) {
  return checkpoint?.domainId === "consolidation";
}
