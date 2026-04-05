# Domain Activation Engine

## Purpose

This document defines the deterministic rules that convert Discovery Question Framework
answers into domain activation decisions. It is the bridge between Business Assessment
(Stage 2) and all downstream implementation stages.

Every domain listed in the Domain Coverage Map (`docs/04_Domain_Coverage_Map.md`) has
an entry here. No domain may be activated, excluded, prioritized, blocked, or deferred
outside of these rules.

## Governing Constraints

1. A domain is **Activated** only when its explicit activation conditions are met by
   answered questions. No domain may be activated by inference, assumption, or AI
   recommendation.

2. A domain is **Excluded** when its activation conditions are not met. Excluded
   domains are removed from the project scope. They cannot receive checkpoints, setup
   steps, or configuration actions.

3. **Priority** (Required / Go-Live / Recommended / Optional) determines the urgency
   of completing the domain. Priority is set by rules, not negotiation.

4. **Blocking Conditions** prevent a domain from beginning its setup. A blocked domain
   is visible in scope but cannot start until blockers are resolved.

5. **Deferment Conditions** allow a domain to be moved to Phase 2 or later. A deferred
   domain remains in scope but exits the current implementation phase.

6. **Dependencies** are other domains that must complete their required checkpoints
   before this domain can begin or complete its own checkpoints.

---

## Engine Rules

### Precedence

When multiple rules affect the same domain, apply in this order:
1. Blocking conditions (highest — a blocked domain cannot proceed regardless of priority)
2. Activation rules (a domain must be activated before priority applies)
3. Priority rules (set the urgency level)
4. Deferment conditions (lowest — deferment is only valid after activation)

### Priority Definitions

- **Required**: Must be completed before any operational domain can begin. Foundation-layer.
- **Go-Live**: Must be completed before the system can be used in production for that
  functional area.
- **Recommended**: Should be completed for controlled rollout. May be deferred to Phase 2
  with project owner approval.
- **Optional**: Useful but not required. May be excluded without affecting other domains.

---

## Domain: Foundation / Company / Localization

**Domain ID:** `foundation`

### Activation Rules

Always activated. This domain is unconditionally required for every project.

### Priority Rules

**Required** — always.

### Blocking Conditions

None. This is the first domain in every implementation.

### Deferment Conditions

Cannot be deferred. Must complete before any other domain begins.

### Dependencies

None.

### Question Linkage

| Question | Effect |
|---|---|
| BM-02 | `Yes` → multi-company foundation path; `No` → single-company path |
| BM-03 | Answer determines localization package (e.g., `l10n_au`, `l10n_us`) |
| BM-04 | `Yes` → multi-currency activation flag set at foundation |
| FC-04 | `Yes` → fiscal year end date recorded as foundation input |

---

## Domain: Users / Roles / Security

**Domain ID:** `users_roles`

### Activation Rules

Always activated. This domain is unconditionally required for every project.

### Priority Rules

**Required** — always.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.

### Deferment Conditions

Cannot be deferred. Must complete before any domain requiring approvals or role-based
access can begin.

### Dependencies

- Foundation (must complete first)

### Question Linkage

| Question | Effect |
|---|---|
| BM-05 | `< 10` → simplified role matrix; `10–50` → structured role matrix with at least one approval layer; `> 50` → formal segregation of duties, department-level access review |
| SC-02 | `Yes` → sales manager approver role required |
| SC-04 | `Manager approval above threshold` → discount approver role required |
| PI-02 | `Threshold` or `All orders` → purchase manager approver role required |
| FC-03 | `Yes` → accounts payable role required |
| MF-05 | `Yes` → ECO approver role required |
| TA-01 | Each selected separation → corresponding role design checkpoint activated |
| TA-02 | `Yes` → team-based record rule design checkpoint activated |
| TA-03 | Any non-None → approver role assignment per selected category |
| TA-04 | Always → admin user setup checkpoint activated |

---

## Domain: Master Data

**Domain ID:** `master_data`

### Activation Rules

Always activated. This domain is unconditionally required for every project.

### Priority Rules

**Required** — always.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints where access affects data stewardship.

### Deferment Conditions

Cannot be deferred. Must complete before any operational or finance domain can begin.

### Dependencies

- Foundation (must complete first)
- Users / Roles / Security (must complete first)

### Question Linkage

