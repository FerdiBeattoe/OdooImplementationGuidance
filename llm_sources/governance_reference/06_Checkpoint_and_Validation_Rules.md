# Checkpoint And Validation Rules

## Purpose

This document defines how checkpoints, inspection, preview, validation, and execution relate to one another in operational terms.

## Checkpoint-To-Execution Mapping Rule

- A checkpoint may govern zero or more executable actions.
- A checkpoint may not imply executable action unless the action is explicitly defined, previewable, and safety-classified.
- A passed checkpoint does not automatically authorize execution. It authorizes only consideration of previewable actions governed by that checkpoint.

## Inspection Rule

- Inspection is read-only.
- Inspection may inform checkpoint evidence, preview generation, and blocker reasoning.
- Inspection must not be presented as proof of readiness unless the relevant checkpoint evidence rules are satisfied.

## Preview Rule

- Preview is mandatory before execution.
- Preview must be generated from current checkpoint state and current target context.
- Preview must remain attached to the governing checkpoint or checkpoints.
- If relevant state changes after preview, the preview must be regenerated before execution.

## Validation Rule

- Validation determines whether a checkpoint can pass.
- Validation also determines whether a preview can be considered truthful.
- Validation does not by itself approve execution; approval also depends on safety class and required confirmations.

## Execution Rule

- Execution is allowed only for actions explicitly classified as `safe` or conditionally allowed after the required extra conditions are met.
- Execution must use approved connection methods only.
- Execution must not write outside the previewed target scope.
- Execution must fail safe when target context, prerequisites, or confirmation state are missing.

## Conditional Rule

Conditional actions remain non-executable until all required conditions are satisfied, including where relevant:

- project-owner confirmation
- accountable operator confirmation
- branch or environment target confirmation
- deployment-specific approval
- dependent checkpoint pass state

## Blocked Rule

Blocked actions must remain visible, explained, and non-executable.

Blocked reasons include:

- unsupported deployment or connection method
- unresolved dependencies
- remediation-shaped change
- unsafe or ambiguous target scope
- preview that is incomplete or misleading

## Audit Rule

- Every preview and execution attempt must be traceable.
- Audit records must identify actor, target, action, safety class, outcome, and reason for failure where applicable.
- Missing audit logging makes the action non-compliant.

## Domain Expansion Rule

- A domain becomes execution-capable only when its checkpoint mapping, inspection model, preview contract, execution safety classes, and tests are explicitly defined.
- Domains not yet expanded remain manual-only, even if the platform can connect to the environment.
