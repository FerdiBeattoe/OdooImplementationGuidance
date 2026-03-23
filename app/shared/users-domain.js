export const USERS_SECURITY_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-users-access-design",
    area: "Access design",
    title: "Access design boundaries defined",
    stageId: "users-roles-security",
    domainId: "users-roles-security",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner",
    guidanceKey: "usersAccessDesign",
    dependencyIds: ["checkpoint-project-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting access design evidence",
    initialBlockedReason: "Access design boundaries must be defined before approval and privileged access controls are treated as controlled."
  },
  {
    id: "checkpoint-role-approval-design",
    area: "Approval control",
    title: "Role and approval design assigned",
    stageId: "users-roles-security",
    domainId: "users-roles-security",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner",
    guidanceKey: "roles",
    dependencyIds: ["checkpoint-users-access-design"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting owner confirmation and structured role evidence",
    initialBlockedReason: "Role and approval design depends on a controlled access design boundary."
  },
  {
    id: "checkpoint-users-privileged-access-review",
    area: "Privileged access review",
    title: "Privileged access review scoped",
    stageId: "users-roles-security",
    domainId: "users-roles-security",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Project owner",
    guidanceKey: "usersPrivilegedAccess",
    dependencyIds: ["checkpoint-role-approval-design"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting privileged access review evidence",
    initialBlockedReason: "Privileged access review cannot be treated as complete before approval responsibilities are controlled."
  }
];

export function isUsersSecurityCheckpoint(checkpoint) {
  return checkpoint?.domainId === "users-roles-security";
}
