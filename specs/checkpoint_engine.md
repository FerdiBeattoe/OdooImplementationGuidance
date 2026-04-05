# Checkpoint Engine

## Purpose

This document defines the engine that converts each activated domain into concrete,
governed checkpoint objects. It is the bridge between the Domain Activation Engine
(which decides *which* domains are in scope) and the operational platform (which
presents, validates, blocks, defers, previews, and executes checkpoint-governed work).

Every checkpoint produced by this engine must be state-model-ready
(`docs/08_Project_State_Model.md`), validation-rule-compliant
(`docs/05_Validation_Checkpoint_Rules.md`), and checkpoint-to-execution-compliant
(`docs/06_Checkpoint_and_Validation_Rules.md`).

---

## Part 1 — Global Checkpoint Object Schema

Every checkpoint in the platform is represented by a single object conforming to the
schema below. No checkpoint may omit any required field. Fields marked `(computed)`
are derived by the engine at runtime; fields marked `(set-at-creation)` are fixed when
the checkpoint is generated.

```
{
  // === IDENTITY ===

  checkpoint_id:            string (required, set-at-creation)
    // Format: {DOMAIN_PREFIX}-{CLASS_CODE}-{SEQUENCE}
    // Example: ACCT-FOUND-001, INV-DREQ-002, MRP-GL-003
    // DOMAIN_PREFIX: see Domain Prefix Table
    // CLASS_CODE: FOUND | DREQ | GL | REC | OPT
    // SEQUENCE: 3-digit zero-padded integer, unique within domain+class

  domain:                   string (required, set-at-creation)
    // Domain ID from Domain Activation Engine
    // Must match an activated domain in the current project scope

  checkpoint_name:          string (required, set-at-creation)
    // Short operational name (max 80 chars)
    // Must describe a specific verifiable state, NOT an action
    // Good: "Warehouse Structure Defined"
    // Bad:  "Set up warehouses"

  // === CLASSIFICATION ===

  checkpoint_class:         enum (required, set-at-creation)
    // One of: Foundational | Domain_Required | Go_Live | Recommended | Optional
    // Governs progression blocking behavior per Validation Checkpoint Rules

  // === STATUS ===

  status:                   enum (required, computed)
    // One of: Not_Started | In_Progress | Blocked | Ready_For_Review |
    //         Complete | Deferred
    // Transitions governed by Status Transition Rules (Part 2)

  // === VALIDATION ===

  validation_source:        enum (required, set-at-creation)
    // One of: System_Detectable | User_Confirmed | Both
    // System_Detectable: evidence can be derived from verifiable system state
    // User_Confirmed: evidence requires explicit human confirmation
    // Both: system state AND human confirmation are both required

  evidence_required:        array<string> (required, set-at-creation)
    // List of specific evidence items needed for this checkpoint to pass
    // Each item must be verifiable — no vague descriptions
    // Example: ["Fiscal year start date recorded",
    //           "Fiscal year end date recorded",
    //           "Fiscal year matches legal reporting calendar"]

  // === OWNERSHIP ===

  checkpoint_owner:         enum (required, set-at-creation)
    // One of: project_owner | implementation_lead | domain_lead |
    //         process_owner | system_administrator
    // Determines who is accountable for completing this checkpoint

  // === BLOCKING ===

  blocker_flag:             boolean (required, computed)
    // true when this checkpoint cannot proceed due to unresolved conditions

  blocked_reason:           string | null (required when blocker_flag = true)
    // Human-readable explanation of why this checkpoint is blocked
    // Must reference specific unmet conditions, not generic explanations

  // === DEFERMENT ===

  deferment_allowed:        boolean (required, set-at-creation)
    // true if this checkpoint can be deferred to a later phase
    // Foundational and Domain_Required checkpoints: always false
    // Go_Live: false unless domain-specific override exists
    // Recommended and Optional: true unless dependency constraint applies

  deferment_constraints:    array<string> | null (required when deferment_allowed = true)
    // Conditions that must be met or recorded for valid deferment
    // Example: ["Project owner sign-off recorded",
    //           "Deferred scope does not invalidate go-live path",
    //           "Review point date recorded"]

  // === DEPENDENCIES ===

  dependencies:             array<checkpoint_id> (required, set-at-creation)
    // List of checkpoint IDs that must reach Complete or Deferred status
    // before this checkpoint can transition past Not_Started
    // Empty array [] means no checkpoint dependencies (domain-level
    // dependencies from Domain Activation Engine still apply)

  // === IMPACT ===

  downstream_impact_summary: string (required, set-at-creation)
    // Concise description of what downstream domains, checkpoints, or
    // configuration decisions are affected by this checkpoint's outcome
    // Must reference specific domains or checkpoint IDs, not generic
    // "affects everything" statements

  // === GUIDANCE & TRAINING ===

  guidance_required:        boolean (required, set-at-creation)
    // true if this checkpoint requires contextual guidance content to be
    // presented before the user makes decisions or provides evidence
    // Foundational and cross-domain-impact checkpoints: always true

  training_available:       boolean (required, set-at-creation)
    // true if training content exists for this checkpoint's subject
    // Training is opt-in unless project owner mandates it

  // === EXECUTION RELEVANCE ===

  execution_relevance:      enum (required, set-at-creation)
    // One of: None | Informational | Executable
    // None: checkpoint is decision/evidence only, no system writes
    // Informational: checkpoint informs downstream execution but has no
    //   direct execution actions of its own
    // Executable: checkpoint governs one or more previewable write actions

  preview_required:         boolean (required, set-at-creation)
    // true if this checkpoint governs executable actions that require
    // preview before execution
    // Must be true when execution_relevance = Executable
    // Must be false when execution_relevance = None

  safety_class:             enum (required, set-at-creation)
    // One of: Safe | Conditional | Blocked | Not_Applicable
    // Safe: low-risk, forward-safe, previewable, no blocked checkpoint bypass
    // Conditional: depends on explicit preconditions, confirmations, or
    //   deployment constraints
    // Blocked: out of scope, would bypass critical checkpoints, or cannot
    //   produce a truthful preview
    // Not_Applicable: checkpoint has no execution relevance

  // === DECISION LINKAGE ===

  linked_decision_types:    array<string> (required, set-at-creation)
    // Types of decisions this checkpoint captures or depends on
    // Values from: business_policy | technical_configuration |
    //   financial_policy | access_policy | operational_policy |
    //   deployment_decision | owner_confirmation | integration_decision
    // Empty array only when checkpoint is purely system-detectable
    //   with no human decision component

  // === STATE LINKAGE ===

  linked_state_fields:      array<string> (required, set-at-creation)
    // Project state model fields this checkpoint reads from or writes to
    // References fields in docs/08_Project_State_Model.md
    // Example: ["checkpoint_state.status",
    //           "checkpoint_state.evidence_status",
    //           "checkpoint_state.blocker_flag"]
    // Minimum: ["checkpoint_state.status", "checkpoint_state.evidence_status"]
}
```

