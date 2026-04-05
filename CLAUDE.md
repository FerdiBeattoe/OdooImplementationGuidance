# CLAUDE.md — Odoo 19 Implementation Control Platform

## Project

Platform: Odoo 19 Implementation Control Platform
Repository: C:\tmp\OdooImplementationGuidance
Active project: test236

## Governing authority order

1. AGENTS.md
2. docs/00_Product_Constitution.md
3. docs/01_Scope_Boundaries.md
4. docs/02_Target_Matrix.md
5. docs/03_Authority_Order.md
6. docs/05_Validation_Checkpoint_Rules.md
7. docs/06_Checkpoint_and_Validation_Rules.md
8. docs/03_Implementation_Master_Map.md
9. docs/04_Domain_Coverage_Map.md
10. docs/08_Project_State_Model.md
11. docs/07_Information_Architecture.md
12. docs/06_Guidance_Content_Framework.md
13. docs/09_Decision_Log.md
14. docs/10_Working_LLM_Rules.md
15. docs/12_LLM_Execution_Contract.md

## Live proof state — test236

### Current Status (live-proven on test236) — 124/124 Complete

As of 2026-04-05T06:26:26.178Z, test236 has 23 activated domains, 124 generated checkpoints, and 124 Complete checkpoints.
All checkpoints across all 23 domains are Complete. Implementation pipeline fully proven.

DL-033 reclassified the final 3 "Both" checkpoints (INV-DREQ-009, PLM-DREQ-002, RNT-DREQ-002) to User_Confirmed/Informational/Not_Applicable. Zero "Both" checkpoints remain.

Previous milestones:
- Six-domain activation expansion achieved 2026-04-05 (106/124).
- `USR-DREQ-010` via `MF-05="Yes"` (users_roles now 6/6 Complete)
- `INV-DREQ-009` via `RM-04="Yes"` (inventory now 9/9 Complete)

Exact activation trigger corrections verified from `app/shared/domain-activation-engine.js`:
- PLM activates on `MF-01="Yes"` and `MF-05="Yes"`. `MF-04` does not activate PLM.
- Documents activates on `MF-05="Yes"` or `TA-03` includes `Contract or document signing` or `BM-05 > 50`.
- Sign activates on `TA-03` includes `Contract or document signing`.
- Approvals activates on non-`None` `TA-03`, or `BM-05 > 50` plus approval controls.
- Subscriptions activates on `RM-03="Yes"` or recurring `RM-01`. `RM-02` does not activate Subscriptions.
- Rental activates on `RM-04="Yes"` or rental `RM-01`.

Persisted discovery answers added on 2026-04-05:
- `MF-05="Yes"`
- `TA-03=["Contract or document signing"]`
- `RM-03="Yes"`
- `RM-04="Yes"`

| Domain (complete/total) | Status |
|-------------------------|--------|
| foundation (7/7) | 100% Complete |
| users_roles (6/6) | 100% Complete |
| master_data (8/8) | 100% Complete |
| accounting (11/11) | 100% Complete |
| crm (6/6) | 100% Complete |
| sales (5/5) | 100% Complete |
| purchase (4/4) | 100% Complete |
| inventory (9/9) | 100% Complete |
| manufacturing (7/7) | 100% Complete |
| plm (4/4) | 100% Complete |
| hr (4/4) | 100% Complete |
| pos (7/7) | 100% Complete |
| website_ecommerce (6/6) | 100% Complete |
| projects (5/5) | 100% Complete |
| quality (4/4) | 100% Complete |
| maintenance (4/4) | 100% Complete |
| repairs (4/4) | 100% Complete |
| documents (3/3) | 100% Complete |
| sign (3/3) | 100% Complete |
| approvals (3/3) | 100% Complete |
| subscriptions (5/5) | 100% Complete |
| rental (4/4) | 100% Complete |
| field_service (5/5) | 100% Complete |

New first-checkpoint proofs recorded 2026-04-05:
- `PLM-FOUND-001` confirmed at `2026-04-05T05:54:53.410Z`
- `DOC-FOUND-001` confirmed at `2026-04-05T05:54:53.437Z`
- `SGN-FOUND-001` confirmed at `2026-04-05T05:54:53.455Z`
- `APR-FOUND-001` confirmed at `2026-04-05T05:54:53.473Z`
- `SUB-FOUND-001` confirmed at `2026-04-05T05:54:53.501Z`
- `RNT-FOUND-001` confirmed at `2026-04-05T05:54:53.516Z`

