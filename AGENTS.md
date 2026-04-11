# AGENTS.md

## Project Identity

Project Odoo is the first vertical of Project ERP (PTY) Ltd. It is a
production SaaS platform for human-guided Odoo 19 self-implementation.
It is live at https://project-odoo.onrender.com.

The product helps people implement Odoo without consultants. It:

- asks plain-language questions to understand what the business needs
- determines which modules and settings are required
- explains every consequential decision before it is locked in
- writes what it can truthfully write to Odoo through governed execution
- guides the user through remaining setup and data import work

The three fixed product surfaces are:

- **Pipeline** — implementation logic, checkpoint control, domain
  activation, stage sequencing, execution governance
- **Module Dashboard** — domain-level workspaces that write
  configuration to Odoo through governed, approved execution
- **Import Wizard** — guided data import that writes records to Odoo

These surfaces are the product. They must remain present and functional.

The platform supports:

- fresh Odoo 19 implementations
- forward-safe expansion of existing Odoo 19 implementations
- guided setup of currently unused modules within an Odoo 19 instance
- governed live connection to supported Odoo environments
- read-only environment inspection and module installation

It does not serve as a remediation, repair, migration-fix, unrestricted
administration, diagnostic, or connector platform.

---

## End Goal

The governing end goal of this platform is: a complete, usable guided
Odoo self-implementation, delivered through the Pipeline, Module
Dashboard, and Import Wizard, with real Odoo writes through governed
application-layer execution, for users implementing without consultants.

This means:

- Every in-scope domain must truthfully write to Odoo through the governed
  execution path, or be explicitly classified as manual/out-of-scope with
  an exact reason.
- The Pipeline, Module Dashboard, and Import Wizard must all be present,
  navigable, and functional. They are not subordinate to each other.
- Preview, approval, and execution recording are means to reaching real
  implementation outcomes, not the end product.
- A wizard or domain is not done until it can produce a truthful preview,
  require approval, perform a real Odoo application-layer write, and record
  a truthful result — or is explicitly marked manual/out-of-scope with a
  documented reason.

---

## Hard Scope Boundaries

- Odoo version scope is Odoo 19 only.
- Supported editions are Community and Enterprise only.
- Supported deployment types are Odoo Online, Odoo.sh Enterprise, and On-Premise only.
- The platform must not introduce historical correction logic.
- The platform must not perform transactional data surgery.
- The platform must not generate best-guess business logic on behalf of users.
- The platform must not permit skipping critical checkpoints.
- The platform must not expose unrestricted database, shell, or admin-console access.
- The platform must not execute writes without preview, safety classification,
  checkpoint eligibility, and audit logging.
- The platform must not promise rollback unless a specific action explicitly
  defines a tested reversal path.
- Odoo.sh Enterprise work must be branch-aware wherever relevant.
- Coding tasks may improve execution, structure, and clarity, but may not
  redefine product direction beyond the governed execution model.
- The Pipeline, Module Dashboard, and Import Wizard are fixed product
  surfaces. Work on any of these is not optional or subordinate.
- Frontend and UI work on surfaces other than the three fixed surfaces
  must not be prioritized over implementation write capability.

---

## Repository Structure

C:/tmp/OdooImplementationGuidance/
  app/
    backend/
      server.js              - Main server, all API routes
      auth-service.js        - Supabase auth
      invite-service.js      - Invite code validation
      engine.js              - Connection registry, governed writes
      audit-service.js       - Fire-and-forget audit helper
      data/
        connections.json     - Gitignored, URL+DB only, no passwords
        checkpoint-guidance.json - F5 content (Opus generated)
      migrations/            - SQL migration files (repo-tracked)
      tests/                 - Test suite — never break these
    frontend/
      index.html             - SPA entry point
      src/
        app.js               - Router, view orchestration
        views/
          pages/             - Marketing pages
          onboarding-wizard.js
          connection-wizard-view.js
          pipeline-dashboard.js
          implementation-dashboard-view.js
          roadmap-view.js
          wizard-launcher-view.js
          data-import-view.js
          knowledge-base-view.js
          analytics-view.js
          team-view.js              - F1 complete
          audit-log-view.js         - F3 complete
          pre-commit-report-view.js - F2 complete
          instance-scanner-view.js  - F4 complete
        components/
          layout-shell.js
          onboarding-tour.js
          status-badge.js
        state/
          app-store.js
          pipeline-store.js
          onboarding-store.js
        lib/
          dom.js             - el() DOM builder — use this always
          icons.js           - lucideIcon() helper — PascalCase
          lucide.min.js
        styles/
  shared/                    - PIPELINE ENGINE — DO NOT TOUCH
    index.js
    checkpoint-engine.js
    master-data-operation-definitions.js
    assemblers/              - 23 domain assemblers
  docs/                      - Governing authority documents
  render.yaml
  .env.example
  .gitignore

