// Inventory wizard capture helpers — derive payload for /api/pipeline/wizard-capture
// from wizard output and discovery answers.

function firstWarehouseName(wizardData) {
  const warehouses = Array.isArray(wizardData?.warehouses)
    ? wizardData.warehouses
    : [];
  for (const record of warehouses) {
    if (record && typeof record.name === "string") {
      const trimmed = record.name.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

/**
 * Normalizes PI-03 answers into Odoo reception_step tokens.
 * Accepts full descriptive answers or the short "2 steps" / "3 steps" values.
 *
 * @param {*} rawAnswer
 * @returns {"one_step"|"two_steps"|"three_steps"|null}
 */
export function normalizePi03Answer(rawAnswer) {
  if (typeof rawAnswer !== "string") return null;
  const trimmed = rawAnswer.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  if (lower.includes("three_steps") || lower.includes("3 steps") || lower.includes("3-step")) {
    return "three_steps";
  }
  if (lower.includes("two_steps") || lower.includes("2 steps") || lower.includes("2-step")) {
    return "two_steps";
  }
  if (lower.includes("one_step") || lower.includes("1 step") || lower.includes("1-step")) {
    return "one_step";
  }

  const numericMatch = lower.match(/(\d)\s*step/);
  if (numericMatch) {
    switch (numericMatch[1]) {
      case "1":
        return "one_step";
      case "2":
        return "two_steps";
      case "3":
        return "three_steps";
      default:
        return null;
    }
  }

  return null;
}

/**
 * Builds the wizard_data payload for the inventory wizard capture endpoint.
 *
 * @param {object} wizardData - merged wizard form output
 * @param {*} pi03Answer      - discovery answer for PI-03
 * @returns {{ payload: object|null, reason: string }}
 */
export function deriveInventoryWizardCapturePayload(wizardData, pi03Answer) {
  const normalizedSteps = normalizePi03Answer(pi03Answer);
  if (!normalizedSteps) {
    return {
      payload: null,
      reason: pi03Answer ? "pi03_unrecognized" : "pi03_missing",
    };
  }
  if (normalizedSteps === "one_step") {
    return { payload: null, reason: "not_applicable" };
  }

  const payload = {
    reception_steps: normalizedSteps,
  };

  if (normalizedSteps === "two_steps") {
    payload.delivery_steps = "two_step";
  } else if (normalizedSteps === "three_steps") {
    payload.delivery_steps = "pick_pack_ship";
  }

  const warehouseName = firstWarehouseName(wizardData);
  if (warehouseName) {
    payload.warehouse_name = warehouseName;
  }

  return { payload, reason: "ok" };
}
