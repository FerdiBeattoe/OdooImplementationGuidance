import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  deriveInventoryWizardCapturePayload,
  normalizePi03Answer,
} from "./inventory-capture.js";

describe("normalizePi03Answer", () => {
  it("maps descriptive 2-step answer", () => {
    const answer = "Receive into a dock/input area, then transfer to stock (2 steps)";
    assert.equal(normalizePi03Answer(answer), "two_steps");
  });

  it("maps short numeric answer", () => {
    assert.equal(normalizePi03Answer("3 steps"), "three_steps");
  });

  it("returns null for unsupported values", () => {
    assert.equal(normalizePi03Answer("Unknown option"), null);
  });
});

describe("deriveInventoryWizardCapturePayload", () => {
  it("builds payload for two-step reception including warehouse name", () => {
    const wizardData = { warehouses: [{ name: "Central WH" }] };
    const result = deriveInventoryWizardCapturePayload(
      wizardData,
      "Receive into a dock/input area, then transfer to stock (2 steps)"
    );
    assert.deepEqual(result, {
      payload: {
        reception_steps: "two_steps",
        delivery_steps: "two_step",
        warehouse_name: "Central WH",
      },
      reason: "ok",
    });
  });

  it("builds payload for three-step reception with default delivery steps", () => {
    const wizardData = {};
    const result = deriveInventoryWizardCapturePayload(wizardData, "3 steps");
    assert.deepEqual(result, {
      payload: {
        reception_steps: "three_steps",
        delivery_steps: "pick_pack_ship",
      },
      reason: "ok",
    });
  });

  it("returns not_applicable when PI-03 indicates single step", () => {
    const result = deriveInventoryWizardCapturePayload({}, "Receive directly into stock (1 step)");
    assert.deepEqual(result, { payload: null, reason: "not_applicable" });
  });

  it("reports missing PI-03 answer", () => {
    const result = deriveInventoryWizardCapturePayload({}, null);
    assert.deepEqual(result, { payload: null, reason: "pi03_missing" });
  });
});
