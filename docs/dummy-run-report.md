# PROJECT ODOO — DUMMY RUN QA REPORT

```
Date:     2026-04-09
Business: Majestic Print (Pty) Ltd
Country:  South Africa
Currency: ZAR
Industry: Printing / Manufacturing
Employees: 15
```

---

## ENDPOINTS TESTED: 24

### WORKING (10)

| # | Endpoint | Method | Result |
|---|----------|--------|--------|
| 1 | `/api/health` | GET | `{ ok: true }` |
| 2 | `/api/projects` | GET | Returns project store (dev-mode JWT bypass) |
| 3 | `/api/pipeline/connection/register` | POST | Connection registered, saved to `connections.json` |
| 4 | `/api/pipeline/industry/select` | POST | Returns 7 pre-populated answers, 19 deferred questions, 9 domain preview |
| 5 | `/api/pipeline/run` | POST | 68 checkpoints across 9 domains, 0 previews, 0 approvals |
| 6 | `/api/pipeline/state/save` | POST | Saves arbitrary state to disk |
| 7 | `/api/pipeline/state/load` | POST | Loads persisted state |
| 8 | `/api/odoo/detect-databases` | POST | Detected `majestic` database on majestic.odoo.com |
| 9 | `/api/connection/connect` | POST | Connected to majestic.odoo.com, status: `connected_execute` |
| 10 | `/api/licence/early-adopter-status` | GET | `{ claimed: 0, remaining: 20, earlyAdopterActive: true }` |
| 11 | `/api/audit/write` | POST | Accepts valid actions |

### BROKEN (7)

| # | Endpoint | Method | Error | Root Cause |
|---|----------|--------|-------|------------|
| 1 | `/api/auth/signin` | POST | `Supabase is not configured` | No SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env |
| 2 | `/api/auth/signup` | POST | `An invite code is required during beta` | Invite code gate blocks even with correct fields |
| 3 | `/api/odoo/scan` | POST | `Insufficient permissions` (403) | `assertProjectMember` fails — dev user `{id:'dev'}` has no team membership for the project |
| 4 | `/api/odoo/install-module` | POST | `Insufficient permissions` (403) | Same `assertProjectMember` issue |
| 5 | `/api/audit/:projectId` | GET | `Insufficient permissions` (403) | Same `assertProjectMember` issue |
| 6 | `/api/team/invite` | POST | `Insufficient permissions` (403) | `assertProjectLead` fails — dev user has no project lead role |
| 7 | `/api/connection/validate` | POST | `No stored connection for this project` | validate creates a new project state instead of checking existing connection; uses different project shape than `/api/pipeline/connection/register` |

### NOT FOUND / NOT IMPLEMENTED (6)

| # | Endpoint | Notes |
|---|----------|-------|
| 1 | `/api/auth/login` | Does not exist (signin is at `/api/auth/signin`) |
| 2 | `/api/golive-readiness` | Does not exist — readiness is manual per governance |
| 3 | `/api/report/pre-commit` | Does not exist — no report generation endpoint |
| 4 | `/api/wizard/push` | Does not exist — wizard push is frontend-only (`wizard-push.js`) |
| 5 | `/api/pipeline/checkpoint/apply` | Does not exist — governed apply is at `/api/pipeline/apply` |
| 6 | `/api/team/members` (GET) | Likely exists but not tested (member gate blocks) |

---

## PIPELINE RESULTS

```
Total checkpoints:                    68
Domains activated:                     9 / 23
Domains NOT activated:                14
Checkpoints with non-null intended_changes:  0
Governed writes attempted:             0
Governed writes succeeded:             0
Governed writes failed:                0 (none attempted)
Previews generated:                    0
Execution approvals generated:         0
```

### Domains Activated (9)

| Domain | Checkpoints | Trigger |
|--------|-------------|---------|
| foundation | 9 | Always active |
| users_roles | 8 | Always active |
| master_data | 8 | Always active |
| crm | 6 | SC-01=Yes |
| purchase | 6 | PI-01=Yes |
| inventory | 9 | OP-01=Yes |
| accounting | 13 | FC-01=Full accounting |
| projects | 5 | BM-05 > 10 |
| hr | 4 | BM-05 > 10 |

### Domains NOT Activated (14)