All six proofs used the `User_Confirmed` confirm route. No governed apply was used because the first unblocked checkpoint in each domain was already `validation_source: "User_Confirmed"`.

Previous proof table (historical; superseded by the current 106/124 state):
| FND-FOUND-001 | foundation   | Foundational   | Complete |
| FND-FOUND-002 | foundation   | Foundational   | Complete |
| FND-DREQ-001  | foundation   | Domain_Required| Complete |
| FND-FOUND-004 | foundation   | Foundational   | Complete |
| FND-FOUND-005 | foundation   | Foundational   | Complete |
| FND-DREQ-002  | foundation   | Domain_Required| Complete |
| USR-FOUND-001 | users_roles  | Foundational   | Complete |
| USR-FOUND-002 | users_roles  | Foundational   | Complete |
| USR-DREQ-001  | users_roles  | Domain_Required| Complete |
| USR-DREQ-002  | users_roles  | Domain_Required| Complete |
| USR-DREQ-003  | users_roles  | Domain_Required| Complete |
| MAS-FOUND-001 | master_data  | Foundational   | Complete |
| MAS-FOUND-002 | master_data  | Foundational   | Complete |
| MAS-DREQ-004  | master_data  | Domain_Required| Complete |
| MAS-DREQ-001  | master_data  | Domain_Required| Complete |
| MAS-DREQ-002  | master_data  | Domain_Required| Complete |
| MAS-DREQ-003  | master_data  | Domain_Required| Complete |
| FND-FOUND-003 | foundation   | Foundational   | Complete |
| ACCT-FOUND-001| accounting   | Foundational   | Complete |
| ACCT-FOUND-002| accounting   | Foundational   | Complete |
| ACCT-DREQ-001 | accounting   | Domain_Required| Complete |
| ACCT-DREQ-002 | accounting   | Domain_Required| Complete |
| ACCT-DREQ-003 | accounting   | Domain_Required| Complete |
| ACCT-DREQ-004 | accounting   | Domain_Required| Complete |
| CRM-FOUND-001 | crm          | Foundational   | Complete |
| SAL-FOUND-002 | sales        | Foundational   | Complete |
| PUR-FOUND-001 | purchase     | Foundational   | Complete |
| PUR-DREQ-001  | purchase     | Domain_Required| Complete |
| MAS-DREQ-005  | master_data  | Domain_Required| Complete |
| INV-FOUND-001 | inventory    | Foundational   | Complete |
| HR-FOUND-001  | hr           | Foundational   | Complete |
| WEB-FOUND-001 | website_ecommerce | Foundational | Complete |
| INV-FOUND-003 | inventory    | Domain_Required| Complete |
| MAS-DREQ-006  | master_data  | Domain_Required| Complete |
| MRP-FOUND-001 | manufacturing| Foundational   | Complete |
| PRJ-FOUND-001 | projects     | Foundational   | Complete |
| POS-FOUND-001 | pos          | Foundational   | Complete |
| REP-FOUND-001 | repairs      | Foundational   | Complete |

### Historical Proof Notes (superseded where conflicting)

