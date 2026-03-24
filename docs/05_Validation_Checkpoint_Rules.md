# Validation Checkpoint Rules

## Purpose

This document defines the platform rules for checkpoint classification, state handling, progression, preview eligibility, execution eligibility, and write safety.

## Checkpoint Classes

- `Foundational`
  - prerequisite controls that affect many downstream domains
- `Domain Required`
  - required controls for a domain to be governed correctly
- `Go-Live`
  - controls that must pass before operational launch of the relevant domain or phase
- `Recommended`
  - controls that materially improve quality and readiness but may be deferred
- `Optional`
  - controls that add value but are not required unless project scope elevates them

## Checkpoint Result States

- `Pass`
  - checkpoint requirements are met with sufficient evidence
- `Fail`
  - checkpoint requirements are not met and the relevant progression path is blocked
- `Warning`
  - checkpoint is not failed, but material risk, ambiguity, or incompleteness remains

Warnings do not automatically permit progression or execution. Progression and execution depend on checkpoint class and any dependency rules.

## Validation Source Types

- `System-detectable`
  - evidence can be derived from verifiable system state
- `User-confirmed`
  - evidence requires explicit confirmation by an accountable human owner
- `Both`
  - system state and human confirmation are both required

## Rules For Progression

Progression rules are strict:

- A failed `Foundational` checkpoint blocks all dependent downstream stages.
- A failed `Domain Required` checkpoint blocks completion of that domain.
- A failed `Go-Live` checkpoint blocks go-live approval for the relevant domain or phase.
- A `Recommended` checkpoint may be deferred only if the deferment is recorded with owner and reason.
- An `Optional` checkpoint may remain incomplete if it does not create dependency conflicts.
- A warning on a checkpoint with unresolved downstream impact must be reviewed before the next dependent stage is marked complete.
- A checkpoint with unresolved named dependencies cannot pass until those dependencies pass or are formally deferred under approved constraints.

## Blocked Vs Deferred Logic

### Blocked

A checkpoint is blocked when:

- a required prerequisite is missing
- a decision owner has not confirmed a mandatory business policy
- deployment context prevents safe execution
- branch/environment target is unknown for relevant Odoo.sh changes
- evidence is insufficient for a required control

Blocked items prevent advancement and execution where dependencies apply.

### Deferred

A checkpoint may be deferred only when:

- it is not foundational to the next required step
- its deferment does not invalidate an in-scope go-live path
- owner, reason, constraint, and review point are captured
- the deferment does not conceal remediation work

Deferred does not mean ignored. Deferred items remain visible in state, readiness, decision history, preview gating, and execution review.

## Execution Safety Classes

### Safe

Use only when:

- the action is low-risk and forward-safe
- prerequisites are satisfied
- the target deployment and edition are supported
- no blocked required checkpoint would be bypassed
- the change can be previewed concretely before execution

### Conditional

Use when:

- the action may be acceptable but depends on explicit preconditions
- user-confirmed decisions are still required
- deployment, edition, or branch constraints affect execution
- downstream impact exists and must be reviewed first
- production-target approval is required

### Blocked

Use when:

- the action is out of scope
- the action would bypass critical checkpoints
- the action depends on remediation or historical correction
- the target environment is unsupported or unknown
- the risk is materially unacceptable for controlled implementation
- the preview cannot be made truthful

## Preview Eligibility Rules

- Every execution candidate must have a preview record.
- Preview must include:
  - target object or setting
  - intended operation
  - intended field/value change where applicable
  - safety class
  - prerequisites
  - downstream impact summary
  - deployment or branch target where relevant
- If preview cannot be made concrete and truthful, the action is `blocked`.

## Execution Eligibility Rules

- `safe` actions may execute only after explicit operator confirmation.
- `conditional` actions may execute only after the required extra confirmations, approvals, or target constraints are satisfied.
- `blocked` actions must not execute.
- Execution may never silently upgrade a `blocked` or `conditional` action into a permitted action.
- A preview must be generated from the same state and target context used for execution.
- Execution must log outcome, actor, target, safety class, and failure reason where applicable.

## Evidence Expectations

Checkpoint evidence must match the checkpoint type.

Evidence may include:

- detected system state
- explicit user confirmation
- decision record linkage
- environment or branch target confirmation
- role or ownership confirmation
- documented acceptance of deferment
- execution preview linkage
- execution outcome linkage

Every required or go-live checkpoint record must also preserve provenance sufficient for review, execution gating, and resumption, including:

- checkpoint owner
- reviewer or approver where applicable
- evidence reference or evidence location
- blocked reason when blocked
- deferment reason and constraint when deferred
- linked preview where execution is relevant
- linked execution outcome where execution occurred
- last status transition actor and timestamp or placeholder field

Evidence is insufficient when it relies only on inferred intent, generic assumptions, unsupported system interpretation, or unlogged live change claims.

## Fresh Implementation Vs Live-System Expansion

### Fresh Implementation

- more foundational choices are expected to be open
- the platform may sequence setup from first principles
- go-live gating focuses on initial operational readiness
- safe execution may apply to bounded first-time setup actions where governance allows it

### Live-System Expansion

- existing live usage must be treated as context that constrains change
- expansion checkpoints must review compatibility with current operations
- the platform must not propose repair of prior historical mistakes
- deferment may be used to stage future capability, but not to mask unresolved live-risk blockers
- preview and execution must stay forward-safe and must not introduce corrective data work

## Branch-Aware Change Control Rules For Odoo.sh

For relevant Odoo.sh Enterprise changes:

- branch or environment target must be explicitly recorded
- validation evidence must indicate where the change was assessed
- preview must identify the target branch or environment
- execution may not proceed against an undefined target
- production readiness cannot be inferred from non-production status alone
- branch-specific warnings must remain attached until the target path is resolved
- a checkpoint may not pass if deployment-sensitive validation occurred against an undefined or incorrect target

## Critical Cross-Domain Dependency Enforcement

- Inventory checkpoints that depend on valuation, stock accounting, or costing policy cannot pass or execute until the dependent Accounting checkpoints pass or are formally deferred under approved constraints.
- Manufacturing checkpoints that depend on stock movement design, valuation, or costing cannot pass or execute until the dependent Inventory and Accounting checkpoints pass or are formally deferred under approved constraints.
- POS checkpoints that depend on invoicing or accounting linkage cannot pass or execute until the dependent Accounting checkpoints pass or are formally deferred under approved constraints.
- Purchase checkpoints that depend on approval control or billing policy cannot pass or execute until the dependent Users / Roles / Security and Accounting checkpoints pass or are formally deferred under approved constraints.

## Enforcement Rules

- No checkpoint engine behavior may silently downgrade `Fail` to `Warning`.
- No progression rule may bypass `Foundational`, `Domain Required`, or `Go-Live` failures.
- No execution path may bypass preview, safety class, or audit logging.
- No automatic rollback claim may be made unless a specific action defines a tested reversal path.
- Any rule change that weakens checkpoint enforcement or execution safety requires an explicit governance update, not a prompt-level exception.
