# Checkpoint And Validation Rules

## Checkpoint Classes

- `Foundational`
- `Domain Required`
- `Go-Live`
- `Recommended`
- `Optional`

## Checkpoint Result States

- `Pass`
  - requirements are met with sufficient evidence
- `Fail`
  - requirements are not met and the relevant progression path is blocked
- `Warning`
  - not failed, but material risk, ambiguity, or incompleteness remains

Warnings do not automatically permit progression.

## Validation Sources

- `System-detectable`
- `User-confirmed`
- `Both`

## Progression Rules

- a failed `Foundational` checkpoint blocks all dependent downstream stages
- a failed `Domain Required` checkpoint blocks completion of that domain
- a failed `Go-Live` checkpoint blocks go-live approval for the relevant domain or phase
- a `Recommended` checkpoint may be deferred only if the deferment is recorded with owner and reason
- an `Optional` checkpoint may remain incomplete if it does not create dependency conflicts
- a warning on a checkpoint with unresolved downstream impact must be reviewed before the next dependent stage is marked complete
- a checkpoint with unresolved named dependencies cannot pass until those dependencies pass or are formally deferred under approved constraints

## Blocked Vs Deferred

Blocked when:

- a required prerequisite is missing
- a decision owner has not confirmed a mandatory business policy
- deployment context prevents safe execution
- branch/environment target is unknown for relevant Odoo.sh changes
- evidence is insufficient for a required control

Deferred only when:

- it is not foundational to the next required step
- its deferment does not invalidate an in-scope go-live path
- owner, reason, constraint, and review point are captured
- the deferment does not conceal remediation work

## Evidence And Provenance

Evidence may include:

- detected system state
- explicit user confirmation
- decision record linkage
- environment or branch target confirmation
- role or ownership confirmation
- documented acceptance of deferment

Every required or go-live checkpoint record must preserve:

- checkpoint owner
- reviewer or approver where applicable
- evidence reference or evidence location
- blocked reason when blocked
- deferment reason and constraint when deferred
- last status transition actor and timestamp or placeholder field

Evidence is insufficient when it relies only on inferred intent, generic assumptions, or unsupported system interpretation.

## Fresh Implementation Vs Live-System Expansion

Fresh implementation:

- more foundational choices are expected to be open
- the platform may sequence setup from first principles
- go-live gating focuses on initial operational readiness

Live-system expansion:

- existing live usage must be treated as context that constrains change
- expansion checkpoints must review compatibility with current operations
- the platform must not propose repair of prior historical mistakes
- deferment may be used to stage future capability, but not to mask unresolved live-risk blockers

## Cross-Domain Dependency Enforcement

- inventory checkpoints that depend on valuation, stock accounting, or costing policy cannot pass until the dependent Accounting checkpoints pass or are formally deferred under approved constraints
- manufacturing checkpoints that depend on stock movement design, valuation, or costing cannot pass until the dependent Inventory and Accounting checkpoints pass or are formally deferred under approved constraints
- POS checkpoints that depend on invoicing or accounting linkage cannot pass until the dependent Accounting checkpoints pass or are formally deferred under approved constraints
- purchase checkpoints that depend on approval control or billing policy cannot pass until the dependent Users / Roles / Security and Accounting checkpoints pass or are formally deferred under approved constraints

## Readiness Distinction

- configuration completion means the necessary setup work has been performed for the defined scope
- operational readiness requires required checkpoints, go-live controls, approved decisions, resolved known blockers, and any explicitly mandated training requirements
- configuration completion alone is never proof of operational readiness

## Enforcement Rules

- no checkpoint engine behavior may silently downgrade `Fail` to `Warning`
- no progression rule may bypass `Foundational`, `Domain Required`, or `Go-Live` failures
- any rule change that weakens checkpoint enforcement requires an explicit governance update, not a prompt-level exception
