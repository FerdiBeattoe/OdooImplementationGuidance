# Question Impact Reference

**Scope:** Every question shipped in the onboarding wizard (`app/frontend/src/views/onboarding-wizard.js`), together with its domain activation impact (per `app/shared/domain-activation-engine.js`) and the assumption used when the user defers (`DEFERRED_DEFAULTS` in `app/frontend/src/state/onboarding-store.js`).

**Note on total count:** The originating task brief referenced 86 questions. The actual `QUESTIONS` array in `onboarding-wizard.js` contains **78 entries** across 22 sections. This document covers all 78. The delta (8) is not present in the source file as of the current commit — either the count was approximate in the brief, or eight questions were removed from an earlier draft of the wizard. No fabricated entries have been added to make up the difference.

**How to read each entry:**
- `Required` — the wizard's `required` flag (all user-facing questions are required before run).
- `Can defer` — the `allowDefer` flag; `No` means the question must be answered.
- `Irreversible` — the `irreversible` flag; triggers the irreversible-warning screen.
- `Condition` — when the question is shown (else `Always shown`).
- Each **answer option** is listed with the domains it touches and the downstream configuration implied.
- **If deferred** gives the `deferredDefault` from the wizard and cross-references `DEFERRED_DEFAULTS`.

Domain-activation logic below is sourced from `domain-activation-engine.js` (foundation/users_roles/master_data always activate; others gate on specific answers). Where engine logic does not cover a question directly (e.g. TA-04 admin name, BM-03 country string), impact is described based on `domainImpact` text and `checkpoint-guidance.json`.

---

## BM-01 — What best describes what your business sells?
**Section:** Business Model
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Physical products only**
- Domains activated or affected: Inventory, Sales, Purchase (via BM-01 implies-physical / implies-sales paths)
- What this means for the implementation: Activates physical-goods tracking — Inventory goes live, Sales is eligible for product order flows, Purchase is eligible for supplier PO flows. Services-only tracks (Projects for service delivery) are NOT activated by this answer alone.
- What the user will need to configure: product catalogue (stockable), warehouse locations, incoming/outgoing routes, stock valuation method (see FC-02), customer/supplier master data.
- What stays out of scope: Projects (unless RM-02/RM-01 service options chosen), Subscriptions, Rental, Manufacturing, POS, Website/eCommerce.

**Services only**
- Domains activated or affected: Projects, CRM (via BM-01 implies-services / implies-sales paths; Sales still reachable through RM-01)
- What this means for the implementation: The implementation is framed around service delivery — Projects and CRM are eligible; Inventory is NOT activated by BM-01 and stays inactive unless OP-01 = Yes.
- What the user will need to configure: project/stage templates, billable-hour policy (see RM-02, TS-01), customer CRM pipeline.
- What stays out of scope: Inventory, Purchase for goods, Manufacturing, POS, Rental.

**Both physical products and services**
- Domains activated or affected: Inventory, Sales, Purchase, Projects, CRM (union of the two paths above).
- What this means for the implementation: All three tracks (goods, services, CRM pipeline) become eligible — widest initial scope, most complex go-live sequencing.
- What the user will need to configure: product master (both stockable and service types), warehouse routes, project templates, pricing for both lines, CRM pipeline.
- What stays out of scope: Manufacturing (requires MF-01 = Yes), Subscriptions (RM-03), Rental (RM-04), POS (OP-03), Website/eCommerce (OP-04).

**Software or digital products only**
- Domains activated or affected: Sales, CRM (treated like services for activation — no physical inventory implied).
- What this means for the implementation: No warehouse or Inventory scope from BM-01. Subscriptions likely (check RM-03); deferred default on RM-03 is Yes.
- What the user will need to configure: digital product catalogue, pricing, CRM pipeline, and (if applicable) Subscriptions for recurring SaaS billing.
- What stays out of scope: Inventory, Purchase for goods, Manufacturing, POS, Rental.

**Platform or marketplace (connecting buyers and sellers)**
- Domains activated or affected: Sales, CRM; implementation posture: marketplace rather than a first-party seller.
- What this means for the implementation: Complex flow; some capabilities (commission, multi-vendor splits) are not out-of-the-box in Odoo and may need custom work. Impact to be confirmed — see `domain-activation-engine.js` and `checkpoint-guidance.json` for marketplace-specific guidance.
- What the user will need to configure: vendor (third-party seller) records, commission logic, payout/settlement process.
- What stays out of scope: inventory as first-party stockholder unless OP-01 = Yes.

### If deferred:
- Default assumption used: **Both physical products and services** (widest scope; `DEFERRED_DEFAULTS`: `["inventory","sales","purchase","projects","crm"]`).
- Domains activated by default: Inventory, Sales, Purchase, Projects, CRM.
- Risk of deferring: You will plan and stage configuration for five domains — when the real answer is narrower, effort is wasted on domains that aren't needed. This is the most expensive question to defer.

---

## BM-02 — Does your business operate as more than one legal entity?
**Section:** Business Model
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Foundation (multi-company flag), Users/Roles (cross-company access policy).
- What this means for the implementation: Multiple `res.company` records will be created; journals, products, partners may need per-company visibility; users must be granted explicit multi-company access.
- What the user will need to configure: each legal entity's company record, inter-company transaction rules, user multi-company allowed-companies and default company.
- What stays out of scope: Consolidation reporting beyond Odoo standard is NOT included.

**No**
- Domains activated or affected: Foundation (single-company simple path).
- What this means for the implementation: Single `res.company` record; no multi-company complexity. Simplifies accounting, products, users.
- What the user will need to configure: the one company's localization, currency, and fiscal year.
- What stays out of scope: inter-company flows, multi-company approval chains.

### If deferred:
- Default assumption used: **Yes** (`domains: ["foundation"]`).
- Domains activated by default: Foundation (multi-company configured defensively).
- Risk of deferring: Multi-company is harder to enable after data exists than to remove when unused — deferring Yes is the safer default but will add configuration work that may prove unnecessary.

---

## BM-03 — In which country is your primary business legally registered and operating?
**Section:** Business Model
**Required:** Yes
**Can defer:** No
**Irreversible:** Yes — country selection pins the Odoo localization package (chart of accounts, statutory tax baseline, legal reports). Switching countries after posting transactions is not supported as a simple reconfigure.
**Condition:** Always shown

### Answer options and what each does:

**[free-text country name]**
- Domains activated or affected: Foundation (localization), Accounting (chart of accounts template), all domains inherit default currency from this.
- What this means for the implementation: The country chosen loads that country's localization module in Odoo — chart of accounts, tax templates, fiscal positions, statutory report formats. This decision sits under FND-FOUND-001 / FND-FOUND-002 governed writes.
- What the user will need to configure: verify the loaded localization matches the actual legal structure, confirm default currency, verify statutory tax codes before any invoice is posted.
- What stays out of scope: Secondary-country localizations for other entities (BM-02 multi-company) are configured per-company, not here.

### If deferred:
- Not deferrable. `allowDefer: false`, no entry in `DEFERRED_DEFAULTS`.

---

## BM-04 — Do you transact with customers or suppliers in currencies other than your primary operating currency?
**Section:** Business Model
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Accounting (multi-currency activation). Gates FND-DREQ-003 (multi-currency governed write).
- What this means for the implementation: Multi-currency is turned on; exchange-rate providers, secondary currencies per customer/supplier, revaluation rules become in-scope.
- What the user will need to configure: list of foreign currencies, exchange-rate service, per-partner currency defaults, revaluation schedule.
- What stays out of scope: Automatic hedging/treasury beyond Odoo standard.

**No**
- Domains activated or affected: Accounting (single-currency simplified).
- What this means for the implementation: No multi-currency UI clutter; all documents post in company currency.
- What the user will need to configure: nothing beyond the single company currency.
- What stays out of scope: Foreign-currency invoicing, multi-currency bank statements, revaluation.

### If deferred:
- Default assumption used: **Yes** (`domains: ["accounting"]`).
- Domains activated by default: Accounting multi-currency.
- Risk of deferring: Enabling multi-currency defensively is low cost; if later unneeded, it is still harmless. Deferring No and discovering foreign transactions later is more disruptive.

---

## BM-05 — How many people will use Odoo (approximate total user count)?
**Section:** Business Model
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**[numeric]**
- Domains activated or affected: Users/Roles (complexity tier). Threshold effects:
  - **> 10** — HR domain becomes an activation candidate (enough headcount to justify formal HR records).
  - **> 50** — Documents and Approvals domains become candidates (volume justifies governed document flows and multi-step approval chains).
- What this means for the implementation: Drives how elaborate the Users/Roles checkpoint design must be. Small teams can share permissions loosely; >50 requires tight role boundaries.
- What the user will need to configure: user licences, employee records (if HR activated), role-to-user mapping, record rules per department (see TA-01, TA-02).
- What stays out of scope: Named identity providers and SSO are not configured from this question alone.

### If deferred:
- Default assumption used: **> 50** (`domains: ["users_roles"]`, maximum complexity tier).
- Domains activated by default: Users/Roles at the highest tier.
- Risk of deferring: You will plan for a large-user environment even if the reality is smaller — over-scopes Users/Roles design effort.

---

## RM-01 — How does your business primarily earn revenue?
**Section:** Revenue Model
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown
**Input type:** multi-select — each selection contributes independently; deselecting all leaves a non-answer.

### Answer options and what each does:

**One-time product sales**
- Domains activated or affected: Sales (triggering ref `RM-01`).
- What this means for the implementation: Standard quote → order → invoice flow; depends on BM-01 for product kind.
- What the user will need to configure: product pricebook, quotation templates, invoice policy.
- What stays out of scope: Recurring billing, subscription lifecycle.

**One-time service delivery**
- Domains activated or affected: Sales (triggering ref `RM-01`); Projects often paired.
- What this means for the implementation: Fixed-price or T&M service jobs sold as one-off engagements.
- What the user will need to configure: service products, delivery-based invoicing, project/task templates if paired with RM-02.
- What stays out of scope: Recurring service contracts (see RM-03).

**Recurring subscriptions or contracts**
- Domains activated or affected: Sales, Subscriptions (gated elsewhere by RM-03 confirmation).
- What this means for the implementation: Subscription plans, renewal logic, dunning become in-scope.
- What the user will need to configure: subscription templates, recurrence, renewal rules, payment tokens.
- What stays out of scope: Complex revenue-recognition beyond Odoo standard.

