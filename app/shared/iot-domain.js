export const IOT_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-iot-box-registration",
    area: "Box registration",
    title: "IoT box registration defined",
    stageId: "extended-modules",
    domainId: "iot",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "iotBoxRegistration",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting IoT box registration confirmation",
    initialBlockedReason:
      "IoT box registration must be explicit before device assignment and POS hardware integration are treated as controlled."
  },
  {
    id: "checkpoint-iot-device-assignment",
    area: "Device assignment",
    title: "Device assignment policy defined",
    stageId: "extended-modules",
    domainId: "iot",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with operations input",
    guidanceKey: "iotDeviceAssignment",
    dependencyIds: ["checkpoint-iot-box-registration"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting device assignment policy confirmation",
    initialBlockedReason:
      "Device assignment policy cannot be treated as controlled before the IoT box registration is explicit."
  },
  {
    id: "checkpoint-iot-pos-hardware",
    area: "POS hardware integration",
    title: "POS hardware integration scope bounded",
    stageId: "extended-modules",
    domainId: "iot",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with POS input",
    guidanceKey: "iotPosHardware",
    dependencyIds: ["checkpoint-iot-device-assignment"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting POS hardware integration scope confirmation",
    initialBlockedReason:
      "POS hardware integration scope cannot be treated as go-live controlled before the device assignment policy is explicit."
  },
  {
    id: "checkpoint-iot-network-configuration",
    area: "Network configuration",
    title: "Network configuration baseline assumptions bounded",
    stageId: "extended-modules",
    domainId: "iot",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "iotNetworkConfiguration",
    dependencyIds: ["checkpoint-iot-pos-hardware"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting network configuration baseline decision confirmation",
    initialBlockedReason: ""
  }
];

export function isIotCheckpoint(checkpoint) {
  return checkpoint?.domainId === "iot";
}
