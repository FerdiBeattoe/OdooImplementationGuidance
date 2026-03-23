export const SALES_EVIDENCE_MODES = ["none", "design_capture", "user_asserted", "system_detected"];

export function createSalesEvidenceState() {
  return {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
}

export function normalizeSalesEvidenceForCheckpoints(checkpoints = [], salesConfiguration) {
  return checkpoints.map((checkpoint) => normalizeCheckpointEvidence(checkpoint, salesConfiguration));
}

export function updateSalesEvidenceRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints?.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return nextState;
  }

  const currentEvidence = normalizeSalesEvidenceState(checkpoint.salesEvidence, checkpoint.id, nextState.salesConfiguration);
  const nextEvidence = normalizeSalesEvidenceState(
    {
      ...currentEvidence,
      ...patch,
      recordedActor: patch.recordedActor ?? "ui-user",
      recordedAt: patch.recordedAt ?? new Date().toISOString()
    },
    checkpoint.id,
    nextState.salesConfiguration
  );

  checkpoint.salesEvidence = nextEvidence;
  return nextState;
}

export function normalizeSalesEvidenceState(rawEvidence, checkpointId, salesConfiguration) {
  const evidence = {
    ...createSalesEvidenceState(),
    ...(rawEvidence || {})
  };

  evidence.mode = SALES_EVIDENCE_MODES.includes(evidence.mode) ? evidence.mode : "none";
  evidence.summary = normalizeString(evidence.summary);
  evidence.sourceLabel = normalizeString(evidence.sourceLabel);
  evidence.notes = normalizeString(evidence.notes);
  evidence.recordedActor = normalizeString(evidence.recordedActor);
  evidence.recordedAt = normalizeString(evidence.recordedAt);

  const derivedDesignCapture = getDerivedDesignCaptureEvidence(checkpointId, salesConfiguration);

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

export function getSalesEvidenceSufficiency(checkpoint) {
  const evidence = checkpoint?.salesEvidence || createSalesEvidenceState();

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

export function getSalesEvidenceLabel(evidence) {
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

function normalizeCheckpointEvidence(checkpoint, salesConfiguration) {
  if (!isSalesEvidenceCheckpoint(checkpoint?.id)) {
    return checkpoint;
  }

  return {
    ...checkpoint,
    salesEvidence: normalizeSalesEvidenceState(checkpoint.salesEvidence, checkpoint.id, salesConfiguration)
  };
}

function getDerivedDesignCaptureEvidence(checkpointId, salesConfiguration) {
  const configuration = salesConfiguration || {};

  if (checkpointId === "checkpoint-sales-process-mode") {
    const count = countInScope(configuration?.processCapture);
    return count
      ? {
          summary: `${count} in-scope sales process capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Sales design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-sales-pricing-policy") {
    const count = countInScope(configuration?.pricingCapture);
    return count
      ? {
          summary: `${count} in-scope pricing capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Sales design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-sales-quotation-control") {
    const count = countInScope(configuration?.quotationControlCapture);
    return count
      ? {
          summary: `${count} in-scope quotation-control capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Sales design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-sales-fulfillment-handoff") {
    const count = countInScope(configuration?.fulfillmentHandoffCapture);
    return count
      ? {
          summary: `${count} in-scope fulfillment-handoff capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Sales design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  return null;
}

function countInScope(records) {
  return Array.isArray(records) ? records.filter((record) => record?.inScope).length : 0;
}

function isSalesEvidenceCheckpoint(checkpointId) {
  return [
    "checkpoint-sales-process-mode",
    "checkpoint-sales-pricing-policy",
    "checkpoint-sales-quotation-control",
    "checkpoint-sales-fulfillment-handoff"
  ].includes(checkpointId);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
