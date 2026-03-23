# Domain Coverage Map

## Purpose

This document defines the first-pass domain structure covered by the implementation control platform. It is intentionally expandable, but already operational as a governance baseline.

This document does not claim exhaustive checkpoint completeness for every official Odoo 19 domain. It defines the current governed domain structure. Any official domain not listed here is not yet governed by this framework and must not be treated as covered until added with the same control fields.

## Coverage Legend

- Checkpoint priority:
  - `Required`: must be completed for the domain to be governed correctly
  - `Go-Live`: must be completed before operational launch of that domain
  - `Recommended`: should be completed for controlled rollout, but may be deferred
  - `Optional`: useful but not required unless project scope elevates it
- Validation source:
  - `System-detectable`
  - `User-confirmed`
  - `Both`
- Write classes:
  - `Safe`
  - `Conditional`
  - `Blocked`

## Domain Framework

### Foundation / Company / Localization

- Domain purpose: establish company identity, localization context, base settings, currencies, taxes, and environment-wide implementation assumptions.
- Topics: company setup, localization, fiscal context, units of measure, languages, base settings.
- Subtopics: company record, localization package choice, multi-company intent, currencies, fiscal country, regional compliance assumptions.
- Checkpoint groups: organizational identity, localization selection, baseline settings, shared operating assumptions.
- Priority: Required
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Users / Roles / Security

- Domain purpose: define who can access the system, approve actions, and operate critical functions.
- Topics: users, groups, roles, approvals, segregation of duties, privileged access.
- Subtopics: role matrix, admin boundaries, approver assignment, access by domain, exception handling policy.
- Checkpoint groups: access design, approval control, privileged access review, security readiness.
- Priority: Required
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Master Data

- Domain purpose: govern shared reference records required by downstream domains.
- Topics: products, contacts, vendors, customers, categories, warehouses, bill of materials references.
- Subtopics: naming rules, ownership, required fields, data stewardship, classification structures.
- Checkpoint groups: core records, ownership, structure, readiness for downstream use.
- Priority: Required
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### CRM

- Domain purpose: govern lead and opportunity flow, sales pipeline structure, and commercial qualification.
- Topics: pipeline stages, lead handling, opportunity ownership, activities, teams.
- Subtopics: stage definitions, conversion policy, salesperson assignment, lost reason handling.
- Checkpoint groups: pipeline design, ownership, activity discipline, reporting readiness.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Sales

- Domain purpose: govern quotation-to-order flow and commercial execution policy.
- Topics: quotations, sales orders, pricing, order policy, invoicing triggers.
- Subtopics: quotation approval, price lists, discount authority, order confirmation rules, invoicing policy.
- Checkpoint groups: commercial policy, order control, pricing, invoicing linkage.
- Priority: Required
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Purchase

- Domain purpose: govern supplier procurement, purchasing control, and inbound commercial commitments.
- Topics: vendors, purchase orders, approval flow, replenishment dependencies, vendor terms.
- Subtopics: RFQ flow, approval thresholds, supplier selection, purchase control, billing linkage.
- Checkpoint groups: vendor policy, order control, approval design, finance linkage.
- Priority: Required
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Inventory

- Domain purpose: govern stock structure, movement control, warehouse policy, routes, valuation dependencies, and traceability.
- Topics: warehouses, locations, routes, operation types, units, valuation, replenishment.
- Subtopics: multi-step flows, delivery policy, receipt policy, internal transfers, lots and serials, counting policy.
- Checkpoint groups: warehouse design, movement policy, valuation dependencies, traceability, replenishment.
- Priority: Go-Live
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Manufacturing (MRP)

- Domain purpose: govern production execution, bills of materials, work orders, and manufacturing control.
- Topics: BOMs, work centers, routings, manufacturing orders, subcontracting.
- Subtopics: production mode, component consumption, backflush policy, routing strategy, work instructions.
- Checkpoint groups: production design, BOM governance, execution control, stock-finance dependencies.
- Priority: Go-Live
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### PLM

- Domain purpose: govern engineering change control linked to manufacturing structures.
- Topics: engineering changes, version control, approval flow, document linkage.
- Subtopics: ECO stages, approvers, BOM revision governance, release conditions.
- Checkpoint groups: change control, approval design, manufacturing linkage.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Accounting

- Domain purpose: govern fiscal setup, journals, invoicing policy, taxes, reconciliation, and financial control.
- Topics: chart of accounts, taxes, journals, invoicing, payments, reconciliation, valuation integration.
- Subtopics: fiscal position logic, invoice timing, payment terms, lock-date policy, accounting ownership.
- Checkpoint groups: fiscal setup, invoice policy, valuation linkage, control and close readiness.
- Priority: Go-Live
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### POS

- Domain purpose: govern point-of-sale execution, session policy, order handling, stock and accounting linkage.
- Topics: POS configuration, sessions, payment methods, receipts, invoicing, cash control.
- Subtopics: invoicing policy, offline expectations, cashier roles, stock decrement timing, journal linkage.
- Checkpoint groups: session control, cashier access, accounting linkage, customer handling.
- Priority: Go-Live
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Website / eCommerce

