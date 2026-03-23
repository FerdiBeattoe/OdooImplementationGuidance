# Scope Boundaries

## Version Scope

- Supported version: Odoo 19 only
- Unsupported versions: all earlier and later Odoo versions
- No dual-version behavior, migration bridge logic, or version comparison workflows are allowed

## Edition Scope

- Supported editions:
  - Odoo 19 Community
  - Odoo 19 Enterprise
- Edition-specific guidance is required wherever capability, licensing, hosting, or module availability differs
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

## Write-Permission Boundaries

The platform may classify potential writes only within these boundaries:

- `safe`
  - writes that are forward-safe, low-risk, and compatible with checkpoint completion rules
- `conditional`
  - writes that require prerequisites, explicit decision confirmation, or environment constraints
- `blocked`
  - writes that are unsafe, out of scope, deployment-incompatible, or dependent on remediation logic

The platform must never imply universal permission to write configuration changes. Every write path must be constrained by checkpoint state, deployment context, and safety class.

## Clarification Of All Modules

"All modules" in this project means all official Odoo 19 functional domains that may reasonably appear in implementation planning or controlled activation for Community or Enterprise across the supported deployments.

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

If branch target is unknown for an Odoo.sh Enterprise change, the change must remain conditional or blocked until the target is identified.
