# Implementation Structure

Merged from: `docs/03_Implementation_Master_Map.md`, `docs/04_Domain_Coverage_Map.md`

Root sources take precedence over this file in any conflict.

Domain entries are governance shells, not proof of exhaustive checkpoint completeness within any domain. Any official domain not listed here is not yet governed by this framework and must not be treated as covered until added with the same control fields.

---

## Part 1: Implementation Stage Map

### Stage 1 — Entry / Project Setup

Purpose: establish project identity; select supported project mode; record version, edition, deployment, and target environment context; activate the initial governance frame.

Dependencies: none.

Outputs: project record, selected project mode, deployment and edition context, initial stakeholder and owner list.

Exit criteria: project mode confirmed; supported target matrix combination valid; responsible owner identified; stage routing initialized.

### Stage 2 — Business Assessment

Purpose: define the intended operating model; identify priority processes, decision owners, and phased rollout boundaries; separate required scope from optional ambition.

Dependencies: Entry / Project Setup complete.

Outputs: business process scope summary, phased domain priorities, decision-owner mapping, identified policy decisions requiring guidance.

Exit criteria: core business scope confirmed; major policy decisions identified; phase boundaries explicit.

### Stage 3 — System Discovery

Purpose: identify the current system context for the selected project mode; confirm which domains, modules, and configurations are in use, dormant, or planned; establish the baseline without drifting into remediation.

Dependencies: Business Assessment complete.

Outputs: implementation baseline record, current domain status map, deployment/environment context details, identified dependencies for new setup or expansion.

Exit criteria: current state sufficiently known for controlled planning; unused versus active capability distinguished; no discovery item framed as a repair task.

### Stage 4 — Foundation

Purpose: define company structure, localization, base settings, and implementation-wide control settings.

Dependencies: System Discovery complete.

Outputs: company and localization decisions, baseline operational settings, foundational checkpoint results.

Exit criteria: foundational dependencies satisfied for downstream domains; blocked foundational decisions resolved or explicitly deferred.

### Stage 5 — Users / Roles / Security

Purpose: establish controlled access, role design, approval responsibilities, and separation of duties.

Dependencies: Foundation complete.

Outputs: role matrix, user access policy decisions, approval responsibility map.

Exit criteria: required roles defined; approval owners assigned; access-dependent domains can proceed.

### Stage 6 — Master Data

Purpose: define the structure and governance of shared records used across downstream domains.

Dependencies: Foundation complete; Users / Roles / Security complete where access affects stewardship.

Outputs: master data model decisions, ownership and maintenance rules, key record validation checkpoints.

Exit criteria: required master data structures defined; downstream domains have the data prerequisites they need.

### Stage 7 — Core Operations

Purpose: govern the primary operational flow domains — CRM, Sales, Purchase, Inventory, Manufacturing, POS, Projects, and related operational areas.

Dependencies: Foundation complete; Users / Roles / Security complete; Master Data complete for dependent objects; finance policy checkpoints complete where valuation, invoicing, costing, fiscal control, or accounting linkage affect the operational design.

Outputs: domain-by-domain operational decisions, dependency-aware checkpoint outcomes, controlled setup sequence for core operational modules.

Exit criteria: required operational domains meet their checkpoint criteria; cross-domain dependencies satisfied.

### Stage 8 — Finance

Purpose: govern accounting, valuation, invoicing, fiscal controls, and finance-dependent downstream decisions, including finance policy prerequisites that must be set before valuation-sensitive or invoice-sensitive operational design is finalized.

Dependencies: Foundation complete; Master Data complete; Core Operations sufficiently defined where finance depends on operational policy — but finance policy checkpoints must be completed before dependent operational checkpoints can exit.

Outputs: finance policy decisions, accounting and valuation checkpoints, invoice and reconciliation readiness indicators.

Exit criteria: finance-critical checkpoints complete or formally deferred with approved constraints; operational-finance dependencies aligned.

### Stage 9 — Extended Modules

Purpose: govern optional or later-phase domains — PLM, Quality, Maintenance, Repairs, Documents, Sign, Approvals, Subscriptions, Rental, and Field Service.

Dependencies: Foundation complete; Users / Roles / Security complete; Master Data complete where applicable; relevant Core Operations or Finance dependencies complete.

