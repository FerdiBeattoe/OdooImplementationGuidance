# Discovery Question Framework

## Purpose

This framework defines every question asked during the Business Assessment stage of the
Implementation Master Map (Stage 2). Answers drive:

- business classification (which industry template applies)
- domain selection (which Odoo domains are in scope)
- module selection (which Odoo modules are required, recommended, or excluded)
- implementation sequencing (which domains are phase-1 vs deferred)

No domain decision may be made outside this framework. No AI inference may substitute
for a missing answer on any Required question. Unanswered Required questions block
progression to System Discovery (Stage 3).

---

## Section 1 — Business Model

### BM-01: Primary Business Nature

**Question:** What best describes what your business sells?

**Type:** Multiple choice (single select)

Options:
- Physical products only
- Services only
- Both physical products and services
- Software or digital products only
- Platform or marketplace (connecting buyers and sellers)

**Why this matters:** This is the highest-order classifier. It determines whether
inventory, manufacturing, and project/service domains are in scope at all. A
services-only business has no need for warehouse configuration. A products-only
business likely has no need for project billing.

**Downstream impact:**
- `Physical products only` → Inventory (Required), Sales, Purchase
- `Services only` → Projects, Timesheets, CRM; Inventory excluded unless spare parts tracked
- `Both` → All three tracks active; cross-domain invoicing policy required
- `Software/digital` → Sales, Subscriptions candidate; Inventory excluded
- `Platform/marketplace` → eCommerce, custom flow; escalate to project owner

**Required:** Yes

---

### BM-02: Multi-Entity Structure

**Question:** Does your business operate as more than one legal entity (separate companies
with separate tax registrations)?

**Type:** Boolean (Yes / No)

**Why this matters:** Multi-company in Odoo requires a different foundation setup path.
It affects chart of accounts scope, intercompany rule configuration, and whether a
shared or per-entity master data structure applies. Getting this wrong at foundation
stage forces a rebuild.

**Downstream impact:**
- `Yes` → Foundation: multi-company flag activated; intercompany rules in scope;
  separate localization packages per entity required; Users/Roles: cross-company access
  policy required
- `No` → Single-company foundation path; standard localization

**Required:** Yes

---

### BM-03: Primary Operating Country

**Question:** In which country is your primary business legally registered and operating?

**Type:** Text (country selector — validated against Odoo localization package list)

**Why this matters:** Determines which localization package is applied at foundation.
This directly sets the chart of accounts template, default tax configuration, fiscal
position baseline, and legal reporting requirements. It cannot be changed after
accounting entries are posted.

**Downstream impact:**
- Foundation: localization package selection (e.g., `l10n_au`, `l10n_gb`, `l10n_us`)
- Finance: chart of accounts template, tax rule baseline, bank statement format
- All domains: currency default

**Required:** Yes

---

### BM-04: Multi-Country or Multi-Currency Operations

**Question:** Do you transact with customers or suppliers in currencies other than your
primary operating currency?

**Type:** Boolean (Yes / No)

**Why this matters:** Multi-currency requires explicit activation in Odoo accounting and
changes how pricelists, invoices, payments, and bank reconciliation behave. If activated
after invoices are posted, currency revaluation history is incomplete.

**Downstream impact:**
- `Yes` → Finance: multi-currency activation required; exchange rate configuration;
  currency journals; fiscal position review
- `No` → Single-currency path; pricelists remain simplified

**Required:** Yes

---

### BM-05: Organization Size

**Question:** How many people will use Odoo (approximate total user count)?

**Type:** Numeric (integer)

**Why this matters:** Drives role matrix complexity in Users/Roles domain. A business
with 5 users needs minimal approval chain design. A business with 50+ users likely
needs formal segregation of duties, multi-level approvals, and team-based access
restrictions.

**Downstream impact:**
- `< 10` → Users/Roles: simplified role matrix; approval chains optional
- `10–50` → Users/Roles: structured role matrix; at least one approval layer required
- `> 50` → Users/Roles: formal segregation of duties; department-level access review;
  Approvals domain candidate

