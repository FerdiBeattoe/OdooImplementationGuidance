export function classifyActionSafety(action, context = {}) {
  const { requiresBranchTarget = false, checkpointBlocked = false } = context;

  if (action === "save-project" || action === "resume-project") {
    return { safety: "safe", reason: "Project state persistence is allowed within the current control boundary." };
  }

  if (
    action === "bulk-edit" ||
    action === "bulk-complete" ||
    action === "bulk-checkpoint-complete" ||
    action === "grid-production-write" ||
    action === "production-target-write"
  ) {
    return { safety: "blocked", reason: "This surface does not permit unrestricted bulk or production-target writes." };
  }

  if (action === "set-branch-target" || action === "branch-target-write") {
    return requiresBranchTarget
      ? { safety: "conditional", reason: "Branch targeting is required and must remain explicit for Odoo.sh Enterprise work." }
      : { safety: "blocked", reason: "Branch targeting is not applicable to the current supported combination." };
  }

  if (action === "advance-checkpoint") {
    return checkpointBlocked
      ? { safety: "blocked", reason: "Blocked checkpoints cannot be advanced." }
      : { safety: "conditional", reason: "Checkpoint advancement requires evidence and dependency review." };
  }

  return { safety: "conditional", reason: "Action requires checkpoint, dependency, and deployment review." };
}
