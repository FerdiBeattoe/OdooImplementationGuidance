#!/usr/bin/env node

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Catch unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

import { normalizeProjectStorePayload } from "../shared/project-store.js";
import { normalizeProjectState } from "../shared/project-state.js";
import { normalizeAuditLog } from "../shared/audit-log.js";
import { normalizePreviewState } from "../shared/preview-engine.js";
import { normalizeInspectionState } from "../shared/inspection-model.js";
import {
  buildConnectionAuditEntry,
  connectProject,
  disconnectProject,
  inspectDomain,
  previewDomain,
  validateConnection,
  registerPipelineConnection,
} from "./engine.js";
import { OdooClient, OdooRpcError } from "./odoo-client.js";
import { runPipelineService } from "./pipeline-service.js";
import { assembleFoundationOperationDefinitions } from "../shared/foundation-operation-definitions.js";
import { assembleUsersRolesOperationDefinitions } from "../shared/users-roles-operation-definitions.js";
import { assembleAccountingOperationDefinitions } from "../shared/accounting-operation-definitions.js";
import { assembleMasterDataOperationDefinitions } from "../shared/master-data-operation-definitions.js";
import { assembleCrmOperationDefinitions } from "../shared/crm-operation-definitions.js";
import { assembleSalesOperationDefinitions } from "../shared/sales-operation-definitions.js";
import { assemblePurchaseOperationDefinitions } from "../shared/purchase-operation-definitions.js";
import { assembleInventoryOperationDefinitions } from "../shared/inventory-operation-definitions.js";
import { assembleManufacturingOperationDefinitions } from "../shared/manufacturing-operation-definitions.js";
import { assemblePlmOperationDefinitions } from "../shared/plm-operation-definitions.js";
import { assemblePosOperationDefinitions } from "../shared/pos-operation-definitions.js";
import { assembleWebsiteEcommerceOperationDefinitions } from "../shared/website-ecommerce-operation-definitions.js";
import { assembleProjectsOperationDefinitions } from "../shared/projects-operation-definitions.js";
import { assembleHrOperationDefinitions } from "../shared/hr-operation-definitions.js";
import { assembleQualityOperationDefinitions } from "../shared/quality-operation-definitions.js";
import { assembleMaintenanceOperationDefinitions } from "../shared/maintenance-operation-definitions.js";
import { assembleRepairsOperationDefinitions } from "../shared/repairs-operation-definitions.js";
import { assembleDocumentsOperationDefinitions } from "../shared/documents-operation-definitions.js";
import { assembleSignOperationDefinitions } from "../shared/sign-operation-definitions.js";
import { assembleApprovalsOperationDefinitions } from "../shared/approvals-operation-definitions.js";
import { assembleSubscriptionsOperationDefinitions } from "../shared/subscriptions-operation-definitions.js";
import { assembleRentalOperationDefinitions } from "../shared/rental-operation-definitions.js";
import { assembleFieldServiceOperationDefinitions } from "../shared/field-service-operation-definitions.js";
import { applyGoverned } from "./governed-odoo-apply-service.js";
import * as authService from "./auth-service.js";
import writeAudit from "./audit-service.js";
import { validateInviteCode, consumeInviteCode } from "./invite-service.js";
import supabase from "./supabase-client.js";
import {
  loadRuntimeState,
  resumeRuntimeState,
  saveRuntimeState,
} from "./runtime-state-persistence-service.js";
import {
  FOUNDATION_DOMAINS,
  getDomainIdFromCheckpointId,
  getLicenceConfig,
  getLicenceStatus,
  getPrice,
  getRemainingEarlyAdopterSlots,
  isDomainUnlocked,
  isEarlyAdopter,
} from "./licence-service.js";
import {
  createPaymentIntent,
  handleWebhook as handleStripeWebhook,
} from "./stripe-service.js";
import {
  getIndustryDomainHints,
  computeActivatedDomains,
} from "../shared/domain-activation-engine.js";
import { getIndustryTemplate } from "../shared/industry-templates.js";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB limit
const requestLog = new Map();
const REQUEST_LOG_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const ODOO_SCAN_TIMEOUT_MS = 15000;
const ODOO_INSTALL_TIMEOUT_MS = 30000;
const ODOO_SCAN_COUNT_MODELS = [
  "res.users",
  "res.partner",
  "account.account",
  "product.template",
  "sale.order",
  "purchase.order",
  "stock.picking",
];
const MODULE_NAME_PATTERN = /^[A-Za-z0-9_]+$/;
const TEAM_ROLES = new Set(["project_lead", "implementor", "reviewer", "stakeholder"]);
const TEAM_INVITE_ROLES = new Set(["implementor", "reviewer", "stakeholder"]);
const AUDIT_ACTIONS = new Set([
  "checkpoint_confirmed",
  "checkpoint_executed",
  "pipeline_run",
  "member_invited",
  "member_removed",
  "member_role_changed",
  "commit_approved",
  "commit_cancelled",
  "report_generated",
  "module_installed",
]);
const localTeamMembers = new Map();

function checkRateLimit(clientId, maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  
  // Clean old entries
  for (const [key, timestamp] of requestLog) {
    if (timestamp < windowStart) {
      requestLog.delete(key);
    }
  }
  
  // Count requests in current window
  const clientRequests = Array.from(requestLog.entries())
    .filter(([key, timestamp]) => key.startsWith(`${clientId}:`) && timestamp >= windowStart)
    .length;
  
  if (clientRequests >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 1000) };
  }
  
  // Log this request
  requestLog.set(`${clientId}:${now}`, now);
  return { allowed: true };
}

async function jwtMiddleware(req, res) {
  // Skip auth enforcement when Supabase is not configured (dev / test mode)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { id: 'dev', email: 'dev@local' };
  }
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    sendJson(res, 401, { error: 'Missing or invalid Authorization header' });
    return null;
  }
  const { user, error } = await authService.verifyToken(token);
  if (error || !user) {
    sendJson(res, 401, { error: 'Invalid or expired token' });
    return null;
  }
  return user;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const frontendRoot = path.resolve(repoRoot, "app", "frontend");
const pdfMakeRoot = path.resolve(repoRoot, "node_modules", "pdfmake", "build");
const sharedRoot = path.resolve(repoRoot, "app", "shared");
const dataRoot = path.resolve(repoRoot, "app", "backend", "data");
const projectStorePath = path.resolve(dataRoot, "projects.json");
const port = Number(process.env.PORT || 4174);
const host = process.env.HOST || "0.0.0.0";
const CORS_ORIGIN = process.env.NODE_ENV === "production"
  ? (process.env.SITE_URL || "https://project-odoo.onrender.com")
  : "*";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

await ensureDataStore();

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const server = createAppServer();
  server.listen(port, host, () => {
    console.log(`Project Odoo running at http://${host}:${port}`);
  });
}

function normalizeTeamEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeTeamRole(role) {
  return typeof role === "string" ? role.trim() : "";
}

function buildTeamMemberResponse(member) {
  return {
    id: member.id,
    account_id: member.account_id ?? null,
    email: member.email,
    full_name: member.full_name,
    role: member.role,
    accepted_at: member.accepted_at ?? null,
    created_at: member.created_at,
  };
}

function normalizeTeamMemberRecord(record) {
  const projectId = typeof record?.project_id === "string" ? record.project_id.trim() : "";
  const email = normalizeTeamEmail(record?.email);
  const fullName = typeof record?.full_name === "string" ? record.full_name.trim() : "";
  const role = normalizeTeamRole(record?.role);

  if (!projectId || !email || !fullName || !TEAM_ROLES.has(role)) {
    return null;
  }

  return {
    id: typeof record?.id === "string" && record.id.trim() ? record.id.trim() : randomUUID(),
    account_id: typeof record?.account_id === "string" && record.account_id.trim() ? record.account_id.trim() : null,
    project_id: projectId,
    email,
    full_name: fullName,
    role,
    invited_by: typeof record?.invited_by === "string" && record.invited_by.trim() ? record.invited_by.trim() : null,
    accepted_at: typeof record?.accepted_at === "string" && record.accepted_at.trim() ? record.accepted_at.trim() : null,
    created_at: typeof record?.created_at === "string" && record.created_at.trim() ? record.created_at.trim() : new Date().toISOString(),
  };
}

function sortTeamMembersAscending(a, b) {
  const aTime = Date.parse(a?.created_at || "");
  const bTime = Date.parse(b?.created_at || "");

  if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
  if (Number.isNaN(aTime)) return 1;
  if (Number.isNaN(bTime)) return -1;
  return aTime - bTime;
}

function getLocalTeamMembers(projectId = null) {
  const members = Array.from(localTeamMembers.values())
    .filter((member) => projectId ? member.project_id === projectId : true)
    .sort(sortTeamMembersAscending);

  return members.map((member) => ({ ...member }));
}

export function resetLocalTeamMembersForTests() {
  localTeamMembers.clear();
}

export function setLocalTeamMembersForTests(records = []) {
  localTeamMembers.clear();

  for (const record of records) {
    const normalized = normalizeTeamMemberRecord(record);
    if (normalized) {
      localTeamMembers.set(normalized.id, normalized);
    }
  }
}

export function listLocalTeamMembersForTests() {
  return getLocalTeamMembers();
}

function isNoRowsError(error) {
  return Boolean(
    error &&
    (
      error.code === "PGRST116" ||
      String(error.message || "").toLowerCase().includes("0 rows")
    )
  );
}

async function listProjectTeamMembers(supabaseClient, projectId) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("team_members")
      .select("id, account_id, email, full_name, role, accepted_at, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message || "Failed to load team members.");
    }

    return (data || []).map(buildTeamMemberResponse);
  }

  return getLocalTeamMembers(projectId).map(buildTeamMemberResponse);
}