**Required:** Yes

---

## Section 2 — Revenue Model

### RM-01: Primary Revenue Mechanism

**Question:** How does your business primarily earn revenue? (Select all that apply)

**Type:** Multiple choice (multi-select)

Options:
- One-time product sales
- One-time service delivery
- Recurring subscriptions or contracts
- Project-based billing (time and materials or fixed price)
- Rental of assets or equipment
- Point-of-sale (retail, walk-in, or counter sales)
- Online store (customers place orders via a website)

**Why this matters:** Each revenue mechanism maps to a distinct Odoo domain. Selecting
the wrong set at this stage leads to missing modules or incorrectly sequenced
configuration. This question is the primary driver of the extended module scope.

**Downstream impact:**
- `One-time product sales` → Sales domain (Required)
- `One-time service delivery` → Sales with service product type; Projects candidate
- `Recurring subscriptions` → Subscriptions domain activated
- `Project-based billing` → Projects domain activated; Timesheets required
- `Rental` → Rental domain activated; Inventory linkage required
- `POS` → POS domain activated; Accounting linkage required
- `Online store` → Website/eCommerce domain activated; Payment provider required

**Required:** Yes

---

### RM-02: Time-Based Service Billing

**Question:** Do you bill customers based on hours worked or time spent on their account?

**Type:** Boolean (Yes / No)

**Why this matters:** Time-based billing requires the Timesheets module to be active and
linked to either Projects or Sales orders. Without this setup, time capture is
disconnected from invoicing, producing billing errors or untracked revenue.

**Downstream impact:**
- `Yes` → Projects domain: Timesheets activation required; invoice method on project
  must be set to `timesheet` or `milestone`; Sales: service product invoicing policy
  must align
- `No` → Timesheets excluded unless HR attendance-only use case applies

**Required:** Yes

---

### RM-03: Recurring Contract Billing

**Question:** Do any of your customers pay on a recurring schedule (monthly, quarterly,
annually) under a defined contract or plan?

**Type:** Boolean (Yes / No)

**Why this matters:** Recurring billing requires the Subscriptions module. Without it,
recurring contracts are manually managed in Sales, which produces missed renewals and
inconsistent invoicing timing. Subscriptions also affects how MRR is tracked in
reporting.

**Downstream impact:**
- `Yes` → Subscriptions domain activated; Finance: recurring journal policy review;
  Sales: renewal flow setup required
- `No` → Subscriptions excluded

**Required:** Yes

---

### RM-04: Asset or Equipment Rental

**Question:** Do you rent physical assets or equipment to customers for defined time
periods?

**Type:** Boolean (Yes / No)

**Why this matters:** Rental uses a distinct availability and return flow that is
separate from standard sales. Activating Sales for rental without the Rental module
leads to incorrect stock movements, missing return handling, and billing calculation
errors.

**Downstream impact:**
- `Yes` → Rental domain activated; Inventory: rental product availability tracking;
  Finance: rental billing period invoicing policy
- `No` → Rental excluded

**Required:** Yes

---

## Section 3 — Operations

### OP-01: Physical Inventory Tracking

**Question:** Do you physically store and track stock of products you buy, sell, or
manufacture?

**Type:** Boolean (Yes / No)

**Why this matters:** This activates or excludes the entire Inventory domain. If the
answer is No but products are sold, Odoo can operate in a storable-product-less mode
(consumables or services), but the warehouse structure is not needed. If Yes,
warehouse design, routes, and valuation all become required checkpoints.

**Downstream impact:**
- `Yes` → Inventory domain activated (Go-Live priority); warehouse setup required;
  valuation method question triggered (see FC-02)
- `No` → Inventory domain excluded; product type defaults to consumable or service

**Required:** Yes

---

### OP-02: Number of Warehouses

**Question:** How many physically distinct warehouse or stock locations do you operate?

**Type:** Numeric (integer)

**Condition:** Only asked if OP-01 = Yes

