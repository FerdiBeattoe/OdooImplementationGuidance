import test from "node:test";
import assert from "node:assert/strict";

import { DOMAINS } from "../domains.js";

test("live navigation exposes all governed domains", () => {
  const domainIds = new Set(DOMAINS.map((domain) => domain.id));

  assert.equal(DOMAINS.length, 34);
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
    "knowledge"
  ].forEach((domainId) => assert.ok(domainIds.has(domainId)));
});