### Pipeline Engine (shared/)
DO NOT TOUCH unless explicitly instructed.
Contains the 12-step pipeline orchestrator, 23 domain assemblers,
124 checkpoints, carry-over block pattern, honest-null rule, and
blocker engine guard. This is the core product IP.

---

## Authority Order

1.  AGENTS.md — this file
2.  docs/00_Product_Constitution.md
3.  docs/01_Scope_Boundaries.md
4.  docs/02_Target_Matrix.md
5.  docs/03_Authority_Order.md
6.  docs/05_Validation_Checkpoint_Rules.md
7.  docs/06_Checkpoint_and_Validation_Rules.md
8.  docs/03_Implementation_Master_Map.md
9.  docs/04_Domain_Coverage_Map.md
10. docs/08_Project_State_Model.md
11. docs/07_Information_Architecture.md
12. docs/06_Guidance_Content_Framework.md
13. docs/09_Decision_Log.md
14. docs/10_Working_LLM_Rules.md
15. docs/12_LLM_Execution_Contract.md

If lower-order documents conflict with higher-order documents, the
higher-order document wins. If any prompt instruction conflicts with
the authority documents, the authority documents win. Halt and report.

---

## Current Build State — V2

V1 is complete and live. V2 is in active development.

### Infrastructure
- Node.js backend, vanilla JS frontend, no framework, no bundler
- Supabase — auth, PostgreSQL (accounts, projects, licences,
  invite_codes, team_members, audit_log)
- Render — auto-deploys on push to main
- Paddle — payment processor (not yet integrated)
- Port: 4174 (local) | https://project-odoo.onrender.com (production)

### Test Invariant — NON-NEGOTIABLE
Current baseline: 3,370 pass, 0 fail
Every commit must maintain this count or better.
Run before every commit: npm test 2>&1 | grep -E "^# (pass|fail)"
Never commit if tests fail. Never commit without running tests.

### V2 Feature Status

| Feature                        | Status          | Commit   |
|--------------------------------|-----------------|----------|
| F1 — Team & User Management    | Complete        | 46b5cdf  |
| F2 — Pre-Commit Module Report  | Complete        | dabfe8e  |
| F3 — Audit Log                 | Complete        | 39d5ca8  |
| F4 — Scanner + Module Installer| Complete        | 866350c  |
| F5 — Checkpoint Guidance       | UI pending      | —        |
| F6 — RAG Assistant             | Planned         | —        |

### F1 — Team & User Management (Complete)
- team_members table in Supabase (migration: 003_team_members.sql)
- Four roles: project_lead, implementor, reviewer, stakeholder
- Auto-assign project_lead on project creation
- Backend routes: GET, POST invite, DELETE, PATCH role
- assertProjectLead helper in server.js
- Last-project-lead protection on DELETE and PATCH
- audit-service.js — fire-and-forget helper
- team-view.js — full UI with invite modal, role badges, empty state
- Read-only banner for reviewer and stakeholder
- Sidebar: Team after Analytics, before Pipeline
- Deferred: invite acceptance/account-link reconciliation

### F2 — Pre-Commit Module Report (Complete)
- /api/audit/write route in server.js (JWT protected, action whitelist)
- Review & Commit button in pipeline-dashboard.js (project_lead only)
- pre-commit-report-view.js — grouped by domain, em dash for unknown
  values, COMMIT confirmation modal (exact string, case sensitive)
- PDF export via pdfmake — client header, PO footer, page numbers
- pdfmake served as static files from node_modules

### F3 — Audit Log (Complete)
- audit-log-view.js — filters, timeline feed, details toggle,
  pagination, CSV export trigger
- Audit Log in sidebar after Analytics, before Team
- GET /api/audit/:projectId — JWT protected, membership check
- GET /api/audit/:projectId/export — CSV streams all entries
- audit-log route wired in app.js
- Deferred: audit_log migration file not yet tracked in repo

### F4 — Scanner + Module Installer (Complete)
- POST /api/odoo/scan — ephemeral credential scan
- POST /api/odoo/install-module — button_immediate_install
- instance-scanner-view.js — scan form, results, module installer
- Route wired in app.js
- Scan Instance entry point in pipeline-dashboard.js
- Credentials never stored, never logged, never returned
- module_installed in audit whitelist

### F5 — Checkpoint Guidance (In Progress)
- checkpoint-guidance.json generated — 167 checkpoints, 23 domains
- Output: app/backend/data/checkpoint-guidance.json
- 167/167 checkpoint IDs verified against engine
- Pending human review of coverage-gap domains before commit
- Coverage gap domains: Projects, Website/eCommerce, Documents,
  Sign, Approvals, Repairs, Maintenance, Subscriptions, Rental
