# IA and Navigation Guards

## Purpose

This document defines the fixed product surfaces, navigation model, and the guardrails that prevent the product from drifting into an admin console or generic tool.

## Fixed Product Surfaces

The platform has exactly three fixed surfaces. All three must be present, navigable, and functional. None may be removed, merged into another, or treated as subordinate.

### Pipeline

The logic and control layer. It sequences implementation stages, drives discovery questions, enforces checkpoints, determines domain activation, governs execution eligibility, and tracks implementation state. Users see progress, blockers, and next required actions here.

### Module Dashboard

The module-level workspace. It exposes each activated domain's checkpoints, guidance, inspection output, preview, and execution surface. Where truthful governed writes exist, the Module Dashboard writes configuration directly to Odoo through approved, audited execution.

### Import Wizard

The data import surface. It guides users through data preparation, template download, validation, and governed import execution that writes records to Odoo.

## Primary Navigation

The navigation structure must keep the product centered on governed implementation work:

1. Dashboard — project summary, stage progress, domain progress, blockers, next actions
2. Implementation Roadmap — stage-ordered view of the implementation journey
3. Module Setup (Module Dashboard) — domain-level workspaces, checkpoints, inspection, preview, execution
4. Data Import (Import Wizard) — governed data import and template preparation
5. Pipeline — checkpoint state, domain activation, governed execution layer
6. Knowledge Base — methodology content and decision reference
7. Analytics — implementation progress and audit reporting
8. Audit Log — execution and checkpoint audit trail
9. Team — team members, roles, and access

## Stage vs Domain Navigation

Stage navigation controls sequencing — use for moving through the implementation journey in dependency order.

Domain navigation controls working depth — use for deep, topic-specific work within a functional area.

Both must reflect the same checkpoint state.

## Dashboard Guards

The dashboard is a control surface, not a reporting warehouse or admin console. It must show:

- project identity and mode
- version, edition, deployment, and environment context
- connection status
- stage and domain progress
- blocked checkpoints
- warnings needing review
- ready-for-review items
- deferred items
- go-live readiness summary
- the next required manual, preview, or execution action

## Advanced/Admin Mode Boundaries

Advanced or admin-oriented views may expose more detail but must not:

- bypass checkpoint rules
- expose blocked write paths as permitted
- redefine scope or project mode
- convert the product into a developer diagnostic console
- expose direct database, shell, or unrestricted Odoo administration

Advanced mode increases visibility, not authority.

## Connection State Display

The UI must distinguish:

- not connected
- connected for inspection only
- connected for preview
- connected for bounded execution

Unsupported connection or execution paths must be stated directly rather than implied.

## Authority Source

This document summarizes `docs/07_Information_Architecture.md`. That document takes precedence over this one in any conflict.
