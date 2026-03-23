import { SAMPLE_GUIDANCE_BLOCKS } from "./guidance.js";
import { getAccountingConfigurationSections } from "./accounting-configuration.js";

const READY_BLOCKING_CLASSES = new Set(["Foundational", "Domain Required", "Go-Live"]);

export function getAccountingReadinessSummary(project) {
  const checkpoints = Array.isArray(project?.checkpoints)
    ? project.checkpoints.filter((checkpoint) => checkpoint?.domainId === "accounting")
    : [];

  if (!checkpoints.length) {
    return {
      readinessState: "not_ready",
      explanation: "Accounting prerequisite checkpoint state is unavailable. Do not claim readiness.",
      blockerCount: 0,
      blockers: [],
      failedCheckpoints: [],
      deferredCheckpoints: [],
      evidenceGaps: [],
      captureOnly: [],
      nextActions: [
        {
          priority: "blocker",
          checkpointId: "",
          text: "Review Accounting prerequisite checkpoint state before making readiness claims."
        }
      ],
      captureContext: [],
      downstreamImpactSignals: []
    };
  }

  const configurationSections = getAccountingConfigurationSections(project || {});
  const failedCheckpoints = checkpoints.filter((checkpoint) => checkpoint.status === "Fail" || checkpoint.blockerFlag);
  const blockers = failedCheckpoints.map((checkpoint) => ({
    checkpointId: checkpoint.id,
    title: checkpoint.title,
    checkpointClass: checkpoint.checkpointClass,
    reason: checkpoint.blockedReason || "Blocked or insufficient support."
  }));
  const deferredCheckpoints = checkpoints
    .filter((checkpoint) => checkpoint.defermentFlag)
    .map((checkpoint) => ({
      checkpointId: checkpoint.id,
      title: checkpoint.title,
      reviewPoint: checkpoint.reviewPoint || "Review point not recorded",
      reason: checkpoint.defermentReason || "Deferred under recorded conditions."
    }));
  const evidenceGaps = checkpoints
    .filter((checkpoint) => isEvidenceGap(checkpoint))
    .map((checkpoint) => ({
      checkpointId: checkpoint.id,
      title: checkpoint.title,
      evidenceMode: checkpoint.accountingEvidence?.mode || "none",
      evidenceLabel: getEvidenceGapLabel(checkpoint)
    }));
  const captureOnly = checkpoints
    .filter((checkpoint) => checkpoint.accountingEvidence?.mode === "design_capture")
    .map((checkpoint) => ({
      checkpointId: checkpoint.id,
      title: checkpoint.title,
      summary: checkpoint.accountingEvidence?.summary || "Design capture exists without stronger accountable support."
    }));

  const requiredFailures = failedCheckpoints.filter((checkpoint) => READY_BLOCKING_CLASSES.has(checkpoint.checkpointClass));
  const requiredCheckpoints = checkpoints.filter((checkpoint) => READY_BLOCKING_CLASSES.has(checkpoint.checkpointClass));
  const requiredPassed = requiredCheckpoints.every((checkpoint) => checkpoint.status === "Pass");
  const criticalEvidenceGaps = evidenceGaps.filter((item) => {
    const checkpoint = checkpoints.find((candidate) => candidate.id === item.checkpointId);
    return checkpoint && READY_BLOCKING_CLASSES.has(checkpoint.checkpointClass) && ["none", "design_capture"].includes(item.evidenceMode);
  });
  const softerEvidenceGaps = evidenceGaps.filter((item) => item.evidenceMode === "user_asserted");
  const allCheckpointsPassed = checkpoints.every((checkpoint) => checkpoint.status === "Pass");
  const hasDeferred = deferredCheckpoints.length > 0;
  const hasEvidenceGaps = evidenceGaps.length > 0;
  const hasStrongEvidenceOnly = checkpoints.every((checkpoint) => checkpoint.accountingEvidence?.mode === "system_detected");

  let readinessState = "not_ready";
  let explanation =
    "Accounting prerequisite readiness is not yet proven. Review blockers, accountable support, and downstream impacts before treating this slice as dependable.";

  if (requiredFailures.length > 0) {
    readinessState = "not_ready";
    explanation = "Accounting prerequisite readiness remains blocked by failed foundational, required, or go-live checkpoints.";
  } else if (criticalEvidenceGaps.length > 0) {
    readinessState = "not_ready";
    explanation = "Accounting prerequisite checkpoints are still supported only by missing or capture-only evidence on required paths.";
  } else if (allCheckpointsPassed && !hasDeferred && !hasEvidenceGaps && hasStrongEvidenceOnly) {
    readinessState = "ready";
    explanation = "Accounting prerequisite checkpoint and evidence state support a strict readiness claim.";
  } else if (requiredPassed) {
    readinessState = "conditionally_ready";
    explanation =
      "Accounting prerequisite blockers are cleared, but readiness is still limited. Remaining support is not system-proven and must not be treated as full Accounting readiness.";
  }

  return {
    readinessState,
    explanation,
    blockerCount: blockers.length,
    blockers,
    failedCheckpoints: failedCheckpoints.map((checkpoint) => ({
      checkpointId: checkpoint.id,
      title: checkpoint.title,
      checkpointClass: checkpoint.checkpointClass
    })),
    deferredCheckpoints,
    evidenceGaps,
    captureOnly,
    nextActions: buildNextActions({
      blockers,
      criticalEvidenceGaps,
      softerEvidenceGaps,
      deferredCheckpoints
    }),
    captureContext: configurationSections.map((section) => ({
      sectionId: section.id,
      label: section.label,
      recordsCaptured: section.summary.totalRecords,
      inScopeRecords: section.summary.inScopeRecords
    })),
    downstreamImpactSignals: getDownstreamImpactSignals(checkpoints)
  };
}