- Domain purpose: govern customer-facing digital commerce, catalog publication, checkout behavior, and order integration.
- Topics: website structure, eCommerce catalog, checkout, payments, shipping, content governance.
- Subtopics: product publication rules, payment provider policy, shipping methods, customer account behavior.
- Checkpoint groups: storefront policy, commerce flow, payment and fulfillment linkage.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Projects

- Domain purpose: govern project delivery structures, task flow, timesheets, and service execution tracking.
- Topics: projects, tasks, stages, timesheets, billing linkage, team ownership.
- Subtopics: task stages, time capture policy, customer visibility, service invoicing linkage.
- Checkpoint groups: project structure, execution policy, billing linkage, ownership.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### HR

- Domain purpose: govern employee records, organizational structure, and HR-related operational policies within supported functional scope.
- Topics: employees, departments, approvals linkage, attendance context, time off context.
- Subtopics: employee ownership, manager hierarchy, department structure, access boundaries.
- Checkpoint groups: employee structure, ownership, approval relationships.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Quality

- Domain purpose: govern quality control points, checks, and non-financial inspection flow across operations.
- Topics: quality points, checks, alerts, control criteria.
- Subtopics: check triggers, pass/fail handling, manufacturing linkage, inventory linkage.
- Checkpoint groups: control design, trigger rules, exception handling.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Maintenance

- Domain purpose: govern equipment maintenance planning and service execution for internal assets.
- Topics: equipment, preventive maintenance, maintenance teams, requests.
- Subtopics: asset hierarchy, maintenance schedule, responsibility assignment, downtime reporting.
- Checkpoint groups: asset structure, planning, ownership, execution policy.
- Priority: Optional
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Repairs

- Domain purpose: govern controlled repair workflows for repair operations as an official Odoo domain, not historical correction activity.
- Topics: repair orders, parts usage, approvals, billing linkage.
- Subtopics: intake policy, authorization, stock consumption, invoice policy.
- Checkpoint groups: repair process design, approval control, stock and billing linkage.
- Priority: Optional
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Documents

- Domain purpose: govern structured document storage, retrieval, and operational document workflows.
- Topics: workspaces, document rules, attachments, access, operational linkage.
- Subtopics: workspace ownership, tagging, approval-linked records, retention boundaries.
- Checkpoint groups: workspace governance, access control, operational linkage.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Safe

### Sign

- Domain purpose: govern signature workflows, signer roles, and document approval execution.
- Topics: templates, signer order, access control, signed-document handling.
- Subtopics: template ownership, required signers, approval sequence, record linkage.
- Checkpoint groups: template governance, signer control, record traceability.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Approvals

- Domain purpose: govern formal approval requests that sit outside individual module-specific approval rules.
- Topics: approval types, approvers, thresholds, traceability.
- Subtopics: approval categories, escalation path, owner assignment, evidence handling.
- Checkpoint groups: approval structure, authority control, traceability.
- Priority: Recommended
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Subscriptions

- Domain purpose: govern recurring revenue models, renewal policy, invoicing cadence, and customer lifecycle control.
- Topics: plans, renewals, recurring invoicing, amendments, customer notifications.
- Subtopics: billing cycle policy, renewals, upsell boundaries, cancellation handling.
- Checkpoint groups: recurring billing policy, lifecycle control, accounting linkage.
- Priority: Optional
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Rental

- Domain purpose: govern rental inventory, reservations, pricing periods, and return handling.
- Topics: rental products, periods, availability, pickup and return flow, billing.
- Subtopics: reservation rules, asset availability, return conditions, charge calculation.
- Checkpoint groups: rental policy, inventory linkage, billing linkage.
- Priority: Optional
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

### Field Service

- Domain purpose: govern on-site service execution, scheduling, task completion, and service-related inventory or billing linkage.
- Topics: field tasks, teams, dispatching, on-site materials, service reports.
- Subtopics: dispatch policy, mobile execution expectations, inventory usage, service invoicing linkage.
- Checkpoint groups: dispatch design, execution control, stock and billing linkage.
- Priority: Optional
- Validation source: Both
- Guidance required: Yes
- Training available: Yes
- Writes: Conditional

## Coverage Rules

- Every in-scope domain must be classified into checkpoint groups before operational rollout.
- Domain entries in this document are governance shells, not proof of exhaustive checkpoint completeness within that domain.
- Priority level may vary by project scope, but foundational dependency rules still apply.
- Guidance is required for any domain where decisions create meaningful downstream impact.
- Training availability may be broad, but training assignment remains opt-in by default unless the project owner requires it.
- A domain may only be marked `Safe` for writes when the changes are low-risk, forward-safe, and do not depend on unresolved checkpoints.
- No domain may be used as a back door for remediation or historical correction work.
- Cross-domain dependency rules remain enforceable even when domains are worked through separately in the interface.
