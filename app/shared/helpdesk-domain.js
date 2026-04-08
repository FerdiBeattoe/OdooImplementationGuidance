export const HELPDESK_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-helpdesk-team-setup",
    area: "Team setup",
    title: "Helpdesk team baseline defined",
    stageId: "extended-modules",
    domainId: "helpdesk",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead",
    guidanceKey: "helpdeskTeamSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting helpdesk team baseline confirmation",
    initialBlockedReason:
      "Helpdesk team baseline must be explicit before ticket stages, SLA policies, and escalation rules are treated as controlled."
  },
  {
    id: "checkpoint-helpdesk-ticket-stages",
    area: "Ticket stages",
    title: "Ticket stage configuration defined",
    stageId: "extended-modules",
    domainId: "helpdesk",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead",
    guidanceKey: "helpdeskTicketStages",
    dependencyIds: ["checkpoint-helpdesk-team-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting ticket stage configuration confirmation",
    initialBlockedReason:
      "Ticket stage configuration cannot be treated as controlled before the helpdesk team baseline is explicit."
  },
  {
    id: "checkpoint-helpdesk-sla-policy",
    area: "SLA policy",
    title: "SLA policy scope bounded",
    stageId: "extended-modules",
    domainId: "helpdesk",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead with operations input",
    guidanceKey: "helpdeskSlaPolicy",
    dependencyIds: ["checkpoint-helpdesk-ticket-stages"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting SLA policy scope confirmation",
    initialBlockedReason:
      "SLA policy scope cannot be treated as go-live controlled before the ticket stage configuration is explicit."
  },
  {
    id: "checkpoint-helpdesk-escalation-rules",
    area: "Escalation rules",
    title: "Escalation rules assumptions bounded",
    stageId: "extended-modules",
    domainId: "helpdesk",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Support lead with management input",
    guidanceKey: "helpdeskEscalationRules",
    dependencyIds: ["checkpoint-helpdesk-sla-policy"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting escalation rules decision confirmation",
    initialBlockedReason: ""
  }
];

export function isHelpdeskCheckpoint(checkpoint) {
  return checkpoint?.domainId === "helpdesk";
}
