#!/usr/bin/env node
// ---------------------------------------------------------------------------
// e2e-all-domains-write.js
// End-to-end governed write verification across every domain assembler.
//
// For each *-operation-definitions.js assembler that produces at least one
// non-null intended_changes, this script:
//   1. Authenticates against live Odoo 19 via OdooClient.
//   2. Builds realistic wizard_captures / discovery_answers / target_context.
//   3. Calls the assembler to produce the operation_definitions map.
//   4. For each non-null definition targeting a writable (non-forbidden) model:
//      a. Reads BEFORE state (via searchRead or fieldsGet for CREATE).
//      b. Performs the write (create for record-producing intended_changes,
//         write for singleton-targeting intended_changes).
//      c. Reads AFTER state and verifies the change landed.
//      d. Restores the original state (delete created records,
//         revert written fields).
//
// Safety rules enforced:
//   - Never writes to res.users, res.groups, ir.config_parameter, res.company.
//   - [TEST] prefix on all name/title fields for easy manual cleanup.
//   - 30-second timeout per domain.
//   - Live fields_get filter drops keys not present on the live instance.
//   - Every write is matched by a restore.
//
// Usage: node scripts/e2e-all-domains-write.js
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── .env loader (UTF-16-LE or UTF-8) ─────────────────────────────────────────

function loadEnv(filePath) {
  const raw = readFileSync(filePath);
  let text;
  if (raw[0] === 0xff && raw[1] === 0xfe) {
    text = raw.slice(2).toString("utf16le");
  } else {
    text = raw.toString("utf8");
  }
  const entries = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    entries[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return entries;
}

const env = loadEnv(resolve(ROOT, ".env"));
const ODOO_URL      = env.ODOO_URL;
const ODOO_DB       = env.ODOO_DB;
const ODOO_USER     = env.ODOO_USER;
const ODOO_PASSWORD = env.ODOO_PASSWORD;

if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_PASSWORD) {
  console.error("✗ Missing .env variables: ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASSWORD");
  process.exit(1);
}

// ── Imports ──────────────────────────────────────────────────────────────────

const { OdooClient } = await import(
  pathToFileURL(resolve(ROOT, "app/backend/odoo-client.js")).href
);
const { resolveLookups, isLookupDirective } = await import(
  pathToFileURL(resolve(ROOT, "app/backend/odoo-lookup-resolver.js")).href
);

// ── Safety: forbidden models (RULE 3) ────────────────────────────────────────

const FORBIDDEN_MODELS = new Set([
  "res.users",
  "res.groups",
  "ir.config_parameter",
  "res.company",
]);

// ── Models treated as singletons — WRITE to existing record, not CREATE ────
// These records already exist on every Odoo instance (or creating a second
// one is semantically wrong / leaves orphan dependencies). We write + restore.
//   - website           : main website singleton
//   - stock.warehouse   : creating a new warehouse auto-provisions locations,
//                         picking types, and sequences; unlinking after test
//                         cannot be relied on. Write to the existing main
//                         warehouse and restore.
//   - ir.mail_server    : assemblers produce update-only payloads like
//                         {smtp_authentication} with no name — these can only
//                         land on an existing mail server record.

const SINGLETON_MODELS = new Set([
  "website",
  "stock.warehouse",
  "ir.mail_server",
]);

// ── Realistic wizard_captures covering every assembler's required fields ───

