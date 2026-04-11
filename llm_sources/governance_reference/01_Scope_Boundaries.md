# Scope Boundaries

## Version Scope

- Supported version: Odoo 19 only
- Unsupported versions: all earlier and later Odoo versions
- No dual-version behavior, migration bridge logic, or version comparison workflows are allowed

## Edition Scope

- Supported editions:
  - Odoo 19 Community
  - Odoo 19 Enterprise
- Edition-specific guidance and execution rules are required wherever capability, licensing, hosting, or module availability differs
- The platform must not imply Enterprise capabilities are available in Community

## Deployment Scope

- Supported deployments:
  - Odoo Online
  - Odoo.sh for Enterprise only
  - On-Premise
- Deployment-aware rules must be applied when configuration method, hosting control, module availability, deployment governance, or change process differs

## Supported Project Types

The platform supports only the following project types:

1. New implementation
   - A fresh Odoo 19 implementation where the operating model is being established from the ground up.
2. Expansion of existing implementation
   - A forward-safe extension of an existing Odoo 19 implementation without remediation logic or historical correction.
3. Guided setup of unused modules or features
   - Structured activation and setup of modules or features that are not currently in operational use within an Odoo 19 implementation.

## Supported Connection Scope

The platform may connect only through governed supported methods.

Initial supported connection methods:

- authenticated Odoo application-layer session access through supported web or API endpoints
- deployment-aware environment targeting metadata where relevant

Connection methods remain blocked unless explicitly approved:

- direct database write access
- shell-level server control
- unrestricted SSH administration
- filesystem mutation outside approved deployment-aware execution workflows

Odoo Online:
- direct database access is blocked
- application-layer connection may be used only where the platform truthfully supports it

Odoo.sh Enterprise:
- application-layer connection may be used
- branch or environment target is mandatory for deployment-sensitive execution
- production and non-production targets must not be treated as interchangeable

On-Premise:
- application-layer connection may be used
- direct database access remains blocked unless a future governance update explicitly authorizes a bounded read-only inspection path

## Out-Of-Scope Items

The following are out of scope:

- remediation programs
- forensic diagnostics
- defect triage tooling
- historical transaction repair
- migration repair after failed upgrades
- corrective scripts for damaged data
- best-guess process design without explicit user confirmation
- bypass flows that skip critical checkpoints
- unsupported Odoo versions
- unsupported editions or custom forks treated as official scope
- broad software development tooling unrelated to implementation control
- unrestricted Odoo administration
- mass-write automation without preview and per-action safety governance

## Execution Boundaries

The platform may inspect, preview, and execute implementation actions only within these boundaries:

- `safe`
  - low-risk, forward-safe implementation actions with satisfied prerequisites and explicit supported target context
- `conditional`
  - actions that may be acceptable but require additional confirmations, approvals, or target constraints
- `blocked`
  - actions that are unsafe, unsupported, out of scope, deployment-incompatible, remediation-shaped, or checkpoint-ineligible

The platform must never imply universal permission to write configuration changes. Every execution path must be constrained by checkpoint state, deployment context, target context, safety class, and audit logging.

## Preview And Execution Rules

- Every executable action must be previewed before execution.
- Preview must identify target model or setting, intended change, safety class, prerequisites, and downstream impact summary.
- `safe` actions may execute only after explicit operator confirmation.
- `conditional` actions may not execute until the required additional confirmations are satisfied.
- `blocked` actions must not execute.
- Automatic rollback is not assumed. A rollback path exists only when a specific action explicitly defines a tested reversal model.

## Clarification Of All Modules

"All modules" in this project means all official Odoo 19 functional domains that may reasonably appear in implementation planning, controlled activation, inspection, preview, or bounded execution for Community or Enterprise across the supported deployments.

This includes:

- modules already in use
- modules planned for current phase
- modules intentionally deferred
- modules currently unused but considered for forward-safe activation

It does not mean:

- every technical object at field level
- every custom module ever created by a partner
- every unsupported third-party add-on
- historical cleanup of previously misconfigured modules

## Odoo.sh Branch-Aware Rule

When a project runs on Odoo.sh and the relevant functionality depends on Enterprise deployment workflow or branch-targeted change control, the platform must:

- identify the target branch or environment explicitly
- avoid treating production and non-production targets as interchangeable
- require branch-aware validation evidence before marking deployment-sensitive checkpoints complete
- separate decision approval from branch execution
- keep execution blocked or conditional until target context is known

If branch target is unknown for an Odoo.sh Enterprise change, the change must remain conditional or blocked until the target is identified.
