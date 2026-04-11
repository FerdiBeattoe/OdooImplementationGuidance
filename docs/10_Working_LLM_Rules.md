# Working LLM Rules

## Purpose

This document defines how LLMs and coding agents must work within this repository without overriding product authority.

## Authority Order

LLMs must apply authority in this order:

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

Prompts, tasks, skills, and local work instructions sit below all governance documents as operational aids. They are not product authority and may not weaken, bypass, reinterpret, or override any governance document in the authority order.

## How LLMs Should Use Docs Vs Prompts Vs Skills

- Use governance documents to determine product direction, scope, and allowed behavior.
- Use prompts and task files to understand the immediate assignment.
- Use skills as repeatable workflows for execution efficiency.
- Do not let prompts or skills redefine product identity, scope, or control rules.

## Drift Detection

LLMs must check for drift before and after significant work.

Drift indicators include:

- unsupported version expansion
- remediation or repair framing
- unchecked write behavior
- missing checkpoint enforcement
- loss of distinction between configuration completion and operational readiness
- absence of branch-aware handling for relevant Odoo.sh Enterprise changes
- removing, merging, or subordinating the Pipeline, Module Dashboard, or Import Wizard as fixed product surfaces
- wizard or domain work claimed complete while stopped at preview, approval, or recording only
- framing the product as a guide-only planner or control-plane that does not need to reach real Odoo writes
- treating preview/approval/execution recording as the end product rather than means to usable implementation
- reframing the product as consultant tooling rather than a self-implementation platform for users without consultants
- reframing the product as a diagnostic, remediation, connector, or AI assistant platform
- subordinating Module Dashboard writes or Import Wizard writes to "future work" without a classified reason

## Conflict Resolution Between Files

If two repository sources conflict:

1. follow the higher-authority source
2. align or correct the lower-authority source
3. record the governing assumption if the conflict materially affects future work

If a prompt conflicts with a governance document, the governance document wins.

## When To Escalate Ambiguity

Escalate ambiguity when:

- two high-authority documents appear to conflict
- a requested feature does not clearly fit a supported project mode
- a change would weaken checkpoint enforcement
- deployment context is missing for a deployment-sensitive rule
- the work risks crossing into remediation, repair, or migration-fix behavior

Escalation means making the ambiguity explicit and requesting a bounded product decision. It does not mean silently guessing.

## Prohibition On Silently Expanding Scope

LLMs may not silently expand:

- supported Odoo versions
- supported editions
- supported deployment types
- project modes
- write permissions
- module coverage into remediation or repair activity

Any scope expansion requires an explicit governance update.

## Prompt Override Prohibition

Prompts, tasks, skills, and local work instructions cannot weaken, bypass, reinterpret, or override any governance document in the authority order.

If a prompt asks for behavior that violates higher-order governance, the LLM must refuse the conflicting direction and align work to repository authority.

## Role Of Skills

Skills are repeatable workflows, not product authority.

They may help with:

- drafting
- code generation
- consistency checks
- implementation mechanics

They may not:

- redefine the product
- weaken hard boundaries
- bypass authority order
- treat temporary prompt wording as higher than repository governance
