# Write Safety Rules

## Purpose

This document defines write safety classes, preview requirements, and execution eligibility rules for the platform.

## Three Execution Safety Classes

### Safe

Use only when all of the following are true:

- the action is low-risk and forward-safe
- prerequisites are satisfied
- the target deployment and edition are supported
- no blocked required checkpoint would be bypassed
- the change can be previewed concretely before execution

### Conditional

Use when any of the following apply:

- the action depends on explicit preconditions not yet fully satisfied
- user-confirmed decisions are still required
- deployment, edition, or branch constraints affect execution
- downstream impact exists and must be reviewed first
- production-target approval is required

Conditional actions may not execute until all required conditions are fully met.

### Blocked

Use when any of the following apply:

- the action is out of scope
- the action would bypass critical checkpoints
- the action depends on remediation or historical correction
- the target environment is unsupported or unknown
- the risk is materially unacceptable for controlled implementation
- the preview cannot be made truthful

Blocked actions must not execute. They must remain visible and explained.

## Preview Requirements

Every executable action must have a preview record before execution.

Preview must include:

- target object or setting
- intended operation
- intended field/value change where applicable
- safety class
- prerequisites
- downstream impact summary
- deployment or branch target where relevant

If preview cannot be made concrete and truthful, the action is blocked.

If relevant state changes after preview, the preview must be regenerated before execution.

## Execution Requirements

- `safe` actions require explicit operator confirmation before execution
- `conditional` actions require all extra confirmations, approvals, and target constraints to be satisfied
- `blocked` actions must not execute
- Execution must use approved connection methods only
- Execution must not write outside the previewed target scope
- Execution must log actor, target, action, safety class, and outcome
- No automatic rollback claim unless the specific action defines a tested reversal path

## Write Governance Rule

No write may occur without:

1. preview shown
2. safety class assigned
3. checkpoint eligibility confirmed
4. audit logging active
5. required confirmations obtained

No direct database writes under any framing.

## Authority Source

This document summarizes `docs/05_Validation_Checkpoint_Rules.md` and `docs/06_Checkpoint_and_Validation_Rules.md`. Those documents take precedence over this one in any conflict.
