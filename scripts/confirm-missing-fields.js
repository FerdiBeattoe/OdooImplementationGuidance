// ---------------------------------------------------------------------------
// Confirm Missing Fields — extends odoo-confirmed-fields.json with 4 models
// that were missing from the prior discovery run.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { OdooClient } from "../app/backend/odoo-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TARGET_MODELS = [
  "mrp.eco.type",
  "documents.folder",
  "approval.category",
  "sale.subscription.plan",
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

async function main() {
  const summary = {
    auth: "FAIL",
    counts: {},
    fileWritten: "FAIL",
  };

  // STEP 1 — Load .env
  const env = loadEnv();
  console.log("ODOO_URL:     ", env.ODOO_URL);
  console.log("ODOO_DB:      ", env.ODOO_DB);
  console.log("ODOO_USER:    ", env.ODOO_USER);
  console.log("ODOO_PASSWORD:", maskPassword(env.ODOO_PASSWORD));

  // STEP 2 — Authenticate
  const client = new OdooClient({
    baseUrl: env.ODOO_URL,
    database: env.ODOO_DB,
  });

  let uid;
  try {
    uid = await client.authenticate(env.ODOO_USER, env.ODOO_PASSWORD);
    console.log(`authenticated as uid ${uid}`);
    summary.auth = "PASS";
  } catch (err) {
    console.error("Authentication failed:", err.message || err);
    process.exit(1);
  }

  // STEP 3 — Fetch fields for the 4 models
  const fetched = {};
  for (const model of TARGET_MODELS) {
    try {
      const allFields = await client.fieldsGet(model, [
        "string", "type", "required", "readonly", "store",
        "selection", "relation", "depends", "compute",
      ]);

      const writable = {};
      for (const [fname, fdef] of Object.entries(allFields)) {
        if (fdef.readonly && !fdef.store) continue;
        if (fdef.compute && !fdef.store) continue;

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
        writable[fname] = entry;
      }

      fetched[model] = writable;
      const count = Object.keys(writable).length;
      summary.counts[model] = count;
      console.log(`${model} — ${count} fields found`);
    } catch (err) {
      console.error(`${model}: ERROR — ${err.message || err}`);
      summary.counts[model] = 0;
    }
  }

  // STEP 4 — Read current JSON and merge
  const outPath = resolve(__dirname, "odoo-confirmed-fields.json");
  const existingRaw = readFileSync(outPath, "utf-8");
  const existing = JSON.parse(existingRaw);

  if (!existing.models || typeof existing.models !== "object") {
    existing.models = {};
  }

  for (const model of TARGET_MODELS) {
    const newFields = fetched[model];
    if (!newFields) continue;
    const prev = existing.models[model]?.fields || {};
    existing.models[model] = { fields: { ...prev, ...newFields } };
  }

  existing.generated_at = new Date().toISOString();

  // STEP 5 — Write updated JSON
  try {
    writeFileSync(outPath, JSON.stringify(existing, null, 2), "utf-8");
    summary.fileWritten = "PASS";
    const totalModels = Object.keys(existing.models).length;
    console.log(`written ${totalModels} total models to odoo-confirmed-fields.json`);
  } catch (err) {
    console.error("Failed to write JSON:", err.message || err);
  }

  // STEP 6 — Summary
  console.log("\n--- Summary ---");
  console.log(`Authentication:         ${summary.auth}`);
  console.log(`mrp.eco.type:           ${summary.counts["mrp.eco.type"] ?? 0} fields confirmed`);
  console.log(`documents.folder:       ${summary.counts["documents.folder"] ?? 0} fields confirmed`);
  console.log(`approval.category:      ${summary.counts["approval.category"] ?? 0} fields confirmed`);
  console.log(`sale.subscription.plan: ${summary.counts["sale.subscription.plan"] ?? 0} fields confirmed`);
  console.log(`File written:           ${summary.fileWritten}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