async function getProjectMemberForUser(supabaseClient, userId, projectId) {
  if (!userId || !projectId) {
    return null;
  }

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("team_members")
      .select("id, account_id, email, full_name, role, accepted_at, created_at")
      .eq("account_id", userId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (error && !isNoRowsError(error)) {
      throw new Error(error.message || "Failed to load project membership.");
    }

    return data ? buildTeamMemberResponse(data) : null;
  }

  const member = getLocalTeamMembers(projectId).find((entry) => entry.account_id === userId);
  return member ? buildTeamMemberResponse(member) : null;
}

async function getProjectMemberById(supabaseClient, projectId, memberId) {
  if (!projectId || !memberId) {
    return null;
  }

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("team_members")
      .select("id, account_id, email, full_name, role, accepted_at, created_at")
      .eq("project_id", projectId)
      .eq("id", memberId)
      .maybeSingle();

    if (error && !isNoRowsError(error)) {
      throw new Error(error.message || "Failed to load team member.");
    }

    return data ? buildTeamMemberResponse(data) : null;
  }

  const member = getLocalTeamMembers(projectId).find((entry) => entry.id === memberId);
  return member ? buildTeamMemberResponse(member) : null;
}

async function getProjectMemberByEmail(supabaseClient, projectId, email) {
  const normalizedEmail = normalizeTeamEmail(email);
  if (!projectId || !normalizedEmail) {
    return null;
  }

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("team_members")
      .select("id, account_id, email, full_name, role, accepted_at, created_at")
      .eq("project_id", projectId)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error && !isNoRowsError(error)) {
      throw new Error(error.message || "Failed to load team member.");
    }

    return data ? buildTeamMemberResponse(data) : null;
  }

  const member = getLocalTeamMembers(projectId).find((entry) => entry.email === normalizedEmail);
  return member ? buildTeamMemberResponse(member) : null;
}

async function createProjectTeamMember(supabaseClient, record) {
  const normalized = normalizeTeamMemberRecord(record);
  if (!normalized) {
    throw new Error("Invalid team member record.");
  }

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("team_members")
      .insert(normalized)
      .select("id, account_id, email, full_name, role, accepted_at, created_at")
      .single();

    if (error) {
      throw new Error(error.message || "Failed to create team member.");
    }

    return buildTeamMemberResponse(data);
  }

  const duplicate = getLocalTeamMembers(normalized.project_id).find(
    (entry) => entry.email === normalized.email
  );
  if (duplicate) {
    throw new Error("A team member with that email already exists for this project.");
  }

  localTeamMembers.set(normalized.id, normalized);
  return buildTeamMemberResponse(normalized);
}

async function updateProjectTeamMemberRole(supabaseClient, projectId, memberId, role) {
  const normalizedRole = normalizeTeamRole(role);
  if (!TEAM_ROLES.has(normalizedRole)) {
    throw new Error("Invalid role.");
  }

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("team_members")
      .update({ role: normalizedRole })
      .eq("project_id", projectId)
      .eq("id", memberId)
      .select("id, account_id, email, full_name, role, accepted_at, created_at")
      .single();

    if (error) {
      throw new Error(error.message || "Failed to update team member role.");
    }

    return buildTeamMemberResponse(data);
  }

  const current = localTeamMembers.get(memberId);
  if (!current || current.project_id !== projectId) {
    return null;
  }

  const updated = {
    ...current,
    role: normalizedRole,
  };
  localTeamMembers.set(memberId, updated);
  return buildTeamMemberResponse(updated);
}

async function deleteProjectTeamMember(supabaseClient, projectId, memberId) {
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from("team_members")
      .delete()
      .eq("project_id", projectId)
      .eq("id", memberId);

    if (error) {
      throw new Error(error.message || "Failed to delete team member.");
    }

    return;
  }

  const current = localTeamMembers.get(memberId);
  if (current && current.project_id === projectId) {
    localTeamMembers.delete(memberId);
  }
}

async function countProjectLeads(supabaseClient, projectId) {
  const members = await listProjectTeamMembers(supabaseClient, projectId);
  return members.filter((member) => member.role === "project_lead").length;
}

export async function ensureProjectLeadMembership(supabaseClient, user, projectId) {
  if (!user?.id || !user?.email || !projectId) {
    return null;
  }

  const email = normalizeTeamEmail(user.email);
  const existingMember = await getProjectMemberByEmail(supabaseClient, projectId, email);
  if (existingMember) {
    return existingMember;
  }

  return createProjectTeamMember(supabaseClient, {
    account_id: user.id,
    project_id: projectId,
    email,
    full_name: user.user_metadata?.full_name || user.email,
    role: "project_lead",
    invited_by: user.id,
    accepted_at: new Date().toISOString(),
  });
}

async function assertProjectMember(supabaseClient, userId, projectId, res) {
  const member = await getProjectMemberForUser(supabaseClient, userId, projectId);
  if (!member) {
    sendJson(res, 403, { error: "Insufficient permissions" });
    return false;
  }

  return true;
}

async function assertProjectLead(supabaseClient, userId, projectId, res) {
  const member = await getProjectMemberForUser(supabaseClient, userId, projectId);
  if (!member || member.role !== "project_lead") {
    sendJson(res, 403, { error: "Insufficient permissions" });
    return false;
  }

  return true;
}

export function createAppServer({ rateLimitMaxRequests = RATE_LIMIT_MAX_REQUESTS } = {}) {
  return createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
      const pathname = requestUrl.pathname;

      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        res.writeHead(200, {
          "Access-Control-Allow-Origin": CORS_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
          "Access-Control-Max-Age": "86400"
        });
        res.end();
        return;
      }

      // Rate limiting — only apply to API routes
      if (pathname.startsWith("/api/")) {
        const clientId = req.socket.remoteAddress || 'unknown';
        const rateCheck = checkRateLimit(clientId, rateLimitMaxRequests);

        if (!rateCheck.allowed) {
          res.writeHead(429, {
            "Content-Type": "application/json; charset=utf-8",
            "Retry-After": rateCheck.retryAfter
          });
          res.end(JSON.stringify({ error: "Rate limit exceeded. Please try again later.", retryAfter: rateCheck.retryAfter }));
          return;
        }
      }

      if (pathname === "/api/health" && req.method === "GET") {
        return sendJson(res, 200, { ok: true, service: "implementation-control-platform" });
      }

      if (pathname === "/api/projects" && req.method === "GET") {
        return sendJson(res, 200, await readProjectStore());
      }

      if (pathname === "/api/projects" && req.method === "PUT") {
        const payload = await readJsonBody(req);
        const normalized = await writeProjectStore(payload);
        return sendJson(res, 200, normalized);
      }

      if (pathname === "/api/connection/connect" && req.method === "POST") {
        return await handleConnectionConnect(req, res);
      }

      if (pathname === "/api/connection/disconnect" && req.method === "POST") {
        return await handleConnectionDisconnect(req, res);
      }

      if (pathname === "/api/connection/validate" && req.method === "POST") {
        return await handleConnectionValidate(req, res);
      }

      if (pathname === "/api/domain/inspect" && req.method === "POST") {
        return await handleDomainInspect(req, res);
      }

      if (pathname === "/api/domain/preview" && req.method === "POST") {
        return await handleDomainPreview(req, res);
      }

      if (pathname === "/api/pipeline/run" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handlePipelineRun(req, res);
      }

      if (pathname === "/api/pipeline/apply" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handlePipelineApply(req, res);
      }

      if (pathname === "/api/pipeline/state/load" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handlePipelineStateLoad(req, res);
      }

      if (pathname === "/api/pipeline/state/resume" && req.method === "POST") {
        return await handlePipelineStateResume(req, res);
      }

      if (pathname === "/api/pipeline/state/save" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handlePipelineStateSave(req, res);
      }

      if (pathname === "/api/pipeline/connection/register" && req.method === "POST") {
        return await handlePipelineConnectionRegister(req, res);
      }

      if (pathname === "/api/pipeline/checkpoint/confirm" && req.method === "POST") {
        const _authUser = await jwtMiddleware(req, res);
        if (!_authUser) return;
        return await handleCheckpointConfirm(req, res);
      }

      if (pathname === "/api/pipeline/industry/select" && req.method === "POST") {
        return await handleIndustrySelect(req, res);
      }

      if (pathname === "/api/licence/pricing" && req.method === "GET") {
        return await handleLicencePricing(req, res);
      }

      if (pathname === "/api/licence/early-adopter-status" && req.method === "GET") {
        return await handleEarlyAdopterStatus(req, res);
      }

      if (pathname.startsWith("/api/licence/status/") && req.method === "GET") {
        return await handleLicenceStatus(req, res, pathname);
      }

      if (pathname === "/api/licence/create-payment-intent" && req.method === "POST") {
        return await handleLicenceCreatePaymentIntent(req, res);
      }

      if (pathname === "/api/licence/webhook" && req.method === "POST") {
        return await handleLicenceWebhook(req, res);
      }

      if (pathname.startsWith("/api/licence/check-domain/") && req.method === "GET") {
        return await handleLicenceCheckDomain(req, res, pathname);
      }

      if (pathname === "/api/odoo/detect-databases" && req.method === "POST") {
        return await handleDetectDatabases(req, res);
      }

      if (pathname === "/api/odoo/scan" && req.method === "POST") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleOdooScan(req, res, authUser);
      }

      if (pathname === "/api/odoo/install-module" && req.method === "POST") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleOdooInstallModule(req, res, authUser);
      }

      if (pathname === "/api/auth/signup" && req.method === "POST") {
        return await handleAuthSignup(req, res);
      }

      if (pathname === "/api/auth/signin" && req.method === "POST") {
        return await handleAuthSignin(req, res);
      }

      if (pathname === "/api/auth/reset-password" && req.method === "POST") {
        return await handleAuthResetPassword(req, res);
      }

      if (pathname === "/api/auth/update-password" && req.method === "POST") {
        return await handleAuthUpdatePassword(req, res);
      }

      if (pathname === "/api/auth/verify" && req.method === "POST") {
        return await handleAuthVerify(req, res);
      }

      if (/^\/api\/team\/[^/]+$/.test(pathname) && req.method === "GET") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleTeamList(req, res, pathname, authUser);
      }

      if (pathname === "/api/team/invite" && req.method === "POST") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleTeamInvite(req, res, authUser);
      }

      if (/^\/api\/team\/[^/]+\/[^/]+$/.test(pathname) && req.method === "DELETE") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleTeamDelete(req, res, pathname, authUser);
      }

      if (/^\/api\/team\/[^/]+\/[^/]+$/.test(pathname) && req.method === "PATCH") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleTeamPatch(req, res, pathname, authUser);
      }

      if (/^\/api\/audit\/[^/]+\/export$/.test(pathname) && req.method === "GET") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleAuditExport(req, res, pathname, authUser);
      }

      if (/^\/api\/audit\/[^/]+$/.test(pathname) && req.method === "GET") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleAuditList(req, res, pathname, authUser);
      }

      if (pathname === "/api/audit/write" && req.method === "POST") {
        const authUser = await jwtMiddleware(req, res);
        if (!authUser) return;
        return await handleAuditWrite(req, res, authUser);
      }

      if (pathname === "/data/checkpoint-guidance.json" && req.method === "GET") {
        return serveStatic(res, path.join(dataRoot, "checkpoint-guidance.json"), dataRoot);
      }

      if (pathname.startsWith("/shared/") && req.method === "GET") {
        return serveStatic(res, path.resolve(sharedRoot, `.${pathname.replace("/shared", "")}`), sharedRoot);
      }

      if (pathname.startsWith("/src/styles/") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, `.${pathname}`), frontendRoot);
      }

      if (pathname.startsWith("/styles/") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, `.${pathname}`), frontendRoot);
      }

      if (pathname.startsWith("/node_modules/pdfmake/build/") && req.method === "GET") {
        return serveStatic(
          res,
          path.resolve(pdfMakeRoot, pathname.replace("/node_modules/pdfmake/build/", "")),
          pdfMakeRoot
        );
      }

      if (pathname.startsWith("/src/") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, `.${pathname}`), frontendRoot);
      }

      if (pathname.startsWith("/assets/") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, `./src/assets${pathname.replace("/assets", "")}`), frontendRoot);
      }

      if ((pathname === "/" || pathname === "/index.html") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, "index.html"), frontendRoot);
      }

      if (pathname === "/reset-password" && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, "index.html"), frontendRoot);
      }

      if ((pathname === "/landing" || pathname === "/landing.html") && req.method === "GET") {
        return serveStatic(res, path.resolve(frontendRoot, "landing.html"), frontendRoot);
      }

      return sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      console.error("Unhandled route error:", error);
      return sendJson(res, 500, {
        error: "Internal server error"
      });
    }
  });
}

