export const EVENTS_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-events-type-configuration",
    area: "Type configuration",
    title: "Event type configuration defined",
    stageId: "extended-modules",
    domainId: "events",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Events lead",
    guidanceKey: "eventsTypeConfiguration",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting event type configuration confirmation",
    initialBlockedReason:
      "Event type configuration must be explicit before registration workflows and communication templates are treated as controlled."
  },
  {
    id: "checkpoint-events-registration-workflow",
    area: "Registration workflow",
    title: "Registration workflow defined",
    stageId: "extended-modules",
    domainId: "events",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Events lead",
    guidanceKey: "eventsRegistrationWorkflow",
    dependencyIds: ["checkpoint-events-type-configuration"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting registration workflow confirmation",
    initialBlockedReason:
      "Registration workflow cannot be treated as controlled before the event type configuration is explicit."
  },
  {
    id: "checkpoint-events-communication-templates",
    area: "Communication templates",
    title: "Communication templates scope bounded",
    stageId: "extended-modules",
    domainId: "events",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Events lead with marketing input",
    guidanceKey: "eventsCommunicationTemplates",
    dependencyIds: ["checkpoint-events-registration-workflow"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting communication templates scope confirmation",
    initialBlockedReason:
      "Communication templates scope cannot be treated as go-live controlled before the registration workflow is explicit."
  },
  {
    id: "checkpoint-events-reporting-baseline",
    area: "Reporting baseline",
    title: "Events reporting baseline assumptions bounded",
    stageId: "extended-modules",
    domainId: "events",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Events lead with operations input",
    guidanceKey: "eventsReportingBaseline",
    dependencyIds: ["checkpoint-events-communication-templates"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting events reporting baseline decision confirmation",
    initialBlockedReason: ""
  }
];

export function isEventsCheckpoint(checkpoint) {
  return checkpoint?.domainId === "events";
}
