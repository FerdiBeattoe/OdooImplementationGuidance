# ERPPath -- Dummy Run #2 QA Report

Date: 2026-04-09
Business: Majestic Print (Pty) Ltd
Country: South Africa | Currency: ZAR | Industry: Printing / Manufacturing
Employees: 15

---

## FIX VERIFICATION SUMMARY

| Fix | Description | Result |
|-----|-------------|--------|
| Fix 1 | FND-FOUND-001 preview on fresh project | **FAIL** |
| Fix 2 | 70 answers not overridden by industry-select 7 | **FAIL** |
| Fix 3 | RM-01="Products and services" activates sales | **INCONCLUSIVE** |
| Fix 4 | Dev mode team membership bypass (no 403) | **PASS** |
| Fix 5 | BM-05="> 10" normalizes to numeric | **INCONCLUSIVE** |
| Fix 6 | Connection validate uses pipeline registry | **PASS** |
| Fix 7 | Wizard capture populates intended_changes | **FAIL** |
| Fix 8 | Checkpoint confirm after industry-select + run | **PASS** |

**Score: 3 PASS, 3 FAIL, 2 INCONCLUSIVE**

---

## FIX DETAILS

### Fix 1 -- FND-FOUND-001 preview (FAIL)

FND-FOUND-001 exists in runtime_state with `validation_source: "Both"`, `execution_relevance: "Executable"`, `preview_required: true`. But:
- `intended_changes`: null
- `execution_approvals`: empty (0 entries)
- `previews`: empty array
- No approval_id on any checkpoint

The preview engine produced 0 previews and 0 execution approvals. This matches the known Gate 3 issue (target_context was provided, so Gate 3 should have opened). Possibly the intended_changes assembler produces null for FND-FOUND-001 because the country/currency write targets are not derivable from the 7 stored answers (BM-04 absent -- no multi-currency conditional).

### Fix 2 -- State collision (FAIL)

**This is the most critical failure.** 70 answers were submitted in the pipeline run, but only 7 answers appear in runtime_state:

```json
{
  "FC-01": "Full accounting",
  "SC-01": "Yes",
  "RM-01": ["One-time product sales"],
  "PI-01": "Yes",
  "OP-01": "Yes",
  "BM-05": 15,
  "OP-04": "Yes"
}
```

These 7 are NOT the industry-select defaults (which were BM-01, MF-01, PI-01, OP-01, RM-01, FC-01, MF-06). They appear to be a filtered subset of activation-relevant answers. The full 70 submitted answers were discarded.

Cascade effects:
- BM-04="Yes" lost -- FND-DREQ-003 not generated (multi-currency checkpoint missing)
- MF-01 lost -- manufacturing domain NOT activated (0 MRP checkpoints)
- PI-02="All orders" lost -- PUR-DREQ-004 not generated
- RM-01 value overwritten: submitted "Products and services" stored as ["One-time product sales"]
- BM-05 value: submitted "> 10", stored as 15 (not 11 which is the normalization of "> 10")
- OP-04 value: submitted "No", stored as "Yes"

The stored OP-04="Yes" and BM-05=15 do not match either the industry-select defaults or the submitted 70 answers. Source unknown -- possibly leaking from test236 state or a prior pipeline run.

### Fix 3 -- Sales activation (INCONCLUSIVE)

Sales IS activated, but RM-01 in stored state is `["One-time product sales"]` (industry default), not `"Products and services"` (submitted value). Cannot verify whether `"Products and services"` alone would activate sales because the submitted value was lost (Fix 2 failure).

### Fix 4 -- Dev mode bypass (PASS)

All four protected endpoints tested without 403:
- `/api/odoo/scan` -- 200, returned 275 modules
- `/api/team/invite` -- 200, `{ success: true }`
- `/api/pipeline/checkpoint/confirm` -- 200 (no auth error)
- `/api/connection/validate` -- 200

`jwtMiddleware` returns `{ id: 'dev', email: 'dev@local' }` when Supabase is not configured. `assertProjectMember` and `assertProjectLead` return true in dev mode. No 403 errors observed.

### Fix 5 -- BM-05 normalization (INCONCLUSIVE)

Submitted `BM-05: "> 10"`. Stored value: `15` (numeric). The normalization function maps "> 10" to 11, not 15. The value 15 does not match expected normalization output. HR domain IS activated (threshold > 10), so the activation logic works, but the stored value origin is unclear.

