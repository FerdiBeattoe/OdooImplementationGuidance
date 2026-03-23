# Implementation Master Map

## Purpose

This master map defines the high-level implementation journey and the order in which a controlled Odoo 19 implementation or forward-safe expansion should be governed.

## Stage Map

### 1. Entry / Project Setup

Purpose:

- establish project identity
- select supported project mode
- record version, edition, deployment, and target environment context
- activate the initial governance frame

Dependencies:

- none

Outputs:

- project record
- selected project mode
- deployment and edition context
- initial stakeholder and owner list

Exit Criteria:

- project mode is confirmed
- supported target matrix combination is valid
- responsible owner is identified
- stage routing is initialized

### 2. Business Assessment

Purpose:

- define the intended operating model
- identify priority processes, decision owners, and phased rollout boundaries
- separate required scope from optional ambition

Dependencies:

- Entry / Project Setup complete

Outputs:

- business process scope summary
- phased domain priorities
- decision-owner mapping
- identified policy decisions requiring guidance

Exit Criteria:

- core business scope is confirmed
- major policy decisions are identified
- phase boundaries are explicit

### 3. System Discovery

Purpose:

- identify the current system context for the selected project mode
- confirm which domains, modules, and configurations are in use, dormant, or planned
- establish the baseline without drifting into remediation

Dependencies:

- Business Assessment complete

Outputs:

- implementation baseline record
- current domain status map
- deployment/environment context details
- identified dependencies for new setup or expansion

Exit Criteria:

- current state is sufficiently known for controlled planning
- unused versus active capability is distinguished
- no discovery item is framed as a repair task

### 4. Foundation

Purpose:

- define company structure, localization, base settings, and implementation-wide control settings

Dependencies:

- System Discovery complete

Outputs:

- company and localization decisions
- baseline operational settings
- foundational checkpoint results

Exit Criteria:

- foundational dependencies are satisfied for downstream domains
- blocked foundational decisions are resolved or explicitly deferred

### 5. Users / Roles / Security

Purpose:

- establish controlled access, role design, approval responsibilities, and separation of duties

Dependencies:

- Foundation complete

Outputs:

- role matrix
- user access policy decisions
- approval responsibility map

Exit Criteria:

- required roles are defined
- approval owners are assigned
- access-dependent domains can proceed

### 6. Master Data

Purpose:

- define the structure and governance of shared records used across downstream domains

Dependencies:

- Foundation complete
- Users / Roles / Security complete where access affects stewardship

Outputs:

- master data model decisions
- ownership and maintenance rules
- key record validation checkpoints

Exit Criteria:

- required master data structures are defined
- downstream domains have the data prerequisites they need

### 7. Core Operations

Purpose:

- govern the primary operational flow domains such as CRM, Sales, Purchase, Inventory, Manufacturing, POS, Projects, and related operational areas

Dependencies:

- Foundation complete
- Users / Roles / Security complete
- Master Data complete for dependent objects
- finance policy checkpoints complete where valuation, invoicing, costing, fiscal control, or accounting linkage affect the operational design

Outputs:

- domain-by-domain operational decisions
- dependency-aware checkpoint outcomes
- controlled setup sequence for core operational modules

Exit Criteria:

- required operational domains meet their checkpoint criteria
- cross-domain dependencies are satisfied

### 8. Finance

Purpose:

- govern accounting, valuation, invoicing, fiscal controls, and finance-dependent downstream decisions, including finance policy prerequisites that must be set before valuation-sensitive or invoice-sensitive operational design is finalized

Dependencies:

- Foundation complete
- Master Data complete
- Core Operations sufficiently defined where finance depends on operational policy, but finance policy checkpoints must be completed before dependent operational checkpoints can exit

Outputs:

- finance policy decisions
- accounting and valuation checkpoints
- invoice and reconciliation readiness indicators

Exit Criteria:

- finance-critical checkpoints are complete or formally deferred with approved constraints
- operational-finance dependencies are aligned

### 9. Extended Modules

Purpose:

- govern optional or later-phase domains such as PLM, Quality, Maintenance, Repairs, Documents, Sign, Approvals, Subscriptions, Rental, and Field Service

Dependencies:

- Foundation complete
- Users / Roles / Security complete
- Master Data complete where applicable
- relevant Core Operations or Finance dependencies complete

Outputs:

- controlled setup plans for extended domains
- checkpoint outcomes and guidance decisions
- clear go-live or phase-2 classification

Exit Criteria:

- each in-scope extended domain is classified as complete, deferred, or later-phase
- required cross-domain dependencies are met

### 10. Validation

Purpose:

- consolidate checkpoint evidence, unresolved warnings, blocked items, and deferments across the project

Dependencies:

- all relevant prior stages reviewed

Outputs:

- validation summary
- unresolved blocker register
- evidence completeness view
- readiness gap list

Exit Criteria:

- blockers are visible and owned
- evidence for critical checkpoints is present
- readiness decision can be made with traceability

### 11. Go-Live Readiness

Purpose:

- determine whether the implementation is operationally ready, not merely configured

Dependencies:

- Validation complete

Outputs:

- go-live recommendation
- required cutover or activation conditions
- training status where required by owner
- explicit accepted deferments

Exit Criteria:

- configuration completion is distinguished from operational readiness
- go-live blockers are resolved or acceptance is explicitly withheld

### 12. Post Go-Live / Phase 2

Purpose:

- govern forward-safe expansion after initial go-live without drifting into remediation

Dependencies:

- Go-Live Readiness complete or explicitly accepted for current phase

Outputs:

- phase-2 candidate domains
- forward-safe expansion queue
- retained decision history and deferred checkpoint set

Exit Criteria:

- next-phase work is classified under supported project modes
- deferred work remains traceable and bounded

## Ordering Rules

- Foundation precedes all domain setup that depends on company structure, localization, or base policies.
- Users / Roles / Security must precede domain areas where approvals, access rights, or separation of duties matter.
- Master Data must precede downstream operational and finance configuration that depends on shared records.
- Finance cannot be treated as a late cosmetic layer where valuation, invoicing, costing, or fiscal policy affect operational setup. Finance policy checkpoints must be completed before dependent Core Operations checkpoints can pass.
- Extended Modules may not bypass dependencies established in earlier stages.
- Validation and Go-Live Readiness must consolidate evidence across all required in-scope stages.

## Critical Cross-Domain Dependency Rules

- Inventory valuation-sensitive checkpoints cannot pass until the required Accounting policy checkpoints are passed or formally deferred under approved constraints.
- Manufacturing costing or stock-accounting-sensitive checkpoints cannot pass until dependent Inventory and Accounting checkpoints are passed or formally deferred under approved constraints.
- POS invoicing and accounting-linkage checkpoints cannot pass until dependent Accounting policy checkpoints are passed or formally deferred under approved constraints.
- Purchase billing or approval-sensitive checkpoints cannot pass until dependent Accounting and Users / Roles / Security checkpoints are passed or formally deferred under approved constraints.