async function handleConnectionConnect(req, res) {
  console.log('[CONNECT] Starting connection request');
  let payload, project;
  try {
    payload = await readJsonBody(req);
    console.log('[CONNECT] Payload received');
    project = normalizeProjectState(payload.project);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  try {
    console.log('[CONNECT] Calling connectProject...');
    const connectionState = await connectProject(project, payload.credentials);
    console.log('[CONNECT] connectProject succeeded');
    const nextProject = normalizeProjectState({
      ...project,
      connectionState,
      auditLog: normalizeAuditLog([
        ...(project.auditLog || []),
        buildConnectionAuditEntry(project, "connect", "Live Odoo connection established.")
      ])
    });

    return sendJson(res, 200, { project: nextProject });
  } catch (error) {
    console.error('[CONNECT] connectProject failed:', error.message, '| code:', error.code, '| cause:', error.cause);
    const nextProject = normalizeProjectState({
      ...project,
      auditLog: normalizeAuditLog([
        ...(project.auditLog || []),
        buildConnectionAuditEntry(
          project,
          "connect",
          "Live Odoo connection failed.",
          error instanceof Error ? error.message : "Connection failed."
        )
      ])
    });

    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Connection failed.",
      project: nextProject
    });
  }
}

async function handleConnectionDisconnect(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }
  const project = normalizeProjectState(payload.project);
  const connectionState = await disconnectProject(project);
  const nextProject = normalizeProjectState({
    ...project,
    connectionState,
    auditLog: normalizeAuditLog([
      ...(project.auditLog || []),
      buildConnectionAuditEntry(project, "disconnect", "Live Odoo connection removed.")
    ])
  });
  return sendJson(res, 200, { project: nextProject });
}

async function handleConnectionValidate(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }
  const project = normalizeProjectState(payload.project);

  try {
    const result = await validateConnection(project);
    if (result.valid) {
      return sendJson(res, 200, { valid: true, project });
    } else {
      // Connection is stale — return disconnected state
      const nextProject = normalizeProjectState({
        ...project,
        connectionState: {
          ...project.connectionState,
          status: "not_connected",
          capabilityLevel: "manual-only",
          lastError: result.reason,
          lastErrorAt: new Date().toISOString(),
          availableFeatures: { inspect: false, preview: false, execute: false }
        }
      });
      return sendJson(res, 200, { valid: false, reason: result.reason, project: nextProject });
    }
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Validation failed." });
  }
}

async function handleDomainInspect(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }
  const project = normalizeProjectState(payload.project);

  try {
    const inspection = await inspectDomain(project, payload.domainId);
    const nextProject = normalizeProjectState({
      ...project,
      inspectionState: normalizeInspectionState({
        domains: {
          ...(project.inspectionState?.domains || {}),
          [payload.domainId]: inspection
        }
      }),
      auditLog: normalizeAuditLog([
        ...(project.auditLog || []),
        buildConnectionAuditEntry(project, "inspect", `Inspection completed for ${payload.domainId}.`)
      ])
    });

    return sendJson(res, 200, { project: nextProject, inspection });
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Inspection failed." });
  }
}

async function handleDomainPreview(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }
  const project = normalizeProjectState(payload.project);

  try {
    const result = await previewDomain(project, payload.domainId);
    const nextProject = normalizeProjectState({
      ...project,
      inspectionState: normalizeInspectionState({
        domains: {
          ...(project.inspectionState?.domains || {}),
          [payload.domainId]: result.inspection
        }
      }),
      previewState: normalizePreviewState({
        previews: [...(project.previewState?.previews || []), ...result.previews]
      }),
      auditLog: normalizeAuditLog([...(project.auditLog || []), ...result.auditEntries])
    });

    return sendJson(res, 200, {
      project: nextProject,
      previews: result.previews,
      inspection: result.inspection
    });
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Preview failed." });
  }
}

async function handlePipelineRun(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  // Fallback: if discovery_answers is absent from the payload (not present as a key),
  // attempt to load it from persisted runtime state for the project_id.
  // If neither source has discovery_answers, return 400.
  if (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    !Object.prototype.hasOwnProperty.call(payload, "discovery_answers")
  ) {
    const projectId =
      payload.project_id ??
      payload.project_identity?.project_id ??
      null;
    if (projectId) {
      const persistedResult = await loadRuntimeState(projectId);
      if (
        persistedResult.ok &&
        persistedResult.runtime_state &&
        persistedResult.runtime_state.discovery_answers !== undefined
      ) {
        payload = { ...payload, discovery_answers: persistedResult.runtime_state.discovery_answers };
      }
    }
    // If still no discovery_answers after fallback attempt, return 400.
    if (!Object.prototype.hasOwnProperty.call(payload, "discovery_answers")) {
      return sendJson(res, 400, {
        ok: false,
        error: "discovery_answers required: not in payload and not in persisted state",
      });
    }
  }

  // Inject all domain operation definitions when not caller-supplied.
  // Unblocks Gate 6 in governed-preview-engine for all Executable checkpoints
  // across all governed domain assemblers currently registered on the server.
  // Caller-supplied operation_definitions (non-null) are passed through unchanged.
  if (payload && typeof payload === "object" && !Array.isArray(payload) && !payload.operation_definitions) {
    const tc = payload.target_context ?? null;
    const da = payload.discovery_answers ?? null;
    payload = {
      ...payload,
      operation_definitions: {
        ...assembleFoundationOperationDefinitions(tc, da),
        ...assembleUsersRolesOperationDefinitions(tc, da),
        ...assembleAccountingOperationDefinitions(tc, da),
        ...assembleMasterDataOperationDefinitions(tc, da),
        ...assembleCrmOperationDefinitions(tc, da),
        ...assembleSalesOperationDefinitions(tc, da),
        ...assemblePurchaseOperationDefinitions(tc, da),
        ...assembleInventoryOperationDefinitions(tc, da),
        ...assembleManufacturingOperationDefinitions(tc, da),
        ...assemblePlmOperationDefinitions(tc, da),
        ...assemblePosOperationDefinitions(tc, da),
        ...assembleWebsiteEcommerceOperationDefinitions(tc, da),
        ...assembleProjectsOperationDefinitions(tc, da),
        ...assembleHrOperationDefinitions(tc, da),
        ...assembleQualityOperationDefinitions(tc, da),
        ...assembleMaintenanceOperationDefinitions(tc, da),
        ...assembleRepairsOperationDefinitions(tc, da),
        ...assembleDocumentsOperationDefinitions(tc, da),
        ...assembleSignOperationDefinitions(tc, da),
        ...assembleApprovalsOperationDefinitions(tc, da),
        ...assembleSubscriptionsOperationDefinitions(tc, da),
        ...assembleRentalOperationDefinitions(tc, da),
        ...assembleFieldServiceOperationDefinitions(tc, da),
      },
    };
  }

  const result = runPipelineService(payload);
  return sendJson(res, result.ok ? 200 : 400, result);
}

