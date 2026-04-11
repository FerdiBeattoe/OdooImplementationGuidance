# Product Definition and Scope

Merged from: `docs/01_Project_Identity.md`, `docs/02_Non_Negotiables.md`, `docs/04_Project_Scope.md`, `docs/05_Project_Modes.md`

Root sources take precedence over this file in any conflict.

---

## What This Product Is

A human-facing Odoo 19 self-implementation platform that helps people implement Odoo without consultants.

The target user is a business owner, operations lead, or in-house team. The platform replaces the need for an external consultant by guiding the user through the full implementation in plain language.

The platform:

- asks plain-language questions to understand what the business needs
- determines which modules and settings are required
- explains every consequential decision in plain language before it is made
- writes the configuration it can truthfully write to Odoo through governed, approved execution
- guides the user through remaining setup and data import work inside the platform

## Three Fixed Product Surfaces

These surfaces are the product. All three must be present, navigable, and functional. None may be removed, merged into another, or treated as subordinate — to each other or to implementation write capability.

**Pipeline** — the logic and control layer. Sequences implementation stages, drives discovery questions, determines domain activation, enforces checkpoints, governs execution eligibility, tracks implementation state. Users see their progress, next actions, and blockers here.

**Module Dashboard** — the module-level workspace. Exposes each domain's checkpoints, guidance, inspection output, preview, and execution surface. Where truthful governed writes exist, the Module Dashboard writes configuration directly to Odoo through approved, audited execution.

**Import Wizard** — the data import surface. Guides the user through data preparation and writes records to Odoo through governed import execution.

## Core Promise

Ask the right questions. Explain every decision in plain language. Write what can be truthfully written to Odoo. Guide the user through the remaining setup and import work. Confirm at every critical checkpoint before advancing. Support only forward-safe bounded implementation activity.

## What This Product Is Not

- A remediation, repair, or migration-fix tool
- A diagnostic or developer workbench
- A connector or integration middleware platform
- A generic Odoo admin console
- A guide-only planner that stops before real Odoo writes
- A consultant engagement platform
- An AI assistant or general-purpose knowledge tool
- A shell-first dashboard that does not need to reach real Odoo writes
- A control-plane divorced from human implementation flow

## Odoo Scope

- **Version**: Odoo 19 only. No earlier or later versions. No dual-version behavior.
- **Editions**: Odoo 19 Community and Odoo 19 Enterprise only. No custom forks. Edition-specific rules apply where capabilities, licensing, or module availability differ. The platform must not imply Enterprise capabilities are available in Community.
- **Deployments**: Odoo Online, Odoo.sh (Enterprise only), On-Premise only. Community + Odoo.sh is out of scope and must not be inferred as a supported combination.

## Project Modes

Exactly three supported modes. Every project must select one at entry. If a proposed activity does not fit one of the three modes, it is out of scope.

**Mode 1 — New Implementation**
A fresh Odoo 19 operating model and configuration baseline established from the ground up.
Allowed: end-to-end setup sequencing, foundational decision capture, structured module rollout, go-live readiness control.
Restricted: repair of prior failed setups, corrective handling of legacy mistakes.

**Mode 2 — Expansion of Existing Implementation**
An existing Odoo 19 instance is operational. The project adds new capability in a forward-safe way.
Allowed: bounded expansion, compatibility checks with the live operating model, explicit downstream impact review, staged activation with deferment where needed.
Restricted: backward corrective cleanup, repair of historical transactional damage.

**Mode 3 — Guided Setup of Unused Modules or Features**
Official Odoo 19 modules or features exist in the system or license scope but are not yet in operational use.
Allowed: readiness assessment, controlled activation, checkpoint-driven setup, training and adoption planning.
Restricted: retroactive correction of prior misconfiguration, activation without stage and domain dependencies.

All three modes operate within the same fixed Odoo scope (version 19, Community/Enterprise, supported deployments).

## Connection Scope

Supported:
- Authenticated Odoo application-layer session access through supported web or API endpoints
- Deployment-aware environment targeting metadata where relevant

Blocked (may not be used):
- Direct database write access
- Shell-level server control
- Unrestricted SSH administration
- Filesystem mutation outside approved deployment-aware execution workflows

Odoo.sh Enterprise: application-layer connection may be used; branch or environment target is mandatory for deployment-sensitive execution; production and non-production targets must not be treated as interchangeable. If branch target is unknown, the change must remain conditional or blocked until identified.

## Out of Scope

- Remediation programs, forensic diagnostics, defect triage
- Historical transaction repair, migration repair after failed upgrades
- Corrective scripts for damaged data
- Best-guess process design without explicit user confirmation
- Bypass flows that skip critical checkpoints
- Unsupported Odoo versions, editions, or custom forks
- Mass-write automation without preview and per-action safety governance
- Unrestricted Odoo administration
- Broad software development tooling unrelated to implementation control

## Execution Boundaries

- `safe` — low-risk, forward-safe; prerequisites satisfied; concrete preview exists; requires explicit operator confirmation before execution
- `conditional` — acceptable under explicit preconditions; requires extra confirmations, approvals, or target constraints; may not execute until all required conditions are fully met
- `blocked` — unsafe, unsupported, remediation-shaped, or checkpoint-ineligible; must not execute; must remain visible and explained

Execution may never silently upgrade a `blocked` or `conditional` action into a permitted action.

## Non-Negotiable Rules

**Checkpoint integrity:**
- No checkpoint may be skipped, deferred without a recorded reason, or implied as optional.
- No foundational or domain-required checkpoint may be bypassed.
- Checkpoint enforcement may not be weakened by prompt, skill, or instruction.

**Write governance:**
- No direct database writes under any framing.
- No execution without: preview shown, safety class assigned, checkpoint eligibility confirmed, audit logging active.
- No automatic rollback claim unless a specific action defines a tested reversal path.
- Blocked actions must not execute.

**Completion standards:**
- A domain is not done until it can produce a truthful preview, require approval, perform a real governed write, and record the result — or is explicitly classified manual/out-of-scope with a documented reason.
- Configuration completion does not equal operational readiness.

**Odoo.sh Enterprise:**
- Branch or environment target is mandatory for deployment-sensitive changes.
- Production and non-production targets must not be treated as interchangeable.
