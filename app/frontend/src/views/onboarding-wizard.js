// ---------------------------------------------------------------------------
// Onboarding Wizard View — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Pattern: local state object, container node, render() clears and rebuilds.
// All visuals are driven by tokens.css (Kinso-inspired design system).
// ---------------------------------------------------------------------------

import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { onboardingStore, normaliseOdooUrl } from "../state/onboarding-store.js";
import { setCurrentView } from "../state/app-store.js";

function getProjectId() {
  const state = onboardingStore.getState();
  return state.connection?.project_id || null;
}

// ---------------------------------------------------------------------------
// Inject shared keyframes once (loading pulse + spinner).
// ---------------------------------------------------------------------------

function ensureOnboardingKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById("pod-onboarding-keyframes")) return;
  const style = document.createElement("style");
  style.id = "pod-onboarding-keyframes";
  style.textContent = `
@keyframes pod-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.55; }
}
@keyframes pod-spin {
  to { transform: rotate(360deg); }
}
`;
  document.head.appendChild(style);
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
    icon: "shopping-bag",
    modules: ["pos", "inventory", "sales", "website_ecommerce", "accounting", "crm"],
  },
  {
    id: "distribution",
    name: "Distribution & Wholesale",
    description: "For businesses that buy and sell without manufacturing",
    icon: "truck",
    modules: ["purchase", "sales", "inventory", "accounting", "crm"],
  },
  {
    id: "services",
    name: "Services & Projects",
    description: "For businesses selling time and expertise",
    icon: "users",
    modules: ["projects", "sales", "accounting", "hr", "crm"],
  },
];

const FISCAL_YEAR_END_MONTH_OPTIONS = Object.freeze([
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]);

const VALID_FISCAL_YEAR_END_MONTHS = new Set(
  FISCAL_YEAR_END_MONTH_OPTIONS.map((entry) => entry.value)
);