**Why this matters:** Multi-warehouse in Odoo requires explicit route configuration,
inter-warehouse transfer setup, and potentially separate procurement rules per
warehouse. A single-warehouse business has a significantly simpler inventory setup path.

**Downstream impact:**
- `1` → Inventory: single warehouse path; standard routes
- `2–5` → Inventory: multi-warehouse activation; inter-warehouse routes; replenishment
  rules per warehouse
- `> 5` → Inventory: advanced route design required; escalate to project owner before
  proceeding

**Required:** Yes (conditional on OP-01)

---

### OP-03: Retail or Walk-In Sales

**Question:** Do you sell directly to customers at a physical counter, till, or retail
point (where payment and handover happen at the same location)?

**Type:** Boolean (Yes / No)

**Why this matters:** Point-of-sale requires a separate configuration path from standard
Sales. POS sessions, cashier roles, cash control, payment method mapping, and
accounting journal linkage are all distinct setup items. Treating POS as just another
sales order flow leads to go-live failures.

**Downstream impact:**
- `Yes` → POS domain activated (Go-Live priority); Accounting: POS journal required;
  Users/Roles: cashier role required; Inventory: stock decrement timing for POS
- `No` → POS excluded

**Required:** Yes

---

### OP-04: Online Sales Channel

**Question:** Do customers place orders through a website or web shop that you operate?

**Type:** Boolean (Yes / No)

**Why this matters:** eCommerce introduces a customer-facing channel with its own
product publication rules, checkout flow, payment provider configuration, and shipping
integration. It cannot be bolted onto Sales post-go-live without disruption.

**Downstream impact:**
- `Yes` → Website/eCommerce domain activated; payment provider required; Sales: online
  order confirmation policy; Inventory: stock availability display policy
- `No` → Website/eCommerce excluded

**Required:** Yes

---

### OP-05: Field Service or On-Site Work

**Question:** Do you dispatch staff to perform work at customer sites, and do you need
to track or invoice those activities?

**Type:** Boolean (Yes / No)

**Why this matters:** Field service is a distinct operational and billing flow. Without
the Field Service domain, on-site task tracking, mobile execution, and parts-usage
invoicing require workarounds that produce audit gaps.

**Downstream impact:**
- `Yes` → Field Service domain activated; Inventory: on-site parts usage; Projects:
  field task linkage; Finance: field service invoicing policy
- `No` → Field Service excluded

**Required:** Yes

---

## Section 4 — Sales & CRM

### SC-01: Sales Pipeline Management

**Question:** Do your salespeople manage a defined pipeline of prospects and
opportunities before a sale is confirmed?

**Type:** Boolean (Yes / No)

**Why this matters:** If yes, the CRM module must be configured with pipeline stages,
team structure, and ownership rules before Sales is operational. If no, CRM can be
excluded and Sales operates without a lead-qualification step.

**Downstream impact:**
- `Yes` → CRM domain activated (Recommended priority); pipeline stage design required;
  Sales: opportunity-to-quotation flow enabled
- `No` → CRM excluded; Sales operates with direct quotation entry

**Required:** Yes

---

### SC-02: Quotation or Order Approval

**Question:** Do sales quotations or orders require internal approval (by a manager or
second user) before being confirmed or sent to the customer?

**Type:** Boolean (Yes / No)

**Why this matters:** If approval is required, the Sales approval setting must be
activated and approver roles must be defined in Users/Roles before the Sales domain can
exit its configuration checkpoints. Without this, orders can be confirmed without
oversight.

**Downstream impact:**
- `Yes` → Sales: order approval activation; Users/Roles: sales manager approver role
  required; Approvals domain: candidate for cross-domain approval consolidation
- `No` → Sales: direct confirmation flow; approval not configured

**Required:** Yes

---

### SC-03: Multiple Pricing Structures

**Question:** Do you apply different prices to different customers, customer groups, or
order quantities (e.g., retail price, wholesale price, volume discounts)?

**Type:** Boolean (Yes / No)