**Project-based billing (time and materials or fixed price)**
- Domains activated or affected: Projects, Sales; Timesheets gated by TS-01.
- What this means for the implementation: Billable projects with analytics.
- What the user will need to configure: project templates, billing modes (T&M vs fixed), task stages, timesheet approval (TS-02).
- What stays out of scope: Resource capacity planning beyond Planning domain (see PL-01).

**Rental of assets or equipment**
- Domains activated or affected: Rental, Inventory (rented assets need tracking).
- What this means for the implementation: Rental products, rental order flow, return handling, pricing per period.
- What the user will need to configure: rentable product types, rental pricing, pickup/return warehouse operations.
- What stays out of scope: Long-term lease accounting (IFRS 16) beyond Odoo standard.

**Point-of-sale (retail, walk-in, or counter sales)**
- Domains activated or affected: POS (OP-03 also gates), Sales, Inventory.
- What this means for the implementation: POS sessions, cash control, receipt printing, POS-linked product availability.
- What the user will need to configure: POS hardware, payment methods, cash handling, product POS flags.
- What stays out of scope: Third-party POS integrations outside Odoo POS.

**Online store (customers place orders via a website)**
- Domains activated or affected: Website/eCommerce (OP-04 also gates), Sales, Inventory.
- What this means for the implementation: Web catalogue, checkout, online payment, customer account portal.
- What the user will need to configure: website pages, payment acquirers, shipping methods, product web publishing.
- What stays out of scope: Headless/custom frontends.

**None selected**
- Domains activated or affected: None from RM-01 directly; engine falls back to BM-01-implied activations.
- What this means for the implementation: Wizard will treat RM-01 as effectively unset; engine still activates Sales if BM-01 implies sales.
- What the user will need to configure: answer BM-01 will do the steering instead.
- What stays out of scope: All RM-01-gated domains (Subscriptions, Rental, POS-from-RM-01, Website-from-RM-01).

### If deferred:
- Default assumption used: **All options** (`domains: ["sales","subscriptions","projects","rental","pos","website_ecommerce"]`).
- Domains activated by default: Sales, Subscriptions, Projects, Rental, POS, Website/eCommerce.
- Risk of deferring: Maximum-scope assumption — six domains all come into planning even when only one or two are real. Very expensive.

---

## RM-02 — Do you bill customers based on hours worked or time spent on their account?
**Section:** Revenue Model
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Projects (timesheets), HR (candidate).
- What this means for the implementation: Billable hours, timesheet-to-invoice flow, employee hourly rates.
- What the user will need to configure: employee records, project billing modes, timesheet policies (TS-01/TS-02).
- What stays out of scope: Non-time-based revenue.

**No**
- Domains activated or affected: Projects may still activate for non-time reasons; no timesheet billing.
- What this means for the implementation: Projects (if active) run without billable-hour logic.
- What the user will need to configure: nothing from this question.
- What stays out of scope: timesheet-to-invoice generation.

### If deferred:
- Default assumption used: **Yes** (`domains: ["projects","hr"]`).
- Domains activated by default: Projects, HR.
- Risk of deferring: Assumes billable time is needed; adds HR scope that may not be necessary.

---

## RM-03 — Do any of your customers pay on a recurring schedule under a defined contract or plan?
**Section:** Revenue Model
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Subscriptions.
- What this means for the implementation: Subscription plans, automatic renewal invoicing, dunning/churn reporting.
- What the user will need to configure: subscription templates, recurrence rules, payment tokens, renewal policy, tax on recurring invoices.
- What stays out of scope: ASC 606 / IFRS 15 revenue recognition beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: Subscriptions domain is not configured.
- What the user will need to configure: nothing.
- What stays out of scope: Recurring billing entirely.

### If deferred:
- Default assumption used: **Yes** (`domains: ["subscriptions"]`).
- Domains activated by default: Subscriptions.
- Risk of deferring: Adds subscription module scope when not needed; low cost to remove later if unused.

---

## RM-04 — Do you rent physical assets or equipment to customers for defined time periods?
**Section:** Revenue Model
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Rental, Inventory (triggering ref `RM-04` in `activateInventory`).
- What this means for the implementation: Rental products, rental order cycle, pickup/return, availability calendar.
- What the user will need to configure: rental product templates, rental pricing schedules, asset return workflow.
- What stays out of scope: Fleet (vehicles — see FL-01).

**No**
- Domains activated or affected: None.
- What this means for the implementation: Rental module not configured.
- What the user will need to configure: nothing.
- What stays out of scope: Rental entirely.

### If deferred:
- Default assumption used: **Yes** (`domains: ["rental","inventory"]`).
- Domains activated by default: Rental, Inventory.
- Risk of deferring: Adds Rental scope defensively; if wrong, pure waste.

---

## OP-01 — Do you physically store and track stock of products you buy, sell, or manufacture?
**Section:** Operations
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Inventory (primary trigger, see `activateInventory` triggering ref `OP-01`).
- What this means for the implementation: Inventory goes live as a go-live-priority domain; stockable products, warehouse locations, routes, on-hand counts become real.
- What the user will need to configure: warehouse(s), internal locations, receipt/delivery routes, reordering rules, stock valuation (FC-02), traceability (PI-04).
- What stays out of scope: purely digital goods workflows.

**No**
- Domains activated or affected: Inventory NOT activated from OP-01; other triggers (RM-04, MF-01, BM-01 physical) can still activate it.
- What this means for the implementation: No warehouse scope unless another question triggers it.
- What the user will need to configure: nothing from OP-01.
- What stays out of scope: Warehouse, routes, stock on hand.

### If deferred:
- Default assumption used: **Yes** (`domains: ["inventory"]`).
- Domains activated by default: Inventory.
- Risk of deferring: Defensive — safer to plan Inventory scope than to discover it late.

---

## OP-02 — How many physically distinct warehouse or stock locations do you operate?
**Section:** Operations
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when OP-01 = Yes

### Answer options and what each does:

**[numeric]**
- Domains activated or affected: Inventory (route complexity tier). Threshold effects:
  - **1** — single warehouse, simple 1-step or 2-step routes.
  - **2–5** — multi-warehouse, inter-warehouse transfers in-scope.
  - **> 5** — complex multi-warehouse with inter-location routes, replenishment rules per location.
- What this means for the implementation: Determines how many warehouse records, how many internal transfer routes, how much replenishment config is planned.
- What the user will need to configure: a warehouse per physical location, routes between warehouses, picking/packing/shipping ops per site.
- What stays out of scope: Third-party logistics (3PL) integrations beyond Odoo standard.

### If deferred:
- Default assumption used: **> 5** (`domains: ["inventory"]`, highest-complexity tier).
- Domains activated by default: Inventory (complex routing).
- Risk of deferring: Over-scopes route design effort.

---

## OP-03 — Do you sell directly to customers at a physical counter, till, or retail point?
**Section:** Operations
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: POS (go-live priority).
- What this means for the implementation: POS sessions, cash management, hardware, receipts, tax display rules.
- What the user will need to configure: POS terminals, payment methods, cash control, product POS-availability, receipt printer configuration.
- What stays out of scope: Online ordering (OP-04 covers that).

**No**
- Domains activated or affected: None from OP-03.
- What this means for the implementation: No POS scope.
- What the user will need to configure: nothing.
- What stays out of scope: In-store retail flows.

### If deferred:
- Default assumption used: **Yes** (`domains: ["pos"]`).
- Domains activated by default: POS.
- Risk of deferring: Adds POS configuration scope; non-trivial (hardware, cash control).

---

## OP-04 — Do customers place orders through a website or web shop that you operate?
**Section:** Operations
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Website/eCommerce.
- What this means for the implementation: Public product catalogue, checkout, payment acquirers, online customer accounts.
- What the user will need to configure: website pages, domain/SSL, product web publishing, payment acquirers, shipping methods, tax display.
- What stays out of scope: Marketplace/third-party-seller flows (BM-01 "Platform" option).

**No**
- Domains activated or affected: None.
- What this means for the implementation: No public storefront.
- What the user will need to configure: nothing.
- What stays out of scope: Website domain entirely.

### If deferred:
- Default assumption used: **Yes** (`domains: ["website_ecommerce"]`).
- Domains activated by default: Website/eCommerce.
- Risk of deferring: Adds substantial scope (payment, SSL, content).

---

## OP-05 — Do you dispatch staff to perform work at customer sites, and do you need to track or invoice those activities?
**Section:** Operations
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Field Service, Projects (linkage), Repairs (candidate).
- What this means for the implementation: Dispatchable jobs, on-site timesheets, worksheet sign-off, parts-consumed-on-site flows.
- What the user will need to configure: field-service task templates, mobile access, on-site billing rules, technician scheduling.
- What stays out of scope: Route optimisation beyond Odoo standard.

**No**
- Domains activated or affected: None from OP-05.
- What this means for the implementation: No field-service scope.
- What the user will need to configure: nothing.
- What stays out of scope: Dispatch, on-site work orders.

### If deferred:
- Default assumption used: **Yes** (`domains: ["field_service","projects"]`).
- Domains activated by default: Field Service, Projects.
- Risk of deferring: Adds two domains defensively.

---

## SC-01 — Do your salespeople manage a defined pipeline of prospects and opportunities before a sale is confirmed?
**Section:** Sales & CRM
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: CRM (primary trigger `SC-01` in `activateCRM`).
- What this means for the implementation: Leads, opportunities, pipeline stages, forecasting.
- What the user will need to configure: sales teams, pipeline stages, lead sources, conversion rules to Sales order.
- What stays out of scope: Marketing automation beyond Email Marketing (see EM-01).

**No**
- Domains activated or affected: CRM NOT activated from SC-01.
- What this means for the implementation: Direct-to-order flow without lead tracking.
- What the user will need to configure: nothing from SC-01.
- What stays out of scope: Lead qualification, pipeline reporting.

### If deferred:
- Default assumption used: **Yes** (`domains: ["crm"]`).
- Domains activated by default: CRM.
- Risk of deferring: Adds CRM configuration; low cost if unused.

---

## SC-02 — Do sales quotations or orders require internal approval before being confirmed or sent to the customer?
**Section:** Sales & CRM
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Sales (approval configuration), Users/Roles (approver role), Approvals (candidate).
- What this means for the implementation: Quotation/order approval workflow, approver role, threshold rules.
- What the user will need to configure: approver assignments, approval thresholds, block-send-until-approved policy.
- What stays out of scope: External (customer-side) approval portals.