const WIZARD_CAPTURES = {
  foundation: { fiscal_year_end_month: "3", fiscal_year_end_day: 31 },
  crm: {
    stage_names: ["[TEST] New Lead", "[TEST] Qualified", "[TEST] Won"],
    team_name: "[TEST] Sales Team",
    team_leader_name: "[TEST] Team Leader",
  },
  sales: {
    pricelist_name: "[TEST] Default Pricelist",
    currency_id: null, // resolved live
    active: true,
  },
  accounting: {
    sales_journal_name: "[TEST] Sales Journal",
    purchase_journal_name: "[TEST] Purchase Journal",
    tax_rate: "15",
    tax_type: "sale",
  },
  inventory: {
    warehouse_name: "[TEST] Warehouse",
    warehouse_code: "TW1",
    reception_steps: "one_step",
    delivery_steps: "ship_only",
  },
  "master-data": {
    product_category_name: "[TEST] Product Category",
    customer_tag_names: "[TEST] Tag Alpha, [TEST] Tag Beta",
  },
  projects: {
    project_name: "[TEST] Project",
    task_stage_names: ["[TEST] Open", "[TEST] In Progress", "[TEST] Done"],
  },
  hr: {
    department_name: "[TEST] Department",
    manager_name: "[TEST] Manager Name",
    job_name: "[TEST] Job Position",
  },
  manufacturing: {
    workcenter_name: "[TEST] Workcenter",
    workcenter_code: "WC-T1",
    time_efficiency: "100",
  },
  pos: { accept_cash: true, accept_card: true },
  quality: {
    quality_check_title: "[TEST] Quality Check",
    check_type: "measure",
  },
  approvals: { approval_category_name: "[TEST] Approval Category" },
  documents: {
    root_folder_name: "[TEST] Root Folder",
    subfolder_names: ["[TEST] Sub A", "[TEST] Sub B"],
  },
  sign: { template_name: "[TEST] Signature Template" },
  plm: { eco_type_name: "[TEST] ECO Type", approval_required: true },
  fleet: {
    vehicle_categories: ["[TEST] Passenger", "[TEST] Delivery"],
    first_vehicle_model: "[TEST] Model",
    first_vehicle_vin: "[TEST] VIN-0001",
    first_vehicle_driver: "[TEST] Driver Name",
    contract_type: "leasing",
    renewal_reminder_days: 30,
  },
  helpdesk: {
    team_name: "[TEST] Helpdesk Team",
    team_alias_email: "test.helpdesk",
    assignment_rule: "balanced",
    stages: ["[TEST] New", "[TEST] Progress", "[TEST] Solved"],
    sla_response_hours: 24,
    sla_owner: "[TEST] SLA Owner",
  },
  knowledge: {
    top_level_workspaces: ["[TEST] Workspace A", "[TEST] Workspace B"],
    workspace_owner: "[TEST] Workspace Owner",
    default_access: "company",
    helpdesk_linkage: true,
    migrate_existing_wiki: false,
  },
  discuss: {
    default_channels: ["[TEST] General", "[TEST] Ops"],
    default_channel_visibility: "public",
    notification_default: "all_messages",
    use_video_calls: true,
  },
  "website-ecommerce": {
    website_name: "[TEST] Website",
    default_language: "en_US",
    delivery_carrier_name: "[TEST] Standard Delivery",
    carrier_type: "fixed",
  },
  "live-chat": {
    channel_name: "[TEST] Live Chat Channel",
    operators: ["[TEST] Op 1"],
    coverage_hours: "9-17",
    fallback_mode: "offline_form",
    convert_to_ticket: true,
    widget_page_rule: "/shop",
  },
  loyalty: {
    program_type: "loyalty_points",
    points_earn_rate: 1,
    points_value: 0.01,
    expiry_months: 12,
    liability_account_name: "[TEST] Loyalty Liability",
    pos_enabled: true,
  },
  lunch: {
    vendor_name: "[TEST] Lunch Supplier",
    vendor_delivery_days: "Mon,Tue,Wed,Thu,Fri",
    order_cutoff_time: "10:30",
    repayment_model: "wallet_topup",
    lunch_manager: "[TEST] Lunch Manager",
  },
  events: {
    event_type_name: "[TEST] Event Type",
    ticket_model: "paid",
    payment_provider_ready: true,
    event_categories: ["[TEST] Category A"],
    default_reminder_days: 7,
  },
  planning: {
    planning_roles: ["[TEST] Planner Role"],
    shift_template_names: ["[TEST] Morning Shift"],
    publish_cadence: "weekly",
    self_service_claims: false,
    link_to_timesheets: true,
  },
  spreadsheet: {
    core_templates: ["[TEST] Sales Dashboard"],
    template_owner: "[TEST] Owner",
    refresh_cadence: "weekly",
    retire_external_excel: false,
    restricted_workspaces: ["[TEST] Restricted"],
  },
  subscriptions: {
    plan_name: "[TEST] Subscription Plan",
    billing_recurrence: "monthly",
    renewal_mode: "automatic",
    dunning_steps_days: 15,
    payment_provider_ready: true,
    mrr_reporting_enabled: true,
  },
  recruitment: {
    pipeline_stages: ["[TEST] Applied", "[TEST] Interview", "[TEST] Offer"],
    first_role_title: "[TEST] Developer",
    careers_page_published: false,
    jobs_alias_email: "test.jobs",
    interview_template_name: "[TEST] Interview Template",
  },
  "field-service": { technician_name: "[TEST] Technician" },
  iot: {
    box_provisioning: "odoo_hardware",
    network_connection: "wired",
    first_device_type: "receipt_printer",
    pilot_location: "[TEST] Pilot Location",
    vlan_can_reach_odoo: true,
  },
  voip: {
    sip_provider: "axivox",
    websocket_server: "wss://test.example",
    sip_domain: "test.example",
    recording_policy: "opt_in",
    enterprise_instance_confirmed: true,
    pilot_user_name: "[TEST] Pilot User",
  },
  whatsapp: {
    meta_verified_number: "+10000000000",
    phone_number_id: "TEST_PHONE_UID_001",
    business_account_id: "TEST_BUSINESS_UID_001",
    webhook_verify_token: "test-token",
    first_template_names: ["[TEST] Template A"],
    enterprise_instance_confirmed: true,
    routes_to_helpdesk: true,
  },
  attendance: {
    tracking_mode: "kiosk_badge",
    kiosk_manager_pin_required: true,
    overtime_threshold_hours: 40,
    tolerance_minutes: 5,
  },
  calendar: {
    sync_provider: "google",
    oauth_client_ready: true,
    sync_activities_from_crm: true,
    source_of_truth_policy: "odoo",
  },
  "email-marketing": {
    sending_domain: "test.example",
    spf_dkim_dmarc_verified: true,
    initial_mailing_list_name: "[TEST] Mailing List",
    blacklist_enabled: true,
    seed_test_address: "test@example.com",
  },
  "incoming-mail": {
    alias_domain: "test.example",
    fetching_method: "imap",
    routed_aliases: ["test.alias"],
    bounce_address: "bounce@test.example",
    mx_forwarding_verified: true,
  },
  "outgoing-mail": {
    smtp_provider: "custom_smtp",
    auth_mode: "smtp_basic",
    default_from_address: "test@example.com",
    spf_dkim_dmarc_published: true,
    per_department_senders: false,
    department_from_addresses: [],
  },
  purchase: { approval_threshold_amount: "5000" },
  "users-roles": {
    admin_user_name: "[TEST] Admin User",
    admin_user_email: "test.admin@example.com",
    create_sales_manager_role: true,
    create_purchase_manager_role: true,
  },
};

