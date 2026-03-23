export const PURCHASE_EVIDENCE_MODES = ["none", "design_capture", "user_asserted", "system_detected"];

export function createPurchaseEvidenceState() {
  return {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
}

export function normalizePurchaseEvidenceForCheckpoints(checkpoints = [], purchaseConfiguration) {
  return checkpoints.map((checkpoint) => normalizeCheckpointEvidence(checkpoint, purchaseConfiguration));
}

export function updatePurchaseEvidenceRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints?.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return nextState;
  }

  const currentEvidence = normalizePurchaseEvidenceState(checkpoint.purchaseEvidence, checkpoint.id, nextState.purchaseConfiguration);
  const nextEvidence = normalizePurchaseEvidenceState(
    {
      ...currentEvidence,
      ...patch,
      recordedActor: patch.recordedActor ?? "ui-user",
      recordedAt: patch.recordedAt ?? new Date().toISOString()
    },
    checkpoint.id,
    nextState.purchaseConfiguration
  );

  checkpoint.purchaseEvidence = nextEvidence;
  return nextState;
}

export function normalizePurchaseEvidenceState(rawEvidence, checkpointId, purchaseConfiguration) {
  const evidence = {
    ...createPurchaseEvidenceState(),
    ...(rawEvidence || {})
  };

  evidence.mode = PURCHASE_EVIDENCE_MODES.includes(evidence.mode) ? evidence.mode : "none";
  evidence.summary = normalizeString(evidence.summary);
  evidence.sourceLabel = normalizeString(evidence.sourceLabel);
  evidence.notes = normalizeString(evidence.notes);
  evidence.recordedActor = normalizeString(evidence.recordedActor);
  evidence.recordedAt = normalizeString(evidence.recordedAt);

  const derivedDesignCapture = getDerivedDesignCaptureEvidence(checkpointId, purchaseConfiguration);

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

export function getPurchaseEvidenceSufficiency(checkpoint) {
  const evidence = checkpoint?.purchaseEvidence || createPurchaseEvidenceState();

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

export function getPurchaseEvidenceLabel(evidence) {
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

function normalizeCheckpointEvidence(checkpoint, purchaseConfiguration) {
  if (!isPurchaseEvidenceCheckpoint(checkpoint?.id)) {
    return checkpoint;
  }

  return {
    ...checkpoint,
    purchaseEvidence: normalizePurchaseEvidenceState(checkpoint.purchaseEvidence, checkpoint.id, purchaseConfiguration)
  };
}

function getDerivedDesignCaptureEvidence(checkpointId, purchaseConfiguration) {
  const configuration = purchaseConfiguration || {};

  if (checkpointId === "checkpoint-purchase-process-mode") {
    const count = countInScope(configuration?.processCapture);
    return count
      ? {
          summary: `${count} in-scope purchase process capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Purchase design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-purchase-vendor-pricing-policy") {
    const count = countInScope(configuration?.vendorPricingCapture);
    return count
      ? {
          summary: `${count} in-scope vendor pricing capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Purchase design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-purchase-approval-control") {
    const count = countInScope(configuration?.approvalControlCapture);
    return count
      ? {
          summary: `${count} in-scope purchase approval capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Purchase design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-purchase-inbound-handoff") {
    const count = countInScope(configuration?.inboundHandoffCapture);
    return count
      ? {
          summary: `${count} in-scope inbound handoff capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Purchase design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  return null;
}

function countInScope(records) {
  return Array.isArray(records) ? records.filter((record) => record?.inScope).length : 0;
}

function isPurchaseEvidenceCheckpoint(checkpointId) {
  return [
    "checkpoint-purchase-process-mode",
    "checkpoint-purchase-vendor-pricing-policy",
    "checkpoint-purchase-approval-control",
    "checkpoint-purchase-inbound-handoff"
  ].includes(checkpointId);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
