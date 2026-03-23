import test from "node:test";
import assert from "node:assert/strict";

import { getCombinationError, isCombinationSupported, requiresBranchTarget } from "../target-matrix.js";

test("Community plus Odoo.sh is rejected", () => {
  const selection = { edition: "Community", deployment: "Odoo.sh" };
  assert.equal(isCombinationSupported(selection), false);
  assert.equal(getCombinationError(selection), "Odoo.sh is supported for Enterprise only.");
});

test("Enterprise plus Odoo.sh requires branch target handling", () => {
  const selection = { edition: "Enterprise", deployment: "Odoo.sh" };
  assert.equal(isCombinationSupported(selection), true);
  assert.equal(requiresBranchTarget(selection), true);
});