**Why this matters:** Multiple pricing requires Pricelists to be activated in Sales
settings. Without this, all customers see a single product price. Enabling pricelists
after invoices are created requires retroactive review of prior quotations.

**Downstream impact:**
- `Yes` → Sales: pricelists activation required; pricelist design becomes a
  configuration checkpoint
- `No` → Sales: single-price path

**Required:** Yes

---

### SC-04: Sales Discounting Authority

**Question:** Can salespeople apply discounts to sales lines, or is discounting
controlled by a manager?

**Type:** Multiple choice (single select)

Options:
- Salespeople can apply any discount freely
- Discounts require manager approval above a threshold
- Discounting is not permitted

**Why this matters:** Discount authority directly affects Users/Roles configuration and
the Sales approval threshold setup. Uncontrolled discounting without a defined policy
leads to margin leakage and audit findings.

**Downstream impact:**
- `Free discount` → Sales: discount column enabled; no approval chain needed
- `Manager approval above threshold` → Users/Roles: discount approver role; Sales:
  approval threshold configuration
- `Not permitted` → Sales: discount column hidden; policy enforced at setup

**Required:** Yes

---

## Section 5 — Procurement & Inventory

### PI-01: External Supplier Procurement

**Question:** Do you purchase goods or services from external suppliers using purchase
orders?

**Type:** Boolean (Yes / No)

**Why this matters:** Activates the Purchase domain. Without it, inbound stock
movements and supplier invoices cannot be properly governed. If the business only
manufactures internally from owned materials or only buys informally, the Purchase
domain scope changes.

**Downstream impact:**
- `Yes` → Purchase domain activated (Required priority); Finance: supplier invoice
  matching policy; Inventory: receipt flow
- `No` → Purchase excluded; inventory replenishment through manufacturing or manual
  adjustment only

**Required:** Yes

---

### PI-02: Purchase Order Approval

**Question:** Do purchase orders require approval before being sent to suppliers?

**Type:** Multiple choice (single select)

Options:
- No approval required — purchasers can confirm freely
- Approval required above a monetary threshold
- All purchase orders require manager approval

**Condition:** Only asked if PI-01 = Yes

**Why this matters:** Purchase approval thresholds are a core financial control. Without
them, uncommitted spend cannot be controlled. The approval level determines what
Users/Roles configuration is required.

**Downstream impact:**
- `No approval` → Purchase: no approval route needed
- `Threshold` → Purchase: approval threshold value must be configured; Users/Roles:
  purchase manager approver role required
- `All orders` → Users/Roles: purchase manager approver required; Purchase: all PO
  confirmation blocked until approved

**Required:** Yes (conditional on PI-01)

---

### PI-03: Goods Receipt Flow

**Question:** When goods arrive from suppliers, how do you receive them?

**Type:** Multiple choice (single select)

Options:
- Receive directly into stock (1 step)
- Receive into a dock/input area, then transfer to stock (2 steps)
- Receive into dock, quality check or sort, then put away (3 steps)

**Condition:** Only asked if PI-01 = Yes and OP-01 = Yes

**Why this matters:** This determines the Inventory incoming route configuration.
Getting this wrong forces a warehouse route rebuild. Three-step receiving also has
Quality domain implications.

**Downstream impact:**
- `1 step` → Inventory: standard receipt route
- `2 steps` → Inventory: input location and stock transfer route
- `3 steps` → Inventory: input → quality/control → stock route; Quality domain:
  candidate for receipt inspection point

**Required:** Yes (conditional on PI-01 and OP-01)

---

### PI-04: Inventory Traceability

**Question:** Do you need to track individual units or batches of products through their
lifecycle (from receipt to delivery)?

**Type:** Multiple choice (single select)

Options:
- No traceability needed
- Batch/lot tracking (groups of items)
- Serial number tracking (individual unit-level)
- Both lot and serial number tracking on different products

**Condition:** Only asked if OP-01 = Yes

**Why this matters:** Traceability method is set per product in Odoo and affects
receipts, deliveries, manufacturing components, and returns. It also drives Quality
domain inspection granularity and has Accounting implications for FIFO valuation.