Unit tests for BM-05 normalization pass (3349/3349), so the normalization function itself works. The issue is that the stored value doesn't come from the submitted answers.

### Fix 6 -- Connection validate (PASS)

```
POST /api/pipeline/connection/register -> { ok: true }
POST /api/connection/validate -> { valid: true, project_id: "majestic-odoo-com" }
```

Connection registered via pipeline path, then validated via `/api/connection/validate`. Both endpoints resolve the same connectionRegistry entry. No "connection not found" error.

### Fix 7 -- Wizard capture intended_changes (FAIL)

```
POST /api/pipeline/wizard-capture
  domain: "inventory"
  wizard_data: { reception_steps: "two_steps", delivery_steps: "two_step", warehouse_name: "Main Warehouse" }
```

Response: `ok: true`, wizard_captures persisted. But all 6 inventory checkpoints returned `intended_changes: null`. The wizard data is stored but not consumed by the assembler to populate intended_changes. Expected INV-DREQ-004 (or similar) to have non-null intended_changes reflecting reception_steps/delivery_steps.

### Fix 8 -- Checkpoint confirm after industry-select + pipeline-run (PASS)

```
POST /api/pipeline/checkpoint/confirm (FND-FOUND-003)
  -> { ok: true }
```

Checkpoint was found in persisted state and confirmed successfully. No "checkpoint not found" error. The regeneration path works.

Note: FND-FOUND-001 cannot be confirmed via this route because it has `validation_source: "Both"` (requires governed apply path). The confirm route correctly rejects it with: `"checkpoint FND-FOUND-001 has validation_source Both. Only User_Confirmed checkpoints may use this route."`

---

## ENDPOINTS TESTED: 9

### Working (7):
- `POST /api/pipeline/connection/register` -- 200
- `POST /api/connection/validate` -- 200
- `POST /api/pipeline/industry/select` -- 200
- `POST /api/pipeline/run` -- 200
- `POST /api/pipeline/checkpoint/confirm` -- 200
- `POST /api/odoo/scan` -- 200
- `POST /api/team/invite` -- 200

### Working with issues (1):
- `POST /api/pipeline/wizard-capture` -- 200 but intended_changes always null

### Not found (1):
- `GET /api/audit?project_id=...` -- 404 (endpoint does not exist; only `/api/audit/write` POST exists)

---

## PIPELINE RESULTS

| Metric | Value |
|--------|-------|
| Total checkpoints | 61 |
| Domains activated | 10 / 23 |
| Checkpoints Complete (from state) | 29 |
| Checkpoints Not_Started | 32 |
| Non-null intended_changes | 0 |
| Governed writes attempted | 0 |
| Governed writes succeeded | 0 |
| Governed writes failed | 0 |

### Domains activated (10):
1. foundation (7 checkpoints)
2. users_roles (5 checkpoints)
3. master_data (7 checkpoints)
4. crm (6 checkpoints)
5. sales (5 checkpoints)
6. purchase (4 checkpoints)
7. inventory (7 checkpoints)
8. accounting (11 checkpoints)
9. website_ecommerce (6 checkpoints)
10. hr (3 checkpoints)

### Domains NOT activated (13):
manufacturing, plm, pos, projects, quality, maintenance, repairs, documents, sign, approvals, subscriptions, rental, field_service

### Expected but missing activations:
- **manufacturing** -- MF-01="Yes" was submitted but lost (Fix 2). Industry-select set MF-01="Yes" but pipeline run replaced answers.
- **repairs** -- RM-01 includes service delivery in submitted answers but stored as ["One-time product sales"]
- **projects** -- No obvious trigger in submitted answers (OP-03="No")

### intended_changes by domain:
All domains: 0 / total (every checkpoint has intended_changes: null)

---

## ODOO SCAN RESULTS

- Company: majestic (South Africa)
- Modules installed: 275
- Key modules confirmed: sale_management, account, crm, website, stock, purchase, point_of_sale, project, mrp, mass_mailing, hr, knowledge, sign, planning, quality, mrp_workorder, l10n_za

