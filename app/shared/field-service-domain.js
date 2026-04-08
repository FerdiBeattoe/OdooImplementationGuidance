export const FIELD_SERVICE_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-field-service-task-setup",
    area: "Task setup",
    title: "Field service task baseline defined",
    stageId: "extended-modules",
    domainId: "field-service",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Field service lead",
    guidanceKey: "fieldServiceTaskSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting field service task baseline confirmation",
    initialBlockedReason:
      "Field service task baseline must be explicit before technician assignment and equipment tracking are treated as controlled."
  },
  {
    id: "checkpoint-field-service-technician-assignment",
    area: "Technician assignment",
    title: "Technician assignment policy defined",
    stageId: "extended-modules",
    domainId: "field-service",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Field service lead",
    guidanceKey: "fieldServiceTechnicianAssignment",
    dependencyIds: ["checkpoint-field-service-task-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting technician assignment policy confirmation",
    initialBlockedReason:
      "Technician assignment policy cannot be treated as controlled before the field service task baseline is explicit."
  },
  {
    id: "checkpoint-field-service-equipment-tracking",
    area: "Equipment tracking",
    title: "Equipment tracking scope bounded",
    stageId: "extended-modules",
    domainId: "field-service",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Field service lead with operations input",
    guidanceKey: "fieldServiceEquipmentTracking",
    dependencyIds: ["checkpoint-field-service-technician-assignment"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting equipment tracking scope confirmation",
    initialBlockedReason:
      "Equipment tracking scope cannot be treated as go-live controlled before the technician assignment policy is explicit."
  },
  {
    id: "checkpoint-field-service-sla-configuration",
    area: "SLA configuration",
    title: "SLA configuration assumptions bounded",
    stageId: "extended-modules",
    domainId: "field-service",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Field service lead with operations input",
    guidanceKey: "fieldServiceSlaConfiguration",
    dependencyIds: ["checkpoint-field-service-equipment-tracking"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting SLA configuration decision confirmation",
    initialBlockedReason: ""
  }
];

export function isFieldServiceCheckpoint(checkpoint) {
  return checkpoint?.domainId === "field-service";
}
