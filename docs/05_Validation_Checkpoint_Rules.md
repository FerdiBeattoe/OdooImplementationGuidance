# Validation Checkpoint Rules

## Purpose

This document defines the platform rules for checkpoint classification, state handling, progression, and write safety.

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

Warnings do not automatically permit progression. Progression depends on checkpoint class and any dependency rules.

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

Blocked items prevent advancement where dependencies apply.

### Deferred

A checkpoint may be deferred only when:

- it is not foundational to the next required step
- its deferment does not invalidate an in-scope go-live path
- owner, reason, constraint, and review point are captured
- the deferment does not conceal remediation work

Deferred does not mean ignored. Deferred items remain visible in state, readiness, and decision history.

## Safe Write Classes

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

## Evidence Expectations

Checkpoint evidence must match the checkpoint type.

Evidence may include:

- detected system state
- explicit user confirmation
- decision record linkage
- environment or branch target confirmation
- role or ownership confirmation
- documented acceptance of deferment

Every required or go-live checkpoint record must also preserve provenance sufficient for review and resumption, including:

- checkpoint owner
- reviewer or approver where applicable
- evidence reference or evidence location
- blocked reason when blocked
- deferment reason and constraint when deferred
- last status transition actor and timestamp or placeholder field

Evidence is insufficient when it relies only on inferred intent, generic assumptions, or unsupported system interpretation.

## Fresh Implementation Vs Live-System Expansion

### Fresh Implementation

- more foundational choices are expected to be open
- the platform may sequence setup from first principles
- go-live gating focuses on initial operational readiness

### Live-System Expansion

- existing live usage must be treated as context that constrains change
- expansion checkpoints must review compatibility with current operations
- the platform must not propose repair of prior historical mistakes
- deferment may be used to stage future capability, but not to mask unresolved live-risk blockers

## Branch-Aware Change Control Rules For Odoo.sh

For relevant Odoo.sh Enterprise changes:

- branch or environment target must be explicitly recorded
- validation evidence must indicate where the change was assessed
- production readiness cannot be inferred from non-production status alone
- branch-specific warnings must remain attached until the target path is resolved
- a checkpoint may not pass if deployment-sensitive validation occurred against an undefined or incorrect target

## Critical Cross-Domain Dependency Enforcement

- Inventory checkpoints that depend on valuation, stock accounting, or costing policy cannot pass until the dependent Accounting checkpoints pass or are formally deferred under approved constraints.
- Manufacturing checkpoints that depend on stock movement design, valuation, or costing cannot pass until the dependent Inventory and Accounting checkpoints pass or are formally deferred under approved constraints.
- POS checkpoints that depend on invoicing or accounting linkage cannot pass until the dependent Accounting checkpoints pass or are formally deferred under approved constraints.
- Purchase checkpoints that depend on approval control or billing policy cannot pass until the dependent Users / Roles / Security and Accounting checkpoints pass or are formally deferred under approved constraints.

## Enforcement Rules

- No checkpoint engine behavior may silently downgrade `Fail` to `Warning`.
- No progression rule may bypass `Foundational`, `Domain Required`, or `Go-Live` failures.
- Any rule change that weakens checkpoint enforcement requires an explicit governance update, not a prompt-level exception.