| Question | Effect |
|---|---|
| BM-01 | Determines which master data types are required: `Physical products` → storable products, categories, UoM; `Services only` → service products, categories; `Both` → full product type range |
| OP-01 | `Yes` → warehouse records and stock location hierarchy are master data prerequisites |
| PI-01 | `Yes` → vendor records required as master data |
| SC-01 | `Yes` → customer records with CRM-linked classification required |

---

## Domain: CRM

**Domain ID:** `crm`

### Activation Rules

Activated when **ALL** of the following are true:
- SC-01 = `Yes`

### Priority Rules

**Recommended** — default when activated.

Elevated to **Go-Live** when:
- RM-01 includes `One-time product sales` OR `One-time service delivery`
- AND BM-05 >= 10 (structured sales team expected)

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints (team ownership and salesperson roles must be defined).
- **Blocked until:** Master Data domain has completed its required checkpoints
  (contact records must be structurally defined).

### Deferment Conditions

May be deferred to Phase 2 when:
- SC-01 = `Yes` but project owner explicitly classifies CRM as non-critical for
  initial go-live.
- Deferment requires project owner sign-off.
- If deferred, Sales operates with direct quotation entry (no pipeline).

### Dependencies

- Foundation
- Users / Roles / Security
- Master Data

### Question Linkage

| Question | Effect |
|---|---|
| SC-01 | `Yes` → domain activated; `No` → domain excluded |
| TA-02 | `Yes` → team-based pipeline ownership record rules applied |

---

## Domain: Sales

**Domain ID:** `sales`

### Activation Rules

Activated when **ANY** of the following are true:
- RM-01 includes `One-time product sales`
- RM-01 includes `One-time service delivery`
- RM-01 includes `Online store` (eCommerce requires Sales as upstream)
- RM-01 includes `Recurring subscriptions` (Subscriptions depends on Sales)
- RM-01 includes `Rental` (Rental depends on Sales)
- PI-05 = `Yes` (drop-ship requires Sales-to-Purchase linkage)

If none of the above are true AND BM-01 is not `Platform/marketplace`, Sales is
excluded.

### Priority Rules

**Required** — always when activated.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints.
- **Blocked until:** Master Data domain has completed its required checkpoints
  (products and contacts must exist).
- **Blocked until:** Finance domain has completed payment terms checkpoints, if
  FC-06 = `Yes`.

### Deferment Conditions

Cannot be deferred when activated. Sales is a core operational domain.

### Dependencies

- Foundation
- Users / Roles / Security
- Master Data
- Finance (partial — payment terms and invoicing policy checkpoints only)
- CRM (if CRM is activated, CRM pipeline design should complete before Sales
  quotation flow is finalized, but this is a soft dependency — Sales can begin
  in parallel)

### Question Linkage

| Question | Effect |
|---|---|
| RM-01 | Multiple selections activate Sales (see activation rules) |
| SC-02 | `Yes` → order approval setting activated; links to Users/Roles |
| SC-03 | `Yes` → pricelists feature activated |
| SC-04 | Sets discount policy configuration |
| FC-06 | `Yes` → payment terms must be configured before Sales go-live |
| PI-05 | `Yes` → drop-ship order policy configured in Sales |

---

## Domain: Purchase

**Domain ID:** `purchase`

### Activation Rules

Activated when **ANY** of the following are true:
- PI-01 = `Yes`
- MF-04 = `Yes` (subcontracting requires Purchase for vendor PO flow)
- PI-05 = `Yes` (drop-ship requires Purchase for vendor procurement)

### Priority Rules

**Required** — always when activated.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints.
- **Blocked until:** Master Data domain has completed its required checkpoints
  (vendor records must exist).
- **Blocked until:** Finance domain has completed its billing policy checkpoints,
  if FC-03 = `Yes` (three-way matching requires accounting configuration).

### Deferment Conditions

Cannot be deferred when activated. Purchase is a core operational domain.

### Dependencies

- Foundation
- Users / Roles / Security
- Master Data
- Finance (partial — billing policy and supplier invoice matching checkpoints)

### Question Linkage

| Question | Effect |
|---|---|
| PI-01 | `Yes` → domain activated |
| PI-02 | Sets approval threshold or approval-required policy |
| FC-03 | `Yes` → billing policy set to `Based on receipts`; `No` → `Based on PO` |
| MF-04 | `Yes` → subcontracting PO flow activated |
| PI-05 | `Yes` → drop-ship procurement flow activated |

---

## Domain: Inventory

