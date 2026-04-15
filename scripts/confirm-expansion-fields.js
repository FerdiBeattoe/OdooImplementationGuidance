// ---------------------------------------------------------------------------
// Confirm Expansion Fields — extends odoo-confirmed-fields.json with every
// implementation-configuration model discovered across the 51 domains that
// is not yet confirmed. Calls client.fieldsGet on each target using the exact
// attribute set the task specifies. 404s are logged and skipped (module not
// installed) — the script continues instead of failing closed.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { OdooClient } from "../app/backend/odoo-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Target models — discovered across all *-operation-definitions.js files
// (target_model literals + *_MODEL const declarations) minus the task's
// hard-excluded transactional/schema set and minus models already present in
// odoo-confirmed-fields.json.
// ---------------------------------------------------------------------------
const TARGET_MODELS = [
  "account.financial.html.report",
  "account.report",
  "calendar.event",
  "consolidation.company",
  "consolidation.period",
  "event.event",
  "event.tag",
  "fetchmail.server",
  "fleet.vehicle",
  "fleet.vehicle.model",
  "helpdesk.team",
  "helpdesk.ticket",
  "hr.applicant",
  "hr.appraisal",
  "hr.appraisal.goal",
  "hr.attendance",
  "hr.expense",
  "hr.expense.sheet",
  "hr.payslip",
  "hr.referral",
  "hr.referral.stage",
  "hr.salary.rule",
  "hr.timesheet",
  "im_livechat.channel",
  "iot.device",
  "ir.config_parameter",
  "ir.mail_server",
  "knowledge.article",
  "loyalty.program",
  "loyalty.reward",
  "lunch.product",
  "lunch.supplier",
  "mail.alias",
  "mail.channel",
  "mailing.list",
  "mailing.mailing",
  "maintenance.equipment",
  "maintenance.request",
  "planning.role",
  "planning.slot",
  "product.template",
  "project.task",
  "repair.order",
  "sms.sms",
  "spreadsheet.template",
  "uom.category",
  "voip.provider",
  "whatsapp.account",
  "whatsapp.template",
];

// ---------------------------------------------------------------------------
// Load .env — passwords NEVER stored anywhere else, read-only from disk.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Detect "module not installed" errors from the Odoo JSON-RPC response.
// Odoo returns KeyError: 'model.name' when the model is not registered.
// ---------------------------------------------------------------------------
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

async function main() {
  const env = loadEnv();
  console.log("ODOO_URL:     ", env.ODOO_URL);
  console.log("ODOO_DB:      ", env.ODOO_DB);
  console.log("ODOO_USER:    ", env.ODOO_USER);
  console.log("ODOO_PASSWORD:", maskPassword(env.ODOO_PASSWORD));
  console.log("");

  const client = new OdooClient({
    baseUrl: env.ODOO_URL,
    database: env.ODOO_DB,
  });

  const uid = await client.authenticate(env.ODOO_USER, env.ODOO_PASSWORD);
  console.log(`authenticated as uid ${uid}\n`);

  const versionInfo = await client.getVersionInfo();
  const odooVersion = versionInfo?.server_version || "unknown";
  console.log(`Odoo version: ${odooVersion}\n`);

  const confirmed = {};
  const notInstalled = [];
  const errors = [];

  for (const model of TARGET_MODELS) {
    try {
      const allFields = await client.fieldsGet(model, [
        "string", "type", "required", "selection", "relation",
      ]);

      if (!allFields || typeof allFields !== "object" || Array.isArray(allFields)) {
        errors.push({ model, error: "fieldsGet returned non-object response" });
        console.log(`  ${model} — ERROR (non-object response)`);
        continue;
      }

      const fields = {};
      for (const [fname, fdef] of Object.entries(allFields)) {
        const entry = { type: fdef.type, string: fdef.string || fname };
        if (fdef.type === "selection" && fdef.selection) {
          entry.selection = fdef.selection;
        }
        if (fdef.relation) {
          entry.relation = fdef.relation;
        }
        if (fdef.required) {
          entry.required = true;
        }
        fields[fname] = entry;
      }

      const count = Object.keys(fields).length;
      if (count === 0) {
        notInstalled.push(model);
        console.log(`  ${model} — NOT INSTALLED (empty field map)`);
        continue;
      }

      confirmed[model] = { fields };
      console.log(`  ${model} — ${count} fields confirmed`);
    } catch (err) {
      if (isModelNotInstalled(err)) {
        notInstalled.push(model);
        console.log(`  ${model} — NOT INSTALLED (${err.message || err})`);
      } else {
        errors.push({ model, error: err.message || String(err) });
        console.log(`  ${model} — ERROR: ${err.message || err}`);
      }
    }
  }

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

  const totalModels = Object.keys(existing.models).length;
  console.log("");
  console.log("--- Summary ---");
  console.log(`Models attempted:       ${TARGET_MODELS.length}`);
  console.log(`Models newly confirmed: ${Object.keys(confirmed).length}`);
  console.log(`Models not installed:   ${notInstalled.length}`);
  console.log(`Models with errors:     ${errors.length}`);
  console.log(`Total models in file:   ${totalModels}`);
  if (notInstalled.length) {
    console.log("");
    console.log("NOT INSTALLED (404 / empty response):");
    notInstalled.forEach((m) => console.log("  -", m));
  }
  if (errors.length) {
    console.log("");
    console.log("ERRORS:");
    errors.forEach((e) => console.log(`  - ${e.model}: ${e.error}`));
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
