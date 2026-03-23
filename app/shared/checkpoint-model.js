export function summarizeCheckpoints(checkpoints) {
  return checkpoints.reduce(
    (summary, checkpoint) => {
      if (checkpoint.status === "Fail") {
        summary.blocked += 1;
      }

      if (checkpoint.status === "Warning") {
        summary.warnings += 1;
      }

      if (checkpoint.defermentFlag) {
        summary.deferred += 1;
      }

      if (checkpoint.status === "Pass") {
        summary.passed += 1;
      }

      return summary;
    },
    { blocked: 0, warnings: 0, deferred: 0, passed: 0 }
  );
}

export function getCheckpointStatusTone(checkpoint) {
  if (checkpoint.status === "Fail") {
    return "blocked";
  }

  if (checkpoint.status === "Warning") {
    return "warning";
  }

  return "complete";
}
