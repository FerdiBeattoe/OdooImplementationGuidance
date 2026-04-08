export const TIMESHEETS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-timesheets-policy-setup",
    area: "Policy setup",
    title: "Timesheet policy baseline defined",
    stageId: "extended-modules",
    domainId: "timesheets",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with project management input",
    guidanceKey: "timesheetsPolicySetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting timesheet policy baseline confirmation",
    initialBlockedReason:
      "Timesheet policy baseline must be explicit before project time tracking and approval workflows are treated as controlled."
  },
  {
    id: "checkpoint-timesheets-project-tracking",
    area: "Project tracking",
    title: "Project time tracking scope defined",
    stageId: "extended-modules",
    domainId: "timesheets",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with project management input",
    guidanceKey: "timesheetsProjectTracking",
    dependencyIds: ["checkpoint-timesheets-policy-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting project time tracking scope confirmation",
    initialBlockedReason:
      "Project time tracking scope cannot be treated as controlled before the timesheet policy baseline is explicit."
  },
  {
    id: "checkpoint-timesheets-employee-submission",
    area: "Employee submission",
    title: "Employee time submission workflow bounded",
    stageId: "extended-modules",
    domainId: "timesheets",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "timesheetsEmployeeSubmission",
    dependencyIds: ["checkpoint-timesheets-project-tracking"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting employee time submission workflow confirmation",
    initialBlockedReason:
      "Employee time submission workflow cannot be treated as go-live controlled before the project time tracking scope is explicit."
  },
  {
    id: "checkpoint-timesheets-manager-approval",
    area: "Manager approval",
    title: "Manager approval workflow assumptions bounded",
    stageId: "extended-modules",
    domainId: "timesheets",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with management input",
    guidanceKey: "timesheetsManagerApproval",
    dependencyIds: ["checkpoint-timesheets-employee-submission"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting manager approval workflow decision confirmation",
    initialBlockedReason: ""
  }
];

export function isTimesheetsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "timesheets";
}
