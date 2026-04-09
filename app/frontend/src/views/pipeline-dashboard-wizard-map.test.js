import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Pipeline Dashboard — getWizardIdForCheckpoint mapping tests
//
// pipeline-dashboard.js cannot be imported directly in node:test because it
// depends on frontend DOM libraries. We extract and evaluate the mapping
// function in isolation.
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "pipeline-dashboard.js"), "utf-8");

// Extract the getWizardIdForCheckpoint function body and evaluate it
const fnMatch = source.match(
  /function getWizardIdForCheckpoint\(checkpointId\)\s*\{([\s\S]*?\n\})/
);
assert.ok(fnMatch, "getWizardIdForCheckpoint must exist in pipeline-dashboard.js");

// Build a standalone version of the function
const fnBody = `
  function getWizardIdForCheckpoint(checkpointId) {${fnMatch[1]}
  return getWizardIdForCheckpoint;
`;
const getWizardIdForCheckpoint = new Function(fnBody)();

describe("getWizardIdForCheckpoint", () => {
  const EXPECTED_MAPPINGS = {
    "FND-FOUND-001": "company-setup",
    "CRM-FOUND-001": "crm-setup",
    "INV-FOUND-001": "inventory-setup",
    "ACCT-FOUND-001": "accounting-setup",
    "HR-FOUND-001": "hr-setup",
    "MRP-FOUND-001": "manufacturing-setup",
    "QUA-FOUND-001": "quality-setup",
    "MNT-FOUND-001": "maintenance-setup",
    "HLP-FOUND-001": "helpdesk-setup",
    "USR-FOUND-001": "users-access",
    "MAS-FOUND-001": "master-data-setup",
    "SAL-FOUND-001": "sales-setup",
    "PUR-FOUND-001": "purchase-setup",
    "POS-FOUND-001": "pos-setup",
    "WEB-FOUND-001": "website-setup",
    "PRJ-FOUND-001": "projects-setup",
    "DOC-FOUND-001": "documents-setup",
    "SGN-FOUND-001": "sign-setup",
    "APR-FOUND-001": "approvals-setup",
    "FSV-FOUND-001": "field-service-setup",
    "RNT-FOUND-001": "rental-setup",
    "SUB-FOUND-001": "subscriptions-setup",
    "PLM-FOUND-001": "plm-setup",
    "REP-FOUND-001": "repairs-setup",
    "TS-DREQ-001": "timesheets-setup",
    "EXP-DREQ-001": "expenses-setup",
    "ATT-DREQ-001": "attendance-setup",
    "REC-DREQ-001": "recruitment-setup",
    "FLT-DREQ-001": "fleet-setup",
    "EVT-DREQ-001": "events-setup",
    "MKT-DREQ-001": "email-marketing-setup",
    "PAY-DREQ-001": "payroll-setup",
    "PLN-DREQ-001": "planning-setup",
    "KNW-DREQ-001": "knowledge-setup",
    "DIS-DREQ-001": "discuss-setup",
    "OMT-DREQ-001": "outgoing-mail-setup",
    "IMT-DREQ-001": "incoming-mail-setup",
    "ARP-DREQ-001": "accounting-reports-setup",
    "SPR-DREQ-001": "spreadsheet-setup",
    "LCH-DREQ-001": "live-chat-setup",
    "WHA-DREQ-001": "whatsapp-setup",
    "SMS-DREQ-001": "sms-marketing-setup",
    "CAL-DREQ-001": "calendar-setup",
    "IOT-DREQ-001": "iot-setup",
    "STU-DREQ-001": "studio-setup",
    "CON-DREQ-001": "consolidation-setup",
    "LUN-DREQ-001": "lunch-setup",
    "REF-DREQ-001": "referrals-setup",
    "LOY-DREQ-001": "loyalty-setup",
    "APP-DREQ-001": "appraisals-setup",
    "VOI-DREQ-001": "voip-setup",
  };

  for (const [checkpointId, expectedWizardId] of Object.entries(EXPECTED_MAPPINGS)) {
    it(`${checkpointId} maps to ${expectedWizardId}`, () => {
      assert.equal(getWizardIdForCheckpoint(checkpointId), expectedWizardId);
    });
  }

  it("unknown prefix returns null", () => {
    assert.equal(getWizardIdForCheckpoint("ZZZ-FOUND-001"), null);
  });

  it("null input returns null", () => {
    assert.equal(getWizardIdForCheckpoint(null), null);
  });

  it("empty string returns null", () => {
    assert.equal(getWizardIdForCheckpoint(""), null);
  });
});