### Domain Prefix Table

| Domain ID | Prefix |
|---|---|
| foundation | FND |
| users_roles | USR |
| master_data | MAS |
| crm | CRM |
| sales | SAL |
| purchase | PUR |
| inventory | INV |
| manufacturing | MRP |
| plm | PLM |
| accounting | ACCT |
| pos | POS |
| website_ecommerce | WEB |
| projects | PRJ |
| hr | HR |
| quality | QUA |
| maintenance | MNT |
| repairs | REP |
| documents | DOC |
| sign | SGN |
| approvals | APR |
| subscriptions | SUB |
| rental | RNT |
| field_service | FSV |

---

## Part 2 — Status Transition Rules

Checkpoints follow a strict state machine. No transition outside this table is
permitted.

```
From             → To                  Conditions
─────────────────────────────────────────────────────────────────────────
Not_Started      → In_Progress         All dependency checkpoints are Complete
                                       or Deferred; domain-level blockers resolved
Not_Started      → Blocked             Dependency checkpoint is not Complete/Deferred;
                                       OR domain-level blocker is active
In_Progress      → Ready_For_Review    All evidence_required items are provided;
                                       validation_source requirements met
In_Progress      → Blocked             Dependency or domain-level blocker activates
                                       while work is in progress
In_Progress      → Deferred            deferment_allowed = true AND all
                                       deferment_constraints are satisfied AND
                                       checkpoint_class is Recommended or Optional
Blocked          → Not_Started         Blocker condition resolves; reset to start
Blocked          → In_Progress         Blocker resolves and partial evidence already
                                       exists
Ready_For_Review → Complete            Validation passes (Pass result); evidence is
                                       sufficient; all dependency checkpoints still
                                       Complete/Deferred
Ready_For_Review → In_Progress         Reviewer identifies missing evidence or
                                       changed conditions; checkpoint returns to work
Deferred         → In_Progress         Project re-activates deferred checkpoint
                                       (Phase 2 or scope change)
Complete         → In_Progress         Only when: upstream checkpoint reverts AND
                                       this checkpoint's evidence is invalidated;
                                       OR scope change event triggers re-evaluation
```

### Forbidden Transitions

- `Complete → Not_Started` — never; reversion goes through In_Progress
- `Deferred → Complete` — never; must pass through In_Progress and Ready_For_Review
- `Not_Started → Complete` — never; must pass through In_Progress and Ready_For_Review
- `Not_Started → Deferred` — never; must have been In_Progress to defer
- `Blocked → Complete` — never; must go through In_Progress and Ready_For_Review
- Any status → `Fail` — Fail is a checkpoint *result* (validation outcome), not a
  status. A failing validation returns the checkpoint to In_Progress with evidence
  gaps flagged.

---

## Part 3 — Domain Checkpoint Generation Rules

For each activated domain, the engine generates checkpoints using the rules below.
The rules define which checkpoints exist, their classification, and their dependencies.
Discovery question answers determine which conditional checkpoints are included.

### Generation Principles

1. **Every activated domain produces at least one Foundational checkpoint.** There are
   no activated domains with zero foundational governance.

2. **Checkpoint generation is deterministic.** Given the same discovery answers and
   domain activation state, the engine produces the same checkpoint set.

3. **Conditional checkpoints are generated only when their triggering discovery answer
   is present.** If the triggering question was never asked (due to conditional
   presentation rules), the checkpoint is not generated.

4. **Cross-domain dependency checkpoints reference specific checkpoint IDs from other
   domains, not domain-level dependencies.** Domain-level blocking (from the Domain
   Activation Engine) is enforced separately.

5. **Checkpoint IDs are stable.** Once generated, a checkpoint ID does not change for
   the life of the project. If a scope change removes a domain, its checkpoints are
   marked excluded, not deleted.

---

### Domain: Foundation

Generated for: **Every project** (unconditionally activated)

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| FND-FOUND-001 | Company Identity Established | Foundational | Both | project_owner | Executable | Safe | [] |
| FND-FOUND-002 | Localization Package Selected | Foundational | Both | project_owner | Executable | Conditional | [FND-FOUND-001] |
| FND-FOUND-003 | Base Currency Confirmed | Foundational | Both | project_owner | Executable | Blocked | [FND-FOUND-001] |
| FND-FOUND-004 | Fiscal Country Recorded | Foundational | User_Confirmed | project_owner | Informational | Not_Applicable | [FND-FOUND-001] |
| FND-FOUND-005 | Multi-Company Decision Recorded | Foundational | User_Confirmed | project_owner | Informational | Not_Applicable | [FND-FOUND-001] |
| FND-DREQ-001 | Units of Measure Categories Defined | Domain_Required | Both | implementation_lead | Executable | Safe | [FND-FOUND-002] |
| FND-DREQ-002 | Base Settings Configured | Domain_Required | Both | implementation_lead | Executable | Safe | [FND-FOUND-002, FND-FOUND-005] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| BM-02 = Yes | FND-FOUND-006 | Intercompany Rules Scope Defined | Foundational |
| BM-04 = Yes | FND-DREQ-003 | Multi-Currency Activation Configured | Domain_Required |
| FC-04 = Yes | FND-DREQ-004 | Non-Calendar Fiscal Year Dates Recorded | Domain_Required |

**Evidence requirements (selected key checkpoints):**

**FND-FOUND-001 — Company Identity Established:**
- Company name recorded
- Company legal name recorded (if different)
- Company address recorded
- Company VAT/tax registration number recorded (if applicable)
- Company logo uploaded (optional — not blocking)