**Domain ID:** `inventory`

### Activation Rules

Activated when **ANY** of the following are true:
- OP-01 = `Yes`
- RM-04 = `Yes` (rental requires stock tracking)
- MF-01 = `Yes` (manufacturing requires production stock movements)

### Priority Rules

**Go-Live** — always when activated.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints.
- **Blocked until:** Master Data domain has completed its required checkpoints.
- **CRITICAL — Blocked until:** Finance domain has completed its valuation method
  checkpoints (stock input/output account configuration), when FC-02 = `AVCO` or
  `FIFO`. This is enforced because perpetual valuation creates automatic journal
  entries on every stock move — those journal entries require configured stock
  accounts. Inventory go-live without this produces unposted or incorrectly posted
  accounting entries.
- **Blocked until:** Finance domain has completed its valuation method checkpoints,
  when FC-01 = `Full accounting` and OP-01 = `Yes`. Even Standard Price valuation
  requires stock journal configuration if full accounting is active.

### Deferment Conditions

Cannot be deferred when activated. Inventory is a Go-Live domain and blocks
Manufacturing, POS, and Rental.

### Dependencies

- Foundation
- Users / Roles / Security
- Master Data
- Finance (valuation checkpoints — hard dependency per FC-02 answer)

### Question Linkage

| Question | Effect |
|---|---|
| OP-01 | `Yes` → domain activated |
| OP-02 | `1` → single warehouse; `2–5` → multi-warehouse routes; `> 5` → escalate |
| PI-03 | `1 step` / `2 steps` / `3 steps` → incoming route configuration |
| PI-04 | Sets traceability mode (none / lot / serial / both) |
| PI-05 | `Yes` → drop-ship route activated |
| FC-02 | Sets valuation method; `AVCO` or `FIFO` → perpetual valuation required, hard Finance blocker |
| MF-01 | `Yes` → production stock movements required |
| RM-04 | `Yes` → rental product availability tracking required |

---

## Domain: Manufacturing (MRP)

**Domain ID:** `manufacturing`

### Activation Rules

Activated when **ALL** of the following are true:
- MF-01 = `Yes`

MF-01 is only asked when BM-01 is NOT `Services only` and NOT `Software or digital
products only`. If MF-01 is never asked, Manufacturing is excluded.

**This is a hard gate. No other question can activate Manufacturing.**

### Priority Rules

**Go-Live** — always when activated.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints.
- **Blocked until:** Master Data domain has completed its required checkpoints
  (products and BOM components must be structurally defined).
- **Blocked until:** Inventory domain has completed its required checkpoints
  (production stock locations, routes, and operation types must exist).
- **Blocked until:** Finance domain has completed its production costing checkpoints,
  when FC-01 = `Full accounting`. Manufacturing costing and WIP journal entries
  require configured accounts.

### Deferment Conditions

May be deferred to Phase 2 when:
- MF-01 = `Yes` but project owner explicitly classifies manufacturing as a Phase 2
  activity.
- Deferment requires project owner sign-off.
- If deferred: Sales operates with purchased finished goods only; Inventory operates
  without production routes.

### Dependencies

- Foundation
- Users / Roles / Security
- Master Data
- Inventory (must complete warehouse and route setup)
- Finance (production costing checkpoints, when FC-01 = `Full accounting`)

### Question Linkage

| Question | Effect |
|---|---|
| MF-01 | `Yes` → domain activated; `No` → domain excluded (hard gate) |
| MF-02 | `Single-level` → standard BOM; `Multi-level` → multi-level BOM + planning depth; `Phantom` → kit product type |
| MF-03 | `Yes` → work centers and routings activated |
| MF-04 | `Yes` → subcontracting BOM type activated |

---

## Domain: PLM

**Domain ID:** `plm`

### Activation Rules

Activated when **ALL** of the following are true:
- MF-01 = `Yes` (Manufacturing must be active)
- MF-05 = `Yes`

### Priority Rules

**Recommended** — default when activated.

### Blocking Conditions

- **Blocked until:** Manufacturing domain has completed its BOM governance checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its ECO approver
  role checkpoint.

### Deferment Conditions

May be deferred to Phase 2 when:
- Project owner approves deferment.
- If deferred: BOM changes proceed without formal ECO approval workflow.
  Project owner must acknowledge this reduces change control.

### Dependencies

- Manufacturing (BOM structure must exist before ECO flow is configured)
- Users / Roles / Security (ECO approver role)

