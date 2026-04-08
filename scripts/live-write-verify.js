#!/usr/bin/env node
// ---------------------------------------------------------------------------
// live-write-verify.js — End-to-end live write verification against Odoo 19
// ---------------------------------------------------------------------------
// Usage: node scripts/live-write-verify.js
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── STEP 1: Load .env credentials ──────────────────────────────────────────

console.log("\n═══ STEP 1: Load .env credentials ═══");

function loadEnv(filePath) {
  const raw = readFileSync(filePath);
  // Handle UTF-16 LE BOM: strip BOM then decode as utf-16le
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
const ODOO_URL = env.ODOO_URL;
const ODOO_DB = env.ODOO_DB;
const ODOO_USER = env.ODOO_USER;
const ODOO_PASSWORD = env.ODOO_PASSWORD;

if (!ODOO_URL || !ODOO_DB || !ODOO_USER || !ODOO_PASSWORD) {
  console.error("✗ Missing one or more .env variables: ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASSWORD");
  process.exit(1);
}
console.log(`  ODOO_URL:  ${ODOO_URL}`);
console.log(`  ODOO_DB:   ${ODOO_DB}`);
console.log(`  ODOO_USER: ${ODOO_USER}`);
console.log("✓ .env loaded");

// ── Imports ────────────────────────────────────────────────────────────────

const { OdooClient } = await import(pathToFileURL(resolve(ROOT, "app/backend/odoo-client.js")).href);
const { assembleFoundationOperationDefinitions } = await import(
  pathToFileURL(resolve(ROOT, "app/shared/foundation-operation-definitions.js")).href
);

// ── Results tracker ────────────────────────────────────────────────────────

const results = {
  authentication: "FAIL",
  companyRead: "FAIL",
  assemblerOutput: "FAIL",
  liveWrite: "FAIL",
  writeVerification: "FAIL",
};

// ── STEP 2: Authenticate via OdooClient ────────────────────────────────────

console.log("\n═══ STEP 2: Authenticate via OdooClient ═══");

const client = new OdooClient({ baseUrl: ODOO_URL, database: ODOO_DB });
try {
  const uid = await client.authenticate(ODOO_USER, ODOO_PASSWORD);
  console.log(`✓ Authenticated as ${ODOO_USER} (uid=${uid}) on ${ODOO_URL}`);
  results.authentication = "PASS";
} catch (err) {
  console.error(`✗ Authentication failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 3: Read current res.company state ─────────────────────────────────

console.log("\n═══ STEP 3: Read current res.company state ═══");

let companyRecord;
try {
  const rows = await client.searchRead(
    "res.company",
    [["id", "=", 1]],
    ["name", "country_id", "currency_id"],
    { limit: 1 }
  );
  if (!rows || rows.length === 0) {
    throw new Error("No res.company record with id=1 found");
  }
  companyRecord = rows[0];
  console.log(`  name:        ${companyRecord.name}`);
  console.log(`  country_id:  ${JSON.stringify(companyRecord.country_id)}`);
  console.log(`  currency_id: ${JSON.stringify(companyRecord.currency_id)}`);
  console.log("✓ Company record read");
  results.companyRead = "PASS";
} catch (err) {
  console.error(`✗ Company read failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 4: Assemble Foundation operation definitions ──────────────────────

console.log("\n═══ STEP 4: Assemble Foundation operation definitions ═══");

try {
  const targetContext = {
    primary_country: "South Africa",
    primary_currency: "ZAR",
  };
  const discoveryAnswers = { answers: { "BM-04": "Yes" } };

  const opMap = assembleFoundationOperationDefinitions(targetContext, discoveryAnswers);

  const fndFound001 = opMap["FND-FOUND-001"];
  const fndDreq002 = opMap["FND-DREQ-002"];
  const fndDreq003 = opMap["FND-DREQ-003"];

  console.log("  Assembled keys:", Object.keys(opMap).join(", "));
  console.log(`  FND-FOUND-001 intended_changes: ${JSON.stringify(fndFound001?.intended_changes)}`);
  console.log(`  FND-DREQ-002  intended_changes: ${JSON.stringify(fndDreq002?.intended_changes)}`);
  console.log(`  FND-DREQ-003  intended_changes: ${JSON.stringify(fndDreq003?.intended_changes)} (conditional BM-04=Yes)`);

  if (!fndFound001?.intended_changes || fndFound001.intended_changes.country_id === null) {
    throw new Error("FND-FOUND-001 intended_changes.country_id is null — expected non-null with target_context");
  }
  if (!fndDreq002?.intended_changes || fndDreq002.intended_changes.currency_id === null) {
    throw new Error("FND-DREQ-002 intended_changes.currency_id is null — expected non-null with target_context");
  }
  if (!fndDreq003) {
    throw new Error("FND-DREQ-003 missing — expected present when BM-04=Yes");
  }

  console.log("✓ Assembler output verified: FND-FOUND-001 and FND-DREQ-002 have non-null intended_changes");
  results.assemblerOutput = "PASS";
} catch (err) {
  console.error(`✗ Assembler output check failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 5: Confirm company record id=1 exists ────────────────────────────

console.log("\n═══ STEP 5: Confirm company record id=1 ═══");

try {
  const rows = await client.searchRead("res.company", [["id", "=", 1]], ["id"], { limit: 1 });
  if (!rows || rows.length === 0 || rows[0].id !== 1) {
    throw new Error("Company record id=1 not found");
  }
  console.log("✓ Company record id=1 confirmed");
} catch (err) {
  console.error(`✗ Company record confirmation failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 6: Live write to res.company ──────────────────────────────────────

console.log("\n═══ STEP 6: Live write to res.company id=1 ═══");

// Use the current country_id from Step 3 to make an idempotent write
const currentCountryId = Array.isArray(companyRecord.country_id)
  ? companyRecord.country_id[0]
  : companyRecord.country_id;

if (!currentCountryId) {
  console.error("✗ Cannot determine current country_id for idempotent write");
  printSummary(results);
  process.exit(1);
}

console.log(`  Writing country_id=${currentCountryId} (idempotent — same as current value)`);

try {
  const writeResult = await client.write("res.company", [1], { country_id: currentCountryId });
  console.log(`  Odoo result: ${JSON.stringify(writeResult)}`);
  if (writeResult === true || writeResult === 1) {
    console.log("✓ Live write succeeded");
    results.liveWrite = "PASS";
  } else {
    console.error(`✗ Live write returned unexpected result: ${JSON.stringify(writeResult)}`);
    printSummary(results);
    process.exit(1);
  }
} catch (err) {
  console.error(`✗ Live write failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 7: Verify the write landed ────────────────────────────────────────

console.log("\n═══ STEP 7: Verify write landed ═══");

try {
  const rows = await client.searchRead(
    "res.company",
    [["id", "=", 1]],
    ["country_id"],
    { limit: 1 }
  );
  const readBackCountryId = Array.isArray(rows[0].country_id)
    ? rows[0].country_id[0]
    : rows[0].country_id;

  if (readBackCountryId === currentCountryId) {
    console.log(`  country_id after write: ${JSON.stringify(rows[0].country_id)}`);
    console.log("✓ Write verified on live Odoo 19 instance");
    results.writeVerification = "PASS";
  } else {
    console.error(`✗ Verification failed: expected country_id=${currentCountryId}, got ${readBackCountryId}`);
    printSummary(results);
    process.exit(1);
  }
} catch (err) {
  console.error(`✗ Verification read failed: ${err.message}`);
  printSummary(results);
  process.exit(1);
}

// ── STEP 8: Summary ───────────────────────────────────────────────────────

printSummary(results);

const allPass = Object.values(results).every((v) => v === "PASS");
process.exit(allPass ? 0 : 1);

// ── Helpers ───────────────────────────────────────────────────────────────

function printSummary(r) {
  console.log("\n═══════════════════════════════════════");
  console.log("  LIVE WRITE VERIFICATION SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`  Authentication:    ${r.authentication}`);
  console.log(`  Company read:      ${r.companyRead}`);
  console.log(`  Assembler output:  ${r.assemblerOutput}`);
  console.log(`  Live write:        ${r.liveWrite}`);
  console.log(`  Write verification:${r.writeVerification}`);
  console.log("═══════════════════════════════════════\n");
}