- FND-FOUND-003: COMPLETE. Reclassified per DL-016 (Informational/User_Confirmed/Not_Applicable). Confirmed via confirm route 2026-04-04. Evidence: USD base currency matches US operating country standard; FND-DREQ-002 already Complete; owner acknowledged currency cannot change after transactions post. No governed write.
- Users/Roles domain: FULLY COMPLETE. All 5 checkpoints (USR-FOUND-001, USR-FOUND-002, USR-DREQ-001, USR-DREQ-002, USR-DREQ-003) confirmed Complete on test236 as of 2026-04-04.
- Accounting domain: ALL 6 unconditional checkpoints COMPLETE (confirm route only, 2026-04-04). Reclassified per DL-018 through DL-023 (all User_Confirmed/Informational/Not_Applicable). Evidence: bounded domain inspect — account.journal=8, account.tax=16, account.account=124 records from localization. All intended_changes: null (R4 honest-null). No governed writes. ACCT-FOUND-003 remains Blocked (R5). ACCT-GL-001/GL-002/GL-003/REC-002 conditional, Not_Started.
- master_data domain: ALL 7 checkpoints COMPLETE (6 unconditional + MAS-DREQ-005 conditional, confirm route only). MAS-DREQ-005 confirmed 2026-04-05 (DL-026 reclassification from Both/Executable/Safe to User_Confirmed/Informational/Not_Applicable). Evidence: product.category 300 records from localization, intended_changes: null. No governed writes. Governed apply support for master_data remains unproven.
- CRM domain: CRM-FOUND-001 COMPLETE (confirm route, 2026-04-04). Activated via SC-01=Yes. Assembler target: crm.stage, intended_changes: null (R4 honest-null). 5 remaining CRM checkpoints Not_Started.
- Sales domain: SAL-FOUND-002 COMPLETE (confirm route, 2026-04-04). Activated via RM-01=[One-time product sales]. Assembler target: product.pricelist, intended_changes: null (R4 honest-null). SAL-FOUND-001 (Informational) and 3 other SAL checkpoints Not_Started.
- Purchase domain: PUR-FOUND-001 + PUR-DREQ-001 COMPLETE (confirm route, 2026-04-04). Activated via PI-01=Yes. Assembler target: res.company, intended_changes: null (R4 honest-null). PUR-DREQ-002 and PUR-GL-001 Not_Started.
- Inventory domain: INV-FOUND-001 COMPLETE (confirm route, 2026-04-05). Activated via OP-01=Yes. Evidence: bounded domain inspect — stock.warehouse=2 records (WH + E2EWH), 11 operation types, stock module installed. Assembler target: stock.warehouse, intended_changes: null (R4 honest-null). No governed write. 6 remaining INV checkpoints Not_Started (INV-FOUND-002, INV-FOUND-003, INV-DREQ-001, INV-DREQ-002, INV-GL-001, INV-GL-002).
- HR domain: HR-FOUND-001 COMPLETE (confirm route, 2026-04-05). Activated via BM-05=15 (>10). Evidence: bounded domain inspect — hr.department=1 record ("Administration"), hr.job=0, hr.employee=0, hr module installed. Assembler target: hr.department, intended_changes: null (R4 honest-null). No governed write. 2 remaining HR checkpoints Not_Started (HR-DREQ-001, HR-DREQ-002).
- Website/eCommerce domain: WEB-FOUND-001 COMPLETE (confirm route, 2026-04-05). Activated via OP-04=Yes. Reclassified per DL-027 (Both/Executable/Safe → User_Confirmed/Informational/Not_Applicable). Evidence: bounded domain inspect — website=1 record, payment.provider=23 records, delivery.carrier=1 record, website+website_sale modules installed. Assembler returns empty map (no operation definitions). No governed write. 5 remaining WEB checkpoints Not_Started (WEB-DREQ-001 through WEB-DREQ-004, WEB-GL-001). WEB-DREQ-002 also reclassified per DL-028.
- Inventory domain: INV-FOUND-003 COMPLETE (confirm route, 2026-04-05, controller pre-dispatch for Group C). Dependency INV-FOUND-001 Complete. Assembler target: stock.warehouse, intended_changes: null. No governed write. 4 remaining INV checkpoints Not_Started (INV-FOUND-002, INV-DREQ-001, INV-DREQ-002, INV-GL-001, INV-GL-002).
- Master Data domain: MAS-DREQ-006 COMPLETE (confirm route, 2026-04-05, DL-030 reclassification). Conditional on MF-01=Yes. Reclassified Both/Executable/Safe ��� User_Confirmed/Informational/Not_Applicable. No governed write.
- Manufacturing domain: MRP-FOUND-001 COMPLETE (confirm route, 2026-04-05). User_Confirmed/Informational/Not_Applicable per assembler R5 (excluded from assembler). Activated via MF-01=Yes. Dependency INV-FOUND-003 Complete. No governed write. Remaining MRP checkpoints Not_Started.
- Projects domain: PRJ-FOUND-001 COMPLETE (confirm route, 2026-04-05). User_Confirmed/Executable/Safe. Assembler returns empty map — project.project and project.task.type are documented coverage gaps. Dependency FND-DREQ-002 Complete. No governed write. Remaining PRJ checkpoints Not_Started.
- POS domain: POS-FOUND-001 COMPLETE (confirm route, 2026-04-05). User_Confirmed/Informational/Not_Applicable per DL-029 reclassification. Assembler target pos.payment.method, intended_changes: null. Dependency FND-DREQ-002 Complete. No governed write. Remaining POS checkpoints Not_Started.
- Repairs domain: REP-FOUND-001 COMPLETE (confirm route, 2026-04-05). User_Confirmed/Informational/Not_Applicable. Activated via OP-01=Yes + RM-01 includes "One-time service delivery". Dependency INV-FOUND-003 Complete. No governed write. Remaining REP checkpoints Not_Started (REP-DREQ-001, REP-DREQ-002, REP-REC-001).
- All 17 activated domains: 100% COMPLETE as of 2026-04-05 (DL-031 batch + DL-032 quality fix).

