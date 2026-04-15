// ---------------------------------------------------------------------------
// Install And Confirm Modules — installs the candidate Odoo 19 modules on the
// target instance (majestic.odoo.com saas~19.2+e), then re-runs fieldsGet for
// the 34 models that previously returned 404. Failures are logged and the run
// continues — we never fail-hard on a single install.
//
// Governance: AGENTS.md scopes "read-only environment inspection and module
// installation" as a supported platform operation. Credentials are loaded from
// .env only — never persisted, never logged in plaintext.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { OdooClient } from "../app/backend/odoo-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Modules to ensure installed. User-supplied list + the HR sub-modules the
// user's list implies (hr_recruitment, hr_appraisal, hr_attendance,
// hr_expense, hr_referral) — each is required for a 404'd model to resolve.
// ---------------------------------------------------------------------------
const MODULE_INSTALL_LIST = [
  "helpdesk",
  "hr_recruitment",        // provides hr.applicant
  "hr_appraisal",          // provides hr.appraisal, hr.appraisal.goal
  "hr_attendance",         // provides hr.attendance
  "hr_expense",            // provides hr.expense, hr.expense.sheet
  "hr_payroll",            // provides hr.payslip, hr.salary.rule
  "hr_referral",           // provides hr.referral, hr.referral.stage
  "hr_timesheet",          // provides hr.timesheet (user: "project_timesheet")
  "fleet",
  "maintenance",
  "repair",
  "event",
  "calendar",              // check installed
  "fetchmail",             // check installed
  "knowledge",
  "loyalty",
  "lunch",
  "mail",                  // check installed
  "mass_mailing",          // user: "mailing" → tech name is mass_mailing
  "im_livechat",
  "iot",
  "voip",
  "whatsapp",
  "account_reports",
  "account_consolidation", // user: "consolidation"
  "planning",
];

// ---------------------------------------------------------------------------
// 34 models that previously returned 404 / empty. After installs, these are
// the ones we retry fieldsGet on.
// ---------------------------------------------------------------------------
const TARGET_MODELS = [
  "helpdesk.team", "helpdesk.ticket",
  "hr.applicant", "hr.appraisal", "hr.appraisal.goal",
  "hr.attendance", "hr.expense", "hr.expense.sheet",
  "hr.payslip", "hr.referral", "hr.referral.stage",
  "hr.salary.rule", "hr.timesheet",
  "fleet.vehicle", "fleet.vehicle.model",
  "maintenance.equipment", "maintenance.request",
  "repair.order",
  "event.event", "event.tag",
  "loyalty.program", "loyalty.reward",
  "lunch.product", "lunch.supplier",
  "mail.channel",
  "im_livechat.channel",
  "iot.device",
  "voip.provider",
  "whatsapp.account", "whatsapp.template",
  "account.financial.html.report",
  "consolidation.company", "consolidation.period",
  "uom.category",
];

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env");
  const raw = readFileSync(envPath, "utf-8").replace(/^\uFEFF/, "");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
  return env;
}

function maskPassword(pw) {
  if (!pw) return "";
  if (pw.length <= 2) return "*".repeat(pw.length);
  return pw[0] + "*".repeat(pw.length - 2) + pw[pw.length - 1];
}

function isModelNotInstalled(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("keyerror") ||
    msg.includes("does not exist") ||
    msg.includes("not found") ||
    msg.includes("invalidmodel") ||
    msg.includes("model not found") ||
    msg.includes("model does not exist")
  );
}

async function authenticate(env) {
  const client = new OdooClient({ baseUrl: env.ODOO_URL, database: env.ODOO_DB });
  const uid = await client.authenticate(env.ODOO_USER, env.ODOO_PASSWORD);
  return { client, uid };
}

