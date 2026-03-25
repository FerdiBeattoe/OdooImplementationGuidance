import { createAuditEntry } from "../shared/audit-log.js";
import {
  createInitialConnectionState,
  normalizeConnectionState
} from "../shared/connection-state.js";
import { getDomainSupport } from "../shared/domain-capabilities.js";
import { createExecutionOutcome } from "../shared/execution-engine.js";
import { createInspectionRecord } from "../shared/inspection-model.js";
import { generateDomainPreview } from "../shared/preview-engine.js";
import { ODOO_VERSION } from "../shared/constants.js";
import { OdooClient, OdooRpcError, detectInstalledModules, detectVersion } from "./odoo-client.js";

const connectionRegistry = new Map();

const CONNECTION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CONNECT_TIMEOUT_MS = 15000; // 15 seconds for connection

// Helper to add timeout to any promise
function withTimeout(promise, ms, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new OdooRpcError(errorMessage, 'TIMEOUT')), ms)
    )
  ]);
}

export async function connectProject(project, payload, fetchImpl = fetch) {
  const client = new OdooClient({
    baseUrl: payload.credentials?.url,
    database: payload.credentials?.database,
    fetchImpl
  });

  try {
    // Attempt authentication with timeout
    await withTimeout(
      client.authenticate(payload.credentials?.username, payload.credentials?.password),
      CONNECT_TIMEOUT_MS,
      'Connection timed out. The Odoo server did not respond within 15 seconds.'
    );
  } catch (authError) {
    // Categorize authentication errors
    console.error('Connection error details:', authError.message, authError.cause, authError.code);
    const errorMsg = authError.message.toLowerCase();
    if (errorMsg.includes('database') || errorMsg.includes('db')) {
      throw new OdooRpcError(`Database not found: "${payload.database}". Please verify the database name exists on this Odoo server.`, 'DATABASE_NOT_FOUND');
    }
    if (errorMsg.includes('credential') || errorMsg.includes('login') || errorMsg.includes('password') || errorMsg.includes('authentication')) {
      throw new OdooRpcError(`Authentication failed. Please check your username and password.`, 'AUTHENTICATION_FAILED');
    }
    throw new OdooRpcError(`Unable to connect to Odoo server at ${payload.credentials?.url}. Original error: ${authError.message}`, 'CONNECTION_FAILED');
  }

  // Detect version
  let version;
  try {
    version = await detectVersion(client);
  } catch (versionError) {
    throw new OdooRpcError(`Unable to retrieve Odoo version information. The server may not be responding correctly.`, 'VERSION_DETECTION_FAILED');
  }

  // Validate version
  const versionString = String(version.serverSerie || "");
  const majorVersionMatch = versionString.match(/(\d+)/);
  const majorVersion = majorVersionMatch ? majorVersionMatch[1] : "";
  if (majorVersion !== ODOO_VERSION) {
    throw new OdooRpcError(`Unsupported Odoo version. Found ${versionString}, expected Odoo ${ODOO_VERSION}. This guide only supports Odoo 19.`, 'UNSUPPORTED_VERSION');
  }

  // Detect deployment type from URL
  const url = (payload.credentials?.url || "").toLowerCase();
  let detectedDeployment = project?.projectIdentity?.deployment || "";
  let detectedEdition = version.edition || project?.projectIdentity?.edition || "";
  
  // Auto-detect deployment type from URL patterns
  if (url.includes('.odoo.com') || url.includes('odoo.online')) {
    detectedDeployment = 'Odoo Online';
  } else if (url.includes('.odoo.sh') || url.includes('odoo.sh')) {
    detectedDeployment = 'Odoo.sh';
  } else if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('192.168.') || url.includes('10.')) {
    detectedDeployment = 'On-Premise';
  } else {
    detectedDeployment = detectedDeployment || 'On-Premise';
  }

  // Store connection in registry
  const projectId = project?.projectIdentity?.projectId;
  connectionRegistry.set(projectId, {
    baseUrl: client.baseUrl,
    database: client.database,
    sessionId: client.sessionId,
    uid: client.uid,
    timestamp: Date.now()
  });

  return normalizeConnectionState(
    {
      ...createInitialConnectionState(),
      status: "connected_execute",
      capabilityLevel: "execute",
      connectedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      availableFeatures: {
        inspect: true,
        preview: true,
        execute: true
      },
      environmentIdentity: {
        urlOrigin: safeOrigin(client.baseUrl),
        database: client.database,
        serverVersion: version.serverVersion,
        serverSerie: version.serverSerie,
        edition: detectedEdition,
        deployment: detectedDeployment,
        branchTarget: project?.environmentContext?.target?.targetBranch || "",
        environmentTarget: project?.environmentContext?.target?.targetEnvironment || ""
      },
      // Include detected info for comparison with user selection
      detectedInfo: {
        edition: detectedEdition,
        deployment: detectedDeployment,
        version: version.serverVersion,
        matchesUserSelection: 
          detectedEdition === project?.projectIdentity?.edition &&
          detectedDeployment === project?.projectIdentity?.deployment
      }
    },
    project?.projectIdentity
  );
}