### Question Linkage

| Question | Effect |
|---|---|
| MF-05 | `Yes` → domain activated; `No` → domain excluded |
| MF-01 | Must be `Yes` for MF-05 to be asked |

---

## Domain: Accounting

**Domain ID:** `accounting`

### Activation Rules

Activated when **ANY** of the following are true:
- FC-01 = `Full accounting`
- FC-01 = `Invoicing only` (activates invoicing-only subset of this domain)

Excluded when:
- FC-01 = `Not using Odoo for financials`

### Priority Rules

**Go-Live** — when FC-01 = `Full accounting`.

**Recommended** — when FC-01 = `Invoicing only` (reduced scope, but still required
before invoice-generating domains can go live).

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints
  (localization package determines CoA template and tax baseline).

### Deferment Conditions

When FC-01 = `Full accounting`:
- Cannot be deferred. Finance is a Go-Live domain and blocks Inventory, Manufacturing,
  and POS.

When FC-01 = `Invoicing only`:
- Cannot be deferred if any invoice-generating domain (Sales, POS, Subscriptions) is
  activated.

### Dependencies

- Foundation (localization, fiscal year)
- Master Data (partial — products must be structurally defined for invoicing)

### Blocking Effect on Other Domains

**Accounting blocks the following domains when its required checkpoints are incomplete:**

| Blocked Domain | Condition | Specific Checkpoints Required |
|---|---|---|
| Inventory | FC-01 = `Full accounting` AND OP-01 = `Yes` | Stock valuation accounts, stock journals, valuation method configuration |
| Manufacturing | FC-01 = `Full accounting` AND MF-01 = `Yes` | Production costing accounts, WIP journal (if multi-level BOM) |
| POS | FC-01 = `Full accounting` AND OP-03 = `Yes` | POS journal, POS payment method accounting linkage |
| Purchase | FC-03 = `Yes` | Supplier invoice matching policy, AP account configuration |

### Question Linkage

| Question | Effect |
|---|---|
| FC-01 | `Full accounting` → full domain activated; `Invoicing only` → invoicing subset activated; `External` → domain excluded |
| FC-02 | Sets valuation method; `AVCO` / `FIFO` → perpetual valuation checkpoints required |
| FC-03 | `Yes` → three-way matching control enabled |
| FC-04 | `Yes` → non-calendar fiscal year configuration required |
| FC-05 | `Yes` → analytic accounting feature activated |
| FC-06 | `Yes` → payment terms configuration required |
| BM-03 | Determines CoA template and tax baseline via localization package |
| BM-04 | `Yes` → multi-currency activation |

---

## Domain: POS

**Domain ID:** `pos`

### Activation Rules

Activated when **ANY** of the following are true:
- OP-03 = `Yes`
- RM-01 includes `Point-of-sale`

### Priority Rules

**Go-Live** — always when activated.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints (cashier role must be defined).
- **CRITICAL — Blocked until:** Accounting domain has completed its POS-specific
  checkpoints (POS journal configuration, POS payment method accounting linkage),
  when FC-01 = `Full accounting`.
- **Blocked until:** Inventory domain has completed its stock decrement configuration,
  when OP-01 = `Yes` (POS must know when and how to decrement stock).

### Deferment Conditions

May be deferred to Phase 2 when:
- Project owner classifies POS as a later-phase rollout.
- Deferment requires project owner sign-off.
- If deferred: retail sales are not processed through Odoo until POS is configured.

### Dependencies

- Foundation
- Users / Roles / Security (cashier role)
- Accounting (POS journal and payment linkage, when FC-01 = `Full accounting`)
- Inventory (stock decrement policy, when OP-01 = `Yes`)

### Question Linkage

| Question | Effect |
|---|---|
| OP-03 | `Yes` → domain activated |
| RM-01 | `Point-of-sale` → domain activated |
| FC-01 | `Full accounting` → POS accounting linkage checkpoints apply |
| OP-01 | `Yes` → POS-to-Inventory stock decrement linkage required |

---

## Domain: Website / eCommerce

**Domain ID:** `website_ecommerce`

### Activation Rules

Activated when **ANY** of the following are true:
- OP-04 = `Yes`
- RM-01 includes `Online store`

### Priority Rules

**Recommended** — default when activated.

