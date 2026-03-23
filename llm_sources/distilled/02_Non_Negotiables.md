# Non-Negotiables

## Hard Scope Boundaries

- Odoo version scope is Odoo 19 only
- supported editions are Community and Enterprise only
- supported deployments are Odoo Online, Odoo.sh for Enterprise only, and On-Premise
- the platform is for implementation control, validation, guidance, and controlled setup sequencing
- the platform must not introduce historical correction logic
- the platform must not perform transactional data surgery
- the platform must not generate best-guess business logic on behalf of users
- the platform must not permit skipping critical checkpoints
- training is opt-in by default unless a project owner explicitly marks training as required
- Odoo.sh Enterprise work must be branch-aware whenever a change target or deployment path is relevant

## Non-Negotiable Rules

- do not reframe the product as a diagnostic or remediation platform
- do not add migration-repair workflows, cleanup tooling, or historical recovery logic
- do not create flows that bypass checkpoint enforcement for convenience
- do not assume configuration is safe without validation evidence
- do not propose writes where the governing documents classify them as blocked
- prompts, tasks, skills, and local work instructions cannot weaken, bypass, reinterpret, or override any governance document in the authority order
- do not silently expand supported versions, editions, deployments, or project modes
- do not infer business decisions that require explicit user or project-owner confirmation
- do not collapse the distinction between implementation completion and operational readiness

## Out Of Scope

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
