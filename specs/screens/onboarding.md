# Onboarding Wizard — Screen Flow Specification

**Governing source:** specs/discovery_question_framework.md (question authority),
app/shared/domain-activation-engine.js (activation rules),
app/shared/industry-templates.js (industry templates).

**Scope:** Business Assessment (Stage 2). Covers industry selection, question wizard,
and confirmation. Does not cover Stage 1 (Foundation) or Stage 3+ flows.

---

## Screen 1 — Industry Selector

### Purpose

Pre-populate a baseline set of `recommended_domains` in `discovery_answers` before
the question wizard begins. This is a convenience shortcut, not a domain activation.
Final domain activation is always derived from question answers by the activation
engine; the industry selection is not binding.

### Layout

Four cards displayed in a 2x2 grid (or single column on narrow viewports).

| Card | id | Label | Description |
|------|----|-------|-------------|
| 1 | `manufacturing` | Manufacturing & Production | For businesses that make products: composites, components, assemblies |
| 2 | `retail` | Retail & POS | For shops with physical stores and online sales |
| 3 | `distribution` | Distribution & Wholesale | For businesses that buy and sell without manufacturing |
| 4 | `services` | Services & Projects | For businesses selling time and expertise |

### Pre-population on selection

Each card selection writes the following into `discovery_answers.industry_template`
and sets the corresponding `recommended_domains` hint. These values are advisory only.

**Manufacturing selected:**
- `industry_template`: `"manufacturing"`
- `recommended_domains` hint: `["manufacturing", "purchase", "inventory", "sales", "accounting", "quality"]`

**Retail selected:**
- `industry_template`: `"retail"`
- `recommended_domains` hint: `["pos", "inventory", "sales", "website_ecommerce", "accounting", "crm"]`

**Distribution selected:**
- `industry_template`: `"distribution"`
- `recommended_domains` hint: `["purchase", "sales", "inventory", "accounting", "crm"]`

**Services selected:**
- `industry_template`: `"services"`
- `recommended_domains` hint: `["projects", "sales", "accounting", "hr", "crm"]`

### Proceeding

A "Continue" button is enabled as soon as one card is selected. No card is
pre-selected on first load. Selecting a card does not auto-advance; the user
must press Continue. The user may change selection before pressing Continue.

---

## Screen 2–N — Question Wizard

### Structure

Each question occupies a full wizard step. A progress indicator shows current
step number and total unconditional steps remaining (conditional steps are added
to the count only once their trigger condition is met).

Steps are presented in the order defined in this spec. Conditional steps are
inserted inline at the point their condition fires, not deferred to the end.

### Handling unanswered questions

If a user cannot answer a question at this time, they may mark it "Come back to
this" which leaves the answer as null. Required questions marked this way block
progression past the wizard's final screen — the summary step will show them as
incomplete and the Confirm button will be disabled until all Required questions
are answered.

### Deferred answer behaviour

#### "I don't know yet" option

Every question step exposes a secondary action below the primary answer controls:

> "I don't know yet — skip for now"

Appearance: a text link or ghost button, visually distinct from the primary answer
options. It is not the default and must be a deliberate secondary action. It is
not shown on irreversible questions (BM-03, MF-01) — those questions require an
answer or an explicit "Go back" only.

Selecting "I don't know yet":
- Records the question as `deferred: true` in the runtime state with `answer: null`
- Advances to the next question step without requiring an answer
- Does not activate any domain immediately — domain activation from this question
  is resolved at the summary screen using the maximum-scope default rule (see below)

#### Domain defaults when deferred

When a question is deferred, the wizard assumes the answer that produces the
largest possible activation scope for all domains this question could have
triggered. This ensures the implementation surface is never smaller than necessary.

Per-question defaults:

| Question | Deferred default |
|----------|-----------------|
| BM-01 | "Both physical products and services" — activates Inventory, Sales, Purchase, Projects, CRM tracks |
| BM-02 | Yes — Foundation multi-company flag; Users/Roles cross-company policy |
| BM-04 | Yes — Accounting multi-currency activation |
| BM-05 | > 50 — Users/Roles formal segregation of duties; Approvals domain candidate |
| RM-01 | All options selected — Sales, Subscriptions, Projects, Rental, POS, Website/eCommerce all treated as candidates |
| RM-02 | Yes — Projects timesheets activation; HR candidate |
| RM-03 | Yes — Subscriptions domain activation |
| RM-04 | Yes — Rental domain activation; Inventory linkage |
| OP-01 | Yes — Inventory domain activation (Go-Live priority) |
| OP-02 | > 5 — Inventory advanced route design; escalation flag |
| OP-03 | Yes — POS domain activation (Go-Live priority) |
| OP-04 | Yes — Website/eCommerce domain activation |
| OP-05 | Yes — Field Service domain activation; Projects linkage; Repairs candidate |
| SC-01 | Yes — CRM domain activation |
| SC-02 | Yes — Sales approval configuration; Users/Roles approver role; Approvals candidate |
| SC-03 | Yes — Sales pricelists activation |
| SC-04 | "Discounts require manager approval above a threshold" — Users/Roles discount approver role; Sales approval threshold |
| PI-01 | Yes — Purchase domain activation |
| PI-02 | "All purchase orders require manager approval" — Users/Roles purchase manager role; all PO confirmation blocked |
| PI-03 | "3 steps" — Inventory 3-step route; Quality domain candidate; MF-06 triggered |
| PI-04 | "Both lot and serial number tracking" — Inventory per-product traceability |
| PI-05 | Yes — Inventory drop-ship route; Purchase vendor-to-customer flow |
| FC-01 | "Full accounting" — Finance domain activation (Go-Live priority); all Finance checkpoints active |
| FC-02 | FIFO — Finance perpetual valuation; Inventory go-live blocked until Finance valuation checkpoints pass |
| FC-03 | Yes — Purchase billing policy based on receipts; Finance invoice matching; Users/Roles AP role |
| FC-04 | Yes — Finance fiscal year end date configuration required |
| FC-05 | Yes — Accounting analytic accounting activation; Projects analytic account per project |
| FC-06 | Yes — Accounting payment terms configuration; Sales customer payment terms linkage |
| TA-01 | All role separations selected — all Users/Roles checkpoint types active; HR candidate |
| TA-02 | Yes — Users/Roles team-based record rule design; CRM and Sales team visibility |
| TA-03 | All non-None options selected — Approvals domain activation; Sign domain activation; Documents candidate; HR candidate |
| TA-04 | No default possible — text field; flagged as incomplete; Confirm button blocked |

Conditional questions that are deferred when their trigger condition is also
deferred: the deferred default of the trigger question activates the conditional
question, which is then also resolved using its maximum-scope default.

#### Summary screen — surfacing defaulted activations

The summary screen's "Domains that will be activated" section (see Screen Final
below) adds a distinct subsection when any question was deferred:

**"Domains activated by default — unanswered questions"**

