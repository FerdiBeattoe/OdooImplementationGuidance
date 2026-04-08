export const REPAIRS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-repairs-order-workflow",
    area: "Order workflow",
    title: "Repair order workflow defined",
    stageId: "extended-modules",
    domainId: "repairs",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Repairs lead",
    guidanceKey: "repairsOrderWorkflow",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting repair order workflow confirmation",
    initialBlockedReason:
      "Repair order workflow must be explicit before parts tracking and warranty handling are treated as controlled."
  },
  {
    id: "checkpoint-repairs-parts-labour",
    area: "Parts and labour",
    title: "Parts and labour tracking defined",
    stageId: "extended-modules",
    domainId: "repairs",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Repairs lead",
    guidanceKey: "repairsPartsLabour",
    dependencyIds: ["checkpoint-repairs-order-workflow"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting parts and labour tracking confirmation",
    initialBlockedReason:
      "Parts and labour tracking cannot be treated as controlled before the repair order workflow is explicit."
  },
  {
    id: "checkpoint-repairs-warranty-handling",
    area: "Warranty handling",
    title: "Warranty handling scope bounded",
    stageId: "extended-modules",
    domainId: "repairs",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Repairs lead with operations input",
    guidanceKey: "repairsWarrantyHandling",
    dependencyIds: ["checkpoint-repairs-parts-labour"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting warranty handling scope confirmation",
    initialBlockedReason:
      "Warranty handling scope cannot be treated as go-live controlled before parts and labour tracking is explicit."
  },
  {
    id: "checkpoint-repairs-customer-communication",
    area: "Customer communication",
    title: "Customer communication assumptions bounded",
    stageId: "extended-modules",
    domainId: "repairs",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Repairs lead with customer service input",
    guidanceKey: "repairsCustomerCommunication",
    dependencyIds: ["checkpoint-repairs-warranty-handling"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting customer communication decision confirmation",
    initialBlockedReason: ""
  }
];

export function isRepairsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "repairs";
}