**No**
- Domains activated or affected: None.
- What this means for the implementation: Quotes send freely.
- What the user will need to configure: nothing.
- What stays out of scope: Internal approval workflow.

### If deferred:
- Default assumption used: **Yes** (`domains: ["sales"]`).
- Domains activated by default: Sales approval configuration.
- Risk of deferring: Adds approver role design.

---

## SC-03 — Do you apply different prices to different customers, customer groups, or order quantities?
**Section:** Sales & CRM
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Sales (pricelists activation).
- What this means for the implementation: Pricelist module, per-customer/group prices, volume breaks, promotional prices.
- What the user will need to configure: pricelist records, pricelist rules, customer-to-pricelist assignments.
- What stays out of scope: Complex configure-price-quote (CPQ) beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: Single price per product, no pricelists.
- What the user will need to configure: nothing.
- What stays out of scope: Segmented pricing.

### If deferred:
- Default assumption used: **Yes** (`domains: ["sales"]`).
- Domains activated by default: Sales pricelists.
- Risk of deferring: Adds pricelist design; removable later.

---

## SC-04 — Can salespeople apply discounts to sales lines, or is discounting controlled by a manager?
**Section:** Sales & CRM
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Salespeople can apply any discount freely**
- Domains activated or affected: Sales (discount field enabled, no threshold).
- What this means for the implementation: Discount column on sales lines open to all salespeople.
- What the user will need to configure: enable line-level discount feature.
- What stays out of scope: Discount approval routing.

**Discounts require manager approval above a threshold**
- Domains activated or affected: Users/Roles (discount approver), Sales (threshold configuration).
- What this means for the implementation: Threshold value, approver role, block-confirm-until-approved.
- What the user will need to configure: discount threshold amount/percent, approver user(s), approval workflow.
- What stays out of scope: Customer-facing discount portals.

**Discounting is not permitted**
- Domains activated or affected: Sales (discount field hidden/disabled).
- What this means for the implementation: Discount is not offered at all; price overrides require pricelist changes.
- What the user will need to configure: disable line discounts.
- What stays out of scope: Ad-hoc negotiation flows.

### If deferred:
- Default assumption used: **Discounts require manager approval above a threshold** (`domains: ["users_roles","sales"]`).
- Domains activated by default: Users/Roles (approver), Sales (threshold).
- Risk of deferring: Requires designing threshold/approver even if unused.

---

## PI-01 — Do you purchase goods or services from external suppliers using purchase orders?
**Section:** Procurement & Inventory
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Purchase (primary trigger `PI-01` in `activatePurchase`).
- What this means for the implementation: PO workflow, vendor catalogue, bill-matching (see FC-03).
- What the user will need to configure: suppliers, vendor pricelists, PO approval (PI-02), receipt flow (PI-03).
- What stays out of scope: Procure-to-pay beyond Odoo standard.

**No**
- Domains activated or affected: Purchase NOT activated.
- What this means for the implementation: No PO module in scope.
- What the user will need to configure: nothing.
- What stays out of scope: Vendor bills via PO-matching.

### If deferred:
- Default assumption used: **Yes** (`domains: ["purchase"]`).
- Domains activated by default: Purchase.
- Risk of deferring: Defensive.

---

## PI-02 — Do purchase orders require approval before being sent to suppliers?
**Section:** Procurement & Inventory
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when PI-01 = Yes

### Answer options and what each does:

**No approval required — purchasers can confirm freely**
- Domains activated or affected: Purchase (no approval gate).
- What this means for the implementation: Purchasers send POs without internal sign-off.
- What the user will need to configure: nothing.
- What stays out of scope: Approval audit trail on POs.

**Approval required above a monetary threshold**
- Domains activated or affected: Users/Roles (purchase manager), Approvals (candidate).
- What this means for the implementation: Threshold trigger; below → free, above → approver.
- What the user will need to configure: threshold amount, approver user(s).
- What stays out of scope: Multi-step approval chains.

**All purchase orders require manager approval**
- Domains activated or affected: Users/Roles (purchase manager), Approvals (candidate).
- What this means for the implementation: Every PO blocks until approved.
- What the user will need to configure: approver role, routing.
- What stays out of scope: nothing relevant.

### If deferred:
- Default assumption used: **All purchase orders require manager approval** (`domains: ["users_roles"]`).
- Domains activated by default: Users/Roles.
- Risk of deferring: Strictest default; may add friction if unneeded.

---

## PI-03 — When goods arrive from suppliers, how do you receive them?
**Section:** Procurement & Inventory
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when PI-01 = Yes AND OP-01 = Yes

### Answer options and what each does:

**Receive directly into stock (1 step)**
- Domains activated or affected: Inventory (simple incoming route).
- What this means for the implementation: Single receipt operation; goods go to stock on receipt.
- What the user will need to configure: 1-step route per warehouse.
- What stays out of scope: Quality hold, input zones.

**Receive into a dock/input area, then transfer to stock (2 steps)**
- Domains activated or affected: Inventory (2-step incoming route).
- What this means for the implementation: Separate receive and put-away operations; input location required.
- What the user will need to configure: input location, receive and put-away routes.
- What stays out of scope: Quality hold.

**Receive into dock, quality check or sort, then put away (3 steps)**
- Domains activated or affected: Inventory (3-step), Quality (candidate — also gates MF-06 visibility).
- What this means for the implementation: Input → quality → stock. Quality domain strongly implied.
- What the user will need to configure: input and quality locations, quality check points, put-away.
- What stays out of scope: Automated quality instrumentation.

### If deferred:
- Default assumption used: **3 steps** (`domains: ["inventory","quality"]`).
- Domains activated by default: Inventory (complex), Quality.
- Risk of deferring: Most complex route; over-scopes design.

---

## PI-04 — Do you need to track individual units or batches of products through their lifecycle?
**Section:** Procurement & Inventory
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when OP-01 = Yes

### Answer options and what each does:

**No traceability needed**
- Domains activated or affected: Inventory (no lot/serial).
- What this means for the implementation: Plain quantity tracking only.
- What the user will need to configure: nothing.
- What stays out of scope: Lot/serial reporting.

**Batch/lot tracking (groups of items)**
- Domains activated or affected: Inventory (lot tracking), Quality (granularity).
- What this means for the implementation: Lots recorded on receipt, consumption, delivery.
- What the user will need to configure: lot-tracked products, lot creation policy, shelf-life if applicable.
- What stays out of scope: Per-unit serial tracking.

**Serial number tracking (individual unit-level)**
- Domains activated or affected: Inventory (serial).
- What this means for the implementation: Each unit identified individually.
- What the user will need to configure: serial-tracked products, serial generation rules.
- What stays out of scope: Lot aggregation.

**Both lot and serial number tracking on different products**
- Domains activated or affected: Inventory (mixed).
- What this means for the implementation: Per-product choice of lot vs serial; most complex configuration.
- What the user will need to configure: tracking type per product family, handling procedures for each.
- What stays out of scope: External traceability platforms.

### If deferred:
- Default assumption used: **Both lot and serial number tracking** (`domains: ["inventory"]`).
- Domains activated by default: Inventory (mixed tracking).
- Risk of deferring: Over-scopes traceability design.

---

## PI-05 — Do you ever ship products directly from your supplier to your customer without the goods passing through your warehouse?
**Section:** Procurement & Inventory
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Inventory (drop-ship route), Purchase (vendor-to-customer flow), Sales (triggering ref `PI-05` added).
- What this means for the implementation: Drop-ship route; PO auto-created from SO; no warehouse stock movement.
- What the user will need to configure: drop-ship route, vendor-to-customer product config, invoice-on-shipment from supplier confirmation.
- What stays out of scope: 3PL label generation beyond standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: Standard warehouse flow only.
- What the user will need to configure: nothing.
- What stays out of scope: Drop-ship.

### If deferred:
- Default assumption used: **Yes** (`domains: ["inventory","purchase","sales"]`).
- Domains activated by default: Inventory, Purchase, Sales (drop-ship linkage).
- Risk of deferring: Adds route design.

---

## MF-01 — Does your business manufacture, assemble, kit, or produce any of the products it sells?
**Section:** Manufacturing
**Required:** Yes
**Can defer:** No
**Irreversible:** Yes — activating Manufacturing introduces BOMs, production orders, work centers, and accounting WIP policy; reversing is non-trivial once production orders exist.
**Condition:** Only shown when BM-01 = "Physical products only" or "Both physical products and services"

### Answer options and what each does:

**Yes**
- Domains activated or affected: Manufacturing (sole gate; `activateManufacturing` trigger `MF-01`). Also unlocks MF-02 through MF-07 and gates PLM (MF-05), Maintenance (MF-07), Quality (MF-06).
- What this means for the implementation: Full production module — BOMs, routings, work orders, work centers.
- What the user will need to configure: BOMs, work centers, routings, production locations, WIP policy (see MF-02, FC-02).
- What stays out of scope: Advanced MES / shop-floor terminals beyond Odoo standard.

**No**
- Domains activated or affected: Manufacturing NOT activated; MF-02..07 hidden.
- What this means for the implementation: No production scope.
- What the user will need to configure: nothing.
- What stays out of scope: BOMs, production orders, work centers, PLM, Maintenance.

### If deferred:
- Not deferrable. `allowDefer: false`, no entry in `DEFERRED_DEFAULTS`.

---

## MF-02 — How complex are your Bills of Materials?
**Section:** Manufacturing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when MF-01 = Yes

### Answer options and what each does:

**Single-level (finished product made from raw materials only)**
- Domains activated or affected: Manufacturing (simple BOM).
- What this means for the implementation: Flat BOM records.
- What the user will need to configure: one-level BOMs only.
- What stays out of scope: Sub-assemblies.

**Multi-level (components are themselves assembled from sub-components)**
- Domains activated or affected: Manufacturing (nested BOM), Accounting (WIP policy more elaborate).
- What this means for the implementation: Nested BOMs; sub-production orders; WIP valuation through multiple tiers.
- What the user will need to configure: parent-child BOMs, phantom vs produce policy per level, WIP accounts.
- What stays out of scope: Parametric / configurable BOM generators beyond Odoo standard.

