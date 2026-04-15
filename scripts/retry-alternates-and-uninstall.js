// ---------------------------------------------------------------------------
// Retry Alternates And Uninstall
//
// Part A: Retries fields_get for the 9 still-missing models using their
// Odoo 19 canonical names where they differ from the legacy literals
// captured in *-operation-definitions.js files.
//
// Part B: Uninstalls the 18 modules installed by install-and-confirm-modules.js
// to free Odoo Online app-tier usage. Modules that were already installed
// before the run (calendar, knowledge, mail, mass_mailing, account_reports,
// planning) are preserved.
//
// Any install/uninstall failure is logged but does not halt the run. Reads
// credentials from .env only.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { OdooClient } from "../app/backend/odoo-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Alternate / canonical names in Odoo 19. Each entry is a legacy-name ->
// candidate-names-to-try pair. First match wins.
// ---------------------------------------------------------------------------
const ALTERNATE_NAMES = {
  "mail.channel":                  ["discuss.channel"],
  "hr.expense.sheet":              ["hr.expense.sheet", "hr.expense.report"],
  "hr.timesheet":                  ["account.analytic.line"],
  "hr.referral":                   ["hr.referral", "hr_referral.referral"],
  "hr.referral.stage":             ["hr.referral.stage", "hr_referral.stage"],
  "account.financial.html.report": ["account.report"],  // already in ALLOWED
  "consolidation.company":         ["consolidation.company"],
  "consolidation.period":          ["consolidation.period"],
  "uom.category":                  ["uom.category"],
};

// Keep only the name keys for ir.model lookup
const ALL_CANDIDATE_NAMES = [...new Set(Object.values(ALTERNATE_NAMES).flat())];

