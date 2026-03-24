# AGENTS.md

## Project Identity

This repository defines an Odoo 19 Implementation Control Platform with bounded implementation-engine capability.

The product is a documentation-led implementation control and bounded execution platform that guides users through correct Odoo setup, enforces checkpoints, explains downstream impact, and supports:

- fresh Odoo 19 implementations
- forward-safe expansion of existing Odoo 19 implementations
- guided setup of currently unused modules or features within an Odoo 19 implementation
- governed live connection to supported Odoo environments
- read-only environment inspection
- preview of intended implementation actions before execution
- bounded execution of approved safe implementation actions

It does not serve as a remediation, repair, migration-fix, unrestricted administration, or developer diagnostic tool.

## Hard Scope Boundaries

The following boundaries are non-negotiable:

- Odoo version scope is Odoo 19 only.
- Supported editions are Community and Enterprise only.
- Supported deployment types are Odoo Online, Odoo.sh, and On-Premise only.
- The platform is for implementation control, validation, guidance, controlled setup sequencing, environment inspection, preview, and bounded execution of approved implementation actions.
- The platform must not introduce historical correction logic.
- The platform must not perform transactional data surgery.
- The platform must not generate best-guess business logic on behalf of users.
- The platform must not permit skipping critical checkpoints.
- The platform must not expose unrestricted database, shell, or admin-console access.
- The platform must not execute writes without preview, safety classification, checkpoint eligibility, and audit logging.
- The platform must not promise rollback unless a specific action explicitly defines a tested reversal path.
- Training is opt-in by default unless a project owner explicitly marks training as required.
- Odoo.sh Enterprise work must be branch-aware whenever a change target or deployment path is relevant.
- Coding tasks may improve execution, structure, and clarity, but may not redefine product direction beyond the governed execution model.

## Repository Structure & Component Scope

This repository contains multiple components with distinct governance boundaries:

### Core Platform (`app/`, `src/`)
The implementation control platform — documentation-led, checkpoint-enforced, bounded execution.

### Data Onboarding Tools (`tools/`)
**Status: Adjacent utility, NOT core platform scope**

The `tools/` directory contains standalone CLI utilities for data migration and import preparation. These tools:
- Are NOT governed by the checkpoint enforcement system
- Do NOT perform "implementation control" — they perform data transformation
- Are NOT subject to preview-before-execution requirements
- Are designed for pre-implementation data preparation (cleaning, validation, transformation)
- May be moved to a separate repository in future releases

**Critical distinction:** Data onboarding is preparation work done *before* the implementation control platform takes over. Once data enters the platform's bounded execution flow, tools/ utilities are no longer the appropriate surface — the platform's checkpoint-governed workflows take over.

Agents must not:
- Conflate tools/ CLI capabilities with platform capabilities
- Extend tools/ to perform implementation control functions
- Remove tools/ without explicit product-owner direction

## Production Readiness Status

**Current Status: PILOT / PRODUCTION-CANDIDATE**

The repository has passed a comprehensive adversarial audit with 254 tests and strong governance alignment. However, **code correctness ≠ production readiness**.

### What Is Proven
- Repository governance is internally consistent and tamper-resistant
- Checkpoint enforcement cannot be bypassed through the API
- Preview-before-execution flow is hard-coded and mandatory
- Local bounded execution works against test mocks
- Zero npm dependencies reduces supply-chain attack surface

### What Is NOT Proven (Pre-Production Requirements)
Before this platform can be considered truly production-ready, the following must be validated:

1. **Reverse proxy + HTTPS termination** — Currently runs localhost-only; production requires TLS
2. **Rate limiting** — No DoS protection currently implemented
3. **Real end-to-end validation** — All tests use mocks; need validated execution against:
   - Odoo Online (test instance)
   - Odoo.sh Enterprise (staging branch)
   - On-Premise (local docker or VM)
4. **At least one bounded execution flow per deployment type** — Currently only foundation/inventory/CRM have live execution paths

### Honest Risk Assessment
- **Supply chain:** Zero npm deps reduces risk, but runtime (Node.js), OS, and reverse proxy are still dependencies
- **Security:** Codebase audit is clean, but deployment security (HTTPS, CORS, headers, WAF) is unconfigured
- **Checkpoint truth:** Enforced in code, but operational readiness requires human validation in real Odoo environments

**Verdict:** Approved for controlled pilot testing. Production-ready status requires successful validation against all three supported deployment types with real (not mocked) Odoo instances.

## Authority Order Of Documents

Agents must treat repository authority in the following order:

1. `AGENTS.md`
2. `docs/00_Product_Constitution.md`
3. `docs/01_Scope_Boundaries.md`
4. `docs/02_Target_Matrix.md`
5. `docs/03_Authority_Order.md`
6. `docs/05_Validation_Checkpoint_Rules.md`
7. `docs/06_Checkpoint_and_Validation_Rules.md`
8. `docs/03_Implementation_Master_Map.md`
9. `docs/04_Domain_Coverage_Map.md`
10. `docs/08_Project_State_Model.md`
11. `docs/07_Information_Architecture.md`
12. `docs/06_Guidance_Content_Framework.md`
13. `docs/09_Decision_Log.md`
14. `docs/10_Working_LLM_Rules.md`
15. `docs/12_LLM_Execution_Contract.md`

If lower-order documents conflict with higher-order documents, the higher-order document wins and the conflict must be corrected.

## Non-Negotiable Rules

- Do not reframe this product as a diagnostic, remediation, or unrestricted admin platform.
- Do not add migration-repair workflows, cleanup tooling, or historical recovery logic.
- Do not create flows that bypass checkpoint enforcement for convenience.
- Do not assume configuration is safe without validation evidence or governed execution approval.
- Do not propose or execute writes where the governing documents classify them as blocked.
- Do not introduce direct database write paths as a substitute for governed Odoo application-layer execution.
- Do not execute conditional actions without the confirmations required by the governing documents.
- Do not imply that connection support exists where the current build does not actually implement it.
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
- UI or workflow language that implies connection, preview, or execution support that does not exist
- execution flows that bypass preview, safety class, or audit logging
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
- ensure any workflow, state model, or UI proposal maps back to checkpoints, validation, downstream impact, and execution safety
- treat preview and execution as controlled platform surfaces, not convenience shortcuts
- run a consistency review after significant documentation changes

## Product Direction Rule

Agents may not redefine product direction from coding tasks.

Coding work may implement, clarify, or operationalize the governed bounded-execution direction. If a coding task appears to require a product-level change beyond the current execution model, the agent must:

1. identify the governing documents affected
2. state the conflict or ambiguity explicitly
3. propose a bounded update rather than silently changing direction in code