async function handlePipelineStateLoad(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  if (typeof payload.project_id !== "string" || payload.project_id.trim() === "") {
    return sendJson(res, 400, { ok: false, error: "project_id must be a non-empty string." });
  }

  const result = await loadRuntimeState(payload.project_id);

  if (result.ok) {
    return sendJson(res, 200, { ok: true, runtime_state: result.runtime_state, saved_at: result.saved_at });
  }

  if (result.not_found) {
    return sendJson(res, 404, { ok: false, error: result.error, not_found: true });
  }

  return sendJson(res, 400, { ok: false, error: result.error });
}

async function handlePipelineStateResume(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  if (typeof payload.project_id !== "string" || payload.project_id.trim() === "") {
    return sendJson(res, 400, { ok: false, error: "project_id must be a non-empty string." });
  }

  const result = await resumeRuntimeState(payload.project_id);

  if (result.ok) {
    return sendJson(res, 200, { ok: true, runtime_state: result.runtime_state, saved_at: result.saved_at });
  }

  if (result.not_found) {
    return sendJson(res, 404, { ok: false, error: result.error, not_found: true });
  }

  return sendJson(res, 400, { ok: false, error: result.error });
}

async function handlePipelineStateSave(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: 'Request body must be a non-null plain object.' });
  }

  const result = await saveRuntimeState(payload);
  return sendJson(res, result.ok ? 200 : 400, result);
}

async function handlePipelineConnectionRegister(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const projectId   = typeof payload.project_id === 'string' ? payload.project_id.trim() : null;
  const credentials = payload.credentials;

  if (!projectId) {
    return sendJson(res, 400, { ok: false, error: 'project_id must be a non-empty string.' });
  }
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    return sendJson(res, 400, { ok: false, error: 'credentials must be a non-null plain object.' });
  }

  try {
    const result = await registerPipelineConnection(projectId, credentials);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Pipeline connection registration failed.' });
  }
}

async function handleCheckpointConfirm(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  // ── Input validation ────────────────────────────────────────────────────────
  const project_id   = typeof payload.project_id   === "string" ? payload.project_id.trim()   : null;
  const checkpoint_id = typeof payload.checkpoint_id === "string" ? payload.checkpoint_id.trim() : null;
  const status        = payload.status;
  const evidence      = payload.evidence;
  const actor         = payload.actor;

  if (!project_id) {
    return sendJson(res, 400, { ok: false, error: "project_id is required." });
  }
  if (!checkpoint_id) {
    return sendJson(res, 400, { ok: false, error: "checkpoint_id is required." });
  }
  if (status !== "Complete") {
    return sendJson(res, 400, { ok: false, error: "status must equal \"Complete\"." });
  }
  if (typeof evidence !== "string" || evidence.trim() === "") {
    return sendJson(res, 400, { ok: false, error: "evidence must be a non-empty string." });
  }
  if (typeof actor !== "string" || actor.trim() === "") {
    return sendJson(res, 400, { ok: false, error: "actor must be a non-empty string." });
  }

  // ── Load persisted runtime state ────────────────────────────────────────────
  const loadResult = await loadRuntimeState(project_id);
  if (!loadResult.ok) {
    if (loadResult.not_found) {
      return sendJson(res, 404, { ok: false, error: loadResult.error, not_found: true });
    }
    return sendJson(res, 400, { ok: false, error: loadResult.error });
  }

  const runtime_state = loadResult.runtime_state;

  // ── Locate checkpoint record ────────────────────────────────────────────────
  // Search in checkpoints.records (persisted container) then fall back to the
  // top-level checkpoints array if the state was stored with a flat shape.
  let checkpointRecord = null;

  const checkpointsContainer = runtime_state.checkpoints;
  if (checkpointsContainer !== null && typeof checkpointsContainer === "object" && !Array.isArray(checkpointsContainer)) {
    // Standard shape: { records: [...], engine_version, generated_at }
    const records = Array.isArray(checkpointsContainer.records) ? checkpointsContainer.records : [];
    checkpointRecord = records.find((r) => r && r.checkpoint_id === checkpoint_id) ?? null;
  } else if (Array.isArray(checkpointsContainer)) {
    // Flat array shape (legacy / direct save)
    checkpointRecord = checkpointsContainer.find((r) => r && r.checkpoint_id === checkpoint_id) ?? null;
  }

  if (!checkpointRecord) {
    return sendJson(res, 400, { ok: false, error: `checkpoint_id "${checkpoint_id}" not found in project state.` });
  }

  const licenceRequiredResponse = await maybeBuildLicenceRequiredResponse(
    project_id,
    checkpoint_id,
    checkpointRecord.domain
  );
  if (licenceRequiredResponse) {
    return sendJson(res, 402, licenceRequiredResponse);
  }

  // ── Governance gate — only User_Confirmed checkpoints ──────────────────────
  if (checkpointRecord.validation_source !== "User_Confirmed") {
    return sendJson(res, 400, {
      ok: false,
      error: `checkpoint "${checkpoint_id}" has validation_source "${checkpointRecord.validation_source}". Only User_Confirmed checkpoints may use this route.`,
    });
  }

  // ── Mutate checkpoint_statuses (carry-over map) ─────────────────────────────
  if (runtime_state.checkpoint_statuses === null || typeof runtime_state.checkpoint_statuses !== "object" || Array.isArray(runtime_state.checkpoint_statuses)) {
    runtime_state.checkpoint_statuses = {};
  }
  runtime_state.checkpoint_statuses[checkpoint_id] = "Complete";

  // ── Record confirmation metadata (smallest safe addition) ──────────────────
  if (runtime_state.checkpoint_confirmations === null || typeof runtime_state.checkpoint_confirmations !== "object" || Array.isArray(runtime_state.checkpoint_confirmations)) {
    runtime_state.checkpoint_confirmations = {};
  }
  runtime_state.checkpoint_confirmations[checkpoint_id] = {
    evidence:     evidence.trim(),
    actor:        actor.trim(),
    confirmed_at: new Date().toISOString(),
  };

  // ── Persist updated state ───────────────────────────────────────────────────
  const saveResult = await saveRuntimeState(runtime_state);
  if (!saveResult.ok) {
    return sendJson(res, 400, { ok: false, error: saveResult.error });
  }

  return sendJson(res, 200, { ok: true, runtime_state });
}

// ---------------------------------------------------------------------------
// Industry selection pre-population mapping
//
// Maps each industry's recommendedDomains to the discovery question IDs and
// values that activate those domains via the domain-activation-engine rules.
// Only question IDs from the discovery framework are used.
// Source: "industry_default" — distinguishes from user-provided answers.
// ---------------------------------------------------------------------------

const VALID_INDUSTRY_IDS = ["manufacturing", "retail", "distribution", "services"];

/**
 * Returns discovery answers that activate the domains recommended for the
 * given industry template.
 *
 * Mapping rationale (domain → gate question → value):
 *   manufacturing: MF-01=Yes, BM-01=Physical, PI-01=Yes, OP-01=Yes,
 *                  RM-01=[One-time product sales], FC-01=Full accounting,
 *                  MF-06=[In-process quality checks]
 *   retail:        OP-03=Yes, OP-01=Yes, OP-04=Yes, SC-01=Yes,
 *                  RM-01=[One-time product sales], FC-01=Full accounting,
 *                  BM-01=Physical products only
 *   distribution:  PI-01=Yes, OP-01=Yes, SC-01=Yes,
 *                  RM-01=[One-time product sales], FC-01=Full accounting,
 *                  BM-01=Physical products only
 *   services:      RM-02=Yes, SC-01=Yes,
 *                  RM-01=[One-time service delivery], FC-01=Full accounting,
 *                  BM-01=Services only, BM-05=15
 *
 * Returns: { answers: { [questionId]: value, ... }, sources: { [questionId]: "industry_default" } }
 */
function buildIndustryDiscoveryAnswers(industryId) {
  const base = {};

  if (industryId === "manufacturing") {
    // Business model — physical production
    base["BM-01"] = "Physical products only";
    // Manufacturing gate (R6 — sole gate)
    base["MF-01"] = "Yes";
    // Purchase (PI-01=Yes)
    base["PI-01"] = "Yes";
    // Inventory (OP-01=Yes)
    base["OP-01"] = "Yes";
    // Sales (RM-01 includes One-time product sales)
    base["RM-01"] = ["One-time product sales"];
    // Accounting
    base["FC-01"] = "Full accounting";
    // Quality (MF-06 has non-None value — manufacturing-specific)
    base["MF-06"] = ["In-process quality checks"];
  } else if (industryId === "retail") {
    // Business model — physical products
    base["BM-01"] = "Physical products only";
    // POS
    base["OP-03"] = "Yes";
    // Inventory
    base["OP-01"] = "Yes";
    // Website/ecommerce
    base["OP-04"] = "Yes";
    // CRM
    base["SC-01"] = "Yes";
    // Sales
    base["RM-01"] = ["One-time product sales"];
    // Accounting
    base["FC-01"] = "Full accounting";
  } else if (industryId === "distribution") {
    // Business model — physical products, no manufacturing
    base["BM-01"] = "Physical products only";
    // Purchase
    base["PI-01"] = "Yes";
    // Inventory
    base["OP-01"] = "Yes";
    // CRM
    base["SC-01"] = "Yes";
    // Sales
    base["RM-01"] = ["One-time product sales"];
    // Accounting
    base["FC-01"] = "Full accounting";
  } else if (industryId === "services") {
    // Business model — services
    base["BM-01"] = "Services only";
    // Projects (RM-02=Yes is the primary projects gate)
    base["RM-02"] = "Yes";
    // CRM
    base["SC-01"] = "Yes";
    // Sales (service delivery)
    base["RM-01"] = ["One-time service delivery"];
    // Accounting
    base["FC-01"] = "Full accounting";
    // HR (BM-05 > 10)
    base["BM-05"] = 15;
  }

  // Build sources map — every pre-populated answer is tagged industry_default
  const sources = {};
  for (const key of Object.keys(base)) {
    sources[key] = "industry_default";
  }

  return { answers: base, sources };
}

