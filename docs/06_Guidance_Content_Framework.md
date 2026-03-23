# Guidance Content Framework

## Purpose

This document defines the standard structure for guidance presented alongside implementation decisions.

## Standard Guidance Block

Every material implementation decision should be expressed in a guidance block with the following fields:

- `What this is`
  - plain-language definition of the setting, policy, or design choice
- `Why it matters`
  - the operational reason the decision is consequential
- `Downstream impact`
  - which later flows, controls, reports, or user behaviors are affected
- `Common mistakes`
  - predictable implementation errors or false assumptions
- `Reversibility`
  - whether the decision is easy, difficult, or unsafe to change later
- `Who should decide`
  - the accountable functional or business owner
- `Training should be offered`
  - yes, no, or role-dependent
- `Checkpoint blocker`
  - whether the decision blocks progression if unresolved

## Guidance Writing Rules

- Guidance must explain implications, not merely describe screens.
- Downstream impact must be concrete enough to affect sequencing or checkpointing.
- Reversibility must be honest. Do not describe consequential finance or operational policies as easily reversible if they are not.
- Decision ownership must name a role type, not "the system."
- Training remains opt-in by default unless the project owner requires it.

## Example Guidance Blocks

### Inventory Valuation

- What this is: the method by which inventory value is recognized and linked to accounting behavior.
- Why it matters: it shapes stock valuation reporting, accounting entries, and finance-operational alignment.
- Downstream impact: affects accounting integration, product category policy, cost visibility, and go-live finance controls.
- Common mistakes: choosing a method without finance ownership, ignoring product category implications, assuming the choice is cosmetic.
- Reversibility: difficult; changes after operational use may carry significant downstream consequences.
- Who should decide: finance lead with inventory/process owner input.
- Training should be offered: role-dependent.
- Checkpoint blocker: yes for inventory-accounting go-live paths.

### Routes

- What this is: the set of logistics paths that define how products move through procurement, manufacturing, and warehouse operations.
- Why it matters: routes determine replenishment behavior, warehouse flow, and operational complexity.
- Downstream impact: affects purchase triggers, manufacturing behavior, operation types, picking flow, and user workload.
- Common mistakes: enabling routes without warehouse design clarity, combining flows that users cannot operate consistently, assuming defaults fit every business.
- Reversibility: moderate to difficult depending on live usage and dependency breadth.
- Who should decide: operations lead with supply chain owner input.
- Training should be offered: yes.
- Checkpoint blocker: yes when routes govern in-scope operational flow.

### Landed Costs

- What this is: the policy and method for allocating additional procurement-related costs into inventory valuation.
- Why it matters: it changes stock cost treatment and finance reporting expectations.
- Downstream impact: affects product costing, accounting interpretation, margin visibility, and finance close confidence.
- Common mistakes: enabling without finance agreement, treating landed costs as optional detail when costing accuracy matters, skipping who enters and validates the costs.
- Reversibility: difficult once relied on operationally.
- Who should decide: finance lead with procurement and inventory owner input.
- Training should be offered: role-dependent.
- Checkpoint blocker: yes when inventory costing depends on it.

### POS Invoicing Policy

- What this is: the rule for when and how POS transactions produce invoices or remain receipt-based sales.
- Why it matters: it changes cashier workflow, customer experience, and accounting expectations.
- Downstream impact: affects customer record use, journal behavior, tax handling, and close processes.
- Common mistakes: assuming every POS sale should invoice, ignoring customer identification flow, overlooking session-close implications.
- Reversibility: moderate, but operational disruption risk is material once stores are live.
- Who should decide: retail operations owner with finance lead input.
- Training should be offered: yes.
- Checkpoint blocker: yes for POS go-live.

### Operation Types / Sequences

- What this is: the design of stock operation categories and their controlled numbering or execution structure.
- Why it matters: it governs warehouse traceability, user actions, and process clarity.
- Downstream impact: affects picking flow, auditability, warehouse training, and reporting interpretation.
- Common mistakes: creating inconsistent operation structures, ignoring user comprehension, overcomplicating flows beyond actual need.
- Reversibility: moderate to difficult depending on live usage and reporting reliance.
- Who should decide: warehouse or operations lead.
- Training should be offered: yes.
- Checkpoint blocker: yes when inventory operations are in scope.

### User Roles / Approvals

- What this is: the assignment of access rights and approval authority across the implementation.
- Why it matters: it determines control, accountability, and separation of duties.
- Downstream impact: affects every domain that depends on restricted actions, approvals, or delegated responsibility.
- Common mistakes: copying broad admin access into business roles, leaving approvers undefined, treating role design as an afterthought.
- Reversibility: moderate, but uncontrolled changes can create operational and governance risk.
- Who should decide: project owner with functional leads and security/admin owner input.
- Training should be offered: role-dependent.
- Checkpoint blocker: yes for all in-scope domains requiring approvals or restricted access.
