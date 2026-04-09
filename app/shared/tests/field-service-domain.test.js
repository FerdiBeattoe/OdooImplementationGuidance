import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  FIELD_SERVICE_CHECKPOINT_GROUPS,
  isFieldServiceCheckpoint,
} from "../field-service-domain.js";

describe("field-service-domain", () => {
  it("1. CHECKPOINT_GROUPS is a non-empty array", () => {
    assert.ok(Array.isArray(FIELD_SERVICE_CHECKPOINT_GROUPS), "must be an array");
    assert.ok(FIELD_SERVICE_CHECKPOINT_GROUPS.length > 0, "must have entries");
  });

  it("2. every entry has required fields: id, area, title, stageId, domainId", () => {
    for (const entry of FIELD_SERVICE_CHECKPOINT_GROUPS) {
      assert.ok(typeof entry.id === "string" && entry.id.length > 0, `missing id in ${JSON.stringify(entry)}`);
      assert.ok(typeof entry.area === "string" && entry.area.length > 0, `missing area in ${entry.id}`);
      assert.ok(typeof entry.title === "string" && entry.title.length > 0, `missing title in ${entry.id}`);
      assert.ok(typeof entry.stageId === "string" && entry.stageId.length > 0, `missing stageId in ${entry.id}`);
      assert.ok(typeof entry.domainId === "string" && entry.domainId.length > 0, `missing domainId in ${entry.id}`);
    }
  });

  it("3. every entry has domainId equal to 'field-service'", () => {
    for (const entry of FIELD_SERVICE_CHECKPOINT_GROUPS) {
      assert.equal(entry.domainId, "field-service", `${entry.id} domainId must be field-service`);
    }
  });

  it("4. isFieldServiceCheckpoint returns true for matching domainId", () => {
    assert.equal(isFieldServiceCheckpoint({ domainId: "field-service" }), true);
  });

  it("5. isFieldServiceCheckpoint returns false for wrong domainId", () => {
    assert.equal(isFieldServiceCheckpoint({ domainId: "wrong-domain" }), false);
  });

  it("6. isFieldServiceCheckpoint returns false for null/undefined", () => {
    assert.equal(isFieldServiceCheckpoint(null), false);
    assert.equal(isFieldServiceCheckpoint(undefined), false);
  });
});
