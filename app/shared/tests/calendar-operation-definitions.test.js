import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleCalendarOperationDefinitions,
  CALENDAR_COVERAGE_GAP_MODELS,
} from "../calendar-operation-definitions.js";
import {
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleCalendarOperationDefinitions", () => {
  it("1. returns zero definitions with null inputs", () => {
    const defs = assembleCalendarOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 0, "Calendar must currently emit zero definitions");
  });

  it("2. still returns zero definitions when gates are active", () => {
    const defs = assembleCalendarOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "CA-01": "Google Calendar", "CA-02": "No" })
    );
    assert.equal(Object.keys(defs).length, 0, "Calendar must remain zero until allowed models exist");
  });

  it("3. coverage gaps are documented", () => {
    assert.deepEqual(CALENDAR_COVERAGE_GAP_MODELS, ["calendar.event", "res.users"]);
  });

  it("4. no definition references a model outside ALLOWED_APPLY_MODELS", () => {
    assertDefinitionsUseAllowedModels(assembleCalendarOperationDefinitions(null, null), ALLOWED_APPLY_MODELS);
  });

  it("5. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleCalendarOperationDefinitions(null, null));
  });
});
