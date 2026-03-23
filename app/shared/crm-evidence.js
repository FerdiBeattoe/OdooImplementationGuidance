export const CRM_EVIDENCE_MODES = ["none", "design_capture", "user_asserted", "system_detected"];

export function createCrmEvidenceState() {
  return {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
}

export function normalizeCrmEvidenceForCheckpoints(checkpoints = [], crmConfiguration) {
  return checkpoints.map((checkpoint) => normalizeCheckpointEvidence(checkpoint, crmConfiguration));
}

export function updateCrmEvidenceRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints?.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return nextState;
  }

  const currentEvidence = normalizeCrmEvidenceState(
    checkpoint.crmEvidence,
    checkpoint.id,
    nextState.crmConfiguration
  );
  const nextEvidence = normalizeCrmEvidenceState(
    {
      ...currentEvidence,
      ...patch,
      recordedActor: patch.recordedActor ?? "ui-user",
      recordedAt: patch.recordedAt ?? new Date().toISOString()
    },
    checkpoint.id,
    nextState.crmConfiguration
  );

  checkpoint.crmEvidence = nextEvidence;
  return nextState;
}

export function normalizeCrmEvidenceState(rawEvidence, checkpointId, crmConfiguration) {
  const evidence = {
    ...createCrmEvidenceState(),
    ...(rawEvidence || {})
  };

  evidence.mode = CRM_EVIDENCE_MODES.includes(evidence.mode) ? evidence.mode : "none";
  evidence.summary = normalizeString(evidence.summary);
  evidence.sourceLabel = normalizeString(evidence.sourceLabel);
  evidence.notes = normalizeString(evidence.notes);
  evidence.recordedActor = normalizeString(evidence.recordedActor);
  evidence.recordedAt = normalizeString(evidence.recordedAt);

  const derivedDesignCapture = getDerivedDesignCaptureEvidence(checkpointId, crmConfiguration);

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

export function getCrmEvidenceSufficiency(checkpoint) {
  const evidence = checkpoint?.crmEvidence || createCrmEvidenceState();

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

export function getCrmEvidenceLabel(evidence) {
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

function normalizeCheckpointEvidence(checkpoint, crmConfiguration) {
  if (!isCrmEvidenceCheckpoint(checkpoint?.id)) {
    return checkpoint;
  }

  return {
    ...checkpoint,
    crmEvidence: normalizeCrmEvidenceState(checkpoint.crmEvidence, checkpoint.id, crmConfiguration)
  };
}

function getDerivedDesignCaptureEvidence(checkpointId, crmConfiguration) {
  const configuration = crmConfiguration || {};

  if (checkpointId === "checkpoint-crm-pipeline-governance") {
    const count = countInScope(configuration?.pipelineCapture);
    return count
      ? {
          summary: `${count} in-scope pipeline capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "CRM design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-crm-sales-team-ownership") {
    const count = countInScope(configuration?.activityDisciplineCapture);
    return count
      ? {
          summary: `${count} in-scope activity and team capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "CRM design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-crm-quotation-handoff") {
    const count = countInScope(configuration?.quotationHandoffCapture);
    return count
      ? {
          summary: `${count} in-scope quotation-handoff capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "CRM design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  return null;
}

function countInScope(records) {
  return Array.isArray(records) ? records.filter((record) => record?.inScope).length : 0;
}

function isCrmEvidenceCheckpoint(checkpointId) {
  return [
    "checkpoint-crm-lead-opportunity-model",
    "checkpoint-crm-pipeline-governance",
    "checkpoint-crm-sales-team-ownership",
    "checkpoint-crm-quotation-handoff"
  ].includes(checkpointId);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