**Phantom/kitting only (no production order needed, just bundle packaging)**
- Domains activated or affected: Manufacturing (kitting BOM only), Inventory.
- What this means for the implementation: No production orders; components consumed on delivery.
- What the user will need to configure: kit BOMs flagged phantom.
- What stays out of scope: Work orders, work centers.

### If deferred:
- Default assumption used: **Multi-level** (per wizard `deferredDefault`; not present in top-level `DEFERRED_DEFAULTS` — impact to be confirmed in engine if no deferred mapping applies).
- Domains activated by default: Manufacturing (elaborate).
- Risk of deferring: Over-scopes BOM design.

---

## MF-03 — Do you track work time or machine time at specific production stations or work centers?
**Section:** Manufacturing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when MF-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Manufacturing (work centers), Maintenance (candidate; MF-07 gated by this).
- What this means for the implementation: Work-center capacity, time logging, OEE candidates.
- What the user will need to configure: work center records, routing time per operation, cost per hour.
- What stays out of scope: IoT shop-floor capture beyond Odoo standard.

**No**
- Domains activated or affected: Manufacturing without work centers; MF-07 hidden (Maintenance not activated through this path).
- What this means for the implementation: Simple MO-only flow.
- What the user will need to configure: nothing work-center-related.
- What stays out of scope: Capacity planning, Maintenance domain.

### If deferred:
- Default assumption used: **Yes** (per wizard `deferredDefault`).
- Domains activated by default: Manufacturing work centers.
- Risk of deferring: Adds work-center design.

---

## MF-04 — Do you send materials to a third-party manufacturer or finisher who returns completed goods to you?
**Section:** Manufacturing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when MF-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Purchase (subcontracting triggering ref `MF-04`), Inventory (subcontractor location).
- What this means for the implementation: Subcontract BOMs, subcontractor vendor records, component handover and finished receipt.
- What the user will need to configure: subcontractor partners, subcontract BOMs, subcontractor locations.
- What stays out of scope: Consignment stock accounting beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No subcontracting scope.
- What the user will need to configure: nothing.
- What stays out of scope: Subcontracting.

### If deferred:
- Default assumption used: **Yes** (per wizard `deferredDefault`).
- Domains activated by default: Purchase, Inventory (subcontracting).
- Risk of deferring: Adds subcontracting setup.

---

## MF-05 — Are changes to your product structures subject to a formal approval process before being released to production?
**Section:** Manufacturing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when MF-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: PLM (`activatePLM` trigger `MF-05`), Documents (candidate), Users/Roles (ECO approver).
- What this means for the implementation: Engineering change orders (ECOs), revision control on BOMs, ECO approval workflow.
- What the user will need to configure: ECO types, ECO stages, approver role(s), document attachments per ECO.
- What stays out of scope: External PLM systems.

**No**
- Domains activated or affected: PLM NOT activated.
- What this means for the implementation: BOM changes made directly without revision workflow.
- What the user will need to configure: nothing.
- What stays out of scope: PLM domain.

### If deferred:
- Default assumption used: **Yes** (per wizard `deferredDefault`).
- Domains activated by default: PLM.
- Risk of deferring: Adds PLM design.

---

## MF-06 — Do you perform quality checks on incoming materials, during production, or on finished goods before dispatch?
**Section:** Manufacturing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when MF-01 = Yes OR PI-03 = "3 steps" (3-step receipt)
**Input type:** multi-select

### Answer options and what each does:

**On receipt from supplier**
- Domains activated or affected: Quality (receipt check points).
- What this means for the implementation: Quality checks at the receipt operation.
- What the user will need to configure: control points on receipts, pass/fail routing.
- What stays out of scope: Supplier scorecards beyond Odoo standard.

**During manufacturing (in-process inspection)**
- Domains activated or affected: Quality (in-process control points), Manufacturing.
- What this means for the implementation: Checks embedded in work orders.
- What the user will need to configure: control points on work orders, operator instructions.
- What stays out of scope: SPC / statistical process control beyond Odoo standard.

**On finished goods before dispatch**
- Domains activated or affected: Quality (outgoing check points), Inventory.
- What this means for the implementation: Checks at delivery operation.
- What the user will need to configure: control points on outgoing transfers.
- What stays out of scope: Certificate of analysis generation beyond standard.

**None — quality is managed externally or not required in Odoo**
- Domains activated or affected: Quality NOT activated.
- What this means for the implementation: No quality module scope.
- What the user will need to configure: nothing.
- What stays out of scope: Entire Quality domain.

**None selected**
- Domains activated or affected: Quality not activated.
- What this means for the implementation: Equivalent to the "None" option above.

### If deferred:
- Default assumption used: **On receipt from supplier** (per wizard `deferredDefault`; not in top-level `DEFERRED_DEFAULTS`).
- Domains activated by default: Quality (receipt check points).
- Risk of deferring: Adds minimum Quality scope.

---

## MF-07 — Do you schedule and track preventive or corrective maintenance on production equipment?
**Section:** Manufacturing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when MF-03 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Maintenance.
- What this means for the implementation: Preventive maintenance schedules, corrective work orders on equipment.
- What the user will need to configure: equipment records, maintenance teams, preventive schedules, failure tracking.
- What stays out of scope: Condition-monitoring / IoT beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No Maintenance scope.
- What the user will need to configure: nothing.
- What stays out of scope: Maintenance domain.

### If deferred:
- Default assumption used: **Yes** (per wizard `deferredDefault`).
- Domains activated by default: Maintenance.
- Risk of deferring: Adds Maintenance design.

---

## FC-01 — How will your business use Odoo for financial management?
**Section:** Finance Complexity
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Full accounting (general ledger, journals, reconciliation, reporting)**
- Domains activated or affected: Accounting (go-live priority).
- What this means for the implementation: Chart of accounts, journals, bank reconciliation, statutory reports; gates FC-02 (valuation) and FC-03 (3-way match).
- What the user will need to configure: COA, tax codes, opening balances, bank feeds, journal access controls.
- What stays out of scope: External ERP consolidation.

**Invoicing only (send invoices and track payments, no general ledger)**
- Domains activated or affected: Accounting (invoicing-only variant).
- What this means for the implementation: Customer invoices and payment tracking, but no GL postings to a full COA.
- What the user will need to configure: invoice templates, payment methods, customer statements.
- What stays out of scope: Full GL, reconciliation, statutory reports.

**Not using Odoo for financials (external accounting system)**
- Domains activated or affected: Accounting NOT activated (or stubbed).
- What this means for the implementation: Odoo is used for operations; financials live elsewhere.
- What the user will need to configure: export paths to external system.
- What stays out of scope: All Odoo financials.

### If deferred:
- Default assumption used: **Full accounting** (`domains: ["accounting"]`).
- Domains activated by default: Accounting full.
- Risk of deferring: Plans full GL even when not needed.

---

## FC-02 — What method do you use to value your inventory?
**Section:** Finance Complexity
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when OP-01 = Yes AND FC-01 = "Full accounting"

### Answer options and what each does:

**Standard Price (fixed cost per product)**
- Domains activated or affected: Accounting, Inventory (standard-cost valuation).
- What this means for the implementation: Manual cost maintenance; variances posted on receipt.
- What the user will need to configure: product standard cost, variance accounts.
- What stays out of scope: Moving-average auto-updates.

**Average Cost — AVCO (cost updated on each receipt)**
- Domains activated or affected: Accounting valuation journals, Inventory.
- What this means for the implementation: Receipt cost updates product cost weighted by quantity.
- What the user will need to configure: AVCO category, valuation journals, Inventory go-live sequencing behind Accounting.
- What stays out of scope: Per-lot cost layering.

**First In First Out — FIFO (cost follows the oldest receipt price)**
- Domains activated or affected: Accounting valuation journals, Inventory.
- What this means for the implementation: Cost layers; dispatch consumes oldest-cost layer first.
- What the user will need to configure: FIFO category, valuation journals, Inventory go-live sequencing behind Accounting.
- What stays out of scope: LIFO (not supported).

**Not applicable (services business or no stock tracking)**
- Domains activated or affected: None.
- What this means for the implementation: Skip valuation.
- What the user will need to configure: nothing.
- What stays out of scope: Stock valuation.

### If deferred:
- Default assumption used: **FIFO** (`domains: ["accounting","inventory"]`).
- Domains activated by default: Accounting, Inventory (FIFO).
- Risk of deferring: FIFO valuation is most complex; over-scopes if actual answer is simpler.

---

## FC-03 — Do you require purchase orders, goods receipts, and supplier invoices to be formally matched before a supplier invoice is approved for payment?
**Section:** Finance Complexity
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when PI-01 = Yes AND FC-01 = "Full accounting"

### Answer options and what each does:

**Yes**
- Domains activated or affected: Purchase (billing policy), Accounting (supplier invoice matching), Users/Roles (AP role).
- What this means for the implementation: 3-way match (PO vs receipt vs bill); bill cannot be validated until receipt and PO agree within tolerance.
- What the user will need to configure: billing control policy (on received quantities), tolerance thresholds, AP role.
- What stays out of scope: Automated OCR matching beyond Odoo standard.

**No**
- Domains activated or affected: Purchase (bill-on-ordered-qty policy).
- What this means for the implementation: Bills can be validated independent of receipts.
- What the user will need to configure: simpler AP flow.
- What stays out of scope: 3-way match.

### If deferred:
- Default assumption used: **Yes** (`domains: ["purchase","accounting","users_roles"]`).
- Domains activated by default: Purchase, Accounting, Users/Roles.
- Risk of deferring: Adds 3-way-match rigor.

---

## FC-04 — Does your fiscal year end on a date other than 31 December?
**Section:** Finance Complexity
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Accounting (fiscal year end date configuration; FND-DREQ-001 governed write of `fiscalyear_last_month` / `fiscalyear_last_day`).
- What this means for the implementation: Company fiscal year configured to the chosen month/day; period generation and reports follow this.
- What the user will need to configure: fiscal year end month, fiscal year end day (collected by the Foundation wizard capture that feeds FND-DREQ-001).
- What stays out of scope: Mid-year fiscal-year changes.

**No**
- Domains activated or affected: Accounting (default 12/31).
- What this means for the implementation: Standard Dec-31 fiscal year.
- What the user will need to configure: nothing.
- What stays out of scope: Non-calendar fiscal years.

### If deferred:
- Default assumption used: **Yes** (`domains: ["accounting"]`).
- Domains activated by default: Accounting fiscal-year configuration.
- Risk of deferring: Will plan fiscal-year capture even if Dec 31 is actual.

