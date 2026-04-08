export const FLEET_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-fleet-vehicle-registry",
    area: "Vehicle registry",
    title: "Vehicle registry baseline defined",
    stageId: "extended-modules",
    domainId: "fleet",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Fleet manager",
    guidanceKey: "fleetVehicleRegistry",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting vehicle registry baseline confirmation",
    initialBlockedReason:
      "Vehicle registry baseline must be explicit before driver assignment and service scheduling are treated as controlled."
  },
  {
    id: "checkpoint-fleet-driver-assignment",
    area: "Driver assignment",
    title: "Driver assignment policy defined",
    stageId: "extended-modules",
    domainId: "fleet",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Fleet manager",
    guidanceKey: "fleetDriverAssignment",
    dependencyIds: ["checkpoint-fleet-vehicle-registry"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting driver assignment policy confirmation",
    initialBlockedReason:
      "Driver assignment policy cannot be treated as controlled before the vehicle registry baseline is explicit."
  },
  {
    id: "checkpoint-fleet-service-schedule",
    area: "Service schedule",
    title: "Service and maintenance schedule bounded",
    stageId: "extended-modules",
    domainId: "fleet",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Fleet manager with operations input",
    guidanceKey: "fleetServiceSchedule",
    dependencyIds: ["checkpoint-fleet-driver-assignment"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting service and maintenance schedule confirmation",
    initialBlockedReason:
      "Service and maintenance schedule cannot be treated as go-live controlled before the driver assignment policy is explicit."
  },
  {
    id: "checkpoint-fleet-fuel-tracking",
    area: "Fuel tracking",
    title: "Fuel tracking assumptions bounded",
    stageId: "extended-modules",
    domainId: "fleet",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Fleet manager with finance input",
    guidanceKey: "fleetFuelTracking",
    dependencyIds: ["checkpoint-fleet-service-schedule"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting fuel tracking decision confirmation",
    initialBlockedReason: ""
  }
];

export function isFleetCheckpoint(checkpoint) {
  return checkpoint?.domainId === "fleet";
}
