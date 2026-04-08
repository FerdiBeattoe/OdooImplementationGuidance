export const ATTENDANCE_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-attendance-mode-setup",
    area: "Mode setup",
    title: "Attendance mode baseline defined",
    stageId: "extended-modules",
    domainId: "attendance",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "attendanceModeSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting attendance mode baseline confirmation",
    initialBlockedReason:
      "Attendance mode baseline must be explicit before overtime policy and reporting are treated as controlled."
  },
  {
    id: "checkpoint-attendance-overtime-policy",
    area: "Overtime policy",
    title: "Overtime policy defined",
    stageId: "extended-modules",
    domainId: "attendance",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with management input",
    guidanceKey: "attendanceOvertimePolicy",
    dependencyIds: ["checkpoint-attendance-mode-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting overtime policy confirmation",
    initialBlockedReason:
      "Overtime policy cannot be treated as controlled before the attendance mode baseline is explicit."
  },
  {
    id: "checkpoint-attendance-reporting-baseline",
    area: "Reporting baseline",
    title: "Attendance reporting baseline bounded",
    stageId: "extended-modules",
    domainId: "attendance",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with operations input",
    guidanceKey: "attendanceReportingBaseline",
    dependencyIds: ["checkpoint-attendance-overtime-policy"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting attendance reporting baseline confirmation",
    initialBlockedReason:
      "Attendance reporting baseline cannot be treated as go-live controlled before the overtime policy is explicit."
  }
];

export function isAttendanceCheckpoint(checkpoint) {
  return checkpoint?.domainId === "attendance";
}
