// ---------------------------------------------------------------------------
// Onboarding Wizard View — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Pattern: local state object, container node, render() clears and rebuilds.
// Follows connection-wizard-view.js conventions exactly.
// ---------------------------------------------------------------------------

import { el } from "../lib/dom.js";
import { onboardingStore, normaliseOdooUrl } from "../state/onboarding-store.js";
import { setCurrentView } from "../state/app-store.js";

function getProjectId() {
  const state = onboardingStore.getState();
  return state.connection?.project_id || null;
}

// ---------------------------------------------------------------------------
// INDUSTRY DEFINITIONS
// ---------------------------------------------------------------------------

const INDUSTRIES = [
  {
    id: "manufacturing",
    name: "Manufacturing & Production",
    description: "For businesses that make products: composites, components, assemblies",
    icon: "factory",
    modules: ["manufacturing", "purchase", "inventory", "sales", "accounting", "quality"],
  },
  {
    id: "retail",
    name: "Retail & POS",
    description: "For shops with physical stores and online sales",
    icon: "shopping_bag",
    modules: ["pos", "inventory", "sales", "website_ecommerce", "accounting", "crm"],
  },
  {
    id: "distribution",
    name: "Distribution & Wholesale",
    description: "For businesses that buy and sell without manufacturing",
    icon: "local_shipping",
    modules: ["purchase", "sales", "inventory", "accounting", "crm"],
  },
  {
    id: "services",
    name: "Services & Projects",
    description: "For businesses selling time and expertise",
    icon: "groups",
    modules: ["projects", "sales", "accounting", "hr", "crm"],
  },
];

// ---------------------------------------------------------------------------
// QUESTION DEFINITIONS — 34 questions, ordered by section
// ---------------------------------------------------------------------------