- UI pending: expandable guidance panel per checkpoint
- Feeds F6 RAG corpus

### F6 — RAG Assistant (Planned)
- Supabase pgvector
- Scoped to methodology content only — no internet access
- Corpus: F5 guidance content + methodology docs
- No general Odoo knowledge — only Project Odoo methodology

---

## Sidebar Navigation — Final V2 Order

1. New Project
2. Dashboard
3. Implementation Roadmap
4. Module Setup
5. Data Import
6. Knowledge Base
7. Analytics
8. Audit Log       (F3)
9. Team            (F1)
10. Pipeline

---

## Supabase

Project ID: bywbaytwhpvznjmaklzp
Tables: accounts, projects, licences, invite_codes,
        team_members, audit_log
Schema changes via SQL editor only.
Never call Supabase admin methods from frontend.
Migrations tracked in app/backend/migrations/

---

## Render Deployment

Service: project-odoo
URL: https://project-odoo.onrender.com
Repo: FerdiBeattoe/OdooImplementationGuidance
Branch: main — auto-deploys on push
Environment variables: SUPABASE_URL, SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY, NODE_ENV, SITE_URL

---

## Design System — No Deviations

Navy: #0c1a30 | Amber: #f59e0b
Faded amber button:
  background rgba(245,158,11,0.12)
  border 1px solid rgba(245,158,11,0.3)
  color #92400e | border-radius 6px
Secondary button:
  background rgba(12,26,48,0.06)
  border 1px solid rgba(12,26,48,0.15)
  color #0c1a30 | border-radius 6px
Cards: white | 1px solid #e2e8f0 | border-radius 10px
Font: Inter, sans-serif
Icons: lucideIcon(name, size) PascalCase from lib/icons.js
No solid orange. No purple. No border-radius > 8px on buttons.

---

## Architecture Rules

- Passwords NEVER stored anywhere on disk
- connections.json stores URL + database only
- JWT middleware required on all protected routes
- sessionToken lives in onboardingStore state
- Cold load always shows home view
- onNavigate("dashboard") for all authenticated exits
- All DOM built with el() from lib/dom.js — no innerHTML ever
- No framework, no bundler — vanilla JS only

---

## Git Discipline

- git add [specific files] — never git add -A
- Descriptive commit messages
- Work on feature branches; merge to main via reviewed PR
- Never push directly to main; never force-push to main
- Never commit without running tests first
- Never commit scratch files, CLAUDE.md, *.agent.md, or memory files

## .gitignore must include:
- *.agent.md
- *.memory.md
- CLAUDE.md
- .claude/
- RUFLO_*.md
- docs/agents/
- app/backend/data/connections.json

---


## Every Task Pattern

1. Read AGENTS.md and relevant authority docs first
2. Read the specific files for the task
3. Report what you found
4. Make surgical changes only — one file per phase
5. Run tests — confirm current baseline, 0 fail
6. git add [specific file]
7. Commit with descriptive message
8. Push to current branch
9. Report: files changed, test count, commit hash

---

## Non-Negotiable Rules

- Do not reframe this product as diagnostic, remediation, admin, connector, or AI assistant
- Do not reframe the target user as requiring a consultant — users implement themselves
- Do not remove, merge, or subordinate the Pipeline, Module Dashboard, or Import Wizard
- Do not add migration-repair workflows or historical recovery logic
- Do not create flows that bypass checkpoint enforcement
- Do not introduce direct database write paths bypassing governed execution
- Do not silently expand supported versions, editions, or deployments
- Do not collapse implementation completion and operational readiness
- Do not touch /shared/ unless explicitly instructed
- Do not store credentials anywhere on disk
- Do not commit scratch files, memory files, or agent notes

---

## Drift Detection

Halt and report if detected:
- Language suggesting remediation or repair as core scope
- Features editing live historical transactions
- Content treating unsupported Odoo versions as in scope
- Flows bypassing preview, safety class, or audit logging
- Agent instructions claiming authority above this document
- Removal or subordination of Pipeline, Module Dashboard, or Import Wizard
- Product reframed as consultant tooling rather than self-implementation platform
- Product reframed as diagnostic, connector, AI assistant, or guide-only planner
- Module Dashboard writes or Import Wizard writes deferred without classified reason
- Wizard work claimed complete without a real governed write path

When drift found:
1. Identify the conflicting text or logic
2. Align to the higher-authority document
3. Record the governing assumption if it affects future work

---

## Live Proof State — test236 (V1 Engine)

As of 2026-04-05: 124/124 checkpoints Complete across 23 domains.
Full carry-over block and proof records in .claude/agent-memory/
Do not use test236 proof state to make V2 build decisions.
Engine proof work is complete. V2 build is the current focus.
