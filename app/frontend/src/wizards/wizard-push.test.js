import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Wizard Push Function Tests
//
// wizard-push.js cannot be imported directly in the node:test runner because
// it depends on app-store.js which uses a frontend path alias ("/shared/index.js")
// that doesn't resolve in Node.js. Instead, we verify the module's exported
// function surface by static analysis of the source file.
//
// For each push function we verify:
//   - The export declaration exists as an async function
//   - The function name matches the expected pattern
//   - The function body follows the governed push pattern
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "wizard-push.js"), "utf-8");

const EXPECTED_PUSH_FUNCTIONS = [
  "pushFieldServiceConfig",
  "pushMaintenanceConfig",
  "pushRentalConfig",
  "pushRepairsConfig",
  "pushSubscriptionsConfig",
  "pushTimesheetsConfig",
  "pushExpensesConfig",
  "pushAttendanceConfig",
  "pushRecruitmentConfig",
  "pushFleetConfig",
  "pushEventsConfig",
  "pushEmailMarketingConfig",
  "pushHelpdeskConfig",
  "pushPayrollConfig",
  "pushPlanningConfig",
  "pushKnowledgeConfig",
  "pushDiscussConfig",
  "pushOutgoingMailConfig",
  "pushIncomingMailConfig",
  "pushAccountingReportsConfig",
  "pushSpreadsheetConfig",
  "pushLiveChatConfig",
  "pushWhatsappConfig",
  "pushSmsMarketingConfig",
  "pushCalendarConfig",
  "pushIotConfig",
  "pushStudioConfig",
  "pushConsolidationConfig",
  "pushLunchConfig",
  "pushReferralsConfig",
  "pushLoyaltyConfig",
  "pushAppraisalsConfig",
  "pushVoipConfig",
  "pushMasterDataConfig",
  "pushPlmConfig",
  "pushQualityConfig",
  "pushDocumentsConfig",
  "pushSignConfig",
  "pushApprovalsConfig",
];

describe("wizard-push exports", () => {
  for (const fnName of EXPECTED_PUSH_FUNCTIONS) {
    it(`${fnName} is exported as an async function`, () => {
      const pattern = new RegExp(`export\\s+async\\s+function\\s+${fnName}\\s*\\(`);
      assert.ok(pattern.test(source), `${fnName} must be exported as async function`);
    });
  }

  it("every push function calls pushResult to return { ok, results }", () => {
    for (const fnName of EXPECTED_PUSH_FUNCTIONS) {
      const fnStart = source.indexOf(`export async function ${fnName}(`);
      assert.ok(fnStart !== -1, `${fnName} must exist`);
      const fnBlock = source.slice(fnStart, fnStart + 800);
      assert.ok(fnBlock.includes("pushResult("), `${fnName} must call pushResult`);
    }
  });

  it("every push function calls setWizardCapture", () => {
    for (const fnName of EXPECTED_PUSH_FUNCTIONS) {
      const fnStart = source.indexOf(`export async function ${fnName}(`);
      const fnBlock = source.slice(fnStart, fnStart + 800);
      assert.ok(fnBlock.includes("setWizardCapture("), `${fnName} must call setWizardCapture`);
    }
  });

  it("every push function has a try/catch error handler", () => {
    for (const fnName of EXPECTED_PUSH_FUNCTIONS) {
      const fnStart = source.indexOf(`export async function ${fnName}(`);
      const fnBlock = source.slice(fnStart, fnStart + 800);
      assert.ok(fnBlock.includes("} catch (err)"), `${fnName} must have error handling`);
    }
  });

  it("total exported push function count matches expected", () => {
    const matches = source.match(/export\s+async\s+function\s+push\w+Config\s*\(/g) || [];
    assert.ok(matches.length >= EXPECTED_PUSH_FUNCTIONS.length,
      `Expected at least ${EXPECTED_PUSH_FUNCTIONS.length} push functions, found ${matches.length}`);
  });
});