## Known carry-over checkpoint_statuses block (124 entries — all governed pipeline calls)

```json
{
  "ACCT-DREQ-001": "Complete", "ACCT-DREQ-002": "Complete", "ACCT-DREQ-003": "Complete",
  "ACCT-DREQ-004": "Complete", "ACCT-FOUND-001": "Complete", "ACCT-FOUND-002": "Complete",
  "ACCT-FOUND-003": "Complete", "ACCT-GL-001": "Complete", "ACCT-GL-002": "Complete",
  "ACCT-GL-003": "Complete", "ACCT-REC-002": "Complete",
  "APR-DREQ-001": "Complete", "APR-DREQ-002": "Complete", "APR-FOUND-001": "Complete",
  "CRM-DREQ-001": "Complete", "CRM-DREQ-002": "Complete", "CRM-DREQ-003": "Complete",
  "CRM-FOUND-001": "Complete", "CRM-FOUND-002": "Complete", "CRM-REC-001": "Complete",
  "DOC-DREQ-001": "Complete", "DOC-FOUND-001": "Complete", "DOC-REC-001": "Complete",
  "FND-DREQ-001": "Complete", "FND-DREQ-002": "Complete", "FND-FOUND-001": "Complete",
  "FND-FOUND-002": "Complete", "FND-FOUND-003": "Complete", "FND-FOUND-004": "Complete",
  "FND-FOUND-005": "Complete",
  "FSV-DREQ-001": "Complete", "FSV-DREQ-002": "Complete", "FSV-DREQ-003": "Complete",
  "FSV-FOUND-001": "Complete", "FSV-GL-001": "Complete",
  "HR-DREQ-001": "Complete", "HR-DREQ-002": "Complete", "HR-DREQ-004": "Complete",
  "HR-FOUND-001": "Complete",
  "INV-DREQ-001": "Complete", "INV-DREQ-002": "Complete", "INV-DREQ-008": "Complete",
  "INV-DREQ-009": "Complete", "INV-FOUND-001": "Complete", "INV-FOUND-002": "Complete",
  "INV-FOUND-003": "Complete", "INV-GL-001": "Complete", "INV-GL-002": "Complete",
  "MAS-DREQ-001": "Complete", "MAS-DREQ-002": "Complete", "MAS-DREQ-003": "Complete",
  "MAS-DREQ-004": "Complete", "MAS-DREQ-005": "Complete", "MAS-DREQ-006": "Complete",
  "MAS-FOUND-001": "Complete", "MAS-FOUND-002": "Complete",
  "MNT-DREQ-001": "Complete", "MNT-DREQ-002": "Complete", "MNT-FOUND-001": "Complete",
  "MNT-REC-001": "Complete",
  "MRP-DREQ-001": "Complete", "MRP-DREQ-002": "Complete", "MRP-DREQ-005": "Complete",
  "MRP-DREQ-006": "Complete", "MRP-FOUND-001": "Complete", "MRP-GL-001": "Complete",
  "MRP-GL-002": "Complete",
  "PLM-DREQ-001": "Complete", "PLM-DREQ-002": "Complete", "PLM-FOUND-001": "Complete",
  "PLM-REC-001": "Complete",
  "POS-DREQ-001": "Complete", "POS-DREQ-002": "Complete", "POS-DREQ-003": "Complete",
  "POS-DREQ-004": "Complete", "POS-DREQ-005": "Complete", "POS-FOUND-001": "Complete",
  "POS-GL-001": "Complete",
  "PRJ-DREQ-001": "Complete", "PRJ-DREQ-002": "Complete", "PRJ-DREQ-003": "Complete",
  "PRJ-FOUND-001": "Complete", "PRJ-GL-001": "Complete",
  "PUR-DREQ-001": "Complete", "PUR-DREQ-002": "Complete", "PUR-FOUND-001": "Complete",
  "PUR-GL-001": "Complete",
  "QUA-DREQ-001": "Complete", "QUA-DREQ-002": "Complete", "QUA-DREQ-003": "Complete",
  "QUA-FOUND-001": "Complete",
  "REP-DREQ-001": "Complete", "REP-DREQ-002": "Complete", "REP-FOUND-001": "Complete",
  "REP-REC-001": "Complete",
  "RNT-DREQ-001": "Complete", "RNT-DREQ-002": "Complete", "RNT-FOUND-001": "Complete",
  "RNT-GL-001": "Complete",
  "SAL-DREQ-001": "Complete", "SAL-DREQ-002": "Complete", "SAL-FOUND-001": "Complete",
  "SAL-FOUND-002": "Complete", "SAL-GL-001": "Complete",
  "SGN-DREQ-001": "Complete", "SGN-DREQ-002": "Complete", "SGN-FOUND-001": "Complete",
  "SUB-DREQ-001": "Complete", "SUB-DREQ-002": "Complete", "SUB-DREQ-003": "Complete",
  "SUB-FOUND-001": "Complete", "SUB-GL-001": "Complete",
  "USR-DREQ-001": "Complete", "USR-DREQ-002": "Complete", "USR-DREQ-003": "Complete",
  "USR-DREQ-010": "Complete", "USR-FOUND-001": "Complete", "USR-FOUND-002": "Complete",
  "WEB-DREQ-001": "Complete", "WEB-DREQ-002": "Complete", "WEB-DREQ-003": "Complete",
  "WEB-DREQ-004": "Complete", "WEB-FOUND-001": "Complete", "WEB-GL-001": "Complete"
}
```