/**
 * Returns the list of question IDs that are not covered by the industry
 * pre-population mapping but have domain-activation consequences.
 *
 * These are questions that remain unanswered after industry pre-population
 * and for which the engine would return "missing_required_input".
 * The deferred answer rule: activate more not less — callers who need a
 * fully-resolved activation surface must supply these answers or accept
 * the missing_required_input result for those domains.
 *
 * Returns: string[]
 */
function buildDeferredQuestions(industryId, populatedAnswers) {
  // Full question set used by the engine (all gate questions from domain-activation-engine.js)
  const ALL_GATE_QUESTIONS = [
    "BM-01", "BM-05",
    "RM-01", "RM-02", "RM-03", "RM-04",
    "SC-01", "SC-02", "SC-04",
    "PI-01", "PI-02", "PI-03", "PI-05",
    "OP-01", "OP-03", "OP-04", "OP-05",
    "MF-01", "MF-03", "MF-04", "MF-05", "MF-06", "MF-07",
    "FC-01",
    "TA-01", "TA-03",
  ];

  return ALL_GATE_QUESTIONS.filter((q) => !(q in populatedAnswers));
}

async function handleIndustrySelect(req, res) {
  // ── Parse request body ─────────────────────────────────────────────────────
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      ok: false,
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  // ── Validate project_id ────────────────────────────────────────────────────
  const project_id = typeof payload.project_id === "string" ? payload.project_id.trim() : null;
  if (!project_id) {
    return sendJson(res, 400, { ok: false, error: "project_id is required and must be a non-empty string." });
  }

  // ── Validate industry_id ───────────────────────────────────────────────────
  const industry_id = typeof payload.industry_id === "string" ? payload.industry_id.trim() : null;
  if (!industry_id) {
    return sendJson(res, 400, { ok: false, error: "industry_id is required and must be a non-empty string." });
  }
  if (!VALID_INDUSTRY_IDS.includes(industry_id)) {
    return sendJson(res, 400, {
      ok: false,
      error: `industry_id "${industry_id}" is not valid. Must be one of: ${VALID_INDUSTRY_IDS.join(", ")}.`,
    });
  }

  // ── Retrieve industry hints and template ───────────────────────────────────
  const hints = getIndustryDomainHints(industry_id);
  const template = getIndustryTemplate(industry_id);
  const industry_name = hints.industryName;

  // ── Build pre-populated answers ────────────────────────────────────────────
  const { answers: industryAnswers, sources: industrySources } = buildIndustryDiscoveryAnswers(industry_id);
  const deferred_questions = buildDeferredQuestions(industry_id, industryAnswers);

  // ── Load existing runtime state (if any) ──────────────────────────────────
  const loadResult = await loadRuntimeState(project_id);

  let runtime_state;

  if (loadResult.ok) {
    // Merge: industry answers do NOT overwrite existing user answers
    runtime_state = loadResult.runtime_state;

    const existingAnswers =
      runtime_state.discovery_answers &&
      typeof runtime_state.discovery_answers === "object" &&
      !Array.isArray(runtime_state.discovery_answers) &&
      runtime_state.discovery_answers.answers &&
      typeof runtime_state.discovery_answers.answers === "object" &&
      !Array.isArray(runtime_state.discovery_answers.answers)
        ? runtime_state.discovery_answers.answers
        : {};

    const existingSources =
      runtime_state.discovery_answers &&
      typeof runtime_state.discovery_answers.sources === "object" &&
      !Array.isArray(runtime_state.discovery_answers.sources) &&
      runtime_state.discovery_answers.sources !== null
        ? runtime_state.discovery_answers.sources
        : {};

    // Industry defaults fill gaps only — user answers (non-industry_default source) win
    const mergedAnswers = { ...industryAnswers };
    for (const [qid, val] of Object.entries(existingAnswers)) {
      mergedAnswers[qid] = val;
    }
    const mergedSources = { ...industrySources };
    for (const [qid, src] of Object.entries(existingSources)) {
      mergedSources[qid] = src;
    }

    runtime_state = {
      ...runtime_state,
      discovery_answers: {
        ...(runtime_state.discovery_answers || {}),
        answers: mergedAnswers,
        sources: mergedSources,
      },
      industry_selection: {
        industry_id,
        industry_name,
        selected_at: new Date().toISOString(),
      },
    };
  } else {
    // No existing state — create minimal valid runtime state
    runtime_state = {
      project_identity: { project_id },
      discovery_answers: {
        answers: industryAnswers,
        sources: industrySources,
      },
      industry_selection: {
        industry_id,
        industry_name,
        selected_at: new Date().toISOString(),
      },
    };
  }

  // ── Persist updated runtime state ──────────────────────────────────────────
  const saveResult = await saveRuntimeState(runtime_state);
  if (!saveResult.ok) {
    return sendJson(res, 400, { ok: false, error: saveResult.error });
  }

  // ── Compute activated_domains_preview ─────────────────────────────────────
  const finalAnswers = runtime_state.discovery_answers;
  const activatedDomainsResult = computeActivatedDomains(finalAnswers);
  const activated_domains_preview = activatedDomainsResult.domains
    .filter((d) => d.activated === true)
    .map((d) => d.domain_id);

  // ── Return response ────────────────────────────────────────────────────────
  return sendJson(res, 200, {
    ok: true,
    industry_id,
    industry_name,
    pre_populated_answers: industryAnswers,
    deferred_questions,
    activated_domains_preview,
    next_step: "wizard",
  });
}

async function handlePipelineApply(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      ok: false,
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  const approvalCheckpointId = resolveApprovalCheckpointId(
    payload.runtime_state ?? null,
    payload.approval_id ?? null
  );
  const licenceRequiredResponse = await maybeBuildLicenceRequiredResponse(
    payload.connection_context?.project_id ?? null,
    approvalCheckpointId
  );
  if (licenceRequiredResponse) {
    return sendJson(res, 402, licenceRequiredResponse);
  }

  const result = await applyGoverned({
    approval_id: payload.approval_id,
    runtime_state: payload.runtime_state,
    operation: payload.operation,
    connection_context: payload.connection_context,
  });

  return sendJson(res, result.ok ? 200 : 400, result);
}

async function handleLicencePricing(req, res) {
  void req;
  const config = await getLicenceConfig();
  return sendJson(res, 200, {
    price: await getPrice(),
    early_adopter_price: config.early_adopter_price,
    is_early_adopter: await isEarlyAdopter(),
    remaining_slots: await getRemainingEarlyAdopterSlots(),
    currency: config.currency,
    duration_days: config.duration_days,
  });
}

async function handleEarlyAdopterStatus(req, res) {
  void req;

  let claimed = 0;

  if (supabase) {
    const { count, error } = await supabase
      .from("licences")
      .select("id", { count: "exact", head: true })
      .eq("plan", "paid");

    if (error) {
      return sendJson(res, 500, { error: error.message || "Unable to load early adopter status." });
    }

    claimed = Number.isFinite(count) ? count : 0;
  }

  const total = 20;
  const remaining = Math.max(0, total - claimed);
  const earlyAdopterActive = claimed < total;

  return sendJson(res, 200, {
    claimed,
    remaining,
    total,
    earlyAdopterActive,
  });
}

async function handleLicenceStatus(req, res, pathname) {
  void req;
  const match = pathname.match(/^\/api\/licence\/status\/([^/]+)$/);
  if (!match) {
    return sendJson(res, 404, { error: "Not found" });
  }

  return sendJson(res, 200, await getLicenceStatus(decodeURIComponent(match[1])));
}

async function handleLicenceCreatePaymentIntent(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { ok: false, error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Request body must be a non-null object." });
  }

  const projectId = typeof payload.project_id === "string" ? payload.project_id.trim() : "";
  if (projectId === "") {
    return sendJson(res, 400, { ok: false, error: "project_id is required." });
  }

  const result = await createPaymentIntent(projectId);
  return sendJson(res, 200, {
    client_secret: result.client_secret,
    price: result.price,
    early_adopter: result.early_adopter,
    remaining_slots: result.remaining_slots,
  });
}

