// ---------------------------------------------------------------------------
// odoo-lookup-resolver.js — Runtime-lookup resolver for honest-null fields
// ---------------------------------------------------------------------------
// Assemblers are pure and synchronous — they cannot perform Odoo reads.
// When a required field's value must come from the live instance (e.g. a
// default test_type_id, the active language, a service product), the
// assembler emits a lookup sentinel instead of null.  This module resolves
// those sentinels against a live OdooClient immediately before the write.
// ---------------------------------------------------------------------------

/**
 * Returns true if `value` is a well-formed lookup sentinel.
 * A sentinel is a plain object whose only structural marker is `__lookup`.
 */
export function isLookupDirective(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return (
    typeof value.__lookup === "string" &&
    value.__lookup.length > 0 &&
    Array.isArray(value.domain) &&
    typeof value.field === "string" &&
    value.field.length > 0
  );
}

/**
 * Given an OdooClient and an intended_changes object, returns a new object
 * with all top-level sentinel values replaced by the resolved lookup result.
 *
 * @param {object} client    — OdooClient instance (must expose searchRead)
 * @param {object} intendedChanges — the intended_changes object from an assembler
 * @returns {{ ok: true, resolved: object } | { ok: false, failures: Array }}
 *
 * - If a sentinel resolves to no records → failure entry { field, model, reason }
 * - If a sentinel resolves successfully  → value replaced with rows[0][field]
 * - Non-sentinel values are passed through untouched.
 * - Never mutates the input.
 * - Does not recurse into nested objects or arrays (scope limit).
 */
export async function resolveLookups(client, intendedChanges) {
  const resolved = {};
  const failures = [];

  for (const [key, value] of Object.entries(intendedChanges)) {
    if (!isLookupDirective(value)) {
      resolved[key] = value;
      continue;
    }

    const model = value.__lookup;
    const domain = value.domain;
    const field = value.field;
    const limit = typeof value.limit === "number" ? value.limit : 1;
    const order = typeof value.order === "string" ? value.order : "";

    const rows = await client.searchRead(model, domain, [field], { limit, order });

    if (!Array.isArray(rows) || rows.length === 0) {
      failures.push({ field: key, model, reason: `no records found` });
      continue;
    }

    resolved[key] = rows[0][field];
  }

  if (failures.length > 0) {
    return { ok: false, failures };
  }

  return { ok: true, resolved };
}
