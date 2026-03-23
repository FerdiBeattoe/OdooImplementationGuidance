import test from "node:test";
import assert from "node:assert/strict";

import { DOMAINS } from "../domains.js";

test("deferred optional domains are excluded from live navigation", () => {
  const domainIds = new Set(DOMAINS.map((domain) => domain.id));

  assert.ok(!domainIds.has("maintenance"));
  assert.ok(!domainIds.has("repairs"));
  assert.ok(!domainIds.has("subscriptions"));
  assert.ok(!domainIds.has("rental"));
  assert.ok(!domainIds.has("field-service"));
});
