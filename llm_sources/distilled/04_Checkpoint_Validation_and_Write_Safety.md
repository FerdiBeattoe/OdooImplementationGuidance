# Checkpoint Validation and Write Safety

Merged from: `docs/05_Validation_Checkpoint_Rules.md`, `docs/06_Checkpoint_and_Validation_Rules.md`

Root sources take precedence over this file in any conflict.

---

## Checkpoint Classes

- `Foundational` — prerequisite controls that affect many downstream domains
- `Domain Required` — required controls for a domain to be governed correctly
- `Go-Live` — controls that must pass before operational launch of the relevant domain or phase
- `Recommended` — controls that materially improve quality and readiness but may be deferred
- `Optional` — controls that add value but are not required unless project scope elevates them

## Checkpoint Result States

- `Pass` — requirements met with sufficient evidence
- `Fail` — requirements not met; relevant progression path is blocked
- `Warning` — not failed, but material risk, ambiguity, or incompleteness remains

Warnings do not automatically permit progression or execution.

## Validation Source Types

- `System-detectable` — evidence derivable from verifiable system state
- `User-confirmed` — evidence requires explicit confirmation by an accountable human owner
- `Both` — system state and human confirmation are both required

## Progression Rules

- A failed `Foundational` checkpoint blocks all dependent downstream stages.
- A failed `Domain Required` checkpoint blocks completion of that domain.
- A failed `Go-Live` checkpoint blocks go-live approval for the relevant domain or phase.
- A `Recommended` checkpoint may be deferred only if the deferment is recorded with owner and reason.
- An `Optional` checkpoint may remain incomplete if it does not create dependency conflicts.
- A warning on a checkpoint with unresolved downstream impact must be reviewed before the next dependent stage is marked complete.
- A checkpoint with unresolved named dependencies cannot pass until those dependencies pass or are formally deferred under approved constraints.

## Blocked vs Deferred

**Blocked**: A checkpoint is blocked when a required prerequisite is missing; a decision owner has not confirmed a mandatory business policy; deployment context prevents safe execution; branch/environment target is unknown for relevant Odoo.sh Enterprise changes; or evidence is insufficient. Blocked items prevent advancement and execution where dependencies apply.

**Deferred**: A checkpoint may be deferred only when it is not foundational to the next required step; its deferment does not invalidate an in-scope go-live path; owner, reason, constraint, and review point are captured; and the deferment does not conceal remediation work. Deferred items remain visible in state, readiness, decision history, preview gating, and execution review.

## Execution Safety Classes

**Safe**: low-risk and forward-safe; prerequisites satisfied; target deployment and edition supported; no blocked required checkpoint would be bypassed; change can be previewed concretely before execution. Requires explicit operator confirmation.

**Conditional**: action may be acceptable but depends on explicit preconditions; user-confirmed decisions still required; deployment, edition, or branch constraints affect execution; downstream impact exists and must be reviewed first; or production-target approval required. May not execute until all required conditions are fully met.

**Blocked**: action is out of scope; would bypass critical checkpoints; depends on remediation or historical correction; target environment is unsupported or unknown; or risk is materially unacceptable. Must not execute. Must remain visible and explained.

Execution may never silently upgrade a `blocked` or `conditional` action into a permitted action.

## Preview Eligibility

Every execution candidate must have a preview record including:

- target object or setting
- intended operation
- intended field/value change where applicable
- safety class
- prerequisites
- downstream impact summary
- deployment or branch target where relevant

If preview cannot be made concrete and truthful, the action is `blocked`. If relevant state changes after preview, preview must be regenerated before execution. Preview must be generated from the same state and target context used for execution.

## Execution Eligibility

- `safe` actions: execute only after explicit operator confirmation
- `conditional` actions: execute only after all required extra confirmations, approvals, and target constraints are satisfied
- `blocked` actions: must not execute
- Execution must use approved connection methods only
- Execution must not write outside the previewed target scope
- Execution must fail safe when target context, prerequisites, or confirmation state are missing
- Execution must log outcome, actor, target, safety class, and failure reason where applicable

## Write Governance Rule

No write may occur without:
1. preview shown
2. safety class assigned
3. checkpoint eligibility confirmed
4. audit logging active
5. required confirmations obtained

No direct database writes under any framing.

## Evidence Expectations

Evidence may include: detected system state; explicit user confirmation; decision record linkage; environment or branch target confirmation; role or ownership confirmation; documented acceptance of deferment; execution preview linkage; execution outcome linkage.