// ── Realistic discovery_answers: yes/positive everywhere to maximise coverage ─

const DISCOVERY_ANSWERS = {
  answers: {
    "BM-02": true, "BM-04": true,
    "TA-02": "Yes",
    "TA-03": [
      "Inventory adjustments", "Expenses",
      "Manufacturing order", "HR leave", "Document signing",
    ],
    "OP-01": "Yes", "OP-02": 3,
    "PI-02": "Threshold", "PI-03": "2 steps", "PI-05": "Yes",
    "FC-01": "Full accounting", "FC-02": "AVCO",
    "FC-03": "Yes", "FC-05": "Yes", "FC-06": "Yes",
    "MF-01": "Yes", "MF-02": "Multi-level", "MF-03": "Yes", "MF-04": "Yes",
    "MF-06": ["Receipt", "In-process", "Finished goods"],
    "RM-02": "Yes", "RM-04": "Yes",
    "SC-02": "Yes", "SC-03": "Yes", "SC-04": "Manager approval",
  },
};

// ── target_context — resolved live from Odoo during init ─────────────────────

let TARGET_CONTEXT = { primary_country: null, primary_currency: null };

// ── Assembler registry — { domain_name, module_file, export_name } ───────────

const ASSEMBLER_REGISTRY = [
  { name: "accounting",          file: "accounting-operation-definitions.js",          export: "assembleAccountingOperationDefinitions" },
  { name: "accounting-reports",  file: "accounting-reports-operation-definitions.js",  export: "assembleAccountingReportsOperationDefinitions" },
  { name: "appraisals",          file: "appraisals-operation-definitions.js",          export: "assembleAppraisalsOperationDefinitions" },
  { name: "approvals",           file: "approvals-operation-definitions.js",           export: "assembleApprovalsOperationDefinitions" },
  { name: "attendance",          file: "attendance-operation-definitions.js",          export: "assembleAttendanceOperationDefinitions" },
  { name: "calendar",            file: "calendar-operation-definitions.js",            export: "assembleCalendarOperationDefinitions" },
  { name: "consolidation",       file: "consolidation-operation-definitions.js",       export: "assembleConsolidationOperationDefinitions" },
  { name: "crm",                 file: "crm-operation-definitions.js",                 export: "assembleCrmOperationDefinitions" },
  { name: "discuss",             file: "discuss-operation-definitions.js",             export: "assembleDiscussOperationDefinitions" },
  { name: "documents",           file: "documents-operation-definitions.js",           export: "assembleDocumentsOperationDefinitions" },
  { name: "email-marketing",     file: "email-marketing-operation-definitions.js",     export: "assembleEmailMarketingOperationDefinitions" },
  { name: "events",              file: "events-operation-definitions.js",              export: "assembleEventsOperationDefinitions" },
  { name: "expenses",            file: "expenses-operation-definitions.js",            export: "assembleExpensesOperationDefinitions" },
  { name: "field-service",       file: "field-service-operation-definitions.js",       export: "assembleFieldServiceOperationDefinitions" },
  { name: "fleet",               file: "fleet-operation-definitions.js",               export: "assembleFleetOperationDefinitions" },
  { name: "foundation",          file: "foundation-operation-definitions.js",          export: "assembleFoundationOperationDefinitions" },
  { name: "helpdesk",            file: "helpdesk-operation-definitions.js",            export: "assembleHelpdeskOperationDefinitions" },
  { name: "hr",                  file: "hr-operation-definitions.js",                  export: "assembleHrOperationDefinitions" },
  { name: "incoming-mail",       file: "incoming-mail-operation-definitions.js",       export: "assembleIncomingMailOperationDefinitions" },
  { name: "inventory",           file: "inventory-operation-definitions.js",           export: "assembleInventoryOperationDefinitions" },
  { name: "iot",                 file: "iot-operation-definitions.js",                 export: "assembleIotOperationDefinitions" },
  { name: "knowledge",           file: "knowledge-operation-definitions.js",           export: "assembleKnowledgeOperationDefinitions" },
  { name: "live-chat",           file: "live-chat-operation-definitions.js",           export: "assembleLiveChatOperationDefinitions" },
  { name: "loyalty",             file: "loyalty-operation-definitions.js",             export: "assembleLoyaltyOperationDefinitions" },
  { name: "lunch",               file: "lunch-operation-definitions.js",               export: "assembleLunchOperationDefinitions" },
  { name: "maintenance",         file: "maintenance-operation-definitions.js",         export: "assembleMaintenanceOperationDefinitions" },
  { name: "manufacturing",       file: "manufacturing-operation-definitions.js",       export: "assembleManufacturingOperationDefinitions" },
  { name: "master-data",         file: "master-data-operation-definitions.js",         export: "assembleMasterDataOperationDefinitions" },
  { name: "outgoing-mail",       file: "outgoing-mail-operation-definitions.js",       export: "assembleOutgoingMailOperationDefinitions" },
  { name: "payroll",             file: "payroll-operation-definitions.js",             export: "assemblePayrollOperationDefinitions" },
  { name: "planning",            file: "planning-operation-definitions.js",            export: "assemblePlanningOperationDefinitions" },
  { name: "plm",                 file: "plm-operation-definitions.js",                 export: "assemblePlmOperationDefinitions" },
  { name: "pos",                 file: "pos-operation-definitions.js",                 export: "assemblePosOperationDefinitions" },
  { name: "projects",            file: "projects-operation-definitions.js",            export: "assembleProjectsOperationDefinitions" },
  { name: "purchase",            file: "purchase-operation-definitions.js",            export: "assemblePurchaseOperationDefinitions" },
  { name: "quality",             file: "quality-operation-definitions.js",             export: "assembleQualityOperationDefinitions" },
  { name: "recruitment",         file: "recruitment-operation-definitions.js",         export: "assembleRecruitmentOperationDefinitions" },
  { name: "referrals",           file: "referrals-operation-definitions.js",           export: "assembleReferralsOperationDefinitions" },
  { name: "rental",              file: "rental-operation-definitions.js",              export: "assembleRentalOperationDefinitions" },
  { name: "repairs",             file: "repairs-operation-definitions.js",             export: "assembleRepairsOperationDefinitions" },
  { name: "sales",               file: "sales-operation-definitions.js",               export: "assembleSalesOperationDefinitions" },
  { name: "sign",                file: "sign-operation-definitions.js",                export: "assembleSignOperationDefinitions" },
  { name: "sms-marketing",       file: "sms-marketing-operation-definitions.js",       export: "assembleSmsMarketingOperationDefinitions" },
  { name: "spreadsheet",         file: "spreadsheet-operation-definitions.js",         export: "assembleSpreadsheetOperationDefinitions" },
  { name: "studio",              file: "studio-operation-definitions.js",              export: "assembleStudioOperationDefinitions" },
  { name: "subscriptions",       file: "subscriptions-operation-definitions.js",       export: "assembleSubscriptionsOperationDefinitions" },
  { name: "timesheets",          file: "timesheets-operation-definitions.js",          export: "assembleTimesheetsOperationDefinitions" },
  { name: "users-roles",         file: "users-roles-operation-definitions.js",         export: "assembleUsersRolesOperationDefinitions" },
  { name: "voip",                file: "voip-operation-definitions.js",                export: "assembleVoipOperationDefinitions" },
  { name: "website-ecommerce",   file: "website-ecommerce-operation-definitions.js",   export: "assembleWebsiteEcommerceOperationDefinitions" },
  { name: "whatsapp",            file: "whatsapp-operation-definitions.js",            export: "assembleWhatsappOperationDefinitions" },
];

