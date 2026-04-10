import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
import supabase from "./supabase-client.js";

const __filename_engine = fileURLToPath(import.meta.url);
const __dirname_engine = path.dirname(__filename_engine);
const connectionRegistryPath = path.resolve(__dirname_engine, "data", "connections.json");

const connectionRegistry = new Map();

// ── Connection registry persistence ─────────────────────────────
async function loadConnectionRegistry() {
  try {
    // Load from Supabase if available
    if (supabase) {
      const { data, error } = await supabase
        .from("odoo_connections")
        .select("project_id, base_url, database, updated_at");
      if (!error && data) {
        const now = Date.now();
        for (const row of data) {
          if (!row?.project_id) continue;
          const timestamp = new Date(row.updated_at).getTime();
          if (now - timestamp <= CONNECTION_TTL_MS) {
            connectionRegistry.set(row.project_id, {
              baseUrl: row.base_url,
              database: row.database,
              timestamp,
              sessionId: "",
              uid: 0
            });
          }
        }
        return;
      }
    }
    // Fallback to local file if Supabase unavailable
    const raw = await readFile(connectionRegistryPath, "utf8");
    const data = JSON.parse(raw);
    const now = Date.now();
    for (const [key, value] of Object.entries(data.connections || {})) {
      if (now - (value.timestamp || 0) <= CONNECTION_TTL_MS) {
        connectionRegistry.set(key, value);
      }
    }
  } catch {
    // Start fresh on any error
  }
}

async function saveConnectionRegistry() {
  try {
    if (supabase) {
      // Upsert each connection to Supabase
      for (const [projectId, value] of connectionRegistry.entries()) {
        await supabase
          .from("odoo_connections")
          .upsert(
            {
              project_id: projectId,
              base_url: value.baseUrl,
              database: value.database,
              updated_at: new Date().toISOString()
            },
            { onConflict: "project_id" }
          );
      }
      return;
    }
    // Fallback to local file
    const safeConnections = {};
    for (const [key, value] of connectionRegistry.entries()) {
      safeConnections[key] = {
        baseUrl: value.baseUrl,
        database: value.database,
        timestamp: value.timestamp
      };
    }
    await writeFile(
      connectionRegistryPath,
      JSON.stringify(
        {
          connections: safeConnections,
          savedAt: new Date().toISOString()
        },
        null,
        2
      )
    );
  } catch {
    // Best-effort — don't crash
  }
}

