// ---------------------------------------------------------------------------
// Inventory Operation Definitions Tests
// Tests for: app/shared/inventory-operation-definitions.js
// ---------------------------------------------------------------------------
//
// Test coverage:
//   1.  Unconditional Inventory definitions assembled (5 with null inputs)
//   2.  Conditional Inventory definitions assembled when all compatible gates are active
//   3.  Every assembled definition carries the required operation-definition fields
//   4.  No Inventory definition references a model outside ALLOWED_APPLY_MODELS
//   5.  intended_changes is null for every Inventory definition — honest-null behavior
//   6.  Coverage gaps are documented
//   7.  Return is a plain object — never null, never array
// ---------------------------------------------------------------------------

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ALLOWED_APPLY_MODELS } from "../../backend/governed-odoo-apply-service.js";
import {
  assembleInventoryOperationDefinitions,
  INVENTORY_CHECKPOINT_METADATA,
  INVENTORY_COVERAGE_GAP_MODELS,
  INVENTORY_TARGET_METHOD,
} from "../inventory-operation-definitions.js";
import { CHECKPOINT_IDS } from "../checkpoint-engine.js";
import {
  assertDefinitionMetadata,
  assertDefinitionsUseAllowedModels,
  assertPlainObject,
  makeDiscoveryAnswers,
  makeTargetContext,
} from "./operation-definitions-test-helpers.js";

