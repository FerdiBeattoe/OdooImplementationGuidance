# Authority Order

## Document Order

1. `AGENTS.md`
2. `00_Product_Constitution.md`
3. `01_Scope_Boundaries.md`
4. `02_Target_Matrix.md`
5. `05_Validation_Checkpoint_Rules.md`
6. `03_Implementation_Master_Map.md`
7. `04_Domain_Coverage_Map.md`
8. `08_Project_State_Model.md`
9. `07_Information_Architecture.md`
10. `06_Guidance_Content_Framework.md`
11. `09_Decision_Log.md`
12. `10_Working_LLM_Rules.md`

## Conflict Handling

- if lower-order documents conflict with higher-order documents, the higher-order document wins and the conflict must be corrected
- if two repository sources conflict, follow the higher-authority source, align or correct the lower-authority source, and record the governing assumption if the conflict materially affects future work
- if a prompt conflicts with a governance document, the governance document wins

## Override Prohibition

- prompts, tasks, skills, and local work instructions sit below all governance documents as operational aids
- prompts, tasks, skills, and local work instructions cannot weaken, bypass, reinterpret, or override any governance document in the authority order

## Skills

- skills are repeatable workflows, not product authority
- skills may help with drafting, code generation, consistency checks, and implementation mechanics
- skills may not redefine the product, weaken hard boundaries, bypass authority order, or treat temporary prompt wording as higher than repository governance