Elevated to **Go-Live** when:
- RM-01 includes `Online store` AND no other revenue mechanism is selected
  (eCommerce is the sole sales channel).

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Sales domain has completed its product and pricing checkpoints
  (products, pricelists, and payment terms must be configured before publishing a
  web shop).
- **Blocked until:** Inventory domain has completed its stock availability policy,
  when OP-01 = `Yes` (web shop must know whether to show stock quantities).

### Deferment Conditions

May be deferred to Phase 2 when:
- RM-01 includes at least one non-`Online store` revenue mechanism.
- If deferred: online sales channel is not available until configured.

### Dependencies

- Foundation
- Sales (product and pricing setup)
- Inventory (stock availability display policy, when OP-01 = `Yes`)
- Accounting (payment provider configuration, when FC-01 = `Full accounting`)

### Question Linkage

| Question | Effect |
|---|---|
| OP-04 | `Yes` → domain activated |
| RM-01 | `Online store` → domain activated |

---

## Domain: Projects

**Domain ID:** `projects`

### Activation Rules

Activated when **ANY** of the following are true:
- RM-01 includes `Project-based billing`
- RM-02 = `Yes` (time-based billing requires Projects + Timesheets)
- OP-05 = `Yes` (Field Service depends on Projects for task structure)

### Priority Rules

**Recommended** — default when activated.

Elevated to **Go-Live** when:
- BM-01 = `Services only` (Projects is the primary operational domain).

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints.
- **Blocked until:** Sales domain has completed its service product checkpoints,
  when RM-02 = `Yes` (service invoicing policy must align between Sales and Projects).

### Deferment Conditions

May be deferred to Phase 2 when:
- BM-01 is NOT `Services only` (Projects is not the primary domain).
- If deferred: service delivery and time-based billing are not tracked in Odoo.

### Dependencies

- Foundation
- Users / Roles / Security
- Sales (service product invoicing policy, when RM-02 = `Yes`)
- Finance (analytic accounting, when FC-05 = `Yes`)

### Question Linkage

| Question | Effect |
|---|---|
| RM-01 | `Project-based billing` → domain activated |
| RM-02 | `Yes` → domain activated with Timesheets |
| OP-05 | `Yes` → domain activated as Field Service dependency |
| FC-05 | `Yes` → analytic account per project required |

---

## Domain: HR

**Domain ID:** `hr`

### Activation Rules

Activated when **ANY** of the following are true:
- BM-05 > 10 (organization size warrants employee records in Odoo)
- TA-03 includes `HR leave requests`
- RM-02 = `Yes` (time-based billing requires employee records for timesheet linkage)
- TA-01 includes `HR Officers vs. HR Managers`

### Priority Rules

**Recommended** — default when activated.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Users / Roles / Security domain has completed its required
  checkpoints (employee roles and manager hierarchy depend on access design).

### Deferment Conditions

May be deferred to Phase 2 when:
- HR is activated only by BM-05 > 10 and no other HR-dependent question triggered it.
- If deferred: employee records are not managed in Odoo; timesheet users must still
  be created as Odoo users.

### Dependencies

- Foundation
- Users / Roles / Security

### Question Linkage

| Question | Effect |
|---|---|
| BM-05 | `> 10` → domain candidate |
| TA-01 | `HR Officers vs. HR Managers` → domain activated |
| TA-03 | `HR leave requests` → domain activated |
| RM-02 | `Yes` → domain activated (employee records for timesheet users) |

---

## Domain: Quality

**Domain ID:** `quality`

### Activation Rules

Activated when **ANY** of the following are true:
- MF-06 includes any option other than `None`
- PI-03 = `3 steps` AND MF-06 includes `On receipt from supplier`

Excluded when:
- MF-06 = `None` (or MF-06 was never asked because neither MF-01 = `Yes` nor
  PI-03 = `3 steps`)

### Priority Rules

**Recommended** — default when activated.

### Blocking Conditions

- **Blocked until:** Inventory domain has completed its receipt operation configuration
  (Quality control points attach to operation types).
- **Blocked until:** Manufacturing domain has completed its work order configuration,
  when MF-06 includes `During manufacturing`.

### Deferment Conditions

May be deferred to Phase 2 when:
- Project owner approves deferment.
- If deferred: quality inspections are not tracked in Odoo; production and receipt
  proceed without system-enforced quality gates.

### Dependencies

- Inventory (operation types for control point attachment)
- Manufacturing (work order structure, when in-process inspection is selected)

### Question Linkage