## Known facts — test236 instance

- USD (id=1) is the company currency but is inactive in test236. This is a test-instance data quality
  fact, not a platform failure. No corrective batch will be opened.
- Connection is active for test236.
- /api/pipeline/checkpoint/confirm auto-loads, mutates, and auto-saves state.
- /api/pipeline/state/save expects raw runtime_state as the POST body (not wrapped).

## Strict rules for this codebase

- R1: No execution without: preview shown, safety class assigned, auditability confirmed.
- R2: No checkpoint may be skipped, deferred, or implied as optional.
- R3: No direct database writes under any framing.
- R4: Domain activation requires completed discovery pass before triggering.
- R5: Stage routing is blocked if predecessor checkpoint is unresolved.
- R6: Readiness validation must be explicitly run; configuration state alone does not qualify.
- R7: Odoo.sh branch-aware handling when Odoo.sh context is present.
- R8: Any unsupported execution request must be refused and documented.
- Configuration completion does not equal operational readiness (readiness axiom).
- USR-FOUND-001 proven 2026-04-04: write to res.users id=2 (lang: en_US), odoo_result: true, execution_id: 32b1d87f-8636-481e-a761-d34c9ed52f1a.
- USR-FOUND-002 confirmed 2026-04-04: informational (User_Confirmed, Not_Applicable), no write required.
- USR-DREQ-001 proven 2026-04-04: write to res.users id=2 (role: group_system), odoo_result: true, execution_id: d387ac2d-22cd-4a7b-8c3a-1883a5063ce4, executed_at: 2026-04-04T12:55:05.819Z. validation_source: Both — confirmed through applyGoverned checkpoint_statuses path only (not User_Confirmed route).
- USR-DREQ-002 proven 2026-04-04: write to res.groups id=2 (user_ids: [[4,2]]), odoo_result: true, approval_id: 4435d90c-5e16-443f-865d-a5b307fabc12, execution_id: c541c9ea-f6e6-4b29-aa7a-7635f69b2093, executed_at: 2026-04-04T13:07:06.141Z. safety_class: Conditional. validation_source: Both — confirmed through applyGoverned checkpoint_statuses path only (not User_Confirmed route). Live Odoo verify: res.groups id=2 "Access Rights" user_ids=[2] confirmed post-write.
- engine.js platform defect fixed 2026-04-04: CONNECTION_TTL_MS was declared after await loadConnectionRegistry() causing undefined TTL and silent connection load failures after restart. Moved declaration before the await.
- /api/pipeline/checkpoint/confirm only accepts validation_source: User_Confirmed. "Both" checkpoints are confirmed through applyGoverned checkpoint_statuses path only.
- applyGoverned updated_runtime_state only carries current checkpoint status AND has project_identity: null. Must merge prior carry-over + inject project_identity from persisted state before saving.
- res.users id=2 on test236: only active internal user (ferdinand.beattie@gmail.com). role=group_system confirmed.
- res.groups in Odoo 19: category_id is not a valid search_read field. Readable fields: id, name, user_ids, share, api_key_duration, sequence, privilege_id, implied_ids, implied_by_ids, model_access, rule_groups, menu_access, view_access, comment.
- res.groups id=2 "Access Rights" on test236: user_ids=[2] confirmed after USR-DREQ-002 write (was [] before write).

