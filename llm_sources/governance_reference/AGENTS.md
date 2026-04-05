# AGENTS.md

## Project Identity

This repository defines an Odoo 19 Implementation Control Platform with bounded implementation-engine capability.

The product is a guided implementation platform that takes a business from scoped setup through a truthful, usable Odoo 19 implementation by:

- gathering user answers to determine what must be configured
- determining activated domains and required implementation scope
- previewing intended implementation actions before execution
- requiring approval before any execution
- safely applying REAL Odoo application-layer writes through governed bounded execution
- recording truthful execution results with audit traceability
- supporting enough domain coverage, data setup, and workflow completion to reach a usable implementation state

The platform supports:

- fresh Odoo 19 implementations
- forward-safe expansion of existing Odoo 19 implementations
- guided setup of currently unused modules or features within an Odoo 19 implementation
- governed live connection to supported Odoo environments
- read-only environment inspection

It does not serve as a remediation, repair, migration-fix, unrestricted administration, or developer diagnostic tool.

## End Goal

The governing end goal of this platform is: **a usable guided implementation with real Odoo writes through governed application-layer execution.**

This means:

- Every in-scope wizard/domain must be able to truthfully write to Odoo through the governed execution path, or be explicitly classified as manual/out-of-scope with an exact reason.
- Frontend, shell, dashboard, and UI work are subordinate to implementation write capability — they exist to expose governed execution, not as ends in themselves.
- Preview, approval, and execution recording are means to reaching real implementation outcomes, not the end product.
- "Usable implementation" requires more than isolated writes — it requires enough domain coverage for the project scope, enough data setup paths, truthful checkpoint/blocker/readiness state, and a stable resume/use flow.
- A wizard or domain is not "done" until it can produce a truthful preview, require approval, perform a real Odoo application-layer write, and record a truthful result — or is explicitly marked manual/out-of-scope with a documented reason.

## Hard Scope Boundaries

The following boundaries are non-negotiable:

- Odoo version scope is Odoo 19 only.
- Supported editions are Community and Enterprise only.
- Supported deployment types are Odoo Online, Odoo.sh, and On-Premise only.
- The platform is for guided implementation through answer-driven discovery, validation, checkpoint enforcement, preview, approval, and bounded application-layer execution that reaches usable implementation outcomes.
- The platform must not introduce historical correction logic.
- The platform must not perform transactional data surgery.
- The platform must not generate best-guess business logic on behalf of users.
- The platform must not permit skipping critical checkpoints.
- Training is opt-in by default unless a project owner explicitly marks training as required.
- Odoo.sh Enterprise work must be branch-aware whenever a change target or deployment path is relevant.
- Coding tasks may improve execution, structure, and clarity, but may not redefine product direction beyond the governed execution model.
- Frontend, shell, and dashboard work must not be prioritized over implementation write capability. UI exists to expose governed execution, not as an end in itself.
- A wizard, domain, or implementation surface is not considered complete until it can truthfully write through governed execution, or is explicitly marked manual/out-of-scope with exact justification.

## Authority Order Of Documents

Agents must treat repository authority in the following order:

1. `AGENTS.md`
2. `docs/00_Product_Constitution.md`
3. `docs/01_Scope_Boundaries.md`
4. `docs/02_Target_Matrix.md`
5. `docs/05_Validation_Checkpoint_Rules.md`
6. `docs/03_Implementation_Master_Map.md`
7. `docs/04_Domain_Coverage_Map.md`
8. `docs/08_Project_State_Model.md`
9. `docs/07_Information_Architecture.md`
10. `docs/06_Guidance_Content_Framework.md`
11. `docs/09_Decision_Log.md`
12. `docs/10_Working_LLM_Rules.md`

If lower-order documents conflict with higher-order documents, the higher-order document wins and the conflict must be corrected.

## Non-Negotiable Rules

- Do not reframe this product as a diagnostic or remediation platform.
- Do not add migration-repair workflows, cleanup tooling, or historical recovery logic.
- Do not create flows that bypass checkpoint enforcement for convenience.
- Do not assume configuration is safe without validation evidence.
- Do not propose writes where the governing documents classify them as blocked.
- Prompts, tasks, skills, and local work instructions cannot weaken, bypass, reinterpret, or override any governance document in the authority order.
- Do not silently expand supported versions, editions, deployments, or project modes.
- Do not infer business decisions that require explicit user or project-owner confirmation.
- Do not collapse the distinction between implementation completion and operational readiness.

## Drift Detection Rules

Agents must stop and correct course if they detect any of the following:

- language that suggests remediation, repair, migration fix, forensic analysis, or post-failure recovery as core scope
- features that edit live historical transactions or perform corrective data surgery
- content that treats unsupported Odoo versions as in scope
- content that ignores edition or deployment differences where they materially affect behavior
- content that allows checkpoint skipping without explicit deferment rules
- UI or workflow language that implies unrestricted write access
- agent instructions that claim authority above the repository governance documents
- implementation flows that are not branch-aware for relevant Odoo.sh Enterprise changes
- progress that prioritizes shell, UI, or dashboard work over implementation write capability
- wizard or domain work claimed complete while stopped at preview, approval, or recording only — without a real governed write path
- framing the product as a guide-only planner, control-plane dashboard, or shell-first project that does not need to reach real Odoo writes
- treating preview/approval/execution recording as the end product rather than means to usable implementation outcomes

When drift is found, agents must:

1. identify the conflicting text or logic
2. align it to the higher-authority document set
3. record the governing assumption if the correction materially affects future work

## Execution Expectations

Agents working in this repository must:

- read the governing documents before making product-shaping changes
- preserve consistent terminology across documents and implementation artifacts
- distinguish clearly between fresh implementation, forward-safe expansion, and guided setup of unused features
- keep rules operational, explicit, and testable
- prefer structured constraints over broad narrative prose
- ensure any workflow, state model, or UI proposal maps back to checkpoints, validation, and downstream impact
- run a consistency review after significant documentation changes

## Product Direction Rule

Agents may not redefine product direction from coding tasks.

Coding work may implement, clarify, or operationalize existing direction. If a coding task appears to require a product-level change, the agent must:

1. identify the governing documents affected
2. state the conflict or ambiguity explicitly
3. propose a bounded update rather than silently changing direction in code