| Question | Effect |
|---|---|
| MF-06 | `Receipt` → receipt control point; `In-process` → production control point; `Finished goods` → pre-delivery control point; `None` → domain excluded |
| PI-03 | `3 steps` → triggers MF-06 eligibility even without manufacturing |

---

## Domain: Maintenance

**Domain ID:** `maintenance`

### Activation Rules

Activated when **ALL** of the following are true:
- MF-03 = `Yes` (work centers must be active)
- MF-07 = `Yes`

### Priority Rules

**Optional** — always when activated.

### Blocking Conditions

- **Blocked until:** Manufacturing domain has completed its work center configuration
  (maintenance equipment links to work centers).

### Deferment Conditions

May be deferred to Phase 2 at any time. No other domain depends on Maintenance.

### Dependencies

- Manufacturing (work center structure)

### Question Linkage

| Question | Effect |
|---|---|
| MF-07 | `Yes` → domain activated; `No` → domain excluded |
| MF-03 | Must be `Yes` for MF-07 to be asked |

---

## Domain: Repairs

**Domain ID:** `repairs`

### Activation Rules

Activated when **ALL** of the following are true:
- OP-01 = `Yes` (physical inventory must be tracked — repairs consume stock)
- RM-01 includes `One-time service delivery` OR OP-05 = `Yes` (service or field
  service must be in scope for repair work to be relevant)

Note: Repairs is not directly triggered by a single discovery question. It activates
when the combination of stock tracking AND service delivery creates a context where
controlled repair workflows are operationally meaningful.

### Priority Rules

**Optional** — always when activated.

### Blocking Conditions

- **Blocked until:** Inventory domain has completed its stock location and operation
  type configuration (repair orders consume and produce stock).
- **Blocked until:** Sales domain has completed its invoicing policy configuration
  (repair invoicing must align with sales invoicing).

### Deferment Conditions

May be deferred to Phase 2 at any time. No other domain depends on Repairs.

### Dependencies

- Inventory (stock structure)
- Sales (invoicing policy)

### Question Linkage

| Question | Effect |
|---|---|
| OP-01 | Must be `Yes` (necessary condition) |
| RM-01 | Must include service delivery (necessary condition) |
| OP-05 | `Yes` → alternative activation path |

---

## Domain: Documents

**Domain ID:** `documents`

### Activation Rules

Activated when **ANY** of the following are true:
- MF-05 = `Yes` (PLM ECO workflow requires document control)
- TA-03 includes `Contract or document signing`
- BM-05 > 50 (large organizations benefit from structured document management)

### Priority Rules

**Recommended** — default when activated.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.

### Deferment Conditions

May be deferred to Phase 2 at any time. Documents is a supporting domain.

### Dependencies

- Foundation

### Question Linkage

| Question | Effect |
|---|---|
| MF-05 | `Yes` → domain activated (ECO document linkage) |
| TA-03 | `Contract or document signing` → domain activated |
| BM-05 | `> 50` → domain candidate |

---

## Domain: Sign

**Domain ID:** `sign`

### Activation Rules

Activated when **ANY** of the following are true:
- TA-03 includes `Contract or document signing`

### Priority Rules

**Recommended** — default when activated.

### Blocking Conditions

- **Blocked until:** Foundation domain has completed its required checkpoints.
- **Blocked until:** Documents domain has completed its workspace configuration,
  when Documents is also activated.

### Deferment Conditions

May be deferred to Phase 2 at any time. Sign is a supporting domain.

### Dependencies

- Foundation
- Documents (when both are activated)

### Question Linkage

| Question | Effect |
|---|---|
| TA-03 | `Contract or document signing` → domain activated |

---

## Domain: Approvals

**Domain ID:** `approvals`

### Activation Rules

Activated when **ANY** of the following are true:
- TA-03 includes any option other than `None`
- BM-05 > 50 AND any of the following are true:
  - SC-02 = `Yes`
  - PI-02 = `Threshold` or `All orders`
  - SC-04 = `Manager approval above threshold`

The second condition reflects that large organizations with multiple per-module
approval requirements benefit from centralized approval management.

### Priority Rules

**Recommended** — default when activated.

### Blocking Conditions

- **Blocked until:** Users / Roles / Security domain has completed its approver role
  assignments (each approval category needs an assigned approver).

### Deferment Conditions

May be deferred to Phase 2 when:
- Per-module approval settings (Sales approval, Purchase approval) are sufficient
  for Phase 1.
