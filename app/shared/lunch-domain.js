export const LUNCH_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-lunch-supplier-setup",
    area: "Supplier setup",
    title: "Lunch supplier baseline defined",
    stageId: "extended-modules",
    domainId: "lunch",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with operations input",
    guidanceKey: "lunchSupplierSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting lunch supplier baseline confirmation",
    initialBlockedReason:
      "Lunch supplier baseline must be explicit before product catalogues and cash move policies are treated as controlled."
  },
  {
    id: "checkpoint-lunch-product-catalogue",
    area: "Product catalogue",
    title: "Product catalogue baseline defined",
    stageId: "extended-modules",
    domainId: "lunch",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with operations input",
    guidanceKey: "lunchProductCatalogue",
    dependencyIds: ["checkpoint-lunch-supplier-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting product catalogue baseline confirmation",
    initialBlockedReason:
      "Product catalogue baseline cannot be treated as controlled before the lunch supplier baseline is explicit."
  },
  {
    id: "checkpoint-lunch-cash-move-policy",
    area: "Cash move policy",
    title: "Cash move policy scope bounded",
    stageId: "extended-modules",
    domainId: "lunch",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with finance input",
    guidanceKey: "lunchCashMovePolicy",
    dependencyIds: ["checkpoint-lunch-product-catalogue"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting cash move policy scope confirmation",
    initialBlockedReason:
      "Cash move policy scope cannot be treated as go-live controlled before the product catalogue baseline is explicit."
  },
  {
    id: "checkpoint-lunch-employee-access",
    area: "Employee access",
    title: "Employee access assumptions bounded",
    stageId: "extended-modules",
    domainId: "lunch",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "lunchEmployeeAccess",
    dependencyIds: ["checkpoint-lunch-cash-move-policy"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting employee access decision confirmation",
    initialBlockedReason: ""
  }
];

export function isLunchCheckpoint(checkpoint) {
  return checkpoint?.domainId === "lunch";
}