Outputs: controlled setup plans for extended domains, checkpoint outcomes and guidance decisions, clear go-live or phase-2 classification.

Exit criteria: each in-scope extended domain classified as complete, deferred, or later-phase; required cross-domain dependencies met.

### Stage 10 — Validation

Purpose: consolidate checkpoint evidence, unresolved warnings, blocked items, and deferments across the project.

Dependencies: all relevant prior stages reviewed.

Outputs: validation summary, unresolved blocker register, evidence completeness view, readiness gap list.

Exit criteria: blockers visible and owned; evidence for critical checkpoints present; readiness decision can be made with traceability.

### Stage 11 — Go-Live Readiness

Purpose: determine whether the implementation is operationally ready, not merely configured.

Dependencies: Validation complete.

Outputs: go-live recommendation, required cutover or activation conditions, training status where required by owner, explicit accepted deferments.

Exit criteria: configuration completion distinguished from operational readiness; go-live blockers resolved or acceptance explicitly withheld.

### Stage 12 — Post Go-Live / Phase 2

Purpose: govern forward-safe expansion after initial go-live without drifting into remediation.

Dependencies: Go-Live Readiness complete or explicitly accepted for current phase.

Outputs: phase-2 candidate domains, forward-safe expansion queue, retained decision history and deferred checkpoint set.

Exit criteria: next-phase work classified under supported project modes; deferred work remains traceable and bounded.

## Stage Ordering Rules

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

---

## Part 2: Domain Coverage Map

### Coverage Legend

Checkpoint priority: `Required` | `Go-Live` | `Recommended` | `Optional`
Validation source: `System-detectable` | `User-confirmed` | `Both`
Write classes: `Safe` | `Conditional` | `Blocked`

### Domains

**Foundation / Company / Localization**
Purpose: establish company identity, localization context, base settings, currencies, taxes, and environment-wide implementation assumptions.
Topics: company setup, localization, fiscal context, units of measure, languages, base settings.
Checkpoint groups: organizational identity, localization selection, baseline settings, shared operating assumptions.
Priority: Required | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Users / Roles / Security**
Purpose: define who can access the system, approve actions, and operate critical functions.
Topics: users, groups, roles, approvals, segregation of duties, privileged access.
Checkpoint groups: access design, approval control, privileged access review, security readiness.
Priority: Required | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Master Data**
Purpose: govern shared reference records required by downstream domains.
Topics: products, contacts, vendors, customers, categories, warehouses, bill of materials references.
Checkpoint groups: core records, ownership, structure, readiness for downstream use.
Priority: Required | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**CRM**
Purpose: govern lead and opportunity flow, sales pipeline structure, and commercial qualification.
Topics: pipeline stages, lead handling, opportunity ownership, activities, teams.
Checkpoint groups: pipeline design, ownership, activity discipline, reporting readiness.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Sales**
Purpose: govern quotation-to-order flow and commercial execution policy.
Topics: quotations, sales orders, pricing, order policy, invoicing triggers.
Checkpoint groups: commercial policy, order control, pricing, invoicing linkage.
Priority: Required | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Purchase**
Purpose: govern supplier procurement, purchasing control, and inbound commercial commitments.
Topics: vendors, purchase orders, approval flow, replenishment dependencies, vendor terms.
Checkpoint groups: vendor policy, order control, approval design, finance linkage.
Priority: Required | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Inventory**
Purpose: govern stock structure, movement control, warehouse policy, routes, valuation dependencies, and traceability.
Topics: warehouses, locations, routes, operation types, units, valuation, replenishment.
Checkpoint groups: warehouse design, movement policy, valuation dependencies, traceability, replenishment.
Priority: Go-Live | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Manufacturing (MRP)**
Purpose: govern production execution, bills of materials, work orders, and manufacturing control.
Topics: BOMs, work centers, routings, manufacturing orders, subcontracting.
Checkpoint groups: production design, BOM governance, execution control, stock-finance dependencies.
Priority: Go-Live | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**PLM**
Purpose: govern engineering change control linked to manufacturing structures.
Topics: engineering changes, version control, approval flow, document linkage.
Checkpoint groups: change control, approval design, manufacturing linkage.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Accounting**
Purpose: govern fiscal setup, journals, invoicing policy, taxes, reconciliation, and financial control.
Topics: chart of accounts, taxes, journals, invoicing, payments, reconciliation, valuation integration.
Checkpoint groups: fiscal setup, invoice policy, valuation linkage, control and close readiness.
Priority: Go-Live | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**POS**
Purpose: govern point-of-sale execution, session policy, order handling, stock and accounting linkage.
Topics: POS configuration, sessions, payment methods, receipts, invoicing, cash control.
Checkpoint groups: session control, cashier access, accounting linkage, customer handling.
Priority: Go-Live | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Website / eCommerce**
Purpose: govern customer-facing digital commerce, catalog publication, checkout behavior, and order integration.
Topics: website structure, eCommerce catalog, checkout, payments, shipping, content governance.
Checkpoint groups: storefront policy, commerce flow, payment and fulfillment linkage.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Projects**
Purpose: govern project delivery structures, task flow, timesheets, and service execution tracking.
Topics: projects, tasks, stages, timesheets, billing linkage, team ownership.
Checkpoint groups: project structure, execution policy, billing linkage, ownership.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**HR**
Purpose: govern employee records, organizational structure, and HR-related operational policies within supported functional scope.
Topics: employees, departments, approvals linkage, attendance context, time off context.
Checkpoint groups: employee structure, ownership, approval relationships.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Quality**
Purpose: govern quality control points, checks, and non-financial inspection flow across operations.
Topics: quality points, checks, alerts, control criteria.
Checkpoint groups: control design, trigger rules, exception handling.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Maintenance**
Purpose: govern equipment maintenance planning and service execution for internal assets.
Topics: equipment, preventive maintenance, maintenance teams, requests.
Checkpoint groups: asset structure, planning, ownership, execution policy.
Priority: Optional | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Repairs**
Purpose: govern controlled repair workflows for repair operations as an official Odoo domain, not historical correction activity.
Topics: repair orders, parts usage, approvals, billing linkage.
Checkpoint groups: repair process design, approval control, stock and billing linkage.
Priority: Optional | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Documents**
Purpose: govern structured document storage, retrieval, and operational document workflows.
Topics: workspaces, document rules, attachments, access, operational linkage.
Checkpoint groups: workspace governance, access control, operational linkage.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Safe