async function handleLicenceWebhook(req, res) {
  let rawBody;
  try {
    rawBody = await readRequestBodyBuffer(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      ok: false,
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  try {
    const signatureHeader = req.headers["stripe-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const result = await handleStripeWebhook(rawBody, signature);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Webhook processing failed.",
    });
  }
}

async function handleLicenceCheckDomain(req, res, pathname) {
  void req;
  const match = pathname.match(/^\/api\/licence\/check-domain\/([^/]+)\/([^/]+)$/);
  if (!match) {
    return sendJson(res, 404, { error: "Not found" });
  }

  const projectId = decodeURIComponent(match[1]);
  const domainId = decodeURIComponent(match[2]);
  const normalizedDomainId = normalizeDomainId(domainId);
  const unlocked = await isDomainUnlocked(projectId, normalizedDomainId);

  let reason = "Paid licence active.";
  if (!normalizedDomainId) {
    reason = "Unknown domain.";
  } else if (FOUNDATION_DOMAINS.includes(normalizedDomainId)) {
    reason = "Foundation domains are always free.";
  } else if (!unlocked) {
    reason = "This domain requires a paid licence.";
  }

  return sendJson(res, 200, { unlocked, reason });
}

// ---------------------------------------------------------------------------
// handleDetectDatabases
//
// POST /api/odoo/detect-databases
// Body: { "url": "https://mycompany.odoo.com" }
//
// Calls the Odoo public database list endpoint with a 5000ms hard timeout.
// Never throws — always returns a response.
// No credentials are passed — this is a public endpoint.
// ---------------------------------------------------------------------------

async function handleDetectDatabases(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 200, { ok: false, databases: [], error: "Invalid request payload." });
  }

  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  if (!url) {
    return sendJson(res, 200, { ok: false, databases: [], error: "url is required." });
  }

  // Validate URL shape before making a network call
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return sendJson(res, 200, { ok: false, databases: [], error: "Invalid URL format." });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return sendJson(res, 200, { ok: false, databases: [], error: "URL must use http or https protocol." });
  }

  const targetUrl = `${parsed.protocol}//${parsed.host}/web/database/list`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return sendJson(res, 200, {
        ok: false,
        databases: [],
        error: `Odoo responded with HTTP ${response.status}`,
      });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      return sendJson(res, 200, { ok: false, databases: [], error: "Invalid JSON from Odoo instance." });
    }

    // Odoo returns { result: [...] } or a plain array depending on version/endpoint
    let databases = [];
    if (Array.isArray(data)) {
      databases = data;
    } else if (data && Array.isArray(data.result)) {
      databases = data.result;
    }

    // Filter to strings only
    databases = databases.filter((d) => typeof d === "string");

    return sendJson(res, 200, { ok: true, databases });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err && (err.name === "AbortError" || err.code === "ABORT_ERR");
    return sendJson(res, 200, {
      ok: false,
      databases: [],
      error: isTimeout ? "Detection timed out — instance may be unreachable." : (err.message || "Unknown error"),
    });
  }
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateOdooBaseUrl(value) {
  const normalized = trimString(value);
  if (!normalized) {
    throw new Error("url is required.");
  }

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("url must be a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("url must use http or https.");
  }

  return `${parsed.protocol}//${parsed.host}`;
}

function createOdooTimeoutFetch(timeoutMs) {
  return async (resource, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(resource, {
        ...options,
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError" || error?.code === "ABORT_ERR") {
        throw new OdooRpcError("Odoo instance timed out", "TIMEOUT");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

async function authenticateOdooClient(payload, timeoutMs) {
  const client = new OdooClient({
    baseUrl: payload.url,
    database: payload.database,
    fetchImpl: createOdooTimeoutFetch(timeoutMs),
  });

  let username = payload.username;
  let password = payload.password;

  try {
    await client.authenticate(username, password);
    return client;
  } finally {
    payload.username = undefined;
    payload.password = undefined;
    username = "";
    password = "";
  }
}

function isOdooTimeoutError(error) {
  return error?.code === "TIMEOUT" || error?.name === "AbortError" || error?.code === "ABORT_ERR";
}

function isOdooConnectionError(error) {
  if (isOdooTimeoutError(error)) {
    return false;
  }

  const code = String(error?.cause?.code || error?.code || "").toUpperCase();
  if (["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "EAI_AGAIN", "ETIMEDOUT"].includes(code)) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return message.includes("fetch failed") || message.includes("could not connect");
}

function isOdooAuthError(error) {
  if (isOdooTimeoutError(error) || isOdooConnectionError(error)) {
    return false;
  }

  const message = String(error?.message || "").toLowerCase();
  return message.includes("authentication failed") ||
    message.includes("access denied") ||
    message.includes("wrong login") ||
    message.includes("wrong password") ||
    message.includes("login");
}

function formatOdooRelation(value) {
  if (Array.isArray(value)) {
    return String(value[1] || value[0] || "");
  }
  return typeof value === "string" ? value : "";
}

function sendOdooScanError(res, error) {
  if (isOdooTimeoutError(error)) {
    return sendJson(res, 504, { error: "Odoo instance timed out" });
  }

  if (isOdooConnectionError(error)) {
    return sendJson(res, 502, { error: "Could not connect to Odoo instance" });
  }

  if (isOdooAuthError(error)) {
    return sendJson(res, 401, { error: "Authentication failed. Check credentials." });
  }

  return sendJson(res, 500, {
    error: "Scan failed",
    detail: error instanceof Error ? error.message : "Unknown error",
  });
}

function sendOdooInstallError(res, error) {
  if (isOdooTimeoutError(error)) {
    return sendJson(res, 504, { error: "Odoo instance timed out" });
  }

  if (isOdooAuthError(error)) {
    return sendJson(res, 401, { error: "Authentication failed. Check credentials." });
  }

  const detail = isOdooConnectionError(error)
    ? "Could not connect to Odoo instance"
    : (error instanceof Error ? error.message : "Unknown error");

  return sendJson(res, 502, {
    error: "Module install failed",
    detail,
  });
}

async function handleOdooScan(req, res, user) {
  void user;

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { error: "Request body must be a non-null object." });
  }

  const database = trimString(payload.database);
  const username = trimString(payload.username);
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!database) {
    return sendJson(res, 400, { error: "database is required." });
  }

  if (!username) {
    return sendJson(res, 400, { error: "username is required." });
  }

  if (!password) {
    return sendJson(res, 400, { error: "password is required." });
  }

  try {
    payload.url = validateOdooBaseUrl(payload.url);
  } catch (error) {
    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "url must be a valid URL.",
    });
  }

  payload.database = database;
  payload.username = username;
  payload.password = password;

  let client;
  try {
    client = await authenticateOdooClient(payload, ODOO_SCAN_TIMEOUT_MS);
  } catch (error) {
    return sendOdooScanError(res, error);
  }

  try {
    const companyRows = await client.searchRead(
      "res.company",
      [],
      ["name", "currency_id", "country_id", "email", "phone", "website"],
      { limit: 1 }
    );
    const installedModules = await client.searchRead(
      "ir.module.module",
      [["state", "=", "installed"]],
      ["name", "shortdesc", "state"],
      { limit: 500 }
    );

    const dataCounts = {};
    for (const model of ODOO_SCAN_COUNT_MODELS) {
      dataCounts[model] = await client.searchCount(model, []);
    }

    const company = companyRows[0] || {};
    return sendJson(res, 200, {
      company: {
        name: String(company.name || ""),
        currency: formatOdooRelation(company.currency_id),
        country: formatOdooRelation(company.country_id),
        email: String(company.email || ""),
        phone: String(company.phone || ""),
        website: String(company.website || ""),
      },
      modules_installed: installedModules.map((module) => ({
        name: String(module.name || ""),
        label: String(module.shortdesc || module.name || ""),
        state: String(module.state || ""),
      })),
      data_counts: dataCounts,
      scanned_at: new Date().toISOString(),
    });
  } catch (error) {
    return sendOdooScanError(res, error);
  }
}

async function handleOdooInstallModule(req, res, user) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { error: "Request body must be a non-null object." });
  }

  const projectId = trimString(payload.projectId);
  const database = trimString(payload.database);
  const username = trimString(payload.username);
  const password = typeof payload.password === "string" ? payload.password : "";
  const moduleName = trimString(payload.moduleName);

  if (!projectId) {
    return sendJson(res, 400, { error: "projectId is required." });
  }

  const leadAllowed = await assertProjectLead(supabase, user?.id, projectId, res);
  if (!leadAllowed) {
    return;
  }

  if (!database) {
    return sendJson(res, 400, { error: "database is required." });
  }

  if (!username) {
    return sendJson(res, 400, { error: "username is required." });
  }

  if (!password) {
    return sendJson(res, 400, { error: "password is required." });
  }

  if (!moduleName) {
    return sendJson(res, 400, { error: "moduleName is required." });
  }

  if (!MODULE_NAME_PATTERN.test(moduleName)) {
    return sendJson(res, 400, { error: "moduleName must contain only letters, numbers, and underscores." });
  }

  try {
    payload.url = validateOdooBaseUrl(payload.url);
  } catch (error) {
    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "url must be a valid URL.",
    });
  }

  payload.projectId = projectId;
  payload.database = database;
  payload.username = username;
  payload.password = password;
  payload.moduleName = moduleName;

  let client;
  try {
    client = await authenticateOdooClient(payload, ODOO_INSTALL_TIMEOUT_MS);
  } catch (error) {
    return sendOdooInstallError(res, error);
  }

  try {
    const rows = await client.searchRead(
      "ir.module.module",
      [["name", "=", moduleName]],
      ["id", "name"],
      { limit: 1 }
    );
    const moduleId = Number(rows?.[0]?.id || 0);
    if (!moduleId) {
      return sendJson(res, 404, { error: "Module not found" });
    }

    await client.executeKw("ir.module.module", "button_immediate_install", [[moduleId]], {});

    writeAudit(supabase, {
      projectId,
      accountId: user?.id || null,
      actorName: user?.user_metadata?.full_name || user?.email || "",
      actorRole: "project_lead",
      action: "module_installed",
      details: {
        moduleName,
        url: payload.url,
        database,
      },
    });

    return sendJson(res, 200, { success: true, moduleName });
  } catch (error) {
    return sendOdooInstallError(res, error);
  }
}