- If deferred: cross-domain approvals are managed within each module independently.

### Dependencies

- Users / Roles / Security (approver role assignments)

### Question Linkage

| Question | Effect |
|---|---|
| TA-03 | Any non-None selection → domain activated; specific selections determine approval categories |
| BM-05 | `> 50` → domain candidate when combined with module-level approvals |
| SC-02 | `Yes` → sales approval category candidate |
| PI-02 | `Threshold` or `All orders` → purchase approval category candidate |
| SC-04 | `Manager approval above threshold` → discount approval category candidate |

---

## Domain: Subscriptions

**Domain ID:** `subscriptions`

### Activation Rules

Activated when **ANY** of the following are true:
- RM-03 = `Yes`
- RM-01 includes `Recurring subscriptions or contracts`

### Priority Rules

**Optional** — default when activated.

Elevated to **Go-Live** when:
- RM-01 includes `Recurring subscriptions` AND no non-recurring revenue mechanism
  is selected (subscriptions are the sole revenue model).

### Blocking Conditions

- **Blocked until:** Sales domain has completed its product and invoicing policy
  checkpoints (subscriptions extend the Sales order model).
- **Blocked until:** Accounting domain has completed its recurring journal policy
  checkpoints, when FC-01 = `Full accounting`.

### Deferment Conditions

May be deferred to Phase 2 when:
- RM-01 includes at least one non-recurring revenue mechanism (the business can
  operate on one-time sales while subscriptions are configured).

### Dependencies

- Sales (product and invoicing policy)
- Accounting (recurring journal policy, when FC-01 = `Full accounting`)

### Question Linkage

| Question | Effect |
|---|---|
| RM-03 | `Yes` → domain activated |
| RM-01 | `Recurring subscriptions` → domain activated |

---

## Domain: Rental

**Domain ID:** `rental`

### Activation Rules

Activated when **ANY** of the following are true:
- RM-04 = `Yes`
- RM-01 includes `Rental of assets or equipment`

### Priority Rules

**Optional** — default when activated.

Elevated to **Go-Live** when:
- RM-01 includes `Rental` AND no non-rental revenue mechanism is selected
  (rental is the sole revenue model).

### Blocking Conditions

- **Blocked until:** Sales domain has completed its product checkpoints (rental
  extends the Sales order model).
- **Blocked until:** Inventory domain has completed its availability tracking
  configuration (rental requires stock availability and return flow).

### Deferment Conditions

May be deferred to Phase 2 when:
- RM-01 includes at least one non-rental revenue mechanism.

### Dependencies

- Sales (product setup)
- Inventory (availability and return tracking)

### Question Linkage

| Question | Effect |
|---|---|
| RM-04 | `Yes` → domain activated |
| RM-01 | `Rental of assets or equipment` → domain activated |

---

## Domain: Field Service

**Domain ID:** `field_service`

### Activation Rules

Activated when **ALL** of the following are true:
- OP-05 = `Yes`

### Priority Rules

**Optional** — default when activated.

Elevated to **Recommended** when:
- BM-01 = `Services only` OR BM-01 = `Both physical products and services`
  (field service is operationally relevant to the core business).

### Blocking Conditions

- **Blocked until:** Projects domain has completed its task structure configuration
  (field tasks are a specialized project task type).
- **Blocked until:** Inventory domain has completed its stock location configuration,
  when OP-01 = `Yes` (on-site parts usage requires stock tracking).

### Deferment Conditions

May be deferred to Phase 2 at any time.
- If deferred: on-site service work is not tracked in Odoo.

### Dependencies

- Projects (task structure)
- Inventory (when OP-01 = `Yes`, for on-site parts tracking)
- Sales (service invoicing, when RM-02 = `Yes`)

### Question Linkage

| Question | Effect |
|---|---|
| OP-05 | `Yes` → domain activated; `No` → domain excluded |

---

## Cross-Domain Blocking Matrix

This matrix summarizes which domains block which. Read as: "Row domain blocks Column
domain until Row's required checkpoints are complete."