function buildNextActions({ blockers, criticalEvidenceGaps, softerEvidenceGaps, deferredCheckpoints }) {
  if (blockers.length) {
    return blockers.slice(0, 3).map((blocker) => ({
      priority: "blocker",
      checkpointId: blocker.checkpointId,
      text: `${blocker.title}: ${blocker.reason}`
    }));
  }

  if (criticalEvidenceGaps.length) {
    return criticalEvidenceGaps.slice(0, 3).map((gap) => ({
      priority: "evidence",
      checkpointId: gap.checkpointId,
      text: `${gap.title}: strengthen support beyond ${gap.evidenceLabel}.`
    }));
  }

  if (deferredCheckpoints.length) {
    return deferredCheckpoints.slice(0, 3).map((item) => ({
      priority: "deferred",
      checkpointId: item.checkpointId,
      text: `${item.title}: review at ${item.reviewPoint}.`
    }));
  }

  return softerEvidenceGaps.slice(0, 3).map((gap) => ({
    priority: "evidence",
    checkpointId: gap.checkpointId,
    text: `${gap.title}: user-asserted support still requires explicit review.`
  }));
}

function getDownstreamImpactSignals(checkpoints) {
  const impacts = checkpoints
    .flatMap((checkpoint) => SAMPLE_GUIDANCE_BLOCKS[checkpoint.guidanceKey]?.downstreamImpact || [])
    .filter(Boolean);

  return [...new Set(impacts)].slice(0, 4);
}

function getEvidenceGapLabel(checkpoint) {
  const mode = checkpoint.accountingEvidence?.mode || "none";
  if (mode === "design_capture") {
    return "design capture";
  }
  if (mode === "user_asserted") {
    return "user asserted";
  }
  return "no evidence";
}

function isEvidenceGap(checkpoint) {
  const mode = checkpoint.accountingEvidence?.mode || "none";
  return mode === "none" || mode === "design_capture" || mode === "user_asserted";
}