| Domain | Reason |
|--------|--------|
| sales | `RM-01="Products and services"` not matching expected pattern; `PI-05=No` |
| manufacturing | No trigger (MF-01 not in answers; BM-04=Yes does not activate) |
| plm | No trigger (depends on manufacturing) |
| pos | OP-03=No and RM-01 does not include "Point-of-sale" |
| website_ecommerce | OP-04=No |
| quality | MF-06 not answered |
| maintenance | No trigger |
| repairs | OP-01=Yes but no service delivery mechanism present |
| documents | BM-05 <= 50 and no document-related trigger |
| sign | TA-03 does not include "Contract or document signing" |
| approvals | TA-03=None and no large-org approval triggers |
| subscriptions | RM-03=No |
| rental | RM-04=No |
| field_service | OP-05=No |

### INTENDED_CHANGES BY DOMAIN

| Domain | Non-null / Total |
|--------|------------------|
| foundation | 0 / 9 |
| users_roles | 0 / 8 |
| master_data | 0 / 8 |
| crm | 0 / 6 |
| purchase | 0 / 6 |
| inventory | 0 / 9 |
| accounting | 0 / 13 |
| projects | 0 / 5 |
| hr | 0 / 4 |
| **Total** | **0 / 68** |

---

## GAPS FOUND

1. **CRITICAL: Zero previews on fresh project run.** All 67/68 checkpoints blocked by `owner_confirmation_missing`. The 1 unblocked checkpoint (PRJ-DREQ-003) has no operation definition. A fresh project cannot generate any previews or execution approvals — circular dependency: can't preview because blocked, can't unblock without preview to confirm.

2. **CRITICAL: Sales domain does not activate.** `RM-01="Products and services"` does not trigger sales activation. The activation engine expects specific array values like `["One-time product sales"]` or `PI-05="Yes"`. A business owner answering naturally would expect "Products and services" to activate Sales.

3. **CRITICAL: Industry pre-populated answers override user answers.** When `/api/pipeline/industry/select` saves state, a subsequent `/api/pipeline/run` loads the persisted state's answers instead of using the submitted ones if the state file already exists. User-supplied 70 answers are silently dropped.

4. **HIGH: 5 endpoints return 403 in dev mode.** `assertProjectMember` / `assertProjectLead` fail for the dev user `{id:'dev'}` because no local team membership exists. Affected: `/api/odoo/scan`, `/api/odoo/install-module`, `/api/audit/:projectId`, `/api/audit/:projectId/export`, `/api/team/invite`.

5. **HIGH: Auth flow non-functional without Supabase.** Both `/api/auth/signin` and `/api/auth/signup` fail. Signup additionally requires an invite code. The JWT bypass in dev mode works for most endpoints but produces a stub user that cannot pass membership checks.

6. **HIGH: BM-05 value ">&nbsp;10" treated as string, not numeric.** The activation engine computes `BM-05 > 10` but the answer `"> 10"` is a string. Domain activation works because the engine has string-aware comparison, but `BM-05` is stored as string `"> 10"` not numeric `15` — downstream assemblers that expect a number may fail silently.

7. **MEDIUM: Connection validate uses different project shape than register.** `/api/pipeline/connection/register` stores by `project_id` string, but `/api/connection/validate` creates a new project state and checks connection within that state. A project registered via the pipeline path appears unconnected to the validate path.

8. **MEDIUM: No server-side wizard-to-pipeline bridge.** Wizard push functions exist only in frontend (`wizard-push.js`). There is no API endpoint to submit wizard data and have it flow into `operation_definitions` or `intended_changes`. The bridge is entirely client-side JavaScript.

9. **MEDIUM: Checkpoint confirm fails on industry-select-created state.** `/api/pipeline/checkpoint/confirm` expects checkpoint records in persisted state, but the state created by `/api/pipeline/industry/select` does not include checkpoint records. Confirm returns: `checkpoint_id "FND-FOUND-001" not found in project state`.

10. **MEDIUM: Licence pricing returns 0 plans.** `/api/licence/pricing` returns empty `plans: []` — no Stripe configuration present.

11. **LOW: Domain inspect returns project shape, not model data.** `/api/domain/inspect` returns the full normalized project state instead of Odoo model record counts. The response does not include `results` with record counts as expected by the CLAUDE.md protocol.

12. **LOW: `RM-01="Products and services"` (string) vs `["One-time product sales"]` (array).** The discovery answer format for RM-01 is inconsistent between what a user would naturally answer and what the activation engine expects.

13. **LOW: No helpdesk, timesheets, expenses, or recruitment domains.** The business profile specifies these as active modules, but the domain activation engine covers only 23 domains. These 4 modules have no governance coverage.

---

## BROKEN FLOWS

1. **Fresh project end-to-end flow**: Industry select -> Pipeline run -> Preview -> Apply is BROKEN. Pipeline run generates 0 previews due to dependency-chain blocker. No path from zero to first governed write for a new project.

