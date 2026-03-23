export const ACCOUNTING_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-finance-policy",
    area: "Finance policy prerequisites",
    title: "Finance policy prerequisites confirmed",
    stageId: "finance",
    domainId: "accounting",
    checkpointClass: "Foundational",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "accountingFinancePolicy",
    dependencyIds: ["checkpoint-project-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting finance policy evidence",
    initialBlockedReason:
      "Valuation-sensitive or invoice-sensitive operational checkpoints cannot proceed before finance policy is confirmed."
  },
  {
    id: "checkpoint-accounting-valuation-method-prerequisites",
    area: "Inventory valuation method prerequisites",
    title: "Inventory valuation method policy confirmed",
    stageId: "finance",
    domainId: "accounting",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "accountingValuationMethod",
    dependencyIds: ["checkpoint-finance-policy"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting valuation method policy evidence",
    initialBlockedReason:
      "Inventory valuation-sensitive work remains blocked until valuation method policy is explicitly confirmed."
  },
  {
    id: "checkpoint-accounting-stock-mapping-prerequisites",
    area: "Stock accounting mapping prerequisites",
    title: "Stock accounting mapping prerequisites confirmed",
    stageId: "finance",
    domainId: "accounting",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "accountingStockMapping",
    dependencyIds: ["checkpoint-accounting-valuation-method-prerequisites"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting stock accounting mapping evidence",
    initialBlockedReason:
      "Stock accounting mapping must be explicitly aligned before inventory valuation-sensitive checkpoints can proceed."
  },
  {
    id: "checkpoint-accounting-landed-cost-prerequisites",
    area: "Landed cost accounting prerequisites",
    title: "Landed cost accounting prerequisites decided",
    stageId: "finance",
    domainId: "accounting",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "accountingLandedCosts",
    dependencyIds: ["checkpoint-accounting-stock-mapping-prerequisites"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting landed cost accounting decision evidence",
    initialBlockedReason: ""
  }
];

export function isAccountingCheckpoint(checkpoint) {
  return checkpoint?.domainId === "accounting";
}
