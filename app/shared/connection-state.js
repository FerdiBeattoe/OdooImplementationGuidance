import { ODOO_VERSION, TARGET_STATUSES } from "./constants.js";
import { getCombinationError, requiresBranchTarget } from "./target-matrix.js";

export const CONNECTION_STATUSES = [
  "not_connected",
  "connected_inspect",
  "connected_preview",
  "connected_execute",
  "unsupported"
];

export const CONNECTION_CAPABILITY_LEVELS = ["manual-only", "inspect", "preview", "execute"];

export function createInitialConnectionState() {
  return {
    mode: "application-layer",
    status: "not_connected",
    capabilityLevel: "manual-only",
    supported: true,
    reason: "",
    lastCheckedAt: "",
    connectedAt: "",
    environmentIdentity: {
      urlOrigin: "",
      database: "",
      serverVersion: "",
      serverSerie: "",
      edition: "",
      deployment: "",
      branchTarget: "",
      environmentTarget: ""
    },
    availableFeatures: {
      inspect: false,
      preview: false,
      execute: false
    }
  };
}

export function normalizeConnectionState(state = {}, projectIdentity = {}) {
  const normalized = {
    ...createInitialConnectionState(),
    ...state,
    environmentIdentity: {
      ...createInitialConnectionState().environmentIdentity,
      ...(state?.environmentIdentity || {})
    },
    availableFeatures: {
      ...createInitialConnectionState().availableFeatures,
      ...(state?.availableFeatures || {})
    }
  };

  const combinationError = getCombinationError(projectIdentity);
  // Check version from live environment identity (real connections)
  const serverSerie = normalized.environmentIdentity?.serverSerie || "";
  const majorVersionMatch = serverSerie.match(/(\d+)/);
  const liveMajorVersion = majorVersionMatch ? majorVersionMatch[1] : "";
  // Check version from project identity (test/mock data)
  const projectMajorVersion = String(projectIdentity?.version || "").match(/(\d+)/)?.[1] || "";
  // Version is supported if either source shows ODOO_VERSION
  const versionSupported = liveMajorVersion === ODOO_VERSION || projectMajorVersion === ODOO_VERSION;
  const branchRequired = requiresBranchTarget(projectIdentity || {});
  const branchIdentified = Boolean(
    normalized.environmentIdentity.branchTarget || normalized.environmentIdentity.environmentTarget
  );

  if (!versionSupported) {
    normalized.supported = false;
    normalized.status = "unsupported";
    normalized.capabilityLevel = "manual-only";
    normalized.reason = "Only Odoo 19 targets are supported.";
    normalized.availableFeatures = { inspect: false, preview: false, execute: false };
    return normalized;
  }

  if (combinationError) {
    normalized.supported = false;
    normalized.status = "unsupported";
    normalized.capabilityLevel = "manual-only";
    normalized.reason = combinationError;
    normalized.availableFeatures = { inspect: false, preview: false, execute: false };
    return normalized;
  }

  normalized.supported = true;

  if (!CONNECTION_STATUSES.includes(normalized.status)) {
    normalized.status = "not_connected";
  }

  if (!CONNECTION_CAPABILITY_LEVELS.includes(normalized.capabilityLevel)) {
    normalized.capabilityLevel = "manual-only";
  }

  if (normalized.status === "connected_execute" && branchRequired && !branchIdentified) {
    normalized.status = "connected_preview";
    normalized.capabilityLevel = "preview";
    normalized.availableFeatures.execute = false;
    normalized.reason = "Odoo.sh Enterprise execution requires an explicit branch or environment target.";
  }

  return normalized;
}

export function deriveConnectionWorkspaceModel(connectionState, projectIdentity) {
  const normalized = normalizeConnectionState(connectionState, projectIdentity);
  const branchRequired = requiresBranchTarget(projectIdentity || {});

  if (normalized.status === "unsupported") {
    return {
      status: "Unsupported target",
      headline: normalized.reason,
      summary: "Connection remains blocked until the selected version, edition, and deployment combination is supported.",
      supportedMethods: [],
      unsupportedMethods: ["Live inspection", "Preview generation", "Bounded execution"],
      targetingExplanation: branchRequired
        ? "A branch or environment target will also be required if this target becomes supported."
        : "Branch targeting is not required for this combination."
    };
  }

  if (normalized.status === "not_connected") {
    return {
      status: "Not connected",
      headline: "No live Odoo application-layer session is active.",
      summary:
        "This build supports governed live connection through Odoo application-layer session access only. Database, SSH, and shell control remain blocked.",
      supportedMethods: [
        "Application-layer Odoo session authentication",
        "Read-only inspection of supported models",
        "Preview generation for governed actions once connected"
      ],
      unsupportedMethods: [
        "Direct database access",
        "SSH tunneling or shell control",
        "Unrestricted admin-console style writes"
      ],
      targetingExplanation: branchRequired
        ? "Because this is an Enterprise Odoo.sh target, branch or environment targeting is required before deployment-sensitive execution."
        : "Branch or environment targeting is not required for the current selection."
    };
  }

  return {
    status: renderConnectionCapabilityLabel(normalized.capabilityLevel),
    headline: "A governed live Odoo session is active.",
    summary:
      "Inspection is read-only. Preview and execution remain bounded by checkpoint state, deployment context, target scope, and audit logging.",
    supportedMethods: [
      normalized.availableFeatures.inspect ? "Read-only inspection" : null,
      normalized.availableFeatures.preview ? "Preview generation" : null,
      normalized.availableFeatures.execute ? "Bounded execution of approved safe actions" : null
    ].filter(Boolean),
    unsupportedMethods: [
      "Direct database access",
      "Shell or filesystem mutation",
      "Unrestricted broad-model writes"
    ],
    targetingExplanation: branchRequired
      ? normalized.environmentIdentity.branchTarget || normalized.environmentIdentity.environmentTarget
        ? `Current Odoo.sh target: ${normalized.environmentIdentity.branchTarget || normalized.environmentIdentity.environmentTarget}`
        : "Execution remains constrained until an explicit Odoo.sh branch or environment target is attached."
      : "Branch targeting is not required for the current supported combination."
  };
}

export function renderConnectionCapabilityLabel(capabilityLevel) {
  switch (capabilityLevel) {
    case "inspect":
      return "Connected for inspection";
    case "preview":
      return "Connected for preview";
    case "execute":
      return "Connected for bounded execution";
    default:
      return "Manual-only";
  }
}