**Downstream impact:**
- `None` → Inventory: standard product moves
- `Lot tracking` → Inventory: lot number activation; Quality: lot-level inspection
  candidate
- `Serial tracking` → Inventory: serial number activation; quality and warranty
  traceability required
- `Both` → Inventory: per-product traceability configuration required

**Required:** Yes (conditional on OP-01)

---

### PI-05: Drop-Shipping

**Question:** Do you ever ship products directly from your supplier to your customer
without the goods passing through your warehouse?

**Type:** Boolean (Yes / No)

**Why this matters:** Drop-shipping is a specific Odoo inventory route that must be
activated explicitly. Without it, a purchase order triggered by a sales order will
generate an incorrect internal receipt instead of a customer-direct delivery.

**Downstream impact:**
- `Yes` → Inventory: drop-ship route activation; Purchase: vendor-to-customer
  shipment flow; Sales: drop-ship order policy

**Required:** Yes

---

## Section 6 — Manufacturing (Conditional)

> This entire section is only presented if BM-01 includes physical products
> AND the user is not services-only. Individual questions have further conditions.

---

### MF-01: Manufacturing or Assembly Activity

**Question:** Does your business manufacture, assemble, kit, or produce any of the
products it sells (rather than only purchasing finished goods)?

**Type:** Boolean (Yes / No)

**Why this matters:** This is the gate question for the entire Manufacturing domain. If
No, MRP is excluded and all downstream manufacturing questions are skipped. If Yes,
MRP becomes a Go-Live domain and BOM governance, work center design, and
stock-accounting dependencies all activate.

**Downstream impact:**
- `Yes` → Manufacturing (MRP) domain activated (Go-Live priority); Inventory:
  production stock movements required; Finance: production costing and WIP policy
  required; all MF-0x questions activate
- `No` → Manufacturing domain excluded; skip to Finance Complexity section

**Required:** Yes (conditional on BM-01 including physical products)

---

### MF-02: Bill of Materials Complexity

**Question:** How complex are your Bills of Materials?

**Type:** Multiple choice (single select)

Options:
- Single-level (finished product made from raw materials only)
- Multi-level (components are themselves assembled from sub-components)
- Phantom/kitting only (no production order needed, just bundle packaging)

**Condition:** Only asked if MF-01 = Yes

**Why this matters:** Multi-level BOMs require a different MRP planning depth setting
and dramatically increase the complexity of production costing. Phantom BOMs are
handled differently (no manufacturing order required) and affect stock movement rules.

**Downstream impact:**
- `Single-level` → MRP: standard BOM; standard planning depth
- `Multi-level` → MRP: multi-level BOM activation; planning depth configuration
  required; Finance: WIP and semi-finished goods costing policy
- `Phantom` → MRP: kit product type; no manufacturing order required; Inventory:
  kit delivery flow

**Required:** Yes (conditional on MF-01)

---

### MF-03: Work Centers and Production Routing

**Question:** Do you track work time or machine time at specific production stations or
work centers?

**Type:** Boolean (Yes / No)

**Condition:** Only asked if MF-01 = Yes

**Why this matters:** Work centers and routings in Odoo add production capacity
tracking and time-based costing. Without them, manufacturing orders are simple
single-step operations. Activating them mid-implementation after BOMs are built
requires re-defining production structures.

**Downstream impact:**
- `Yes` → MRP: work centers activation; routings required; production costing includes
  labour/machine rates; Maintenance: equipment linkage candidate
- `No` → MRP: simple manufacturing order mode; no routing required

**Required:** Yes (conditional on MF-01)

---

### MF-04: Subcontracting

**Question:** Do you send materials to a third-party manufacturer or finisher who
returns completed goods to you?

**Type:** Boolean (Yes / No)

**Condition:** Only asked if MF-01 = Yes

**Why this matters:** Subcontracting is a distinct Odoo flow that uses a specific BOM
type and receipt route. Without this configured, subcontracted manufacturing shows up
incorrectly as a standard purchase or internal production.