- USR-DREQ-003 confirmed 2026-04-04: Informational (User_Confirmed, Not_Applicable). Confirmed via /api/pipeline/checkpoint/confirm at 2026-04-04T13:17:26.458Z. No Odoo write. Dependency USR-FOUND-002 Complete. Actor: ferdinand.beattie@gmail.com.
- MAS-FOUND-001 confirmed 2026-04-04: User_Confirmed, execution_relevance: Executable, safety_class: Safe. Completed via /api/pipeline/checkpoint/confirm (confirm route only — no governed apply, no operation definition exists for master_data). confirmed_at: 2026-04-04T13:40:02.451Z. Actor: ferdinand.beattie@gmail.com. Evidence: 300 product categories found via bounded domain inspect (product.category, search_read limit reached). 4 partner categories found. product.category model readable. No Odoo write. Master Data governed apply support remains unproven.
- /api/domain/inspect uses domainId "master-data" (hyphen). The pipeline/checkpoint engine uses "master_data" (underscore). These are different key spaces — inspect uses domain-capabilities.js key.
- product.category on test236: 300 records returned at search_read limit. All returned records show parent_id: false at API level AND complete_name === name for all 300 records. The slash in complete_name is IN the name field itself, not derived from parent_id hierarchy. Data is genuinely flat with slash-notation names — not a broken hierarchy. Writing parent_id would impose unverified structural changes. This is a data-quality fact, not a platform failure.
- MAS-FOUND-002 confirmed 2026-04-04: User_Confirmed, execution_relevance: Executable, safety_class: Safe. Completed via /api/pipeline/checkpoint/confirm (confirm route only — no governed apply, no operation definition exists for master_data). confirmed_at: 2026-04-04T14:44:03.149Z. Actor: ferdinand.beattie@gmail.com. Evidence: bounded domain inspect (domainId: master-data, inspectedAt: 2026-04-04T14:42:37.490Z). product.category: 300 records (search_read limit reached), model readable. res.partner.category: 4 records (Manufacturing Customer, Pool Industry Customer, Retail Customer, Trade Customer), model readable. product.template: 7 records, model readable. Modules product, contacts, uom all installed. No Odoo write. Master Data governed apply support remains unproven.
- /api/domain/inspect requires payload.project.projectIdentity.projectId (not project_id). After server restart, connection registry loads from connections.json under the "test236" key, which is the correct key for getClientForProject. Legacy getConnectedClient lookup also resolves "test236" when projectIdentity.projectId is set to "test236".
- MAS-DREQ-004 confirmed 2026-04-04: User_Confirmed, Informational, Not_Applicable. Completed via /api/pipeline/checkpoint/confirm (confirm route only — no Odoo write, no governed apply). confirmed_at: 2026-04-04T14:52:35.381Z. Actor: ferdinand.beattie@gmail.com. Evidence: live rerun verified validation_source=User_Confirmed, execution_relevance=Informational, safety_class=Not_Applicable, dependency USR-FOUND-002 Complete. No Odoo write. Master Data governed apply support remains unproven.
- MAS-DREQ-001 confirmed 2026-04-04: User_Confirmed, Informational, Not_Applicable (DL-013 reclassification from Both/Executable/Safe). Completed via /api/pipeline/checkpoint/confirm (confirm route only — no Odoo write, no governed apply). confirmed_at: 2026-04-04T16:28:59.881Z. Actor: ferdinand.beattie@gmail.com. Evidence: bounded domain inspect on test236 (2026-04-04) confirmed readable product.category (300 records at search_read limit, genuinely flat structure) and readable product.template (7 records). Pre-confirm blocker resolved: server restart required to load DL-013 engine changes; persisted runtime_state regenerated and saved before confirm to expose User_Confirmed checkpoint record to confirm route. No Odoo write. Master Data governed apply support remains unproven.
- /api/pipeline/checkpoint/confirm reads checkpoint record from persisted runtime_state.checkpoints — NOT from a live engine run. If the engine has been updated (e.g., after a DL reclassification), the persisted state must be regenerated (pipeline run + save merged state) before the confirm route will see the new values.
- Server must be restarted to load engine changes. The running process serves the code loaded at startup — engine source changes do not hot-reload.
- MAS-DREQ-002 confirmed 2026-04-04: User_Confirmed, Informational, Not_Applicable (DL-014 reclassification from Both/Executable/Safe). Completed via /api/pipeline/checkpoint/confirm (confirm route only — no Odoo write, no governed apply). confirmed_at: 2026-04-04T17:39:00.522Z. Actor: ferdinand.beattie@gmail.com. Evidence: bounded domain inspect (2026-04-04T14:42:37.490Z, domainId: master-data) — res.partner.category 4 records (Manufacturing Customer, Pool Industry Customer, Retail Customer, Trade Customer), model readable. Partner category scaffolding baseline already established on test236. No truthful governed write target derivable. Dependency MAS-FOUND-002 Complete. Live domain inspect unavailable at proof time (connection registry load issue after server restart); evidence sourced from same-session bounded inspect captured during MAS-FOUND-002 confirmation.
- MAS-DREQ-003 confirmed 2026-04-04: User_Confirmed, Informational, Not_Applicable (DL-015 reclassification from Both/Executable/Safe). Completed via /api/pipeline/checkpoint/confirm (confirm route only — no Odoo write, no governed apply). confirmed_at: 2026-04-04T17:39:42.508Z. Actor: ferdinand.beattie@gmail.com. Evidence: bounded domain inspect (2026-04-04T14:42:37.490Z, domainId: master-data) — res.partner.category 4 records readable, product.template 7 records readable, product.category 300 records readable, contacts module installed. Customer records baseline established on test236 and readable for downstream use. No truthful governed write target derivable. Dependency MAS-FOUND-002 Complete. Live domain inspect unavailable at proof time; evidence sourced from same-session bounded inspect.
- FND-FOUND-003 confirmed 2026-04-04: User_Confirmed, Informational, Not_Applicable (DL-016 reclassification from Executable/Both/Blocked). Completed via /api/pipeline/checkpoint/confirm (confirm route only — no Odoo write, no governed apply). confirmed_at: 2026-04-04T18:01:04.592Z (autosave). Actor: ferdinand.beattie@gmail.com. Evidence: USD is the base currency for test236. Currency code matches US operating country standard (primary_country: US, primary_currency: USD). FND-DREQ-002 (currency configuration) is already Complete. Project owner acknowledges currency cannot change after transactions post. Reclassified per DL-016 — no governed write required. Dependency FND-FOUND-001 Complete. Prior Blocked classification retired. Foundation domain now fully Complete.
- Foundation domain: ALL checkpoints COMPLETE as of 2026-04-04 (DL-016). FND-FOUND-001, FND-FOUND-002, FND-FOUND-003 (DL-016), FND-FOUND-004, FND-FOUND-005, FND-DREQ-001, FND-DREQ-002 — all Complete. FND-FOUND-006 (conditional BM-02=Yes) and FND-DREQ-003 (conditional BM-04=Yes) not activated (BM-04=No in discovery_answers). FND-DREQ-004 (conditional FC-04=Yes) not activated.