export function disconnectProject(project) {
  connectionRegistry.delete(project?.projectIdentity?.projectId);
  return normalizeConnectionState(createInitialConnectionState(), project?.projectIdentity);
}

export async function inspectDomain(project, domainId, fetchImpl = fetch) {
  const client = getConnectedClient(project, fetchImpl);
  const support = getDomainSupport(domainId);
  const moduleStatus = await detectInstalledModules(client, support.moduleNames);
  const inspection = createInspectionRecord(domainId, {
    status: "complete",
    inspectedAt: new Date().toISOString(),
    lastPreviewableAt: support.previewSupport ? new Date().toISOString() : "",
    lastExecutableAt: support.executeSupport ? new Date().toISOString() : "",
    moduleStatus,
    summary: support.summary,
    recordCounts: {},
    modelStatus: {},
    blockedReasons: [],
    deploymentNotes: []
  });

  switch (domainId) {
    case "foundation-company-localization":
      inspection.records = {
        companies: await client.searchRead("res.company", [], ["id", "name"], { limit: 5 })
      };
      inspection.recordCounts.companies = inspection.records.companies.length;
      break;
    case "master-data":
      inspection.records = {
        partnerCategories: [],
        productCategories: [],
        uomCategories: []
      };
      inspection.modelStatus["res.partner"] = await getModelReadStatus(client, "res.partner");
      inspection.modelStatus["product.template"] = await getModelReadStatus(client, "product.template");

      try {
        inspection.records.partnerCategories = await client.searchRead("res.partner.category", [], ["id", "name"], { limit: 200 });
        inspection.recordCounts.partnerCategories = inspection.records.partnerCategories.length;
        inspection.modelStatus["res.partner.category"] = "readable";
      } catch {
        inspection.modelStatus["res.partner.category"] = "unavailable";
      }

      try {
        inspection.records.productCategories = await client.searchRead(
          "product.category",
          [],
          ["id", "name", "parent_id", "complete_name"],
          { limit: 300 }
        );
        inspection.recordCounts.productCategories = inspection.records.productCategories.length;
        inspection.modelStatus["product.category"] = "readable";
      } catch {
        inspection.modelStatus["product.category"] = "unavailable";
      }

      try {
        inspection.records.uomCategories = await client.searchRead("uom.category", [], ["id", "name"], { limit: 100 });
        inspection.recordCounts.uomCategories = inspection.records.uomCategories.length;
        inspection.modelStatus["uom.category"] = "readable";
      } catch {
        inspection.modelStatus["uom.category"] = "unavailable";
      }

      inspection.records.productCategories = inspection.records.productCategories.map((record) => ({
        ...record,
        parentId: Array.isArray(record.parent_id) ? record.parent_id[0] : record.parent_id || 0,
        parentName: Array.isArray(record.parent_id) ? record.parent_id[1] : ""
      }));

      inspection.recordCounts.partnerRecords =
        inspection.modelStatus["res.partner"] === "readable" ? await client.searchCount("res.partner", []) : 0;
      inspection.recordCounts.productTemplateRecords =
        inspection.modelStatus["product.template"] === "readable" ? await client.searchCount("product.template", []) : 0;

      addDuplicateNameSignal(inspection, "partnerCategories", "Partner classification");
      addDuplicateNameSignal(inspection, "productCategories", "Product category");
      addDuplicateNameSignal(inspection, "uomCategories", "Unit category");
      break;
    case "inventory":
      inspection.records = {
        warehouses: await client.searchRead("stock.warehouse", [], ["id", "name", "code"], { limit: 50 }),
        operationTypes: await client.searchRead("stock.picking.type", [], ["id", "name", "code", "warehouse_id"], { limit: 100 })
      };
      inspection.recordCounts.warehouses = inspection.records.warehouses.length;
      inspection.records.operationTypes = inspection.records.operationTypes.map((record) => ({
        ...record,
        warehouseId: Array.isArray(record.warehouse_id) ? record.warehouse_id[0] : record.warehouse_id || 0
      }));
      inspection.recordCounts.operationTypes = inspection.records.operationTypes.length;
      break;
    case "crm":
      inspection.records = {
        stages: await client.searchRead("crm.stage", [], ["id", "name"], { limit: 80 }),
        teams: await client.searchRead("crm.team", [], ["id", "name"], { limit: 50 })
      };
      inspection.recordCounts.stages = inspection.records.stages.length;
      inspection.recordCounts.teams = inspection.records.teams.length;
      break;
    default:
      for (const model of support.inspectModels) {
        try {
          inspection.recordCounts[model] = await client.searchCount(model, []);
          inspection.modelStatus[model] = "readable";
        } catch {
          inspection.modelStatus[model] = "unavailable";
        }
      }
      break;
  }

  return inspection;
}

