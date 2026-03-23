# Guidance Standards

## Standard Guidance Block

Every material implementation decision should include:

- `What this is`
- `Why it matters`
- `Downstream impact`
- `Common mistakes`
- `Reversibility`
- `Who should decide`
- `Training should be offered`
- `Checkpoint blocker`

## Guidance Writing Rules

- guidance must explain implications, not merely describe screens
- downstream impact must be concrete enough to affect sequencing or checkpointing
- reversibility must be honest
- decision ownership must name a role type, not "the system"
- training remains opt-in by default unless the project owner requires it

## Example Decision Patterns

Inventory valuation:

- affects accounting integration, product category policy, cost visibility, and go-live finance controls
- difficult to change after operational use
- finance lead with inventory/process owner input decides
- blocks inventory-accounting go-live paths when unresolved

Routes:

- affect purchase triggers, manufacturing behavior, operation types, picking flow, and user workload
- moderate to difficult depending on live usage and dependency breadth
- operations lead with supply chain owner input decides
- block in-scope operational flow when unresolved

Landed costs:

- affect product costing, accounting interpretation, margin visibility, and finance close confidence
- difficult once relied on operationally
- finance lead with procurement and inventory owner input decides
- block inventory costing paths when unresolved

POS invoicing policy:

- affects customer record use, journal behavior, tax handling, and close processes
- moderate, with material operational disruption risk once live
- retail operations owner with finance lead input decides
- blocks POS go-live when unresolved

Operation types / sequences:

- affect picking flow, auditability, warehouse training, and reporting interpretation
- moderate to difficult depending on live usage and reporting reliance
- warehouse or operations lead decides
- block inventory operations when unresolved

User roles / approvals:

- affect every domain that depends on restricted actions, approvals, or delegated responsibility
- moderate, with operational and governance risk if changed loosely
- project owner with functional leads and security/admin owner input decides
- block all in-scope domains requiring approvals or restricted access when unresolved