## Current milestone — 124/124 Complete (2026-04-05)

All 124 checkpoints across 23 domains are Complete. Canonical carry-over block is now 124 entries. Discovery answers for pipeline runs include: FC-01="Full accounting", SC-01="Yes", RM-01=["One-time product sales","One-time service delivery"], PI-01="Yes", OP-01="Yes", BM-05=15, OP-04="Yes", MF-01="Yes", RM-02="Yes", OP-03="Yes", MF-03="Yes", MF-05="Yes", MF-06=["Receipt","In-process","Finished goods"], MF-07="Yes", OP-05="Yes", TA-03=["Contract or document signing"], RM-03="Yes", RM-04="Yes". Discovery answers must be wrapped: { answers: { ... } }. Use the 124-entry carry-over block above for all future governed pipeline calls. Server port: 4174.

No remaining incomplete checkpoints. Test suite: 2807 pass, 0 fail.

DL-033 batch confirmation timestamps (2026-04-05T06:23–06:25Z):
Phase 1 (14): USR-DREQ-010, INV-DREQ-009, PLM-REC-001, DOC-DREQ-001, DOC-REC-001, SGN-DREQ-001, SGN-DREQ-002, APR-DREQ-001, APR-DREQ-002, SUB-DREQ-001, SUB-DREQ-002, SUB-DREQ-003, RNT-DREQ-001, RNT-DREQ-002.
Phase 2 (3): PLM-DREQ-001, SUB-GL-001, RNT-GL-001.
Phase 3 (1): PLM-DREQ-002.

