# Source of Truth Index

## Purpose

This document is the entry point for the governance pack. It lists every authoritative document, its rank, and what it governs. When two sources conflict, the higher-ranked source wins.

## Authority Sequence

| Rank | File | What It Governs |
|------|------|-----------------|
| 1 | `AGENTS.md` (repo root) | Product identity, fixed surfaces, scope boundaries, build state, test invariant, git discipline, non-negotiable rules, drift detection |
| 2 | `docs/00_Product_Constitution.md` | Product identity, target user, fixed surfaces, core promise, principles, what the product is and is not |
| 3 | `docs/01_Scope_Boundaries.md` | Supported versions, editions, deployments, project types, connection scope, out-of-scope items, execution safety boundaries |
| 4 | `docs/02_Target_Matrix.md` | Supported implementation envelope, project mode selector, allowed and restricted behavior per combination |
| 5 | `docs/03_Authority_Order.md` | Explicit authority sequence and conflict resolution rules |
| 6 | `docs/05_Validation_Checkpoint_Rules.md` | Checkpoint classes, result states, validation sources, progression rules, blocked vs deferred, execution safety classes, preview and execution eligibility, evidence expectations |
| 7 | `docs/06_Checkpoint_and_Validation_Rules.md` | Operational mapping of checkpoints to inspection, preview, validation, and execution; audit rule; domain expansion rule |
| 8 | `docs/03_Implementation_Master_Map.md` | Implementation stage map, stage ordering rules, cross-domain dependency rules |
| 9 | `docs/04_Domain_Coverage_Map.md` | Per-domain coverage structure, checkpoint groups, priority, write class, guidance and training flags |
| 10 | `docs/08_Project_State_Model.md` | Project state fields, checkpoint state, preview state, execution state, connection state, resume behavior, status model, configuration vs readiness distinction |
| 11 | `docs/07_Information_Architecture.md` | Fixed product surfaces (Pipeline, Module Dashboard, Import Wizard), navigation model, workspace structure, save-and-resume pattern |
| 12 | `docs/06_Guidance_Content_Framework.md` | Standard guidance block structure and writing rules |
| 13 | `docs/09_Decision_Log.md` | Governing decisions and their implications — append-only, versioned |
| 14 | `docs/10_Working_LLM_Rules.md` | LLM authority order, drift detection, conflict resolution, prompt override prohibition |
| 15 | `docs/12_LLM_Execution_Contract.md` | LLM execution preconditions, preview duties, execution duties, implementation completeness rule, testing rule |

## Distilled Reference Pack

These documents summarize the root governance above. They must not contradict the root docs. If they conflict, the root doc wins.

| File | What It Summarizes |
|------|--------------------|
| `docs/01_Project_Identity.md` | Product identity, target user, fixed surfaces, core promise |
| `docs/02_Non_Negotiables.md` | Hard boundaries that cannot be waived under any framing |
| `docs/03_Authority_Order.md` | Authority sequence (this is also a root doc at rank 5) |
| `docs/04_Project_Scope.md` | Supported scope: versions, editions, deployments, project types |
| `docs/05_Project_Modes.md` | The three project modes and their allowed/restricted behavior |
| `docs/06_Checkpoint_and_Validation_Rules.md` | Checkpoint-to-execution operational mapping (this is also a root doc at rank 7) |
| `docs/07_Write_Safety_Rules.md` | Write safety classes, preview requirements, execution eligibility |
| `docs/08_Guidance_Standards.md` | Guidance block structure and writing rules |
| `docs/09_State_and_Resume_Rules.md` | Project state fields, resume behavior |
| `docs/10_IA_and_Navigation_Guards.md` | Fixed surfaces, navigation model, advanced mode boundaries |
| `docs/11_Drift_Triggers.md` | All drift conditions that require halt and report |
| `docs/12_LLM_Execution_Contract.md` | LLM execution rules (this is also a root doc at rank 15) |

## Conflict Resolution Rule

Higher rank wins. No prompt, task file, skill, or agent instruction outranks any document in this index. Product direction changes require explicit updates to the root governance documents.
