SECTION 1  WHAT IS FULLY BUILT AND WORKING
- PROVEN — Team & user management (app/backend/server.js /api/team/*, app/frontend/src/views/team-view.js, app/backend/audit-service.js) delivers invites, role changes, permission checks, last-project-lead protection, and audit logging.
- PROVEN — Audit log (server.js /api/audit/:projectId, /api/audit/:projectId/export, app/frontend/src/views/audit-log-view.js) ships filterable timeline, CSV export, and provenance for every audit write.
- PROVEN — Pre-commit module report (app/frontend/src/views/pre-commit-report-view.js, server.js /api/audit/write, pdfmake assets) generates grouped summaries, COMMIT modal enforcement, and PDF export for the Review & Commit flow.
- PROVEN — Odoo instance scanner and module installer (server.js /api/odoo/scan, /api/odoo/install-module, app/frontend/src/views/instance-scanner-view.js) authenticate against a live instance, stream company/module metadata, and fire module installation with audit trail.
- PROVEN — Auth + project provisioning (server.js /api/auth/*, auth-service.js, invite-service.js, licence-service.js) handles Supabase signup/signin, invite code enforcement, auto project creation, and project lead assignment.
- BUILT — Onboarding wizard + pipeline runner (app/frontend/src/views/onboarding-wizard.js, app/frontend/src/state/onboarding-store.js, server.js /api/pipeline/run|resume|state/*) capture discovery answers, compute activated domains, and persist runtime_state, but no wizard capture posts or non-foundation intended_changes reach the pipeline.
- BUILT — Pipeline dashboard + runtime persistence (app/frontend/src/views/pipeline-dashboard.js, app/backend/server.js handlers for pipeline apply/confirm/go-live report) render checkpoints, blockers, approvals, and go-live exports even though most operation definitions are honest-null.

SECTION 2  WHAT IS PARTIALLY BUILT
- Checkpoint guidance dataset exists (app/backend/data/checkpoint-guidance.json) and pipeline-dashboard.js has a hidden toggle, but the planned F5 expandable guidance panel plus human QA for Projects/Website/Documents/Sign/Approvals/Repairs/Maintenance/Subscriptions/Rental has not shipped; coverage gaps remain unreviewed.
- Wizard capture support exists server-side (/api/pipeline/wizard-capture, WIZARD_DOMAIN_ASSEMBLERS in server.js) yet no frontend view calls this route, so the intended foundation/inventory captures never persist and no wizard-driven intended_changes reach runtime_state.
- Data import UX (app/frontend/src/views/data-import-view.js) renders grids, CSV upload, paste parsing, and activity logs, but every push function in app/frontend/src/views/grid-push.js is a REFUSED stub, so no governed write occurs.
- Implementation dashboard (app/frontend/src/views/implementation-dashboard-view.js) calculates KPIs from client-side stores (getModuleCompletionStatus, getGovernedRoadmapSteps) instead of real pipeline state, so reported progress is synthetic.
- Operation definition files exist for 50+ domains, yet almost all emit intended_changes: null and there is no UI to collect the required inputs; the governed pipeline cannot produce previews with actionable payloads.
- Licence/coverage gating highlights Projects, Website/eCommerce, Documents, Sign, Approvals, Repairs, Maintenance, Subscriptions, and Rental as coverage gaps in AGENTS.md, but no tooling marks those domains manual/out-of-scope or blocks users from assuming they are governed.

SECTION 3  WHAT IS MISSING ENTIRELY
- F6 RAG assistant: no pgvector tables, ingestion jobs, or frontend assistant exist; there is no scoped retrieval layer over checkpoint guidance + methodology docs.
- Paddle/upgrade flow: licence-service.js can create payment intents, but there is no Paddle webhook wiring, UI to purchase, or enforcement of paid-only domains.
- Manual/out-of-scope classification flow: there is no UX to record why a domain is marked manual, no reporting surface, and no way to include that state in go-live or pipeline dashboards.

SECTION 4  END-TO-END WRITE PATH STATUS PER DOMAIN
- Domain: Accounting
  Operation definitions: FILLED (app/shared/accounting-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (account.account, account.journal)
  End-to-end proven: NO
  Blocker: accounting-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Accounting Reports
  Operation definitions: FILLED (app/shared/accounting-reports-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (account.financial.html.report, account.report blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to account.financial.html.report, account.report, so even with checkpoint definitions the apply route fails closed.

- Domain: Appraisals
  Operation definitions: FILLED (app/shared/appraisals-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (hr.appraisal, hr.appraisal.goal blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to hr.appraisal, hr.appraisal.goal, so even with checkpoint definitions the apply route fails closed.

- Domain: Approvals
  Operation definitions: FILLED (app/shared/approvals-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (approval.category)
  End-to-end proven: NO
  Blocker: approvals-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Attendance
  Operation definitions: FILLED (app/shared/attendance-operation-definitions.js)
  Push function: MISSING
  Allowed models: PARTIAL (hr.attendance blocked)
  End-to-end proven: NO
  Blocker: Only res.company are allowed models today; hr.attendance stay disallowed so critical checkpoints never reach execution.

- Domain: Calendar
  Operation definitions: FILLED (app/shared/calendar-operation-definitions.js)
  Push function: MISSING
  Allowed models: PARTIAL (calendar.event blocked)
  End-to-end proven: NO
  Blocker: Only res.users are allowed models today; calendar.event stay disallowed so critical checkpoints never reach execution.

- Domain: Consolidation
  Operation definitions: FILLED (app/shared/consolidation-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (consolidation.company, consolidation.period blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to consolidation.company, consolidation.period, so even with checkpoint definitions the apply route fails closed.

- Domain: CRM
  Operation definitions: FILLED (app/shared/crm-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (crm.stage, crm.team)
  End-to-end proven: NO
  Blocker: crm-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Discuss
  Operation definitions: FILLED (app/shared/discuss-operation-definitions.js)
  Push function: MISSING
  Allowed models: PARTIAL (mail.channel blocked)
  End-to-end proven: NO
  Blocker: Only res.users are allowed models today; mail.channel stay disallowed so critical checkpoints never reach execution.

- Domain: Documents
  Operation definitions: FILLED (app/shared/documents-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (documents.folder)
  End-to-end proven: NO
  Blocker: documents-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Email Marketing
  Operation definitions: FILLED (app/shared/email-marketing-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (mailing.list, mailing.mailing blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to mailing.list, mailing.mailing, so even with checkpoint definitions the apply route fails closed.

- Domain: Events
  Operation definitions: FILLED (app/shared/events-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (event.event, event.tag blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to event.event, event.tag, so even with checkpoint definitions the apply route fails closed.

- Domain: Expenses
  Operation definitions: FILLED (app/shared/expenses-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (hr.expense, hr.expense.sheet blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to hr.expense, hr.expense.sheet, so even with checkpoint definitions the apply route fails closed.

- Domain: Field Service
  Operation definitions: FILLED (app/shared/field-service-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (hr.employee)
  End-to-end proven: NO
  Blocker: field-service-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Fleet
  Operation definitions: FILLED (app/shared/fleet-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (fleet.vehicle, fleet.vehicle.model blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to fleet.vehicle, fleet.vehicle.model, so even with checkpoint definitions the apply route fails closed.

- Domain: Foundation
  Operation definitions: FILLED (app/shared/foundation-operation-definitions.js)
  Push function: EXISTS
  Allowed models: YES (res.company)
  End-to-end proven: NO
  Blocker: Wizard capture/API plumbing is missing on the frontend, so the non-null intended_changes from foundation-operation-definitions.js never reach runtime_state and no approval can run.

- Domain: Helpdesk
  Operation definitions: FILLED (app/shared/helpdesk-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (helpdesk.team, helpdesk.ticket blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to helpdesk.team, helpdesk.ticket, so even with checkpoint definitions the apply route fails closed.

- Domain: HR
  Operation definitions: FILLED (app/shared/hr-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (hr.department, hr.job, res.company)
  End-to-end proven: NO
  Blocker: hr-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Incoming Mail
  Operation definitions: FILLED (app/shared/incoming-mail-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (fetchmail.server, mail.alias blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to fetchmail.server, mail.alias, so even with checkpoint definitions the apply route fails closed.

- Domain: Inventory
  Operation definitions: FILLED (app/shared/inventory-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (stock.picking.type, stock.warehouse)
  End-to-end proven: NO
  Blocker: inventory-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: IoT
  Operation definitions: FILLED (app/shared/iot-operation-definitions.js)
  Push function: MISSING
  Allowed models: PARTIAL (iot.device blocked)
  End-to-end proven: NO
  Blocker: Only pos.config are allowed models today; iot.device stay disallowed so critical checkpoints never reach execution.

- Domain: Knowledge
  Operation definitions: FILLED (app/shared/knowledge-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (knowledge.article blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to knowledge.article, so even with checkpoint definitions the apply route fails closed.

- Domain: Live Chat
  Operation definitions: FILLED (app/shared/live-chat-operation-definitions.js)
  Push function: MISSING
  Allowed models: PARTIAL (im_livechat.channel blocked)
  End-to-end proven: NO
  Blocker: Only res.users are allowed models today; im_livechat.channel stay disallowed so critical checkpoints never reach execution.

- Domain: Loyalty
  Operation definitions: FILLED (app/shared/loyalty-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (loyalty.program, loyalty.reward blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to loyalty.program, loyalty.reward, so even with checkpoint definitions the apply route fails closed.

- Domain: Lunch
  Operation definitions: FILLED (app/shared/lunch-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (lunch.product, lunch.supplier blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to lunch.product, lunch.supplier, so even with checkpoint definitions the apply route fails closed.

- Domain: Maintenance
  Operation definitions: FILLED (app/shared/maintenance-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (maintenance.equipment, maintenance.request blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to maintenance.equipment, maintenance.request, so even with checkpoint definitions the apply route fails closed.

- Domain: Manufacturing
  Operation definitions: FILLED (app/shared/manufacturing-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (mrp.workcenter)
  End-to-end proven: NO
  Blocker: manufacturing-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Master Data
  Operation definitions: FILLED (app/shared/master-data-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (product.category, res.partner.category)
  End-to-end proven: NO
  Blocker: master-data-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Outgoing Mail
  Operation definitions: FILLED (app/shared/outgoing-mail-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (ir.config_parameter, ir.mail_server blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to ir.config_parameter, ir.mail_server, so even with checkpoint definitions the apply route fails closed.

- Domain: Payroll
  Operation definitions: FILLED (app/shared/payroll-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (hr.payslip, hr.salary.rule blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to hr.payslip, hr.salary.rule, so even with checkpoint definitions the apply route fails closed.

- Domain: Planning
  Operation definitions: FILLED (app/shared/planning-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (planning.role, planning.slot blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to planning.role, planning.slot, so even with checkpoint definitions the apply route fails closed.

- Domain: PLM
  Operation definitions: FILLED (app/shared/plm-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (mrp.eco.type)
  End-to-end proven: NO
  Blocker: plm-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Point of Sale
  Operation definitions: FILLED (app/shared/pos-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (pos.payment.method)
  End-to-end proven: NO
  Blocker: pos-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Projects
  Operation definitions: FILLED (app/shared/projects-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (project.project, project.task.type)
  End-to-end proven: NO
  Blocker: projects-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Purchase
  Operation definitions: FILLED (app/shared/purchase-operation-definitions.js)
  Push function: EXISTS
  Allowed models: YES (res.company)
  End-to-end proven: NO
  Blocker: Wizard capture/API plumbing is missing on the frontend, so the non-null intended_changes from purchase-operation-definitions.js never reach runtime_state and no approval can run.

- Domain: Quality
  Operation definitions: FILLED (app/shared/quality-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (quality.point)
  End-to-end proven: NO
  Blocker: quality-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Recruitment
  Operation definitions: FILLED (app/shared/recruitment-operation-definitions.js)
  Push function: MISSING
  Allowed models: PARTIAL (hr.applicant blocked)
  End-to-end proven: NO
  Blocker: Only hr.job are allowed models today; hr.applicant stay disallowed so critical checkpoints never reach execution.

- Domain: Referrals
  Operation definitions: FILLED (app/shared/referrals-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (hr.referral, hr.referral.stage blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to hr.referral, hr.referral.stage, so even with checkpoint definitions the apply route fails closed.

- Domain: Rental
  Operation definitions: FILLED (app/shared/rental-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (product.template, sale.order blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to product.template, sale.order, so even with checkpoint definitions the apply route fails closed.

- Domain: Repairs
  Operation definitions: FILLED (app/shared/repairs-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (repair.order blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to repair.order, so even with checkpoint definitions the apply route fails closed.

- Domain: Sales
  Operation definitions: FILLED (app/shared/sales-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (product.pricelist)
  End-to-end proven: NO
  Blocker: sales-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Sign
  Operation definitions: FILLED (app/shared/sign-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (sign.template)
  End-to-end proven: NO
  Blocker: sign-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: SMS Marketing
  Operation definitions: FILLED (app/shared/sms-marketing-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (mailing.mailing, sms.sms blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to mailing.mailing, sms.sms, so even with checkpoint definitions the apply route fails closed.

- Domain: Spreadsheet
  Operation definitions: FILLED (app/shared/spreadsheet-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (documents.document, spreadsheet.template blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to documents.document, spreadsheet.template, so even with checkpoint definitions the apply route fails closed.

- Domain: Studio
  Operation definitions: FILLED (app/shared/studio-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (ir.model, ir.ui.view blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to ir.model, ir.ui.view, so even with checkpoint definitions the apply route fails closed.

- Domain: Subscriptions
  Operation definitions: FILLED (app/shared/subscriptions-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (account.journal, sale.subscription.plan)
  End-to-end proven: NO
  Blocker: subscriptions-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Timesheets
  Operation definitions: FILLED (app/shared/timesheets-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (hr.timesheet, project.task blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to hr.timesheet, project.task, so even with checkpoint definitions the apply route fails closed.

- Domain: Users / Roles / Security
  Operation definitions: FILLED (app/shared/users-roles-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (res.groups, res.users)
  End-to-end proven: NO
  Blocker: users-roles-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: VoIP
  Operation definitions: FILLED (app/shared/voip-operation-definitions.js)
  Push function: MISSING
  Allowed models: PARTIAL (voip.provider blocked)
  End-to-end proven: NO
  Blocker: Only res.users are allowed models today; voip.provider stay disallowed so critical checkpoints never reach execution.

- Domain: Website & eCommerce
  Operation definitions: FILLED (app/shared/website-ecommerce-operation-definitions.js)
  Push function: MISSING
  Allowed models: YES (delivery.carrier, payment.provider, website)
  End-to-end proven: NO
  Blocker: website-ecommerce-operation-definitions.js only emits intended_changes: null because there is no data capture or assembler for this domain; previews stay informational.

- Domain: Whatsapp
  Operation definitions: FILLED (app/shared/whatsapp-operation-definitions.js)
  Push function: MISSING
  Allowed models: NO (whatsapp.account, whatsapp.template blocked)
  End-to-end proven: NO
  Blocker: governed-odoo-apply-service.js does not allow writes to whatsapp.account, whatsapp.template, so even with checkpoint definitions the apply route fails closed.
SECTION 5  BUILD ORDER
TIER 1  INVESTOR DEMO (must work now)
1. Item: Wire wizard capture + execute Foundation/Purchase writes
   Files to create/modify: app/frontend/src/views/onboarding-wizard.js, app/frontend/src/state/onboarding-store.js, app/backend/server.js (/api/pipeline/wizard-capture), foundation-operation-definitions.js, purchase-operation-definitions.js
   Input: Discovery answers + wizard forms for country/currency/fiscal-year and purchase approval settings
   Output: Non-null intended_changes persisted in runtime_state plus executable approvals that call applyGoverned against res.company
   Complexity: Large
   Depends on: Existing onboarding flow and pipeline state persistence
2. Item: Surface checkpoint guidance + coverage-gap review
   Files to create/modify: app/backend/data/checkpoint-guidance.json, docs coverage review notes, app/frontend/src/views/pipeline-dashboard.js (renderGuidanceToggle)
   Input: Generated guidance JSON + human review notes for gap domains
   Output: Expandable guidance panel per checkpoint with reviewed content for Projects, Website/eCommerce, Documents, Sign, Approvals, Repairs, Maintenance, Subscriptions, Rental
   Complexity: Medium
   Depends on: Guidance JSON already present
3. Item: Wire implementation dashboard to runtime_state
   Files to create/modify: app/frontend/src/views/implementation-dashboard-view.js, app/frontend/src/state/pipeline-store.js, app/frontend/src/state/app-store.js
   Input: pipelineStore.runtime_state (activated domains, checkpoint_statuses, executions)
   Output: Accurate KPIs (modules configured, checkpoints remaining, overall progress) that match pipeline reality
   Complexity: Medium
   Depends on: Tier 1 Item 1 producing real runtime_state changes

TIER 2  FIRST PAYING CUSTOMER
4. Item: Expand ALLOWED_APPLY_MODELS + targeted operation definitions
   Files to create/modify: app/backend/governed-odoo-apply-service.js, operation definition files for CRM, Sales, Inventory, Users/Roles, Subscriptions, Projects
   Input: Coverage gap model list from .codex/build-complete.md + per-domain target models
   Output: Apply service accepts crm.stage/product.pricelist/etc, and operation definitions populate intended_changes for priority checkpoints
   Complexity: Large
   Depends on: Tier 1 Item 1 proving the governed apply path
5. Item: Governed data import pipeline
   Files to create/modify: app/frontend/src/views/data-import-view.js, app/frontend/src/views/grid-push.js, new backend route (e.g., /api/data-import/push) that calls applyGoverned per row, shared operation definitions for master data
   Input: Validated grid rows (products, partners, BOMs) + project_id/approval context
   Output: Rows batched into pipeline approvals with audit entries instead of REFUSED stubs
   Complexity: Large
   Depends on: Tier 2 Item 4 expanding allowed models for master data
6. Item: Domain-specific wizard/data capture surface
   Files to create/modify: New frontend forms per domain (e.g., inventory wizard), onboarding-store to store wizard_captures, server wizard assemblers (extend WIZARD_DOMAIN_ASSEMBLERS)
   Input: Guided form responses for inventory routes, approval thresholds, valuation settings
   Output: wizard_captures persisted and fed into operation definitions for additional domains
   Complexity: Large
   Depends on: Tier 1 Item 1 establishing wizard capture plumbing

TIER 3  V2 COMPLETE (full product vision)
7. Item: F6 RAG assistant
   Files to create/modify: New backend service (e.g., app/backend/rag-service.js), Supabase pgvector migration, ingestion job for docs + guidance, frontend assistant view
   Input: Checkpoint guidance + constitutional docs + user questions
   Output: Scoped retrieval answers with citations, no internet access, bound to methodology
   Complexity: Large
   Depends on: Tier 2 guidance review so corpus is accurate
8. Item: Paddle billing + domain unlock UX
   Files to create/modify: licence-service.js, new Paddle webhook handler, frontend upgrade modal, app/frontend state to lock/unlock domains
   Input: Paddle checkout results + licence tiers
   Output: Paid domain unlocks, early adopter slots tracking, visible upgrade prompts
   Complexity: Medium
   Depends on: Tier 2 Item 4 so there is value behind the paywall
9. Item: Extend governed writes to optional domains (Documents, Sign, Approvals, Rentals, etc.)
   Files to create/modify: operation-definition files for each domain, apply service ALLOWED_APPLY_MODELS, new data capture views
   Input: Domain-specific configuration requirements + allowed model list
   Output: Honest previews + executable approvals for every V2 in-scope domain
   Complexity: Large
   Depends on: Tier 2 Item 4 and Item 6 infrastructure

SECTION 6  CRITICAL PATH
1. Close the loop on wizard capture + foundation/purchase execution (Tier 1 Item 1) before any other deliverable—without a single proven governed write the investor demo fails.
2. Immediately after, connect runtime_state to the implementation dashboard (Tier 1 Item 3) so progress reporting reflects reality; investors need to see honest telemetry.
3. Expand ALLOWED_APPLY_MODELS for customer-facing domains (Tier 2 Item 4) next—the rest of the plan (data import, additional wizards, billing) depends on those models being executable.
4. Build the governed data import and additional wizards (Tier 2 Items 5 & 6) once the apply surface exists; both rely on the expanded write gate.
5. Only after governed execution flows are stable should we invest in RAG and Paddle work (Tier 3 Items 7 & 8); they depend on having real data + value in the system.

SECTION 7  RISK LIST
- Domain execution gap: 50 of 52 domains only emit intended_changes: null, so the governed pipeline cannot actually push changes. Without wizard/data capture, the end goal (“truthful governed writes”) remains unmet.
- Allowed models gap: governed-odoo-apply-service.js excludes most models listed in .codex/build-complete.md (accounting reports, events, helpdesk, fleet, loyalty, etc.). Until expanded, those domains can never be proven.
- Data import bypass: grid push is intentionally disabled (grid-push.js returns REFUSED). Customers cannot load baseline data and may attempt manual Odoo edits, breaking the governed promise.
- Coverage gap domains: Projects, Website/eCommerce, Documents, Sign, Approvals, Repairs, Maintenance, Subscriptions, and Rental remain unreviewed but appear in UI; this risks overstating coverage.
- RAG/billing dependencies: No pgvector corpus or Paddle flow exists; attempting to sell or demo AI assistance/billing before the governed engine works will damage credibility.