describe("assembleInventoryOperationDefinitions", () => {
  it("1. assembles 5 unconditional Inventory definitions with null inputs", () => {
    const defs = assembleInventoryOperationDefinitions(null, null);
    assert.equal(Object.keys(defs).length, 5, "expected 5 unconditional Inventory definitions");
    assert.ok(defs[CHECKPOINT_IDS.INV_FOUND_001]);
    assert.ok(defs[CHECKPOINT_IDS.INV_FOUND_002]);
    assert.ok(defs[CHECKPOINT_IDS.INV_FOUND_003]);
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_001]);
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_002]);
  });

  it("2. assembles 11 Inventory definitions when all compatible gates are active", () => {
    const defs = assembleInventoryOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({
        "OP-02": 2,
        "PI-03": "3 steps",
        "PI-05": true,
        "FC-02": "AVCO",
        "MF-01": true,
        "RM-04": true,
      })
    );
    assert.equal(Object.keys(defs).length, 11, "expected 11 Inventory definitions with compatible conditionals");
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_003]);
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_005]);
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_006]);
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_007]);
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_008]);
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_009]);
    assert.equal(defs[CHECKPOINT_IDS.INV_DREQ_004], undefined, "INV-DREQ-004 must be absent when PI-03='3 steps'");
  });

  it("3. every assembled Inventory definition carries the required metadata fields", () => {
    const defs = assembleInventoryOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-02": 2, "PI-03": "2 steps", "PI-05": "Yes", "FC-02": "FIFO", "MF-01": "Yes", "RM-04": "Yes" })
    );
    assertDefinitionMetadata(defs, INVENTORY_CHECKPOINT_METADATA, INVENTORY_TARGET_METHOD);
  });

  it("4. no Inventory definition references a model outside ALLOWED_APPLY_MODELS", () => {
    const defs = assembleInventoryOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-02": 2, "PI-03": "2 steps", "PI-05": true, "FC-02": "AVCO", "MF-01": true, "RM-04": true })
    );
    assertDefinitionsUseAllowedModels(defs, ALLOWED_APPLY_MODELS);
  });

  it("5. intended_changes is null for every Inventory definition when no wizard captures supplied", () => {
    // wizard_captures omitted — assembler must not fabricate values (R4 honest-null).
    const defs = assembleInventoryOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "OP-02": 2, "PI-03": "2 steps", "PI-05": true, "FC-02": "AVCO", "MF-01": true, "RM-04": true })
    );
    for (const key of Object.keys(defs)) {
      assert.equal(defs[key].intended_changes, null, `${key} intended_changes must be null when no wizard captures supplied`);
    }
  });

  it("6. coverage gaps are documented for requested non-allowed Inventory models", () => {
    assert.deepEqual(INVENTORY_COVERAGE_GAP_MODELS, ["stock.location"]);
  });

  it("7. return is a plain object — never null, never array", () => {
    assertPlainObject(assembleInventoryOperationDefinitions(null, null));
  });

  it("8. INV-DREQ-004 gets non-null intended_changes when wizard_captures supply two_steps reception", () => {
    // PI-03="2 steps" activates INV-DREQ-004; wizard_captures.inventory.reception_steps="two_steps"
    // must produce non-null intended_changes containing reception_steps and delivery_steps.
    const wizardCaptures = {
      inventory: {
        reception_steps: "two_steps",
        delivery_steps: "pick_ship",
      },
    };
    const defs = assembleInventoryOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "PI-03": "2 steps" }),
      wizardCaptures
    );
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_004], "INV-DREQ-004 must be present when PI-03='2 steps'");
    const changes = defs[CHECKPOINT_IDS.INV_DREQ_004].intended_changes;
    assert.notEqual(changes, null, "INV-DREQ-004 intended_changes must be non-null when wizard_captures supply two_steps reception");
    assert.equal(changes.reception_steps, "two_steps", "reception_steps must be 'two_steps'");
    assert.equal(changes.delivery_steps, "pick_ship", "delivery_steps must be forwarded from wizard_captures");
    // Other checkpoints without wizard capture derivation remain null.
    assert.equal(defs[CHECKPOINT_IDS.INV_FOUND_001].intended_changes, null, "INV-FOUND-001 must remain null");
  });

  it("9. INV-DREQ-005 gets non-null intended_changes when wizard_captures supply three_steps reception", () => {
    // PI-03="3 steps" activates INV-DREQ-005; wizard_captures.inventory.reception_steps="three_steps"
    // must produce non-null intended_changes; delivery_steps defaults to "pick_pack_ship" when absent.
    const wizardCaptures = {
      inventory: {
        reception_steps: "three_steps",
        // delivery_steps deliberately omitted — assembler must supply the default
      },
    };
    const defs = assembleInventoryOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "PI-03": "3 steps" }),
      wizardCaptures
    );
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_005], "INV-DREQ-005 must be present when PI-03='3 steps'");
    const changes = defs[CHECKPOINT_IDS.INV_DREQ_005].intended_changes;
    assert.notEqual(changes, null, "INV-DREQ-005 intended_changes must be non-null when wizard_captures supply three_steps reception");
    assert.equal(changes.reception_steps, "three_steps", "reception_steps must be 'three_steps'");
    assert.equal(changes.delivery_steps, "pick_pack_ship", "delivery_steps must default to 'pick_pack_ship' for three_steps path");
    // INV-DREQ-004 must be absent — PI-03 cannot be both "2 steps" and "3 steps".
    assert.equal(defs[CHECKPOINT_IDS.INV_DREQ_004], undefined, "INV-DREQ-004 must be absent when PI-03='3 steps'");
  });

  it("10. wizard_captures reception_steps mismatch with PI-03 gate produces null intended_changes", () => {
    // Guard: if PI-03="2 steps" but wizard_captures has reception_steps="three_steps",
    // the assembler must not emit changes — mismatch means no truthful write target.
    const wizardCaptures = {
      inventory: {
        reception_steps: "three_steps",
      },
    };
    const defs = assembleInventoryOperationDefinitions(
      makeTargetContext(),
      makeDiscoveryAnswers({ "PI-03": "2 steps" }),
      wizardCaptures
    );
    assert.ok(defs[CHECKPOINT_IDS.INV_DREQ_004], "INV-DREQ-004 must still be present when PI-03='2 steps'");
    assert.equal(
      defs[CHECKPOINT_IDS.INV_DREQ_004].intended_changes,
      null,
      "INV-DREQ-004 intended_changes must be null when reception_steps mismatches PI-03 gate"
    );
  });
});