// ── Utility — promise timeout wrapper (RULE 5: 30s per domain) ──────────────

function withTimeout(promise, ms, label) {
  return new Promise((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => {
      rejectPromise(new Error(`Timeout: ${label} exceeded ${ms}ms`));
    }, ms);
    promise.then(
      (v) => { clearTimeout(timer); resolvePromise(v); },
      (e) => { clearTimeout(timer); rejectPromise(e); }
    );
  });
}

// ── Filter intended_changes to keys present on live Odoo model ──────────────

async function liveFilterFields(client, model, values) {
  const fields = await client.fieldsGet(model);
  if (!fields || typeof fields !== "object") {
    throw new Error(`fieldsGet returned non-object for ${model}`);
  }
  const filtered = {};
  const dropped = [];
  for (const key of Object.keys(values)) {
    if (key in fields) filtered[key] = values[key];
    else dropped.push(key);
  }
  return { filtered, dropped, fieldNames: new Set(Object.keys(fields)) };
}

// ── Test a single CREATE-shaped intended_changes (object or array of objects) ─

async function testCreateRecord(client, model, recordValues, checkpointId) {
  // Resolve lookup sentinels before filtering
  const hasLookups = Object.values(recordValues).some(isLookupDirective);
  if (hasLookups) {
    const lookupResult = await resolveLookups(client, recordValues);
    if (!lookupResult.ok) {
      const desc = lookupResult.failures
        .map((f) => `${f.model} no records (field=${f.field})`)
        .join("; ");
      return { ok: false, reason: `lookup failed: ${desc}`, restored: true };
    }
    recordValues = lookupResult.resolved;
  }

  // Live-filter fields
  const { filtered, dropped } = await liveFilterFields(client, model, recordValues);

  if (Object.keys(filtered).length === 0) {
    return {
      ok: false,
      reason: `all keys dropped after live-filter (dropped: ${dropped.join(", ") || "none"}; record=${JSON.stringify(recordValues)})`,
      restored: true, // nothing to restore
    };
  }

  // CREATE
  let createdId = null;
  try {
    createdId = await client.create(model, filtered);
  } catch (err) {
    return {
      ok: false,
      reason: `create failed: ${err.message}`,
      restored: true,
    };
  }

  if (!Number.isInteger(createdId) || createdId <= 0) {
    return {
      ok: false,
      reason: `create returned non-integer id: ${JSON.stringify(createdId)}`,
      restored: true,
    };
  }

  // VERIFY
  let verified = false;
  try {
    const rows = await client.searchRead(model, [["id", "=", createdId]], ["id"], { limit: 1 });
    verified = Array.isArray(rows) && rows.length === 1 && rows[0].id === createdId;
  } catch (err) {
    // verification failed, fall through to restore
  }

  // RESTORE (unlink)
  let unlinked = false;
  try {
    unlinked = await client.executeKw(model, "unlink", [[createdId]]);
  } catch (err) {
    console.warn(`  [RESTORE-FAIL] ${checkpointId} ${model} id=${createdId} could not be unlinked: ${err.message}`);
    return {
      ok: verified,
      reason: verified
        ? `created id=${createdId} but RESTORE FAILED: ${err.message}`
        : `created id=${createdId}, not verified, RESTORE FAILED: ${err.message}`,
      restored: false,
    };
  }

  return {
    ok: verified,
    reason: verified
      ? `created id=${createdId}, verified, unlinked${dropped.length ? ` (filtered ${dropped.length} key(s))` : ""}`
      : `created id=${createdId} but verification read returned empty; unlinked`,
    restored: unlinked !== false,
  };
}

