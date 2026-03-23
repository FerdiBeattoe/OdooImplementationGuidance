import { SAMPLE_GUIDANCE_BLOCKS } from "./guidance.js";
import { getPosConfigurationSections } from "./pos-configuration.js";
import { getPosEvidenceSufficiency } from "./pos-evidence.js";

const READY_BLOCKING_CLASSES = new Set(["Foundational", "Domain Required", "Go-Live"]);

export function getPosReadinessSummary(project) {
  const checkpoints = Array.isArray(project?.checkpoints)
    ? project.checkpoints.filter((checkpoint) => checkpoint?.domainId === "pos")
    : [];

  if (!checkpoints.length) {
    return {
      readinessState: "not_ready",
      explanation: "POS checkpoint state is unavailable. Do not claim readiness.",
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
          text: "Review POS checkpoint state before making readiness claims."
        }
      ],
      captureContext: [],
      downstreamImpactSignals: []
    };
  }

  const configurationSections = getPosConfigurationSections(project || {});
  const failedCheckpoints = checkpoints.filter((checkpoint) => checkpoint.status === "Fail" || checkpoint.blockerFlag);
  const blockers = failedCheckpoints.map((checkpoint) => ({
    checkpointId: checkpoint.id,
    title: checkpoint.title,
    checkpointClass: checkpoint.checkpointClass,
    reason: checkpoint.blockedReason || "Blocked or insufficient evidence."
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
      evidenceMode: checkpoint.posEvidence?.mode || "none",
      sufficiency: getPosEvidenceSufficiency(checkpoint)
    }));
  const captureOnly = checkpoints
    .filter((checkpoint) => checkpoint.posEvidence?.mode === "design_capture")
    .map((checkpoint) => ({
      checkpointId: checkpoint.id,
      title: checkpoint.title,
      summary: checkpoint.posEvidence?.summary || "Design capture exists without stronger proof."
    }));
  const criticalEvidenceGaps = evidenceGaps.filter((item) => {
    const checkpoint = checkpoints.find((candidate) => candidate.id === item.checkpointId);
    return (
      checkpoint &&
      READY_BLOCKING_CLASSES.has(checkpoint.checkpointClass) &&
      ["none", "design_capture"].includes(item.evidenceMode)
    );
  });

  const requiredOrGoLiveFailures = failedCheckpoints.filter((checkpoint) =>
    READY_BLOCKING_CLASSES.has(checkpoint.checkpointClass)
  );
  const requiredOrGoLiveCheckpoints = checkpoints.filter((checkpoint) =>
    READY_BLOCKING_CLASSES.has(checkpoint.checkpointClass)
  );
  const requiredOrGoLivePassed = requiredOrGoLiveCheckpoints.every((checkpoint) => checkpoint.status === "Pass");
  const allPosPassed = checkpoints.every((checkpoint) => checkpoint.status === "Pass");
  const hasDeferred = deferredCheckpoints.length > 0;
  const hasEvidenceGaps = evidenceGaps.length > 0;
  const hasStrongEvidenceOnly = checkpoints.every(
    (checkpoint) => checkpoint.posEvidence?.mode === "system_detected"
  );

  let readinessState = "not_ready";
  let explanation =
    "POS is not yet proven ready. Review blockers, evidence, and deferred conditions before claiming progress.";

  if (requiredOrGoLiveFailures.length > 0) {
    readinessState = "not_ready";
    explanation = "POS remains blocked by failed required or go-live checkpoints.";
  } else if (criticalEvidenceGaps.length > 0) {
    readinessState = "not_ready";
    explanation = "POS required/go-live checkpoints are not yet supported by strong enough evidence.";
  } else if (allPosPassed && !hasDeferred && !hasEvidenceGaps && hasStrongEvidenceOnly) {
    readinessState = "ready";
    explanation = "POS checkpoint and evidence state support a strict readiness claim.";
  } else if (requiredOrGoLivePassed && hasDeferred && criticalEvidenceGaps.length === 0) {
    readinessState = "conditionally_ready";
    explanation =
      "POS required/go-live checkpoints pass, but readiness is still not proven. Deferred items and weaker non-system evidence require explicit follow-up and review.";
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
      deferredCheckpoints,
      evidenceGaps
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

function buildNextActions({ blockers, deferredCheckpoints, evidenceGaps }) {
  if (blockers.length) {
    return blockers.slice(0, 3).map((blocker) => ({
      priority: "blocker",
      checkpointId: blocker.checkpointId,
      text: `${blocker.title}: ${blocker.reason}`
    }));
  }

  if (deferredCheckpoints.length) {
    return deferredCheckpoints.slice(0, 3).map((item) => ({
      priority: "deferred",
      checkpointId: item.checkpointId,
      text: `${item.title}: review at ${item.reviewPoint}.`
    }));
  }

  return evidenceGaps.slice(0, 3).map((item) => ({
    priority: "evidence",
    checkpointId: item.checkpointId,
    text: `${item.title}: strengthen evidence beyond ${item.evidenceMode.replaceAll("_", " ")}.`
  }));
}

function getDownstreamImpactSignals(checkpoints) {
  const impacts = checkpoints
    .flatMap((checkpoint) => SAMPLE_GUIDANCE_BLOCKS[checkpoint.guidanceKey]?.downstreamImpact || [])
    .filter(Boolean);

  return [...new Set(impacts)].slice(0, 4);
}

function isEvidenceGap(checkpoint) {
  const mode = checkpoint.posEvidence?.mode || "none";
  return mode === "none" || mode === "design_capture" || mode === "user_asserted";
}