**FND-FOUND-002 — Localization Package Selected:**
- Country selection matches BM-03 answer
- Localization package identifier confirmed (e.g., `l10n_au`)
- Localization package availability verified for target edition
- Project owner confirms localization selection is final

**FND-FOUND-003 — Base Currency Confirmed:**
- Currency code matches primary operating country standard
- Currency rounding rules confirmed
- Project owner acknowledges currency cannot change after transactions post

**FND-FOUND-005 — Multi-Company Decision Recorded:**
- BM-02 answer recorded
- If Yes: number of legal entities documented; each entity's country identified
- If No: single-company confirmation recorded

**Downstream impact linkage:**
- FND-FOUND-002 blocks: ACCT-FOUND-002 (CoA depends on localization)
- FND-FOUND-003 blocks: ACCT-FOUND-003 (base currency must match)
- FND-FOUND-005 blocks: USR-FOUND-002 (cross-company access policy depends on
  multi-company decision)

---

### Domain: Users / Roles / Security

Generated for: **Every project** (unconditionally activated)

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| USR-FOUND-001 | System Administrator Account Separated | Foundational | Both | system_administrator | Executable | Conditional | [FND-DREQ-002] |
| USR-FOUND-002 | Role Matrix Designed | Foundational | User_Confirmed | implementation_lead | Informational | Not_Applicable | [FND-FOUND-005] |
| USR-DREQ-001 | Operational User Accounts Created | Domain_Required | Both | system_administrator | Executable | Safe | [USR-FOUND-001, USR-FOUND-002] |
| USR-DREQ-002 | Access Group Assignments Verified | Domain_Required | Both | implementation_lead | Executable | Conditional | [USR-DREQ-001] |
| USR-DREQ-003 | Approval Responsibilities Assigned | Domain_Required | User_Confirmed | project_owner | Informational | Not_Applicable | [USR-FOUND-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| TA-02 = Yes | USR-DREQ-004 | Team-Based Record Rules Configured | Domain_Required |
| BM-02 = Yes | USR-DREQ-005 | Cross-Company Access Policy Defined | Domain_Required |
| BM-05 > 50 | USR-DREQ-006 | Segregation of Duties Policy Documented | Domain_Required |
| SC-02 = Yes | USR-DREQ-007 | Sales Approver Role Assigned | Domain_Required |
| PI-02 != No approval | USR-DREQ-008 | Purchase Approver Role Assigned | Domain_Required |
| SC-04 = Manager approval | USR-DREQ-009 | Discount Approver Role Assigned | Domain_Required |
| MF-05 = Yes | USR-DREQ-010 | ECO Approver Role Assigned | Domain_Required |
| FC-03 = Yes | USR-DREQ-011 | Accounts Payable Role Assigned | Domain_Required |

**Evidence requirements (selected key checkpoints):**

**USR-FOUND-001 — System Administrator Account Separated:**
- Admin user account exists and is not shared with an operational role
- Admin user identity matches TA-04 answer
- Admin credentials are not distributed to non-admin users

**USR-FOUND-002 — Role Matrix Designed:**
- Each TA-01 selected separation has a documented role pair
- Each role maps to specific Odoo access groups
- No operational role includes admin-level settings access

**USR-DREQ-003 — Approval Responsibilities Assigned:**
- Each approval requirement from SC-02, PI-02, SC-04, MF-05, TA-03 has a named
  approver
- No approver is the same user as the requester for the same action type

---

### Domain: Master Data

Generated for: **Every project** (unconditionally activated)

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| MAS-FOUND-001 | Product Category Structure Defined | Foundational | User_Confirmed | implementation_lead | Executable | Safe | [FND-DREQ-001] |
| MAS-FOUND-002 | Contact Classification Structure Defined | Foundational | User_Confirmed | implementation_lead | Executable | Safe | [FND-FOUND-001] |
| MAS-DREQ-001 | Product Records Ready for Downstream Use | Domain_Required | User_Confirmed | domain_lead | Informational | Not_Applicable | [MAS-FOUND-001] |
| MAS-DREQ-002 | Vendor Records Ready for Downstream Use | Domain_Required | Both | domain_lead | Executable | Safe | [MAS-FOUND-002] |
| MAS-DREQ-003 | Customer Records Ready for Downstream Use | Domain_Required | Both | domain_lead | Executable | Safe | [MAS-FOUND-002] |
| MAS-DREQ-004 | Data Stewardship Ownership Assigned | Domain_Required | User_Confirmed | project_owner | Informational | Not_Applicable | [USR-FOUND-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| OP-01 = Yes | MAS-DREQ-005 | Warehouse Records Created | Domain_Required |
| MF-01 = Yes | MAS-DREQ-006 | BOM Component Records Ready | Domain_Required |
| PI-04 != None | MAS-DREQ-007 | Traceability Categories Assigned to Products | Domain_Required |

---

### Domain: CRM

Generated for: SC-01 = Yes

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| CRM-FOUND-001 | Pipeline Stages Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [MAS-FOUND-002] |
| CRM-FOUND-002 | Sales Teams Configured | Foundational | User_Confirmed | domain_lead | Executable | Safe | [USR-DREQ-001] |
| CRM-DREQ-001 | Lead Scoring Rules Activated | Domain_Required | Both | domain_lead | Executable | Safe | [CRM-FOUND-001] |
| CRM-DREQ-002 | Activity Types Established | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [CRM-FOUND-001] |
| CRM-DREQ-003 | Lost Reasons Catalogued | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [CRM-FOUND-001] |
| CRM-REC-001 | Lead Assignment Rules Configured | Recommended | Both | domain_lead | Executable | Safe | [CRM-FOUND-002, CRM-DREQ-001] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| TA-02 = Yes | CRM-DREQ-004 | Team-Owned Pipeline Visibility Rules Applied | Domain_Required |

---

### Domain: Sales

Generated for: RM-01 includes product/service sales, or PI-05 = Yes

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| SAL-FOUND-001 | Sales Order Workflow Understood | Foundational | User_Confirmed | domain_lead | Informational | Not_Applicable | [MAS-DREQ-001, MAS-DREQ-003] |
| SAL-FOUND-002 | Sales Team Structure Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [USR-DREQ-001] |
| SAL-DREQ-001 | Default Invoicing Policy Selected | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [SAL-FOUND-001] |
| SAL-DREQ-002 | Quotation Template Created | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [SAL-FOUND-001] |
| SAL-GL-001 | End-to-End Sales Cycle Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [SAL-DREQ-001, SAL-DREQ-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| SC-02 = Yes | SAL-DREQ-003 | Order Approval Threshold Configured | Domain_Required |
| SC-03 = Yes | SAL-DREQ-004 | Pricelists Activated and Designed | Domain_Required |
| SC-04 = Manager approval | SAL-DREQ-005 | Discount Approval Threshold Configured | Domain_Required |
| FC-06 = Yes | SAL-DREQ-006 | Default Payment Terms Linked to Sales | Domain_Required |
| PI-05 = Yes | SAL-DREQ-007 | Drop-Ship Order Policy Configured | Domain_Required |

**Key dependency wiring:**
- SAL-DREQ-003 depends on: [USR-DREQ-007] (sales approver must be assigned first)
- SAL-DREQ-005 depends on: [USR-DREQ-009] (discount approver must be assigned first)
- SAL-DREQ-006 depends on: [ACCT-DREQ-004] (payment terms must exist in accounting)

---

### Domain: Purchase

Generated for: PI-01 = Yes, or MF-04 = Yes, or PI-05 = Yes

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| PUR-FOUND-001 | Purchase Workflow Understood | Foundational | User_Confirmed | domain_lead | Informational | Not_Applicable | [MAS-DREQ-002] |
| PUR-DREQ-001 | Default Billing Policy Selected | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [PUR-FOUND-001] |
| PUR-DREQ-002 | Vendor Terms and Lead Times Captured | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [MAS-DREQ-002] |
| PUR-GL-001 | End-to-End Purchase Cycle Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [PUR-DREQ-001, PUR-DREQ-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| PI-02 = Threshold | PUR-DREQ-003 | Purchase Approval Threshold Configured | Domain_Required |
| PI-02 = All orders | PUR-DREQ-004 | All-PO Approval Rule Activated | Domain_Required |
| FC-03 = Yes | PUR-DREQ-005 | Three-Way Invoice Matching Enabled | Domain_Required |
| MF-04 = Yes | PUR-DREQ-006 | Subcontracting PO Flow Configured | Domain_Required |
| PI-05 = Yes | PUR-DREQ-007 | Drop-Ship Procurement Flow Configured | Domain_Required |

**Key dependency wiring:**
- PUR-DREQ-003 depends on: [USR-DREQ-008]
- PUR-DREQ-004 depends on: [USR-DREQ-008]
- PUR-DREQ-005 depends on: [ACCT-DREQ-003] (journals must exist for matching)
- PUR-DREQ-006 depends on: [MRP-DREQ-007] (subcontracting BOM type must exist)

---

### Domain: Inventory

Generated for: OP-01 = Yes, or RM-04 = Yes, or MF-01 = Yes

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| INV-FOUND-001 | Warehouse Structure Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [MAS-DREQ-005] |
| INV-FOUND-002 | Location Hierarchy Established | Foundational | Both | domain_lead | Executable | Safe | [INV-FOUND-001] |
| INV-FOUND-003 | Operation Types Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [INV-FOUND-001] |
| INV-DREQ-001 | Product Tracking Strategy Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [MAS-DREQ-001] |
| INV-DREQ-002 | Valuation Method Applied to Products | Domain_Required | Both | domain_lead | Executable | Conditional | [ACCT-DREQ-003] (conditional: FC-01 = Full accounting; empty [] when FC-01 ≠ Full accounting) |
| INV-GL-001 | Delivery Routes Tested End-to-End | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [INV-FOUND-003, INV-DREQ-001] |
| INV-GL-002 | Stock Counts Validated | Go_Live | Both | domain_lead | None | Not_Applicable | [INV-FOUND-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| OP-02 >= 2 | INV-DREQ-003 | Multi-Warehouse Routes Configured | Domain_Required |
| PI-03 = 2 steps | INV-DREQ-004 | Two-Step Receipt Route Configured | Domain_Required |
| PI-03 = 3 steps | INV-DREQ-005 | Three-Step Receipt Route Configured | Domain_Required |
| PI-05 = Yes | INV-DREQ-006 | Drop-Ship Route Activated | Domain_Required |
| FC-02 = AVCO or FIFO | INV-DREQ-007 | Perpetual Valuation Stock Accounts Configured | Domain_Required |
| MF-01 = Yes | INV-DREQ-008 | Production Stock Locations and Routes Ready | Domain_Required |
| RM-04 = Yes | INV-DREQ-009 | Rental Availability Tracking Configured | Domain_Required |

**CRITICAL dependency wiring:**
- INV-DREQ-002 depends on: [ACCT-DREQ-003] when FC-01 = Full accounting
  (stock journal must exist)
- INV-DREQ-007 depends on: [ACCT-FOUND-002, ACCT-DREQ-003]
  (CoA must be installed and stock accounts must be identifiable in journals)
  **This is the FC-02 → Inventory blocking rule from the Domain Activation Engine,
  expressed at checkpoint level.**

---

### Domain: Manufacturing (MRP)

Generated for: MF-01 = Yes (hard gate)

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| MRP-FOUND-001 | Production Mode Understood | Foundational | User_Confirmed | domain_lead | Informational | Not_Applicable | [INV-FOUND-003] |
| MRP-DREQ-001 | Bill of Materials Structure Defined | Domain_Required | Both | domain_lead | Executable | Conditional | [MAS-DREQ-006] |
| MRP-DREQ-002 | Component Consumption Policy Set | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [MRP-DREQ-001] |
| MRP-GL-001 | Manufacturing Order Cycle Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [MRP-DREQ-001, MRP-DREQ-002] |
| MRP-GL-002 | Production Costing Validated Against Accounting | Go_Live | Both | domain_lead | None | Not_Applicable | [MRP-DREQ-001, INV-DREQ-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| MF-02 = Multi-level | MRP-DREQ-003 | Multi-Level BOM Planning Depth Configured | Domain_Required |
| MF-02 = Phantom | MRP-DREQ-004 | Kit/Phantom BOM Type Configured | Domain_Required |
| MF-03 = Yes | MRP-DREQ-005 | Work Centers Created and Configured | Domain_Required |
| MF-03 = Yes | MRP-DREQ-006 | Routings Defined for Active BOMs | Domain_Required |
| MF-04 = Yes | MRP-DREQ-007 | Subcontracting BOM Type Configured | Domain_Required |
| FC-01 = Full accounting AND MF-02 = Multi-level | MRP-DREQ-008 | WIP Account and Semi-Finished Goods Costing Configured | Domain_Required |

**Key dependency wiring:**
- MRP-GL-002 depends on: [ACCT-DREQ-003, INV-DREQ-002]
  (production costing depends on accounting journals and valuation method)
- MRP-DREQ-005 depends on: [INV-FOUND-002] (work centers link to locations)
- MRP-DREQ-007 depends on: [INV-DREQ-008] (subcontractor location must exist)
- MRP-DREQ-008 depends on: [ACCT-FOUND-002, ACCT-DREQ-003]

---

### Domain: PLM

Generated for: MF-05 = Yes (requires MF-01 = Yes)

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| PLM-FOUND-001 | ECO Stage Workflow Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [MRP-DREQ-001] |
| PLM-DREQ-001 | ECO Approver Roles Assigned | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [USR-DREQ-010] |
| PLM-DREQ-002 | ECO-to-BOM Release Flow Configured | Domain_Required | Both | domain_lead | Executable | Conditional | [PLM-FOUND-001, PLM-DREQ-001] |
| PLM-REC-001 | Document Control Linkage Established | Recommended | User_Confirmed | domain_lead | Executable | Safe | [PLM-FOUND-001] |

---

### Domain: Accounting

Generated for: FC-01 = Full accounting or Invoicing only

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| ACCT-FOUND-001 | Fiscal Year Defined | Foundational | Both | process_owner | Executable | Safe | [FND-FOUND-004] |
| ACCT-FOUND-002 | Chart of Accounts Installed | Foundational | System_Detectable | implementation_lead | Executable | Conditional | [FND-FOUND-002] |
| ACCT-FOUND-003 | Base Currency Established | Foundational | Both | project_owner | Executable | Blocked | [FND-FOUND-003] |
| ACCT-DREQ-001 | Tax Structure Configured | Domain_Required | Both | process_owner | Executable | Conditional | [ACCT-FOUND-002] |
| ACCT-DREQ-002 | Bank Accounts Configured | Domain_Required | User_Confirmed | process_owner | Executable | Safe | [ACCT-FOUND-001] |
| ACCT-DREQ-003 | Journals and Posting Rules Established | Domain_Required | Both | implementation_lead | Executable | Safe | [ACCT-FOUND-002] |
| ACCT-DREQ-004 | Payment Terms Defined | Domain_Required | User_Confirmed | process_owner | Executable | Safe | [ACCT-FOUND-001] |
| ACCT-GL-001 | Opening Balances Verified | Go_Live | Both | process_owner | Executable | Conditional | [ACCT-DREQ-003] |
| ACCT-GL-002 | First Period Transactions Processed | Go_Live | User_Confirmed | process_owner | None | Not_Applicable | [ACCT-GL-001] |
| ACCT-GL-003 | Financial Reports Validated | Go_Live | User_Confirmed | process_owner | None | Not_Applicable | [ACCT-GL-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| BM-04 = Yes | ACCT-DREQ-005 | Multi-Currency Journals and Rates Configured | Domain_Required |
| FC-02 = AVCO or FIFO | ACCT-DREQ-006 | Stock Valuation Accounts Configured for Perpetual Mode | Domain_Required |
| FC-02 = Standard Price | ACCT-DREQ-007 | Standard Cost Journal Policy Configured | Domain_Required |
| FC-05 = Yes | ACCT-REC-001 | Analytic Accounting Plans Activated | Recommended |
| FC-01 = Full accounting | ACCT-REC-002 | Advanced Payment Methods Configured | Recommended |

**Key dependency wiring:**
- ACCT-DREQ-006 is the checkpoint that **blocks INV-DREQ-007** (perpetual valuation
  stock accounts must exist before Inventory configures perpetual valuation)
- ACCT-DREQ-003 is the checkpoint that **blocks INV-DREQ-002** when FC-01 =
  Full accounting
- ACCT-DREQ-004 is the checkpoint that **blocks SAL-DREQ-006** (payment terms)

**This domain is the primary cross-domain blocker. Its Foundational and Domain_Required
checkpoints must be evaluated for blocking effects against Inventory, Manufacturing,
POS, and Purchase before those domains can progress past their dependent checkpoints.**

---

### Domain: POS

Generated for: OP-03 = Yes or RM-01 includes POS

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| POS-FOUND-001 | POS Configuration Created | Foundational | Both | domain_lead | Executable | Safe | [FND-DREQ-002] |
| POS-DREQ-001 | Payment Methods Configured for POS | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [POS-FOUND-001] |
| POS-DREQ-002 | Session and Cash Control Policy Set | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [POS-FOUND-001] |
| POS-DREQ-003 | Cashier Roles Assigned | Domain_Required | Both | domain_lead | Executable | Conditional | [USR-DREQ-001] |
| POS-GL-001 | POS Session Cycle Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [POS-DREQ-001, POS-DREQ-002, POS-DREQ-003] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| FC-01 = Full accounting | POS-DREQ-004 | POS Journal and Accounting Linkage Configured | Domain_Required |
| OP-01 = Yes | POS-DREQ-005 | POS Stock Decrement Policy Configured | Domain_Required |

**Key dependency wiring:**
- POS-DREQ-004 depends on: [ACCT-DREQ-003]
  **This is the Accounting → POS blocking rule expressed at checkpoint level.**
- POS-DREQ-005 depends on: [INV-FOUND-003] (operation types must exist)

---

### Domain: Website / eCommerce

Generated for: OP-04 = Yes or RM-01 includes Online store

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| WEB-FOUND-001 | Website Structure Created | Foundational | Both | domain_lead | Executable | Safe | [FND-FOUND-001] |
| WEB-DREQ-001 | Product Publication Rules Defined | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [MAS-DREQ-001] |
| WEB-DREQ-002 | Payment Provider Configured | Domain_Required | Both | domain_lead | Executable | Conditional | [WEB-FOUND-001] |
| WEB-DREQ-003 | Checkout and Shipping Flow Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [WEB-DREQ-001] |
| WEB-GL-001 | End-to-End Online Order Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [WEB-DREQ-002, WEB-DREQ-003] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| OP-01 = Yes | WEB-DREQ-004 | Stock Availability Display Policy Set | Domain_Required |
| SC-03 = Yes | WEB-DREQ-005 | Online Pricelist Policy Configured | Domain_Required |

**Key dependency wiring:**
- WEB-DREQ-004 depends on: [INV-FOUND-001] (warehouse must exist for stock display)
- WEB-DREQ-005 depends on: [SAL-DREQ-004] (pricelists must be designed in Sales first)

---

### Domain: Projects

Generated for: RM-01 includes Project-based billing, or RM-02 = Yes, or OP-05 = Yes

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| PRJ-FOUND-001 | Project Structure and Stages Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [FND-DREQ-002] |
| PRJ-DREQ-001 | Task Stage Workflow Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [PRJ-FOUND-001] |
| PRJ-DREQ-002 | Project Billing Method Selected | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [PRJ-FOUND-001, SAL-DREQ-001] |
| PRJ-GL-001 | Project-to-Invoice Cycle Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [PRJ-DREQ-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| RM-02 = Yes | PRJ-DREQ-003 | Timesheets Activated and Linked to Billing | Domain_Required |
| FC-05 = Yes | PRJ-DREQ-004 | Analytic Account Per Project Configured | Domain_Required |

**Key dependency wiring:**
- PRJ-DREQ-003 depends on: [SAL-DREQ-001] (service invoicing policy must align)
- PRJ-DREQ-004 depends on: [ACCT-REC-001] (analytic plans must exist)

---

### Domain: HR

Generated for: BM-05 > 10, or TA-01 includes HR, or TA-03 includes HR leave, or
RM-02 = Yes

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| HR-FOUND-001 | Department Structure Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [FND-FOUND-001] |
| HR-DREQ-001 | Employee Records Created | Domain_Required | Both | domain_lead | Executable | Safe | [HR-FOUND-001, USR-DREQ-001] |
| HR-DREQ-002 | Manager Hierarchy Established | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [HR-DREQ-001] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| TA-03 includes HR leave | HR-DREQ-003 | Leave Types and Allocation Policy Configured | Domain_Required |
| RM-02 = Yes | HR-DREQ-004 | Employee-to-Timesheet User Linkage Verified | Domain_Required |

---

### Domain: Quality

Generated for: MF-06 includes any non-None option

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| QUA-FOUND-001 | Quality Control Strategy Documented | Foundational | User_Confirmed | domain_lead | Informational | Not_Applicable | [INV-FOUND-003] |

**Conditional checkpoints (generated per MF-06 selection):**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| MF-06 includes Receipt | QUA-DREQ-001 | Receipt Quality Control Point Configured | Domain_Required |
| MF-06 includes In-process | QUA-DREQ-002 | In-Process Quality Control Point Configured | Domain_Required |
| MF-06 includes Finished goods | QUA-DREQ-003 | Pre-Delivery Quality Control Point Configured | Domain_Required |

**Key dependency wiring:**
- QUA-DREQ-001 depends on: [INV-FOUND-003] (receipt operation type must exist)
- QUA-DREQ-002 depends on: [MRP-DREQ-005] (work centers must exist for in-process)
- QUA-DREQ-003 depends on: [INV-FOUND-003] (delivery operation type must exist)

---

### Domain: Maintenance

Generated for: MF-07 = Yes (requires MF-03 = Yes)

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| MNT-FOUND-001 | Equipment Registry Created | Foundational | Both | domain_lead | Executable | Safe | [MRP-DREQ-005] |
| MNT-DREQ-001 | Preventive Maintenance Schedule Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [MNT-FOUND-001] |
| MNT-DREQ-002 | Maintenance Team and Responsibility Assigned | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [MNT-FOUND-001, USR-DREQ-001] |
| MNT-REC-001 | Corrective Maintenance Request Flow Configured | Recommended | User_Confirmed | domain_lead | Executable | Safe | [MNT-FOUND-001] |

---

### Domain: Repairs

Generated for: OP-01 = Yes AND (RM-01 includes service delivery OR OP-05 = Yes)

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| REP-FOUND-001 | Repair Workflow Defined | Foundational | User_Confirmed | domain_lead | Informational | Not_Applicable | [INV-FOUND-003] |
| REP-DREQ-001 | Repair Parts Consumption Policy Set | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [REP-FOUND-001, MAS-DREQ-001] |
| REP-DREQ-002 | Repair Invoicing Policy Aligned with Sales | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [SAL-DREQ-001] |
| REP-REC-001 | Repair Order Cycle Tested | Recommended | User_Confirmed | domain_lead | None | Not_Applicable | [REP-DREQ-001, REP-DREQ-002] |

---

### Domain: Documents

Generated for: MF-05 = Yes, or TA-03 includes document signing, or BM-05 > 50

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| DOC-FOUND-001 | Workspace Structure Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [FND-FOUND-001] |
| DOC-DREQ-001 | Document Access Rules Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [DOC-FOUND-001, USR-DREQ-002] |
| DOC-REC-001 | Operational Document Linkage Configured | Recommended | User_Confirmed | domain_lead | Executable | Safe | [DOC-FOUND-001] |

---

### Domain: Sign

Generated for: TA-03 includes document signing

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| SGN-FOUND-001 | Signature Template Structure Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [FND-FOUND-001] |
| SGN-DREQ-001 | Signer Roles and Sequence Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [SGN-FOUND-001, USR-DREQ-001] |
| SGN-DREQ-002 | Signed Document Handling Policy Set | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [SGN-FOUND-001] |

---

### Domain: Approvals

Generated for: TA-03 includes non-None options, or BM-05 > 50 with module-level
approvals

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| APR-FOUND-001 | Approval Categories Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [USR-DREQ-003] |
| APR-DREQ-001 | Approver Assignment Per Category Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [APR-FOUND-001] |
| APR-DREQ-002 | Approval Threshold Rules Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [APR-FOUND-001] |

**Conditional checkpoints (generated per TA-03 selection):**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| TA-03 includes Inventory adjustments | APR-DREQ-003 | Inventory Adjustment Approval Rule Configured | Domain_Required |
| TA-03 includes Expenses | APR-DREQ-004 | Expense Approval Rule Configured | Domain_Required |
| TA-03 includes Manufacturing order | APR-DREQ-005 | Manufacturing Order Approval Rule Configured | Domain_Required |
| TA-03 includes HR leave | APR-DREQ-006 | Leave Request Approval Rule Configured | Domain_Required |
| TA-03 includes Document signing | APR-DREQ-007 | Document Signing Approval Rule Configured | Domain_Required |

---

### Domain: Subscriptions

Generated for: RM-03 = Yes or RM-01 includes Recurring subscriptions

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| SUB-FOUND-001 | Subscription Plan Structure Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [SAL-DREQ-001] |
| SUB-DREQ-001 | Recurring Billing Period and Cadence Set | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [SUB-FOUND-001] |
| SUB-DREQ-002 | Renewal and Cancellation Policy Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [SUB-FOUND-001] |
| SUB-GL-001 | Subscription Lifecycle Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [SUB-DREQ-001, SUB-DREQ-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| FC-01 = Full accounting | SUB-DREQ-003 | Recurring Revenue Journal Policy Configured | Domain_Required |

**Key dependency wiring:**
- SUB-DREQ-003 depends on: [ACCT-DREQ-003]

---

### Domain: Rental

Generated for: RM-04 = Yes or RM-01 includes Rental

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| RNT-FOUND-001 | Rental Product Configuration Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [MAS-DREQ-001] |
| RNT-DREQ-001 | Rental Period and Pricing Rules Set | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [RNT-FOUND-001, SAL-DREQ-001] |
| RNT-DREQ-002 | Pickup and Return Flow Configured | Domain_Required | Both | domain_lead | Executable | Conditional | [INV-FOUND-003] |
| RNT-GL-001 | Rental Order Cycle Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [RNT-DREQ-001, RNT-DREQ-002] |

---

### Domain: Field Service

Generated for: OP-05 = Yes

| Checkpoint ID | Name | Class | Validation Source | Owner | Execution Relevance | Safety Class | Dependencies |
|---|---|---|---|---|---|---|---|
| FSV-FOUND-001 | Field Task Structure Defined | Foundational | User_Confirmed | domain_lead | Executable | Safe | [PRJ-DREQ-001] |
| FSV-DREQ-001 | Dispatch and Scheduling Policy Set | Domain_Required | User_Confirmed | domain_lead | Executable | Safe | [FSV-FOUND-001] |
| FSV-DREQ-002 | Field Service Invoicing Policy Configured | Domain_Required | User_Confirmed | domain_lead | Executable | Conditional | [SAL-DREQ-001] |
| FSV-GL-001 | Field Service Task Cycle Tested | Go_Live | User_Confirmed | domain_lead | None | Not_Applicable | [FSV-DREQ-001, FSV-DREQ-002] |

**Conditional checkpoints:**

| Condition | Checkpoint ID | Name | Class |
|---|---|---|---|
| OP-01 = Yes | FSV-DREQ-003 | On-Site Parts Usage and Stock Tracking Configured | Domain_Required |

**Key dependency wiring:**
- FSV-DREQ-003 depends on: [INV-FOUND-001, MAS-DREQ-001]

---

## Part 4 — Cross-Domain Checkpoint Dependency Map

This section consolidates every cross-domain checkpoint dependency into a single
reference. Each entry reads: "Checkpoint A cannot pass until Checkpoint B is Complete
or formally Deferred."

### Accounting → Inventory (CRITICAL PATH)

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| ACCT-FOUND-002 | INV-DREQ-007 | FC-02 = AVCO or FIFO |
| ACCT-DREQ-003 | INV-DREQ-002 | FC-01 = Full accounting |
| ACCT-DREQ-003 | INV-DREQ-007 | FC-02 = AVCO or FIFO |

### Accounting → Manufacturing

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| ACCT-FOUND-002 | MRP-DREQ-008 | FC-01 = Full accounting AND MF-02 = Multi-level |
| ACCT-DREQ-003 | MRP-DREQ-008 | FC-01 = Full accounting AND MF-02 = Multi-level |
| ACCT-DREQ-003 | MRP-GL-002 | FC-01 = Full accounting |

### Accounting → POS

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| ACCT-DREQ-003 | POS-DREQ-004 | FC-01 = Full accounting |

### Accounting → Purchase

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| ACCT-DREQ-003 | PUR-DREQ-005 | FC-03 = Yes |

### Accounting → Sales

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| ACCT-DREQ-004 | SAL-DREQ-006 | FC-06 = Yes |

### Accounting → Subscriptions

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| ACCT-DREQ-003 | SUB-DREQ-003 | FC-01 = Full accounting |

### Accounting → Projects

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| ACCT-REC-001 | PRJ-DREQ-004 | FC-05 = Yes |

### Users/Roles → Sales

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| USR-DREQ-007 | SAL-DREQ-003 | SC-02 = Yes |
| USR-DREQ-009 | SAL-DREQ-005 | SC-04 = Manager approval |

### Users/Roles → Purchase

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| USR-DREQ-008 | PUR-DREQ-003 | PI-02 = Threshold |
| USR-DREQ-008 | PUR-DREQ-004 | PI-02 = All orders |

### Users/Roles → PLM

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| USR-DREQ-010 | PLM-DREQ-001 | MF-05 = Yes |

### Inventory → Manufacturing

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| INV-FOUND-002 | MRP-DREQ-005 | MF-03 = Yes |
| INV-FOUND-003 | MRP-FOUND-001 | Always |
| INV-DREQ-008 | MRP-DREQ-007 | MF-04 = Yes |
| INV-DREQ-002 | MRP-GL-002 | Always |

### Inventory → Quality

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| INV-FOUND-003 | QUA-DREQ-001 | MF-06 includes Receipt |
| INV-FOUND-003 | QUA-DREQ-003 | MF-06 includes Finished goods |

### Inventory → POS

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| INV-FOUND-003 | POS-DREQ-005 | OP-01 = Yes |

### Inventory → Rental

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| INV-FOUND-003 | RNT-DREQ-002 | Always |

### Inventory → Website

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| INV-FOUND-001 | WEB-DREQ-004 | OP-01 = Yes |

### Manufacturing → PLM

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| MRP-DREQ-001 | PLM-FOUND-001 | Always |

### Manufacturing → Quality

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| MRP-DREQ-005 | QUA-DREQ-002 | MF-06 includes In-process |

### Manufacturing → Maintenance

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| MRP-DREQ-005 | MNT-FOUND-001 | Always |

### Sales → Subscriptions

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| SAL-DREQ-001 | SUB-FOUND-001 | Always |

### Sales → Rental

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| SAL-DREQ-001 | RNT-DREQ-001 | Always |

### Sales → Projects

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| SAL-DREQ-001 | PRJ-DREQ-002 | Always |
| SAL-DREQ-001 | PRJ-DREQ-003 | RM-02 = Yes |

### Sales → Website

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| SAL-DREQ-004 | WEB-DREQ-005 | SC-03 = Yes |

### Sales → Repairs

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| SAL-DREQ-001 | REP-DREQ-002 | Always |

### Sales → Field Service

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| SAL-DREQ-001 | FSV-DREQ-002 | Always |

### Projects → Field Service

| Upstream Checkpoint | Downstream Checkpoint | Condition |
|---|---|---|
| PRJ-DREQ-001 | FSV-FOUND-001 | Always |

---

## Part 5 — Engine Integrity Rules

1. **No orphan checkpoints.** Every checkpoint must belong to an activated domain.
   If a domain is excluded, its checkpoints are not generated.

2. **No phantom dependencies.** Every checkpoint_id referenced in a `dependencies`
   array must exist in the generated checkpoint set. If a conditional checkpoint's
   dependency was not generated (because its condition was not met), the dependency
   reference must be removed at generation time.

3. **No circular dependencies.** The dependency graph must be a directed acyclic
   graph (DAG). The engine must validate this at generation time and reject any
   checkpoint set that contains a cycle.

4. **No status without evidence.** A checkpoint cannot transition to Ready_For_Review
   unless all items in its `evidence_required` array have been provided or
   system-detected.

5. **No execution without preview.** When `execution_relevance` = Executable and
   `preview_required` = true, no write action may proceed unless a preview record
   exists for the current checkpoint state and target context.

6. **No safety class upgrade.** A checkpoint's `safety_class` may not be silently
   changed from Blocked or Conditional to Safe at runtime. Safety class changes
   require a governance update.

7. **Fail ≠ status.** Checkpoint validation may produce a Fail *result*, but the
   checkpoint *status* returns to In_Progress with evidence gaps flagged. Fail
   never appears as a persistent status.

8. **Deferred ≠ excluded.** A deferred checkpoint remains in the project state,
   retains its evidence, and can be reactivated. An excluded domain's checkpoints
   are never generated.

9. **Complete ≠ operationally ready.** Checkpoint completion tracks configuration
   state. Operational readiness is a separate assessment at Stage 11 (Go-Live
   Readiness) that considers all Go_Live checkpoints across all activated domains.

10. **Cross-domain blocking is checkpoint-specific.** The Domain Activation Engine
    defines domain-level blocking. This engine refines that to specific checkpoint
    pairs. Both layers must agree. If a domain-level block exists but no
    checkpoint-level block implements it, the domain-level block governs and a
    checkpoint must be added.

---

## Part 6 — Checkpoint Count Summary

| Domain | Foundational | Domain Required | Go-Live | Recommended | Optional | Max Conditional |
|---|---|---|---|---|---|---|
| Foundation | 5 (+1) | 2 (+2) | 0 | 0 | 0 | 3 |
| Users / Roles | 2 | 3 (+8) | 0 | 0 | 0 | 8 |
| Master Data | 2 | 4 (+3) | 0 | 0 | 0 | 3 |
| CRM | 2 | 3 (+1) | 0 | 1 | 0 | 1 |
| Sales | 2 | 2 (+5) | 1 | 0 | 0 | 5 |
| Purchase | 1 | 2 (+5) | 1 | 0 | 0 | 5 |
| Inventory | 3 | 2 (+7) | 2 | 0 | 0 | 7 |
| Manufacturing | 1 | 2 (+6) | 2 | 0 | 0 | 6 |
| PLM | 1 | 2 | 0 | 1 | 0 | 0 |
| Accounting | 3 | 4 (+3) | 3 | 0 (+2) | 0 | 5 |
| POS | 1 | 3 (+2) | 1 | 0 | 0 | 2 |
| Website / eCommerce | 1 | 3 (+2) | 1 | 0 | 0 | 2 |
| Projects | 1 | 2 (+2) | 1 | 0 | 0 | 2 |
| HR | 1 | 2 (+2) | 0 | 0 | 0 | 2 |
| Quality | 1 | 0 (+3) | 0 | 0 | 0 | 3 |
| Maintenance | 1 | 2 | 0 | 1 | 0 | 0 |
| Repairs | 1 | 2 | 0 | 1 | 0 | 0 |
| Documents | 1 | 1 | 0 | 1 | 0 | 0 |
| Sign | 1 | 2 | 0 | 0 | 0 | 0 |
| Approvals | 1 | 2 (+5) | 0 | 0 | 0 | 5 |
| Subscriptions | 1 | 2 (+1) | 1 | 0 | 0 | 1 |
| Rental | 1 | 2 | 1 | 0 | 0 | 0 |
| Field Service | 1 | 2 (+1) | 1 | 0 | 0 | 1 |

**Totals (base / max with all conditionals):**
- Base checkpoints: ~100
- Maximum with all conditionals: ~160
- Cross-domain dependency pairs: 35

---

**Engine Version:** 1.0
**Governing Documents:**
- `docs/05_Validation_Checkpoint_Rules.md` (checkpoint classes, safety classes, evidence)
- `docs/06_Checkpoint_and_Validation_Rules.md` (preview, execution, audit rules)
- `docs/08_Project_State_Model.md` (state fields, status model)
- `specs/domain_activation_engine.md` (domain activation, priority, blocking)
- `specs/discovery_question_framework.md` (question answers that trigger generation)
**Authority:** Subordinate to all governing documents. In any conflict, governing
documents win.
