# Authority Order

## Purpose

This document makes the repository authority order explicit for governance, execution, and agent behavior.

## Authority Sequence

The governing authority sequence is:

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

## Conflict Resolution Rule

- If two documents conflict, the higher-order document wins.
- Lower-order code, prompts, UI copy, or implementation behavior must be aligned to the higher-order document.
- Product-direction changes require explicit updates to the governing documents before code changes rely on them.

## Execution Governance Rule

- No live connection, inspection, preview, or execution capability may be introduced by implication alone.
- If execution is allowed, it must be grounded in explicit authority across the constitution, scope, validation, state, and execution-contract documents.
- If those documents are not aligned, implementation must stop and the conflict must be reported.