### Modules relevant to business profile:
- Accounting: account, account_accountant, account_reports, account_asset, l10n_za, l10n_za_reports -- present
- Inventory: stock, stock_account, stock_barcode -- present
- Sales: sale, sale_management, sale_crm -- present
- CRM: crm, crm_enterprise -- present
- HR: hr, hr_skills, hr_calendar -- present
- Manufacturing: mrp, mrp_workorder, mrp_account -- present
- Quality: quality -- present
- Helpdesk: NOT detected (not in 275 modules)
- Timesheets: NOT detected by name (may be in project module)
- Expenses: NOT detected by name
- Recruitment: NOT detected by name

---

## SUPABASE PERSISTENCE

Not applicable -- dev mode (no SUPABASE_URL configured). All state persisted to local JSON files only.

---

## REMAINING GAPS (new since dummy run #1)

1. **Answer merge failure (critical)** -- Pipeline run does not merge submitted answers with persisted state. The 70 submitted answers are discarded, leaving only a filtered activation-relevant subset. Root cause needs investigation in the pipeline run handler.

2. **intended_changes always null** -- No checkpoint across any domain produces non-null intended_changes. The assembler R4 honest-null pattern means no governed writes are possible. This blocks the entire write pipeline.

3. **Wizard capture does not feed assembler** -- wizard_data is persisted but not consumed by operation definitions to produce intended_changes.

4. **Missing audit GET endpoint** -- `/api/audit` (GET) does not exist. Only `/api/audit/write` (POST) is implemented.

5. **BM-05 stored value mismatch** -- Submitted "> 10", expected normalization to 11, stored as 15. Value provenance unclear.

6. **Helpdesk / Timesheets / Expenses / Recruitment modules** -- Listed in business profile but not detected in Odoo scan. May be named differently in module registry or not installed.

7. **29 checkpoints pre-marked Complete** -- On a fresh project, 29 checkpoints are already Complete. These appear to be test236 carry-over state leaking into the new project's pipeline run. This violates the fresh-project assumption.

---

## PRIORITY FIXES (ranked)

1. **P0: Answer merge in pipeline run** -- The 70 submitted answers must survive and be stored in full. This is the root cause of Fix 2 failure, and cascades into Fix 3, Fix 5, and activation gaps. Without this, the entire pipeline is non-functional for new projects.

2. **P0: intended_changes generation** -- The assembler must produce non-null intended_changes for at least FND-FOUND-001 (country), FND-FOUND-002 (country), FND-DREQ-002 (currency). Without intended_changes, no governed writes can execute.

3. **P1: Wizard capture -> assembler integration** -- Wizard capture data must flow into operation definitions so inventory checkpoints get non-null intended_changes.

4. **P2: Fresh project isolation** -- New project pipeline runs should not inherit checkpoint statuses from other projects (test236 carry-over).

5. **P2: Audit GET endpoint** -- Implement `/api/audit` GET for retrieving audit logs.

---

## WHAT WORKS END TO END

1. **Server startup** -- Clean start on port 4174, no errors
2. **Connection registration** -- Odoo credentials authenticate and register in connectionRegistry
3. **Connection validation** -- Validates against pipeline registry correctly (Fix 6 confirmed)
4. **Industry selection** -- Returns correct pre-populated answers and domain previews for manufacturing
5. **Dev mode auth bypass** -- All protected endpoints accessible without JWT/Supabase (Fix 4 confirmed)
6. **Checkpoint confirm** -- User_Confirmed checkpoints can be confirmed after industry-select + pipeline-run (Fix 8 confirmed)
7. **Odoo scan** -- Returns 275 installed modules from live majestic.odoo.com instance
8. **Team invite** -- Works in dev mode, validates role correctly
9. **Test suite** -- 3349 pass, 0 fail (up from 2807 at last check)

## WHAT DOES NOT WORK END TO END

1. **Full answer submission** -- 70 answers submitted, 7 stored (93% data loss)
2. **Preview generation** -- 0 previews produced, 0 execution approvals
3. **Governed writes** -- 0 writes possible (no intended_changes on any checkpoint)
4. **Wizard capture -> writes** -- Data captured but not actionable
5. **Manufacturing domain** -- Not activated despite MF-01="Yes" in submitted answers

---

## TEST SUITE

- Before: 3349 pass, 0 fail
- After: 3349 pass, 0 fail
- Delta: No change (QA run did not modify code)

---

*Report generated by ERPPath Dummy Run #2 QA process. No code was modified during this run.*
