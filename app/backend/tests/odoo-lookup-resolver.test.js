// ---------------------------------------------------------------------------
// odoo-lookup-resolver.test.js — Tests for the runtime-lookup resolver
// ---------------------------------------------------------------------------

"use strict";

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isLookupDirective,
  resolveLookups,
} from "../odoo-lookup-resolver.js";

// ---------------------------------------------------------------------------
// Mock OdooClient
// ---------------------------------------------------------------------------

function createMockClient(responseMap = {}) {
  const calls = [];
  return {
    calls,
    async searchRead(model, domain, fields, options) {
      calls.push({ model, domain, fields, options });
      const key = model;
      if (key in responseMap) return responseMap[key];
      return [];
    },
  };
}

// ---------------------------------------------------------------------------
// isLookupDirective
// ---------------------------------------------------------------------------

describe("isLookupDirective", () => {
  it("returns true for a well-formed sentinel", () => {
    assert.equal(
      isLookupDirective({
        __lookup: "res.lang",
        domain: [["active", "=", true]],
        field: "id",
        limit: 1,
      }),
      true
    );
  });

  it("returns true for minimal sentinel (no limit/order)", () => {
    assert.equal(
      isLookupDirective({ __lookup: "quality.test.type", domain: [], field: "id" }),
      true
    );
  });

  it("returns false for null", () => {
    assert.equal(isLookupDirective(null), false);
  });

  it("returns false for a string", () => {
    assert.equal(isLookupDirective("hello"), false);
  });

  it("returns false for a number", () => {
    assert.equal(isLookupDirective(42), false);
  });

  it("returns false for an array", () => {
    assert.equal(isLookupDirective([1, 2, 3]), false);
  });

  it("returns false for a plain object without __lookup", () => {
    assert.equal(isLookupDirective({ domain: [], field: "id" }), false);
  });

  it("returns false when __lookup is empty string", () => {
    assert.equal(isLookupDirective({ __lookup: "", domain: [], field: "id" }), false);
  });

  it("returns false when domain is not an array", () => {
    assert.equal(
      isLookupDirective({ __lookup: "res.lang", domain: "bad", field: "id" }),
      false
    );
  });

  it("returns false when field is missing", () => {
    assert.equal(
      isLookupDirective({ __lookup: "res.lang", domain: [] }),
      false
    );
  });

  it("returns false for undefined", () => {
    assert.equal(isLookupDirective(undefined), false);
  });

  it("returns false for boolean", () => {
    assert.equal(isLookupDirective(true), false);
  });
});

// ---------------------------------------------------------------------------
// resolveLookups
// ---------------------------------------------------------------------------

describe("resolveLookups", () => {
  it("leaves a no-sentinel object identical", async () => {
    const client = createMockClient();
    const input = { name: "Test", active: true, count: 5 };
    const result = await resolveLookups(client, input);
    assert.equal(result.ok, true);
    assert.deepStrictEqual(result.resolved, { name: "Test", active: true, count: 5 });
    assert.equal(client.calls.length, 0);
  });

  it("replaces a single sentinel with resolved id", async () => {
    const client = createMockClient({
      "quality.test.type": [{ id: 7 }],
    });
    const input = {
      title: "Check",
      test_type_id: { __lookup: "quality.test.type", domain: [], field: "id", limit: 1 },
    };
    const result = await resolveLookups(client, input);
    assert.equal(result.ok, true);
    assert.deepStrictEqual(result.resolved, { title: "Check", test_type_id: 7 });
  });

  it("returns ok: false with clear failure info when no records found", async () => {
    const client = createMockClient({});
    const input = {
      name: "Test",
      product_id: {
        __lookup: "product.product",
        domain: [["type", "=", "service"]],
        field: "id",
        limit: 1,
      },
    };
    const result = await resolveLookups(client, input);
    assert.equal(result.ok, false);
    assert.equal(result.failures.length, 1);
    assert.equal(result.failures[0].field, "product_id");
    assert.equal(result.failures[0].model, "product.product");
    assert.equal(typeof result.failures[0].reason, "string");
  });

  it("does not mutate the input", async () => {
    const client = createMockClient({
      "res.lang": [{ id: 3 }],
    });
    const input = {
      name: "Site",
      default_lang_id: {
        __lookup: "res.lang",
        domain: [["active", "=", true]],
        field: "id",
        limit: 1,
      },
    };
    const inputCopy = JSON.parse(JSON.stringify(input));
    await resolveLookups(client, input);
    assert.deepStrictEqual(input, inputCopy);
  });

  it("resolves multiple sentinels in one object", async () => {
    const client = createMockClient({
      "res.lang": [{ id: 3 }],
      "product.product": [{ id: 42 }],
    });
    const input = {
      name: "Multi",
      lang_id: { __lookup: "res.lang", domain: [], field: "id", limit: 1 },
      product_id: {
        __lookup: "product.product",
        domain: [["type", "=", "service"]],
        field: "id",
        limit: 1,
      },
    };
    const result = await resolveLookups(client, input);
    assert.equal(result.ok, true);
    assert.deepStrictEqual(result.resolved, {
      name: "Multi",
      lang_id: 3,
      product_id: 42,
    });
  });

  it("records exact searchRead args for each sentinel", async () => {
    const client = createMockClient({
      "res.lang": [{ id: 1 }],
    });
    const input = {
      default_lang_id: {
        __lookup: "res.lang",
        domain: [["active", "=", true]],
        field: "id",
        limit: 5,
        order: "name asc",
      },
    };
    await resolveLookups(client, input);
    assert.equal(client.calls.length, 1);
    const call = client.calls[0];
    assert.equal(call.model, "res.lang");
    assert.deepStrictEqual(call.domain, [["active", "=", true]]);
    assert.deepStrictEqual(call.fields, ["id"]);
    assert.equal(call.options.limit, 5);
    assert.equal(call.options.order, "name asc");
  });

  it("uses default limit=1 and order='' when not specified", async () => {
    const client = createMockClient({
      "quality.test.type": [{ id: 9 }],
    });
    const input = {
      test_type_id: { __lookup: "quality.test.type", domain: [], field: "id" },
    };
    await resolveLookups(client, input);
    assert.equal(client.calls[0].options.limit, 1);
    assert.equal(client.calls[0].options.order, "");
  });

  it("collects multiple failures when several sentinels fail", async () => {
    const client = createMockClient({});
    const input = {
      a: { __lookup: "model.a", domain: [], field: "id" },
      b: { __lookup: "model.b", domain: [], field: "id" },
    };
    const result = await resolveLookups(client, input);
    assert.equal(result.ok, false);
    assert.equal(result.failures.length, 2);
  });
});