2. **Auth -> Project creation -> Team invite flow**: BROKEN. Auth requires Supabase, team invite requires project membership, no dev-mode path to create a project with team members.

3. **Scan -> Module discovery -> Domain activation flow**: BROKEN. Scan requires project membership (403 in dev mode). Even if scan succeeds, no path to feed scan results back into domain activation.

4. **Wizard -> Pipeline -> Apply flow**: BROKEN server-side. Wizard push is frontend-only. No API path from wizard field values to `intended_changes` on checkpoints.

5. **Audit trail flow**: PARTIALLY BROKEN. Audit write works, but audit read returns 403 (membership check). Audit export also 403.

---

## PRIORITY FIXES (Top 10)

1. **Break the blocker circular dependency.** FND-FOUND-001 and other root checkpoints with `dependencies: []` should not be blocked by `owner_confirmation_missing` when the pipeline run is the first run for a project. Allow previews to generate for unblocked-by-dependency checkpoints even without prior confirmation.

2. **Fix industry-select state collision.** When `/api/pipeline/run` is called with explicit `discovery_answers`, the submitted answers must take precedence over any persisted state from prior industry selection. Either merge (submitted overrides persisted) or require the caller to delete state first.

3. **Add dev-mode team membership bypass.** In the same pattern as `jwtMiddleware` (which returns `{id:'dev'}` when Supabase is not configured), `assertProjectMember` and `assertProjectLead` should return `true` in dev mode. This unblocks scan, audit read, team invite, and module install for local development.

4. **Accept natural-language RM-01 values.** `RM-01="Products and services"` should activate the sales domain. Either normalize the answer to the expected array format, or add string-matching logic to the sales activator.

5. **Wire wizard data to operation definitions.** Create a server-side endpoint (or extend `/api/pipeline/run`) that accepts wizard capture data and maps it to `operation_definitions` / `intended_changes` for the relevant checkpoints.

6. **Add Supabase-free auth flow.** For local development, provide a dev-mode signin that returns a valid-looking session without requiring Supabase. This enables testing the full auth -> project -> team flow locally.

7. **Normalize BM-05 to numeric.** Parse `"> 10"` string answers to numeric values where the activation engine or downstream assemblers expect numbers. Add input normalization in the discovery answer processing layer.

8. **Fix connection validate path.** `/api/connection/validate` should check the same connection registry used by `/api/pipeline/connection/register` instead of creating a new project state.

9. **Add checkpoint records to industry-select state.** When `/api/pipeline/industry/select` saves state, include generated checkpoint records so that `/api/pipeline/checkpoint/confirm` can find them without requiring a separate pipeline run.

10. **Add helpdesk, timesheets, expenses, recruitment domains.** These are common Odoo modules not covered by the current 23-domain activation engine.

---

## WHAT WORKS END TO END

- **Health check**: Server starts, responds on port 4174
- **Database detection**: Detects available databases on Odoo Online instances
- **Connection registration**: Registers credentials, persists to local file
- **Live Odoo connection**: Authenticates against majestic.odoo.com, achieves `connected_execute` status
- **Industry selection**: Returns meaningful pre-populated answers and domain previews for manufacturing
- **Pipeline orchestration**: Correctly activates domains based on discovery answers, generates 68 checkpoints across 9 domains, computes dependency chains and blocker cascades
- **State persistence**: Save and load cycle works for runtime state
- **Audit write**: Accepts and stores audit entries with valid action types
- **Early adopter tracking**: Returns slot availability
- **Test suite**: 3,330 tests pass with 0 failures, no regression from dummy run

## WHAT DOES NOT WORK YET

- **Zero governed writes possible on a fresh project.** The entire preview-approve-execute pipeline produces nothing because all checkpoints are blocked by `owner_confirmation_missing` before any confirmation can happen. This is the platform's core value proposition and it does not function for new projects.
- **Auth flow requires Supabase.** No local development path for signup/signin.
- **5 of 24 tested endpoints return 403** due to missing team membership in dev mode.
- **Sales domain does not activate** with natural-language answer `"Products and services"`.
- **Industry pre-selection silently overrides user answers** on subsequent pipeline runs.
- **Wizard data does not reach the pipeline** — frontend-only bridge with no server API.
- **No report generation, no go-live readiness endpoint, no pre-commit report.**
- **4 requested modules** (helpdesk, timesheets, expenses, recruitment) have **no domain coverage**.
- **Scan and module install** are blocked by membership check in dev mode.

---

## TEST SUITE

```
Baseline:  3,330 pass / 0 fail
Final:     3,330 pass / 0 fail
Regression: NONE
```