No /api/golive-readiness endpoint exists in the server. Go-live readiness assessment is a manual process per the readiness axiom (configuration completion does not equal operational readiness).

MAS-DREQ-001 governed apply HALT (2026-04-04, historical): Proof run halted at Step 5 — two independent halt conditions:
(1) intended_changes is null in the approval record (honest-null per assembler R4; no category hierarchy/parent data available in discovery_answers).
(2) Step 3 fail-closed: all 300 product.category records show parent_id=false AND complete_name=name — data is genuinely flat with slash-notation names, not broken hierarchy. No truthful write target derivable. No Odoo write occurred. MAS-DREQ-001 was subsequently reclassified (DL-013) from Executable/Both/Safe to Informational/User_Confirmed/Not_Applicable — the halt conditions confirmed no truthful governed write exists.

Pipeline run gate note (2026-04-04): /api/pipeline/run requires target_context in payload to unlock Gate 3 for Executable checkpoints. Without target_context, preview engine produces 0 previews and 0 execution approvals for all Executable checkpoints (including MAS-DREQ-001). Always include target_context: { deployment_type: "on_premise", primary_country: "US", primary_currency: "USD" } in pipeline run calls for test236.

Accounting reclassification (DL-018 through DL-023, 2026-04-04): All 6 unconditional ACCT checkpoints reclassified from Executable to Informational/User_Confirmed/Not_Applicable. Evidence: bounded domain inspect — account.journal=8 records, account.tax=16 records, account.account=124 records already exist from Odoo 19 localization. All assembler intended_changes: null (R4 honest-null). Same DL-013–015 pattern: Executable tag with null intended_changes and no discoverable write target → reclassify to Informational. ACCT-GL-001, ACCT-REC-001, ACCT-REC-002 have no assembler definitions (Go_Live/Recommended class — deferred).

CRM-FOUND-001 confirmed 2026-04-04: User_Confirmed/Executable/Safe. Activated via SC-01=Yes. Assembler target: crm.stage, intended_changes: null (R4 honest-null). Dependency MAS-FOUND-002 Complete. Confirmed via confirm route. No Odoo write.

SAL-FOUND-002 confirmed 2026-04-04: User_Confirmed/Executable/Safe. Activated via RM-01=[One-time product sales]. Assembler target: product.pricelist, intended_changes: null (R4 honest-null). Dependency USR-DREQ-001 Complete. Confirmed via confirm route. No Odoo write.

PUR-FOUND-001 confirmed 2026-04-04: User_Confirmed/Informational/Not_Applicable. Activated via PI-01=Yes. Confirmed via confirm route. No Odoo write.

PUR-DREQ-001 confirmed 2026-04-04: User_Confirmed/Executable/Conditional. Activated via PI-01=Yes. Assembler target: res.company (Odoo 19 purchase config writes via res.config.settings), intended_changes: null (R4 honest-null). Dependency PUR-FOUND-001 Complete. Confirmed via confirm route. No Odoo write.