// ---------------------------------------------------------------------------
// QUESTION DEFINITIONS — 78 questions, ordered by section
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

  // ── Section 9 — People Operations & Time ────────────────────────────────
  {
    id: "TS-01",
    section: "People Operations & Time",
    sectionIndex: 9,
    text: "Do your employees need to log time against projects or tasks?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Activates Timesheets and Projects so every internal or billable hour is captured for planning, invoicing, and approvals.",
    deferredDefault: "Yes",
  },
  {
    id: "EX-01",
    section: "People Operations & Time",
    sectionIndex: 9,
    text: "Do employees submit expense claims for reimbursement?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Activates the Expenses domain plus Accounting reimbursement rules so out-of-pocket spend is governed.",
    deferredDefault: "Yes",
  },
  {
    id: "AT-01",
    section: "People Operations & Time",
    sectionIndex: 9,
    text: "How do you track employee attendance?",
    inputType: "single-select",
    options: [
      "Manual entry",
      "Kiosk / badge scan",
      "Mobile app",
      "We don't track attendance",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Attendance domain activation — the selected method drives device setup, kiosk policies, and HR linkage.",
    deferredDefault: "Manual entry",
  },

  // ── Section 10 — Talent Acquisition ─────────────────────────────────────
  {
    id: "RC-01",
    section: "Talent Acquisition",
    sectionIndex: 10,
    text: "Do you manage job vacancies and candidate applications?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Recruitment domain activation — job positions, pipelines, and candidate communications move in scope.",
    deferredDefault: "Yes",
  },

  // ── Section 11 — Fleet & Assets ─────────────────────────────────────────
  {
    id: "FL-01",
    section: "Fleet & Assets",
    sectionIndex: 11,
    text: "Does your business operate company vehicles?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Fleet domain activation — vehicles, drivers, and contract tracking become governed scope.",
    deferredDefault: "No",
  },

  // ── Section 12 — Events & Marketing ─────────────────────────────────────
  {
    id: "EV-01",
    section: "Events & Marketing",
    sectionIndex: 12,
    text: "Does your business run events, workshops, or training sessions?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Events domain activation — agendas, speakers, ticketing, and attendee workflows move into scope.",
    deferredDefault: "No",
  },
  {
    id: "EM-01",
    section: "Events & Marketing",
    sectionIndex: 12,
    text: "Do you send bulk marketing emails or newsletters to customers?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Email Marketing domain activation — campaigns, templates, and consent tracking enter scope.",
    deferredDefault: "No",
  },

  // ── Section 13 — Service & Support ──────────────────────────────────────
  {
    id: "HD-01",
    section: "Service & Support",
    sectionIndex: 13,
    text: "Do you need a customer support ticketing system?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Helpdesk domain activation — queues, stages, and support agents go in scope.",
    deferredDefault: "Yes",
  },

  // ── Section 14 — Payroll & Shift Planning ───────────────────────────────
  {
    id: "PY-01",
    section: "Payroll & Shift Planning",
    sectionIndex: 14,
    text: "Do you process employee payroll in Odoo?",
    inputType: "single-select",
    options: ["Yes", "No", "We use an external payroll system"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Payroll domain activation ties HR, Accounting, and statutory reporting together when set to Yes.",
    deferredDefault: "Yes",
  },
  {
    id: "PL-01",
    section: "Payroll & Shift Planning",
    sectionIndex: 14,
    text: "Do you schedule shifts or resources in advance for your team?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Planning domain activation — shift boards, staffing plans, and HR integration go live.",
    deferredDefault: "No",
  },

  // ── Section 15 — Knowledge & Collaboration ──────────────────────────────
  {
    id: "KN-01",
    section: "Knowledge & Collaboration",
    sectionIndex: 15,
    text: "Do you need an internal knowledge base or document library?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Knowledge domain activation — internal articles, SOPs, and document governance become part of scope.",
    deferredDefault: "Yes",
  },
  {
    id: "DI-01",
    section: "Knowledge & Collaboration",
    sectionIndex: 15,
    text: "Do your teams use internal messaging channels in Odoo?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Discuss / Messaging is a core module — this confirms channel naming, notifications, and in-scope uses.",
    deferredDefault: "Yes",
  },

  // ── Section 16 — Mail Infrastructure ────────────────────────────────────
  {
    id: "OM-01",
    section: "Mail Infrastructure",
    sectionIndex: 16,
    text: "What email provider sends your business emails?",
    inputType: "single-select",
    options: [
      "Gmail / Google Workspace",
      "Microsoft 365 / Outlook",
      "Custom SMTP server",
      "Odoo default (odoo.com relay)",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Configures outgoing mail servers for every domain (WARNING: Odoo default relay is limited to ~200 emails/day and is frequently flagged as spam — we recommend your own provider).",
    deferredDefault: "Gmail / Google Workspace",
  },
  {
    id: "OM-02",
    section: "Mail Infrastructure",
    sectionIndex: 16,
    text: "Do different departments need separate sender addresses? (e.g. sales@, support@, invoices@)",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Configures multiple outgoing sender domains and routing rules per department.",
    deferredDefault: "Yes",
  },
  {
    id: "IM-01",
    section: "Mail Infrastructure",
    sectionIndex: 16,
    text: "Do you want replies to Odoo emails to automatically create or update records? (e.g. reply to invoice logged on customer account)",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Incoming Mail connectors capture replies so CRM, Helpdesk, Accounting, and Projects stay in sync.",
    deferredDefault: "Yes",
  },
  {
    id: "IM-02",
    section: "Mail Infrastructure",
    sectionIndex: 16,
    text: "Which email aliases do you need?",
    inputType: "multi-select",
    options: [
      "sales@  CRM leads",
      "support@  Helpdesk tickets",
      "invoices@  Customer account",
      "jobs@  Recruitment applications",
      "info@  General inbox",
    ],
    required: true,
    unconditional: false,
    condition: (answers) => answers["IM-01"]?.answer === "Yes",
    irreversible: false,
    allowDefer: true,
    domainImpact: "Maps inbound aliases to the right modules so replies create CRM leads, helpdesk tickets, invoices, or job applications automatically.",
    deferredDefault: ["sales@  CRM leads", "support@  Helpdesk tickets"],
  },

  // ── Section 17 — Reporting & Analytics ──────────────────────────────────
  {
    id: "AR-01",
    section: "Reporting & Analytics",
    sectionIndex: 17,
    text: "Do you need custom financial reports beyond Odoo standard?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Accounting Reports domain activation — custom management packs, boards, and KPIs move into scope.",
    deferredDefault: "No",
  },
  {
    id: "SP-01",
    section: "Reporting & Analytics",
    sectionIndex: 17,
    text: "Do your teams build financial models or reports in shared spreadsheets connected to live Odoo data?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Spreadsheet domain activation — collaborative, live-data spreadsheets and templates become part of implementation scope.",
    deferredDefault: "No",
  },

  // ── Section 18 — Customer Chat & Messaging ──────────────────────────────
  {
    id: "LC-01",
    section: "Customer Chat & Messaging",
    sectionIndex: 18,
    text: "Do you have a live chat widget on your website?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Live Chat domain activation — website widget, channel routing, and staffing requirements go live.",
    deferredDefault: "No",
  },
  {
    id: "WA-01",
    section: "Customer Chat & Messaging",
    sectionIndex: 18,
    text: "Do you communicate with customers via WhatsApp Business?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "WhatsApp channel activation — template approvals, phone numbers, and opt-in flows come into scope.",
    deferredDefault: "No",
  },
  {
    id: "SM-01",
    section: "Customer Chat & Messaging",
    sectionIndex: 18,
    text: "Do you send SMS messages to customers for marketing or alerts?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "SMS Marketing domain activation — templates, credits, and compliance flows are configured when Yes.",
    deferredDefault: "No",
  },

  // ── Section 19 — Calendar & Scheduling ──────────────────────────────────
  {
    id: "CA-01",
    section: "Calendar & Scheduling",
    sectionIndex: 19,
    text: "Do your team members need calendar sync with Google Calendar or Microsoft Outlook?",
    inputType: "single-select",
    options: [
      "Google Calendar",
      "Microsoft Outlook",
      "Both",
      "No external calendar sync needed",
    ],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Calendar sync connectors are configured for the providers you select so meetings and activities stay aligned.",
    deferredDefault: "Google Calendar",
  },

  // ── Section 20 — Performance & Appraisals ───────────────────────────────
  {
    id: "AP-01",
    section: "Performance & Appraisals",
    sectionIndex: 20,
    text: "Do you run formal employee performance appraisals?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Appraisals domain activation — review templates, cycles, and HR checkpoints are planned when Yes.",
    deferredDefault: "No",
  },

  // ── Section 21 — Loyalty & Gift Cards ───────────────────────────────────
  {
    id: "LY-01",
    section: "Loyalty & Gift Cards",
    sectionIndex: 21,
    text: "Do you run a customer loyalty programme or sell gift cards?",
    inputType: "single-select",
    options: ["Loyalty points programme", "Gift cards", "Both", "Neither"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Loyalty / Gift Card modules are configured for the option(s) you select across POS and eCommerce.",
    deferredDefault: "Neither",
  },

  // ── Section 22 — Referral Programs ──────────────────────────────────────
  {
    id: "RF-01",
    section: "Referral Programs",
    sectionIndex: 22,
    text: "Do you have an employee referral programme for recruitment?",
    inputType: "boolean",
    options: ["Yes", "No"],
    required: true,
    unconditional: true,
    condition: null,
    irreversible: false,
    allowDefer: true,
    domainImpact: "Referrals domain activation — ties employee referrals to Recruitment stages and reward tracking.",
    deferredDefault: "No",
  },
];

// ---------------------------------------------------------------------------
// Helper: compute visible questions given current answers
// ---------------------------------------------------------------------------

function getVisibleQuestions(answers) {
  return QUESTIONS.filter((q) => q.condition === null || q.condition(answers));
}

// ---------------------------------------------------------------------------
// Style helpers — all values via tokens.css
// ---------------------------------------------------------------------------

const STYLE = {
  heroCanvas:
    "min-height: 100vh;" +
    " background: var(--canvas-bloom-warm-hero), var(--canvas-bloom-cool-hero), var(--color-canvas-base);" +
    " display: flex; flex-direction: column; align-items: center;" +
    " padding: var(--space-8) var(--space-5) var(--space-16); box-sizing: border-box;",
  column: "width: 100%; max-width: 720px; display: flex; flex-direction: column; gap: var(--space-6);",
  eyebrow:
    "font-size: var(--fs-tiny); font-weight: 600; color: var(--color-muted);" +
    " text-transform: uppercase; letter-spacing: var(--track-eyebrow); margin: 0;",
  h1:
    "font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 600;" +
    " letter-spacing: var(--track-tight); line-height: var(--lh-snug);" +
    " color: var(--color-ink); margin: 0;",
  h1Display:
    "font-family: var(--font-display); font-size: var(--fs-display); font-weight: 600;" +
    " letter-spacing: var(--track-tight); line-height: var(--lh-tight);" +
    " color: var(--color-ink); margin: 0;",
  h2:
    "font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 600;" +
    " color: var(--color-ink); line-height: var(--lh-snug); margin: 0;",
  h3:
    "font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 600;" +
    " color: var(--color-ink); margin: 0;",
  body:
    "font-family: var(--font-body); font-size: var(--fs-body); color: var(--color-body);" +
    " line-height: var(--lh-body); margin: 0;",
  muted:
    "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-muted);" +
    " line-height: var(--lh-body); margin: 0;",
  card:
    "background: var(--color-surface); border: 1px solid var(--color-line);" +
    " border-radius: var(--radius-card); padding: var(--space-7); box-shadow: var(--shadow-raised);",
  panel:
    "background: var(--color-surface); border: 1px solid var(--color-line);" +
    " border-radius: var(--radius-panel); padding: var(--space-5);",
  softPanel:
    "background: var(--color-line-soft); border: 1px solid var(--color-line);" +
    " border-radius: var(--radius-panel); padding: var(--space-4) var(--space-5);",
  reviewPanel:
    "background: var(--color-chip-review-bg); color: var(--color-chip-review-fg);" +
    " border: 1px solid var(--color-line); border-radius: var(--radius-panel);" +
    " padding: var(--space-4) var(--space-5);",
  input:
    "width: 100%; background: var(--color-surface); color: var(--color-ink);" +
    " border: 1px solid var(--color-line); border-radius: var(--radius-input);" +
    " padding: 10px 14px; font-family: var(--font-body); font-size: var(--fs-body);" +
    " line-height: var(--lh-snug); box-sizing: border-box; outline: none;",
  chip:
    "display: inline-flex; align-items: center; padding: 4px 10px;" +
    " background: var(--color-chip-bg); color: var(--color-chip-fg);" +
    " border-radius: var(--radius-chip); font-size: var(--fs-tiny); font-weight: 600;" +
    " text-transform: uppercase; letter-spacing: var(--track-eyebrow);",
  chipReady:
    "display: inline-flex; align-items: center; padding: 4px 10px;" +
    " background: var(--color-chip-ready-bg); color: var(--color-chip-ready-fg);" +
    " border-radius: var(--radius-chip); font-size: var(--fs-tiny); font-weight: 600;" +
    " text-transform: uppercase; letter-spacing: var(--track-eyebrow);",
  pillPrimary:
    "display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);" +
    " background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg);" +
    " border: none; border-radius: var(--radius-pill); padding: 12px 22px;" +
    " font-family: var(--font-body); font-size: var(--fs-body); font-weight: 600;" +
    " cursor: pointer; transition: opacity var(--dur-fast) var(--ease);",
  pillSecondary:
    "display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);" +
    " background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg);" +
    " border: 1px solid var(--color-pill-secondary-border); border-radius: var(--radius-pill);" +
    " padding: 12px 22px; font-family: var(--font-body); font-size: var(--fs-body);" +
    " font-weight: 600; cursor: pointer; transition: opacity var(--dur-fast) var(--ease);",
  linkButton:
    "background: none; border: none; padding: 4px 8px;" +
    " color: var(--color-muted); font-family: var(--font-body); font-size: var(--fs-small);" +
    " text-decoration: underline; cursor: pointer;",
  gradientText:
    "background: var(--accent-grad); -webkit-background-clip: text; background-clip: text;" +
    " -webkit-text-fill-color: transparent; color: transparent;",
};

function inkSpan(text) {
  return el("span", { style: "color: var(--color-ink);" }, text);
}

function mutedSpan(text) {
  return el("span", { style: "color: var(--color-muted);" }, text);
}

function gradientSpan(text) {
  return el("span", { style: STYLE.gradientText }, text);
}

function gradientCheck(size = 48) {
  const wrap = el("div", {
    style:
      `width: ${size}px; height: ${size}px; border-radius: 50%;` +
      " background: var(--accent-grad); display: flex;" +
      " align-items: center; justify-content: center;" +
      " box-shadow: var(--shadow-raised);",
  });
  const icon = lucideIcon("check", Math.round(size * 0.5));
  icon.style.color = "var(--color-pill-primary-fg)";
  wrap.append(icon);
  return wrap;
}

function gradientDot(size = 8) {
  return el("span", {
    style:
      `display: inline-block; width: ${size}px; height: ${size}px;` +
      " border-radius: 50%; background: var(--accent-grad); flex-shrink: 0;",
  });
}

function pulsingGradientDot(size = 10) {
  return el("span", {
    style:
      `display: inline-block; width: ${size}px; height: ${size}px;` +
      " border-radius: 50%; background: var(--accent-grad); flex-shrink: 0;" +
      " animation: pod-pulse 1.4s var(--ease) infinite;",
  });
}

function disabledStyle(el_) {
  el_.setAttribute("disabled", "true");
  el_.style.opacity = "0.5";
  el_.style.cursor = "not-allowed";
  return el_;
}

// ---------------------------------------------------------------------------
// renderOnboardingWizard
//
// @param {{ onComplete: Function, onNavigate: Function }} props
// @returns {HTMLElement}
// ---------------------------------------------------------------------------

export function renderOnboardingWizard({ onComplete, onNavigate }) {
  ensureOnboardingKeyframes();

  // ── Local UI state (on top of onboardingStore) ────────────────────────
  const local = {
    selectedIndustry: null,
    tempAnswer: null,
    expandedSections: {},
    exitWarningVisible: false,
    activeQuestionFlush: () => {},
    popstateHandler: null,
    foundationFiscalYearEndMonth: "12",
    foundationFiscalYearEndDay: "31",
    lastPostedFoundationCapture: null,
  };

  const container = el("div", {
    className: "ow-root",
    style: STYLE.heroCanvas,
  });

  let _everMounted = false;

  attachPopstateGuard();

  const unsubscribeStore = onboardingStore.subscribe(render);
  render();
  return container;

  // ── render ──────────────────────────────────────────────────────────────

  function render(force = false) {
    if (document.contains(container)) {
      _everMounted = true;
    } else if (_everMounted) {
      unsubscribeStore();
      detachPopstateGuard();
      return;
    }

    const focused = document.activeElement;
    if (!force && focused && (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA") && container.contains(focused)) {
      return;
    }

    clearNode(container);
    const s = onboardingStore.getState();
    local.activeQuestionFlush = () => {};

    container.append(buildHeader());

    if (s.connection.project_id && (s.screen === "account-check" || s.screen === "create-account" || s.screen === "connect-account")) {
      onboardingStore.setScreen("industry");
      return;
    }

    switch (s.screen) {
      case "account-check":
      case "create-account":
      case "connect-account":
        onNavigate("connection-wizard");
        return;
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

  // ── Popstate / exit guard ───────────────────────────────────────────────

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

  function requestExitWarning() {
    const s = onboardingStore.getState();
    if (s.screen !== "questions") {
      detachPopstateGuard();
      onNavigate("dashboard");
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
    onNavigate("dashboard");
  }

  function getFoundationFiscalYearCapture() {
    const month = String(local.foundationFiscalYearEndMonth || "").trim();
    const dayRaw = String(local.foundationFiscalYearEndDay || "").trim();
    const day = Number.parseInt(dayRaw, 10);

    if (!VALID_FISCAL_YEAR_END_MONTHS.has(month)) {
      return null;
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return null;
    }

    return {
      fiscal_year_end_month: month,
      fiscal_year_end_day: day,
    };
  }

  function postFoundationCaptureIfChanged() {
    const capture = getFoundationFiscalYearCapture();
    if (!capture) {
      return false;
    }

    const signature = `${capture.fiscal_year_end_month}:${capture.fiscal_year_end_day}`;
    if (local.lastPostedFoundationCapture === signature) {
      return true;
    }

    onboardingStore.setWizardCapture("foundation", capture);
    local.lastPostedFoundationCapture = signature;
    return true;
  }

  // ── Header ───────────────────────────────────────────────────────────────

  function buildHeader() {
    return el("header", {
      style:
        "width: 100%; max-width: 720px;" +
        " display: flex; align-items: center; justify-content: space-between;" +
        " margin-bottom: var(--space-8);",
    }, [
      el("div", { style: "display: flex; align-items: center; gap: var(--space-3);" }, [
        el("span", {
          style:
            "font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 600;" +
            " color: var(--color-ink); letter-spacing: var(--track-tight);",
        }, "Project Odoo"),
        el("span", { style: STYLE.chip }, "DISCOVERY"),
      ]),
      el("button", {
        type: "button",
        style: STYLE.linkButton,
        onclick: () => requestExitWarning(),
      }, "Save and exit"),
    ]);
  }

  // ── SCREEN 0a: Account Check (safety fallback) ──────────────────────────

  function buildAccountCheckScreen() {
    const wrap = el("div", { style: STYLE.column });

    wrap.append(
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" }, [
        el("p", { style: STYLE.eyebrow }, "DISCOVERY · STEP 1 / 4"),
        el("h1", { style: STYLE.h1Display }, [
          inkSpan("Let's begin"),
          mutedSpan(" — tell us about your setup."),
        ]),
        el("p", { style: STYLE.body }, "You'll need an Odoo instance to continue. If you already have one, we'll connect it next."),
      ])
    );

    const grid = el("div", {
      style:
        "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));" +
        " gap: var(--space-4);",
    });

    grid.append(buildTile({
      icon: "circle-check",
      title: "Yes, I have an instance",
      subtitle: "We'll connect it and start discovery.",
      onclick: () => onboardingStore.setAccountStatus("existing"),
      accent: true,
    }));

    grid.append(buildTile({
      icon: "circle-plus",
      title: "No, I need to create one",
      subtitle: "We'll point you to Odoo signup first.",
      onclick: () => onboardingStore.setAccountStatus("new"),
    }));

    wrap.append(grid);
    return wrap;
  }

  function buildTile({ icon, title, subtitle, onclick, selected = false, accent = false }) {
    const borderColor = selected ? "var(--color-ink)" : "var(--color-line)";
    const bg = selected ? "var(--color-chip-ready-bg)" : "var(--color-surface)";
    const tile = el("button", {
      type: "button",
      style:
        `width: 100%; text-align: left; padding: var(--space-6);` +
        ` background: ${bg}; border: 1px solid ${borderColor};` +
        " border-radius: var(--radius-card); cursor: pointer;" +
        " display: flex; flex-direction: column; gap: var(--space-3);" +
        " transition: border-color var(--dur-fast) var(--ease);" +
        " box-shadow: var(--shadow-raised); font-family: var(--font-body);",
      onclick,
    });

    const iconRow = el("div", { style: "display: flex; align-items: center; gap: var(--space-2);" });
    if (accent) {
      iconRow.append(gradientDot(8));
    }
    const ic = lucideIcon(icon, 22);
    ic.style.color = "var(--color-ink)";
    iconRow.append(ic);
    tile.append(iconRow);

    tile.append(
      el("p", { style: STYLE.h3 }, title),
      el("p", { style: STYLE.muted }, subtitle),
    );
    return tile;
  }

  // ── SCREEN 1: Industry Selector ──────────────────────────────────────────

  function buildIndustryScreen(s) {
    const wrap = el("div", { style: STYLE.column });

    wrap.append(
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" }, [
        el("p", { style: STYLE.eyebrow }, "DISCOVERY · STEP 1 / 3"),
        el("h1", { style: STYLE.h1Display }, [
          inkSpan("Where does your "),
          gradientSpan("business"),
          inkSpan(" live?"),
        ]),
        el("p", { style: STYLE.body }, "Pick the industry that best fits your shape today. We'll pre-load a baseline of domains and you can refine everything from there."),
        el("p", { style: STYLE.muted }, "Project Odoo V1 is tuned for fresh Odoo 19 databases."),
      ])
    );

    const grid = el("div", {
      style:
        "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));" +
        " gap: var(--space-4);",
    });

    INDUSTRIES.forEach((industry) => {
      const isSelected = local.selectedIndustry === industry.id;
      const card = el("button", {
        type: "button",
        style:
          "width: 100%; text-align: left; padding: var(--space-6);" +
          ` background: ${isSelected ? "var(--color-chip-ready-bg)" : "var(--color-surface)"};` +
          ` border: 1px solid ${isSelected ? "var(--color-ink)" : "var(--color-line)"};` +
          " border-radius: var(--radius-card); cursor: pointer;" +
          " display: flex; flex-direction: column; gap: var(--space-4);" +
          " box-shadow: var(--shadow-raised); font-family: var(--font-body);" +
          " transition: border-color var(--dur-fast) var(--ease);",
        onclick: () => {
          local.selectedIndustry = industry.id;
          render();
        },
      });

      const iconEl = lucideIcon(industry.icon, 26);
      iconEl.style.color = "var(--color-ink)";
      const header = el("div", { style: "display: flex; align-items: center; gap: var(--space-3);" }, [
        iconEl,
        el("p", { style: STYLE.h3 }, industry.name),
      ]);
      if (isSelected) {
        header.append(el("span", {
          style: "margin-left: auto; display: inline-flex; align-items: center; gap: var(--space-2);",
        }, [
          gradientDot(6),
          el("span", { style: `${STYLE.chipReady}` }, "SELECTED"),
        ]));
      }
      card.append(header);

      card.append(el("p", { style: STYLE.body }, industry.description));

      const chips = el("div", { style: "display: flex; flex-wrap: wrap; gap: var(--space-2);" });
      industry.modules.forEach((mod) => {
        chips.append(el("span", { style: STYLE.chip }, mod.toUpperCase()));
      });
      card.append(chips);

      grid.append(card);
    });
    wrap.append(grid);

    if (s.status === "failure" && s.error) {
      wrap.append(el("div", { style: STYLE.reviewPanel }, [
        el("p", { style: "margin: 0; font-size: var(--fs-body); font-weight: 600;" }, s.error),
      ]));
    }

    const isLoading = s.status === "loading";
    const projectId = getProjectId();

    const actions = el("div", {
      style:
        "display: flex; gap: var(--space-3); justify-content: space-between;" +
        " align-items: center; margin-top: var(--space-2);",
    });

    actions.append(
      el("button", {
        type: "button",
        style: STYLE.linkButton,
        onclick: () => onNavigate("dashboard"),
      }, "Save and exit")
    );

    const continueBtn = el("button", {
      type: "button",
      style: STYLE.pillPrimary,
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
    }, [
      el("span", {}, isLoading ? "Loading…" : "Continue"),
      lucideIcon("chevron-right", 18),
    ]);
    if (!local.selectedIndustry || isLoading || !projectId) {
      disabledStyle(continueBtn);
    }
    actions.append(continueBtn);

    wrap.append(actions);
    return wrap;
  }

  // ── SCREEN 2-N: Question Wizard ───────────────────────────────────────────

  function buildQuestionsScreen(s) {
    const visibleQuestions = getVisibleQuestions(s.answers);
    const idx = Math.min(s.current_question_index, visibleQuestions.length - 1);
    const question = visibleQuestions[idx];

    if (!question) {
      onboardingStore.setScreen("summary");
      return el("div", {});
    }

    const wrap = el("div", { style: STYLE.column });

    if (local.exitWarningVisible) {
      wrap.append(buildExitWarning());
    }

    wrap.append(buildProgressRail(idx, visibleQuestions.length));

    const deferredCount = onboardingStore.getDeferredCount();
    if (deferredCount > 0 && idx === 0) {
      wrap.append(buildDeferredBanner(deferredCount));
    }

    // Section eyebrow + question headline
    const sectionHeader = el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" }, [
      el("p", { style: STYLE.eyebrow }, `SECTION ${question.sectionIndex} · ${question.section.toUpperCase()}`),
      el("h1", { style: STYLE.h1 }, question.text),
    ]);
    wrap.append(sectionHeader);

    // Question ID + pre-pop badge row
    const metaRow = el("div", {
      style: "display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;",
    });
    metaRow.append(el("span", { style: `${STYLE.chip} font-family: var(--font-mono);` }, question.id));

    const prePopulatedAnswer = s.pre_populated_answers[question.id];
    if (prePopulatedAnswer && !s.answers[question.id]) {
      const badge = el("span", { style: STYLE.chipReady }, [
        gradientDot(6),
        el("span", { style: "margin-left: 6px;" }, "PRE-FILLED FROM INDUSTRY"),
      ]);
      metaRow.append(badge);
    }

    if (question.irreversible) {
      metaRow.append(el("span", { style: STYLE.chipReady }, "PERMANENT"));
    }
    wrap.append(metaRow);

    // Answer card
    const card = el("div", { style: STYLE.card + " display: flex; flex-direction: column; gap: var(--space-5);" });

    const currentAnswer = s.answers[question.id];
    const displayAnswer = currentAnswer?.answer ?? prePopulatedAnswer ?? null;
    const isDeferred = currentAnswer?.deferred === true;

    const { element: inputEl, flush: flushInput } = buildInputControls(question, displayAnswer, isDeferred, s);
    local.activeQuestionFlush = flushInput;
    card.append(inputEl);

    // Domain impact
    card.append(buildImpactPanel(question.domainImpact));

    if (question.allowDefer) {
      card.append(el("div", { style: "display: flex; justify-content: center;" }, [
        el("button", {
          type: "button",
          style: STYLE.linkButton,
          onclick: () => {
            local.exitWarningVisible = false;
            onboardingStore.deferAnswer(question.id);
            advanceQuestion(visibleQuestions, idx);
          },
        }, "I don't know yet — skip for now"),
      ]));
    }

    wrap.append(card);

    // Navigation
    const hasAnswer = currentAnswer && (currentAnswer.deferred || currentAnswer.answer !== null);
    const canAdvance = hasAnswer || (prePopulatedAnswer && !currentAnswer);

    const nav = el("div", {
      style:
        "display: flex; gap: var(--space-3); justify-content: space-between;" +
        " align-items: center; margin-top: var(--space-2);",
    });

    const backBtn = el("button", {
      type: "button",
      style: STYLE.pillSecondary,
      onclick: () => {
        if (idx > 0) {
          local.exitWarningVisible = false;
          onboardingStore.prevQuestion();
          local.tempAnswer = null;
        }
      },
    }, [lucideIcon("chevron-left", 18), el("span", {}, "Back")]);
    if (idx === 0) disabledStyle(backBtn);

    const rightGroup = el("div", { style: "display: flex; gap: var(--space-3); align-items: center;" });
    rightGroup.append(el("button", {
      type: "button",
      style: STYLE.linkButton,
      onclick: () => {
        local.exitWarningVisible = false;
        flushInput();
        onboardingStore.setScreen("summary");
        local.tempAnswer = null;
      },
    }, "Jump to review"));

    const nextBtn = el("button", {
      type: "button",
      style: STYLE.pillPrimary,
      onclick: () => {
        if (!canAdvance) return;
        local.exitWarningVisible = false;
        flushInput();
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
    }, [
      el("span", {}, idx === visibleQuestions.length - 1 ? "Review" : "Next"),
      lucideIcon("chevron-right", 18),
    ]);
    if (!canAdvance) disabledStyle(nextBtn);
    rightGroup.append(nextBtn);

    nav.append(backBtn, rightGroup);
    wrap.append(nav);

    return wrap;
  }

  function buildExitWarning() {
    return el("div", { style: STYLE.reviewPanel + " display: flex; flex-direction: column; gap: var(--space-3);" }, [
      el("p", { style: "margin: 0; font-size: var(--fs-body); font-weight: 600;" }, "Your progress is saved. You can pick this up from your dashboard whenever you're ready."),
      el("div", { style: "display: flex; gap: var(--space-3); flex-wrap: wrap;" }, [
        el("button", { type: "button", style: STYLE.pillPrimary, onclick: () => saveAndExit() }, "Save and exit"),
        el("button", { type: "button", style: STYLE.pillSecondary, onclick: () => dismissExitWarning() }, "Keep going"),
      ]),
    ]);
  }

  function buildProgressRail(idx, total) {
    const progress = total > 0 ? Math.round((idx / total) * 100) : 0;
    return el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" }, [
      el("div", { style: "display: flex; justify-content: space-between; align-items: center;" }, [
        el("span", { style: `font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted); letter-spacing: var(--track-eyebrow);` }, `${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`),
        el("span", { style: `font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted); letter-spacing: var(--track-eyebrow);` }, `${progress}% COMPLETE`),
      ]),
      el("div", {
        style:
          "position: relative; height: 3px; background: var(--color-line);" +
          " border-radius: var(--radius-pill); overflow: hidden;",
      }, [
        el("div", {
          style:
            `height: 3px; width: ${progress}%; background: var(--accent-grad);` +
            " border-radius: var(--radius-pill); transition: width var(--dur-base) var(--ease);",
        }),
      ]),
    ]);
  }

  function buildDeferredBanner(deferredCount) {
    return el("div", { style: STYLE.reviewPanel + " display: flex; align-items: center; gap: var(--space-3);" }, [
      gradientDot(8),
      el("p", { style: "margin: 0; font-size: var(--fs-body);" },
        `${deferredCount} question${deferredCount === 1 ? "" : "s"} still open from last time. Answering them tightens your scope.`),
    ]);
  }

  function buildImpactPanel(impactText) {
    const ic = lucideIcon("info", 16);
    ic.style.color = "var(--color-muted)";
    ic.style.flexShrink = "0";
    ic.style.marginTop = "2px";
    return el("div", {
      style: STYLE.softPanel + " display: flex; align-items: flex-start; gap: var(--space-3);",
    }, [
      ic,
      el("p", { style: STYLE.muted }, impactText),
    ]);
  }

  // ── buildInputControls ────────────────────────────────────────────────────

  function buildInputControls(question, displayAnswer, isDeferred, s) {
    const wrap = el("div", { style: "display: flex; flex-direction: column; gap: var(--space-4);" });
    let flushFn = () => {};

    if (question.id === "BM-01") {
      const isPlatform = displayAnswer === "Platform or marketplace (connecting buyers and sellers)";
      if (isPlatform) {
        wrap.append(el("div", { style: STYLE.reviewPanel }, [
          el("p", { style: "margin: 0; font-size: var(--fs-body); font-weight: 600;" },
            "This option needs project owner sign-off before we continue. Please contact your implementation lead."),
        ]));
      }
    }

    if (isDeferred) {
      const ic = lucideIcon("clock", 16);
      ic.style.color = "var(--color-muted)";
      wrap.append(el("div", {
        style: STYLE.softPanel + " display: flex; align-items: center; gap: var(--space-3);",
      }, [
        ic,
        el("span", { style: STYLE.muted }, "Marked as deferred. Select an answer below to override."),
      ]));
    }

    switch (question.inputType) {
      case "boolean":
        buildBooleanOptions(wrap, question, displayAnswer);
        break;
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

  function buildBooleanOptions(wrap, question, displayAnswer) {
    const row = el("div", {
      style: "display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);",
    });
    question.options.forEach((opt) => {
      const isSelected = displayAnswer === opt;
      const tile = el("button", {
        type: "button",
        style:
          "width: 100%; padding: var(--space-5); border-radius: var(--radius-card);" +
          " cursor: pointer; font-family: var(--font-body); font-size: var(--fs-h3);" +
          " font-weight: 600; display: flex; align-items: center; justify-content: center;" +
          " gap: var(--space-2); transition: border-color var(--dur-fast) var(--ease);" +
          ` background: ${isSelected ? "var(--color-chip-ready-bg)" : "var(--color-surface)"};` +
          ` color: var(--color-ink); border: 1px solid ${isSelected ? "var(--color-ink)" : "var(--color-line)"};`,
        onclick: () => onboardingStore.setAnswer(question.id, opt),
      });
      if (isSelected) {
        tile.append(gradientDot(6));
      }
      tile.append(el("span", {}, opt));
      row.append(tile);
    });
    wrap.append(row);
  }

  function buildSelectOptions(wrap, question, displayAnswer) {
    const options = el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" });
    question.options.forEach((opt) => {
      const isSelected = displayAnswer === opt;
      const row = el("button", {
        type: "button",
        style:
          "width: 100%; text-align: left; padding: var(--space-4) var(--space-5);" +
          " border-radius: var(--radius-panel); cursor: pointer;" +
          " font-family: var(--font-body); font-size: var(--fs-body);" +
          " display: flex; align-items: center; gap: var(--space-3);" +
          ` background: ${isSelected ? "var(--color-chip-ready-bg)" : "var(--color-surface)"};` +
          ` color: var(--color-ink); border: 1px solid ${isSelected ? "var(--color-ink)" : "var(--color-line)"};` +
          " transition: border-color var(--dur-fast) var(--ease);",
        onclick: () => onboardingStore.setAnswer(question.id, opt),
      });

      const indicator = el("span", {
        style:
          "width: 16px; height: 16px; flex-shrink: 0; border-radius: 50%;" +
          ` border: 1px solid ${isSelected ? "var(--color-ink)" : "var(--color-line)"};` +
          " display: flex; align-items: center; justify-content: center;",
      });
      if (isSelected) {
        indicator.append(gradientDot(8));
      }

      row.append(
        indicator,
        el("span", { style: `font-weight: ${isSelected ? 600 : 400};` }, opt),
      );
      options.append(row);
    });
    wrap.append(options);
  }

  function buildMultiSelectOptions(wrap, question, displayAnswer) {
    const selected = Array.isArray(displayAnswer) ? displayAnswer : [];
    const options = el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" });
    question.options.forEach((opt) => {
      const isChecked = selected.includes(opt);
      const row = el("button", {
        type: "button",
        style:
          "width: 100%; text-align: left; padding: var(--space-4) var(--space-5);" +
          " border-radius: var(--radius-panel); cursor: pointer;" +
          " font-family: var(--font-body); font-size: var(--fs-body);" +
          " display: flex; align-items: center; gap: var(--space-3);" +
          ` background: ${isChecked ? "var(--color-chip-ready-bg)" : "var(--color-surface)"};` +
          ` color: var(--color-ink); border: 1px solid ${isChecked ? "var(--color-ink)" : "var(--color-line)"};` +
          " transition: border-color var(--dur-fast) var(--ease);",
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
      });

      const box = el("span", {
        style:
          "width: 18px; height: 18px; flex-shrink: 0; border-radius: var(--radius-tag);" +
          ` border: 1px solid ${isChecked ? "var(--color-ink)" : "var(--color-line)"};` +
          ` background: ${isChecked ? "var(--color-pill-primary-bg)" : "transparent"};` +
          " display: flex; align-items: center; justify-content: center;",
      });
      if (isChecked) {
        const check = lucideIcon("check", 12);
        check.style.color = "var(--color-pill-primary-fg)";
        box.append(check);
      }

      row.append(
        box,
        el("span", { style: `font-weight: ${isChecked ? 600 : 400};` }, opt),
      );
      options.append(row);
    });
    wrap.append(options);
  }

  function buildNumericInput(wrap, question, displayAnswer) {
    const input = el("input", {
      type: "number",
      style: STYLE.input + " max-width: 220px; font-family: var(--font-mono);",
      placeholder: "Enter a number",
      value: displayAnswer !== null && displayAnswer !== undefined ? String(displayAnswer) : "",
      min: "1",
    });

    function commitNumeric() {
      const val = parseInt(input.value, 10);
      if (!isNaN(val) && val >= 1) {
        onboardingStore.setAnswer(question.id, val);
      }
    }

    input.addEventListener("blur", commitNumeric);
    wrap.append(input);
    return commitNumeric;
  }

  function buildTextInput(wrap, question, displayAnswer) {
    const input = el("input", {
      type: "text",
      style: STYLE.input,
      placeholder: question.id === "BM-03" ? "e.g. Australia, United Kingdom, United States" : "Type your answer",
      value: displayAnswer !== null && displayAnswer !== undefined ? String(displayAnswer) : "",
    });

    function commitText() {
      const val = input.value.trim();
      if (val) {
        onboardingStore.setAnswer(question.id, val);
      }
    }

    input.addEventListener("blur", commitText);
    wrap.append(input);
    return commitText;
  }

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
    const wrap = el("div", { style: STYLE.column });

    const headline =
      questionId === "BM-03"
        ? "This decision locks once accounting entries are posted."
        : selectedAnswer === "Yes"
          ? "Turning Manufacturing on changes your sequence permanently."
          : "Excluding Manufacturing removes production from scope.";

    wrap.append(
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" }, [
        el("p", { style: STYLE.eyebrow }, "PERMANENT DECISION"),
        el("h1", { style: STYLE.h1 }, [
          inkSpan(headline),
        ]),
      ])
    );

    const card = el("div", { style: STYLE.card + " display: flex; flex-direction: column; gap: var(--space-5);" });

    if (questionId === "BM-03") {
      card.append(buildIrreversibleBM03Body(selectedAnswer));
    } else if (questionId === "MF-01") {
      card.append(buildIrreversibleMF01Body(selectedAnswer));
    }

    const confirmLabel = questionId === "BM-03"
      ? `I understand — this country selection is permanent after accounting entries post. Confirm "${selectedAnswer}" and continue.`
      : selectedAnswer === "Yes"
        ? "I understand — Manufacturing is a Go-Live domain and its activation is permanent under this project scope. Confirm Yes and continue."
        : "I understand — Manufacturing is excluded and all MF steps will be skipped. Confirm No and continue.";

    card.append(el("button", {
      type: "button",
      style: STYLE.pillPrimary + " width: 100%; white-space: normal; line-height: var(--lh-snug); padding: var(--space-4) var(--space-5);",
      onclick: () => {
        onboardingStore.setAnswer(questionId, selectedAnswer);
        const updatedState = onboardingStore.getState();
        const visibleQuestions = getVisibleQuestions(updatedState.answers);
        const currentIdx = updatedState.current_question_index;
        onboardingStore.clearPendingIrreversible();
        if (currentIdx >= visibleQuestions.length - 1) {
          onboardingStore.setScreen("summary");
        } else {
          onboardingStore.nextQuestion();
        }
      },
    }, confirmLabel));

    card.append(el("button", {
      type: "button",
      style: STYLE.pillSecondary + " width: 100%;",
      onclick: () => onboardingStore.clearPendingIrreversible(),
    }, "Go back"));

    wrap.append(card);
    return wrap;
  }

  function buildIrreversibleBM03Body(country) {
    return el("div", { style: "display: flex; flex-direction: column; gap: var(--space-4);" }, [
      el("div", { style: STYLE.reviewPanel }, [
        el("p", { style: "margin: 0 0 var(--space-2); font-size: var(--fs-body); font-weight: 600;" }, "Domains affected"),
        el("ul", { style: "margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: var(--space-2);" }, [
          el("li", { style: "font-size: var(--fs-body);" }, "Foundation: localization package, chart of accounts template, default tax configuration, fiscal position baseline, legal reporting."),
          el("li", { style: "font-size: var(--fs-body);" }, "Accounting: chart of accounts, tax rules, bank statement format. Country cannot change after accounting entries post."),
          el("li", { style: "font-size: var(--fs-body);" }, "All domains: default currency is set by this selection."),
        ]),
      ]),
      el("p", { style: STYLE.body },
        `Selected country: ${country || "(not entered)"}. Confirming locks the localization package for the Foundation domain. If you're not certain of the primary operating country, don't proceed.`),
    ]);
  }

  function buildIrreversibleMF01Body(answer) {
    if (answer === "Yes") {
      return el("div", { style: "display: flex; flex-direction: column; gap: var(--space-4);" }, [
        el("div", { style: STYLE.reviewPanel }, [
          el("p", { style: "margin: 0 0 var(--space-2); font-size: var(--fs-body); font-weight: 600;" }, "Domains activated"),
          el("ul", { style: "margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: var(--space-2);" }, [
            el("li", { style: "font-size: var(--fs-body);" }, "Manufacturing (MRP): activated at Go-Live priority. BOMs, work centers, production orders, production stock. All MF-02 through MF-07 will be presented."),
            el("li", { style: "font-size: var(--fs-body);" }, "Inventory: production stock movements become required. Must be at checkpoint-passing state before Manufacturing go-live."),
            el("li", { style: "font-size: var(--fs-body);" }, "Accounting / Finance: production costing and Work-In-Progress (WIP) policy become required."),
          ]),
        ]),
        el("p", { style: STYLE.body }, "Manufacturing is a Go-Live domain. It can't be deferred without a formal scope change."),
      ]);
    }
    return el("div", { style: "display: flex; flex-direction: column; gap: var(--space-4);" }, [
      el("div", { style: STYLE.reviewPanel }, [
        el("p", { style: "margin: 0 0 var(--space-2); font-size: var(--fs-body); font-weight: 600;" }, "Domains excluded"),
        el("ul", { style: "margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: var(--space-2);" }, [
          el("li", { style: "font-size: var(--fs-body);" }, "Manufacturing (MRP): excluded from scope. No BOMs, work orders, or production costing will be configured."),
          el("li", { style: "font-size: var(--fs-body);" }, "All MF-02 through MF-07 will be skipped."),
        ]),
      ]),
      el("p", { style: STYLE.body }, "If your business later begins manufacturing, re-adding the Manufacturing domain after go-live needs a formal scope change and a new implementation stage."),
    ]);
  }

  // ── SCREEN FINAL: Summary ─────────────────────────────────────────────────

  function buildSummaryScreen(s) {
    const wrap = el("div", { style: STYLE.column });

    wrap.append(
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-3);" }, [
        el("p", { style: STYLE.eyebrow }, "DISCOVERY · REVIEW"),
        el("h1", { style: STYLE.h1Display }, [
          inkSpan("Almost there "),
          gradientSpan("—"),
          inkSpan(" one last look."),
        ]),
        el("p", { style: STYLE.body }, "Scan your answers, set the fiscal year end, and confirm the scope. Then we'll run the pipeline."),
      ])
    );

    const visibleQuestions = getVisibleQuestions(s.answers);

    wrap.append(buildAnswersSection(s, visibleQuestions));
    wrap.append(buildFoundationFiscalYearSection());
    wrap.append(buildDomainsSection(s));

    const defaultedDomains = onboardingStore.getDefaultedDomains();
    if (defaultedDomains.length > 0) {
      wrap.append(buildDefaultedActivationsSection(s, defaultedDomains));
    }

    wrap.append(buildCommitmentSection());

    const deferredCount = onboardingStore.getDeferredCount();
    const defaultedDomainsCount = defaultedDomains.reduce((acc, d) => acc + d.domains.length, 0);
    if (deferredCount > 0) {
      wrap.append(buildDeferredAcknowledgement(s, deferredCount, defaultedDomainsCount));
    }

    wrap.append(buildConfirmCheckbox(s));

    const foundationCapture = getFoundationFiscalYearCapture();
    const foundationCaptureOk = Boolean(foundationCapture);
    if (foundationCaptureOk) {
      postFoundationCaptureIfChanged();
    }

    const allRequired = visibleQuestions.filter((q) => q.required);
    const missingRequired = allRequired.filter((q) => {
      const ans = s.answers[q.id];
      if (!ans) return true;
      if (ans.deferred) return false;
      if (Array.isArray(ans.answer)) return ans.answer.length === 0;
      return ans.answer === null || ans.answer === undefined || ans.answer === "";
    });

    const deferredOk = deferredCount === 0 || s.deferred_acknowledged;
    const confirmedOk = s.confirmed;
    const ta04Answer = s.answers["TA-04"];
    const ta04Ok = ta04Answer && !ta04Answer.deferred && ta04Answer.answer;
    const canConfirm = missingRequired.length === 0 && deferredOk && confirmedOk && ta04Ok && foundationCaptureOk;

    if (missingRequired.length > 0) {
      wrap.append(el("div", { style: STYLE.reviewPanel }, [
        el("p", { style: "margin: 0 0 var(--space-2); font-size: var(--fs-body); font-weight: 600;" },
          `${missingRequired.length} required question${missingRequired.length === 1 ? "" : "s"} unanswered`),
        el("ul", { style: "margin: 0; padding-left: 20px;" },
          missingRequired.map((q) => el("li", { style: "font-size: var(--fs-small);" }, `${q.id}: ${q.text.substring(0, 60)}…`))
        ),
      ]));
    }

    if (!ta04Ok && visibleQuestions.some((q) => q.id === "TA-04")) {
      wrap.append(el("div", { style: STYLE.reviewPanel }, [
        el("p", { style: "margin: 0; font-size: var(--fs-body);" }, "TA-04 (system administrator name) must be answered — it can't be deferred."),
      ]));
    }

    if (!foundationCaptureOk) {
      wrap.append(el("div", { style: STYLE.reviewPanel }, [
        el("p", { style: "margin: 0; font-size: var(--fs-body);" }, "Foundation fiscal year end month/day is required."),
      ]));
    }

    const projectId = getProjectId();
    const isLoading = s.status === "loading";
    const noProject = !projectId;

    if (noProject) {
      wrap.append(el("div", { style: STYLE.reviewPanel + " display: flex; flex-direction: column; gap: var(--space-3);" }, [
        el("p", { style: "margin: 0; font-size: var(--fs-body); font-weight: 600;" }, "No project ID available. Please sign in again."),
        el("button", {
          type: "button",
          style: STYLE.pillSecondary,
          onclick: () => setCurrentView("auth"),
        }, "Go to sign in"),
      ]));
    }

    const nav = el("div", {
      style: "display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-top: var(--space-2);",
    });

    nav.append(el("button", {
      type: "button",
      style: STYLE.pillSecondary,
      onclick: () => {
        onboardingStore.setScreen("questions");
        onboardingStore.goToQuestion(0);
      },
    }, [lucideIcon("chevron-left", 18), el("span", {}, "Back to questions")]));

    const confirmBtn = el("button", {
      type: "button",
      style: STYLE.pillPrimary,
      onclick: async () => {
        if (!canConfirm || isLoading || !projectId) return;
        const capture = getFoundationFiscalYearCapture();
        if (!capture) return;
        onboardingStore.setWizardCapture("foundation", capture);
        const result = await onboardingStore.confirmAndRun(projectId);
        if (result.ok) {
          onComplete({ projectId, runtimeState: result.runtime_state ?? null });
        }
      },
    });
    if (isLoading) {
      confirmBtn.append(pulsingGradientDot(8));
      confirmBtn.append(el("span", {}, "Running pipeline…"));
    } else {
      confirmBtn.append(el("span", {}, "Confirm and run pipeline"));
      confirmBtn.append(lucideIcon("chevron-right", 18));
    }
    if (!canConfirm || isLoading || noProject) disabledStyle(confirmBtn);
    nav.append(confirmBtn);

    wrap.append(nav);

    if (s.status === "failure" && s.error) {
      wrap.append(buildSummaryError(s.error));
    }

    return wrap;
  }

  function buildSummaryError(error) {
    const errStr = String(error);
    let friendlyMsg = "Something went wrong running the pipeline. Please try again or contact support.";
    let actionLabel = null;
    let actionTarget = null;
    let showRawError = true;

    if (/authorization|expired.*token|session.*expired/i.test(errStr)) {
      friendlyMsg = "Session expired. Please sign in again to continue.";
      actionLabel = "Sign in";
      actionTarget = "auth";
      showRawError = false;
    } else if (/not found|404/i.test(errStr)) {
      friendlyMsg = "We couldn't reach your Odoo instance. Please check your connection and try again.";
      actionLabel = "Check connection";
      actionTarget = "connection-wizard";
      showRawError = false;
    } else if (/modules?.*not installed|not installed.*modules?/i.test(errStr)) {
      friendlyMsg = "Some required Odoo modules aren't installed. We can install them for you.";
      actionLabel = "Install modules";
      actionTarget = "module-installer";
      showRawError = false;
    }

    const errChildren = [
      el("p", { style: "margin: 0; font-size: var(--fs-body); font-weight: 600;" }, friendlyMsg),
    ];

    if (actionLabel && actionTarget) {
      errChildren.push(el("button", {
        type: "button",
        style: STYLE.pillSecondary + " align-self: flex-start;",
        onclick: () => setCurrentView(actionTarget),
      }, [el("span", {}, actionLabel), lucideIcon("chevron-right", 18)]));
    }

    if (showRawError) {
      const details = el("details", { style: "font-size: var(--fs-small);" });
      details.append(el("summary", { style: "cursor: pointer; color: var(--color-muted);" }, "Error details"));
      details.append(el("pre", {
        style:
          "margin: var(--space-2) 0 0; white-space: pre-wrap; word-break: break-all;" +
          " font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted);",
      }, errStr));
      errChildren.push(details);
    }

    return el("div", {
      style: STYLE.reviewPanel + " display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-3);",
    }, errChildren);
  }

  function buildFoundationFiscalYearSection() {
    const section = el("div", { style: STYLE.card + " display: flex; flex-direction: column; gap: var(--space-4);" });

    section.append(
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-1);" }, [
        el("h3", { style: STYLE.h3 }, "Foundation fiscal year end"),
        el("p", { style: STYLE.muted }, "Captured for Foundation setup."),
      ])
    );

    const fieldWrap = el("div", { style: "display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: flex-end;" });

    const monthLabel = "font-size: var(--fs-tiny); font-weight: 600; color: var(--color-muted); text-transform: uppercase; letter-spacing: var(--track-eyebrow); margin: 0;";

    const monthSelect = el("select", {
      style: STYLE.input + " min-width: 220px; font-family: var(--font-body);",
      onchange: (event) => {
        local.foundationFiscalYearEndMonth = String(event.target.value || "");
        postFoundationCaptureIfChanged();
        render(true);
      },
    }, FISCAL_YEAR_END_MONTH_OPTIONS.map((entry) =>
      el("option", { value: entry.value }, `${entry.label} (${entry.value})`)
    ));
    monthSelect.value = String(local.foundationFiscalYearEndMonth || "");

    const dayInput = el("input", {
      type: "number",
      style: STYLE.input + " width: 120px; font-family: var(--font-mono);",
      min: "1",
      max: "31",
      step: "1",
      value: String(local.foundationFiscalYearEndDay || ""),
      oninput: (event) => {
        local.foundationFiscalYearEndDay = String(event.target.value || "");
      },
      onblur: () => {
        postFoundationCaptureIfChanged();
        render(true);
      },
    });

    fieldWrap.append(
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" }, [
        el("label", { style: monthLabel }, "MONTH"),
        monthSelect,
      ]),
      el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" }, [
        el("label", { style: monthLabel }, "DAY"),
        dayInput,
      ])
    );

    section.append(fieldWrap);
    section.append(el("p", { style: STYLE.muted }, "Captured as foundation wizard data for governed pipeline assembly."));

    return section;
  }

  function buildAnswersSection(s, visibleQuestions) {
    const section = el("div", { style: STYLE.card + " padding: 0; overflow: hidden;" });

    section.append(el("div", {
      style:
        "padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-line);" +
        " display: flex; align-items: center; justify-content: space-between;",
    }, [
      el("h3", { style: STYLE.h3 }, "Answers reviewed"),
      el("span", { style: STYLE.chip }, `${visibleQuestions.length} QUESTIONS`),
    ]));

    const sections = {};
    visibleQuestions.forEach((q) => {
      if (!sections[q.section]) sections[q.section] = [];
      sections[q.section].push(q);
    });

    Object.entries(sections).forEach(([sectionName, questions]) => {
      const isExpanded = local.expandedSections[sectionName] !== false;
      const sectionWrap = el("div", { style: "border-bottom: 1px solid var(--color-line);" });

      const header = el("button", {
        type: "button",
        style:
          "width: 100%; text-align: left; padding: var(--space-4) var(--space-6);" +
          " background: none; border: none; cursor: pointer;" +
          " display: flex; align-items: center; justify-content: space-between;" +
          " font-family: var(--font-body);",
        onclick: () => {
          local.expandedSections[sectionName] = !isExpanded;
          render();
        },
      }, [
        el("span", { style: "font-size: var(--fs-body); font-weight: 600; color: var(--color-ink);" }, sectionName),
        (() => {
          const ic = lucideIcon(isExpanded ? "chevron-up" : "chevron-down", 18);
          ic.style.color = "var(--color-muted)";
          return ic;
        })(),
      ]);
      sectionWrap.append(header);

      if (isExpanded) {
        const answersWrap = el("div", { style: "padding: 0 var(--space-6) var(--space-4);" });
        questions.forEach((q) => {
          const ans = s.answers[q.id];
          const isUnanswered = !ans || (ans.answer === null && !ans.deferred);
          const isDeferred = ans?.deferred === true;

          const answerText = isDeferred
            ? "Deferred — using default"
            : Array.isArray(ans?.answer)
              ? ans.answer.join(", ") || "(none selected)"
              : ans?.answer !== null && ans?.answer !== undefined
                ? String(ans.answer)
                : "(not answered)";

          const answerColor = isUnanswered
            ? "var(--color-chip-review-fg)"
            : isDeferred
              ? "var(--color-muted)"
              : "var(--color-ink)";

          answersWrap.append(el("div", {
            style:
              "display: flex; align-items: flex-start; justify-content: space-between;" +
              " gap: var(--space-3); padding: var(--space-3) 0;" +
              " border-bottom: 1px solid var(--color-line-soft);",
          }, [
            el("div", { style: "flex: 1; display: flex; flex-direction: column; gap: var(--space-1);" }, [
              el("div", { style: "display: flex; align-items: center; gap: var(--space-2);" }, [
                el("span", { style: `font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-muted);` }, q.id),
                el("span", { style: "font-size: var(--fs-small); color: var(--color-body);" }, q.text.substring(0, 80) + (q.text.length > 80 ? "…" : "")),
              ]),
              el("p", { style: `margin: 0; font-size: var(--fs-small); font-weight: 600; color: ${answerColor};` }, answerText),
            ]),
            el("button", {
              type: "button",
              style: STYLE.linkButton + " flex-shrink: 0;",
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
    const section = el("div", { style: STYLE.card + " display: flex; flex-direction: column; gap: var(--space-4);" });

    section.append(
      el("div", { style: "display: flex; align-items: center; gap: var(--space-3);" }, [
        gradientDot(6),
        el("h3", { style: STYLE.h3 }, "Domains that will be activated"),
      ])
    );

    const allDomains = new Set(s.activated_domains_preview || []);

    if (allDomains.size === 0) {
      section.append(el("p", { style: STYLE.muted }, "Domain activation will be computed when the pipeline runs."));
    } else {
      const list = el("div", { style: "display: flex; flex-wrap: wrap; gap: var(--space-2);" });
      allDomains.forEach((domain) => {
        list.append(el("span", { style: STYLE.chipReady }, String(domain).toUpperCase()));
      });
      section.append(list);
    }

    return section;
  }

  function buildDefaultedActivationsSection(s, defaultedDomains) {
    const section = el("div", { style: STYLE.reviewPanel + " display: flex; flex-direction: column; gap: var(--space-4);" });

    section.append(
      el("div", { style: "display: flex; align-items: center; gap: var(--space-3);" }, [
        gradientDot(6),
        el("h3", { style: STYLE.h3 }, "Activated by default — questions were deferred"),
      ])
    );

    section.append(el("p", { style: "margin: 0; font-size: var(--fs-body);" },
      "These domains use the max-scope default because you deferred questions. Answer them to refine scope."));

    defaultedDomains.forEach(({ questionId, defaultAnswer, domains }) => {
      const row = el("div", {
        style:
          "display: flex; align-items: flex-start; justify-content: space-between;" +
          " gap: var(--space-3); padding: var(--space-3) var(--space-4);" +
          " background: var(--color-surface); border-radius: var(--radius-panel);",
      });

      const left = el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" });
      left.append(el("p", {
        style: "margin: 0; font-family: var(--font-mono); font-size: var(--fs-small); font-weight: 600; color: var(--color-chip-review-fg);",
      }, `${questionId} — deferred`));
      left.append(el("p", { style: "margin: 0; font-size: var(--fs-small); color: var(--color-body);" }, `Assumed: ${defaultAnswer}`));
      const chips = el("div", { style: "display: flex; flex-wrap: wrap; gap: var(--space-2);" });
      domains.forEach((d) => chips.append(el("span", { style: STYLE.chipReady }, String(d).toUpperCase())));
      left.append(chips);

      row.append(left);
      row.append(el("button", {
        type: "button",
        style: STYLE.linkButton + " flex-shrink: 0;",
        onclick: () => {
          const visQ = getVisibleQuestions(s.answers);
          const qIdx = visQ.findIndex((vq) => vq.id === questionId);
          if (qIdx >= 0) onboardingStore.goToQuestion(qIdx);
        },
      }, "Go back"));

      section.append(row);
    });

    return section;
  }

  function buildCommitmentSection() {
    return el("div", {
      style: STYLE.card + " border-left: 3px solid var(--color-ink); display: flex; flex-direction: column; gap: var(--space-3);",
    }, [
      el("h3", { style: STYLE.h3 }, "What confirming does"),
      el("p", { style: STYLE.body },
        "Confirming locks your discovery answers as the project business profile, triggers a pipeline run that activates the listed domains, and can't be undone without a formal scope change. The run goes through the standard preview, safety class, and auditability flow."),
    ]);
  }

  function buildDeferredAcknowledgement(s, deferredCount, domainCount) {
    return buildToggleCard({
      checked: s.deferred_acknowledged,
      onclick: () => onboardingStore.setDeferredAcknowledged(!s.deferred_acknowledged),
      label: `I acknowledge that ${domainCount} domain${domainCount === 1 ? "" : "s"} are activated by default because I deferred ${deferredCount} question${deferredCount === 1 ? "" : "s"}. I can reduce scope by answering them before confirming.`,
    });
  }

  function buildConfirmCheckbox(s) {
    return buildToggleCard({
      checked: s.confirmed,
      onclick: () => onboardingStore.setConfirmed(!s.confirmed),
      label: "I understand what will be set up and I'm ready to run the implementation pipeline.",
      emphasise: true,
    });
  }

  function buildToggleCard({ checked, onclick, label, emphasise = false }) {
    const bg = checked
      ? "var(--color-chip-ready-bg)"
      : "var(--color-surface)";
    const border = checked
      ? "var(--color-ink)"
      : "var(--color-line)";
    const wrap = el("button", {
      type: "button",
      style:
        "width: 100%; text-align: left; padding: var(--space-4) var(--space-5);" +
        ` background: ${bg}; border: 1px solid ${border};` +
        " border-radius: var(--radius-panel); cursor: pointer;" +
        " display: flex; align-items: flex-start; gap: var(--space-3);" +
        " font-family: var(--font-body);",
      onclick,
    });

    const box = el("span", {
      style:
        "width: 20px; height: 20px; flex-shrink: 0; border-radius: var(--radius-tag);" +
        ` border: 1px solid ${checked ? "var(--color-ink)" : "var(--color-line)"};` +
        ` background: ${checked ? "var(--color-pill-primary-bg)" : "transparent"};` +
        " display: flex; align-items: center; justify-content: center; margin-top: 2px;",
    });
    if (checked) {
      const check = lucideIcon("check", 14);
      check.style.color = "var(--color-pill-primary-fg)";
      box.append(check);
    }

    wrap.append(
      box,
      el("p", {
        style:
          `margin: 0; font-size: var(--fs-body); color: var(--color-ink);` +
          ` font-weight: ${emphasise ? 600 : 400}; line-height: var(--lh-body);`,
      }, label),
    );

    return wrap;
  }
}
