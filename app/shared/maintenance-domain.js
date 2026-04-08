export const MAINTENANCE_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-maintenance-team-setup",
    area: "Team setup",
    title: "Maintenance team baseline defined",
    stageId: "extended-modules",
    domainId: "maintenance",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Maintenance lead",
    guidanceKey: "maintenanceTeamSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting maintenance team baseline confirmation",
    initialBlockedReason:
      "Maintenance team baseline must be explicit before equipment registry and scheduling are treated as controlled."
  },
  {
    id: "checkpoint-maintenance-equipment-registry",
    area: "Equipment registry",
    title: "Equipment registry scope defined",
    stageId: "extended-modules",
    domainId: "maintenance",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Maintenance lead",
    guidanceKey: "maintenanceEquipmentRegistry",
    dependencyIds: ["checkpoint-maintenance-team-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting equipment registry scope confirmation",
    initialBlockedReason:
      "Equipment registry scope cannot be treated as controlled before the maintenance team baseline is explicit."
  },
  {
    id: "checkpoint-maintenance-preventive-schedule",
    area: "Preventive schedule",
    title: "Preventive maintenance schedule bounded",
    stageId: "extended-modules",
    domainId: "maintenance",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Maintenance lead with operations input",
    guidanceKey: "maintenancePreventiveSchedule",
    dependencyIds: ["checkpoint-maintenance-equipment-registry"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting preventive maintenance schedule confirmation",
    initialBlockedReason:
      "Preventive maintenance schedule cannot be treated as go-live controlled before the equipment registry scope is explicit."
  },
  {
    id: "checkpoint-maintenance-corrective-workflow",
    area: "Corrective workflow",
    title: "Corrective maintenance workflow assumptions bounded",
    stageId: "extended-modules",
    domainId: "maintenance",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Maintenance lead with operations input",
    guidanceKey: "maintenanceCorrectiveWorkflow",
    dependencyIds: ["checkpoint-maintenance-preventive-schedule"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting corrective maintenance workflow decision confirmation",
    initialBlockedReason: ""
  }
];

export function isMaintenanceCheckpoint(checkpoint) {
  return checkpoint?.domainId === "maintenance";
}