---

## FC-05 — Do you need to track revenues and costs against projects, departments, cost centres, or campaigns separately from your main chart of accounts?
**Section:** Finance Complexity
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Accounting (analytic accounting), Projects (analytic account per project).
- What this means for the implementation: Analytic plans, analytic accounts, analytic distribution on invoices/bills.
- What the user will need to configure: analytic plans (project, department, campaign), default distribution rules.
- What stays out of scope: Multi-dimensional cubes beyond Odoo analytic plans.

**No**
- Domains activated or affected: None.
- What this means for the implementation: Reporting only via COA.
- What the user will need to configure: nothing.
- What stays out of scope: Analytic accounting.

### If deferred:
- Default assumption used: **Yes** (`domains: ["accounting","projects"]`).
- Domains activated by default: Accounting analytics, Projects linkage.
- Risk of deferring: Adds analytic design.

---

## FC-06 — Do you offer customers defined payment terms?
**Section:** Finance Complexity
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Accounting (payment terms), Sales (per-customer terms).
- What this means for the implementation: Payment-term records (Net 30, 2/10 Net 30 etc.); customer default terms; aging behaviour.
- What the user will need to configure: payment-term records, customer-to-term assignments.
- What stays out of scope: Early-payment discount automation beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: Invoices due immediately.
- What the user will need to configure: nothing.
- What stays out of scope: Deferred collection logic.

### If deferred:
- Default assumption used: **Yes** (`domains: ["accounting","sales"]`).
- Domains activated by default: Accounting, Sales.
- Risk of deferring: Adds payment-term design.

---

## TA-01 — Which of the following roles need to be separated so that different people have different access in Odoo?
**Section:** Team & Access Structure
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown
**Input type:** multi-select

### Answer options and what each does:

**Salespeople vs. Sales Managers**
- Domains activated or affected: Users/Roles.
- What this means for the implementation: Two-tier Sales group with manager permissions.
- What the user will need to configure: group membership, record rules limiting salespeople to own records.
- What stays out of scope: Other functions.

**Purchasers vs. Purchase Managers**
- Domains activated or affected: Users/Roles.
- What this means for the implementation: Two-tier Purchase group.
- What the user will need to configure: PO approval role, buyer vs manager group.
- What stays out of scope: Non-purchase.

**Warehouse Operators vs. Inventory Managers**
- Domains activated or affected: Users/Roles, Inventory.
- What this means for the implementation: Two-tier Inventory group; operators can't adjust stock freely.
- What the user will need to configure: groups, inventory adjustment permissions.
- What stays out of scope: Non-inventory.

**Accounts Payable vs. Accounts Receivable vs. Finance Managers**
- Domains activated or affected: Users/Roles, Accounting.
- What this means for the implementation: Three-tier Accounting — segregation of duties.
- What the user will need to configure: AP group, AR group, Finance manager group, journal access per group.
- What stays out of scope: External auditor access.

**Production Operators vs. Manufacturing Managers**
- Domains activated or affected: Users/Roles, Manufacturing.
- What this means for the implementation: Two-tier MO group.
- What the user will need to configure: operator vs manager groups, work-center access.
- What stays out of scope: Non-manufacturing.

**HR Officers vs. HR Managers**
- Domains activated or affected: Users/Roles, HR.
- What this means for the implementation: Two-tier HR group; officers see own records, managers see all.
- What the user will need to configure: HR record rules, payroll sensitivity gates.
- What stays out of scope: Non-HR.

**System Administrator (separate from all operational roles)**
- Domains activated or affected: Users/Roles (admin isolation).
- What this means for the implementation: Dedicated admin user not used for daily ops.
- What the user will need to configure: admin user, non-admin daily-ops users.
- What stays out of scope: Named SSO / IdP integration.

**None selected**
- Domains activated or affected: Users/Roles minimal.
- What this means for the implementation: Flat permissions; small-team style.
- What the user will need to configure: nothing beyond defaults.
- What stays out of scope: Role segregation.

### If deferred:
- Default assumption used: **All role separations** (`domains: ["users_roles","hr"]`).
- Domains activated by default: Users/Roles (maximum), HR.
- Risk of deferring: Maximum segregation planned — expensive if team is flat.

---