**Downstream impact:**
- `Yes` → MRP: subcontracting BOM type activation; Purchase: subcontracting PO flow;
  Inventory: subcontractor location setup

**Required:** Yes (conditional on MF-01)

---

### MF-05: Engineering Change Control

**Question:** Are changes to your product structures (BOMs, components, versions)
subject to a formal approval process before being released to production?

**Type:** Boolean (Yes / No)

**Condition:** Only asked if MF-01 = Yes

**Why this matters:** Engineering change control requires the PLM module. Without PLM,
BOM changes take effect immediately with no audit trail or approval gate, which is a
compliance and quality risk in regulated or quality-certified environments.

**Downstream impact:**
- `Yes` → PLM domain activated (Recommended priority); MRP: ECO-gated BOM release;
  Users/Roles: ECO approver role required
- `No` → PLM excluded; BOM changes uncontrolled

**Required:** Yes (conditional on MF-01)

---

### MF-06: Quality Inspections

**Question:** Do you perform quality checks on incoming materials, during production,
or on finished goods before dispatch?

**Type:** Multiple choice (multi-select)

Options:
- On receipt from supplier
- During manufacturing (in-process inspection)
- On finished goods before dispatch
- None — quality is managed externally or not required in Odoo

**Condition:** Only asked if MF-01 = Yes or PI-03 = 3 steps

**Why this matters:** Each inspection trigger maps to a distinct Quality control point
in Odoo. Setting these up after production begins means past production has no
inspection record, affecting traceability and certification evidence.

**Downstream impact:**
- `Receipt` → Quality: receipt control point; linked to Inventory receipt operation
- `In-process` → Quality: production control point; MRP: quality check in work orders
- `Finished goods` → Quality: pre-delivery control point; Inventory: release to
  delivery blocked on quality pass
- `None` → Quality domain excluded

**Required:** Yes (conditional on MF-01 or PI-03 = 3 steps)

---

### MF-07: Equipment Maintenance

**Question:** Do you schedule and track preventive or corrective maintenance on
production equipment?

**Type:** Boolean (Yes / No)

**Condition:** Only asked if MF-03 = Yes (Work Centers active)

**Why this matters:** Maintenance in Odoo links to work centers and tracks equipment
downtime. Without it, maintenance is managed outside Odoo, which breaks capacity
planning accuracy. If work centers are active, unplanned downtime has no system
representation.

**Downstream impact:**
- `Yes` → Maintenance domain activated (Optional priority); MRP: equipment linked to
  work centers; maintenance schedule required
- `No` → Maintenance excluded

**Required:** Yes (conditional on MF-03)

---

## Section 7 — Finance Complexity

### FC-01: Accounting Depth

**Question:** How will your business use Odoo for financial management?

**Type:** Multiple choice (single select)

Options:
- Full accounting (general ledger, journals, reconciliation, reporting)
- Invoicing only (send invoices and track payments, no general ledger)
- Not using Odoo for financials (external accounting system)

**Why this matters:** This determines whether the full Accounting module or only
Invoicing is activated. The difference affects chart of accounts, journal setup,
reconciliation, tax reporting, and the valuation linkage to Inventory and
Manufacturing. Getting this wrong at foundation blocks financial go-live.

**Downstream impact:**
- `Full accounting` → Finance domain activated (Go-Live priority); Chart of accounts
  required; fiscal year setup required; all Finance domain checkpoints active
- `Invoicing only` → Finance: invoicing module only; no CoA or journal required;
  Inventory: valuation method limited
- `External` → Finance domain excluded from platform scope; integration boundary
  must be documented

**Required:** Yes

---

### FC-02: Inventory Valuation Method

**Question:** What method do you use to value your inventory?

**Type:** Multiple choice (single select)

Options:
- Standard Price (fixed cost per product)
- Average Cost — AVCO (cost updated on each receipt)
- First In First Out — FIFO (cost follows the oldest receipt price)
- Not applicable (services business or no stock tracking)

