export const ACCOUNTING_EVIDENCE_MODES = ["none", "design_capture", "user_asserted", "system_detected"];

export function createAccountingEvidenceState() {
  return {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
}

export function normalizeAccountingEvidenceForCheckpoints(checkpoints = [], accountingConfiguration) {
  return checkpoints.map((checkpoint) => normalizeCheckpointEvidence(checkpoint, accountingConfiguration));
}

export function updateAccountingEvidenceRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints?.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return nextState;
  }

  const currentEvidence = normalizeAccountingEvidenceState(
    checkpoint.accountingEvidence,
    checkpoint.id,
    nextState.accountingConfiguration
  );
  const nextEvidence = normalizeAccountingEvidenceState(
    {
      ...currentEvidence,
      ...patch,
      recordedActor: patch.recordedActor ?? "ui-user",
      recordedAt: patch.recordedAt ?? new Date().toISOString()
    },
    checkpoint.id,
    nextState.accountingConfiguration
  );

  checkpoint.accountingEvidence = nextEvidence;
  return nextState;
}

export function normalizeAccountingEvidenceState(rawEvidence, checkpointId, accountingConfiguration) {
  const evidence = {
    ...createAccountingEvidenceState(),
    ...(rawEvidence || {})
  };

  evidence.mode = ACCOUNTING_EVIDENCE_MODES.includes(evidence.mode) ? evidence.mode : "none";
  evidence.summary = normalizeString(evidence.summary);
  evidence.sourceLabel = normalizeString(evidence.sourceLabel);
  evidence.notes = normalizeString(evidence.notes);
  evidence.recordedActor = normalizeString(evidence.recordedActor);
  evidence.recordedAt = normalizeString(evidence.recordedAt);

  const derivedDesignCapture = getDerivedDesignCaptureEvidence(checkpointId, accountingConfiguration);

  if (evidence.mode === "system_detected") {
    evidence.mode = evidence.summary || evidence.sourceLabel || evidence.notes || evidence.recordedActor ? "user_asserted" : "none";
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

export function getAccountingEvidenceSufficiency(checkpoint) {
  const evidence = checkpoint?.accountingEvidence || createAccountingEvidenceState();

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

export function getAccountingEvidenceLabel(evidence) {
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

function normalizeCheckpointEvidence(checkpoint, accountingConfiguration) {
  if (!isAccountingEvidenceCheckpoint(checkpoint?.id)) {
    return checkpoint;
  }

  return {
    ...checkpoint,
    accountingEvidence: normalizeAccountingEvidenceState(checkpoint.accountingEvidence, checkpoint.id, accountingConfiguration)
  };
}

function getDerivedDesignCaptureEvidence(checkpointId, accountingConfiguration) {
  const configuration = accountingConfiguration || {};

  if (checkpointId === "checkpoint-finance-policy" || checkpointId === "checkpoint-accounting-valuation-method-prerequisites") {
    const count = countInScope(configuration?.policyCapture);
    return count
      ? {
          summary: `${count} in-scope policy capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Accounting design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-accounting-stock-mapping-prerequisites") {
    const count = countInScope(configuration?.stockMappingCapture);
    return count
      ? {
          summary: `${count} in-scope stock mapping capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Accounting design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-accounting-landed-cost-prerequisites") {
    const count = countInScope(configuration?.landedCostCapture);
    return count
      ? {
          summary: `${count} in-scope landed-cost capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Accounting design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  return null;
}

function countInScope(records) {
  return Array.isArray(records) ? records.filter((record) => record?.inScope).length : 0;
}

function isAccountingEvidenceCheckpoint(checkpointId) {
  return [
    "checkpoint-finance-policy",
    "checkpoint-accounting-valuation-method-prerequisites",
    "checkpoint-accounting-stock-mapping-prerequisites",
    "checkpoint-accounting-landed-cost-prerequisites"
  ].includes(checkpointId);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
