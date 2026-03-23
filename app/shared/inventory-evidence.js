export const INVENTORY_EVIDENCE_MODES = [
  "none",
  "design_capture",
  "user_asserted",
  "system_detected"
];

export function createInventoryEvidenceState() {
  return {
    mode: "none",
    summary: "",
    sourceLabel: "",
    notes: "",
    recordedActor: "",
    recordedAt: ""
  };
}

export function normalizeInventoryEvidenceForCheckpoints(checkpoints = [], inventoryConfiguration) {
  return checkpoints.map((checkpoint) => normalizeCheckpointEvidence(checkpoint, inventoryConfiguration));
}

export function updateInventoryEvidenceRecord(state, checkpointId, patch) {
  const nextState = structuredClone(state);
  const checkpoint = nextState.checkpoints?.find((item) => item.id === checkpointId);

  if (!checkpoint) {
    return nextState;
  }

  const currentEvidence = normalizeInventoryEvidenceState(checkpoint.inventoryEvidence, checkpoint.id, nextState.inventoryConfiguration);
  const nextEvidence = normalizeInventoryEvidenceState(
    {
      ...currentEvidence,
      ...patch,
      recordedActor: patch.recordedActor ?? "ui-user",
      recordedAt: patch.recordedAt ?? new Date().toISOString()
    },
    checkpoint.id,
    nextState.inventoryConfiguration
  );

  checkpoint.inventoryEvidence = nextEvidence;
  return nextState;
}

export function normalizeInventoryEvidenceState(rawEvidence, checkpointId, inventoryConfiguration) {
  const evidence = {
    ...createInventoryEvidenceState(),
    ...(rawEvidence || {})
  };

  evidence.mode = INVENTORY_EVIDENCE_MODES.includes(evidence.mode) ? evidence.mode : "none";
  evidence.summary = normalizeString(evidence.summary);
  evidence.sourceLabel = normalizeString(evidence.sourceLabel);
  evidence.notes = normalizeString(evidence.notes);
  evidence.recordedActor = normalizeString(evidence.recordedActor);
  evidence.recordedAt = normalizeString(evidence.recordedAt);

  const derivedDesignCapture = getDerivedDesignCaptureEvidence(checkpointId, inventoryConfiguration);

  if (evidence.mode === "system_detected") {
    evidence.mode = evidence.summary || evidence.sourceLabel || evidence.recordedActor ? "user_asserted" : "none";
  }

  if (evidence.mode === "none" && derivedDesignCapture) {
    return {
      ...evidence,
      mode: "design_capture",
      summary: derivedDesignCapture.summary,
      sourceLabel: derivedDesignCapture.sourceLabel
    };
  }

  if (evidence.mode === "design_capture") {
    return derivedDesignCapture
      ? {
          ...evidence,
          summary: derivedDesignCapture.summary,
          sourceLabel: derivedDesignCapture.sourceLabel
        }
      : {
          ...evidence,
          mode: "none",
          summary: "",
          sourceLabel: ""
        };
  }

  return evidence;
}

export function getInventoryEvidenceSufficiency(checkpoint) {
  const evidence = checkpoint?.inventoryEvidence || createInventoryEvidenceState();

  if (checkpoint?.status === "Fail" || checkpoint?.blockerFlag) {
    return "Blocked or insufficient";
  }

  switch (evidence.mode) {
    case "system_detected":
      return "Strongest available in current architecture";
    case "user_asserted":
      return "Review required";
    case "design_capture":
      return "Context only";
    case "none":
    default:
      return "No recorded evidence";
  }
}

function normalizeCheckpointEvidence(checkpoint, inventoryConfiguration) {
  if (!isInventoryEvidenceCheckpoint(checkpoint?.id)) {
    return checkpoint;
  }

  return {
    ...checkpoint,
    inventoryEvidence: normalizeInventoryEvidenceState(checkpoint.inventoryEvidence, checkpoint.id, inventoryConfiguration)
  };
}

function getDerivedDesignCaptureEvidence(checkpointId, inventoryConfiguration) {
  const configuration = inventoryConfiguration || {};

  if (checkpointId === "checkpoint-inventory-warehouse-setup") {
    const count = countInScope(configuration?.warehouses);
    return count
      ? {
          summary: `${count} in-scope warehouse design record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Inventory design capture"
        }
      : null;
  }

  if (checkpointId === "checkpoint-inventory-operation-types") {
    const count = countInScope(configuration?.operationTypes);
    return count
      ? {
          summary: `${count} in-scope operation-type design record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Inventory design capture"
        }
      : null;
  }

  if (checkpointId === "checkpoint-inventory-routes") {
    const count = countInScope(configuration?.routes);
    return count
      ? {
          summary: `${count} in-scope route design record${count === 1 ? "" : "s"} captured.`,
          sourceLabel: "Inventory design capture"
        }
      : null;
  }

  return null;
}

function countInScope(records) {
  return Array.isArray(records) ? records.filter((record) => record?.inScope).length : 0;
}

function isInventoryEvidenceCheckpoint(checkpointId) {
  return [
    "checkpoint-inventory-warehouse-setup",
    "checkpoint-inventory-operation-types",
    "checkpoint-inventory-routes",
    "checkpoint-inventory-valuation",
    "checkpoint-inventory-landed-costs"
  ].includes(checkpointId);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
