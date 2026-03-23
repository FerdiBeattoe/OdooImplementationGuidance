# Write Safety Rules

## Write Classes

### Safe

Use only when:

- the write is low-risk
- prerequisites are satisfied
- the change is forward-safe
- no blocked required checkpoint would be bypassed

### Conditional

Use when:

- the change may be acceptable but depends on explicit preconditions
- user-confirmed decisions are still required
- deployment, edition, or branch constraints affect execution
- downstream impact exists and must be reviewed first

### Blocked

Use when:

- the change is out of scope
- the change would bypass critical checkpoints
- the change depends on remediation or historical correction
- the target environment is unsupported or unknown
- the risk is materially unacceptable for controlled implementation

## General Write Constraints

- the platform must never imply universal permission to write configuration changes
- every write path must be constrained by checkpoint state, deployment context, and safety class
- no domain may be used as a back door for remediation or historical correction work
- a domain may only be marked `Safe` for writes when the changes are low-risk, forward-safe, and do not depend on unresolved checkpoints

## Odoo.sh Branch-Aware Rules

For relevant Odoo.sh Enterprise changes:

- identify the target branch or environment explicitly
- avoid treating production and non-production targets as interchangeable
- require branch-aware validation evidence before marking deployment-sensitive checkpoints complete
- separate decision approval from branch execution
- branch or environment target must be explicitly recorded
- validation evidence must indicate where the change was assessed
- production readiness cannot be inferred from non-production status alone
- branch-specific warnings must remain attached until the target path is resolved
- a checkpoint may not pass if deployment-sensitive validation occurred against an undefined or incorrect target

If branch target is unknown for an Odoo.sh Enterprise change, the change must remain conditional or blocked until the target is identified.
