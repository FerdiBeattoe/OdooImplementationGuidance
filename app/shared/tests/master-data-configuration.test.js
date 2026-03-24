import test from "node:test";
import assert from "node:assert/strict";

import {
  addMasterDataConfigurationRecord,
  getMasterDataConfigurationSections,
  updateMasterDataConfigurationRecord
} from "../master-data-configuration.js";
import { createInitialProjectState, normalizeProjectState, validateStateShape } from "../project-state.js";

test("master-data configuration records can be created and updated across all sections", () => {
  let state = createInitialProjectState();

  state = normalizeProjectState(addMasterDataConfigurationRecord(state, "partnerCategoryCapture"));
  state = normalizeProjectState(addMasterDataConfigurationRecord(state, "productCategoryCapture"));
  state = normalizeProjectState(addMasterDataConfigurationRecord(state, "uomCategoryCapture"));

  const partnerKey = state.masterDataConfiguration.partnerCategoryCapture[0].key;
  const productKey = state.masterDataConfiguration.productCategoryCapture[0].key;
  const uomKey = state.masterDataConfiguration.uomCategoryCapture[0].key;

  state = normalizeProjectState(
    updateMasterDataConfigurationRecord(state, "partnerCategoryCapture", partnerKey, {
      categoryName: "Regional Customer",
      stewardshipNote: "Owned by data steward"
    })
  );
  state = normalizeProjectState(
    updateMasterDataConfigurationRecord(state, "productCategoryCapture", productKey, {
      categoryName: "Finished Goods",
      parentCategoryName: "All Products"
    })
  );
  state = normalizeProjectState(
    updateMasterDataConfigurationRecord(state, "uomCategoryCapture", uomKey, {
      categoryName: "Weight"
    })
  );

  const sections = getMasterDataConfigurationSections(state);
  assert.equal(sections.length, 3);
  assert.equal(state.masterDataConfiguration.partnerCategoryCapture[0].categoryName, "Regional Customer");
  assert.equal(state.masterDataConfiguration.productCategoryCapture[0].parentCategoryName, "All Products");
  assert.equal(state.masterDataConfiguration.uomCategoryCapture[0].categoryName, "Weight");
});

test("project-state validation normalizes malformed master-data configuration structures fail-safe", () => {
  const state = createInitialProjectState();
  state.masterDataConfiguration.partnerCategoryCapture = null;

  assert.equal(validateStateShape(state), "");
  const normalized = normalizeProjectState(state);
  assert.deepEqual(normalized.masterDataConfiguration.partnerCategoryCapture, []);
});