export async function previewDomain(project, domainId, fetchImpl = fetch) {
  const inspection = await inspectDomain(project, domainId, fetchImpl);
  const { previews, auditEntries } = generateDomainPreview(project, domainId, inspection);
  return { inspection, previews, auditEntries };
}

export async function executePreview(project, preview, options = {}, fetchImpl = fetch) {
  if (!preview?.executable || preview?.safetyClass !== "safe") {
    const { execution, auditEntry } = createExecutionOutcome(preview, {
      actor: "ui-user",
      status: "failed",
      resultSummary: "Execution refused.",
      failureReason: preview?.blockedReason || "Preview is not executable.",
      completedAt: new Date().toISOString()
    });
    return { execution, auditEntry };
  }

  if (!options.confirmed) {
    const { execution, auditEntry } = createExecutionOutcome(preview, {
      actor: "ui-user",
      status: "failed",
      resultSummary: "Execution refused.",
      failureReason: "Explicit operator confirmation is required.",
      completedAt: new Date().toISOString()
    });
    return { execution, auditEntry };
  }

  const client = getConnectedClient(project, fetchImpl);
  const inspection = await inspectDomain(project, preview.domainId, fetchImpl);
  const latestPreview = findMatchingExecutablePreview(generateDomainPreview(project, preview.domainId, inspection).previews, preview);

  if (!latestPreview) {
    const { execution, auditEntry } = createExecutionOutcome(preview, {
      actor: "ui-user",
      status: "failed",
      resultSummary: "Execution refused.",
      failureReason: "Preview is stale, blocked, or no longer matches live inspection.",
      prerequisiteStatus: "failed",
      completedAt: new Date().toISOString()
    });
    return { execution, auditEntry };
  }

  if (latestPreview.domainId === "foundation-company-localization" && latestPreview.targetModel === "res.company") {
    await client.write("res.company", [Number(latestPreview.targetIdentifier)], {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || ""
    });
  } else if (latestPreview.domainId === "inventory" && latestPreview.targetModel === "stock.warehouse") {
    await client.create("stock.warehouse", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || "",
      code: latestPreview.intendedChanges.find((item) => item.field === "code")?.to || ""
    });
  } else if (latestPreview.domainId === "inventory" && latestPreview.targetModel === "stock.picking.type") {
    await client.create("stock.picking.type", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier,
      code: latestPreview.intendedChanges.find((item) => item.field === "code")?.to || "",
      warehouse_id: Number(latestPreview.intendedChanges.find((item) => item.field === "warehouse_id")?.to || 0)
    });
  } else if (latestPreview.domainId === "crm" && latestPreview.targetModel === "crm.stage") {
    await client.create("crm.stage", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else if (latestPreview.domainId === "crm" && latestPreview.targetModel === "crm.team") {
    await client.create("crm.team", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier,
      alias_name: latestPreview.intendedChanges.find((item) => item.field === "alias_name")?.to || ""
    });
  } else if (latestPreview.domainId === "master-data" && latestPreview.targetModel === "res.partner.category") {
    await client.create("res.partner.category", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else if (latestPreview.domainId === "master-data" && latestPreview.targetModel === "product.category") {
    const payload = {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    };
    const parentId = Number(latestPreview.intendedChanges.find((item) => item.field === "parent_id")?.to || 0);
    if (parentId > 0) {
      payload.parent_id = parentId;
    }
    await client.create("product.category", payload);
  } else if (latestPreview.domainId === "master-data" && latestPreview.targetModel === "uom.category") {
    await client.create("uom.category", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else if (latestPreview.domainId === "sales" && latestPreview.targetModel === "crm.team") {
    await client.create("crm.team", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else if (latestPreview.domainId === "sales" && latestPreview.targetModel === "product.pricelist") {
    await client.create("product.pricelist", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else if (latestPreview.domainId === "purchase" && latestPreview.targetModel === "res.partner.category") {
    await client.create("res.partner.category", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else if (latestPreview.domainId === "manufacturing-mrp" && latestPreview.targetModel === "mrp.workcenter") {
    await client.create("mrp.workcenter", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else if (latestPreview.domainId === "website-ecommerce" && latestPreview.targetModel === "delivery.carrier") {
    await client.create("delivery.carrier", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else if (latestPreview.domainId === "pos" && latestPreview.targetModel === "pos.payment.method") {
    await client.create("pos.payment.method", {
      name: latestPreview.intendedChanges.find((item) => item.field === "name")?.to || latestPreview.targetIdentifier
    });
  } else {
    throw new OdooRpcError("Preview execution is not supported for this action.");
  }

  return createExecutionOutcome(latestPreview, {
    actor: "ui-user",
    status: "succeeded",
    resultSummary: `${latestPreview.title} applied.`,
    prerequisiteStatus: "validated",
    completedAt: new Date().toISOString()
  });
}

export function buildConnectionAuditEntry(project, action, summary, reason = "") {
  return createAuditEntry({
    kind: "connection",
    actor: "ui-user",
    domainId: "foundation-company-localization",
    operation: action,
    safetyClass: "conditional",
    status: reason ? "failed" : "recorded",
    reason,
    summary
  });
}

function getConnectedClient(project, fetchImpl) {
  const projectId = project?.projectIdentity?.projectId;
  const stored = connectionRegistry.get(projectId);

  if (!stored) {
    throw new OdooRpcError("No live Odoo connection is active for this project.");
  }

  return new OdooClient({
    baseUrl: stored.baseUrl,
    database: stored.database,
    sessionId: stored.sessionId,
    uid: stored.uid,
    fetchImpl
  });
}

function safeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return value || "";
  }
}

function findMatchingExecutablePreview(previews, preview) {
  return (previews || []).find(
    (candidate) =>
      candidate.executable &&
      candidate.safetyClass === "safe" &&
      candidate.domainId === preview?.domainId &&
      candidate.targetModel === preview?.targetModel &&
      candidate.targetIdentifier === preview?.targetIdentifier &&
      candidate.operation === preview?.operation &&
      JSON.stringify(candidate.intendedChanges || []) === JSON.stringify(preview?.intendedChanges || [])
  );
}

async function getModelReadStatus(client, model) {
  try {
    await client.searchCount(model, []);
    return "readable";
  } catch {
    return "unavailable";
  }
}

function addDuplicateNameSignal(inspection, recordKey, label) {
  const records = Array.isArray(inspection.records?.[recordKey]) ? inspection.records[recordKey] : [];
  const countByName = new Map();

  for (const record of records) {
    const normalizedName = String(record.name || "").trim().toLowerCase();
    if (!normalizedName) {
      continue;
    }
    countByName.set(normalizedName, (countByName.get(normalizedName) || 0) + 1);
  }

  const duplicateCount = [...countByName.values()].filter((count) => count > 1).length;
  inspection.recordCounts[`${recordKey}DuplicateNames`] = duplicateCount;

  if (duplicateCount > 0) {
    inspection.blockedReasons.push(`${label} duplicate names detected in live inspection.`);
  }
}

function cleanupStaleConnections() {
  const now = Date.now();
  for (const [projectId, entry] of connectionRegistry.entries()) {
    if (now - (entry.timestamp || 0) > CONNECTION_TTL_MS) {
      connectionRegistry.delete(projectId);
    }
  }
}

const _cleanupTimer = setInterval(cleanupStaleConnections, CLEANUP_INTERVAL_MS);
_cleanupTimer.unref();
export { _cleanupTimer };
