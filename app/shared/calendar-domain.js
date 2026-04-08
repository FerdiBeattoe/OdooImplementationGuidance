export const CALENDAR_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-calendar-sync-setup",
    area: "Sync setup",
    title: "Google/Outlook sync setup defined",
    stageId: "extended-modules",
    domainId: "calendar",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "calendarSyncSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting calendar sync setup confirmation",
    initialBlockedReason:
      "Calendar sync setup must be explicit before meeting types and availability rules are treated as controlled."
  },
  {
    id: "checkpoint-calendar-meeting-type",
    area: "Meeting type",
    title: "Meeting type baseline defined",
    stageId: "extended-modules",
    domainId: "calendar",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with operations input",
    guidanceKey: "calendarMeetingType",
    dependencyIds: ["checkpoint-calendar-sync-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting meeting type baseline confirmation",
    initialBlockedReason:
      "Meeting type baseline cannot be treated as controlled before the calendar sync setup is explicit."
  },
  {
    id: "checkpoint-calendar-availability-rules",
    area: "Availability rules",
    title: "Availability rules scope bounded",
    stageId: "extended-modules",
    domainId: "calendar",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead with HR input",
    guidanceKey: "calendarAvailabilityRules",
    dependencyIds: ["checkpoint-calendar-meeting-type"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting availability rules scope confirmation",
    initialBlockedReason:
      "Availability rules scope cannot be treated as go-live controlled before the meeting type baseline is explicit."
  },
  {
    id: "checkpoint-calendar-scope-policy",
    area: "Internal vs external policy",
    title: "Internal vs external calendar policy assumptions bounded",
    stageId: "extended-modules",
    domainId: "calendar",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "IT lead",
    guidanceKey: "calendarScopePolicy",
    dependencyIds: ["checkpoint-calendar-availability-rules"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting internal vs external calendar policy decision confirmation",
    initialBlockedReason: ""
  }
];

export function isCalendarCheckpoint(checkpoint) {
  return checkpoint?.domainId === "calendar";
}
