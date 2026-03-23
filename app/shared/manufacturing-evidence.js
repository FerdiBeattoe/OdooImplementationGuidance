export const MANUFACTURING_EVIDENCE_MODES = ["none", "design_capture", "user_asserted", "system_detected"];

export function createManufacturingEvidenceState() {
  return {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
}

export function normalizeManufacturingEvidenceForCheckpoints(checkpoints = [], manufacturingConfiguration) {
  return checkpoints.map((checkpoint) => normalizeCheckpointEvidence(checkpoint, manufacturingConfiguration));
}

export function updateManufacturingEvidenceRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints?.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return nextState;
  }

  const currentEvidence = normalizeManufacturingEvidenceState(
    checkpoint.manufacturingEvidence,
    checkpoint.id,
    nextState.manufacturingConfiguration
  );
  const nextEvidence = normalizeManufacturingEvidenceState(
    {
      ...currentEvidence,
      ...patch,
      recordedActor: patch.recordedActor ?? "ui-user",
      recordedAt: patch.recordedAt ?? new Date().toISOString()
    },
    checkpoint.id,
    nextState.manufacturingConfiguration
  );

  checkpoint.manufacturingEvidence = nextEvidence;
  return nextState;
}

export function normalizeManufacturingEvidenceState(rawEvidence, checkpointId, manufacturingConfiguration) {
  const evidence = {
    ...createManufacturingEvidenceState(),
    ...(rawEvidence || {})
  };

  evidence.mode = MANUFACTURING_EVIDENCE_MODES.includes(evidence.mode) ? evidence.mode : "none";
  evidence.summary = normalizeString(evidence.summary);
  evidence.sourceLabel = normalizeString(evidence.sourceLabel);
  evidence.notes = normalizeString(evidence.notes);
  evidence.recordedActor = normalizeString(evidence.recordedActor);
  evidence.recordedAt = normalizeString(evidence.recordedAt);

  const derivedDesignCapture = getDerivedDesignCaptureEvidence(checkpointId, manufacturingConfiguration);

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

export function getManufacturingEvidenceSufficiency(checkpoint) {
  const evidence = checkpoint?.manufacturingEvidence || createManufacturingEvidenceState();

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

export function getManufacturingEvidenceLabel(evidence) {
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

function normalizeCheckpointEvidence(checkpoint, manufacturingConfiguration) {
  if (!isManufacturingEvidenceCheckpoint(checkpoint?.id)) {
    return checkpoint;
  }

  return {
    ...checkpoint,
    manufacturingEvidence: normalizeManufacturingEvidenceState(
      checkpoint.manufacturingEvidence,
      checkpoint.id,
      manufacturingConfiguration
    )
  };
}

function getDerivedDesignCaptureEvidence(checkpointId, manufacturingConfiguration) {
  const configuration = manufacturingConfiguration || {};

  if (checkpointId === "checkpoint-manufacturing-process-mode") {
    const count = countInScope(configuration?.productionModeCapture);
    return count
      ? {
          summary: `${count} in-scope production-mode capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Manufacturing design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-manufacturing-bom-governance") {
    const count = countInScope(configuration?.bomGovernanceCapture);
    return count
      ? {
          summary: `${count} in-scope BOM-governance capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Manufacturing design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-manufacturing-routing-control") {
    const count = countInScope(configuration?.routingControlCapture);
    return count
      ? {
          summary: `${count} in-scope routing-control capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Manufacturing design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-manufacturing-production-handoff") {
    const count = countInScope(configuration?.productionHandoffCapture);
    return count
      ? {
          summary: `${count} in-scope production-handoff capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Manufacturing design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  return null;
}

function countInScope(records) {
  return Array.isArray(records) ? records.filter((record) => record?.inScope).length : 0;
}

function isManufacturingEvidenceCheckpoint(checkpointId) {
  return [
    "checkpoint-manufacturing-process-mode",
    "checkpoint-manufacturing-bom-governance",
    "checkpoint-manufacturing-routing-control",
    "checkpoint-manufacturing-production-handoff"
  ].includes(checkpointId);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