// ---------------------------------------------------------------------------
// STEP A — resolve candidate module names to {id, name, state}. Returns a
// map keyed by technical name. Missing names are omitted from the map.
// ---------------------------------------------------------------------------
async function getModuleStates(client, names) {
  const rows = await client.searchRead(
    "ir.module.module",
    [["name", "in", names]],
    ["id", "name", "state"],
    { limit: Math.max(names.length, 32) }
  );
  const map = new Map();
  for (const row of rows) {
    map.set(row.name, { id: row.id, name: row.name, state: row.state });
  }
  return map;
}

// ---------------------------------------------------------------------------
// STEP B — install one module by id. Returns { ok, state, error }.
// ---------------------------------------------------------------------------
async function installModule(client, id, name) {
  try {
    await client.executeKw("ir.module.module", "button_immediate_install", [[id]]);
    const rows = await client.searchRead(
      "ir.module.module",
      [["id", "=", id]],
      ["state"],
      { limit: 1 }
    );
    const state = rows[0]?.state || "unknown";
    return { ok: state === "installed", state, error: null };
  } catch (err) {
    return { ok: false, state: null, error: err.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// STEP C — fieldsGet one model. Returns { ok, fieldCount, fields, reason }.
// ---------------------------------------------------------------------------
async function confirmModelFields(client, model) {
  try {
    const allFields = await client.fieldsGet(model, [
      "string", "type", "required", "selection", "relation",
    ]);
    if (!allFields || typeof allFields !== "object" || Array.isArray(allFields)) {
      return { ok: false, reason: "non-object response" };
    }
    const fields = {};
    for (const [fname, fdef] of Object.entries(allFields)) {
      const entry = { type: fdef.type, string: fdef.string || fname };
      if (fdef.type === "selection" && fdef.selection) entry.selection = fdef.selection;
      if (fdef.relation) entry.relation = fdef.relation;
      if (fdef.required) entry.required = true;
      fields[fname] = entry;
    }
    const count = Object.keys(fields).length;
    if (count === 0) return { ok: false, reason: "empty field map (not installed)" };
    return { ok: true, fieldCount: count, fields };
  } catch (err) {
    if (isModelNotInstalled(err)) {
      return { ok: false, reason: `not installed: ${err.message || err}` };
    }
    return { ok: false, reason: `error: ${err.message || err}` };
  }
}

async function main() {
  // ------- load env, authenticate -------
  const env = loadEnv();
  console.log("ODOO_URL:     ", env.ODOO_URL);
  console.log("ODOO_DB:      ", env.ODOO_DB);
  console.log("ODOO_USER:    ", env.ODOO_USER);
  console.log("ODOO_PASSWORD:", maskPassword(env.ODOO_PASSWORD));
  console.log("");

  const { client: client1, uid } = await authenticate(env);
  console.log(`authenticated as uid ${uid}\n`);

  const versionInfo = await client1.getVersionInfo();
  const odooVersion = versionInfo?.server_version || "unknown";
  console.log(`Odoo version: ${odooVersion}\n`);

  // ------- resolve module states -------
  console.log("--- Module state before install ---");
  const stateBefore = await getModuleStates(client1, MODULE_INSTALL_LIST);
  const missingNames = [];
  for (const name of MODULE_INSTALL_LIST) {
    const info = stateBefore.get(name);
    if (!info) {
      console.log(`  ${name.padEnd(24)} — NOT FOUND in registry`);
      missingNames.push(name);
    } else {
      console.log(`  ${name.padEnd(24)} — ${info.state}`);
    }
  }
  console.log("");

  // ------- install loop -------
  console.log("--- Installing modules ---");
  const installResults = {};
  for (const name of MODULE_INSTALL_LIST) {
    const info = stateBefore.get(name);
    if (!info) {
      installResults[name] = { attempted: false, reason: "not in registry" };
      console.log(`  ${name.padEnd(24)} — SKIPPED (not in registry)`);
      continue;
    }
    if (info.state === "installed") {
      installResults[name] = { attempted: false, reason: "already installed" };
      console.log(`  ${name.padEnd(24)} — SKIPPED (already installed)`);
      continue;
    }
    if (info.state === "uninstallable") {
      installResults[name] = { attempted: false, reason: "uninstallable" };
      console.log(`  ${name.padEnd(24)} — SKIPPED (uninstallable)`);
      continue;
    }
    process.stdout.write(`  ${name.padEnd(24)} — installing… `);
    const result = await installModule(client1, info.id, name);
    if (result.ok) {
      console.log("OK");
      installResults[name] = { attempted: true, ok: true, state: result.state };
    } else {
      console.log(`FAIL (${result.error || result.state})`);
      installResults[name] = { attempted: true, ok: false, error: result.error || `state=${result.state}` };
    }
  }
  console.log("");

  // ------- re-authenticate (session groups may have changed after installs) -------
  console.log("--- Re-authenticating for fresh session ---");
  const { client: client2, uid: uid2 } = await authenticate(env);
  console.log(`re-authenticated as uid ${uid2}\n`);

  // ------- fieldsGet retry loop -------
  console.log("--- fieldsGet retry ---");
  const confirmed = {};
  const stillMissing = [];
  const errors = [];
  for (const model of TARGET_MODELS) {
    const result = await confirmModelFields(client2, model);
    if (result.ok) {
      confirmed[model] = { fields: result.fields };
      console.log(`  ${model.padEnd(40)} — ${result.fieldCount} fields confirmed`);
    } else {
      if (String(result.reason).startsWith("error:")) {
        errors.push({ model, error: result.reason });
        console.log(`  ${model.padEnd(40)} — ${result.reason}`);
      } else {
        stillMissing.push({ model, reason: result.reason });
        console.log(`  ${model.padEnd(40)} — ${result.reason}`);
      }
    }
  }
  console.log("");

  // ------- merge into odoo-confirmed-fields.json -------
  const outPath = resolve(__dirname, "odoo-confirmed-fields.json");
  const existing = JSON.parse(readFileSync(outPath, "utf-8"));
  if (!existing.models || typeof existing.models !== "object") {
    existing.models = {};
  }
  for (const [model, payload] of Object.entries(confirmed)) {
    existing.models[model] = payload;
  }
  existing.generated_at = new Date().toISOString();
  existing.odoo_version = odooVersion;
  writeFileSync(outPath, JSON.stringify(existing, null, 2), "utf-8");

  // ------- summary -------
  const totalModels = Object.keys(existing.models).length;
  const installedOk = Object.entries(installResults).filter(([, r]) => r.attempted && r.ok);
  const installFailed = Object.entries(installResults).filter(([, r]) => r.attempted && !r.ok);
  const installSkipped = Object.entries(installResults).filter(([, r]) => !r.attempted);

  console.log("--- Summary ---");
  console.log(`Modules attempted install:     ${installedOk.length + installFailed.length}`);
  console.log(`Modules installed OK:          ${installedOk.length}`);
  console.log(`Modules install failed:        ${installFailed.length}`);
  console.log(`Modules skipped:               ${installSkipped.length}`);
  console.log(`Models attempted confirm:      ${TARGET_MODELS.length}`);
  console.log(`Models newly confirmed:        ${Object.keys(confirmed).length}`);
  console.log(`Models still not installed:    ${stillMissing.length}`);
  console.log(`Models with errors:            ${errors.length}`);
  console.log(`Total models in JSON:          ${totalModels}`);

  if (installFailed.length) {
    console.log("\nINSTALL FAILED:");
    installFailed.forEach(([name, r]) => console.log(`  - ${name}: ${r.error}`));
  }
  if (stillMissing.length) {
    console.log("\nMODELS STILL NOT INSTALLED:");
    stillMissing.forEach((m) => console.log(`  - ${m.model} (${m.reason})`));
  }
  if (errors.length) {
    console.log("\nFIELDS-GET ERRORS:");
    errors.forEach((e) => console.log(`  - ${e.model}: ${e.error}`));
  }

  console.log("\nNewly confirmed models (for ALLOWED_APPLY_MODELS consideration):");
  Object.keys(confirmed).forEach((m) => console.log(`  - ${m}`));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
