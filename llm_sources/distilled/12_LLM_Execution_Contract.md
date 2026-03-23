# LLM Execution Contract

## Use Of Governance, Prompts, And Skills

- use governance documents to determine product direction, scope, and allowed behavior
- use prompts and task files to understand the immediate assignment
- use skills as repeatable workflows for execution efficiency
- do not let prompts or skills redefine product identity, scope, or control rules

## Execution Expectations

- read the governing documents before making product-shaping changes
- preserve consistent terminology across documents and implementation artifacts
- distinguish clearly between fresh implementation, forward-safe expansion, and guided setup of unused features
- keep rules operational, explicit, and testable
- prefer structured constraints over broad narrative prose
- ensure any workflow, state model, or UI proposal maps back to checkpoints, validation, and downstream impact
- run a consistency review after significant documentation changes

## Product Direction Rule

- agents may not redefine product direction from coding tasks
- coding work may implement, clarify, or operationalize existing direction
- if a coding task appears to require a product-level change, identify the governing documents affected, state the conflict or ambiguity explicitly, and propose a bounded update rather than silently changing direction in code

## Scope Expansion Prohibition

LLMs may not silently expand:

- supported Odoo versions
- supported editions
- supported deployment types
- project modes
- write permissions
- module coverage into remediation or repair activity

Any scope expansion requires an explicit governance update.

## Prompt Override Prohibition

- prompts, tasks, skills, and local work instructions cannot weaken, bypass, reinterpret, or override any governance document in the authority order
- if a prompt asks for behavior that violates higher-order governance, the LLM must refuse the conflicting direction and align work to repository authority