This subsection lists:
- Each domain activated because of a deferred question
- The question ID that triggered the default (e.g., "BM-01 — deferred")
- The default assumption applied (e.g., "Assumed: Both physical products and
  services")
- A link to return to that question and answer it

The subsection is shown in a visually distinct style (amber/warning tone) to
distinguish it from domains activated by explicit answers.

#### Acknowledgement required before pipeline trigger

Before the "Confirm and Run Pipeline" button becomes active, the user must:

1. Check a distinct acknowledgement checkbox (separate from the general
   commitment statement) with the label:
   "I acknowledge that [N] domain(s) have been activated by default because I
   deferred [M] question(s). I understand the implementation scope may be
   larger than necessary and I can reduce it by answering those questions
   before confirming."

   Where N = count of domains activated by default, M = count of deferred
   questions.

2. This checkbox is only shown when at least one question was deferred. It does
   not appear if all questions were answered.

#### Deferred questions in runtime state

Each deferred question is stored in the runtime state under `discovery_answers`
as:

```json
{
  "BM-01": { "answer": null, "deferred": true }
}
```

The `deferred: true` flag persists across sessions. On session resume, the wizard
surfaces deferred questions at the start of the question wizard with a banner:
"You have [N] unanswered question(s) from a previous session. Answer them to
refine your implementation scope."

---

### Section 1 — Business Model

**Step BM-01** (unconditional, required)

Question: What best describes what your business sells?

Input type: single-select

Options:
- Physical products only
- Services only
- Both physical products and services
- Software or digital products only
- Platform or marketplace (connecting buyers and sellers)

Domain impact (shown to user as informational only):
- Physical products only → Inventory, Sales, Purchase candidates
- Services only → Projects, CRM candidates; Inventory excluded unless OP-01 overrides
- Both → all three tracks active
- Software/digital → Sales, Subscriptions candidates; Inventory excluded
- Platform/marketplace → flag for escalation (see ambiguity note below)

---

**Step BM-02** (unconditional, required)

Question: Does your business operate as more than one legal entity?

Input type: boolean (Yes / No)

Domain impact: Foundation multi-company flag; Users/Roles cross-company policy.

---

**Step BM-03** (unconditional, required)

Question: In which country is your primary business legally registered and operating?

Input type: text / country selector

Domain impact: Foundation localization package; Accounting chart of accounts template.

Note: This answer is irreversible after accounting entries are posted. The wizard
must show a confirmation notice on this step before the user can advance.

#### Irreversible Decision Warning Screen — BM-03

Shown: after the user enters or selects a country value and presses the step's
"Continue" button. The warning screen replaces the next question step until the
user explicitly acknowledges.

**What the warning shows:**

Header: "This decision cannot be changed after accounting entries are posted."

Body — domains affected (always shown):
- Foundation: The localization package for the selected country (e.g., l10n_au,
  l10n_gb, l10n_us) will be applied. This sets the chart of accounts template,
  default tax configuration, fiscal position baseline, and legal reporting
  requirements for your entire implementation.
- Accounting: The chart of accounts template, tax rule baseline, and bank
  statement format are derived from this selection. Changing the country after
  accounting entries are posted is not supported.
- All domains: The default currency for every domain is set by this selection.

Body — implementation sequence impact:
- Confirming this answer locks the localization package for the Foundation
  domain. The Foundation domain's localization checkpoint cannot be re-run
  against a different country after accounting entries exist.
- If you are not certain of the primary operating country, do not proceed.
  Defer this question and confirm with the legal or finance owner before
  continuing.

**Acknowledgement button:** "I understand — this country selection is permanent after
accounting entries are posted. Confirm [selected country] and continue."

Pressing the acknowledgement button: advances to BM-04. The warning is not shown
again for BM-03 in this session.

Pressing "Go back": returns to the BM-03 country selector without recording the
answer.

---

**Step BM-04** (unconditional, required)

Question: Do you transact with customers or suppliers in currencies other than your
primary operating currency?

Input type: boolean (Yes / No)

Domain impact: Accounting multi-currency activation.

---

**Step BM-05** (unconditional, required)

Question: How many people will use Odoo (approximate total user count)?

Input type: numeric (integer, minimum 1)

Domain impact: Users/Roles complexity tier; HR activation candidate (> 10);
Documents and Approvals candidates (> 50).

---

### Section 2 — Revenue Model

**Step RM-01** (unconditional, required)

Question: How does your business primarily earn revenue?

Input type: multi-select

Options:
- One-time product sales
- One-time service delivery
- Recurring subscriptions or contracts
- Project-based billing (time and materials or fixed price)
- Rental of assets or equipment
- Point-of-sale (retail, walk-in, or counter sales)
- Online store (customers place orders via a website)

Domain impact: Sales (most options), Subscriptions, Projects, Rental, POS,
Website/eCommerce — each option maps to a specific domain activation rule in
the activation engine.

---

**Step RM-02** (unconditional, required)

Question: Do you bill customers based on hours worked or time spent on their account?

Input type: boolean (Yes / No)

Domain impact: Projects (timesheets activation); HR candidate.

---

**Step RM-03** (unconditional, required)

Question: Do any of your customers pay on a recurring schedule under a defined
contract or plan?

Input type: boolean (Yes / No)

Domain impact: Subscriptions domain activation.

---

**Step RM-04** (unconditional, required)

Question: Do you rent physical assets or equipment to customers for defined time
periods?

Input type: boolean (Yes / No)

Domain impact: Rental domain activation; Inventory linkage.

---

### Section 3 — Operations

**Step OP-01** (unconditional, required)

Question: Do you physically store and track stock of products you buy, sell, or
manufacture?

Input type: boolean (Yes / No)

Domain impact: Inventory domain activation (go-live priority if Yes).

---

**Step OP-02** (conditional, required when OP-01 = Yes)

Condition: shown only when OP-01 = Yes.

Question: How many physically distinct warehouse or stock locations do you operate?

Input type: numeric (integer, minimum 1)

Domain impact: Inventory route complexity tier.

---

**Step OP-03** (unconditional, required)

Question: Do you sell directly to customers at a physical counter, till, or retail
point?

Input type: boolean (Yes / No)

Domain impact: POS domain activation (go-live priority if Yes).

---

**Step OP-04** (unconditional, required)

Question: Do customers place orders through a website or web shop that you operate?

Input type: boolean (Yes / No)

Domain impact: Website/eCommerce domain activation.

---

**Step OP-05** (unconditional, required)

Question: Do you dispatch staff to perform work at customer sites, and do you need
to track or invoice those activities?

Input type: boolean (Yes / No)

Domain impact: Field Service domain activation; Projects linkage; Repairs candidate.

---

### Section 4 — Sales & CRM

**Step SC-01** (unconditional, required)

Question: Do your salespeople manage a defined pipeline of prospects and
opportunities before a sale is confirmed?

Input type: boolean (Yes / No)

Domain impact: CRM domain activation.

---

**Step SC-02** (unconditional, required)

Question: Do sales quotations or orders require internal approval before being
confirmed or sent to the customer?

Input type: boolean (Yes / No)

Domain impact: Sales approval configuration; Users/Roles approver role; Approvals
domain candidate (if BM-05 > 50).

---

**Step SC-03** (unconditional, required)

Question: Do you apply different prices to different customers, customer groups, or
order quantities?

Input type: boolean (Yes / No)

Domain impact: Sales pricelists activation.

---

**Step SC-04** (unconditional, required)

Question: Can salespeople apply discounts to sales lines, or is discounting
controlled by a manager?

Input type: single-select

Options:
- Salespeople can apply any discount freely
- Discounts require manager approval above a threshold
- Discounting is not permitted

Domain impact: Users/Roles discount approver role; Sales discount threshold
configuration; Approvals candidate.

---

### Section 5 — Procurement & Inventory

**Step PI-01** (unconditional, required)

Question: Do you purchase goods or services from external suppliers using purchase
orders?

Input type: boolean (Yes / No)

Domain impact: Purchase domain activation.

---

**Step PI-02** (conditional, required when PI-01 = Yes)

Condition: shown only when PI-01 = Yes.

Question: Do purchase orders require approval before being sent to suppliers?

Input type: single-select

Options:
- No approval required — purchasers can confirm freely
- Approval required above a monetary threshold
- All purchase orders require manager approval

Domain impact: Users/Roles purchase manager role; Approvals candidate.

---

**Step PI-03** (conditional, required when PI-01 = Yes and OP-01 = Yes)

Condition: shown only when PI-01 = Yes AND OP-01 = Yes.

Question: When goods arrive from suppliers, how do you receive them?

Input type: single-select

Options:
- Receive directly into stock (1 step)
- Receive into a dock/input area, then transfer to stock (2 steps)
- Receive into dock, quality check or sort, then put away (3 steps)

Domain impact: Inventory incoming route configuration; Quality domain candidate
(3-step path triggers MF-06).

---

**Step PI-04** (conditional, required when OP-01 = Yes)

Condition: shown only when OP-01 = Yes.

Question: Do you need to track individual units or batches of products through
their lifecycle?

Input type: single-select

Options:
- No traceability needed
- Batch/lot tracking (groups of items)
- Serial number tracking (individual unit-level)
- Both lot and serial number tracking on different products

Domain impact: Inventory traceability configuration; Quality inspection granularity.

---

**Step PI-05** (unconditional, required)

Question: Do you ever ship products directly from your supplier to your customer
without the goods passing through your warehouse?

Input type: boolean (Yes / No)

Domain impact: Inventory drop-ship route; Purchase vendor-to-customer flow; Sales
activation (independent trigger).

---

### Section 6 — Manufacturing (conditional section)

This entire section is only presented when BM-01 includes physical products (i.e.,
BM-01 is not "Services only" and not "Software or digital products only").

---

**Step MF-01** (conditional, required when BM-01 includes physical products)

Condition: shown when BM-01 = "Physical products only" OR "Both physical products
and services".

Question: Does your business manufacture, assemble, kit, or produce any of the
products it sells?

Input type: boolean (Yes / No)

Domain impact: Manufacturing domain activation (sole gate — R6 of activation
engine). If Yes, all remaining MF steps activate.

Note: This is an irreversible downstream configuration decision. The wizard must
show a confirmation notice before the user can advance.

#### Irreversible Decision Warning Screen — MF-01

Shown: after the user selects Yes or No and presses the step's "Continue"
button. The warning screen replaces the next question step until the user
explicitly acknowledges. The warning is shown for both Yes and No because both
outcomes are irreversible.

**What the warning shows (Yes selected):**

Header: "Activating Manufacturing changes your implementation sequence permanently."

Body — domains activated:
- Manufacturing (MRP): activated at Go-Live priority. Bills of Materials,
  work centers, production orders, and manufacturing stock movements are all
  in scope. All MF-02 through MF-07 questions will be presented.
- Inventory: production stock movements become required. The Inventory domain
  must be configured and at a checkpoint-passing state before Manufacturing
  go-live.
- Accounting / Finance: production costing and Work-In-Progress (WIP) policy
  become required configuration items. The Finance domain's valuation
  checkpoints must pass before Manufacturing go-live.

Body — implementation sequence impact:
- Manufacturing is a Go-Live domain. It cannot be deferred to a later phase
  without a formal scope change.
- Inventory and Finance/Accounting domain checkpoints become blocking
  dependencies for Manufacturing go-live.
- Choosing Yes and later discovering the business does not manufacture will
  require a scope change to remove the Manufacturing domain.

**What the warning shows (No selected):**

Header: "Excluding Manufacturing removes all production configuration from your
implementation."

Body — domains excluded:
- Manufacturing (MRP): excluded from scope. No Bills of Materials, work
  orders, or production costing will be configured.
- All MF-02 through MF-07 questions will be skipped.

Body — implementation sequence impact:
- If your business later begins manufacturing, re-adding the Manufacturing
  domain after go-live requires a formal scope change and a new implementation
  stage for Manufacturing setup.

**Acknowledgement button (Yes):** "I understand — Manufacturing is a Go-Live domain
and its activation is permanent under this project scope. Confirm Yes and continue."

**Acknowledgement button (No):** "I understand — Manufacturing is excluded and all
MF steps will be skipped. Confirm No and continue."

Pressing the acknowledgement button: advances to the next question step (MF-02
if Yes; next non-manufacturing section if No). The warning is not shown again for
MF-01 in this session.

Pressing "Go back": returns to the MF-01 Yes/No selector without recording the
answer.

**Spec note — MF-01 symmetry:** Both Yes and No answers to MF-01 are treated as
irreversible because adding or removing Manufacturing post-go-live requires a
governed domain rebuild regardless of direction. The warning is shown for both
paths by design.

---

**Step MF-02** (conditional, required when MF-01 = Yes)

Condition: shown only when MF-01 = Yes.

Question: How complex are your Bills of Materials?

Input type: single-select

Options:
- Single-level (finished product made from raw materials only)
- Multi-level (components are themselves assembled from sub-components)
- Phantom/kitting only (no production order needed, just bundle packaging)

Domain impact: Manufacturing planning depth; Accounting WIP policy.

---

**Step MF-03** (conditional, required when MF-01 = Yes)

Condition: shown only when MF-01 = Yes.

Question: Do you track work time or machine time at specific production stations
or work centers?

Input type: boolean (Yes / No)

Domain impact: Manufacturing work center activation; Maintenance domain candidate
(gates MF-07).

---

**Step MF-04** (conditional, required when MF-01 = Yes)

Condition: shown only when MF-01 = Yes.

Question: Do you send materials to a third-party manufacturer or finisher who
returns completed goods to you?

Input type: boolean (Yes / No)

Domain impact: Purchase subcontracting flow; Inventory subcontractor location.

---

**Step MF-05** (conditional, required when MF-01 = Yes)

Condition: shown only when MF-01 = Yes.

Question: Are changes to your product structures subject to a formal approval
process before being released to production?

Input type: boolean (Yes / No)

Domain impact: PLM domain activation; Documents domain candidate; Users/Roles ECO
approver role.

---

**Step MF-06** (conditional, required when MF-01 = Yes or PI-03 = 3 steps)

Condition: shown when MF-01 = Yes OR PI-03 answer = "Receive into dock, quality
check or sort, then put away (3 steps)".

Question: Do you perform quality checks on incoming materials, during production,
or on finished goods before dispatch?

Input type: multi-select

Options:
- On receipt from supplier
- During manufacturing (in-process inspection)
- On finished goods before dispatch
- None — quality is managed externally or not required in Odoo

Domain impact: Quality domain activation (any selection except "None" activates it).

---

**Step MF-07** (conditional, required when MF-03 = Yes)

Condition: shown only when MF-03 = Yes.

Question: Do you schedule and track preventive or corrective maintenance on
production equipment?

Input type: boolean (Yes / No)

Domain impact: Maintenance domain activation.

---

### Section 7 — Finance Complexity

**Step FC-01** (unconditional, required)

Question: How will your business use Odoo for financial management?

Input type: single-select

Options:
- Full accounting (general ledger, journals, reconciliation, reporting)
- Invoicing only (send invoices and track payments, no general ledger)
- Not using Odoo for financials (external accounting system)

Domain impact: Accounting domain activation (go-live if full; recommended if
invoicing only; excluded if external).

---

**Step FC-02** (conditional, required when OP-01 = Yes and FC-01 = Full accounting)

Condition: shown only when OP-01 = Yes AND FC-01 = "Full accounting".

Question: What method do you use to value your inventory?

Input type: single-select

Options:
- Standard Price (fixed cost per product)
- Average Cost — AVCO (cost updated on each receipt)
- First In First Out — FIFO (cost follows the oldest receipt price)
- Not applicable (services business or no stock tracking)

Domain impact: Accounting valuation journals; Inventory go-live sequencing (FIFO/AVCO
block Inventory until Accounting valuation checkpoints pass).

Note: Costing method can be changed after setup until stock transactions
exist on a product category. A warning will be shown at the point
of change if transactions are detected, not during onboarding.

---

**Step FC-03** (conditional, required when PI-01 = Yes and FC-01 = Full accounting)

Condition: shown only when PI-01 = Yes AND FC-01 = "Full accounting".

Question: Do you require purchase orders, goods receipts, and supplier invoices to
be formally matched before a supplier invoice is approved for payment?

Input type: boolean (Yes / No)

Domain impact: Purchase billing policy; Accounting supplier invoice matching;
Users/Roles accounts payable role.

---

**Step FC-04** (unconditional, required)

Question: Does your fiscal year end on a date other than 31 December?

Input type: boolean (Yes / No)

Domain impact: Accounting fiscal year end date configuration.

---

**Step FC-05** (unconditional, required)

Question: Do you need to track revenues and costs against projects, departments,
cost centres, or campaigns separately from your main chart of accounts?

Input type: boolean (Yes / No)

Domain impact: Accounting analytic accounting activation; Projects analytic account
per project.

---

**Step FC-06** (unconditional, required)

Question: Do you offer customers defined payment terms?

Input type: boolean (Yes / No)

Domain impact: Accounting payment terms configuration; Sales customer payment
terms linkage.

---

### Section 8 — Team & Access Structure

**Step TA-01** (unconditional, required)

Question: Which of the following roles need to be separated so that different
people have different access in Odoo?

Input type: multi-select

Options:
- Salespeople vs. Sales Managers
- Purchasers vs. Purchase Managers
- Warehouse Operators vs. Inventory Managers
- Accounts Payable vs. Accounts Receivable vs. Finance Managers
- Production Operators vs. Manufacturing Managers
- HR Officers vs. HR Managers
- System Administrator (separate from all operational roles)

Domain impact: Users/Roles checkpoint design; HR domain candidate.

---

**Step TA-02** (unconditional, required)

Question: Do any departments or teams need to be restricted from seeing each
other's records?

Input type: boolean (Yes / No)

Domain impact: Users/Roles team-based record rule design; CRM and Sales team
visibility configuration.

---

**Step TA-03** (unconditional, required)

Question: Beyond sales and purchase approvals already asked, are there other
operational actions that require a formal second approval before execution?

Input type: multi-select

Options:
- Inventory adjustments above a threshold
- Expenses above a threshold
- Manufacturing order creation or close
- HR leave requests
- Contract or document signing
- None — standard module approvals are sufficient

Domain impact: Approvals domain activation (any non-None selection); Sign domain
activation ("Contract or document signing"); Documents domain candidate; HR candidate.

---

**Step TA-04** (unconditional, required)

Question: Who is the designated Odoo system administrator?

Input type: text (name and role/title)

Domain impact: Users/Roles admin user checkpoint; Foundation admin credentials
context.

---

## Screen Final — Summary and Confirm

### Purpose

Show the user exactly which domains will be activated based on their answers,
what they are committing to, and require explicit confirmation before the pipeline
is triggered.

### Sections

**1. Answers reviewed**

A collapsible list of all questions answered, grouped by section. Each answer is
shown in read-only form. An "Edit" link returns the user to that specific step.
Unanswered Required questions are flagged in red. The Confirm button is disabled
until all Required questions have answers.

**2. Domains that will be activated**

A list of domains the activation engine will activate, derived by running the
activation engine against the collected answers. Each domain shows:
- Domain name
- Activation reason (which question(s) triggered it)
- Priority tier (go-live / required / recommended / optional)
- Whether deferral is eligible

Domains with `missing_required_input` activation_reason are listed separately
as "Cannot activate — required answer missing" and block confirmation.

**3. Commitment statement**

A plain-text paragraph explaining that confirming this screen:
- Locks the discovery answers as the project business profile
- Triggers a pipeline run that activates the listed domains
- Cannot be undone without raising a formal scope change

**4. Defaulted activations acknowledgement (conditional)**

Shown only when at least one discovery question was deferred.

A distinct acknowledgement checkbox above the Confirm button with the label:
"I acknowledge that [N] domain(s) have been activated by default because I
deferred [M] question(s). I understand the implementation scope may be larger
than necessary and I can reduce it by answering those questions before confirming."

Where N = count of domains activated by default due to deferred questions,
M = count of deferred questions.

This checkbox must be checked before the Confirm button becomes active. It is
separate from the commitment statement and must be a distinct interaction. It is
not shown if all questions were answered.

**5. Confirm button**

Label: "Confirm and Run Pipeline"

Enabled only when:
- All Required questions have answers
- No domain has `activation_reason = missing_required_input`
- User has scrolled to or acknowledged the commitment statement
- If any questions were deferred: the defaulted activations acknowledgement
  checkbox is checked

On click: posts collected answers to the governed pipeline endpoint with the
industry_template and discovery_answers payload. Does not execute directly —
the pipeline run is governed by the standard preview / safety class /
auditability confirmation flow (R1).

---

## Ambiguities and missing repo evidence

1. **Platform/marketplace (BM-01 option):** The activation engine has no activation
   rule for this BM-01 value. The discovery framework says "escalate to project
   owner." There is no governed escalation flow defined in the repo. This option
   should either be excluded from the wizard UI or shown with a hard blocker
   message that prevents progression until a project owner has been consulted.
   The spec cannot define what happens next without a governing rule.

2. **Subscriptions domain:** The discovery framework (RM-03 = Yes) activates
   Subscriptions. The activation engine does not contain an `activateSubscriptions`
   function — the domain is listed in DOMAIN_IDS as `"subscriptions"` but has no
   corresponding activation function in the engine file read. Either the function
   exists outside the portion read or it is not yet implemented. This must be
   verified before the wizard can display a Subscriptions activation outcome.

3. **Rental domain:** Same issue as Subscriptions — RM-04 = Yes is defined in the
   framework as activating Rental, but no `activateRental` function was observed
   in the engine. Verify engine coverage before spec is treated as complete.

4. **Field Service domain:** OP-05 = Yes activates Field Service per the framework.
   No `activateFieldService` function was observed in the engine portion read.
   Same verification required.

5. **Repairs domain:** The activation engine activates Repairs on OP-01 = Yes AND
   (RM-01 includes "One-time service delivery" OR OP-05 = Yes). The discovery
   framework does not have an explicit "Do you do repairs?" question — Repairs
   activation is inferred from the combination of OP-01 and service delivery
   presence. The wizard should not show Repairs as a user-facing question; it
   surfaces only on the summary screen as an automatically derived domain.

6. **MF-06 trigger condition phrasing:** The framework says MF-06 is shown when
   "MF-01 = Yes OR PI-03 = 3 steps." The activation engine checks `mf06Answered`
   directly and does not enforce the conditional display logic — that logic must
   live in the wizard display layer. The wizard must implement the exact condition:
   show MF-06 if and only if MF-01 = Yes OR PI-03 = "3 steps" option selected.

7. **Confirmation notices for irreversible decisions:** BM-03 and MF-01 are
   flagged in the framework as irreversible. The spec requires a confirmation
   notice on each of these steps. FC-02 (costing method) is not treated as
   irreversible at onboarding — see FC-02 note above. The exact copy and UX
   pattern for BM-03 and MF-01 notices are not defined in any repo document —
   this is a design decision that must be made before implementation.

8. **"Come back to this" / deferred answers:** The framework says Required questions
   are hard blockers for stage exit. The wizard must implement a mechanism to allow
   partial save without blocking the session, while clearly surfacing which
   questions remain unanswered. No existing UI pattern for this was found in the
   repo — this is a new UX component.
