export const POS_EVIDENCE_MODES = ["none", "design_capture", "user_asserted", "system_detected"];

export function createPosEvidenceState() {
  return {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
}

export function normalizePosEvidenceForCheckpoints(checkpoints = [], posConfiguration) {
  return checkpoints.map((checkpoint) => normalizeCheckpointEvidence(checkpoint, posConfiguration));
}

export function updatePosEvidenceRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints?.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return nextState;
  }

  const currentEvidence = normalizePosEvidenceState(
    checkpoint.posEvidence,
    checkpoint.id,
    nextState.posConfiguration
  );
  const nextEvidence = normalizePosEvidenceState(
    {
      ...currentEvidence,
      ...patch,
      recordedActor: patch.recordedActor ?? "ui-user",
      recordedAt: patch.recordedAt ?? new Date().toISOString()
    },
    checkpoint.id,
    nextState.posConfiguration
  );

  checkpoint.posEvidence = nextEvidence;
  return nextState;
}

export function normalizePosEvidenceState(rawEvidence, checkpointId, posConfiguration) {
  const evidence = {
    ...createPosEvidenceState(),
    ...(rawEvidence || {})
  };

  evidence.mode = POS_EVIDENCE_MODES.includes(evidence.mode) ? evidence.mode : "none";
  evidence.summary = normalizeString(evidence.summary);
  evidence.sourceLabel = normalizeString(evidence.sourceLabel);
  evidence.notes = normalizeString(evidence.notes);
  evidence.recordedActor = normalizeString(evidence.recordedActor);
  evidence.recordedAt = normalizeString(evidence.recordedAt);

  const derivedDesignCapture = getDerivedDesignCaptureEvidence(checkpointId, posConfiguration);

  if (evidence.mode === "system_detected") {
    evidence.mode =
      evidence.summary || evidence.sourceLabel || evidence.notes || evidence.recordedActor ? "user_asserted" : "none";
  }

  if (evidence.mode === "none" && derivedDesignCapture) {
    return {
      ...evidence,
      mode: "design_capture",
      summary: derivedDesignCapture.summary,
      sourceLabel: derivedDesignCapture.sourceLabel,
      notes: derivedDesignCapture.notes,
      recordedActor: "",
      recordedAt: ""
    };
  }

  if (evidence.mode === "design_capture") {
    return derivedDesignCapture
      ? {
          ...evidence,
          summary: derivedDesignCapture.summary,
          sourceLabel: derivedDesignCapture.sourceLabel,
          notes: derivedDesignCapture.notes,
          recordedActor: "",
          recordedAt: ""
        }
      : {
          ...evidence,
          mode: "none",
          summary: "",
          sourceLabel: "",
          notes: "",
          recordedActor: "",
          recordedAt: ""
        };
  }

  return evidence;
}

export function getPosEvidenceSufficiency(checkpoint) {
  const evidence = checkpoint?.posEvidence || createPosEvidenceState();

  if (checkpoint?.status === "Fail" || checkpoint?.blockerFlag) {
    return "Blocked or insufficient";
  }

  switch (evidence.mode) {
    case "system_detected":
      return "Unsupported in current architecture";
    case "user_asserted":
      return "Review required";
    case "design_capture":
      return "Context only";
    case "none":
    default:
      return "No recorded evidence";
  }
}

export function getPosEvidenceLabel(evidence) {
  switch (evidence?.mode) {
    case "design_capture":
      return "design capture";
    case "user_asserted":
      return "user asserted";
    case "system_detected":
      return "unsupported system detected";
    case "none":
    default:
      return "none";
  }
}

function normalizeCheckpointEvidence(checkpoint, posConfiguration) {
  if (!isPosEvidenceCheckpoint(checkpoint?.id)) {
    return checkpoint;
  }

  return {
    ...checkpoint,
    posEvidence: normalizePosEvidenceState(checkpoint.posEvidence, checkpoint.id, posConfiguration)
  };
}

function getDerivedDesignCaptureEvidence(checkpointId, posConfiguration) {
  const configuration = posConfiguration || {};

  if (checkpointId === "checkpoint-pos-session-control") {
    const count = countInScope(configuration?.sessionPolicyCapture);
    return count
      ? {
          summary: `${count} in-scope session-policy capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "POS design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-pos-accounting-linkage") {
    const count = countInScope(configuration?.invoicingPolicyCapture);
    return count
      ? {
          summary: `${count} in-scope invoicing-policy capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "POS design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  return null;
}

function countInScope(records) {
  return Array.isArray(records) ? records.filter((record) => record?.inScope).length : 0;
}

function isPosEvidenceCheckpoint(checkpointId) {
  return [
    "checkpoint-pos-session-control",
    "checkpoint-pos-cashier-access",
    "checkpoint-pos-accounting-linkage"
  ].includes(checkpointId);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