```
                        Blocker (row blocks column's go-live)
                 FND  USR  MAS  CRM  SAL  PUR  INV  MRP  PLM  ACC  POS  WEB  PRJ  HR  QUA  MNT  REP  DOC  SGN  APR  SUB  RNT  FSV
Foundation  FND   -    X    X    X    X    X    X    X    .    X    X    X    X   X    .    .    .    X    X    .    .    .    .
Users/Roles USR   .    -    X    X    X    X    X    X    X    .    X    .    X   X    .    .    .    .    .    X    .    .    .
Master Data MAS   .    .    -    X    X    X    X    X    .    .    .    .    .   .    .    .    .    .    .    .    .    .    .
Accounting  ACC   .    .    .    .    .    *    *    *    .    -    *    .    .   .    .    .    .    .    .    .    *    .    .
Inventory   INV   .    .    .    .    .    .    -    .    .    .    *    *    .   .    X    X    X    .    .    .    .    X    *
Manufactur. MRP   .    .    .    .    .    .    .    -    X    .    .    .    .   .    *    X    .    .    .    .    .    .    .
Sales       SAL   .    .    .    .    -    .    .    .    .    .    .    X    *   .    .    .    X    .    .    .    X    X    .
Projects    PRJ   .    .    .    .    .    .    .    .    .    .    .    .    -   .    .    .    .    .    .    .    .    .    X
Documents   DOC   .    .    .    .    .    .    .    .    .    .    .    .    .   .    .    .    .    -    *    .    .    .    .

Legend: X = always blocks when both active
        * = conditionally blocks (see domain-specific rules)
        . = no blocking relationship
```

---

## Activation Summary Table

| Domain | Primary Trigger Questions | Activation Type |
|---|---|---|
| Foundation | Always | Unconditional |
| Users / Roles / Security | Always | Unconditional |
| Master Data | Always | Unconditional |
| CRM | SC-01 | Conditional |
| Sales | RM-01, PI-05 | Conditional |
| Purchase | PI-01, MF-04, PI-05 | Conditional |
| Inventory | OP-01, RM-04, MF-01 | Conditional |
| Manufacturing (MRP) | MF-01 (hard gate) | Conditional |
| PLM | MF-05 (requires MF-01) | Conditional |
| Accounting | FC-01 | Conditional |
| POS | OP-03, RM-01 | Conditional |
| Website / eCommerce | OP-04, RM-01 | Conditional |
| Projects | RM-01, RM-02, OP-05 | Conditional |
| HR | BM-05, TA-01, TA-03, RM-02 | Conditional |
| Quality | MF-06, PI-03 | Conditional |
| Maintenance | MF-07 (requires MF-03) | Conditional |
| Repairs | OP-01 + (RM-01 or OP-05) | Conditional (compound) |
| Documents | MF-05, TA-03, BM-05 | Conditional |
| Sign | TA-03 | Conditional |
| Approvals | TA-03, BM-05 + approvals | Conditional |
| Subscriptions | RM-03, RM-01 | Conditional |
| Rental | RM-04, RM-01 | Conditional |
| Field Service | OP-05 | Conditional |

---

## Engine Integrity Rules

1. Every activated domain must trace to at least one answered question. If a domain
   cannot trace its activation to a specific question-answer pair listed in this
   document, it must not be activated.

2. Every excluded domain must trace to the absence of its activation conditions. If
   a domain's activation questions were answered in a way that does not meet any
   activation rule, the domain is excluded.

3. Blocking conditions are evaluated before a domain begins setup. A blocked domain
   is visible in the project scope but its setup steps are locked.

4. Blocking conditions are re-evaluated when the blocking domain completes its
   relevant checkpoints. When a blocker is resolved, the blocked domain is
   automatically unblocked.

5. Deferment is not the same as exclusion. A deferred domain remains in the project
   scope, retains its question-answer linkage, and can be activated for Phase 2
   without re-running discovery.

6. Priority escalation (e.g., Recommended → Go-Live) is evaluated at activation time
   and is not changed unless a scope change event re-runs the affected questions.

7. The cross-domain blocking matrix is authoritative. If a blocking relationship
   is stated in a domain's blocking conditions but not reflected in the matrix,
   the domain's blocking conditions govern and the matrix must be corrected.

8. Foundation, Users / Roles / Security, and Master Data are unconditionally activated
   and cannot be excluded, deferred, or deprioritized. They are structural
   prerequisites for the entire implementation.

---

**Engine Version:** 1.0
**Governing Documents:** `docs/03_Implementation_Master_Map.md`,
`docs/04_Domain_Coverage_Map.md`, `specs/discovery_question_framework.md`
**Authority:** Subordinate to Domain Coverage Map and Implementation Master Map.
In any conflict, those documents win.
