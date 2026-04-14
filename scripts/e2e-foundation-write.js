#!/usr/bin/env node
// ---------------------------------------------------------------------------
// e2e-foundation-write.js
// End-to-end governed Foundation write verification against a live Odoo 19.
//
// Flow:
//   1. Load .env credentials
//   2. Authenticate via OdooClient
//   3. Read current res.company fiscalyear_last_month / fiscalyear_last_day
//   4. Build wizard_captures with fiscal_year_end_month "3", fiscal_year_end_day 31
//   5. Call assembleFoundationOperationDefinitions — FND-DREQ-001 must carry
//      non-null intended_changes
//   6. Execute the write directly via OdooClient using those intended_changes
//   7. Re-read res.company and compare BEFORE vs AFTER
//   8. Restore the original BEFORE values
//   9. Print summary
//
// Read-only against the codebase — only writes to the live Odoo instance.
// Usage: node scripts/e2e-foundation-write.js
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Results tracker ────────────────────────────────────────────────────────

const results = {
  authentication:    "FAIL",
  assemblyNonNull:   "FAIL",
  writeExecuted:     "FAIL",
  changeVerified:    "FAIL",
  restored:          "FAIL",
};

function printSummary(r) {
  const overall = Object.values(r).every((v) => v === "PASS") ? "PASS" : "FAIL";
  console.log("\n═══════════════════════════════════════════════");
  console.log("  E2E FOUNDATION GOVERNED-WRITE SUMMARY");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Authentication:      ${r.authentication}`);
  console.log(`  Assembly (non-null): ${r.assemblyNonNull}`);
  console.log(`  Write executed:      ${r.writeExecuted}`);
  console.log(`  Change verified:     ${r.changeVerified}`);
  console.log(`  Restored:            ${r.restored}`);
  console.log(`  Overall:             ${overall}`);
  console.log("═══════════════════════════════════════════════\n");
}

// ── STEP 1: Load .env credentials ──────────────────────────────────────────

console.log("\n═══ STEP 1: Load .env credentials ═══");

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

function maskPassword(pw) {
  if (!pw) return "(empty)";
  if (pw.length <= 2) return "*".repeat(pw.length);
  return `${pw[0]}${"*".repeat(Math.max(pw.length - 2, 1))}${pw[pw.length - 1]}`;
}

const env = loadEnv(resolve(ROOT, ".env"));
const ODOO_URL      = env.ODOO_URL;
const ODOO_DB       = env.ODOO_DB;
const ODOO_USER     = env.ODOO_USER;
const ODOO_PASSWORD = env.ODOO_PASSWORD;

if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_PASSWORD) {
  console.error("✗ Missing one or more required .env variables: ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASSWORD");
  printSummary(results);
  process.exit(1);
}
console.log(`  ODOO_URL:      ${ODOO_URL}`);
console.log(`  ODOO_DB:       ${ODOO_DB}`);
console.log(`  ODOO_USER:     ${ODOO_USER}`);
console.log(`  ODOO_PASSWORD: ${maskPassword(ODOO_PASSWORD)}`);
console.log("✓ .env loaded");

// ── Imports ────────────────────────────────────────────────────────────────

const { OdooClient } = await import(
  pathToFileURL(resolve(ROOT, "app/backend/odoo-client.js")).href
);
const { assembleFoundationOperationDefinitions } = await import(
  pathToFileURL(resolve(ROOT, "app/shared/foundation-operation-definitions.js")).href
);

// ── STEP 2: Authenticate via OdooClient ────────────────────────────────────

console.log("\n═══ STEP 2: Authenticate via OdooClient ═══");

const client = new OdooClient({ baseUrl: ODOO_URL, database: ODOO_DB });
let uid = 0;
try {
  uid = await client.authenticate(ODOO_USER, ODOO_PASSWORD);
  console.log(`✓ authenticated as uid ${uid}`);
  results.authentication = "PASS";
} catch (err) {
  console.error(`✗ Authentication failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 3: Read BEFORE state ──────────────────────────────────────────────

console.log("\n═══ STEP 3: Read current res.company fiscal year state ═══");

let BEFORE;
try {
  const rows = await client.searchRead(
    "res.company",
    [["id", "=", 1]],
    ["fiscalyear_last_month", "fiscalyear_last_day"],
    { limit: 1 }
  );
  if (!rows || rows.length === 0) {
    throw new Error("No res.company record with id=1 found");
  }
  BEFORE = {
    fiscalyear_last_month: rows[0].fiscalyear_last_month,
    fiscalyear_last_day:   rows[0].fiscalyear_last_day,
  };
  console.log(`  BEFORE fiscalyear_last_month: ${JSON.stringify(BEFORE.fiscalyear_last_month)}`);
  console.log(`  BEFORE fiscalyear_last_day:   ${JSON.stringify(BEFORE.fiscalyear_last_day)}`);
} catch (err) {
  console.error(`✗ BEFORE read failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 4: Build wizard_captures ──────────────────────────────────────────

console.log("\n═══ STEP 4: Build wizard_captures ═══");

const wizard_captures = {
  foundation: {
    fiscal_year_end_month: "3",
    fiscal_year_end_day:   31,
  },
};
console.log(`  wizard_captures: ${JSON.stringify(wizard_captures)}`);

// ── STEP 5: Assemble Foundation operation definitions ──────────────────────

console.log("\n═══ STEP 5: Assemble Foundation operation definitions ═══");

let intendedChanges = null;
try {
  const opMap = assembleFoundationOperationDefinitions(null, null, wizard_captures);
  const keys = Object.keys(opMap);
  console.log(`  definitions assembled, count = ${keys.length}`);
  console.log(`  keys: ${keys.join(", ")}`);

  const dreq001 = opMap["FND-DREQ-001"];
  console.log(`  FND-DREQ-001 intended_changes: ${JSON.stringify(dreq001?.intended_changes)}`);

  if (!dreq001 || !dreq001.intended_changes) {
    console.error("✗ FAIL — FND-DREQ-001 intended_changes is null");
    printSummary(results);
    process.exit(1);
  }
  intendedChanges = dreq001.intended_changes;
  results.assemblyNonNull = "PASS";
} catch (err) {
  console.error(`✗ Assembly failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 6: Execute the write directly via OdooClient ─────────────────────

console.log("\n═══ STEP 6: Execute governed write on res.company id=1 ═══");
console.log(`  write payload: ${JSON.stringify(intendedChanges)}`);

try {
  const writeResult = await client.write("res.company", [1], intendedChanges);
  console.log(`  write result: ${JSON.stringify(writeResult)}`);
  if (writeResult === true || writeResult === 1) {
    results.writeExecuted = "PASS";
  } else {
    console.error(`✗ write returned unexpected result: ${JSON.stringify(writeResult)}`);
  }
} catch (err) {
  console.error(`✗ write failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 7: Read AFTER state and compare ──────────────────────────────────

console.log("\n═══ STEP 7: Read AFTER state and verify ═══");

let AFTER;
try {
  const rows = await client.searchRead(
    "res.company",
    [["id", "=", 1]],
    ["fiscalyear_last_month", "fiscalyear_last_day"],
    { limit: 1 }
  );
  AFTER = {
    fiscalyear_last_month: rows[0].fiscalyear_last_month,
    fiscalyear_last_day:   rows[0].fiscalyear_last_day,
  };
  console.log(`  AFTER fiscalyear_last_month: ${JSON.stringify(AFTER.fiscalyear_last_month)}`);
  console.log(`  AFTER fiscalyear_last_day:   ${JSON.stringify(AFTER.fiscalyear_last_day)}`);

  const monthChanged = String(AFTER.fiscalyear_last_month) === String(intendedChanges.fiscalyear_last_month);
  const dayChanged   = Number(AFTER.fiscalyear_last_day)   === Number(intendedChanges.fiscalyear_last_day);
  const diffFromBefore =
    String(AFTER.fiscalyear_last_month) !== String(BEFORE.fiscalyear_last_month) ||
    Number(AFTER.fiscalyear_last_day)   !== Number(BEFORE.fiscalyear_last_day);

  if (monthChanged && dayChanged) {
    if (diffFromBefore) {
      console.log("✓ PASS — governed write confirmed (value changed from BEFORE to intended)");
    } else {
      console.log("✓ PASS — governed write confirmed (intended already equaled BEFORE; value matches intent)");
    }
    results.changeVerified = "PASS";
  } else {
    console.error("✗ FAIL — write did not persist to expected values");
  }
} catch (err) {
  console.error(`✗ AFTER read failed: ${err.message}`);
}

// ── STEP 8: Restore original BEFORE values ─────────────────────────────────

console.log("\n═══ STEP 8: Restore original BEFORE values ═══");

try {
  const restorePayload = {
    fiscalyear_last_month: BEFORE.fiscalyear_last_month,
    fiscalyear_last_day:   BEFORE.fiscalyear_last_day,
  };
  console.log(`  restore payload: ${JSON.stringify(restorePayload)}`);
  const restoreResult = await client.write("res.company", [1], restorePayload);
  console.log(`  restore result: ${JSON.stringify(restoreResult)}`);

  const rows = await client.searchRead(
    "res.company",
    [["id", "=", 1]],
    ["fiscalyear_last_month", "fiscalyear_last_day"],
    { limit: 1 }
  );
  const restored = rows[0];
  const matches =
    String(restored.fiscalyear_last_month) === String(BEFORE.fiscalyear_last_month) &&
    Number(restored.fiscalyear_last_day)   === Number(BEFORE.fiscalyear_last_day);
  if (matches) {
    console.log("✓ restored original values");
    results.restored = "PASS";
  } else {
    console.error("✗ restore did not land; current: " + JSON.stringify(restored));
  }
} catch (err) {
  console.error(`✗ restore failed: ${err.message}`);
}

// ── STEP 9: Summary ────────────────────────────────────────────────────────

printSummary(results);
const allPass = Object.values(results).every((v) => v === "PASS");
process.exit(allPass ? 0 : 1);
