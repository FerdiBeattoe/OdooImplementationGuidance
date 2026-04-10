// ---------------------------------------------------------------------------
// Field Discovery — reads fields_get() for all ALLOWED_APPLY_MODELS
// Outputs scripts/odoo-confirmed-fields.json as source of truth for assemblers
// ---------------------------------------------------------------------------

import { readFileSync } from "fs";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { OdooClient } from "../app/backend/odoo-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// ALLOWED_APPLY_MODELS — exact copy from governed-odoo-apply-service.js
// ---------------------------------------------------------------------------
const ALLOWED_APPLY_MODELS = [
  "res.company",
  "stock.warehouse",
  "stock.picking.type",
  "stock.location",
  "crm.stage",
  "crm.team",
  "res.partner.category",
  "product.category",
  "uom.category",
  "product.pricelist",
  "mrp.workcenter",
  "mrp.routing",
  "delivery.carrier",
  "website",
  "payment.provider",
  "pos.payment.method",
  "pos.config",
  "project.project",
  "project.task.type",
  "quality.point",
  "mrp.eco.type",
  "documents.folder",
  "sign.template",
  "approval.category",
  "sale.subscription.plan",
  "hr.department",
  "hr.job",
  "hr.employee",
  "account.journal",
  "account.tax",
  "account.account",
  "res.users",
  "res.groups",
];

// ---------------------------------------------------------------------------
// Load .env (UTF-8, strip BOM)
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const env = loadEnv();
  const client = new OdooClient({
    baseUrl: env.ODOO_URL,
    database: env.ODOO_DB,
  });

  console.log(`Authenticating to ${env.ODOO_URL} as ${env.ODOO_USER}...`);
  await client.authenticate(env.ODOO_USER, env.ODOO_PASSWORD);
  console.log("Authenticated.\n");

  // Get Odoo version
  const versionInfo = await client.getVersionInfo();
  const odooVersion = versionInfo?.server_version || "unknown";
  console.log(`Odoo version: ${odooVersion}\n`);

  const models = {};
  const errors = [];
  let totalFields = 0;

  for (const model of ALLOWED_APPLY_MODELS) {
    try {
      const allFields = await client.fieldsGet(model, [
        "string", "type", "required", "readonly", "store",
        "selection", "relation", "depends", "compute",
      ]);

      const writable = {};
      for (const [fname, fdef] of Object.entries(allFields)) {
        // Skip readonly or computed fields (non-stored computed = derived)
        if (fdef.readonly && !fdef.store) continue;
        // Skip pure computed fields that aren't stored
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

      const count = Object.keys(writable).length;
      models[model] = { fields: writable };
      totalFields += count;
      console.log(`  ${model}: ${count} writable fields`);
    } catch (err) {
      const msg = err.message || String(err);
      errors.push({ model, error: msg });
      console.log(`  ${model}: ERROR — ${msg}`);
    }
  }

  // Write JSON output
  const output = {
    generated_at: new Date().toISOString(),
    odoo_version: odooVersion,
    models,
  };

  const outPath = resolve(__dirname, "odoo-confirmed-fields.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`\nOutput: ${outPath}`);
  if (errors.length) {
    console.log(`\n⚠ ${errors.length} model(s) returned errors:`);
    for (const e of errors) console.log(`  - ${e.model}: ${e.error}`);
  }
  console.log(`\n✓ Field discovery complete — ${totalFields} fields across ${Object.keys(models).length} models`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