// ---------------------------------------------------------------------------
// Modules we want uninstalled. Must match the install list minus the ones
// already installed before our run (per install-and-confirm output).
// ---------------------------------------------------------------------------
const MODULES_TO_UNINSTALL = [
  "helpdesk",
  "hr_recruitment",
  "hr_appraisal",
  "hr_attendance",
  "hr_expense",
  "hr_payroll",
  "hr_referral",
  "hr_timesheet",
  "fleet",
  "maintenance",
  "repair",
  "event",
  "loyalty",
  "lunch",
  "im_livechat",
  "iot",
  "voip",
  "whatsapp",
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

async function authenticate(env) {
  const client = new OdooClient({ baseUrl: env.ODOO_URL, database: env.ODOO_DB });
  await client.authenticate(env.ODOO_USER, env.ODOO_PASSWORD);
  return client;
}

async function fetchFields(client, model) {
  try {
    const allFields = await client.fieldsGet(model, [
      "string", "type", "required", "selection", "relation",
    ]);
    if (!allFields || typeof allFields !== "object" || Array.isArray(allFields)) {
      return { ok: false, reason: "non-object response" };
    }
    const count = Object.keys(allFields).length;
    if (count === 0) return { ok: false, reason: "empty field map" };
    const fields = {};
    for (const [fname, fdef] of Object.entries(allFields)) {
      const entry = { type: fdef.type, string: fdef.string || fname };
      if (fdef.type === "selection" && fdef.selection) entry.selection = fdef.selection;
      if (fdef.relation) entry.relation = fdef.relation;
      if (fdef.required) entry.required = true;
      fields[fname] = entry;
    }
    return { ok: true, fieldCount: count, fields };
  } catch (err) {
    return { ok: false, reason: err.message || String(err) };
  }
}

async function main() {
  const env = loadEnv();
  console.log("ODOO_URL:     ", env.ODOO_URL);
  console.log("ODOO_DB:      ", env.ODOO_DB);
  console.log("ODOO_USER:    ", env.ODOO_USER);
  console.log("ODOO_PASSWORD:", maskPassword(env.ODOO_PASSWORD));
  console.log("");

  const client = await authenticate(env);

  // ---------- Part A — check ir.model for candidate names ----------
  console.log("--- Part A — checking ir.model for candidate names ---");
  const models = await client.searchRead(
    "ir.model",
    [["model", "in", ALL_CANDIDATE_NAMES]],
    ["model"],
    { limit: Math.max(ALL_CANDIDATE_NAMES.length, 32) }
  );
  const foundModels = new Set(models.map((r) => r.model));
  for (const name of ALL_CANDIDATE_NAMES) {
    console.log(`  ${name.padEnd(36)} — ${foundModels.has(name) ? "EXISTS" : "not in ir.model"}`);
  }
  console.log("");

  // ---------- Part A.2 — fields_get on any found candidates ----------
  console.log("--- Part A.2 — fields_get for found candidates ---");
  const confirmed = {};
  const stillMissing = {};
  for (const [legacyName, candidates] of Object.entries(ALTERNATE_NAMES)) {
    let resolved = null;
    for (const cand of candidates) {
      if (!foundModels.has(cand)) continue;
      const result = await fetchFields(client, cand);
      if (result.ok) {
        resolved = { canonical: cand, fields: result.fields, count: result.fieldCount };
        break;
      }
    }
    if (resolved) {
      confirmed[resolved.canonical] = { fields: resolved.fields };
      console.log(`  ${legacyName.padEnd(36)} → ${resolved.canonical.padEnd(30)} (${resolved.count} fields)`);
    } else {
      stillMissing[legacyName] = "no candidate resolved";
      console.log(`  ${legacyName.padEnd(36)} — unresolved`);
    }
  }
  console.log("");

  // ---------- Part A.3 — merge to odoo-confirmed-fields.json ----------
  const outPath = resolve(__dirname, "odoo-confirmed-fields.json");
  const existing = JSON.parse(readFileSync(outPath, "utf-8"));
  if (!existing.models || typeof existing.models !== "object") existing.models = {};
  let newlyMerged = 0;
  for (const [model, payload] of Object.entries(confirmed)) {
    if (!existing.models[model]) newlyMerged += 1;
    existing.models[model] = payload;
  }
  existing.generated_at = new Date().toISOString();
  writeFileSync(outPath, JSON.stringify(existing, null, 2), "utf-8");
  console.log(`Merged ${newlyMerged} newly confirmed models into odoo-confirmed-fields.json`);
  console.log(`Total confirmed models: ${Object.keys(existing.models).length}\n`);

  // ---------- Part B — uninstall modules to free tier ----------
  console.log("--- Part B — uninstalling apps to free tier ---");
  const moduleRows = await client.searchRead(
    "ir.module.module",
    [["name", "in", MODULES_TO_UNINSTALL]],
    ["id", "name", "state"],
    { limit: Math.max(MODULES_TO_UNINSTALL.length, 32) }
  );
  const stateByName = new Map(moduleRows.map((r) => [r.name, r]));

  const uninstallResults = {};
  for (const name of MODULES_TO_UNINSTALL) {
    const info = stateByName.get(name);
    if (!info) {
      uninstallResults[name] = { attempted: false, reason: "not in registry" };
      console.log(`  ${name.padEnd(24)} — SKIPPED (not in registry)`);
      continue;
    }
    if (info.state !== "installed") {
      uninstallResults[name] = { attempted: false, reason: `state=${info.state}` };
      console.log(`  ${name.padEnd(24)} — SKIPPED (state=${info.state})`);
      continue;
    }
    process.stdout.write(`  ${name.padEnd(24)} — uninstalling… `);
    try {
      await client.executeKw("ir.module.module", "button_immediate_uninstall", [[info.id]]);
      const row = await client.searchRead(
        "ir.module.module",
        [["id", "=", info.id]],
        ["state"],
        { limit: 1 }
      );
      const newState = row[0]?.state || "unknown";
      if (newState === "uninstalled") {
        uninstallResults[name] = { attempted: true, ok: true };
        console.log("OK");
      } else {
        uninstallResults[name] = { attempted: true, ok: false, reason: `state=${newState}` };
        console.log(`FAIL (state=${newState})`);
      }
    } catch (err) {
      uninstallResults[name] = { attempted: true, ok: false, reason: err.message || String(err) };
      console.log(`FAIL (${err.message || err})`);
    }
  }
  console.log("");

  // ---------- Summary ----------
  const uninstalledOk = Object.entries(uninstallResults).filter(([, r]) => r.attempted && r.ok);
  const uninstallFailed = Object.entries(uninstallResults).filter(([, r]) => r.attempted && !r.ok);
  const uninstallSkipped = Object.entries(uninstallResults).filter(([, r]) => !r.attempted);

  console.log("--- Summary ---");
  console.log(`Candidates found in ir.model:   ${foundModels.size} / ${ALL_CANDIDATE_NAMES.length}`);
  console.log(`Models newly confirmed:         ${Object.keys(confirmed).length}`);
  console.log(`Legacy names still unresolved:  ${Object.keys(stillMissing).length}`);
  console.log(`Modules uninstalled OK:         ${uninstalledOk.length}`);
  console.log(`Modules uninstall failed:       ${uninstallFailed.length}`);
  console.log(`Modules skipped:                ${uninstallSkipped.length}`);

  if (Object.keys(stillMissing).length) {
    console.log("\nSTILL UNRESOLVED:");
    Object.entries(stillMissing).forEach(([n, r]) => console.log(`  - ${n}: ${r}`));
  }
  if (uninstallFailed.length) {
    console.log("\nUNINSTALL FAILED:");
    uninstallFailed.forEach(([n, r]) => console.log(`  - ${n}: ${r.reason}`));
  }

  console.log("\nNewly confirmed model names:");
  Object.keys(confirmed).forEach((m) => console.log(`  - ${m}`));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