function parseTeamProjectPath(pathname) {
  const match = pathname.match(/^\/api\/team\/([^/]+)$/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function parseTeamMemberPath(pathname) {
  const match = pathname.match(/^\/api\/team\/([^/]+)\/([^/]+)$/);
  if (!match) {
    return null;
  }

  return {
    projectId: decodeURIComponent(match[1]),
    memberId: decodeURIComponent(match[2]),
  };
}

function parseAuditProjectPath(pathname) {
  const match = pathname.match(/^\/api\/audit\/([^/]+)$/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function parseAuditExportPath(pathname) {
  const match = pathname.match(/^\/api\/audit\/([^/]+)\/export$/);
  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

function getRequestUrl(req) {
  return new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
}

function parseIsoDateParam(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label} date.`);
  }

  return parsed.toISOString();
}

function parsePaginationInteger(value, label, { defaultValue, minimum = 0, maximum = null }) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`Invalid ${label}.`);
  }

  if (maximum !== null) {
    return Math.min(parsed, maximum);
  }

  return parsed;
}

function parseAuditQueryParams(req, { includePagination = true } = {}) {
  const requestUrl = getRequestUrl(req);
  const actor = typeof requestUrl.searchParams.get("actor") === "string"
    ? requestUrl.searchParams.get("actor").trim()
    : "";
  const action = typeof requestUrl.searchParams.get("action") === "string"
    ? requestUrl.searchParams.get("action").trim()
    : "";
  const domain = typeof requestUrl.searchParams.get("domain") === "string"
    ? requestUrl.searchParams.get("domain").trim()
    : "";
  const from = parseIsoDateParam(requestUrl.searchParams.get("from"), "from");
  const to = parseIsoDateParam(requestUrl.searchParams.get("to"), "to");

  const query = { actor, action, domain, from, to };

  if (includePagination) {
    query.limit = parsePaginationInteger(requestUrl.searchParams.get("limit"), "limit", {
      defaultValue: 50,
      minimum: 1,
      maximum: 100,
    });
    query.offset = parsePaginationInteger(requestUrl.searchParams.get("offset"), "offset", {
      defaultValue: 0,
      minimum: 0,
    });
  }

  return query;
}

function applyAuditFilters(query, projectId, filters) {
  let nextQuery = query.eq("project_id", projectId);

  if (filters.actor) {
    nextQuery = nextQuery.ilike("actor_name", `%${filters.actor}%`);
  }

  if (filters.action) {
    nextQuery = nextQuery.eq("action", filters.action);
  }

  if (filters.domain) {
    nextQuery = nextQuery.ilike("domain", `%${filters.domain}%`);
  }

  if (filters.from) {
    nextQuery = nextQuery.gte("created_at", filters.from);
  }

  if (filters.to) {
    nextQuery = nextQuery.lte("created_at", filters.to);
  }

  return nextQuery;
}

function normalizeAuditEntryRecord(entry) {
  return {
    id: entry?.id ?? null,
    project_id: entry?.project_id ?? null,
    account_id: entry?.account_id ?? null,
    actor_name: entry?.actor_name ?? null,
    actor_role: entry?.actor_role ?? null,
    action: entry?.action ?? null,
    domain: entry?.domain ?? null,
    checkpoint_id: entry?.checkpoint_id ?? null,
    details: entry?.details ?? {},
    created_at: entry?.created_at ?? null,
  };
}

async function listAuditEntries(supabaseClient, projectId, filters, { limit = 50, offset = 0 } = {}) {
  if (!supabaseClient) {
    return { entries: [], total: 0, limit, offset };
  }

  let query = supabaseClient
    .from("audit_log")
    .select("id, project_id, account_id, actor_name, actor_role, action, domain, checkpoint_id, details, created_at", {
      count: "exact",
    });

  query = applyAuditFilters(query, projectId, filters)
    .order("created_at", { ascending: false })
    .range(offset, Math.max(offset + Math.max(limit, 1) - 1, offset));

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message || "Failed to load audit log.");
  }

  const entries = Array.isArray(data) ? data.map(normalizeAuditEntryRecord) : [];
  return {
    entries,
    total: typeof count === "number" ? count : entries.length,
    limit,
    offset,
  };
}

async function listAllAuditEntries(supabaseClient, projectId, filters) {
  if (!supabaseClient) {
    return [];
  }

  const batchSize = 1000;
  const entries = [];
  let offset = 0;

  while (true) {
    let query = supabaseClient
      .from("audit_log")
      .select("id, project_id, account_id, actor_name, actor_role, action, domain, checkpoint_id, details, created_at");

    query = applyAuditFilters(query, projectId, filters)
      .order("created_at", { ascending: false })
      .range(offset, offset + batchSize - 1);

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message || "Failed to export audit log.");
    }

    const batch = Array.isArray(data) ? data.map(normalizeAuditEntryRecord) : [];
    entries.push(...batch);

    if (batch.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  return entries;
}

function formatAuditCsvTimestamp(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function formatAuditCsvFilenameDate(value = new Date()) {
  const safe = value instanceof Date ? value : new Date(value);
  const parsed = Number.isNaN(safe.getTime()) ? new Date() : safe;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function escapeCsvField(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function buildAuditCsvRow(entry) {
  const fields = [
    formatAuditCsvTimestamp(entry.created_at),
    entry.actor_name || "",
    entry.actor_role || "",
    entry.action || "",
    entry.domain || "",
    entry.checkpoint_id || "",
    JSON.stringify(entry.details ?? {}),
  ];

  return fields.map(escapeCsvField).join(",");
}

function writeAuditCsvResponse(res, projectId, entries) {
  const filename = `audit-${projectId}-${formatAuditCsvFilenameDate()}.csv`;

  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
  });

  res.write([
    escapeCsvField("Date/Time"),
    escapeCsvField("Actor"),
    escapeCsvField("Role"),
    escapeCsvField("Action"),
    escapeCsvField("Domain"),
    escapeCsvField("Checkpoint ID"),
    escapeCsvField("Details"),
  ].join(","));
  res.write("\n");

  for (const entry of entries) {
    res.write(buildAuditCsvRow(entry));
    res.write("\n");
  }

  res.end();
}

async function handleTeamList(req, res, pathname, user) {
  const projectId = parseTeamProjectPath(pathname);
  if (!projectId) {
    return sendJson(res, 404, { error: "Not found" });
  }

  try {
    const memberAllowed = await assertProjectMember(supabase, user.id, projectId, res);
    if (!memberAllowed) {
      return;
    }

    const members = await listProjectTeamMembers(supabase, projectId);
    return sendJson(res, 200, { members });
  } catch (error) {
    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Failed to load team members.",
    });
  }
}

async function handleTeamInvite(req, res, user) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  const projectId = typeof payload?.projectId === "string" ? payload.projectId.trim() : "";
  const email = normalizeTeamEmail(payload?.email);
  const fullName = typeof payload?.fullName === "string" ? payload.fullName.trim() : "";
  const role = normalizeTeamRole(payload?.role);

  if (!projectId || !email || !fullName) {
    return sendJson(res, 400, {
      error: "projectId, email, and fullName are required.",
    });
  }

  if (!TEAM_INVITE_ROLES.has(role)) {
    return sendJson(res, 400, { error: "Invalid role." });
  }

  try {
    const leadAllowed = await assertProjectLead(supabase, user.id, projectId, res);
    if (!leadAllowed) {
      return;
    }

    const member = await createProjectTeamMember(supabase, {
      account_id: null,
      project_id: projectId,
      email,
      full_name: fullName,
      role,
      invited_by: user.id,
      accepted_at: null,
    });

    if (supabase?.auth?.admin?.inviteUserByEmail) {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email);
      if (error) {
        await deleteProjectTeamMember(supabase, projectId, member.id);
        return sendJson(res, 400, { error: error.message || "Failed to send invite." });
      }
    }

    writeAudit(supabase, {
      projectId,
      accountId: user.id,
      actorName: user.user_metadata?.full_name || user.email,
      actorRole: "project_lead",
      action: "member_invited",
      details: { email, role },
    });

    return sendJson(res, 200, { success: true });
  } catch (error) {
    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Failed to invite team member.",
    });
  }
}

async function handleTeamDelete(req, res, pathname, user) {
  const params = parseTeamMemberPath(pathname);
  if (!params) {
    return sendJson(res, 404, { error: "Not found" });
  }

  try {
    const leadAllowed = await assertProjectLead(supabase, user.id, params.projectId, res);
    if (!leadAllowed) {
      return;
    }

    const member = await getProjectMemberById(supabase, params.projectId, params.memberId);
    if (!member) {
      return sendJson(res, 404, { error: "Team member not found" });
    }

    if (member.role === "project_lead") {
      const projectLeadCount = await countProjectLeads(supabase, params.projectId);
      if (projectLeadCount <= 1) {
        return sendJson(res, 400, { error: "Cannot remove the only project lead" });
      }
    }

    await deleteProjectTeamMember(supabase, params.projectId, params.memberId);

    writeAudit(supabase, {
      projectId: params.projectId,
      accountId: user.id,
      actorName: user.user_metadata?.full_name || user.email,
      actorRole: "project_lead",
      action: "member_removed",
      details: { memberId: params.memberId },
    });

    return sendJson(res, 200, { success: true });
  } catch (error) {
    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Failed to remove team member.",
    });
  }
}

async function handleTeamPatch(req, res, pathname, user) {
  const params = parseTeamMemberPath(pathname);
  if (!params) {
    return sendJson(res, 404, { error: "Not found" });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  const role = normalizeTeamRole(payload?.role);
  if (!TEAM_ROLES.has(role)) {
    return sendJson(res, 400, { error: "Invalid role." });
  }

  try {
    const leadAllowed = await assertProjectLead(supabase, user.id, params.projectId, res);
    if (!leadAllowed) {
      return;
    }

    const member = await getProjectMemberById(supabase, params.projectId, params.memberId);
    if (!member) {
      return sendJson(res, 404, { error: "Team member not found" });
    }

    if (member.role === "project_lead" && role !== "project_lead") {
      const projectLeadCount = await countProjectLeads(supabase, params.projectId);
      if (projectLeadCount <= 1) {
        return sendJson(res, 400, { error: "Cannot remove the only project lead" });
      }
    }

    await updateProjectTeamMemberRole(supabase, params.projectId, params.memberId, role);

    writeAudit(supabase, {
      projectId: params.projectId,
      accountId: user.id,
      actorName: user.user_metadata?.full_name || user.email,
      actorRole: "project_lead",
      action: "member_role_changed",
      details: { memberId: params.memberId, newRole: role },
    });

    return sendJson(res, 200, { success: true });
  } catch (error) {
    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Failed to update team member role.",
    });
  }
}

async function handleAuditWrite(req, res, user) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, {
      error: parseError instanceof Error ? parseError.message : "Invalid request payload.",
    });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return sendJson(res, 400, { error: "Request body must be a non-null object." });
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  if (!AUDIT_ACTIONS.has(action)) {
    return sendJson(res, 400, { error: "Invalid action." });
  }

  writeAudit(supabase, {
    projectId: body.projectId,
    accountId: user?.id || null,
    actorName: body.actorName,
    actorRole: body.actorRole,
    action,
    domain: body.domain || null,
    checkpointId: body.checkpointId || null,
    details: body.details || {},
  });

  return sendJson(res, 200, { success: true });
}

async function handleAuditList(req, res, pathname, user) {
  const projectId = parseAuditProjectPath(pathname);
  if (!projectId) {
    return sendJson(res, 404, { error: "Not found" });
  }

  try {
    const memberAllowed = await assertProjectMember(supabase, user.id, projectId, res);
    if (!memberAllowed) {
      return;
    }

    const filters = parseAuditQueryParams(req, { includePagination: true });
    const result = await listAuditEntries(supabase, projectId, filters, {
      limit: filters.limit,
      offset: filters.offset,
    });

    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Failed to load audit log.",
    });
  }
}

async function handleAuditExport(req, res, pathname, user) {
  const projectId = parseAuditExportPath(pathname);
  if (!projectId) {
    return sendJson(res, 404, { error: "Not found" });
  }

  try {
    const memberAllowed = await assertProjectMember(supabase, user.id, projectId, res);
    if (!memberAllowed) {
      return;
    }

    const filters = parseAuditQueryParams(req, { includePagination: false });
    const entries = await listAllAuditEntries(supabase, projectId, filters);
    return writeAuditCsvResponse(res, projectId, entries);
  } catch (error) {
    return sendJson(res, 400, {
      error: error instanceof Error ? error.message : "Failed to export audit log.",
    });
  }
}

function generateProjectId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'proj_';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function handleAuthSignup(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const { fullName, email, password, companyName, inviteCode } = payload || {};
  if (!fullName || !email || !password || !companyName) {
    return sendJson(res, 400, { error: 'fullName, email, password, and companyName are required.' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return sendJson(res, 400, { error: 'Password must be at least 8 characters.' });
  }

  // Invite code required during beta
  if (!inviteCode) {
    return sendJson(res, 403, { error: 'An invite code is required during beta. Contact us at hello@projecterp.co.za to request access.' });
  }

  const inviteResult = await validateInviteCode(inviteCode);
  if (!inviteResult.valid) {
    return sendJson(res, 403, { error: inviteResult.error });
  }

  const { user, session, error } = await authService.createAccount(fullName, email, password, companyName);
  if (error) {
    return sendJson(res, 400, { error });
  }

  // Consume invite code — log but don't fail signup if consume fails
  const consumeResult = await consumeInviteCode(inviteCode, email);
  if (!consumeResult.ok) {
    console.warn('Failed to consume invite code:', consumeResult.error);
  }

  const projectId = generateProjectId();
  const { project: newProject, error: projectError } = await authService.createProject(
    user.id,
    projectId,
    null,
    null
  );
  if (projectError || !newProject) {
    return sendJson(res, 400, { error: projectError || "Failed to create project." });
  }

  try {
    await ensureProjectLeadMembership(supabase, {
      ...user,
      email: user.email || email,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: user.user_metadata?.full_name || fullName,
      },
    }, newProject.id);
  } catch (membershipError) {
    return sendJson(res, 500, {
      error: membershipError instanceof Error
        ? membershipError.message
        : "Failed to assign project lead membership.",
    });
  }

  return sendJson(res, 200, {
    user: { id: user.id, email: user.email, fullName, companyName },
    session,
    projectId,
    plan: inviteResult.plan,
  });
}

async function handleAuthSignin(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const { email, password } = payload || {};
  if (!email || !password) {
    return sendJson(res, 400, { error: 'email and password are required.' });
  }

  const { user, session, error } = await authService.signIn(email, password);
  if (error) {
    return sendJson(res, 401, { error });
  }

  const { projects } = await authService.getAccountProjects(user.id);

  return sendJson(res, 200, { user, session, projects: projects || [] });
}

async function handleAuthResetPassword(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const { email } = payload || {};
  if (!email) {
    return sendJson(res, 400, { error: 'email is required.' });
  }

  if (!supabase) {
    return sendJson(res, 200, { ok: true, message: 'Reset email sent if account exists.' });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: (process.env.SITE_URL || '') + '/reset-password',
  });

  if (error) {
    return sendJson(res, 400, { error: error.message });
  }

  return sendJson(res, 200, { ok: true, message: 'Reset email sent if account exists.' });
}

async function handleAuthUpdatePassword(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : "Invalid request payload." });
  }

  const { password, accessToken } = payload || {};
  if (typeof password !== "string" || password.length < 8) {
    return sendJson(res, 400, { error: "Password must be at least 8 characters." });
  }

  if (typeof accessToken !== "string" || accessToken.trim() === "") {
    return sendJson(res, 400, { error: "Reset link expired or invalid. Please request a new one." });
  }

  if (!supabase) {
    return sendJson(res, 503, { error: "Password reset is unavailable in this environment." });
  }

  // Use the access token to get a user session
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return sendJson(res, 401, {
      error: "Reset link expired or invalid. Please request a new one."
    });
  }

  // Update the password using admin
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password }
  );

  if (updateError) {
    return sendJson(res, 400, {
      error: updateError.message
    });
  }

  // Clear the reset token from Supabase
  return sendJson(res, 200, {
    ok: true,
    message: "Password updated successfully."
  });
}

async function handleAuthVerify(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (parseError) {
    return sendJson(res, 400, { error: parseError instanceof Error ? parseError.message : 'Invalid request payload.' });
  }

  const { token } = payload || {};
  if (!token) {
    return sendJson(res, 400, { error: 'token is required.' });
  }

  const { user, error } = await authService.verifyToken(token);
  if (error || !user) {
    return sendJson(res, 200, { valid: false, user: null });
  }

  return sendJson(res, 200, { valid: true, user });
}

async function ensureDataStore() {
  await mkdir(dataRoot, { recursive: true });
  try {
    await stat(projectStorePath);
  } catch {
    await writeProjectStore({ projects: [], savedAt: null });
  }
}

async function readProjectStore() {
  const raw = await readFile(projectStorePath, "utf8");
  return normalizeProjectStorePayload(JSON.parse(raw));
}

async function writeProjectStore(payload) {
  const normalized = {
    ...normalizeProjectStorePayload(payload),
    savedAt: new Date().toISOString()
  };

  await writeFile(projectStorePath, JSON.stringify(normalized, null, 2));
  return normalized;
}

async function readRequestBodyBuffer(req) {
  const chunks = [];
  let totalSize = 0;

  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > MAX_BODY_SIZE) {
      throw new Error("Request body exceeds 10MB limit");
    }
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const body = await readRequestBodyBuffer(req);

  if (!body.length) {
    return {};
  }

  try {
    return JSON.parse(body.toString("utf8"));
  } catch (e) {
    throw new Error("Invalid JSON in request body");
  }
}

async function serveStatic(res, requestedPath, allowedRoot) {
  const normalizedAllowedRoot = path.resolve(allowedRoot);
  const normalizedRequestedPath = path.resolve(requestedPath);

  if (!normalizedRequestedPath.startsWith(normalizedAllowedRoot)) {
    return sendJson(res, 403, { error: "Forbidden" });
  }

  try {
    const file = await readFile(normalizedRequestedPath);
    const extension = path.extname(normalizedRequestedPath);

    res.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(file);
  } catch {
    return sendJson(res, 404, { error: "Not found" });
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'",
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function normalizeDomainId(domainId) {
  if (typeof domainId !== "string") {
    return null;
  }

  const normalized = domainId.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized === "" ? null : normalized;
}

function resolveApprovalCheckpointId(runtimeState, approvalId) {
  if (typeof approvalId !== "string" || approvalId.trim() === "") {
    return null;
  }

  const approvals = runtimeState?._engine_outputs?.execution_approvals?.execution_approvals;
  if (!Array.isArray(approvals)) {
    return null;
  }

  const approval = approvals.find((candidate) => candidate?.approval_id === approvalId);
  return typeof approval?.checkpoint_id === "string" ? approval.checkpoint_id : null;
}

function resolveCheckpointDomainId(checkpointId, explicitDomainId = null) {
  return normalizeDomainId(explicitDomainId) ?? getDomainIdFromCheckpointId(checkpointId);
}

async function maybeBuildLicenceRequiredResponse(projectId, checkpointId, explicitDomainId = null) {
  if (typeof projectId !== "string" || projectId.trim() === "") {
    return null;
  }

  const domainId = resolveCheckpointDomainId(checkpointId, explicitDomainId);
  if (!domainId) {
    return null;
  }

  const unlocked = await isDomainUnlocked(projectId.trim(), domainId);
  if (unlocked) {
    return null;
  }

  return buildLicenceRequiredResponse();
}

async function buildLicenceRequiredResponse() {
  return {
    ok: false,
    error: "licence_required",
    message: "This domain requires a paid licence.",
    upgrade_url: "/upgrade",
    current_price: await getPrice(),
    early_adopter: await isEarlyAdopter(),
    remaining_slots: await getRemainingEarlyAdopterSlots(),
  };
}

function buildApplyFailureResponse(error) {
  return {
    ok: false,
    result_status: "failure",
    odoo_result: null,
    error,
    executed_at: new Date().toISOString(),
    execution_source_inputs: null,
  };
}

function cleanupStaleRequestLogEntries() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  for (const [key, timestamp] of requestLog.entries()) {
    if (timestamp < windowStart) {
      requestLog.delete(key);
    }
  }
}

const _requestLogTimer = setInterval(cleanupStaleRequestLogEntries, REQUEST_LOG_CLEANUP_INTERVAL_MS);
_requestLogTimer.unref();