Every required or go-live checkpoint record must preserve provenance including: checkpoint owner; reviewer or approver where applicable; evidence reference or location; blocked reason when blocked; deferment reason and constraint when deferred; linked preview where execution is relevant; linked execution outcome where execution occurred; last status transition actor and timestamp.

Evidence is insufficient when it relies only on inferred intent, generic assumptions, unsupported system interpretation, or unlogged live change claims.

## Checkpoint-to-Execution Mapping

- A checkpoint may govern zero or more executable actions.
- A checkpoint may not imply executable action unless the action is explicitly defined, previewable, and safety-classified.
- A passed checkpoint does not automatically authorize execution. It authorizes only consideration of previewable actions governed by that checkpoint.

## Inspection Rule

Inspection is read-only. It may inform checkpoint evidence, preview generation, and blocker reasoning. Inspection must not be presented as proof of readiness unless the relevant checkpoint evidence rules are satisfied.

## Preview Rule

Preview is mandatory before execution. Preview must be generated from current checkpoint state and current target context. Preview must remain attached to the governing checkpoint or checkpoints. If relevant state changes after preview, preview must be regenerated.

## Validation Rule

Validation determines whether a checkpoint can pass and whether a preview can be considered truthful. Validation does not by itself approve execution; approval also depends on safety class and required confirmations.

## Execution Rule

Execution is allowed only for actions classified as `safe` or conditionally allowed after all required extra conditions are met. Execution must use approved connection methods only. Execution must not write outside the previewed target scope. Execution must fail safe when target context, prerequisites, or confirmation state are missing.

## Conditional Rule

Conditional actions remain non-executable until all required conditions are satisfied, including where relevant: project-owner confirmation; accountable operator confirmation; branch or environment target confirmation; deployment-specific approval; dependent checkpoint pass state.

## Blocked Rule

Blocked actions must remain visible, explained, and non-executable. Blocked reasons include: unsupported deployment or connection method; unresolved dependencies; remediation-shaped change; unsafe or ambiguous target scope; preview that is incomplete or misleading.

## Audit Rule

Every preview and execution attempt must be traceable. Audit records must identify actor, target, action, safety class, outcome, and reason for failure where applicable. Missing audit logging makes the action non-compliant.

## Domain Expansion Rule

A domain becomes execution-capable only when its checkpoint mapping, inspection model, preview contract, execution safety classes, and tests are explicitly defined. Domains not yet expanded remain manual-only, even if the platform can connect to the environment.

## Fresh Implementation vs Live-System Expansion

**Fresh implementation**: more foundational choices expected to be open; platform may sequence setup from first principles; go-live gating focuses on initial operational readiness; safe execution may apply to bounded first-time setup actions where governance allows.

**Live-system expansion**: existing live usage must be treated as context that constrains change; expansion checkpoints must review compatibility with current operations; the platform must not propose repair of prior historical mistakes; deferment may stage future capability but must not mask unresolved live-risk blockers; preview and execution must stay forward-safe.

## Branch-Aware Change Control for Odoo.sh Enterprise

For relevant Odoo.sh Enterprise changes:
- branch or environment target must be explicitly recorded
- validation evidence must indicate where the change was assessed
- preview must identify the target branch or environment
- execution may not proceed against an undefined target
- production readiness cannot be inferred from non-production status alone
- branch-specific warnings must remain attached until the target path is resolved
- a checkpoint may not pass if deployment-sensitive validation occurred against an undefined or incorrect target

## Critical Cross-Domain Dependency Enforcement

- Inventory checkpoints that depend on valuation, stock accounting, or costing policy cannot pass or execute until dependent Accounting checkpoints pass or are formally deferred under approved constraints.
- Manufacturing checkpoints that depend on stock movement design, valuation, or costing cannot pass or execute until dependent Inventory and Accounting checkpoints pass or are formally deferred under approved constraints.
- POS checkpoints that depend on invoicing or accounting linkage cannot pass or execute until dependent Accounting checkpoints pass or are formally deferred under approved constraints.
- Purchase checkpoints that depend on approval control or billing policy cannot pass or execute until dependent Users / Roles / Security and Accounting checkpoints pass or are formally deferred under approved constraints.

## Enforcement Rules

- No checkpoint engine behavior may silently downgrade `Fail` to `Warning`.
- No progression rule may bypass `Foundational`, `Domain Required`, or `Go-Live` failures.
- No execution path may bypass preview, safety class, or audit logging.
- No automatic rollback claim may be made unless a specific action defines a tested reversal path.
- Any rule change that weakens checkpoint enforcement or execution safety requires an explicit governance update, not a prompt-level exception.
