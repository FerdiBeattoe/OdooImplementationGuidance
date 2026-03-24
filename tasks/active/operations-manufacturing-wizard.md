# Agent Task: Operations & Manufacturing Wizard Builder

## Goal
Build validation wizards for Odoo 19 Operations and Manufacturing modules.

## Scope
Create wizard configuration files for:
- Inventory/Operations module setup
- Manufacturing (MRP) module setup

## Deliverables
1. Wizard config JSON in `src/wizards/operations.json`
2. Wizard config JSON in `src/wizards/manufacturing.json`
3. Checkpoint validation rules in `src/checkpoints/ops-mrp.js`
4. Test file: `src/wizards/__tests__/ops-mrp.test.js`

## Constraints
- Follow existing wizard patterns in `src/wizards/`
- Only Odoo 19 Community + Enterprise features
- No remediation logic - implementation control only
- All checkpoints must be enforced

## Success Criteria
- Wizards load without errors
- All required fields validated
- Preview-before-execution enforced
- Tests pass: `npm test -- src/wizards/__tests__/ops-mrp.test.js`

## References
Read before starting:
- `docs/04_Domain_Coverage_Map.md` (Operations & Manufacturing sections)
- `src/wizards/inventory.json` (reference pattern)
- `src/engine/TransactionManager.js` (execution model)