const QUESTIONS = [
  // ── Section 1 — Business Model ──────────────────────────────────────────
  {
    id: "BM-01",
    section: "Business Model",
    sectionIndex: 1,
    text: "What best describes what your business sells?",
    inputType: "single-select",
    options: [
      "Physical products only",
      "Services only",
      "Both physical products and services",
      "Software or digital products only",
      "Platform or marketplace (connecting buyers and sellers)",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Physical products: Inventory, Sales, Purchase. Services: Projects, CRM. Both: all three tracks.",
    deferredDefault: "Both physical products and services",
  },
  {
    id: "BM-02",
    section: "Business Model",
    sectionIndex: 1,
    text: "Does your business operate as more than one legal entity?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Foundation multi-company flag; Users/Roles cross-company policy.",
    deferredDefault: "Yes",
  },
  {
    id: "BM-03",
    section: "Business Model",
    sectionIndex: 1,
    text: "In which country is your primary business legally registered and operating?",
    inputType: "text",
    options: [],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: true,
    allowDefer: false,
    domainImpact: "Foundation localization package; Accounting chart of accounts template; default currency for all domains.",
    deferredDefault: null,
  },
  {
    id: "BM-04",
    section: "Business Model",
    sectionIndex: 1,
    text: "Do you transact with customers or suppliers in currencies other than your primary operating currency?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Accounting multi-currency activation.",
    deferredDefault: "Yes",
  },
  {
    id: "BM-05",
    section: "Business Model",
    sectionIndex: 1,
    text: "How many people will use Odoo (approximate total user count)?",
    inputType: "numeric",
    options: [],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Users/Roles complexity tier; HR activation candidate (> 10); Documents and Approvals candidates (> 50).",
    deferredDefault: "> 50",
  },

  // ── Section 2 — Revenue Model ───────────────────────────────────────────
  {
    id: "RM-01",
    section: "Revenue Model",
    sectionIndex: 2,
    text: "How does your business primarily earn revenue?",
    inputType: "multi-select",
    options: [
      "One-time product sales",
      "One-time service delivery",
      "Recurring subscriptions or contracts",
      "Project-based billing (time and materials or fixed price)",
      "Rental of assets or equipment",
      "Point-of-sale (retail, walk-in, or counter sales)",
      "Online store (customers place orders via a website)",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Sales, Subscriptions, Projects, Rental, POS, Website/eCommerce — each option maps to a domain activation rule.",
    deferredDefault: "All options",
  },
  {
    id: "RM-02",
    section: "Revenue Model",
    sectionIndex: 2,
    text: "Do you bill customers based on hours worked or time spent on their account?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Projects timesheets activation; HR candidate.",
    deferredDefault: "Yes",
  },
  {
    id: "RM-03",
    section: "Revenue Model",
    sectionIndex: 2,
    text: "Do any of your customers pay on a recurring schedule under a defined contract or plan?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Subscriptions domain activation.",
    deferredDefault: "Yes",
  },
  {
    id: "RM-04",
    section: "Revenue Model",
    sectionIndex: 2,
    text: "Do you rent physical assets or equipment to customers for defined time periods?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Rental domain activation; Inventory linkage.",
    deferredDefault: "Yes",
  },

  // ── Section 3 — Operations ──────────────────────────────────────────────
  {
    id: "OP-01",
    section: "Operations",
    sectionIndex: 3,
    text: "Do you physically store and track stock of products you buy, sell, or manufacture?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Inventory domain activation (go-live priority if Yes).",
    deferredDefault: "Yes",
  },
  {
    id: "OP-02",
    section: "Operations",
    sectionIndex: 3,
    text: "How many physically distinct warehouse or stock locations do you operate?",
    inputType: "numeric",
    options: [],
    required: true,
    unconditional: false,
    condition: (answers) => answers["OP-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Inventory route complexity tier.",
    deferredDefault: "> 5",
  },
  {
    id: "OP-03",
    section: "Operations",
    sectionIndex: 3,
    text: "Do you sell directly to customers at a physical counter, till, or retail point?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "POS domain activation (go-live priority if Yes).",
    deferredDefault: "Yes",
  },
  {
    id: "OP-04",
    section: "Operations",
    sectionIndex: 3,
    text: "Do customers place orders through a website or web shop that you operate?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Website/eCommerce domain activation.",
    deferredDefault: "Yes",
  },
  {
    id: "OP-05",
    section: "Operations",
    sectionIndex: 3,
    text: "Do you dispatch staff to perform work at customer sites, and do you need to track or invoice those activities?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Field Service domain activation; Projects linkage; Repairs candidate.",
    deferredDefault: "Yes",
  },

  // ── Section 4 — Sales & CRM ─────────────────────────────────────────────
  {
    id: "SC-01",
    section: "Sales & CRM",
    sectionIndex: 4,
    text: "Do your salespeople manage a defined pipeline of prospects and opportunities before a sale is confirmed?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "CRM domain activation.",
    deferredDefault: "Yes",
  },
  {
    id: "SC-02",
    section: "Sales & CRM",
    sectionIndex: 4,
    text: "Do sales quotations or orders require internal approval before being confirmed or sent to the customer?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Sales approval configuration; Users/Roles approver role; Approvals domain candidate.",
    deferredDefault: "Yes",
  },
  {
    id: "SC-03",
    section: "Sales & CRM",
    sectionIndex: 4,
    text: "Do you apply different prices to different customers, customer groups, or order quantities?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Sales pricelists activation.",
    deferredDefault: "Yes",
  },
  {
    id: "SC-04",
    section: "Sales & CRM",
    sectionIndex: 4,
    text: "Can salespeople apply discounts to sales lines, or is discounting controlled by a manager?",
    inputType: "single-select",
    options: [
      "Salespeople can apply any discount freely",
      "Discounts require manager approval above a threshold",
      "Discounting is not permitted",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Users/Roles discount approver role; Sales discount threshold configuration.",
    deferredDefault: "Discounts require manager approval above a threshold",
  },

  // ── Section 5 — Procurement & Inventory ────────────────────────────────
  {
    id: "PI-01",
    section: "Procurement & Inventory",
    sectionIndex: 5,
    text: "Do you purchase goods or services from external suppliers using purchase orders?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Purchase domain activation.",
    deferredDefault: "Yes",
  },
  {
    id: "PI-02",
    section: "Procurement & Inventory",
    sectionIndex: 5,
    text: "Do purchase orders require approval before being sent to suppliers?",
    inputType: "single-select",
    options: [
      "No approval required — purchasers can confirm freely",
      "Approval required above a monetary threshold",
      "All purchase orders require manager approval",
    ],
    required: true,
    unconditional: false,
    condition: (answers) => answers["PI-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Users/Roles purchase manager role; Approvals candidate.",
    deferredDefault: "All purchase orders require manager approval",
  },
  {
    id: "PI-03",
    section: "Procurement & Inventory",
    sectionIndex: 5,
    text: "When goods arrive from suppliers, how do you receive them?",
    inputType: "single-select",
    options: [
      "Receive directly into stock (1 step)",
      "Receive into a dock/input area, then transfer to stock (2 steps)",
      "Receive into dock, quality check or sort, then put away (3 steps)",
    ],
    required: true,
    unconditional: false,
    condition: (answers) => answers["PI-01"]?.answer === "Yes" && answers["OP-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Inventory incoming route configuration; Quality domain candidate (3-step triggers MF-06).",
    deferredDefault: "3 steps",
  },
  {
    id: "PI-04",
    section: "Procurement & Inventory",
    sectionIndex: 5,
    text: "Do you need to track individual units or batches of products through their lifecycle?",
    inputType: "single-select",
    options: [
      "No traceability needed",
      "Batch/lot tracking (groups of items)",
      "Serial number tracking (individual unit-level)",
      "Both lot and serial number tracking on different products",
    ],
    required: true,
    unconditional: false,
    condition: (answers) => answers["OP-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Inventory traceability configuration; Quality inspection granularity.",
    deferredDefault: "Both lot and serial number tracking",
  },
  {
    id: "PI-05",
    section: "Procurement & Inventory",
    sectionIndex: 5,
    text: "Do you ever ship products directly from your supplier to your customer without the goods passing through your warehouse?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Inventory drop-ship route; Purchase vendor-to-customer flow.",
    deferredDefault: "Yes",
  },

  // ── Section 6 — Manufacturing (conditional section) ─────────────────────
  {
    id: "MF-01",
    section: "Manufacturing",
    sectionIndex: 6,
    text: "Does your business manufacture, assemble, kit, or produce any of the products it sells?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: false,
    condition: (answers) => {
      const bm01 = answers["BM-01"]?.answer;
      return bm01 === "Physical products only" || bm01 === "Both physical products and services";
    },
    irreversible: true,
    allowDefer: false,
    domainImpact: "Manufacturing domain activation (sole gate). If Yes, all MF-02 through MF-07 activate.",
    deferredDefault: null,
  },
  {
    id: "MF-02",
    section: "Manufacturing",
    sectionIndex: 6,
    text: "How complex are your Bills of Materials?",
    inputType: "single-select",
    options: [
      "Single-level (finished product made from raw materials only)",
      "Multi-level (components are themselves assembled from sub-components)",
      "Phantom/kitting only (no production order needed, just bundle packaging)",
    ],
    required: true,
    unconditional: false,
    condition: (answers) => answers["MF-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Manufacturing planning depth; Accounting WIP policy.",
    deferredDefault: "Multi-level",
  },
  {
    id: "MF-03",
    section: "Manufacturing",
    sectionIndex: 6,
    text: "Do you track work time or machine time at specific production stations or work centers?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: false,
    condition: (answers) => answers["MF-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Manufacturing work center activation; Maintenance domain candidate (gates MF-07).",
    deferredDefault: "Yes",
  },
  {
    id: "MF-04",
    section: "Manufacturing",
    sectionIndex: 6,
    text: "Do you send materials to a third-party manufacturer or finisher who returns completed goods to you?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: false,
    condition: (answers) => answers["MF-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Purchase subcontracting flow; Inventory subcontractor location.",
    deferredDefault: "Yes",
  },
  {
    id: "MF-05",
    section: "Manufacturing",
    sectionIndex: 6,
    text: "Are changes to your product structures subject to a formal approval process before being released to production?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: false,
    condition: (answers) => answers["MF-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "PLM domain activation; Documents domain candidate; Users/Roles ECO approver role.",
    deferredDefault: "Yes",
  },
  {
    id: "MF-06",
    section: "Manufacturing",
    sectionIndex: 6,
    text: "Do you perform quality checks on incoming materials, during production, or on finished goods before dispatch?",
    inputType: "multi-select",
    options: [
      "On receipt from supplier",
      "During manufacturing (in-process inspection)",
      "On finished goods before dispatch",
      "None — quality is managed externally or not required in Odoo",
    ],
    required: true,
    unconditional: false,
    condition: (answers) => {
      const mf01Yes = answers["MF-01"]?.answer === "Yes";
      const pi03ThreeStep = answers["PI-03"]?.answer === "Receive into dock, quality check or sort, then put away (3 steps)";
      return mf01Yes || pi03ThreeStep;
    },
    irreversible: false,
    allowDefer: true,
    domainImpact: "Quality domain activation (any selection except None activates it).",
    deferredDefault: "On receipt from supplier",
  },
  {
    id: "MF-07",
    section: "Manufacturing",
    sectionIndex: 6,
    text: "Do you schedule and track preventive or corrective maintenance on production equipment?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: false,
    condition: (answers) => answers["MF-03"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Maintenance domain activation.",
    deferredDefault: "Yes",
  },

  // ── Section 7 — Finance Complexity ──────────────────────────────────────
  {
    id: "FC-01",
    section: "Finance Complexity",
    sectionIndex: 7,
    text: "How will your business use Odoo for financial management?",
    inputType: "single-select",
    options: [
      "Full accounting (general ledger, journals, reconciliation, reporting)",
      "Invoicing only (send invoices and track payments, no general ledger)",
      "Not using Odoo for financials (external accounting system)",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Accounting domain activation (go-live if full; recommended if invoicing; excluded if external).",
    deferredDefault: "Full accounting",
  },
  {
    id: "FC-02",
    section: "Finance Complexity",
    sectionIndex: 7,
    text: "What method do you use to value your inventory?",
    inputType: "single-select",
    options: [
      "Standard Price (fixed cost per product)",
      "Average Cost — AVCO (cost updated on each receipt)",
      "First In First Out — FIFO (cost follows the oldest receipt price)",
      "Not applicable (services business or no stock tracking)",
    ],
    required: true,
    unconditional: false,
    condition: (answers) =>
      answers["OP-01"]?.answer === "Yes" &&
      answers["FC-01"]?.answer === "Full accounting (general ledger, journals, reconciliation, reporting)",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Accounting valuation journals; Inventory go-live sequencing (FIFO/AVCO block until Accounting valuation passes).",
    deferredDefault: "FIFO",
  },
  {
    id: "FC-03",
    section: "Finance Complexity",
    sectionIndex: 7,
    text: "Do you require purchase orders, goods receipts, and supplier invoices to be formally matched before a supplier invoice is approved for payment?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: false,
    condition: (answers) =>
      answers["PI-01"]?.answer === "Yes" &&
      answers["FC-01"]?.answer === "Full accounting (general ledger, journals, reconciliation, reporting)",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Purchase billing policy; Accounting supplier invoice matching; Users/Roles AP role.",
    deferredDefault: "Yes",
  },
  {
    id: "FC-04",
    section: "Finance Complexity",
    sectionIndex: 7,
    text: "Does your fiscal year end on a date other than 31 December?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Accounting fiscal year end date configuration.",
    deferredDefault: "Yes",
  },
  {
    id: "FC-05",
    section: "Finance Complexity",
    sectionIndex: 7,
    text: "Do you need to track revenues and costs against projects, departments, cost centres, or campaigns separately from your main chart of accounts?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Accounting analytic accounting activation; Projects analytic account per project.",
    deferredDefault: "Yes",
  },
  {
    id: "FC-06",
    section: "Finance Complexity",
    sectionIndex: 7,
    text: "Do you offer customers defined payment terms?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Accounting payment terms configuration; Sales customer payment terms linkage.",
    deferredDefault: "Yes",
  },

  // ── Section 8 — Team & Access Structure ─────────────────────────────────
  {
    id: "TA-01",
    section: "Team & Access Structure",
    sectionIndex: 8,
    text: "Which of the following roles need to be separated so that different people have different access in Odoo?",
    inputType: "multi-select",
    options: [
      "Salespeople vs. Sales Managers",
      "Purchasers vs. Purchase Managers",
      "Warehouse Operators vs. Inventory Managers",
      "Accounts Payable vs. Accounts Receivable vs. Finance Managers",
      "Production Operators vs. Manufacturing Managers",
      "HR Officers vs. HR Managers",
      "System Administrator (separate from all operational roles)",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Users/Roles checkpoint design; HR domain candidate.",
    deferredDefault: "All role separations",
  },
  {
    id: "TA-02",
    section: "Team & Access Structure",
    sectionIndex: 8,
    text: "Do any departments or teams need to be restricted from seeing each other's records?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Users/Roles team-based record rule design; CRM and Sales team visibility configuration.",
    deferredDefault: "Yes",
  },
  {
    id: "TA-03",
    section: "Team & Access Structure",
    sectionIndex: 8,
    text: "Beyond sales and purchase approvals already asked, are there other operational actions that require a formal second approval before execution?",
    inputType: "multi-select",
    options: [
      "Inventory adjustments above a threshold",
      "Expenses above a threshold",
      "Manufacturing order creation or close",
      "HR leave requests",
      "Contract or document signing",
      "None — standard module approvals are sufficient",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Approvals domain activation (any non-None); Sign domain activation (contract/document signing).",
    deferredDefault: "All non-None options",
  },
  {
    id: "TA-04",
    section: "Team & Access Structure",
    sectionIndex: 8,
    text: "Who is the designated Odoo system administrator?",
    inputType: "text",
    options: [],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: false,
    domainImpact: "Users/Roles admin user checkpoint; Foundation admin credentials context.",
    deferredDefault: null,
  },
];

// ---------------------------------------------------------------------------
// Helper: compute visible questions given current answers
// ---------------------------------------------------------------------------

function getVisibleQuestions(answers) {
  return QUESTIONS.filter((q) => q.condition === null || q.condition(answers));
}

// ---------------------------------------------------------------------------
// Helper: section colour accent (deterministic, no inline conditionals in render)
// ---------------------------------------------------------------------------

const SECTION_COLORS = {
  1: "#4A90E2",
  2: "#7B68EE",
  3: "#20B2AA",
  4: "#E8A838",
  5: "#E06030",
  6: "#C0392B",
  7: "#27AE60",
  8: "#8E44AD",
};

// ---------------------------------------------------------------------------
// renderOnboardingWizard
//
// @param {{ onComplete: Function, onNavigate: Function }} props
// @returns {HTMLElement}
// ---------------------------------------------------------------------------

export function renderOnboardingWizard({ onComplete, onNavigate }) {
  // ── Local UI state (on top of onboardingStore) ────────────────────────
  const local = {
    selectedIndustry: null,   // id string, for industry screen before POST
    tempAnswer: null,         // staging area for current question input before commit
    expandedSections: {},     // { sectionName: boolean } for summary collapsibles
    exitWarningVisible: false,
    activeQuestionFlush: () => {},
    popstateHandler: null,
  };

  const container = el("div", {
    className: "ow-root",
    style: "min-height: 100vh; background: var(--ee-surface-container-low); display: flex; flex-direction: column; align-items: center; padding: 32px 16px;",
  });

  // Tracks whether container has ever been appended to the document.
  // The first render() call is synchronous — before the caller does
  // root.append(container) — so document.contains(container) is false
  // at that point. Without this flag the stale-instance guard would fire
  // on first render, unsubscribe the store, and produce a blank screen.
  let _everMounted = false;

  attachPopstateGuard();

  // Subscribe to store changes and re-render.
  // Store the unsubscribe fn so stale instances can clean up when detached.
  const unsubscribeStore = onboardingStore.subscribe(render);
  render();
  return container;

  // ── render ──────────────────────────────────────────────────────────────

  function render(force = false) {
    // Guard: if this wizard container is no longer in the document, clean up
    // the stale subscription and stop rendering into a detached node.
    // Skip on first call — container isn't in the DOM until after
    // renderOnboardingWizard() returns and the caller appends it.
    if (document.contains(container)) {
      _everMounted = true;
    } else if (_everMounted) {
      unsubscribeStore();
      detachPopstateGuard();
      return;
    }

    // Guard: if a text or numeric input inside the wizard currently has focus,
    // skip the re-render to preserve the active input element and its value.
    // The commit-on-blur + flush-on-navigate pattern ensures the value is not
    // lost — we simply defer re-rendering until focus leaves the field.
    const focused = document.activeElement;
    if (!force && focused && (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA") && container.contains(focused)) {
      return;
    }

    container.innerHTML = "";
    const s = onboardingStore.getState();
    local.activeQuestionFlush = () => {};

    container.append(buildHeader());

    // If project_id already registered, skip account-check and connection screens
    // and go straight to industry (the first real onboarding step)
    if (s.connection.project_id && (s.screen === "account-check" || s.screen === "create-account" || s.screen === "connect-account")) {
      onboardingStore.setScreen("industry");
      return;
    }

    switch (s.screen) {
      case "account-check":
        container.append(buildConnectAccountScreen(s));
        break;
      case "create-account":
        container.append(buildCreateAccountScreen(s));
        break;
      case "connect-account":
        container.append(buildConnectAccountScreen(s));
        break;
      case "industry":
        container.append(buildIndustryScreen(s));
        break;
      case "questions":
        container.append(buildQuestionsScreen(s));
        break;
      case "irreversible-warning":
        container.append(buildIrreversibleWarningScreen(s));
        break;
      case "summary":
        container.append(buildSummaryScreen(s));
        break;
      default:
        container.append(buildAccountCheckScreen(s));
    }
  }

  // ── Header ───────────────────────────────────────────────────────────────

  function attachPopstateGuard() {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
      return;
    }

    if (typeof window.history?.pushState === "function") {
      window.history.pushState({ onboardingWizard: true }, "", window.location.href);
    }

    local.popstateHandler = () => {
      if (!document.contains(container)) {
        detachPopstateGuard();
        return;
      }
      if (onboardingStore.getState().screen !== "questions") {
        return;
      }
      if (typeof window.history?.pushState === "function") {
        window.history.pushState({ onboardingWizard: true }, "", window.location.href);
      }
      requestExitWarning();
    };

    window.addEventListener("popstate", local.popstateHandler);
  }

  function detachPopstateGuard() {
    if (local.popstateHandler && typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("popstate", local.popstateHandler);
    }
    local.popstateHandler = null;
  }

  function getExitTarget() {
    return getProjectId() ? "pipeline-dashboard" : "home";
  }

  function requestExitWarning() {
    const s = onboardingStore.getState();
    if (s.screen !== "questions") {
      detachPopstateGuard();
      onNavigate(getExitTarget());
      return;
    }
    local.activeQuestionFlush();
    local.exitWarningVisible = true;
    render(true);
  }

  function dismissExitWarning() {
    local.exitWarningVisible = false;
    render(true);
  }

  function saveAndExit() {
    local.exitWarningVisible = false;
    local.activeQuestionFlush();
    detachPopstateGuard();
    onNavigate(getExitTarget());
  }

  function buildHeader() {
    return el("div", { className: "ow-header", style: "width: 100%; max-width: 800px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;" }, [
      el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
        el("div", {
          className: "ow-header-mark",
          style: "width: 40px; height: 40px; background: var(--ee-primary); display: flex; align-items: center; justify-content: center;",
        }, [
          el("span", { className: "material-symbols-outlined", style: "color: white; font-size: 20px;", text: "rocket_launch" }),
        ]),
        el("div", {}, [
          el("h1", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin: 0;" }, "Business Assessment"),
          el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant); margin: 0;" }, "Project Odoo — Governed Odoo 19 Implementation"),
        ]),
      ]),
      el("button", {
        className: "ow-header-exit",
        style: "background: none; border: none; color: var(--ee-on-surface-variant); font-size: 13px; cursor: pointer; text-decoration: underline;",
        onclick: () => requestExitWarning(),
      }, "Exit wizard"),
    ]);
  }

  // ── SCREEN 0a: Account Check ───────────────────────────────────────────────

  function buildAccountCheckScreen(s) {
    const wrap = el("div", { style: "width: 100%; max-width: 700px;" });

    wrap.append(el("div", { style: "margin-bottom: 24px;" }, [
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 22px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 6px;" }, "Do you have an existing Odoo account?"),
      el("p", { style: "font-size: 14px; color: var(--ee-on-surface-variant);" }, "You will need an active Odoo instance to begin your implementation."),
    ]));

    const grid = el("div", { style: "display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;" });

    grid.append(el("button", {
      className: "ow-choice-card",
      style: "width: 100%; text-align: center; padding: 28px 20px; background: var(--ee-surface-container); border: 2px solid var(--ee-outline-variant); cursor: pointer; transition: border-color 0.15s;",
      onclick: () => onboardingStore.setAccountStatus("existing"),
    }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 32px; color: var(--ee-primary); display: block; margin-bottom: 10px;", text: "check_circle" }),
      el("p", { style: "font-size: 15px; font-weight: 700; color: var(--ee-on-surface);" }, "Yes, I have an Odoo instance"),
    ]));

    grid.append(el("button", {
      className: "ow-choice-card",
      style: "width: 100%; text-align: center; padding: 28px 20px; background: var(--ee-surface-container); border: 2px solid var(--ee-outline-variant); cursor: pointer; transition: border-color 0.15s;",
      onclick: () => onboardingStore.setAccountStatus("new"),
    }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 32px; color: var(--ee-on-surface-variant); display: block; margin-bottom: 10px;", text: "add_circle" }),
      el("p", { style: "font-size: 15px; font-weight: 700; color: var(--ee-on-surface);" }, "No, I need to create one"),
    ]));

    wrap.append(grid);
    return wrap;
  }

  // ── SCREEN 0b (No path): Create Account ──────────────────────────────────

  function buildCreateAccountScreen(s) {
    const wrap = el("div", { style: "width: 100%; max-width: 700px;" });

    wrap.append(el("div", { style: "margin-bottom: 20px;" }, [
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 22px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 6px;" }, "Create your Odoo account"),
      el("p", { style: "font-size: 14px; color: var(--ee-on-surface-variant); line-height: 1.6;" },
        "You will need an Odoo instance before we can begin. Creating one takes about 2 minutes. Click below to open the Odoo signup page, then come back here when your instance is ready."),
    ]));

    wrap.append(el("div", { style: "margin-bottom: 20px;" }, [
      el("a", {
        href: "https://www.odoo.com/trial",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "ee-btn ee-btn--secondary",
        style: "display: inline-flex; align-items: center; gap: 8px; text-decoration: none;",
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "open_in_new" }),
        "Open Odoo signup",
      ]),
    ]));

    // Divider
    wrap.append(el("div", { style: "display: flex; align-items: center; gap: 12px; margin-bottom: 20px;" }, [
      el("div", { style: "flex: 1; height: 1px; background: var(--ee-outline-variant);" }),
      el("span", { style: "font-size: 13px; color: var(--ee-on-surface-variant); white-space: nowrap;" }, "Already done? Enter your instance details below."),
      el("div", { style: "flex: 1; height: 1px; background: var(--ee-outline-variant);" }),
    ]));

    wrap.append(buildConnectionForm(s));

    return wrap;
  }

  // ── SCREEN 0b (Yes path): Connect Account ────────────────────────────────

  function buildConnectAccountScreen(s) {
    const wrap = el("div", { style: "width: 100%; max-width: 700px;" });

    wrap.append(el("div", { style: "margin-bottom: 20px;" }, [
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 22px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 6px;" }, "Connect your Odoo instance"),
      el("p", { style: "font-size: 14px; color: var(--ee-on-surface-variant);" }, "Enter your Odoo instance details to get started."),
    ]));

    wrap.append(buildConnectionForm(s));

    wrap.append(el("div", { style: "margin-top: 12px; text-align: center;" }, [
      el("button", {
        style: "background: none; border: none; color: var(--ee-on-surface-variant); font-size: 13px; cursor: pointer; text-decoration: underline;",
        onclick: () => onboardingStore.setScreen("account-check"),
      }, "Don't have an account yet?"),
    ]));

    return wrap;
  }

  // normaliseOdooUrl is imported from onboarding-store.js — pure function,
  // no DOM dependency, tested independently in server.test.js.

  // ── Shared connection form ────────────────────────────────────────────────

  function buildConnectionForm(s) {
    // formState holds normalised url; database is set by dropdown selection,
    // "create new" text input, or manual text input — never from dbInput directly.
    const formState = { url: "", database: "", username: "", password: "" };
    let dbSelectInput = null;
    let dbTextInput = null;

    // Local UI state for database detection (not in store — purely presentation)
    const dbUiState = {
      detecting: false,
      detected: null,   // null | [] | ["db1", ...]
      mode: "hidden",   // "hidden" | "dropdown" | "manual" | "create-new"
      urlError: null,
    };

    const card = el("div", { className: "ow-card", style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg); padding: 24px;" });

    const fieldStyle = "display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;";
    const labelStyle = "font-size: 12px; font-weight: 600; color: var(--ee-on-surface); text-transform: uppercase; letter-spacing: 0.04em;";

    // ── URL field ─────────────────────────────────────────────────────────────

    const urlInput = el("input", {
      type: "text",
      className: "ee-input",
      placeholder: "mycompany.odoo.com",
    });
    const urlError = el("p", {
      style: "font-size: 12px; color: var(--ee-error); margin-top: 4px; display: none;",
    });
    const urlField = el("div", { style: fieldStyle }, [
      el("label", { style: labelStyle }, "Instance URL"),
      urlInput,
      urlError,
    ]);

    // ── Database area (rendered inside card after URL field) ──────────────────

    const dbArea = el("div", { style: "margin-bottom: 14px;" });
    const userInput = el("input", { type: "email", className: "ee-input", placeholder: "admin@mycompany.com" });
    const passInput = el("input", { type: "password", className: "ee-input", placeholder: "Password" });

    function renderDbArea() {
      // Clear and re-render dbArea based on dbUiState
      while (dbArea.firstChild) dbArea.removeChild(dbArea.firstChild);
      dbSelectInput = null;
      dbTextInput = null;

      if (dbUiState.detecting) {
        dbArea.append(
          el("div", { style: "display: flex; align-items: center; gap: 8px; padding: 10px 0;" }, [
            el("span", {
              className: "material-symbols-outlined",
              style: "font-size: 18px; color: var(--ee-on-surface-variant); animation: spin 1s linear infinite;",
              text: "sync",
            }),
            el("span", { style: "font-size: 13px; color: var(--ee-on-surface-variant);" }, "Detecting databases..."),
          ])
        );
        return;
      }

      if (dbUiState.mode === "hidden") return;

      if (dbUiState.mode === "dropdown") {
        // Dropdown with detected databases + "Create a new database"
        const options = [
          el("option", { value: "" }, "Select a database..."),
          ...dbUiState.detected.map((db) =>
            el("option", { value: db }, db)
          ),
          el("option", { value: "__create__" }, "Create a new database"),
        ];
        const select = el("select", { className: "ee-input", style: "width: 100%;" }, options);
        dbSelectInput = select;
        if (formState.database && dbUiState.detected.includes(formState.database)) {
          select.value = formState.database;
        }
        select.addEventListener("change", (e) => {
          const val = e.target.value;
          if (val === "__create__") {
            dbUiState.mode = "create-new";
            formState.database = "";
            renderDbArea();
          } else {
            formState.database = val;
          }
        });
        dbArea.append(
          el("div", { style: fieldStyle }, [
            el("label", { style: labelStyle }, "Database"),
            select,
          ])
        );
        return;
      }

      if (dbUiState.mode === "create-new") {
        const newDbInput = el("input", {
          type: "text",
          className: "ee-input",
          placeholder: "New database name",
        });
        dbTextInput = newDbInput;
        if (formState.database) newDbInput.value = formState.database;
        newDbInput.addEventListener("input", (e) => { formState.database = e.target.value.trim(); });
        const backBtn = el("button", {
          type: "button",
          style: "background: none; border: none; color: var(--ee-on-surface-variant); font-size: 12px; cursor: pointer; text-decoration: underline; padding: 4px 0; margin-top: 4px;",
          onclick: () => {
            dbUiState.mode = "dropdown";
            formState.database = "";
            renderDbArea();
          },
        }, "Back to database list");
        dbArea.append(
          el("div", { style: fieldStyle }, [
            el("label", { style: labelStyle }, "New database name"),
            newDbInput,
            backBtn,
          ])
        );
        return;
      }

      if (dbUiState.mode === "manual") {
        // Manual text input — detection failed or no databases found
        const manualInput = el("input", {
          type: "text",
          className: "ee-input",
          placeholder: "mycompany",
        });
        dbTextInput = manualInput;
        if (formState.database) manualInput.value = formState.database;
        manualInput.addEventListener("input", (e) => { formState.database = e.target.value.trim(); });
        dbArea.append(
          el("div", { style: fieldStyle }, [
            el("label", { style: labelStyle }, "Database name"),
            manualInput,
            el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant); margin-top: 4px;" },
              "Enter your database name manually"),
          ])
        );
      }
    }

    // ── Database detection ────────────────────────────────────────────────────

    async function detectDatabases(canonicalUrl) {
      dbUiState.detecting = true;
      dbUiState.mode = "hidden";
      formState.database = "";
      renderDbArea();

      try {
        const res = await fetch("/api/odoo/detect-databases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: canonicalUrl }),
        });
        const data = await res.json();

        if (data.ok && Array.isArray(data.databases) && data.databases.length > 0) {
          dbUiState.detected = data.databases;
          dbUiState.mode = "dropdown";
        } else {
          dbUiState.mode = "manual";
        }
      } catch {
        dbUiState.mode = "manual";
      } finally {
        dbUiState.detecting = false;
        renderDbArea();
      }
    }

    // ── URL blur handler: normalise then detect ───────────────────────────────

    urlInput.addEventListener("input", (e) => {
      // Keep raw value in sync while typing (normalisation happens on blur)
      formState.url = e.target.value.trim();
    });

    urlInput.addEventListener("blur", async () => {
      const raw = urlInput.value.trim();
      if (!raw) {
        urlError.style.display = "none";
        dbUiState.mode = "hidden";
        renderDbArea();
        return;
      }

      const result = normaliseOdooUrl(raw);
      if (!result.ok) {
        urlError.textContent = result.error;
        urlError.style.display = "block";
        formState.url = "";
        dbUiState.mode = "hidden";
        renderDbArea();
        return;
      }

      // Show normalised URL in field
      urlInput.value = result.url;
      formState.url = result.url;
      urlError.style.display = "none";

      // Trigger database detection
      await detectDatabases(result.url);
    });

    userInput.addEventListener("input", (e) => { formState.username = e.target.value.trim(); });
    passInput.addEventListener("input", (e) => { formState.password = e.target.value; });

    // ── Assemble card ─────────────────────────────────────────────────────────

    renderDbArea(); // initially hidden

    card.append(
      urlField,
      dbArea,
      el("div", { style: fieldStyle }, [el("label", { style: labelStyle }, "Username (email)"), userInput]),
      el("div", { style: fieldStyle }, [el("label", { style: labelStyle }, "Password"), passInput]),
    );

    // Error display
    if (s.status === "failure" && s.error) {
      card.append(el("div", { className: "ow-panel ow-panel--error", style: "padding: 10px 14px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error); margin-bottom: 14px;" }, [
        el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-error);" }, s.error),
      ]));
    }

    const isLoading = s.status === "loading";

    card.append(el("button", {
      className: "ee-btn ee-btn--primary",
      style: `width: 100%; ${isLoading ? "opacity: 0.5; cursor: not-allowed;" : ""}`,
      disabled: isLoading,
      onclick: async () => {
        if (isLoading) return;

        const submittedUrl = urlInput.value.trim() || formState.url || "";
        const submittedUsername = userInput.value.trim() || formState.username || "";
        const submittedPassword = passInput.value || formState.password || "";
        const submittedDatabase = (
          dbSelectInput?.value?.trim() ||
          dbTextInput?.value?.trim() ||
          formState.database ||
          ""
        );
        let normalisedUrl = submittedUrl;

        // Normalise URL on submit (catches cases where blur did not fire)
        if (submittedUrl && submittedUrl !== formState.url) {
          const result = normaliseOdooUrl(submittedUrl);
          if (!result.ok) {
            urlError.textContent = result.error;
            urlError.style.display = "block";
            return;
          }
          normalisedUrl = result.url;
          urlInput.value = result.url;
          formState.url = result.url;
          urlError.style.display = "none";
        }

        if (!normalisedUrl || !submittedDatabase || !submittedUsername || !submittedPassword) {
          onboardingStore.setConnectionError("All fields are required.");
          return;
        }
        formState.url = normalisedUrl;
        formState.database = submittedDatabase;
        formState.username = submittedUsername;
        formState.password = submittedPassword;
        await onboardingStore.registerConnection(
          normalisedUrl, submittedDatabase, submittedUsername, submittedPassword
        );
        // Password is never stored — formState is local and discarded on re-render
      },
    }, isLoading ? "Connecting..." : "Connect my instance"));

    return card;
  }

  // ── SCREEN 1: Industry Selector ──────────────────────────────────────────

  function buildIndustryScreen(s) {
    const wrap = el("div", { style: "width: 100%; max-width: 800px;" });

    wrap.append(el("div", { style: "margin-bottom: 24px;" }, [
      el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 6px;" }, "Step 2 of 4 — Industry"),
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 22px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 6px;" }, "Select your industry"),
      el("p", { style: "font-size: 14px; color: var(--ee-on-surface-variant);" }, "This pre-populates a baseline set of recommended domains for your implementation. You can refine everything in the questions that follow."),
    ]));

    // 2x2 grid
    const grid = el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 24px;" });
    INDUSTRIES.forEach((industry) => {
      const isSelected = local.selectedIndustry === industry.id;
      const card = el("button", {
        className: `ow-choice-card ow-industry-card${isSelected ? " ow-choice-card--selected" : ""}`,
        style: `width: 100%; text-align: left; padding: 20px; background: ${isSelected ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"}; border: 2px solid ${isSelected ? "var(--ee-primary)" : "var(--ee-outline-variant)"}; cursor: pointer; transition: border-color 0.15s;`,
        onclick: () => {
          local.selectedIndustry = industry.id;
          render();
        },
      }, [
        el("div", { style: "display: flex; align-items: flex-start; gap: 14px;" }, [
          el("span", {
            className: "material-symbols-outlined",
            style: `font-size: 28px; color: ${isSelected ? "var(--ee-primary)" : "var(--ee-on-surface-variant)"};`,
            text: industry.icon,
          }),
          el("div", { style: "flex: 1;" }, [
            el("p", { style: "font-size: 15px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 4px;" }, industry.name),
            el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant); margin-bottom: 12px;" }, industry.description),
            el("div", { style: "display: flex; flex-wrap: wrap; gap: 6px;" },
              industry.modules.map((mod) =>
                el("span", {
                  className: `ow-chip${isSelected ? " ow-chip--active" : ""}`,
                  style: `font-size: 11px; font-weight: 600; padding: 3px 8px; background: ${isSelected ? "var(--ee-primary)" : "var(--ee-surface-container-high)"}; color: ${isSelected ? "white" : "var(--ee-on-surface-variant)"}; text-transform: uppercase; letter-spacing: 0.04em;`,
                  text: mod,
                })
              )
            ),
          ]),
        ]),
      ]);
      grid.append(card);
    });
    wrap.append(grid);

    // Error
    if (s.status === "failure" && s.error) {
      wrap.append(el("div", { className: "ow-panel ow-panel--error", style: "padding: 14px 16px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error); margin-bottom: 16px;" }, [
        el("p", { style: "font-size: 14px; font-weight: 600; color: var(--ee-error);" }, s.error),
      ]));
    }

    const isLoading = s.status === "loading";
    const projectId = getProjectId();

    wrap.append(el("div", { style: "display: flex; gap: 12px; justify-content: flex-end;" }, [
      el("button", {
        className: "ee-btn ee-btn--secondary",
        onclick: () => onNavigate(getExitTarget()),
      }, "Cancel"),
      el("button", {
        className: "ee-btn ee-btn--primary",
        style: `min-width: 140px; ${(!local.selectedIndustry || isLoading || !projectId) ? "opacity: 0.5; cursor: not-allowed;" : ""}`,
        disabled: !local.selectedIndustry || isLoading || !projectId,
        onclick: () => {
          if (!projectId) {
            onboardingStore.setConnectionError("No project ID available. Please sign in again.");
            setCurrentView("auth");
            return;
          }
          if (local.selectedIndustry && !isLoading) {
            void onboardingStore.selectIndustry(projectId, local.selectedIndustry);
          }
        },
      }, isLoading ? "Loading..." : "Continue \u2192"),
    ]));

    return wrap;
  }

  // ── SCREEN 2-N: Question Wizard ───────────────────────────────────────────

  function buildQuestionsScreen(s) {
    const visibleQuestions = getVisibleQuestions(s.answers);
    const idx = Math.min(s.current_question_index, visibleQuestions.length - 1);
    const question = visibleQuestions[idx];

    if (!question) {
      // All questions complete — go to summary
      onboardingStore.setScreen("summary");
      return el("div", {});
    }

    const wrap = el("div", { style: "width: 100%; max-width: 700px;" });

    if (local.exitWarningVisible) {
      wrap.append(el("div", {
        className: "ow-banner ow-banner--warning",
        style: "padding: 14px 16px; background: #FFF3CD; border-left: 3px solid #F0A500; margin-bottom: 16px;",
      }, [
        el("p", {
          style: "font-size: 13px; font-weight: 600; color: #7A5200; margin: 0 0 12px;",
        }, "You have unsaved progress. Your answers will be saved and you can continue later from your dashboard."),
        el("div", { style: "display: flex; gap: 10px; flex-wrap: wrap;" }, [
          el("button", {
            className: "ee-btn ee-btn--primary",
            onclick: () => saveAndExit(),
          }, "Save and exit"),
          el("button", {
            className: "ee-btn ee-btn--secondary",
            onclick: () => dismissExitWarning(),
          }, "Continue answering"),
        ]),
      ]));
    }

    // Progress bar
    const progress = visibleQuestions.length > 0 ? Math.round(((idx) / visibleQuestions.length) * 100) : 0;
    wrap.append(el("div", { style: "margin-bottom: 20px;" }, [
      el("div", { style: "display: flex; justify-content: space-between; margin-bottom: 6px;" }, [
        el("span", { style: "font-size: 12px; color: var(--ee-on-surface-variant);" }, `Question ${idx + 1} of ${visibleQuestions.length}`),
        el("span", { style: "font-size: 12px; color: var(--ee-on-surface-variant);" }, `${progress}% complete`),
      ]),
      el("div", { className: "ow-progress-track", style: "height: 4px; background: var(--ee-surface-container-high);" }, [
        el("div", { className: "ow-progress-fill", style: `height: 4px; width: ${progress}%; background: var(--ee-primary); transition: width 0.3s;` }),
      ]),
    ]));

    // Deferred banner (from previous session)
    const deferredCount = onboardingStore.getDeferredCount();
    if (deferredCount > 0 && idx === 0) {
      wrap.append(el("div", { className: "ow-banner ow-banner--warning", style: "padding: 12px 16px; background: #FFF3CD; border-left: 3px solid #F0A500; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;" }, [
        el("span", { className: "material-symbols-outlined", style: "color: #F0A500; font-size: 18px;", text: "warning" }),
        el("p", { style: "font-size: 13px; color: #7A5200; margin: 0;" }, `You have ${deferredCount} unanswered question(s). Answer them to refine your implementation scope.`),
      ]));
    }

    // Card
    const card = el("div", { className: "ow-card ow-question-card", style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg); padding: 28px;" });

    // Section label
    const sectionColor = SECTION_COLORS[question.sectionIndex] || "var(--ee-secondary)";
    card.append(el("p", {
      style: `font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${sectionColor}; margin-bottom: 8px;`,
    }, `Section ${question.sectionIndex} \u2014 ${question.section}`));

    // Question ID + text
    card.append(el("div", { style: "margin-bottom: 4px;" }, [
      el("span", { style: "font-size: 11px; font-weight: 700; color: var(--ee-outline); margin-right: 8px;", text: question.id }),
    ]));
    card.append(el("h3", { style: "font-family: var(--ee-font-headline); font-size: 17px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 20px; line-height: 1.4;" }, question.text));

    // Pre-populated badge (if answer came from industry template)
    const prePopulatedAnswer = s.pre_populated_answers[question.id];
    if (prePopulatedAnswer && !s.answers[question.id]) {
      card.append(el("div", { className: "ow-prepop-badge", style: "display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--ee-secondary-container); margin-bottom: 12px;" }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 14px; color: var(--ee-secondary);", text: "auto_awesome" }),
        el("span", { style: "font-size: 11px; font-weight: 600; color: var(--ee-secondary);" }, "Pre-populated by industry template"),
      ]));
    }

    // Input controls
    const currentAnswer = s.answers[question.id];
    const displayAnswer = currentAnswer?.answer ?? prePopulatedAnswer ?? null;
    const isDeferred = currentAnswer?.deferred === true;

    // buildInputControls returns { element, flush } — flush() commits any
    // pending in-DOM value to the store before navigation, covering the case
    // where the user types into a text/numeric field and clicks Next without
    // first moving focus away (blur fires after mousedown/click in some browsers).
    const { element: inputEl, flush: flushInput } = buildInputControls(question, displayAnswer, isDeferred, s);
    local.activeQuestionFlush = flushInput;
    card.append(inputEl);

    // Domain impact
    card.append(el("div", { className: "ow-panel ow-impact-panel", style: "margin-top: 14px; padding: 10px 12px; background: var(--ee-surface-container); display: flex; align-items: flex-start; gap: 8px;" }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 15px; color: var(--ee-on-surface-variant); flex-shrink: 0; margin-top: 1px;", text: "info" }),
      el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant); margin: 0;" }, question.domainImpact),
    ]));

    // "I don't know yet" defer link
    if (question.allowDefer) {
      card.append(el("div", { style: "margin-top: 16px; text-align: center;" }, [
        el("button", {
          style: "background: none; border: none; color: var(--ee-on-surface-variant); font-size: 13px; cursor: pointer; text-decoration: underline; padding: 4px 8px;",
          onclick: () => {
            local.exitWarningVisible = false;
            onboardingStore.deferAnswer(question.id);
            advanceQuestion(visibleQuestions, idx);
          },
        }, "I don't know yet \u2014 skip for now"),
      ]));
    }

    wrap.append(card);

    // Navigation buttons
    const hasAnswer = currentAnswer && (currentAnswer.deferred || currentAnswer.answer !== null);
    const canAdvance = hasAnswer || (prePopulatedAnswer && !currentAnswer);

    wrap.append(el("div", { style: "display: flex; gap: 12px; margin-top: 20px; justify-content: space-between;" }, [
      el("button", {
        className: "ee-btn ee-btn--secondary",
        style: idx === 0 ? "opacity: 0.5; cursor: not-allowed;" : "",
        disabled: idx === 0,
        onclick: () => {
          if (idx > 0) {
            local.exitWarningVisible = false;
            onboardingStore.prevQuestion();
            local.tempAnswer = null;
          }
        },
      }, "\u2190 Back"),

      el("div", { style: "display: flex; gap: 10px;" }, [
        el("button", {
          style: "background: none; border: none; color: var(--ee-on-surface-variant); font-size: 13px; cursor: pointer; text-decoration: underline; padding: 6px 12px;",
          onclick: () => {
            local.exitWarningVisible = false;
            flushInput();
            onboardingStore.setScreen("summary");
            local.tempAnswer = null;
          },
        }, "Jump to Summary"),

        el("button", {
          className: "ee-btn ee-btn--primary",
          style: !canAdvance ? "opacity: 0.5; cursor: not-allowed;" : "",
          disabled: !canAdvance,
          onclick: () => {
            if (!canAdvance) return;
            local.exitWarningVisible = false;
            // Flush any pending text/numeric value typed but not yet blurred
            flushInput();
            // Commit pre-populated if no explicit answer set yet
            if (!currentAnswer && prePopulatedAnswer) {
              onboardingStore.setAnswer(question.id, prePopulatedAnswer);
            }
            const committedAnswer = onboardingStore.getState().answers[question.id] || currentAnswer;
            if (question.irreversible) {
              const answerValue = committedAnswer?.answer ?? prePopulatedAnswer;
              onboardingStore.setPendingIrreversible(question.id, answerValue);
            } else {
              advanceQuestion(visibleQuestions, idx);
            }
          },
        }, idx === visibleQuestions.length - 1 ? "Review Summary \u2192" : "Next \u2192"),
      ]),
    ]));

    return wrap;
  }

  // ── buildInputControls ────────────────────────────────────────────────────
  //
  // Returns { element, flush } where flush() immediately commits any in-DOM
  // value to the store. This is called by navigation buttons before advancing
  // so that a user who types into a text/numeric field and clicks Next without
  // blurring first does not lose their answer.

  function buildInputControls(question, displayAnswer, isDeferred, s) {
    const wrap = el("div", {});
    let flushFn = () => {};

    // Platform/marketplace blocker
    if (question.id === "BM-01") {
      const isPlatform = displayAnswer === "Platform or marketplace (connecting buyers and sellers)";
      if (isPlatform) {
        wrap.append(el("div", {
          className: "ow-banner ow-banner--warning",
          style: "padding: 14px 16px; background: #FFF3CD; border-left: 3px solid #F0A500; margin-bottom: 14px;",
        }, [
          el("p", { style: "font-size: 13px; font-weight: 600; color: #7A5200;" }, "This option requires consultation with a project owner before proceeding. Please contact your implementation lead."),
        ]));
      }
    }

    if (isDeferred) {
      wrap.append(el("div", { className: "ow-panel ow-panel--notice", style: "padding: 10px 14px; background: var(--ee-surface-container); border-left: 3px solid var(--ee-outline); display: flex; align-items: center; gap: 8px;" }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 16px; color: var(--ee-on-surface-variant);", text: "schedule" }),
        el("span", { style: "font-size: 13px; color: var(--ee-on-surface-variant);" }, "Marked as deferred. Select an answer below to override."),
      ]));
    }

    switch (question.inputType) {
      case "boolean":
      case "single-select":
        buildSelectOptions(wrap, question, displayAnswer);
        break;
      case "multi-select":
        buildMultiSelectOptions(wrap, question, displayAnswer);
        break;
      case "numeric":
        flushFn = buildNumericInput(wrap, question, displayAnswer);
        break;
      case "text":
        flushFn = buildTextInput(wrap, question, displayAnswer);
        break;
      default:
        buildSelectOptions(wrap, question, displayAnswer);
    }

    return { element: wrap, flush: flushFn };
  }

  function buildSelectOptions(wrap, question, displayAnswer) {
    const options = el("div", { className: "ow-option-group", style: "display: flex; flex-direction: column; gap: 8px;" });
    question.options.forEach((opt) => {
      const isSelected = displayAnswer === opt;
      options.append(el("button", {
        className: `ow-option${isSelected ? " ow-option--selected" : ""}`,
        style: `width: 100%; text-align: left; padding: 12px 16px; background: ${isSelected ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"}; border-left: 3px solid ${isSelected ? "var(--ee-primary)" : "transparent"}; cursor: pointer;`,
        onclick: () => {
          onboardingStore.setAnswer(question.id, opt);
        },
      }, [
        el("div", { className: "ow-option-inner", style: "display: flex; align-items: center; gap: 10px;" }, [
          el("div", {
            className: `ow-option-indicator${isSelected ? " ow-option-indicator--selected" : ""}`,
            style: `width: 16px; height: 16px; flex-shrink: 0; border: 2px solid ${isSelected ? "var(--ee-primary)" : "var(--ee-outline)"}; display: flex; align-items: center; justify-content: center;`,
          }, isSelected ? [el("div", { className: "ow-option-indicator-dot", style: "width: 8px; height: 8px; background: var(--ee-primary);" })] : []),
          el("span", { className: `ow-option-label${isSelected ? " ow-option-label--selected" : ""}`, style: `font-size: 14px; color: ${isSelected ? "var(--ee-on-surface)" : "var(--ee-on-surface)"}; font-weight: ${isSelected ? "600" : "400"};`, text: opt }),
        ]),
      ]));
    });
    wrap.append(options);
  }

  function buildMultiSelectOptions(wrap, question, displayAnswer) {
    // displayAnswer is an array for multi-select
    const selected = Array.isArray(displayAnswer) ? displayAnswer : [];
    const options = el("div", { className: "ow-option-group", style: "display: flex; flex-direction: column; gap: 8px;" });
    question.options.forEach((opt) => {
      const isChecked = selected.includes(opt);
      options.append(el("button", {
        className: `ow-option ow-option--multi${isChecked ? " ow-option--selected" : ""}`,
        style: `width: 100%; text-align: left; padding: 12px 16px; background: ${isChecked ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"}; border-left: 3px solid ${isChecked ? "var(--ee-primary)" : "transparent"}; cursor: pointer;`,
        onclick: () => {
          const current = Array.isArray(onboardingStore.getState().answers[question.id]?.answer)
            ? [...onboardingStore.getState().answers[question.id].answer]
            : [];
          if (current.includes(opt)) {
            onboardingStore.setAnswer(question.id, current.filter((v) => v !== opt));
          } else {
            onboardingStore.setAnswer(question.id, [...current, opt]);
          }
        },
      }, [
        el("div", { className: "ow-option-inner", style: "display: flex; align-items: center; gap: 10px;" }, [
          el("div", {
            className: `ow-option-indicator${isChecked ? " ow-option-indicator--selected" : ""}`,
            style: `width: 16px; height: 16px; flex-shrink: 0; border: 2px solid ${isChecked ? "var(--ee-primary)" : "var(--ee-outline)"}; background: ${isChecked ? "var(--ee-primary)" : "transparent"}; display: flex; align-items: center; justify-content: center;`,
          }, isChecked ? [el("span", { className: "material-symbols-outlined", style: "font-size: 12px; color: white;", text: "check" })] : []),
          el("span", { className: `ow-option-label${isChecked ? " ow-option-label--selected" : ""}`, style: `font-size: 14px; color: var(--ee-on-surface); font-weight: ${isChecked ? "600" : "400"};`, text: opt }),
        ]),
      ]));
    });
    wrap.append(options);
  }

  function buildNumericInput(wrap, question, displayAnswer) {
    const input = el("input", {
      type: "number",
      className: "ee-input",
      placeholder: "Enter a number",
      value: displayAnswer !== null && displayAnswer !== undefined ? String(displayAnswer) : "",
      min: "1",
      style: "max-width: 200px;",
    });

    function commitNumeric() {
      const val = parseInt(input.value, 10);
      if (!isNaN(val) && val >= 1) {
        onboardingStore.setAnswer(question.id, val);
      }
    }

    // Commit to store only on blur to avoid re-render destroying focus on every keystroke.
    // Navigation buttons also call flush() (returned below) before advancing.
    input.addEventListener("blur", commitNumeric);
    wrap.append(input);

    // Return flush so callers can commit immediately before navigation
    return commitNumeric;
  }

  function buildTextInput(wrap, question, displayAnswer) {
    const input = el("input", {
      type: "text",
      className: "ee-input",
      placeholder: question.id === "BM-03" ? "e.g. Australia, United Kingdom, United States" : "Enter your answer",
      value: displayAnswer !== null && displayAnswer !== undefined ? String(displayAnswer) : "",
    });

    function commitText() {
      const val = input.value.trim();
      if (val) {
        onboardingStore.setAnswer(question.id, val);
      }
    }

    // Commit to store only on blur to avoid re-render destroying focus on every keystroke.
    // Navigation buttons also call flush() (returned below) before advancing.
    input.addEventListener("blur", commitText);
    wrap.append(input);

    // Return flush so callers can commit immediately before navigation
    return commitText;
  }

  // ── advanceQuestion ───────────────────────────────────────────────────────

  function advanceQuestion(visibleQuestions, idx) {
    local.tempAnswer = null;
    if (idx >= visibleQuestions.length - 1) {
      onboardingStore.setScreen("summary");
    } else {
      onboardingStore.nextQuestion();
    }
  }

  // ── SCREEN: Irreversible Warning ──────────────────────────────────────────

  function buildIrreversibleWarningScreen(s) {
    const { questionId, selectedAnswer } = s.pending_irreversible || {};
    const wrap = el("div", { style: "width: 100%; max-width: 700px;" });

    const card = el("div", { className: "ow-card ow-card--warning", style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg); padding: 32px; border-top: 4px solid var(--ee-error);" });

    card.append(el("div", { style: "display: flex; align-items: center; gap: 12px; margin-bottom: 20px;" }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 28px; color: var(--ee-error);", text: "warning" }),
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-error);" },
        questionId === "BM-03"
          ? "This decision cannot be changed after accounting entries are posted."
          : selectedAnswer === "Yes"
            ? "Activating Manufacturing changes your implementation sequence permanently."
            : "Excluding Manufacturing removes all production configuration from your implementation."
      ),
    ]));

    if (questionId === "BM-03") {
      card.append(buildIrreversibleBM03Body(selectedAnswer));
    } else if (questionId === "MF-01") {
      card.append(buildIrreversibleMF01Body(selectedAnswer));
    }

    // Confirm button
    const confirmLabel = questionId === "BM-03"
      ? `I understand \u2014 this country selection is permanent after accounting entries are posted. Confirm "${selectedAnswer}" and continue.`
      : selectedAnswer === "Yes"
        ? "I understand \u2014 Manufacturing is a Go-Live domain and its activation is permanent under this project scope. Confirm Yes and continue."
        : "I understand \u2014 Manufacturing is excluded and all MF steps will be skipped. Confirm No and continue.";

    card.append(el("button", {
      className: "ee-btn ee-btn--primary",
      style: "margin-top: 24px; width: 100%;",
      onclick: () => {
        // Commit the answer and clear pending
        onboardingStore.setAnswer(questionId, selectedAnswer);
        // Recompute visible questions with updated answers then advance
        const updatedState = onboardingStore.getState();
        const visibleQuestions = getVisibleQuestions(updatedState.answers);
        const currentIdx = updatedState.current_question_index;
        onboardingStore.clearPendingIrreversible();
        // After clear, screen is "questions" — advance one step
        if (currentIdx >= visibleQuestions.length - 1) {
          onboardingStore.setScreen("summary");
        } else {
          onboardingStore.nextQuestion();
        }
      },
    }, confirmLabel));

    card.append(el("button", {
      style: "width: 100%; margin-top: 10px; background: none; border: 1px solid var(--ee-outline); padding: 10px; font-size: 14px; cursor: pointer; color: var(--ee-on-surface);",
      onclick: () => {
        // Return to question without recording answer
        onboardingStore.clearPendingIrreversible();
      },
    }, "Go back"));

    wrap.append(card);
    return wrap;
  }

  function buildIrreversibleBM03Body(country) {
    return el("div", { style: "display: flex; flex-direction: column; gap: 14px;" }, [
      el("div", { className: "ow-panel ow-panel--error", style: "padding: 14px; background: var(--ee-error-soft);" }, [
        el("p", { style: "font-size: 13px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 6px;" }, "Domains affected:"),
        el("ul", { style: "margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;" }, [
          el("li", { style: "font-size: 13px; color: var(--ee-on-surface);" }, "Foundation: The localization package for the selected country will be applied. This sets the chart of accounts template, default tax configuration, fiscal position baseline, and legal reporting requirements for your entire implementation."),
          el("li", { style: "font-size: 13px; color: var(--ee-on-surface);" }, "Accounting: The chart of accounts template, tax rule baseline, and bank statement format are derived from this selection. Changing the country after accounting entries are posted is not supported."),
          el("li", { style: "font-size: 13px; color: var(--ee-on-surface);" }, "All domains: The default currency for every domain is set by this selection."),
        ]),
      ]),
      el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant);" }, `Selected country: ${country || "(not entered)"}. Confirming this answer locks the localization package for the Foundation domain. If you are not certain of the primary operating country, do not proceed.`),
    ]);
  }

  function buildIrreversibleMF01Body(answer) {
    if (answer === "Yes") {
      return el("div", { style: "display: flex; flex-direction: column; gap: 14px;" }, [
        el("div", { className: "ow-panel ow-panel--error", style: "padding: 14px; background: var(--ee-error-soft);" }, [
          el("p", { style: "font-size: 13px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 6px;" }, "Domains activated:"),
          el("ul", { style: "margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;" }, [
            el("li", { style: "font-size: 13px; color: var(--ee-on-surface);" }, "Manufacturing (MRP): activated at Go-Live priority. Bills of Materials, work centers, production orders, and manufacturing stock movements are all in scope. All MF-02 through MF-07 questions will be presented."),
            el("li", { style: "font-size: 13px; color: var(--ee-on-surface);" }, "Inventory: production stock movements become required. The Inventory domain must be configured and at a checkpoint-passing state before Manufacturing go-live."),
            el("li", { style: "font-size: 13px; color: var(--ee-on-surface);" }, "Accounting / Finance: production costing and Work-In-Progress (WIP) policy become required configuration items."),
          ]),
        ]),
        el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant);" }, "Manufacturing is a Go-Live domain. It cannot be deferred to a later phase without a formal scope change."),
      ]);
    }
    return el("div", { style: "display: flex; flex-direction: column; gap: 14px;" }, [
      el("div", { className: "ow-panel ow-panel--error", style: "padding: 14px; background: var(--ee-error-soft);" }, [
        el("p", { style: "font-size: 13px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 6px;" }, "Domains excluded:"),
        el("ul", { style: "margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;" }, [
          el("li", { style: "font-size: 13px; color: var(--ee-on-surface);" }, "Manufacturing (MRP): excluded from scope. No Bills of Materials, work orders, or production costing will be configured."),
          el("li", { style: "font-size: 13px; color: var(--ee-on-surface);" }, "All MF-02 through MF-07 questions will be skipped."),
        ]),
      ]),
      el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant);" }, "If your business later begins manufacturing, re-adding the Manufacturing domain after go-live requires a formal scope change and a new implementation stage."),
    ]);
  }

  // ── SCREEN FINAL: Summary ─────────────────────────────────────────────────

  function buildSummaryScreen(s) {
    const wrap = el("div", { style: "width: 100%; max-width: 800px;" });

    wrap.append(el("div", { style: "margin-bottom: 24px;" }, [
      el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 6px;" }, "Step 4 of 4 — Summary"),
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 22px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 6px;" }, "Review and confirm"),
      el("p", { style: "font-size: 14px; color: var(--ee-on-surface-variant);" }, "Review your answers and confirm the implementation scope before triggering the pipeline."),
    ]));

    const visibleQuestions = getVisibleQuestions(s.answers);

    // 1. Answers reviewed — grouped by section, collapsible
    wrap.append(buildAnswersSection(s, visibleQuestions));

    // 2. Domains that will be activated
    wrap.append(buildDomainsSection(s));

    // 3. Defaulted activations (amber box, only if deferred questions)
    const defaultedDomains = onboardingStore.getDefaultedDomains();
    if (defaultedDomains.length > 0) {
      wrap.append(buildDefaultedActivationsSection(s, defaultedDomains));
    }

    // 4. Commitment statement
    wrap.append(buildCommitmentSection());

    // 5. Deferred acknowledgement checkbox (only if deferred)
    const deferredCount = onboardingStore.getDeferredCount();
    const defaultedDomainsCount = defaultedDomains.reduce((acc, d) => acc + d.domains.length, 0);
    if (deferredCount > 0) {
      wrap.append(buildDeferredAcknowledgement(s, deferredCount, defaultedDomainsCount));
    }

    // 6. Commitment checkbox
    wrap.append(buildConfirmCheckbox(s));

    // 7. Confirm button
    const allRequired = visibleQuestions.filter((q) => q.required);
    const missingRequired = allRequired.filter((q) => {
      const ans = s.answers[q.id];
      if (!ans) return true;
      if (ans.deferred) return false; // deferred is allowed (will get default)
      if (Array.isArray(ans.answer)) return ans.answer.length === 0;
      return ans.answer === null || ans.answer === undefined || ans.answer === "";
    });

    const deferredOk = deferredCount === 0 || s.deferred_acknowledged;
    const confirmedOk = s.confirmed;
    const ta04Answer = s.answers["TA-04"];
    const ta04Ok = ta04Answer && !ta04Answer.deferred && ta04Answer.answer;
    const canConfirm = missingRequired.length === 0 && deferredOk && confirmedOk && ta04Ok;

    if (missingRequired.length > 0) {
      wrap.append(el("div", { className: "ow-panel ow-panel--error", style: "padding: 12px 16px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error); margin-bottom: 16px;" }, [
        el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-error); margin-bottom: 6px;" }, `${missingRequired.length} required question(s) unanswered:`),
        el("ul", { style: "margin: 0; padding-left: 16px;" },
          missingRequired.map((q) => el("li", { style: "font-size: 13px; color: var(--ee-error);" }, `${q.id}: ${q.text.substring(0, 60)}...`))
        ),
      ]));
    }

    if (!ta04Ok && visibleQuestions.some((q) => q.id === "TA-04")) {
      wrap.append(el("div", { className: "ow-panel ow-panel--error", style: "padding: 10px 14px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error); margin-bottom: 12px;" }, [
        el("p", { style: "font-size: 13px; color: var(--ee-error);" }, "TA-04 (System administrator name) must be answered — it cannot be deferred."),
      ]));
    }

    const projectId = getProjectId();
    const isLoading = s.status === "loading";
    const noProject = !projectId;

    if (noProject) {
      wrap.append(el("div", { className: "ow-panel ow-panel--error", style: "padding: 12px 16px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error); margin-bottom: 16px;" }, [
        el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-error);" }, "No project ID available. Please sign in again."),
        el("button", {
          className: "ee-btn ee-btn--secondary",
          style: "margin-top: 8px;",
          onclick: () => setCurrentView("auth"),
        }, "Go to Sign In"),
      ]));
    }

    wrap.append(el("div", { style: "display: flex; gap: 12px; margin-top: 8px; justify-content: space-between; align-items: center;" }, [
      el("button", {
        className: "ee-btn ee-btn--secondary",
        onclick: () => {
          onboardingStore.setScreen("questions");
          onboardingStore.goToQuestion(0);
        },
      }, "\u2190 Back to Questions"),

      el("button", {
        className: "ee-btn ee-btn--primary",
        style: `min-width: 200px; ${(!canConfirm || isLoading || noProject) ? "opacity: 0.5; cursor: not-allowed;" : ""}`,
        disabled: !canConfirm || isLoading || noProject,
        onclick: async () => {
          if (!canConfirm || isLoading || !projectId) return;
          const result = await onboardingStore.confirmAndRun(projectId);
          if (result.ok) {
            onComplete({ projectId, runtimeState: result.runtime_state ?? null });
          }
        },
      }, isLoading ? "Running pipeline..." : "Confirm and Run Pipeline"),
    ]));

    if (s.status === "failure" && s.error) {
      wrap.append(el("div", { className: "ow-panel ow-panel--error", style: "padding: 12px 16px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error); margin-top: 12px;" }, [
        el("p", { style: "font-size: 14px; font-weight: 600; color: var(--ee-error);" }, s.error),
      ]));
    }

    return wrap;
  }

  function buildAnswersSection(s, visibleQuestions) {
    const section = el("div", { className: "ow-card ow-summary-card", style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg); margin-bottom: 16px;" });

    section.append(el("div", { style: "padding: 16px 20px; border-bottom: 1px solid var(--ee-outline-variant);" }, [
      el("h3", { style: "font-size: 15px; font-weight: 700; color: var(--ee-on-surface); margin: 0;" }, "Answers reviewed"),
    ]));

    // Group by section
    const sections = {};
    visibleQuestions.forEach((q) => {
      if (!sections[q.section]) sections[q.section] = [];
      sections[q.section].push(q);
    });

    Object.entries(sections).forEach(([sectionName, questions]) => {
      const isExpanded = local.expandedSections[sectionName] !== false; // default open
      const sectionWrap = el("div", { style: "border-bottom: 1px solid var(--ee-outline-variant);" });

      sectionWrap.append(el("button", {
        style: "width: 100%; text-align: left; padding: 12px 20px; background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between;",
        onclick: () => {
          local.expandedSections[sectionName] = !isExpanded;
          render();
        },
      }, [
        el("span", { style: "font-size: 13px; font-weight: 700; color: var(--ee-on-surface);" }, sectionName),
        el("span", { className: "material-symbols-outlined", style: "font-size: 18px; color: var(--ee-on-surface-variant);", text: isExpanded ? "expand_less" : "expand_more" }),
      ]));

      if (isExpanded) {
        const answersWrap = el("div", { style: "padding: 0 20px 12px;" });
        questions.forEach((q) => {
          const ans = s.answers[q.id];
          const isUnanswered = !ans || (ans.answer === null && !ans.deferred);
          const isDeferred = ans?.deferred === true;

          const rowStyle = `display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--ee-outline-variant);`;
          const answerText = isDeferred
            ? "Deferred — using default"
            : Array.isArray(ans?.answer)
              ? ans.answer.join(", ") || "(none selected)"
              : ans?.answer !== null && ans?.answer !== undefined
                ? String(ans.answer)
                : "(not answered)";

          answersWrap.append(el("div", { style: rowStyle }, [
            el("div", { style: "flex: 1;" }, [
              el("span", { style: "font-size: 11px; font-weight: 700; color: var(--ee-outline); margin-right: 6px;", text: q.id }),
              el("span", { style: "font-size: 13px; color: var(--ee-on-surface);" }, q.text.substring(0, 80) + (q.text.length > 80 ? "..." : "")),
              el("div", { style: "margin-top: 4px;" }, [
                el("span", {
                  style: `font-size: 12px; font-weight: 600; color: ${isUnanswered ? "var(--ee-error)" : isDeferred ? "var(--ee-outline)" : "var(--ee-on-surface)"};`,
                  text: answerText,
                }),
              ]),
            ]),
            el("button", {
              style: "background: none; border: none; color: var(--ee-primary); font-size: 12px; cursor: pointer; text-decoration: underline; white-space: nowrap; flex-shrink: 0; padding-top: 2px;",
              onclick: () => {
                const visQ = getVisibleQuestions(s.answers);
                const qIdx = visQ.findIndex((vq) => vq.id === q.id);
                if (qIdx >= 0) onboardingStore.goToQuestion(qIdx);
              },
            }, "Edit"),
          ]));
        });
        sectionWrap.append(answersWrap);
      }

      section.append(sectionWrap);
    });

    return section;
  }

  function buildDomainsSection(s) {
    const section = el("div", { className: "ow-card ow-summary-card", style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg); margin-bottom: 16px; padding: 20px;" });

    section.append(el("h3", { style: "font-size: 15px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 14px;" }, "Domains that will be activated"));

    const allDomains = new Set(s.activated_domains_preview || []);

    if (allDomains.size === 0) {
      section.append(el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant);" }, "Domain activation will be computed when the pipeline runs."));
    } else {
      const list = el("div", { style: "display: flex; flex-wrap: wrap; gap: 8px;" });
      allDomains.forEach((domain) => {
        list.append(el("span", {
          className: "ow-chip ow-chip--active",
          style: "font-size: 12px; font-weight: 600; padding: 4px 10px; background: var(--ee-primary); color: white; text-transform: uppercase; letter-spacing: 0.04em;",
          text: domain,
        }));
      });
      section.append(list);
    }

    return section;
  }

  function buildDefaultedActivationsSection(s, defaultedDomains) {
    const section = el("div", { className: "ow-warning-card", style: "background: #FFF3CD; border: 1px solid #F0A500; padding: 20px; margin-bottom: 16px;" });

    section.append(el("div", { style: "display: flex; align-items: center; gap: 8px; margin-bottom: 12px;" }, [
      el("span", { className: "material-symbols-outlined", style: "color: #F0A500; font-size: 20px;", text: "warning" }),
      el("h3", { style: "font-size: 14px; font-weight: 700; color: #7A5200; margin: 0;" }, "Domains activated by default — unanswered questions"),
    ]));

    section.append(el("p", { style: "font-size: 13px; color: #7A5200; margin-bottom: 12px;" }, "These domains have been activated using the maximum-scope default because you deferred the following questions. Answer them to refine your scope."));

    defaultedDomains.forEach(({ questionId, defaultAnswer, domains }) => {
      const q = QUESTIONS.find((q) => q.id === questionId);
      section.append(el("div", { className: "ow-defaulted-row", style: "padding: 10px 12px; background: rgba(255,255,255,0.5); margin-bottom: 8px; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;" }, [
        el("div", {}, [
          el("p", { style: "font-size: 12px; font-weight: 700; color: #7A5200; margin-bottom: 2px;" }, `${questionId} — deferred`),
          el("p", { style: "font-size: 12px; color: #7A5200; margin-bottom: 4px;" }, `Assumed: ${defaultAnswer}`),
          el("div", { style: "display: flex; flex-wrap: wrap; gap: 4px;" },
            domains.map((d) => el("span", { className: "ow-chip", style: "font-size: 11px; padding: 2px 6px; background: #F0A500; color: white; font-weight: 600; text-transform: uppercase;", text: d }))
          ),
        ]),
        el("button", {
          style: "background: none; border: none; color: #7A5200; font-size: 12px; cursor: pointer; text-decoration: underline; white-space: nowrap; flex-shrink: 0;",
          onclick: () => {
            const visQ = getVisibleQuestions(s.answers);
            const qIdx = visQ.findIndex((vq) => vq.id === questionId);
            if (qIdx >= 0) onboardingStore.goToQuestion(qIdx);
          },
        }, "Go back"),
      ]));
    });

    return section;
  }

  function buildCommitmentSection() {
    return el("div", { className: "ow-card ow-commitment-card", style: "background: var(--ee-surface-container-low); padding: 20px; margin-bottom: 16px; border-left: 3px solid var(--ee-primary);" }, [
      el("h3", { style: "font-size: 14px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 10px;" }, "What confirming this screen does"),
      el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant); line-height: 1.6;" }, "Confirming this screen locks the discovery answers as the project business profile, triggers a pipeline run that activates the listed domains, and cannot be undone without raising a formal scope change. The pipeline run is governed by the standard preview, safety class, and auditability confirmation flow."),
    ]);
  }

  function buildDeferredAcknowledgement(s, deferredCount, domainCount) {
    return el("div", {
      className: `ow-toggle-card${s.deferred_acknowledged ? " ow-toggle-card--active" : ""}`,
      style: `padding: 14px 16px; background: ${s.deferred_acknowledged ? "var(--ee-success-soft)" : "var(--ee-surface-container)"}; border: 2px solid ${s.deferred_acknowledged ? "var(--ee-success)" : "var(--ee-outline)"}; margin-bottom: 12px; cursor: pointer; display: flex; align-items: flex-start; gap: 12px;`,
      onclick: () => onboardingStore.setDeferredAcknowledged(!s.deferred_acknowledged),
    }, [
      el("div", {
        className: `ow-toggle-indicator${s.deferred_acknowledged ? " ow-toggle-indicator--active" : ""}`,
        style: `width: 18px; height: 18px; flex-shrink: 0; border: 2px solid ${s.deferred_acknowledged ? "var(--ee-success)" : "var(--ee-outline)"}; background: ${s.deferred_acknowledged ? "var(--ee-success)" : "transparent"}; display: flex; align-items: center; justify-content: center; margin-top: 1px;`,
      }, s.deferred_acknowledged ? [el("span", { className: "material-symbols-outlined", style: "font-size: 13px; color: white;", text: "check" })] : []),
      el("p", { style: "font-size: 13px; color: var(--ee-on-surface); line-height: 1.5; margin: 0;" },
        `I acknowledge that ${domainCount} domain(s) have been activated by default because I deferred ${deferredCount} question(s). I understand the implementation scope may be larger than necessary and I can reduce it by answering those questions before confirming.`
      ),
    ]);
  }

  function buildConfirmCheckbox(s) {
    return el("div", {
      className: `ow-toggle-card${s.confirmed ? " ow-toggle-card--active" : ""}`,
      style: `padding: 14px 16px; background: ${s.confirmed ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"}; border: 2px solid ${s.confirmed ? "var(--ee-primary)" : "var(--ee-outline)"}; margin-bottom: 16px; cursor: pointer; display: flex; align-items: flex-start; gap: 12px;`,
      onclick: () => onboardingStore.setConfirmed(!s.confirmed),
    }, [
      el("div", {
        className: `ow-toggle-indicator${s.confirmed ? " ow-toggle-indicator--active" : ""}`,
        style: `width: 18px; height: 18px; flex-shrink: 0; border: 2px solid ${s.confirmed ? "var(--ee-primary)" : "var(--ee-outline)"}; background: ${s.confirmed ? "var(--ee-primary)" : "transparent"}; display: flex; align-items: center; justify-content: center; margin-top: 1px;`,
      }, s.confirmed ? [el("span", { className: "material-symbols-outlined", style: "font-size: 13px; color: white;", text: "check" })] : []),
      el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface); margin: 0;" }, "I understand what will be set up for my business and I am ready to run the implementation pipeline."),
    ]);
  }
}