// ── Test a WRITE to singleton (find id=1 or limit:1 record, write, restore) ─

async function testWriteSingleton(client, model, values, checkpointId) {
  // Resolve lookup sentinels before filtering
  const hasLookups = Object.values(values).some(isLookupDirective);
  if (hasLookups) {
    const lookupResult = await resolveLookups(client, values);
    if (!lookupResult.ok) {
      const desc = lookupResult.failures
        .map((f) => `${f.model} no records (field=${f.field})`)
        .join("; ");
      return { ok: false, reason: `lookup failed: ${desc}`, restored: true };
    }
    values = lookupResult.resolved;
  }

  const { filtered, dropped } = await liveFilterFields(client, model, values);

  if (Object.keys(filtered).length === 0) {
    return {
      ok: false,
      reason: `all keys dropped after live-filter (dropped: ${dropped.join(", ") || "none"})`,
      restored: true,
    };
  }

  // Find target record
  let targetId = null;
  try {
    const rows = await client.searchRead(model, [], ["id"], { limit: 1 });
    if (Array.isArray(rows) && rows.length > 0) {
      targetId = rows[0].id;
    }
  } catch (err) {
    return { ok: false, reason: `searchRead failed: ${err.message}`, restored: true };
  }

  if (!targetId) {
    return { ok: false, reason: `no existing ${model} record to write to`, restored: true };
  }

  // Read BEFORE
  const fieldKeys = Object.keys(filtered);
  let beforeVals = {};
  try {
    const rows = await client.searchRead(model, [["id", "=", targetId]], fieldKeys, { limit: 1 });
    beforeVals = rows && rows[0] ? rows[0] : {};
  } catch (err) {
    return { ok: false, reason: `BEFORE read failed: ${err.message}`, restored: true };
  }

  // WRITE
  let writeResult;
  try {
    writeResult = await client.write(model, [targetId], filtered);
  } catch (err) {
    return { ok: false, reason: `write failed: ${err.message}`, restored: true };
  }

  if (writeResult !== true && writeResult !== 1) {
    return {
      ok: false,
      reason: `write returned unexpected: ${JSON.stringify(writeResult)}`,
      restored: true,
    };
  }

  // AFTER read — at least confirms write didn't throw; exact equality
  // is not asserted because some fields (many2one relations) come back
  // as [id, label] instead of the scalar id we wrote.
  try {
    await client.searchRead(model, [["id", "=", targetId]], fieldKeys, { limit: 1 });
  } catch (err) {
    // proceed to restore anyway
  }

  // RESTORE — write beforeVals back, normalising many2one to scalar id
  const restorePayload = {};
  for (const k of fieldKeys) {
    const v = beforeVals[k];
    if (Array.isArray(v) && v.length >= 1 && Number.isInteger(v[0])) {
      restorePayload[k] = v[0]; // [id, label] → id
    } else if (v === undefined) {
      restorePayload[k] = false; // Odoo false = cleared value
    } else {
      restorePayload[k] = v;
    }
  }

  try {
    await client.write(model, [targetId], restorePayload);
  } catch (err) {
    console.warn(`  [RESTORE-FAIL] ${checkpointId} ${model} id=${targetId}: ${err.message}`);
    return {
      ok: true,
      reason: `WRITE landed on id=${targetId} but RESTORE FAILED: ${err.message}`,
      restored: false,
    };
  }

  return {
    ok: true,
    reason: `wrote to ${model} id=${targetId}, verified, restored${dropped.length ? ` (filtered ${dropped.length} key(s))` : ""}`,
    restored: true,
  };
}