**Condition:** Only asked if OP-01 = Yes and FC-01 = Full accounting

**Why this matters:** This is one of the most critical cross-domain decisions in an
Odoo implementation. The valuation method affects how stock moves are journalized,
how COGS is calculated, and which accounting checkpoints must be completed before
Inventory go-live. FIFO and AVCO require perpetual valuation (automated accounting
entries); Standard Price can use periodic valuation. This cannot be changed after
stock moves are posted.

**Downstream impact:**
- `Standard Price` → Finance: standard cost journals; Inventory: manual cost update
  policy
- `AVCO` → Finance: perpetual valuation required; stock input/output accounts must
  be configured before first receipt
- `FIFO` → Finance: perpetual valuation required; lot traceability candidate;
  stock accounts required; CRITICAL: Inventory go-live blocked until Finance
  valuation checkpoints pass

**Required:** Yes (conditional on OP-01 and FC-01)

---

### FC-03: Three-Way Invoice Matching

**Question:** Do you require purchase orders, goods receipts, and supplier invoices to
be formally matched before a supplier invoice is approved for payment?

**Type:** Boolean (Yes / No)

**Condition:** Only asked if PI-01 = Yes and FC-01 = Full accounting

**Why this matters:** Three-way matching (PO → Receipt → Invoice) is a financial
control that prevents payment for unordered or unreceived goods. Without it,
supplier invoices can be posted and paid without a corresponding purchase order or
receipt, which is a procurement governance failure.

**Downstream impact:**
- `Yes` → Purchase: billing policy set to `Based on receipts`; Finance: supplier
  invoice matching control enabled; Users/Roles: accounts payable role required
- `No` → Purchase: billing policy set to `Based on purchase order`

**Required:** Yes (conditional on PI-01 and FC-01)

---

### FC-04: Non-Calendar Fiscal Year

**Question:** Does your fiscal year end on a date other than 31 December?

**Type:** Boolean (Yes / No)

**Why this matters:** If the fiscal year differs from the calendar year, Odoo's fiscal
year configuration must be set before any accounting entries are posted. If set
incorrectly, lock dates, period closings, and tax reporting periods will all be
misaligned.

**Downstream impact:**
- `Yes` → Finance: fiscal year end date required as configuration input; tax period
  alignment review required
- `No` → Finance: calendar-year defaults apply

**Required:** Yes

---

### FC-05: Analytic Accounting

**Question:** Do you need to track revenues and costs against projects, departments,
cost centres, or campaigns separately from your main chart of accounts?

**Type:** Boolean (Yes / No)

**Why this matters:** Analytic accounting (analytic accounts and plans) must be
activated before operational transactions begin, as it cannot be back-populated.
It is required for project billing reconciliation, department cost reporting, and
grant or campaign-based financial tracking.

**Downstream impact:**
- `Yes` → Finance: analytic accounting activation; analytic plan structure required;
  Projects: analytic account per project; Sales/Purchase: analytic distribution on
  lines
- `No` → Analytic accounting excluded

**Required:** Yes

---

### FC-06: Payment Terms and Collection Policy

**Question:** Do you offer customers defined payment terms (e.g., Net 30, 50% upfront)?

**Type:** Boolean (Yes / No)

**Why this matters:** Payment terms must be defined before invoices are issued.
Retroactive assignment of payment terms to existing invoices is not supported.
This also affects aged receivables reporting and dunning policy.

**Downstream impact:**
- `Yes` → Finance: payment terms configuration required before Sales go-live;
  Sales: default customer payment terms linkage
- `No` → Finance: immediate payment default

**Required:** Yes

---

## Section 8 — Team & Access Structure

### TA-01: Role Separation Requirements

**Question:** Which of the following roles need to be separated so that different people
have different access in Odoo? (Select all that apply)

**Type:** Multiple choice (multi-select)

