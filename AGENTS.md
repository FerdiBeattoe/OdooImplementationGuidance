# AGENTS.md

## Project Identity

This repository defines an Odoo 19 Implementation Control Platform.

The product is a documentation-led implementation control platform that guides users through correct Odoo setup, enforces checkpoints, explains downstream impact, and supports:

- fresh Odoo 19 implementations
- forward-safe expansion of existing Odoo 19 implementations
- guided setup of currently unused modules or features within an Odoo 19 implementation

It does not serve as a remediation, repair, migration-fix, or developer diagnostic tool.

## Hard Scope Boundaries

The following boundaries are non-negotiable:

- Odoo version scope is Odoo 19 only.
- Supported editions are Community and Enterprise only.
- Supported deployment types are Odoo Online, Odoo.sh, and On-Premise only.
- The platform is for implementation control, validation, guidance, and controlled setup sequencing.
- The platform must not introduce historical correction logic.
- The platform must not perform transactional data surgery.
- The platform must not generate best-guess business logic on behalf of users.
- The platform must not permit skipping critical checkpoints.
- Training is opt-in by default unless a project owner explicitly marks training as required.
- Odoo.sh Enterprise work must be branch-aware whenever a change target or deployment path is relevant.
- Coding tasks may improve execution, structure, and clarity, but may not redefine product direction.

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