## TA-02 — Do any departments or teams need to be restricted from seeing each other's records?
**Section:** Team & Access Structure
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Users/Roles (team record rules), CRM, Sales (team visibility).
- What this means for the implementation: Record rules per sales team / CRM team; cross-team visibility locked down.
- What the user will need to configure: sales teams, CRM teams, record rules, team leaders.
- What stays out of scope: Cross-company visibility (that's BM-02).

**No**
- Domains activated or affected: None.
- What this means for the implementation: Open visibility across the org.
- What the user will need to configure: nothing.
- What stays out of scope: Team walls.

### If deferred:
- Default assumption used: **Yes** (`domains: ["users_roles","crm","sales"]`).
- Domains activated by default: Users/Roles, CRM, Sales team walls.
- Risk of deferring: Adds record-rule design defensively.

---

## TA-03 — Beyond sales and purchase approvals already asked, are there other operational actions that require a formal second approval before execution?
**Section:** Team & Access Structure
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown
**Input type:** multi-select

### Answer options and what each does:

**Inventory adjustments above a threshold**
- Domains activated or affected: Approvals, Inventory.
- What this means for the implementation: Approval step on inventory adjustment validation above threshold.
- What the user will need to configure: threshold, approver role.
- What stays out of scope: other actions.

**Expenses above a threshold**
- Domains activated or affected: Approvals, Expenses (see EX-01/EX-02).
- What this means for the implementation: Secondary approval above monetary threshold.
- What the user will need to configure: threshold, approver role.
- What stays out of scope: other actions.

**Manufacturing order creation or close**
- Domains activated or affected: Approvals, Manufacturing.
- What this means for the implementation: Gated MO lifecycle events.
- What the user will need to configure: approver role, trigger events.
- What stays out of scope: other actions.

**HR leave requests**
- Domains activated or affected: Approvals, HR.
- What this means for the implementation: Manager approval on leave requests.
- What the user will need to configure: manager hierarchy, leave types.
- What stays out of scope: Payroll impact (see PY-01).

**Contract or document signing**
- Domains activated or affected: Sign (domain activation), Approvals.
- What this means for the implementation: Electronic signature workflows for contracts.
- What the user will need to configure: sign templates, signer roles, certificate storage.
- What stays out of scope: Cross-border legal validity review.

**None — standard module approvals are sufficient**
- Domains activated or affected: Neither Approvals nor Sign beyond defaults.
- What this means for the implementation: Rely on built-in per-module approvals only.
- What the user will need to configure: nothing.
- What stays out of scope: Custom approval chains.

**None selected**
- Equivalent to the "None" option above.

### If deferred:
- Default assumption used: **All non-None options** (`domains: ["approvals","sign"]`).
- Domains activated by default: Approvals, Sign.
- Risk of deferring: Over-scopes approval design.

---

## TA-04 — Who is the designated Odoo system administrator?
**Section:** Team & Access Structure
**Required:** Yes
**Can defer:** No
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**[free-text name or email]**
- Domains activated or affected: Users/Roles (admin user checkpoint), Foundation (admin credentials context).
- What this means for the implementation: The named person owns the admin account used for governed writes; the Users/Roles checkpoint records this identity.
- What the user will need to configure: create the admin user record (with MFA if available), remove default admin, ensure this user is not used for daily operational work.
- What stays out of scope: OS / infra administration beyond the Odoo instance.

### If deferred:
- Not deferrable. `allowDefer: false`. `DEFERRED_DEFAULTS` entry exists with `defaultAnswer: null, domains: []` — no meaningful default can be used; this is a hard requirement.

---

## TS-01 — Do your employees need to log time against projects or tasks?
**Section:** People Operations & Time
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Timesheets, Projects.
- What this means for the implementation: Timesheet entry per task; hours feed invoicing (with RM-02) and payroll inputs.
- What the user will need to configure: employees, projects, task types, time units, approval (TS-02).
- What stays out of scope: External time-tracking apps beyond Odoo mobile.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No timesheet capture.
- What the user will need to configure: nothing.
- What stays out of scope: Time-based billing and payroll hours.

### If deferred:
- Default assumption used: **Yes** (`domains: ["timesheets","projects"]`).
- Domains activated by default: Timesheets, Projects.
- Risk of deferring: Adds timesheet scope.

---

## TS-02 — Do managers need to approve timesheets before payroll?
**Section:** People Operations & Time
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when TS-01 = Yes

### Answer options and what each does:

**Yes, approval required**
- Domains activated or affected: Timesheets (governed approval checkpoint), Projects.
- What this means for the implementation: Timesheets must be approved by manager before they reach payroll or customer invoice.
- What the user will need to configure: manager-employee hierarchy, approval UI, weekly/monthly approval cadence.
- What stays out of scope: Payroll calculation (PY-01).

**No, auto-validate**
- Domains activated or affected: Timesheets without approval gate.
- What this means for the implementation: Timesheets flow straight through.
- What the user will need to configure: nothing.
- What stays out of scope: Formal approval audit.

### If deferred:
- Default assumption used: **Yes, approval required** (`domains: ["timesheets","projects"]`).
- Domains activated by default: Timesheets with approval.
- Risk of deferring: Adds approval workflow scope.

---

## EX-01 — Do employees submit expense claims for reimbursement?
**Section:** People Operations & Time
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Expenses, Accounting (reimbursement rules).
- What this means for the implementation: Expense claim submission, approval routing (EX-02), reimbursement via payroll or payable.
- What the user will need to configure: expense products, reimbursement journal, approval chain, receipt attachment policy.
- What stays out of scope: Corporate card feeds beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No expense module.
- What the user will need to configure: nothing.
- What stays out of scope: Expense reimbursement in Odoo.

### If deferred:
- Default assumption used: **Yes** (`domains: ["expenses","accounting"]`).
- Domains activated by default: Expenses, Accounting.
- Risk of deferring: Adds expense design.

---

## EX-02 — Who approves expense claims?
**Section:** People Operations & Time
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when EX-01 = Yes

### Answer options and what each does:

**Direct manager**
- Domains activated or affected: Expenses, Users/Roles.
- What this means for the implementation: Single-tier approval by immediate manager.
- What the user will need to configure: employee-manager hierarchy.
- What stays out of scope: Finance second-check.

**Finance team**
- Domains activated or affected: Expenses, Accounting (finance group).
- What this means for the implementation: Single-tier approval by finance role.
- What the user will need to configure: finance approver group.
- What stays out of scope: Manager sign-off.

**Both**
- Domains activated or affected: Expenses, Users/Roles, Accounting.
- What this means for the implementation: Two-step approval — manager then finance.
- What the user will need to configure: both hierarchies, routing rules.
- What stays out of scope: nothing relevant.

### If deferred:
- Default assumption used: **Direct manager** (`domains: ["expenses","accounting"]`).
- Domains activated by default: Expenses, Accounting.
- Risk of deferring: Simplest routing assumed; may under-scope.

---

## AT-01 — How do you track employee attendance?
**Section:** People Operations & Time
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Manual entry**
- Domains activated or affected: Attendance, HR.
- What this means for the implementation: Employees or admins key attendance manually.
- What the user will need to configure: attendance access permissions.
- What stays out of scope: Device integrations.

**Kiosk / badge scan**
- Domains activated or affected: Attendance, HR.
- What this means for the implementation: Kiosk mode + RFID/barcode badges.
- What the user will need to configure: kiosk device(s), badge mapping, physical setup.
- What stays out of scope: Third-party access control.

**Mobile app**
- Domains activated or affected: Attendance, HR.
- What this means for the implementation: Employees check in from mobile (with geofence if desired).
- What the user will need to configure: mobile app rollout, geofence policy if applicable.
- What stays out of scope: Hardware kiosks.

**We don't track attendance**
- Domains activated or affected: Attendance NOT activated (AT-02 is hidden).
- What this means for the implementation: No attendance scope.
- What the user will need to configure: nothing.
- What stays out of scope: Attendance domain entirely.

### If deferred:
- Default assumption used: **Manual entry** (`domains: ["attendance","hr"]`).
- Domains activated by default: Attendance, HR.
- Risk of deferring: Simplest method; may under-scope.

---

## AT-02 — Do you need overtime calculation and reporting?
**Section:** People Operations & Time
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when AT-01 is answered AND not "We don't track attendance"

### Answer options and what each does:

**Yes**
- Domains activated or affected: Attendance (overtime rules), HR, feeds Payroll inputs.
- What this means for the implementation: Working-schedule templates, overtime thresholds, reporting packs.
- What the user will need to configure: working schedules, overtime rates, payroll rule mapping.
- What stays out of scope: Labor-law compliance review outside Odoo.

**No**
- Domains activated or affected: Attendance (time tracking only).
- What this means for the implementation: Attendance is logged without overtime computation.
- What the user will need to configure: nothing extra.
- What stays out of scope: Overtime reporting.

### If deferred:
- Default assumption used: **Yes** (`domains: ["attendance","hr"]`).
- Domains activated by default: Attendance, HR.
- Risk of deferring: Adds overtime rules.

---

## RC-01 — Do you manage job vacancies and candidate applications?
**Section:** Talent Acquisition
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Recruitment, HR.
- What this means for the implementation: Job positions, public careers page (if OP-04), candidate pipeline, interview scheduling.
- What the user will need to configure: job positions, departments, recruitment team, candidate stages.
- What stays out of scope: External ATS integrations beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No recruitment scope.
- What the user will need to configure: nothing.
- What stays out of scope: Recruitment domain.

### If deferred:
- Default assumption used: **Yes** (`domains: ["recruitment","hr"]`).
- Domains activated by default: Recruitment, HR.
- Risk of deferring: Adds recruitment design.

---

## RC-02 — Do you use structured interview stages with multiple reviewers?
**Section:** Talent Acquisition
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when RC-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Recruitment (stage templates, reviewers).
- What this means for the implementation: Interview stage configuration, reviewer assignment, evaluation forms.
- What the user will need to configure: stage templates, reviewer roles, evaluation forms per position type.
- What stays out of scope: Coding/skills assessment platforms beyond Odoo standard.

**No**
- Domains activated or affected: Recruitment (simple pipeline).
- What this means for the implementation: Simple stages only.
- What the user will need to configure: minimum stages.
- What stays out of scope: Structured interview process.

### If deferred:
- Default assumption used: **Yes** (`domains: ["recruitment","hr"]`).
- Domains activated by default: Recruitment, HR.
- Risk of deferring: Adds stage-template design.

---

## FL-01 — Does your business operate company vehicles?
**Section:** Fleet & Assets
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Fleet.
- What this means for the implementation: Vehicle records, drivers, contracts, service history.
- What the user will need to configure: vehicles, drivers/employees, contract terms.
- What stays out of scope: Telematics beyond Odoo standard.

**No**
- Domains activated or affected: None; FL-02 hidden.
- What this means for the implementation: No Fleet scope.
- What the user will need to configure: nothing.
- What stays out of scope: Fleet domain.

### If deferred:
- Default assumption used: **No** (`domains: ["fleet"]`, but default answer is No — the entry exists so the wizard still records the defaulted state).
- Domains activated by default: Effectively none at runtime since `No` doesn't activate Fleet.
- Risk of deferring: Low risk — defaulting No keeps Fleet out of scope. If business actually has vehicles, it will surface later as missing scope.

---

## FL-02 — Do you need to track fuel, service costs, and vehicle contracts?
**Section:** Fleet & Assets
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when FL-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Fleet (fuel logs, maintenance schedules, cost analytics).
- What this means for the implementation: Fuel log entries, service providers, cost analytics dashboards.
- What the user will need to configure: fuel-card integration if any, service provider list, chart of fleet costs.
- What stays out of scope: Automated fuel-card feeds beyond Odoo standard.

**No**
- Domains activated or affected: Fleet (vehicle register only).
- What this means for the implementation: Basic vehicle list, no cost tracking.
- What the user will need to configure: minimum fleet records.
- What stays out of scope: Cost analysis.

### If deferred:
- Default assumption used: **Yes** (`domains: ["fleet"]`).
- Domains activated by default: Fleet (full cost tracking).
- Risk of deferring: Adds cost analytics scope.

---

## EV-01 — Does your business run events, workshops, or training sessions?
**Section:** Events & Marketing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Events.
- What this means for the implementation: Events, tracks, speakers, tickets, attendees.
- What the user will need to configure: event templates, ticket types, agendas, speakers.
- What stays out of scope: Physical venue/AV logistics outside Odoo.

**No**
- Domains activated or affected: None; EV-02 hidden.
- What this means for the implementation: No Events scope.
- What the user will need to configure: nothing.
- What stays out of scope: Events domain.

### If deferred:
- Default assumption used: **No** (`domains: ["events"]`; default No keeps it inactive).
- Domains activated by default: None (No answer).
- Risk of deferring: Low risk — default No keeps Events out.

---

## EV-02 — Do attendees register and pay online for your events?
**Section:** Events & Marketing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when EV-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Events, Website/eCommerce, Accounting (payment flow).
- What this means for the implementation: Online ticket sales; payment acquirers; event revenue posted.
- What the user will need to configure: ticket products, payment acquirer, website event pages.
- What stays out of scope: On-site POS ticketing beyond Odoo standard.

**No**
- Domains activated or affected: Events only (no online payment).
- What this means for the implementation: Registrations tracked manually.
- What the user will need to configure: manual registration flow.
- What stays out of scope: Online payment.

### If deferred:
- Default assumption used: **Yes** (`domains: ["events"]`).
- Domains activated by default: Events with online flow.
- Risk of deferring: Adds website/payment scope.

---

## EM-01 — Do you send bulk marketing emails or newsletters to customers?
**Section:** Events & Marketing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Email Marketing.
- What this means for the implementation: Campaigns, templates, mailing lists, consent tracking.
- What the user will need to configure: sender domain (see OM-01/OM-02), mailing lists, templates, unsubscribe policy.
- What stays out of scope: Advanced marketing automation beyond Odoo.

**No**
- Domains activated or affected: None; EM-02 hidden.
- What this means for the implementation: No Email Marketing scope.
- What the user will need to configure: nothing.
- What stays out of scope: Email Marketing domain.

### If deferred:
- Default assumption used: **No** (`domains: ["email-marketing"]`; default No keeps it inactive).
- Domains activated by default: None.
- Risk of deferring: Low risk.

---

## EM-02 — Do you segment your mailing lists by customer type or behaviour?
**Section:** Events & Marketing
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when EM-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Email Marketing (segmentation, tagging, automation).
- What this means for the implementation: Tag-based segments, automation rules, behavioural triggers.
- What the user will need to configure: tag taxonomy, segment definitions, triggers.
- What stays out of scope: CDP-level tracking beyond Odoo standard.

**No**
- Domains activated or affected: Email Marketing (broadcast only).
- What this means for the implementation: Single-list blasts only.
- What the user will need to configure: one or two mailing lists.
- What stays out of scope: Segmentation.

### If deferred:
- Default assumption used: **Yes** (`domains: ["email-marketing"]`).
- Domains activated by default: Email Marketing (segmented).
- Risk of deferring: Adds segmentation scope.

---

## HD-01 — Do you need a customer support ticketing system?
**Section:** Service & Support
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Helpdesk.
- What this means for the implementation: Ticket teams, stages, SLAs (HD-02), customer portal.
- What the user will need to configure: teams, stages, canned responses, routing (email alias — see IM-02).
- What stays out of scope: Third-party ITSM integrations.

**No**
- Domains activated or affected: None; HD-02 hidden.
- What this means for the implementation: No Helpdesk scope.
- What the user will need to configure: nothing.
- What stays out of scope: Helpdesk domain.

### If deferred:
- Default assumption used: **Yes** (`domains: ["helpdesk"]`).
- Domains activated by default: Helpdesk.
- Risk of deferring: Adds Helpdesk design.

---

## HD-02 — Do you have service level agreements (SLAs) with customers?
**Section:** Service & Support
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when HD-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Helpdesk (SLA policies).
- What this means for the implementation: SLA timers, breach alerts, SLA reporting.
- What the user will need to configure: SLA definitions per team/priority, business hours, escalation.
- What stays out of scope: SLA contract drafting.

**No**
- Domains activated or affected: Helpdesk (no SLA).
- What this means for the implementation: Tickets have no timing contract.
- What the user will need to configure: nothing SLA-related.
- What stays out of scope: SLA reporting.

### If deferred:
- Default assumption used: **No** (`domains: ["helpdesk"]`; default No).
- Domains activated by default: Helpdesk (already from HD-01 if Yes), no SLA scope.
- Risk of deferring: Low — if SLAs are real, they surface later.

---

## PY-01 — Do you process employee payroll in Odoo?
**Section:** Payroll & Shift Planning
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Payroll, HR, Accounting (payroll journal).
- What this means for the implementation: Salary rules, payslips, payroll journal postings, statutory reporting per localization.
- What the user will need to configure: employees with contracts, salary rules, statutory data (tax IDs), bank details, payroll journal.
- What stays out of scope: Time/attendance feed configuration (see AT-01).

**No**
- Domains activated or affected: None from PY-01; PY-02 hidden if No/External.
- What this means for the implementation: No payroll module.
- What the user will need to configure: nothing.
- What stays out of scope: Payroll domain.

**We use an external payroll system**
- Domains activated or affected: None; Accounting may still receive payroll journal entries via import.
- What this means for the implementation: Integration/import scope only.
- What the user will need to configure: import template for payroll postings.
- What stays out of scope: Odoo payroll calculation.

### If deferred:
- Default assumption used: **Yes** (`domains: ["payroll","hr","accounting"]`).
- Domains activated by default: Payroll, HR, Accounting.
- Risk of deferring: Adds significant scope (payroll is complex).

---

## PY-02 — Do you have multiple payroll structures (e.g. salaried vs hourly vs commission)?
**Section:** Payroll & Shift Planning
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when PY-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Payroll (multiple salary rules / structures).
- What this means for the implementation: Multiple structure types, structure-to-employee assignment, rule variations.
- What the user will need to configure: each structure's rules, commission computation, eligibility.
- What stays out of scope: Non-payroll incentive plans.

**No**
- Domains activated or affected: Payroll (single structure).
- What this means for the implementation: One structure covers all.
- What the user will need to configure: single structure.
- What stays out of scope: Multi-structure logic.

### If deferred:
- Default assumption used: **No** (`domains: ["payroll","hr","accounting"]`; default No).
- Domains activated by default: Payroll (single structure) within the already-activated domains.
- Risk of deferring: Assumes simple payroll; may under-scope.

---

## PL-01 — Do you schedule shifts or resources in advance for your team?
**Section:** Payroll & Shift Planning
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Planning, HR.
- What this means for the implementation: Shift templates, resource boards, shift assignment, published schedules.
- What the user will need to configure: shift templates, resources (employees/rooms/equipment), working hours.
- What stays out of scope: Constraint-based auto-scheduling beyond Odoo standard.

**No**
- Domains activated or affected: None; PL-02 hidden.
- What this means for the implementation: No Planning scope.
- What the user will need to configure: nothing.
- What stays out of scope: Planning domain.

### If deferred:
- Default assumption used: **No** (`domains: ["planning","hr"]`; default No).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## PL-02 — Do employees need to confirm or swap shifts?
**Section:** Payroll & Shift Planning
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when PL-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Planning (confirmations, swap workflows).
- What this means for the implementation: Confirm buttons, swap-request approval, notification flow.
- What the user will need to configure: confirmation policy, swap rules, approver.
- What stays out of scope: Labour-law override logic outside Odoo.

**No**
- Domains activated or affected: Planning (publish only).
- What this means for the implementation: Admin publishes; employees don't act on shifts in-system.
- What the user will need to configure: publish workflow.
- What stays out of scope: Employee self-service swaps.

### If deferred:
- Default assumption used: **No** (`domains: ["planning","hr"]`).
- Domains activated by default: none.
- Risk of deferring: Low.

---

## KN-01 — Do you need an internal knowledge base or document library?
**Section:** Knowledge & Collaboration
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Knowledge.
- What this means for the implementation: Internal articles/SOPs, search, permissions, history.
- What the user will need to configure: top-level workspaces, access groups, templates.
- What stays out of scope: External wiki platforms.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No Knowledge scope.
- What the user will need to configure: nothing.
- What stays out of scope: Knowledge domain.

### If deferred:
- Default assumption used: **Yes** (`domains: ["knowledge"]`).
- Domains activated by default: Knowledge.
- Risk of deferring: Adds design scope.

---

## DI-01 — Do your teams use internal messaging channels in Odoo?
**Section:** Knowledge & Collaboration
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Discuss (core messaging).
- What this means for the implementation: Channel taxonomy, notification policy, chatter usage guidelines.
- What the user will need to configure: channels, private/public policy, mute/digest preferences.
- What stays out of scope: Third-party chat integrations beyond Odoo standard.

**No**
- Domains activated or affected: Discuss stays at defaults (it is a core module).
- What this means for the implementation: Minimal use of channels; chatter still exists on records.
- What the user will need to configure: nothing.
- What stays out of scope: Custom channels.

### If deferred:
- Default assumption used: **Yes** (`domains: ["discuss"]`).
- Domains activated by default: Discuss.
- Risk of deferring: Low.

---

## OM-01 — What email provider sends your business emails?
**Section:** Mail Infrastructure
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Gmail / Google Workspace**
- Domains activated or affected: Outgoing Mail (Google SMTP / OAuth).
- What this means for the implementation: Configure OAuth to Google, SPF/DKIM/DMARC for sender domain, send limits per Workspace plan.
- What the user will need to configure: Google OAuth credentials, DNS records, sender addresses.
- What stays out of scope: Non-Google providers.

**Microsoft 365 / Outlook**
- Domains activated or affected: Outgoing Mail (Microsoft Graph / SMTP).
- What this means for the implementation: Configure Microsoft OAuth, SPF/DKIM/DMARC, tenant send limits.
- What the user will need to configure: Microsoft app registration, DNS records.
- What stays out of scope: Non-Microsoft providers.

**Custom SMTP server**
- Domains activated or affected: Outgoing Mail (SMTP).
- What this means for the implementation: Manual SMTP host, port, TLS, credentials.
- What the user will need to configure: SMTP endpoint, sender auth, DNS.
- What stays out of scope: Managed provider OAuth.

**Odoo default (odoo.com relay)**
- Domains activated or affected: Outgoing Mail (Odoo relay).
- What this means for the implementation: Zero-config but capped at ~200 emails/day and frequently treated as spam by recipients. **Not recommended** for production use — wizard domainImpact explicitly warns.
- What the user will need to configure: nothing.
- What stays out of scope: Volume sending, deliverability controls.

### If deferred:
- Default assumption used: **Gmail / Google Workspace** (`domains: ["outgoing-mail"]`).
- Domains activated by default: Outgoing Mail (Google).
- Risk of deferring: Assumes Google; if wrong, redo OAuth setup.

---

## OM-02 — Do different departments need separate sender addresses? (e.g. sales@, support@, invoices@)
**Section:** Mail Infrastructure
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Outgoing Mail (multiple sender domains / routing).
- What this means for the implementation: Multiple outgoing mail servers or per-alias from-address routing.
- What the user will need to configure: each sender mailbox/alias, per-module from-address mapping.
- What stays out of scope: Per-user sender rotation beyond Odoo standard.

**No**
- Domains activated or affected: Outgoing Mail (single sender).
- What this means for the implementation: Single from-address for all outbound.
- What the user will need to configure: one sender.
- What stays out of scope: Department separation.

### If deferred:
- Default assumption used: **Yes** (`domains: ["outgoing-mail"]`).
- Domains activated by default: Outgoing Mail (multi-sender).
- Risk of deferring: Adds routing design.

---

## IM-01 — Do you want replies to Odoo emails to automatically create or update records? (e.g. reply to invoice logged on customer account)
**Section:** Mail Infrastructure
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Incoming Mail (catchall + gateway).
- What this means for the implementation: Incoming mail gateway; replies posted to original record (CRM, Helpdesk, Accounting, Projects).
- What the user will need to configure: incoming mail server (IMAP/POP or inbound relay), catchall alias, DNS MX records.
- What stays out of scope: AI auto-replies.

**No**
- Domains activated or affected: None; IM-02 hidden.
- What this means for the implementation: Replies handled outside Odoo.
- What the user will need to configure: nothing.
- What stays out of scope: Incoming Mail domain.

### If deferred:
- Default assumption used: **Yes** (`domains: ["incoming-mail"]`).
- Domains activated by default: Incoming Mail.
- Risk of deferring: Adds MX and gateway config.

---

## IM-02 — Which email aliases do you need?
**Section:** Mail Infrastructure
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when IM-01 = Yes
**Input type:** multi-select

### Answer options and what each does:

**sales@ — CRM leads**
- Domains activated or affected: Incoming Mail, CRM.
- What this means for the implementation: Inbound email to `sales@` creates a lead.
- What the user will need to configure: alias → CRM team binding.
- What stays out of scope: Other aliases.

**support@ — Helpdesk tickets**
- Domains activated or affected: Incoming Mail, Helpdesk.
- What this means for the implementation: Inbound email to `support@` creates a ticket.
- What the user will need to configure: alias → Helpdesk team binding.
- What stays out of scope: Other aliases.

**invoices@ — Customer account**
- Domains activated or affected: Incoming Mail, Accounting.
- What this means for the implementation: Replies to invoice emails are logged against the customer account.
- What the user will need to configure: alias → accounting customer binding.
- What stays out of scope: Vendor bills routing.

**jobs@ — Recruitment applications**
- Domains activated or affected: Incoming Mail, Recruitment.
- What this means for the implementation: Inbound CVs create candidate records.
- What the user will need to configure: alias → Recruitment job/department.
- What stays out of scope: External job-board feeds.

**info@ — General inbox**
- Domains activated or affected: Incoming Mail (routing to a general catch team).
- What this means for the implementation: Generic inbox routed to a default team.
- What the user will need to configure: which team receives `info@`.
- What stays out of scope: Topic-based triage (that's AI/automation, out of scope here).

**None selected**
- Domains activated or affected: Incoming Mail gateway without bound aliases.
- What this means for the implementation: Catchall only; no record creation routing.
- What the user will need to configure: manual handling.
- What stays out of scope: Alias-based automation.

### If deferred:
- Default assumption used: **["sales@ CRM leads", "support@ Helpdesk tickets"]** (`domains: ["incoming-mail"]`).
- Domains activated by default: Incoming Mail with sales+support aliases.
- Risk of deferring: Adds two alias configurations; low risk.

---

## AR-01 — Do you need custom financial reports beyond Odoo standard?
**Section:** Reporting & Analytics
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Accounting Reports, Accounting.
- What this means for the implementation: Custom report builder packs (management P&L, KPI dashboards).
- What the user will need to configure: report definitions, account groupings, boards.
- What stays out of scope: External BI tools.

**No**
- Domains activated or affected: None.
- What this means for the implementation: Rely on Odoo standard reports only.
- What the user will need to configure: nothing.
- What stays out of scope: Custom packs.

### If deferred:
- Default assumption used: **No** (`domains: ["accounting-reports","accounting"]`; default No keeps inactive).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## SP-01 — Do your teams build financial models or reports in shared spreadsheets connected to live Odoo data?
**Section:** Reporting & Analytics
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Spreadsheet (Odoo Documents Spreadsheet).
- What this means for the implementation: Live-data spreadsheets, templates, shared dashboards.
- What the user will need to configure: spreadsheet templates, data sources (list/pivot formulas), sharing rules.
- What stays out of scope: External Google Sheets / Excel connectors beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No Spreadsheet scope.
- What the user will need to configure: nothing.
- What stays out of scope: Spreadsheet domain.

### If deferred:
- Default assumption used: **No** (`domains: ["spreadsheet"]`; default No).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## LC-01 — Do you have a live chat widget on your website?
**Section:** Customer Chat & Messaging
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Live Chat.
- What this means for the implementation: Website chat widget, agent routing, staffing schedule.
- What the user will need to configure: widget placement, channels, agents, business hours.
- What stays out of scope: Third-party chat platforms.

**No**
- Domains activated or affected: None; LC-02 hidden.
- What this means for the implementation: No Live Chat scope.
- What the user will need to configure: nothing.
- What stays out of scope: Live Chat domain.

### If deferred:
- Default assumption used: **No** (`domains: ["live-chat"]`; default No).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## LC-02 — Do you use chatbots to handle common questions automatically?
**Section:** Customer Chat & Messaging
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when LC-01 = Yes

### Answer options and what each does:

**Yes**
- Domains activated or affected: Live Chat (chatbot scripts).
- What this means for the implementation: Scripted bots, routing, hand-off to humans.
- What the user will need to configure: bot scripts per scenario, fallback to live agent.
- What stays out of scope: LLM-based bots beyond Odoo standard.

**No**
- Domains activated or affected: Live Chat (humans only).
- What this means for the implementation: No bot automation.
- What the user will need to configure: nothing.
- What stays out of scope: Bot scripting.

### If deferred:
- Default assumption used: **No** (`domains: ["live-chat"]`; default No).
- Domains activated by default: None beyond LC-01.
- Risk of deferring: Low.

---

## WA-01 — Do you communicate with customers via WhatsApp Business?
**Section:** Customer Chat & Messaging
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: WhatsApp (Odoo WhatsApp channel).
- What this means for the implementation: WhatsApp Business API setup, templates (require Meta approval), opt-in flows, phone numbers.
- What the user will need to configure: Meta Business account, verified phone number, template approvals, agent access.
- What stays out of scope: Unofficial WhatsApp integrations.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No WhatsApp scope.
- What the user will need to configure: nothing.
- What stays out of scope: WhatsApp domain.

### If deferred:
- Default assumption used: **No** (`domains: ["whatsapp"]`; default No).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## SM-01 — Do you send SMS messages to customers for marketing or alerts?
**Section:** Customer Chat & Messaging
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: SMS Marketing.
- What this means for the implementation: SMS templates, credit purchase, consent/opt-out tracking.
- What the user will need to configure: SMS credits, sender ID where required, compliance lists.
- What stays out of scope: Two-way SMS platforms beyond Odoo standard.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No SMS scope.
- What the user will need to configure: nothing.
- What stays out of scope: SMS Marketing domain.

### If deferred:
- Default assumption used: **No** (`domains: ["sms-marketing"]`; default No).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## CA-01 — Do your team members need calendar sync with Google Calendar or Microsoft Outlook?
**Section:** Calendar & Scheduling
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Google Calendar**
- Domains activated or affected: Calendar (Google sync connector).
- What this means for the implementation: OAuth to Google; per-user calendar sync.
- What the user will need to configure: OAuth app, user consent, shared calendars.
- What stays out of scope: Outlook sync.

**Microsoft Outlook**
- Domains activated or affected: Calendar (Microsoft sync connector).
- What this means for the implementation: OAuth to Microsoft; per-user calendar sync.
- What the user will need to configure: Microsoft app registration, consent, shared calendars.
- What stays out of scope: Google sync.

**Both**
- Domains activated or affected: Calendar (both connectors).
- What this means for the implementation: Mixed environment.
- What the user will need to configure: both OAuth apps.
- What stays out of scope: Legacy CalDAV outside those two.

**No external calendar sync needed**
- Domains activated or affected: Calendar stays at Odoo defaults; CA-02 hidden.
- What this means for the implementation: Odoo-only calendar usage.
- What the user will need to configure: nothing.
- What stays out of scope: External sync.

### If deferred:
- Default assumption used: **Google Calendar** (`domains: ["calendar"]`).
- Domains activated by default: Calendar (Google).
- Risk of deferring: Assumes Google; redo if wrong.

---

## CA-02 — Do customers book meetings directly from your website?
**Section:** Calendar & Scheduling
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when CA-01 is answered AND not "No external calendar sync needed"

### Answer options and what each does:

**Yes**
- Domains activated or affected: Calendar (Appointments), Website.
- What this means for the implementation: Public appointment types, availability slots, online booking page.
- What the user will need to configure: appointment types, staff availability, reminders.
- What stays out of scope: Paid-appointment / pre-payment flows beyond Odoo standard.

**No**
- Domains activated or affected: Calendar (sync only).
- What this means for the implementation: Internal calendar only.
- What the user will need to configure: nothing.
- What stays out of scope: Public booking.

### If deferred:
- Default assumption used: **No** (`domains: ["calendar"]`; default No).
- Domains activated by default: None beyond CA-01.
- Risk of deferring: Low.

---

## AP-01 — Do you run formal employee performance appraisals?
**Section:** Performance & Appraisals
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Appraisals, HR.
- What this means for the implementation: Review templates, cycles, feedback forms, HR checkpoints.
- What the user will need to configure: review templates, cadence (AP-02), 360 feedback if needed.
- What stays out of scope: External talent platforms.

**No**
- Domains activated or affected: None; AP-02 hidden.
- What this means for the implementation: No Appraisals scope.
- What the user will need to configure: nothing.
- What stays out of scope: Appraisals domain.

### If deferred:
- Default assumption used: **No** (`domains: ["appraisals","hr"]`; default No).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## AP-02 — How often do you run appraisal cycles?
**Section:** Performance & Appraisals
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Only shown when AP-01 = Yes

### Answer options and what each does:

**Monthly**
- Domains activated or affected: Appraisals (monthly cadence).
- What this means for the implementation: 12 cycles/year — heavy process load.
- What the user will need to configure: monthly templates, frequent reminders.
- What stays out of scope: Performance-to-pay link beyond standard.

**Quarterly**
- Domains activated or affected: Appraisals (quarterly cadence).
- What this means for the implementation: 4 cycles/year.
- What the user will need to configure: quarterly templates and scheduled reminders.
- What stays out of scope: Same as above.

**Bi-annually**
- Domains activated or affected: Appraisals (semi-annual cadence).
- What this means for the implementation: 2 cycles/year.
- What the user will need to configure: 2 cycle schedules.
- What stays out of scope: Same as above.

**Annually**
- Domains activated or affected: Appraisals (annual cadence).
- What this means for the implementation: 1 cycle/year.
- What the user will need to configure: annual templates.
- What stays out of scope: Same as above.

### If deferred:
- Default assumption used: **Annually** (`domains: ["appraisals","hr"]`).
- Domains activated by default: Appraisals, HR.
- Risk of deferring: Assumes yearly; if more frequent, reconfigure.

---

## LY-01 — Do you run a customer loyalty programme or sell gift cards?
**Section:** Loyalty & Gift Cards
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Loyalty points programme**
- Domains activated or affected: Loyalty (POS + eCommerce integration).
- What this means for the implementation: Points accrual and redemption rules across POS and website.
- What the user will need to configure: earn/spend ratios, tiers, promotion windows.
- What stays out of scope: Third-party loyalty platforms.

**Gift cards**
- Domains activated or affected: Loyalty (gift-card flow).
- What this means for the implementation: Gift-card SKU, issuance, redemption at POS / eCommerce.
- What the user will need to configure: gift-card products, issuance workflow, balance tracking.
- What stays out of scope: Physical gift-card vendor integrations.

**Both**
- Domains activated or affected: Loyalty (points + gift cards).
- What this means for the implementation: Both flows combined.
- What the user will need to configure: both sets of rules.
- What stays out of scope: Same as above.

**Neither**
- Domains activated or affected: None.
- What this means for the implementation: No Loyalty scope.
- What the user will need to configure: nothing.
- What stays out of scope: Loyalty domain.

### If deferred:
- Default assumption used: **Neither** (`domains: ["loyalty"]`; default keeps it inactive).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## RF-01 — Do you have an employee referral programme for recruitment?
**Section:** Referral Programs
**Required:** Yes
**Can defer:** Yes
**Irreversible:** No
**Condition:** Always shown

### Answer options and what each does:

**Yes**
- Domains activated or affected: Referrals, Recruitment.
- What this means for the implementation: Employee referral links, point/reward tracking tied to hire outcomes.
- What the user will need to configure: reward rules, referral tracking, payout/recognition mechanism.
- What stays out of scope: External referral platforms.

**No**
- Domains activated or affected: None.
- What this means for the implementation: No Referrals scope.
- What the user will need to configure: nothing.
- What stays out of scope: Referrals domain.

### If deferred:
- Default assumption used: **No** (`domains: ["referrals","recruitment"]`; default No).
- Domains activated by default: None.
- Risk of deferring: Low.

---

## Summary

- Questions documented: 78 of 78 in the current `QUESTIONS` array.
- The brief referenced 86 questions; the difference of 8 is not present in the current source and has not been fabricated.
- No question's impact required an "impact to be confirmed" dead-end; two options carried narrow caveats:
  - **BM-01 "Platform or marketplace"** — marketplace-specific activation nuances noted as "impact to be confirmed" against the engine since the engine does not encode a dedicated marketplace path.
  - **MF-02 and MF-06** — `deferredDefault` is present on the wizard entry but not in the top-level `DEFERRED_DEFAULTS` map; documented as per-question default.