Options:
- Salespeople vs. Sales Managers
- Purchasers vs. Purchase Managers
- Warehouse Operators vs. Inventory Managers
- Accounts Payable vs. Accounts Receivable vs. Finance Managers
- Production Operators vs. Manufacturing Managers
- HR Officers vs. HR Managers
- System Administrator (separate from all operational roles)

**Why this matters:** Each selected separation maps to a specific Odoo access group
configuration. Failing to design role separation before user creation leads to
overprivileged accounts that must be audited and corrected post-go-live.

**Downstream impact:**
- Each selection activates a corresponding role design checkpoint in Users/Roles domain
- `System Administrator` selection → admin user setup is treated as a standalone
  privileged access checkpoint

**Required:** Yes

---

### TA-02: Cross-Department Data Visibility

**Question:** Do any departments or teams need to be restricted from seeing each
other's records (e.g., sales team A cannot see sales team B's pipeline)?

**Type:** Boolean (Yes / No)

**Why this matters:** Multi-team data visibility restrictions require team-based record
rules in CRM, Sales, and other domains. Without this configured before users are
onboarded, restricted users will have seen data they should not, creating a security
remediation requirement.

**Downstream impact:**
- `Yes` → Users/Roles: team-based record rule design required; CRM: team-owned
  pipeline records; Sales: team-based order visibility
- `No` → Standard visibility applies; no team-level record rules required

**Required:** Yes

---

### TA-03: Approval Chain Requirements

**Question:** Beyond sales and purchase approvals already asked, are there other
operational actions that require a formal second approval before execution?

**Type:** Multiple choice (multi-select)

Options:
- Inventory adjustments above a threshold
- Expenses above a threshold
- Manufacturing order creation or close
- HR leave requests
- Contract or document signing
- None — standard module approvals are sufficient

**Why this matters:** Cross-domain approvals that span multiple Odoo modules are best
handled by the Approvals module rather than ad-hoc per-module settings. Identifying
all required approval chains before role design begins prevents approval gaps and
duplicated permission workarounds.

**Downstream impact:**
- Any non-None selection → Approvals domain activated (Recommended priority);
  Users/Roles: approver role assignment per category; each selected category becomes
  an Approvals configuration checkpoint

**Required:** Yes

---

### TA-04: System Administrator Identity

**Question:** Who is the designated Odoo system administrator (the person responsible
for user management, settings access, and module activation)?

**Type:** Text (name and role/title)

**Why this matters:** Odoo's admin user has unrestricted access to all settings.
Assigning it to an operational user (e.g., a salesperson) creates a segregation of
duties failure. This person must be identified before user creation begins so the
admin account is not used as a shared operational login.

**Downstream impact:**
- Users/Roles: admin user setup is a Required checkpoint; admin user must be separated
  from all domain-operational user accounts
- Foundation: admin credentials are implementation-wide context, not a personal
  account

**Required:** Yes

---

## Framework Rules

1. Every Required question must be answered before Business Assessment (Stage 2) can
   exit. Unanswered Required questions are hard blockers.

2. Conditional questions are only presented when their stated condition is met. They
   are Required within that condition — they may not be skipped once triggered.

3. No domain may be activated or excluded based on inference. Each domain activation
   must trace to at least one answered question in this framework.

4. No domain may be added to project scope after Business Assessment exits without
   a formal scope change that re-runs the affected questions and re-validates
   downstream impacts.

5. Answers to this framework are stored as the project's business profile record.
   They are read-only after Business Assessment exits unless a scope change event
   is raised.

6. The implementation sequence (domain ordering) is derived from the answer set using
   the sequencing rules in the Implementation Master Map. This framework does not
   define that sequence — it only provides the inputs.

7. Questions BM-03, FC-02, and MF-01 produce irreversible downstream configuration
   decisions. They must be confirmed by the project owner, not assumed from a
   single user response.

---

**Framework Version:** 1.0
**Governing Stage:** Business Assessment (Stage 2 of Implementation Master Map)
**Authority:** Subordinate to `docs/03_Implementation_Master_Map.md` and
`docs/04_Domain_Coverage_Map.md`. In any conflict, those documents win.