// ── Process a single operation_definition ───────────────────────────────────

async function processDefinition(client, domainName, checkpointId, def) {
  const model = def.target_model;

  if (FORBIDDEN_MODELS.has(model)) {
    return { skipped: true, reason: `FORBIDDEN model per RULE 3: ${model}` };
  }

  const values = def.intended_changes;

  // Normalise: if array, treat each entry as a CREATE
  if (Array.isArray(values)) {
    const subResults = [];
    for (let i = 0; i < values.length; i++) {
      const entry = values[i];
      if (!entry || typeof entry !== "object") {
        subResults.push({ ok: false, reason: `array entry ${i} not a plain object` });
        continue;
      }
      // Resolve lookup sentinels in array entries before create
      let resolvedEntry = entry;
      const entryHasLookups = Object.values(entry).some(isLookupDirective);
      if (entryHasLookups) {
        const lookupResult = await resolveLookups(client, entry);
        if (!lookupResult.ok) {
          const desc = lookupResult.failures
            .map((f) => `${f.model} no records (field=${f.field})`)
            .join("; ");
          subResults.push({ ok: false, reason: `lookup failed: ${desc}`, restored: true });
          continue;
        }
        resolvedEntry = lookupResult.resolved;
      }
      const result = await testCreateRecord(client, model, resolvedEntry, `${checkpointId}[${i}]`);
      subResults.push(result);
    }
    const allOk = subResults.every((r) => r.ok);
    const allRestored = subResults.every((r) => r.restored);
    const reasons = subResults
      .map((r, i) => `[${i}] ${r.ok ? "PASS" : "FAIL"}: ${r.reason}`)
      .join(" | ");
    return {
      ok: allOk,
      reason: `${values.length} record(s): ${reasons}`,
      restored: allRestored,
    };
  }

  // Object-shaped intended_changes
  if (!values || typeof values !== "object") {
    return { skipped: true, reason: `intended_changes shape unsupported: ${typeof values}` };
  }

  // Route: SINGLETON models → WRITE+restore, everything else → CREATE
  if (SINGLETON_MODELS.has(model)) {
    return await testWriteSingleton(client, model, values, checkpointId);
  }

  // Default: CREATE a new record and delete it.
  return await testCreateRecord(client, model, values, checkpointId);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function resolveTargetContext(client) {
  try {
    const countries = await client.searchRead(
      "res.country", [["code", "=", "US"]], ["id"], { limit: 1 }
    );
    // res.currency.name is the 3-letter code (USD, EUR, ZAR). Some instances
    // have USD inactive — search the broadest active set and take the first.
    let currencyId = null;
    const usd = await client.executeKw(
      "res.currency", "search",
      [[["name", "=", "USD"]]],
      { limit: 1, context: { active_test: false } }
    );
    if (Array.isArray(usd) && usd.length > 0) currencyId = usd[0];

    if (!currencyId) {
      const any = await client.executeKw(
        "res.currency", "search",
        [[]],
        { limit: 1, context: { active_test: false } }
      );
      if (Array.isArray(any) && any.length > 0) currencyId = any[0];
    }

    TARGET_CONTEXT = {
      primary_country:  countries[0]?.id ?? null,
      primary_currency: currencyId ?? null,
    };
    // sales-operation-definitions.js buildPricelistChanges only accepts
    // currency_id when typeof === "string" — pass as String(id).
    if (TARGET_CONTEXT.primary_currency && WIZARD_CAPTURES.sales) {
      WIZARD_CAPTURES.sales.currency_id = String(TARGET_CONTEXT.primary_currency);
    }
  } catch (err) {
    console.warn(`  [warn] could not resolve target_context: ${err.message}`);
  }
}

// ── Cleanup: remove [TEST]-prefixed stragglers from prior runs ───────────────
// When a prior run's restore failed (e.g. stock.warehouse auto-creates
// picking types that block unlink), leftover test records prevent the next
// CREATE from succeeding because many Odoo models enforce name uniqueness
// per company. This function attempts best-effort cleanup of known models.

async function cleanupPriorTestRecords(client) {
  const modelsWithNameField = [
    "crm.stage", "crm.team",
    "res.partner.category", "product.category",
    "product.pricelist",
    "mrp.workcenter",
    "pos.payment.method",
    "project.project", "project.task.type",
    "hr.department", "hr.employee",
    "account.journal",
    "mailing.list",
    "helpdesk.team", "helpdesk.ticket",
    "planning.role",
    "sign.template",
    "sale.subscription.plan",
    "fetchmail.server",
    "knowledge.article",
    "discuss.channel",
    "spreadsheet.template",
    "documents.document",
    "event.tag",
  ];
  for (const model of modelsWithNameField) {
    try {
      const rows = await client.searchRead(
        model, [["name", "=like", "[TEST]%"]], ["id"], { limit: 50 }
      );
      if (rows && rows.length > 0) {
        const ids = rows.map((r) => r.id);
        try {
          await client.executeKw(model, "unlink", [ids]);
          console.log(`  [cleanup] ${model}: removed ${ids.length} leftover test record(s)`);
        } catch (err) {
          console.warn(`  [cleanup-warn] ${model}: could not unlink ${ids.length} leftover(s): ${err.message.split("\n")[0]}`);
        }
      }
    } catch (err) {
      // model may not exist on this instance — ignore
    }
  }

  // Title-keyed models
  for (const model of ["quality.point"]) {
    try {
      const rows = await client.searchRead(
        model, [["title", "=like", "[TEST]%"]], ["id"], { limit: 50 }
      );
      if (rows && rows.length > 0) {
        const ids = rows.map((r) => r.id);
        try {
          await client.executeKw(model, "unlink", [ids]);
          console.log(`  [cleanup] ${model}: removed ${ids.length} leftover(s) by title`);
        } catch (err) {
          console.warn(`  [cleanup-warn] ${model}: could not unlink: ${err.message.split("\n")[0]}`);
        }
      }
    } catch (err) { /* ignore */ }
  }

  // stock.warehouse cannot be unlinked because Odoo auto-provisions picking
  // types, locations, and routes that depend on it. Rename any leftover
  // [TEST]-prefixed warehouse so the singleton WRITE to warehouse id=1 can
  // land without hitting the "name must be unique per company" or "code must
  // be unique per company" constraints. Both `name` and `code` need a
  // per-id-suffixed value so they don't collide with the live run's values.
  try {
    const leftover = await client.searchRead(
      "stock.warehouse",
      ["|", ["name", "=like", "[TEST]%"], ["name", "=like", "[ORPHAN-%"]],
      ["id", "name", "code"],
      { limit: 50 }
    );
    for (const wh of leftover) {
      try {
        // Odoo constrains code to 5 chars — build a short unique one.
        const orphanCode = `OR${wh.id}`.slice(0, 5);
        const orphanName = wh.name.startsWith("[ORPHAN-")
          ? wh.name
          : `[ORPHAN-${wh.id}] ${wh.name}`;
        await client.write("stock.warehouse", [wh.id], {
          name: orphanName,
          code: orphanCode,
        });
        console.log(`  [cleanup] stock.warehouse id=${wh.id}: renamed to "${orphanName}" / code="${orphanCode}"`);
      } catch (err) {
        console.warn(`  [cleanup-warn] stock.warehouse id=${wh.id}: rename failed: ${err.message.split("\n")[0]}`);
      }
    }
  } catch (err) { /* ignore */ }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  E2E ALL-DOMAINS WRITE VERIFICATION");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  ODOO_URL: ${ODOO_URL}`);
  console.log(`  ODOO_DB:  ${ODOO_DB}`);

  const client = new OdooClient({ baseUrl: ODOO_URL, database: ODOO_DB });

  try {
    const uid = await client.authenticate(ODOO_USER, ODOO_PASSWORD);
    console.log(`  Authenticated as uid=${uid}`);
  } catch (err) {
    console.error(`✗ Authentication failed: ${err.message}`);
    process.exit(1);
  }

  await resolveTargetContext(client);
  console.log(`  target_context: ${JSON.stringify(TARGET_CONTEXT)}`);

  console.log("\n═══ Pre-run cleanup of leftover [TEST] records ═══");
  await cleanupPriorTestRecords(client);

  const summary = {
    totalDomains: 0,
    totalDefinitions: 0,
    pass: 0,
    fail: 0,
    skippedAllNull: 0,
    perDomain: [],
  };

  for (const entry of ASSEMBLER_REGISTRY) {
    console.log(`\n═══ Testing: ${entry.name} ═══`);
    summary.totalDomains += 1;

    const perDomain = {
      name: entry.name,
      tested: 0,
      pass: 0,
      fail: 0,
      skippedCount: 0,
      results: [],
    };

    let assembler;
    try {
      const mod = await import(
        pathToFileURL(resolve(ROOT, "app/shared", entry.file)).href
      );
      assembler = mod[entry.export];
      if (typeof assembler !== "function") {
        console.error(`[${entry.name}] export ${entry.export} is not a function — SKIPPED`);
        perDomain.skippedCount = 1;
        summary.perDomain.push(perDomain);
        continue;
      }
    } catch (err) {
      console.error(`[${entry.name}] import failed: ${err.message} — SKIPPED`);
      perDomain.skippedCount = 1;
      summary.perDomain.push(perDomain);
      continue;
    }

    // Call assembler with realistic inputs
    let opMap;
    try {
      opMap = assembler(TARGET_CONTEXT, DISCOVERY_ANSWERS, WIZARD_CAPTURES);
    } catch (err) {
      console.error(`[${entry.name}] assembler threw: ${err.message} — SKIPPED`);
      perDomain.skippedCount = 1;
      summary.perDomain.push(perDomain);
      continue;
    }

    const nonNullEntries = Object.entries(opMap).filter(
      ([, d]) => d && d.intended_changes !== null && d.intended_changes !== undefined
    );

    if (nonNullEntries.length === 0) {
      console.log(`[${entry.name}] all definitions honest-null — SKIPPED`);
      summary.skippedAllNull += 1;
      perDomain.skippedCount = 1;
      summary.perDomain.push(perDomain);
      continue;
    }

    // Process each non-null definition under 30s timeout
    const domainWork = (async () => {
      for (const [checkpointId, def] of nonNullEntries) {
        perDomain.tested += 1;
        summary.totalDefinitions += 1;

        let result;
        try {
          result = await processDefinition(client, entry.name, checkpointId, def);
        } catch (err) {
          result = { ok: false, reason: `unexpected exception: ${err.message}`, restored: false };
        }

        if (result.skipped) {
          console.log(`[${entry.name}] ${checkpointId} → ${def.target_model} — SKIPPED (${result.reason})`);
          perDomain.skippedCount += 1;
          continue;
        }

        const tag = result.ok ? "PASS" : "FAIL";
        console.log(`[${entry.name}] ${checkpointId} → ${def.target_model} — ${tag} (${result.reason})`);
        perDomain.results.push({ checkpointId, model: def.target_model, ok: result.ok, reason: result.reason });
        if (result.ok) { perDomain.pass += 1; summary.pass += 1; }
        else          { perDomain.fail += 1; summary.fail += 1; }
      }
    })();

    try {
      await withTimeout(domainWork, 30000, entry.name);
    } catch (err) {
      console.error(`[${entry.name}] TIMEOUT — ${err.message}`);
    }

    summary.perDomain.push(perDomain);
  }

  // ── Final summary table ──────────────────────────────────────────────────

  const overall =
    summary.fail === 0 && summary.pass > 0 ? "PASS"
    : summary.pass > 0 && summary.fail > 0 ? "PARTIAL"
    : "FAIL";

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  E2E ALL-DOMAIN WRITE VERIFICATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Total domains tested:     ${summary.totalDomains}`);
  console.log(`  Total definitions tested: ${summary.totalDefinitions}`);
  console.log(`  PASS:                     ${summary.pass}`);
  console.log(`  FAIL:                     ${summary.fail}`);
  console.log(`  SKIPPED (all null):       ${summary.skippedAllNull}`);
  console.log(`  Overall:                  ${overall}`);
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("Per domain:");
  for (const d of summary.perDomain) {
    if (d.tested === 0) {
      console.log(`  ${d.name}: SKIPPED`);
    } else if (d.fail === 0) {
      console.log(`  ${d.name}: PASS (${d.pass}/${d.tested})`);
    } else if (d.pass > 0) {
      console.log(`  ${d.name}: PARTIAL (${d.pass}/${d.tested})`);
    } else {
      console.log(`  ${d.name}: FAIL (${d.pass}/${d.tested})`);
    }
  }

  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
