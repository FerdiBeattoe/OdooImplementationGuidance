export const INVENTORY_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-inventory-warehouse-setup",
    area: "Warehouse setup",
    title: "Warehouse structure defined",
    stageId: "core-operations",
    domainId: "inventory",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead",
    guidanceKey: "inventoryWarehouse",
    dependencyIds: ["checkpoint-project-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting warehouse design evidence",
    initialBlockedReason: "Warehouse setup must be defined before dependent inventory controls can proceed."
  },
  {
    id: "checkpoint-inventory-operation-types",
    area: "Operation types",
    title: "Operation types and sequences controlled",
    stageId: "core-operations",
    domainId: "inventory",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Warehouse or operations lead",
    guidanceKey: "inventoryOperationTypes",
    dependencyIds: ["checkpoint-inventory-warehouse-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting operation-type structure evidence",
    initialBlockedReason: "Operation types depend on warehouse setup."
  },
  {
    id: "checkpoint-inventory-routes",
    area: "Routes",
    title: "Routes aligned to warehouse flow",
    stageId: "core-operations",
    domainId: "inventory",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead",
    guidanceKey: "inventoryRoutes",
    dependencyIds: ["checkpoint-inventory-warehouse-setup", "checkpoint-inventory-operation-types"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting route policy evidence",
    initialBlockedReason: "Routes cannot be finalized before warehouse setup and operation types are controlled."
  },
  {
    id: "checkpoint-inventory-valuation",
    area: "Inventory valuation",
    title: "Inventory valuation policy confirmed",
    stageId: "finance",
    domainId: "inventory",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead",
    guidanceKey: "inventory",
    dependencyIds: [
      "checkpoint-inventory-warehouse-setup",
      "checkpoint-accounting-valuation-method-prerequisites",
      "checkpoint-accounting-stock-mapping-prerequisites"
    ],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting finance policy and valuation evidence",
    initialBlockedReason: "Inventory valuation remains blocked until finance policy prerequisites are confirmed."
  },
  {
    id: "checkpoint-inventory-landed-costs",
    area: "Landed costs",
    title: "Landed costs policy decided",
    stageId: "finance",
    domainId: "inventory",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Finance lead with procurement input",
    guidanceKey: "inventoryLandedCosts",
    dependencyIds: ["checkpoint-inventory-valuation", "checkpoint-accounting-landed-cost-prerequisites"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting landed-cost decision evidence",
    initialBlockedReason: ""
  }
];

export function isInventoryCheckpoint(checkpoint) {
  return checkpoint.domainId === "inventory";
}
