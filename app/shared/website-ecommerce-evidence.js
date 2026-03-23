export const WEBSITE_ECOMMERCE_EVIDENCE_MODES = ["none", "design_capture", "user_asserted", "system_detected"];

export function createWebsiteEcommerceEvidenceState() {
  return {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
}

export function normalizeWebsiteEcommerceEvidenceForCheckpoints(checkpoints = [], websiteEcommerceConfiguration) {
  return checkpoints.map((checkpoint) => normalizeCheckpointEvidence(checkpoint, websiteEcommerceConfiguration));
}

export function updateWebsiteEcommerceEvidenceRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints?.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return nextState;
  }

  const currentEvidence = normalizeWebsiteEcommerceEvidenceState(
    checkpoint.websiteEcommerceEvidence,
    checkpoint.id,
    nextState.websiteEcommerceConfiguration
  );
  const nextEvidence = normalizeWebsiteEcommerceEvidenceState(
    {
      ...currentEvidence,
      ...patch,
      recordedActor: patch.recordedActor ?? "ui-user",
      recordedAt: patch.recordedAt ?? new Date().toISOString()
    },
    checkpoint.id,
    nextState.websiteEcommerceConfiguration
  );

  checkpoint.websiteEcommerceEvidence = nextEvidence;
  return nextState;
}

export function normalizeWebsiteEcommerceEvidenceState(rawEvidence, checkpointId, websiteEcommerceConfiguration) {
  const evidence = {
    ...createWebsiteEcommerceEvidenceState(),
    ...(rawEvidence || {})
  };

  evidence.mode = WEBSITE_ECOMMERCE_EVIDENCE_MODES.includes(evidence.mode) ? evidence.mode : "none";
  evidence.summary = normalizeString(evidence.summary);
  evidence.sourceLabel = normalizeString(evidence.sourceLabel);
  evidence.notes = normalizeString(evidence.notes);
  evidence.recordedActor = normalizeString(evidence.recordedActor);
  evidence.recordedAt = normalizeString(evidence.recordedAt);

  const derivedDesignCapture = getDerivedDesignCaptureEvidence(checkpointId, websiteEcommerceConfiguration);

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

export function getWebsiteEcommerceEvidenceSufficiency(checkpoint) {
  const evidence = checkpoint?.websiteEcommerceEvidence || createWebsiteEcommerceEvidenceState();

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

export function getWebsiteEcommerceEvidenceLabel(evidence) {
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

function normalizeCheckpointEvidence(checkpoint, websiteEcommerceConfiguration) {
  if (!isWebsiteEcommerceEvidenceCheckpoint(checkpoint?.id)) {
    return checkpoint;
  }

  return {
    ...checkpoint,
    websiteEcommerceEvidence: normalizeWebsiteEcommerceEvidenceState(
      checkpoint.websiteEcommerceEvidence,
      checkpoint.id,
      websiteEcommerceConfiguration
    )
  };
}

function getDerivedDesignCaptureEvidence(checkpointId, websiteEcommerceConfiguration) {
  const configuration = websiteEcommerceConfiguration || {};

  if (checkpointId === "checkpoint-website-catalog-publication") {
    const count = countInScope(configuration?.storefrontCapture);
    return count
      ? {
          summary: `${count} in-scope storefront capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Website design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-website-checkout-baseline") {
    const count = countInScope(configuration?.checkoutCapture);
    return count
      ? {
          summary: `${count} in-scope checkout capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Website design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  if (checkpointId === "checkpoint-website-delivery-handoff") {
    const count = countInScope(configuration?.deliveryHandoffCapture);
    return count
      ? {
          summary: `${count} in-scope delivery-handoff capture record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Website design capture",
          notes: "Derived from implementation capture only."
        }
      : null;
  }

  return null;
}

function countInScope(records) {
  return Array.isArray(records) ? records.filter((record) => record?.inScope).length : 0;
}

function isWebsiteEcommerceEvidenceCheckpoint(checkpointId) {
  return [
    "checkpoint-website-scope-baseline",
    "checkpoint-website-catalog-publication",
    "checkpoint-website-customer-access-model",
    "checkpoint-website-checkout-baseline",
    "checkpoint-website-delivery-handoff"
  ].includes(checkpointId);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