**Sign**
Purpose: govern signature workflows, signer roles, and document approval execution.
Topics: templates, signer order, access control, signed-document handling.
Checkpoint groups: template governance, signer control, record traceability.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Approvals**
Purpose: govern formal approval requests that sit outside individual module-specific approval rules.
Topics: approval types, approvers, thresholds, traceability.
Checkpoint groups: approval structure, authority control, traceability.
Priority: Recommended | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Subscriptions**
Purpose: govern recurring revenue models, renewal policy, invoicing cadence, and customer lifecycle control.
Topics: plans, renewals, recurring invoicing, amendments, customer notifications.
Checkpoint groups: recurring billing policy, lifecycle control, accounting linkage.
Priority: Optional | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Rental**
Purpose: govern rental inventory, reservations, pricing periods, and return handling.
Topics: rental products, periods, availability, pickup and return flow, billing.
Checkpoint groups: rental policy, inventory linkage, billing linkage.
Priority: Optional | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

**Field Service**
Purpose: govern on-site service execution, scheduling, task completion, and service-related inventory or billing linkage.
Topics: field tasks, teams, dispatching, on-site materials, service reports.
Checkpoint groups: dispatch design, execution control, stock and billing linkage.
Priority: Optional | Validation: Both | Guidance: Yes | Training: Yes | Writes: Conditional

## Coverage Rules

- Every in-scope domain must be classified into checkpoint groups before operational rollout.
- Domain entries in this document are governance shells, not proof of exhaustive checkpoint completeness within that domain.
- Priority level may vary by project scope, but foundational dependency rules still apply.
- Guidance is required for any domain where decisions create meaningful downstream impact.
- Training assignment remains opt-in by default unless the project owner requires it.
- A domain may only be marked `Safe` for writes when the changes are low-risk, forward-safe, and do not depend on unresolved checkpoints.
- No domain may be used as a back door for remediation or historical correction work.
- Cross-domain dependency rules remain enforceable even when domains are worked through separately in the interface.