const CONNECTION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Load persisted connections on module init
await loadConnectionRegistry();
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
    baseUrl: payload.url,
    database: payload.database,
    fetchImpl
  });

  try {
    // Attempt authentication with timeout
    await withTimeout(
      client.authenticate(payload.username, payload.password),
      CONNECT_TIMEOUT_MS,
      'Connection timed out. The Odoo server did not respond within 15 seconds.'
    );
  } catch (authError) {
    // Log full error details for debugging
    console.error('[CONNECTION ERROR]', authError.message, authError.code, authError.cause);
    
    // Categorize authentication errors
    console.error('Connection error details:', authError.message, authError.cause, authError.code);
    const errorMsg = authError.message.toLowerCase();
    if (errorMsg.includes('database') || errorMsg.includes('db')) {
      throw new OdooRpcError(`Database not found: "${payload.database}". Please verify the database name exists on this Odoo server.`, 'DATABASE_NOT_FOUND');
    }
    if (errorMsg.includes('credential') || errorMsg.includes('login') || errorMsg.includes('password') || errorMsg.includes('authentication')) {
      throw new OdooRpcError(`Authentication failed. Please check your username and password.`, 'AUTHENTICATION_FAILED');
    }
    throw new OdooRpcError(`Unable to connect to Odoo server at ${payload.url}. Original error: ${authError.message}`, 'CONNECTION_FAILED');
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
  const url = payload.url.toLowerCase();
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

  // Store connection in registry and persist to disk
  const projectId = project?.projectIdentity?.projectId;
  connectionRegistry.set(projectId, {
    baseUrl: client.baseUrl,
    database: client.database,
    sessionId: client.sessionId,
    uid: client.uid,
    timestamp: Date.now()
  });
  await saveConnectionRegistry();

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

export async function disconnectProject(project) {
  const projectId = project?.projectIdentity?.projectId;
  connectionRegistry.delete(projectId);
  if (supabase && projectId) {
    await supabase
      .from("odoo_connections")
      .delete()
      .eq("project_id", projectId);
  }
  await saveConnectionRegistry();
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
    case "users-roles-security":
      inspection.records = { users: [], groups: [] };
      inspection.modelStatus["res.users"] = await getModelReadStatus(client, "res.users");
      inspection.modelStatus["res.groups"] = await getModelReadStatus(client, "res.groups");
      if (inspection.modelStatus["res.users"] === "readable") {
        inspection.recordCounts.users = await client.searchCount("res.users", []);
      }
      if (inspection.modelStatus["res.groups"] === "readable") {
        try {
          inspection.records.groups = await client.searchRead("res.groups", [], ["id", "name", "category_id"], { limit: 200 });
          inspection.recordCounts.groups = inspection.records.groups.length;
        } catch { inspection.recordCounts.groups = 0; }
      }
      break;
    case "hr":
      inspection.records = { departments: [], jobs: [], employees: [] };
      inspection.modelStatus["hr.department"] = await getModelReadStatus(client, "hr.department");
      inspection.modelStatus["hr.job"] = await getModelReadStatus(client, "hr.job");
      inspection.modelStatus["hr.employee"] = await getModelReadStatus(client, "hr.employee");
      if (inspection.modelStatus["hr.department"] === "readable") {
        try {
          inspection.records.departments = await client.searchRead("hr.department", [], ["id", "name", "manager_id", "parent_id"], { limit: 200 });
          inspection.recordCounts.departments = inspection.records.departments.length;
        } catch { inspection.recordCounts.departments = 0; }
      }
      if (inspection.modelStatus["hr.job"] === "readable") {
        try {
          inspection.records.jobs = await client.searchRead("hr.job", [], ["id", "name", "department_id"], { limit: 200 });
          inspection.recordCounts.jobs = inspection.records.jobs.length;
        } catch { inspection.recordCounts.jobs = 0; }
      }
      if (inspection.modelStatus["hr.employee"] === "readable") {
        inspection.recordCounts.employees = await client.searchCount("hr.employee", []);
      }
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

/**
 * Validate that a stored connection's session is still alive.
 * Returns { valid: true } or { valid: false, reason: "..." }.
 * If invalid, removes the stale entry from the registry.
 */
export async function validateConnection(projectOrProjectId, fetchImpl = fetch) {
  const projectId =
    typeof projectOrProjectId === "string"
      ? projectOrProjectId.trim()
      : typeof projectOrProjectId?.projectIdentity?.projectId === "string"
        ? projectOrProjectId.projectIdentity.projectId.trim()
        : "";

  if (!projectId) {
    return { valid: false, reason: "project_id is required." };
  }

  const stored = connectionRegistry.get(projectId);

  if (!stored) {
    return { valid: false, reason: "No stored connection for this project." };
  }

  // Check TTL
  if (Date.now() - (stored.timestamp || 0) > CONNECTION_TTL_MS) {
    connectionRegistry.delete(projectId);
    await saveConnectionRegistry();
    return { valid: false, reason: "Connection expired (TTL exceeded)." };
  }

  // Probe the session with a lightweight read
  const client = new OdooClient({
    baseUrl: stored.baseUrl,
    database: stored.database,
    sessionId: stored.sessionId,
    uid: stored.uid,
    fetchImpl
  });

  try {
    await client.searchCount("res.company", []);
    // Refresh timestamp on successful validation
    stored.timestamp = Date.now();
    await saveConnectionRegistry();
    return { valid: true };
  } catch {
    // Session is dead — clean up
    connectionRegistry.delete(projectId);
    await saveConnectionRegistry();
    return { valid: false, reason: "Odoo session expired or server unreachable. Please reconnect." };
  }
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

/**
 * Returns an OdooClient for the given projectId from the connection registry.
 * Used by governed-odoo-apply-service for pipeline-path writes.
 * Throws OdooRpcError if no connection is registered for the projectId.
 *
 * @param {string} projectId
 * @param {Function} [fetchImpl]
 * @returns {OdooClient}
 */
export function getClientForProject(projectId, fetchImpl = fetch) {
  const stored = connectionRegistry.get(projectId.trim());
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

/**
 * Registers a pipeline-path Odoo connection under a given pipeline project_id.
 * Reuses the same OdooClient auth + connectionRegistry pattern as connectProject.
 * Does not update legacy project state — only registers in connectionRegistry.
 * The registered key matches connection_context.project_id sent by the pipeline apply path.
 *
 * @param {string} projectId    — pipeline project_id (matches connection_context.project_id)
 * @param {object} credentials  — { url, database, username, password }
 * @param {Function} [fetchImpl]
 * @returns {Promise<{ ok: true, registered_at: string }>}
 * @throws OdooRpcError on auth, version, or validation failure
 */
export async function registerPipelineConnection(projectId, credentials, fetchImpl = fetch) {
  if (typeof projectId !== 'string' || !projectId.trim()) {
    throw new OdooRpcError('project_id must be a non-empty string.', 'INVALID_INPUT');
  }

  const client = new OdooClient({
    baseUrl: credentials.url,
    database: credentials.database,
    fetchImpl
  });

  try {
    await withTimeout(
      client.authenticate(credentials.username, credentials.password),
      CONNECT_TIMEOUT_MS,
      'Connection timed out. The Odoo server did not respond within 15 seconds.'
    );
  } catch (authError) {
    throw new OdooRpcError(
      `Pipeline connection failed: ${authError.message}`,
      authError.code || 'CONNECTION_FAILED'
    );
  }

  let version;
  try {
    version = await detectVersion(client);
  } catch {
    throw new OdooRpcError('Unable to retrieve Odoo version information.', 'VERSION_DETECTION_FAILED');
  }

  const versionString = String(version.serverSerie || '');
  const majorVersionMatch = versionString.match(/(\d+)/);
  const majorVersion = majorVersionMatch ? majorVersionMatch[1] : '';
  if (majorVersion !== ODOO_VERSION) {
    throw new OdooRpcError(
      `Unsupported Odoo version. Found ${versionString}, expected Odoo ${ODOO_VERSION}. This guide only supports Odoo 19.`,
      'UNSUPPORTED_VERSION'
    );
  }

  connectionRegistry.set(projectId.trim(), {
    baseUrl: client.baseUrl,
    database: client.database,
    sessionId: client.sessionId,
    uid: client.uid,
    timestamp: Date.now()
  });
  await saveConnectionRegistry();

  return { ok: true, registered_at: new Date().toISOString() };
}

/**
 * FOR TESTS ONLY. Seeds a connection registry entry without network auth.
 * Call _forTestOnly_clearConnection to clean up after each test.
 * Do not call from production code.
 *
 * @param {string} projectId
 * @param {{ baseUrl: string, database: string, sessionId: string, uid: number }} entry
 */
export function _forTestOnly_seedConnection(projectId, entry) {
  connectionRegistry.set(projectId.trim(), { ...entry, timestamp: Date.now() });
}

/**
 * FOR TESTS ONLY. Removes a seeded connection registry entry.
 *
 * @param {string} projectId
 */
export function _forTestOnly_clearConnection(projectId) {
  connectionRegistry.delete(projectId.trim());
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

// ── Bulk record creation for grid import ─────────────────────────
function getAnyConnectedClient(fetchImpl) {
  if (connectionRegistry.size === 0) {
    throw new OdooRpcError("No live Odoo connection is active. Connect to Odoo before importing data.");
  }
  let latest = null;
  for (const entry of connectionRegistry.values()) {
    if (!latest || (entry.timestamp || 0) > (latest.timestamp || 0)) {
      latest = entry;
    }
  }
  return new OdooClient({
    baseUrl: latest.baseUrl,
    database: latest.database,
    sessionId: latest.sessionId,
    uid: latest.uid,
    fetchImpl
  });
}

export async function createRecord(project, model, values, fetchImpl = fetch) {
  const client = project ? getConnectedClient(project, fetchImpl) : getAnyConnectedClient(fetchImpl);
  return await client.create(model, values);
}

function cleanupStaleConnections() {
  const now = Date.now();
  let changed = false;
  for (const [projectId, entry] of connectionRegistry.entries()) {
    if (now - (entry.timestamp || 0) > CONNECTION_TTL_MS) {
      connectionRegistry.delete(projectId);
      changed = true;
    }
  }
  if (changed) saveConnectionRegistry();
}

const _cleanupTimer = setInterval(cleanupStaleConnections, CLEANUP_INTERVAL_MS);
_cleanupTimer.unref();
export { _cleanupTimer };
