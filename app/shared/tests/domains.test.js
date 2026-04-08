import test from "node:test";
import assert from "node:assert/strict";

import { DOMAINS } from "../domains.js";

test("live navigation exposes all governed domains", () => {
  const domainIds = new Set(DOMAINS.map((domain) => domain.id));

  assert.equal(DOMAINS.length, 51);
  [
    "field-service",
    "maintenance",
    "rental",
    "repairs",
    "subscriptions",
    "timesheets",
    "expenses",
    "attendance",
    "recruitment",
    "fleet",
    "events",
    "email-marketing",
    "helpdesk",
    "payroll",
    "planning",
    "knowledge",
    "discuss",
    "outgoing-mail",
    "incoming-mail",
    "accounting-reports",
    "spreadsheet",
    "live-chat",
    "whatsapp",
    "sms-marketing",
    "calendar",
    "iot",
    "studio",
    "consolidation",
    "lunch",
    "referrals",
    "loyalty",
    "appraisals",
    "voip"
  ].forEach((domainId) => assert.ok(domainIds.has(domainId)));
});
