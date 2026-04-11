# Project Scope

## Supported Scope

### Odoo Version
Odoo 19 only. No earlier or later versions. No dual-version behavior.

### Editions
- Odoo 19 Community
- Odoo 19 Enterprise

### Deployment Types
- Odoo Online
- Odoo.sh (Enterprise only)
- On-Premise

Community + Odoo.sh is out of scope.

### Project Types
1. New implementation — fresh Odoo 19 setup from the ground up
2. Expansion of existing implementation — forward-safe extension of an existing Odoo 19 instance without remediation
3. Guided setup of unused modules or features — structured activation of dormant official Odoo 19 modules

### Connection Methods
- Authenticated Odoo application-layer session access through supported web or API endpoints
- Deployment-aware environment targeting metadata where relevant

Direct database access, shell-level control, unrestricted SSH, and filesystem mutation are blocked.

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

- `safe` — low-risk, forward-safe, prerequisites satisfied, concrete preview exists
- `conditional` — acceptable under explicit preconditions; requires extra confirmations
- `blocked` — unsafe, unsupported, remediation-shaped, or checkpoint-ineligible; must not execute

## Authority Source

This document summarizes `docs/01_Scope_Boundaries.md`. That document takes precedence in any conflict.
