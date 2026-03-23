export const MANUFACTURING_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-manufacturing-process-mode",
    area: "Production policy",
    title: "Manufacturing process mode baseline defined",
    stageId: "core-operations",
    domainId: "manufacturing-mrp",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Manufacturing lead",
    guidanceKey: "manufacturingProcessMode",
    dependencyIds: ["checkpoint-project-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting manufacturing process baseline evidence",
    initialBlockedReason:
      "Manufacturing process mode must be explicit before BOM governance and routing-control decisions are treated as controlled."
  },
  {
    id: "checkpoint-manufacturing-bom-governance",
    area: "BOM governance",
    title: "Bill of materials governance baseline defined",
    stageId: "core-operations",
    domainId: "manufacturing-mrp",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Manufacturing lead",
    guidanceKey: "manufacturingBomGovernance",
    dependencyIds: ["checkpoint-manufacturing-process-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting BOM governance evidence",
    initialBlockedReason:
      "Bill of materials governance remains blocked until the manufacturing process mode baseline is controlled."
  },
  {
    id: "checkpoint-manufacturing-routing-control",
    area: "Execution control",
    title: "Work order and routing control baseline defined",
    stageId: "core-operations",
    domainId: "manufacturing-mrp",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Manufacturing lead",
    guidanceKey: "manufacturingRoutingControl",
    dependencyIds: ["checkpoint-manufacturing-process-mode", "checkpoint-manufacturing-bom-governance"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting routing and work-order control evidence",
    initialBlockedReason:
      "Routing and work-order rules cannot be treated as go-live controlled before manufacturing process mode and BOM governance pass."
  },
  {
    id: "checkpoint-manufacturing-production-handoff",
    area: "Production handoff",
    title: "Production handoff assumptions bounded",
    stageId: "core-operations",
    domainId: "manufacturing-mrp",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Manufacturing lead with operations input",
    guidanceKey: "manufacturingProductionHandoff",
    dependencyIds: ["checkpoint-manufacturing-routing-control"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting production handoff decision evidence",
    initialBlockedReason: ""
  }
];

export function isManufacturingCheckpoint(checkpoint) {
  return checkpoint?.domainId === "manufacturing-mrp";
}
