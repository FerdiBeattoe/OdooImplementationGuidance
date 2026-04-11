# Product Constitution

## Product Identity

The product is a human-facing Odoo 19 self-implementation platform that helps people implement Odoo without consultants.

It takes a business owner, operations lead, or in-house team through a complete, truthful Odoo 19 implementation by:

- asking plain-language questions to understand what the business needs
- determining which modules and settings are required based on those answers
- explaining every consequential decision in plain language before it is made
- writing the configuration it can truthfully write directly to Odoo through governed, approved execution
- guiding the user through the remaining setup and data import work inside the platform

The three fixed product surfaces are:

- the **Pipeline** — the logic and control layer that sequences implementation, enforces checkpoints, and governs execution
- the **Module Dashboard** — the module-level workspace that writes configuration to Odoo where truthful writes exist
- the **Import Wizard** — the data import surface that writes records to Odoo through governed import execution

These surfaces are not interchangeable, optional, or subordinate to one another. They are the product.

The platform operates across Community and Enterprise editions and across Odoo Online, Odoo.sh Enterprise, and On-Premise deployments.

## Target Users

The primary user is a person or small team implementing Odoo without an external consultant. This includes:

- business owners setting up Odoo themselves
- operations leads taking on their own implementation
- in-house project owners running a self-directed rollout
- small teams with no dedicated Odoo partner engagement

Secondary users:

- implementation leads and project owners managing a structured rollout
- reviewers approving checkpoint completion
- team members assigned bounded domain setup tasks under a governed plan

## Core Promise

The platform will guide a user through correct Odoo 19 setup in plain language, in the right order. It will ask questions, explain the impact of each decision before it is made, connect to the user's Odoo environment, write what it can truthfully write through governed execution, and guide the user through the remaining setup and import work. It will confirm at every critical checkpoint before advancing. It supports only forward-safe bounded implementation activity.

## Product Principles

### Control Before Configuration

The platform exists to control implementation quality, not to accelerate unchecked setup.

### Validation Before Progression

Users may not advance through critical implementation stages without checkpoint evidence.

### Guidance With Consequences

Guidance must explain downstream impact, reversibility, and decision ownership. It must not function as generic help text.

### Preview Before Execution

The platform must show intended implementation actions before any live execution is allowed.

### Bounded Execution Only

The platform may execute only approved safe implementation actions within explicit deployment, checkpoint, and audit constraints.

### Forward-Safe Expansion Only

Expansion is permitted only when it can be introduced without relying on repair logic, historical correction, or unsafe retroactive changes.

### Explicit Boundaries

Supported versions, editions, deployments, connection methods, execution classes, and project modes must be stated directly and enforced consistently.

### Human Decision Ownership

The platform may structure decisions, inspect system state, and execute approved safe actions, but it may not invent business policy or best-guess operating logic.

### Operational Readiness Is Separate From Configuration Completion

A configured system is not automatically ready for go-live. Readiness requires checkpoint completion, evidence, and explicit acceptance.

## What The Product Is

The product is a human-guided Odoo self-implementation platform with three fixed surfaces:

- **Pipeline** — governs implementation sequencing, checkpoint enforcement, discovery, domain activation, and readiness
- **Module Dashboard** — provides module-level workspaces and writes configuration to Odoo where truthful writes exist
- **Import Wizard** — guides data preparation and writes records to Odoo through governed import execution

Together these surfaces:

- ask the user questions in plain language to determine what needs to be configured
- explain what each decision means and what happens downstream
- write configuration to Odoo through governed, approved, audited execution
- guide the user through the setup and import work that cannot be automated

The product is NOT a shell-first dashboard, a guide-only planner, a diagnostic tool, or a control-plane that stops before real Odoo writes. The Pipeline, Module Dashboard, and Import Wizard must all be present and functional. Removing or subordinating any of them breaks the product.

## What The Product Is Not

The product is not:

- a remediation tool
- a data repair tool
- a migration-fix platform
- a developer diagnostic workbench
- a transactional correction engine
- an unrestricted configuration automation tool
- a generic Odoo admin console
- a raw database writer
- a shell-first dashboard project that does not need to reach real Odoo writes
- a guide-only planner that stops at advice without governed execution
- a connector platform or integration middleware
- a substitute for business ownership of key implementation decisions
- a consultant engagement platform — users implement themselves, the platform assists

## Hard Boundary Rule

Any feature, workflow, guidance pattern, or code path that requires remediation framing, historical correction logic, transactional data surgery, unsupported version handling, skipped critical checkpoints, previewless execution, or unrestricted write access is out of scope and must not be added.

## Success Definition

The product is successful when it enables teams to:

- start an Odoo 19 implementation or forward-safe expansion with a clearly identified project mode
- move through implementation stages in a governed order
- complete critical checkpoints with appropriate validation evidence
- understand downstream impact before making consequential configuration decisions
- inspect supported live Odoo environments without drifting into unrestricted diagnostics
- preview intended implementation actions with explicit safety class before execution
- require and obtain approval before any governed execution
- execute real Odoo application-layer writes through governed bounded execution with audit traceability
- record truthful success/failure execution results
- reach a usable implementation state with enough domain coverage, data setup, and workflow completion for the project scope
- separate required, go-live, recommended, and optional work clearly
- resume in-progress work with accurate project state, decision history, and execution history
- maintain clean scope boundaries without drifting into remediation, diagnostics, or unrestricted administration

A wizard or domain surface is not "done" until it can produce a truthful preview, require approval, perform a real governed Odoo application-layer write, and record a truthful result — or is explicitly marked manual/out-of-scope with documented justification.

## Onboarding Wizard Governing Rules

### Rule 1 — Irreversible Decision Warning Pattern

Questions flagged as irreversible in the discovery framework (currently BM-03 and MF-01) must surface a warning screen before the user confirms their answer. The warning must:

- Name every domain that will be activated or excluded as a result of the answer
- Explain what that activation or exclusion means for the implementation sequence (which domains are unblocked, which are blocked, and which become go-live priority)
- Require explicit user acknowledgement before proceeding
- Never proceed silently on an irreversible answer

Silence on an irreversible answer is a platform integrity failure. This rule cannot be waived, deferred, or bypassed under any framing.

### Rule 2 — Deferred Answer Pattern

If a user skips or defers any discovery question:

- The wizard treats the unanswered question as "activate all domains this question could have triggered"
- The implementation surface will be larger than necessary but never smaller than necessary
- A warning is shown at the summary screen listing every domain activated by default due to unanswered questions
- The user must explicitly acknowledge the defaulted activations before the pipeline run is triggered
- Deferred questions are recorded in the runtime state as `deferred: true` so they can be revisited in a later session

The principle underlying this rule is conservative scope expansion: an implementation that includes unnecessary domains can have those domains deactivated through a scope change; an implementation that omits required domains cannot be corrected without a governed rebuild.
