import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createOnboardingStore } from "./onboarding-store.js";

// ---------------------------------------------------------------------------
// Discovery question tests for all 40 new question IDs
//
// DEFERRED_DEFAULTS is private, so we test indirectly:
//   1. deferAnswer(questionId) marks the question as deferred
//   2. getDefaultedDomains() returns entries for deferred questions
//      that have a known default — proving the question ID exists in
//      DEFERRED_DEFAULTS with a valid defaultAnswer and domains array.
// ---------------------------------------------------------------------------

const NEW_QUESTION_IDS = [
  "AP-01", "AP-02", "AR-01", "AT-01", "AT-02",
  "CA-01", "CA-02", "DI-01", "EM-01", "EM-02",
  "EV-01", "EV-02", "EX-01", "EX-02",
  "FL-01", "FL-02", "HD-01", "HD-02",
  "IM-01", "IM-02", "KN-01", "LC-01", "LC-02",
  "LY-01", "OM-01", "OM-02", "PL-01", "PL-02",
  "PY-01", "PY-02", "RC-01", "RC-02", "RF-01",
  "SM-01", "SP-01", "TS-01", "TS-02", "WA-01",
];

describe("new discovery question defaults", () => {
  for (const qId of NEW_QUESTION_IDS) {
    it(`${qId} exists in DEFERRED_DEFAULTS with valid defaultAnswer and domains`, () => {
      const store = createOnboardingStore();
      store.deferAnswer(qId);
      const defaults = store.getDefaultedDomains();
      const entry = defaults.find((d) => d.questionId === qId);
      assert.ok(entry, `${qId} must be present in DEFERRED_DEFAULTS`);
      assert.ok(entry.defaultAnswer !== null && entry.defaultAnswer !== undefined,
        `${qId} defaultAnswer must not be null or undefined`);
      assert.ok(Array.isArray(entry.domains), `${qId} domains must be an array`);
      assert.ok(entry.domains.length > 0, `${qId} domains array must be non-empty`);
    });
  }

  it("each domain in defaults is a valid string", () => {
    const store = createOnboardingStore();
    for (const qId of NEW_QUESTION_IDS) {
      store.deferAnswer(qId);
    }
    const defaults = store.getDefaultedDomains();
    for (const entry of defaults) {
      for (const domain of entry.domains) {
        assert.ok(typeof domain === "string" && domain.length > 0,
          `${entry.questionId} contains invalid domain: ${domain}`);
      }
    }
  });
});
