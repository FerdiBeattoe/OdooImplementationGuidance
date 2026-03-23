export function isGuidanceDecisionBlocked(block) {
  return block.checkpointBlocker || block.decisionState === "Unresolved";
}

export function getGuidanceDecisionMessage(block) {
  if (block.decisionState === "Resolved") {
    return block.decisionSummary || "Decision resolved.";
  }

  return (
    block.unresolvedDecisionMessage ||
    `No default applied. ${block.decisionOwner} must resolve this decision before progression.`
  );
}

export function getCompactDownstreamImpactSummary(block, limit = 2) {
  const impacts = Array.isArray(block?.downstreamImpact)
    ? block.downstreamImpact.map((item) => item?.trim()).filter(Boolean)
    : [];

  return impacts.slice(0, limit).join(" ");
}

export function getGuidanceBlockForCheckpoint(checkpoint) {
  const guidanceKey = checkpoint?.guidanceKey;

  if (!guidanceKey || !SAMPLE_GUIDANCE_BLOCKS[guidanceKey]) {
    return null;
  }

  return SAMPLE_GUIDANCE_BLOCKS[guidanceKey];
}

export const SAMPLE_GUIDANCE_BLOCKS = {
  foundationProjectMode: {
    id: "foundation-project-mode",
    title: "Project mode and implementation context",
    whatThisIs: "The explicit classification of whether the work is a new implementation, expansion, or guided setup of unused capabilities.",
    whyItMatters: "It determines how downstream guidance, checkpoints, and safe progression are interpreted.",
    downstreamImpact: [
      "Affects how foundational checkpoints and downstream domains are governed.",
      "Changes whether later design choices are treated as implementation work or controlled expansion."
    ],
    commonMistakes: [
      "Letting the project mode remain implied rather than explicitly confirmed.",
      "Treating expansion or guided setup as if they were unrestricted rebuilds."
    ],
    reversibility: "Moderate early, difficult once downstream checkpoints are active.",
    decisionOwner: "Project owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Project mode must be explicit before downstream checkpoint progression is treated as controlled."
  },
  foundationLocalization: {
    id: "foundation-localization-selection",
    title: "Localization context",
    whatThisIs: "The selected fiscal and localization context that frames company settings, currencies, and region-sensitive assumptions.",
    whyItMatters: "It shapes downstream finance, document, and operational policy choices.",
    downstreamImpact: [
      "Affects company setup, fiscal assumptions, and finance-sensitive downstream configuration.",
      "Changes how later checkpoint evidence should be interpreted."
    ],
    commonMistakes: [
      "Treating localization as a late cleanup item.",
      "Assuming a generic global setup is sufficient without an explicit context."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Implementation lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Localization context must be explicit before foundational assumptions can be treated as controlled."
  },
  foundationOperatingAssumptions: {
    id: "foundation-operating-assumptions",
    title: "Shared operating assumptions",
    whatThisIs: "The bounded baseline assumptions that downstream domains rely on for controlled design.",
    whyItMatters: "It prevents later domains from building on guessed company, operating, or environment defaults.",
    downstreamImpact: [
      "Affects master-data structure, access design, and downstream domain checkpoint interpretation.",
      "Changes whether implementation decisions can be reviewed against a stable baseline."
    ],
    commonMistakes: [
      "Letting teams operate from unstated baseline assumptions.",
      "Treating foundational settings as optional once downstream work has started."
    ],
    reversibility: "Moderate early, difficult once downstream domains progress.",
    decisionOwner: "Implementation lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Shared operating assumptions must be explicit before downstream domain design is treated as controlled."
  },
  foundationDeploymentTarget: {
    id: "foundation-deployment-target",
    title: "Deployment target context",
    whatThisIs: "The explicit branch and environment targeting context for Odoo.sh-sensitive work where relevant.",
    whyItMatters: "It prevents deployment-sensitive work from drifting without a named target.",
    downstreamImpact: [
      "Affects branch-aware handling and environment-specific evidence interpretation.",
      "Changes whether deployment-sensitive progression remains reviewable."
    ],
    commonMistakes: [
      "Treating branch or environment targeting as a late operational detail.",
      "Proceeding with Odoo.sh-sensitive work without a named target."
    ],
    reversibility: "Easy to moderate, depending on downstream progress.",
    decisionOwner: "Implementation lead",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Where Odoo.sh targeting is required, the branch and environment context must be explicit before controlled progression."
  },
  usersAccessDesign: {
    id: "users-access-design",
    title: "Access design boundaries",
    whatThisIs: "The bounded design of who should access what functions before downstream responsibilities are assigned.",
    whyItMatters: "It creates the boundary for role design, approvals, and privileged access review.",
    downstreamImpact: [
      "Affects approval ownership, privileged access review, and downstream separation-of-duties expectations.",
      "Changes whether access-dependent domain work can proceed under control."
    ],
    commonMistakes: [
      "Assigning roles before access boundaries are defined.",
      "Treating access design as a late technical cleanup."
    ],
    reversibility: "Moderate",
    decisionOwner: "Project owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Access design boundaries must be explicit before approval and privileged access controls are treated as controlled."
  },
  usersPrivilegedAccess: {
    id: "users-privileged-access",
    title: "Privileged access review",
    whatThisIs: "The bounded review of elevated access and administrative authority required before operational launch.",
    whyItMatters: "It prevents downstream work from assuming unrestricted administrative access is acceptable.",
    downstreamImpact: [
      "Affects approval traceability and role-controlled downstream execution.",
      "Changes whether go-live access posture can be treated as controlled."
    ],
    commonMistakes: [
      "Leaving privileged access undefined while go-live work proceeds.",
      "Assuming admin access can be cleaned up later without consequence."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Project owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Privileged access review must be scoped before users and approvals can be treated as go-live controlled."
  },
  masterDataOwnership: {
    id: "master-data-ownership",
    title: "Core master-data ownership",
    whatThisIs: "The named ownership for products, contacts, vendors, customers, and other shared reference records.",
    whyItMatters: "It prevents downstream domains from relying on shared data without accountable stewardship.",
    downstreamImpact: [
      "Affects shared data quality expectations across operational and finance-sensitive domains.",
      "Changes whether downstream configuration can rely on controlled shared records."
    ],
    commonMistakes: [
      "Treating shared records as ownerless setup residue.",
      "Assuming downstream domains can decide ownership ad hoc."
    ],
    reversibility: "Moderate",
    decisionOwner: "Data owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Master-data ownership must be explicit before shared records are treated as controlled inputs for downstream domains."
  },
  masterDataStructure: {
    id: "master-data-structure",
    title: "Shared classification structure",
    whatThisIs: "The bounded structure for categories, hierarchies, and shared record classification.",
    whyItMatters: "It shapes how downstream domains interpret and reuse common records.",
    downstreamImpact: [
      "Affects product, partner, and other shared classification reuse across downstream domains.",
      "Changes whether downstream setups can be reviewed against a stable shared structure."
    ],
    commonMistakes: [
      "Letting each domain invent its own shared structure.",
      "Assuming categories can be retrofitted after downstream flows are defined."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Data owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Shared master-data structure must be explicit before downstream data readiness is treated as controlled."
  },
  masterDataReadiness: {
    id: "master-data-readiness",
    title: "Downstream master-data readiness",
    whatThisIs: "The bounded checkpoint that shared data prerequisites are defined clearly enough for downstream domains to depend on them.",
    whyItMatters: "It prevents downstream domains from claiming controlled progression on top of undefined shared data assumptions.",
    downstreamImpact: [
      "Affects whether downstream operational and finance-sensitive checkpoints can rely on shared data assumptions.",
      "Changes how later domain blockers and evidence should be interpreted."
    ],
    commonMistakes: [
      "Treating shared data readiness as implied once ownership exists.",
      "Using incomplete structures as if they were downstream-ready."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Data owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Master-data readiness must be explicit before downstream domains treat shared data assumptions as controlled."
  },
  inventoryWarehouse: {
    id: "inventory-warehouse-setup",
    title: "Warehouse setup",
    whatThisIs: "The warehouse structure that defines storage, handling, and movement boundaries for inventory operations.",
    whyItMatters: "It determines how receipts, internal transfers, deliveries, and traceability operate in practice.",
    downstreamImpact: [
      "Affects operation-type design and route viability.",
      "Changes how users execute stock moves and how evidence is reviewed."
    ],
    commonMistakes: [
      "Designing warehouse structure after downstream flows are already assumed.",
      "Mixing conceptual storage layout with uncontrolled live operational behavior."
    ],
    reversibility: "Moderate",
    decisionOwner: "Operations lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Warehouse setup must be explicitly defined before dependent inventory controls can pass."
  },
  inventoryOperationTypes: {
    id: "inventory-operation-types",
    title: "Operation types",
    whatThisIs: "The controlled design of stock operation categories and sequence behavior for inventory execution.",
    whyItMatters: "It governs warehouse traceability, user actions, and process clarity.",
    downstreamImpact: [
      "Affects picking flow, auditability, and warehouse reporting interpretation.",
      "Constrains how routes and warehouse transactions are executed."
    ],
    commonMistakes: [
      "Creating inconsistent operation structures across warehouses.",
      "Ignoring the user and approval implications of operation sequencing."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Warehouse or operations lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Operation types remain blocked until warehouse setup is controlled and the structure is explicitly confirmed."
  },
  inventoryRoutes: {
    id: "inventory-routes",
    title: "Routes",
    whatThisIs: "The logistics paths that define how products move through procurement, manufacturing, and warehouse operations.",
    whyItMatters: "Routes determine replenishment behavior, warehouse flow, and operational complexity.",
    downstreamImpact: [
      "Affects purchase triggers, manufacturing behavior, and picking flow.",
      "Changes user workload and operational dependency chains."
    ],
    commonMistakes: [
      "Enabling routes before warehouse design and operation types are clear.",
      "Combining flows users cannot operate consistently."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Operations lead with supply chain owner input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Routes cannot be finalized until warehouse setup and operation types are controlled."
  },
  inventory: {
    id: "inventory-valuation",
    title: "Inventory Valuation",
    whatThisIs: "The method by which inventory value is recognized and linked to accounting behavior.",
    whyItMatters: "It shapes stock valuation reporting, accounting entries, and finance-operational alignment.",
    downstreamImpact: [
      "Affects accounting integration and product category policy.",
      "Changes cost visibility and go-live finance controls."
    ],
    commonMistakes: [
      "Choosing a method without finance ownership.",
      "Assuming valuation is cosmetic rather than controlling downstream behavior."
    ],
    reversibility: "Difficult",
    decisionOwner: "Finance lead with inventory/process owner input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Valuation-sensitive checkpoints remain blocked until finance policy is explicitly confirmed."
  },
  inventoryLandedCosts: {
    id: "inventory-landed-costs",
    title: "Landed Costs",
    whatThisIs: "The policy and method for allocating additional procurement-related costs into inventory valuation.",
    whyItMatters: "It changes stock cost treatment and finance reporting expectations.",
    downstreamImpact: [
      "Affects product costing, accounting interpretation, and margin visibility.",
      "Changes the finance review burden for inventory close confidence."
    ],
    commonMistakes: [
      "Enabling landed costs without finance agreement.",
      "Treating landed costs as optional detail when costing accuracy matters."
    ],
    reversibility: "Difficult",
    decisionOwner: "Finance lead with procurement and inventory owner input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Do not assume a landed-cost policy. The decision must be explicit before dependent inventory costing work can be treated as controlled."
  },
  accountingFinancePolicy: {
    id: "accounting-finance-policy",
    title: "Finance policy prerequisites",
    whatThisIs: "The foundational accounting policy decisions that govern valuation-sensitive and accounting-linked implementation work.",
    whyItMatters: "It sets the accounting control baseline before downstream inventory-sensitive accounting choices can be treated as controlled.",
    downstreamImpact: [
      "Affects whether valuation-sensitive Inventory checkpoints can proceed at all.",
      "Changes whether downstream accounting-linked setup is blocked or reviewable."
    ],
    commonMistakes: [
      "Treating finance policy as late-stage cleanup.",
      "Allowing operational design to outrun accounting ownership."
    ],
    reversibility: "Difficult",
    decisionOwner: "Finance lead",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Finance policy prerequisites must be explicit before valuation-sensitive downstream checkpoints can pass."
  },
  accountingValuationMethod: {
    id: "accounting-valuation-method",
    title: "Inventory valuation method prerequisites",
    whatThisIs: "The accounting-side policy choice for how inventory valuation will be governed before operational valuation-dependent setup is treated as controlled.",
    whyItMatters: "It determines whether Inventory valuation design has a valid accounting basis.",
    downstreamImpact: [
      "Affects Inventory valuation truth and downstream cost interpretation.",
      "Changes whether stock-accounting mapping can be treated as valid."
    ],
    commonMistakes: [
      "Assuming valuation method is implied by operational flow.",
      "Leaving finance ownership undefined while valuation-sensitive setup proceeds."
    ],
    reversibility: "Difficult",
    decisionOwner: "Finance lead",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Do not treat inventory valuation as controlled until the accounting valuation method policy is explicitly confirmed."
  },
  accountingStockMapping: {
    id: "accounting-stock-mapping",
    title: "Stock accounting mapping prerequisites",
    whatThisIs: "The accounting-side prerequisite mapping decisions that support inventory valuation-linked bookkeeping behavior.",
    whyItMatters: "It prevents inventory valuation-sensitive setup from being treated as complete without accounting linkage.",
    downstreamImpact: [
      "Affects whether Inventory valuation-sensitive checkpoints can pass.",
      "Changes landed cost accounting readiness and finance review burden."
    ],
    commonMistakes: [
      "Treating stock-accounting mapping as optional detail.",
      "Proceeding with valuation-sensitive design before accounting linkage is reviewed."
    ],
    reversibility: "Difficult",
    decisionOwner: "Finance lead",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Stock accounting mapping prerequisites must be explicit before inventory valuation-sensitive checkpoints can be treated as controlled."
  },
  accountingLandedCosts: {
    id: "accounting-landed-costs",
    title: "Landed cost accounting prerequisites",
    whatThisIs: "The accounting-side prerequisites that determine whether landed cost treatment can be governed safely.",
    whyItMatters: "It constrains whether landed-cost-related inventory policy can be treated as controlled rather than assumed.",
    downstreamImpact: [
      "Affects Inventory landed cost checkpoint truth and costing interpretation.",
      "Changes whether deferred or phase-2 landed cost decisions remain reviewable."
    ],
    commonMistakes: [
      "Treating landed cost accounting as implicit once valuation exists.",
      "Assuming optional means ungoverned."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Finance lead",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Do not treat landed cost accounting as assumed. The prerequisite policy must be explicitly decided before dependent landed cost work is treated as controlled."
  },
  accountingPolicyCapture: {
    id: "accounting-policy-capture",
    title: "Policy capture",
    whatThisIs: "The bounded capture branch for finance and valuation policy inputs used only for implementation planning.",
    whyItMatters:
      "Policy capture keeps finance and valuation assumptions visible without pretending the rows prove a configured or live Accounting state.",
    downstreamImpact: [
      "Affects review of finance policy prerequisites and valuation method prerequisites.",
      "Shapes what downstream accounting-linked planning can be treated as controlled."
    ],
    commonMistakes: [
      "Treating capture rows as proof.",
      "Letting capture rows clear Accounting or Inventory blockers.",
      "Assuming a row count means the policy is validated."
    ],
    reversibility: "Easy to revise while capture is still planning-only.",
    decisionOwner: "Finance lead",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Policy capture rows are planning-only. They do not pass checkpoints, prove readiness, or replace the named finance decision owner."
  },
  salesProcessMode: {
    id: "sales-process-mode",
    title: "Quotation-to-order baseline",
    whatThisIs: "The bounded rule for how the Sales domain moves from quotation through order confirmation in the current implementation scope.",
    whyItMatters: "It sets the commercial control baseline before pricing, approvals, and downstream handoff assumptions are treated as governed.",
    downstreamImpact: [
      "Affects pricing policy, quotation approval handling, and order confirmation expectations.",
      "Changes how downstream fulfillment and invoicing-sensitive assumptions are reviewed."
    ],
    commonMistakes: [
      "Treating quotation flow as implied rather than explicitly bounded.",
      "Letting downstream commercial rules outrun the named sales process mode."
    ],
    reversibility: "Moderate early, difficult once downstream sales execution is active.",
    decisionOwner: "Sales lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Sales process mode must be explicit before pricing and order-control checkpoints are treated as controlled."
  },
  salesPricingPolicy: {
    id: "sales-pricing-policy",
    title: "Pricing and pricelist baseline",
    whatThisIs: "The bounded commercial pricing policy for base pricelist use, pricing authority, and when exceptions require explicit control.",
    whyItMatters: "It prevents quotation and order behavior from relying on assumed pricing rules.",
    downstreamImpact: [
      "Affects approval thresholds, commercial consistency, and downstream invoice expectation review.",
      "Changes whether order-control checkpoints can be interpreted as governed."
    ],
    commonMistakes: [
      "Assuming pricing policy can be filled in after quotation flow is already defined.",
      "Treating pricelist behavior as a technical detail instead of a controlled commercial policy."
    ],
    reversibility: "Moderate",
    decisionOwner: "Sales lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Pricing and pricelist policy must be explicit before Sales quotation control is treated as governed."
  },
  salesQuotationControl: {
    id: "sales-quotation-control",
    title: "Quotation approval and order control",
    whatThisIs: "The bounded rule for when quotations can be approved, confirmed, or escalated before operational launch of Sales.",
    whyItMatters: "It governs commercial authority and prevents uncontrolled order confirmation behavior.",
    downstreamImpact: [
      "Affects fulfillment handoff assumptions and any downstream billing-sensitive review.",
      "Changes whether Sales can be treated as go-live controlled rather than loosely configured."
    ],
    commonMistakes: [
      "Leaving approval authority implied.",
      "Treating order confirmation rules as a user training issue instead of a governed checkpoint."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Sales lead with project owner input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Quotation approval and order-control rules must be explicit before Sales can be treated as go-live controlled."
  },
  salesFulfillmentHandoff: {
    id: "sales-fulfillment-handoff",
    title: "Order fulfillment handoff assumptions",
    whatThisIs: "The bounded assumption set for how confirmed Sales orders hand off to downstream fulfillment or billing-sensitive execution.",
    whyItMatters: "It keeps downstream impact visible without pretending the downstream domains are already fully governed here.",
    downstreamImpact: [
      "Affects Inventory-sensitive delivery assumptions and accounting-sensitive invoicing expectations.",
      "Changes whether downstream operational handoffs are treated as explicit or guessed."
    ],
    commonMistakes: [
      "Assuming fulfillment handoff is automatic once quotations are controlled.",
      "Hiding downstream impact behind a narrow Sales-only view."
    ],
    reversibility: "Moderate",
    decisionOwner: "Sales lead with operations input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Order fulfillment handoff assumptions should be explicit before downstream operational interpretation is treated as controlled."
  },
  purchaseProcessMode: {
    id: "purchase-process-mode",
    title: "RFQ-to-purchase-order baseline",
    whatThisIs: "The bounded rule for how the Purchase domain moves from RFQ through purchase-order confirmation in the current implementation scope.",
    whyItMatters: "It sets the procurement control baseline before vendor policy, approvals, and inbound handoff assumptions are treated as governed.",
    downstreamImpact: [
      "Affects vendor policy, purchase approval handling, and inbound commercial commitments.",
      "Changes how downstream receipt and billing-sensitive assumptions are reviewed."
    ],
    commonMistakes: [
      "Treating RFQ flow as implied rather than explicitly bounded.",
      "Letting downstream purchasing rules outrun the named procurement process mode."
    ],
    reversibility: "Moderate early, difficult once downstream purchasing execution is active.",
    decisionOwner: "Procurement lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Purchase process mode must be explicit before vendor policy and approval-control checkpoints are treated as controlled."
  },
  purchaseVendorPricingPolicy: {
    id: "purchase-vendor-pricing-policy",
    title: "Vendor terms and pricing baseline",
    whatThisIs: "The bounded procurement policy for vendor terms, pricing expectations, and when vendor-specific exceptions require explicit control.",
    whyItMatters: "It prevents purchase commitments from relying on assumed vendor pricing and term behavior.",
    downstreamImpact: [
      "Affects approval thresholds, procurement consistency, and downstream billing expectation review.",
      "Changes whether purchase order-control checkpoints can be interpreted as governed."
    ],
    commonMistakes: [
      "Assuming vendor pricing policy can be filled in after RFQ flow is already defined.",
      "Treating vendor terms as a late commercial cleanup rather than a controlled procurement policy."
    ],
    reversibility: "Moderate",
    decisionOwner: "Procurement lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Vendor terms and pricing policy must be explicit before Purchase approval control is treated as governed."
  },
  purchaseApprovalControl: {
    id: "purchase-approval-control",
    title: "Purchase approval and order control",
    whatThisIs: "The bounded rule for when purchase requests or orders can be approved, confirmed, or escalated before operational launch of Purchase.",
    whyItMatters: "It governs procurement authority and prevents uncontrolled purchase commitment behavior.",
    downstreamImpact: [
      "Affects inbound handoff assumptions and any downstream billing-sensitive review.",
      "Changes whether Purchase can be treated as go-live controlled rather than loosely configured."
    ],
    commonMistakes: [
      "Leaving approval authority implied.",
      "Treating purchase order control as a user training issue instead of a governed checkpoint."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Procurement lead with project owner input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Purchase approval and order-control rules must be explicit before Purchase can be treated as go-live controlled."
  },
  purchaseInboundHandoff: {
    id: "purchase-inbound-handoff",
    title: "Inbound handoff assumptions",
    whatThisIs: "The bounded assumption set for how confirmed Purchase orders hand off to inbound operations or billing-sensitive follow-through.",
    whyItMatters: "It keeps downstream impact visible without pretending downstream domains are already fully governed here.",
    downstreamImpact: [
      "Affects Inventory-sensitive receipt assumptions and accounting-sensitive billing expectations.",
      "Changes whether downstream inbound handoffs are treated as explicit or guessed."
    ],
    commonMistakes: [
      "Assuming inbound handoff is automatic once purchase approvals are controlled.",
      "Hiding downstream impact behind a narrow Purchase-only view."
    ],
    reversibility: "Moderate",
    decisionOwner: "Procurement lead with operations input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Inbound handoff assumptions should be explicit before downstream operational interpretation is treated as controlled."
  },
  manufacturingProcessMode: {
    id: "manufacturing-process-mode",
    title: "Manufacturing process mode baseline",
    whatThisIs:
      "The bounded rule for whether the current Manufacturing scope is anchored in make-to-stock, make-to-order, or another explicitly named production baseline.",
    whyItMatters:
      "It sets the production control baseline before BOM governance, routing rules, and downstream production handoff assumptions are treated as governed.",
    downstreamImpact: [
      "Affects BOM governance, routing expectations, and production execution interpretation.",
      "Changes how downstream stock and costing-sensitive assumptions are reviewed."
    ],
    commonMistakes: [
      "Treating manufacturing mode as implied rather than explicitly bounded.",
      "Letting downstream production rules outrun the named manufacturing baseline."
    ],
    reversibility: "Moderate early, difficult once production execution is active.",
    decisionOwner: "Manufacturing lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Manufacturing process mode must be explicit before BOM governance and routing-control checkpoints are treated as controlled."
  },
  manufacturingBomGovernance: {
    id: "manufacturing-bom-governance",
    title: "Bill of materials governance baseline",
    whatThisIs:
      "The bounded policy for how bills of materials are owned, reviewed, and treated as controlled production definitions within the current scope.",
    whyItMatters:
      "It prevents production execution from relying on assumed or loosely managed BOM structures.",
    downstreamImpact: [
      "Affects routing interpretation, production consistency, and downstream stock-consumption expectations.",
      "Changes whether execution-control checkpoints can be interpreted as governed."
    ],
    commonMistakes: [
      "Assuming BOM governance can be filled in after production mode is already defined.",
      "Treating BOM structure as a technical cleanup issue instead of a governed production policy."
    ],
    reversibility: "Moderate",
    decisionOwner: "Manufacturing lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Bill of materials governance must be explicit before Manufacturing execution control is treated as governed."
  },
  manufacturingRoutingControl: {
    id: "manufacturing-routing-control",
    title: "Work order and routing control",
    whatThisIs:
      "The bounded rule for when routing and work-order behavior is required, simplified, or escalated before operational launch of Manufacturing.",
    whyItMatters:
      "It governs production execution authority and prevents uncontrolled routing or work-order behavior.",
    downstreamImpact: [
      "Affects production handoff assumptions and any downstream stock-accounting-sensitive review.",
      "Changes whether Manufacturing can be treated as go-live controlled rather than loosely configured."
    ],
    commonMistakes: [
      "Leaving routing expectations implied.",
      "Treating work-order control as a training issue instead of a governed checkpoint."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Manufacturing lead with project owner input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Routing and work-order control rules must be explicit before Manufacturing can be treated as go-live controlled."
  },
  manufacturingProductionHandoff: {
    id: "manufacturing-production-handoff",
    title: "Production handoff assumptions",
    whatThisIs:
      "The bounded assumption set for how controlled production execution hands off to downstream stock movement or completion interpretation.",
    whyItMatters:
      "It keeps downstream impact visible without pretending downstream domains are already fully governed here.",
    downstreamImpact: [
      "Affects Inventory-sensitive completion assumptions and accounting-sensitive production-cost interpretation.",
      "Changes whether downstream production handoffs are treated as explicit or guessed."
    ],
    commonMistakes: [
      "Assuming production handoff is automatic once routing control exists.",
      "Hiding downstream impact behind a narrow Manufacturing-only view."
    ],
    reversibility: "Moderate",
    decisionOwner: "Manufacturing lead with operations input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Production handoff assumptions should be explicit before downstream operational interpretation is treated as controlled."
  },
  pos: {
    id: "pos-invoicing-policy",
    title: "POS Invoicing Policy",
    whatThisIs: "The rule for when and how POS transactions produce invoices or remain receipt-based sales.",
    whyItMatters: "It changes cashier workflow, customer experience, and accounting expectations.",
    downstreamImpact: [
      "Affects journal behavior and customer identification flow.",
      "Changes tax handling and session-close expectations."
    ],
    commonMistakes: [
      "Assuming every POS sale should invoice.",
      "Ignoring session-close and accounting linkage implications."
    ],
    reversibility: "Moderate",
    decisionOwner: "Retail operations owner with finance lead input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Do not assume a default invoicing policy. The named decision owner must resolve this before POS go-live."
  },
  roles: {
    id: "user-roles-approvals",
    title: "User Roles / Approvals",
    whatThisIs: "The assignment of access rights and approval authority across the implementation.",
    whyItMatters: "It determines control, accountability, and separation of duties.",
    downstreamImpact: [
      "Affects approval-driven domains and restricted actions.",
      "Changes who can validate or operate controlled workflows."
    ],
    commonMistakes: [
      "Copying broad admin access into business roles.",
      "Leaving approvers undefined."
    ],
    reversibility: "Moderate",
    decisionOwner: "Project owner with functional leads and security/admin owner input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Role and approval design must be explicitly assigned. No best-guess permissions are allowed."
  },
  crmLeadOpportunityModel: {
    id: "crm-lead-opportunity-model",
    title: "CRM lead and opportunity model",
    whatThisIs: "The bounded CRM rule for whether leads and opportunities are part of the implementation baseline and how they are handled.",
    whyItMatters: "It sets the CRM starting point before pipeline governance or sales-team ownership is treated as controlled.",
    downstreamImpact: [
      "Affects pipeline stage design and how sales ownership is assigned.",
      "Changes whether quotation handoff assumptions can be reviewed as controlled."
    ],
    commonMistakes: [
      "Treating lead handling as implied instead of explicitly bounded.",
      "Letting downstream CRM rules outrun the named baseline."
    ],
    reversibility: "Moderate early, difficult once downstream CRM checkpoints are active.",
    decisionOwner: "Sales lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "CRM lead and opportunity model must be explicit before downstream CRM checkpoints are treated as controlled."
  },
  crmPipelineGovernance: {
    id: "crm-pipeline-governance",
    title: "CRM pipeline governance",
    whatThisIs: "The bounded rule for pipeline stages, stage sequence, and how pipeline control is kept consistent.",
    whyItMatters: "It prevents CRM progression from relying on assumed stage logic or unowned pipeline behavior.",
    downstreamImpact: [
      "Affects sales-team ownership and stage governance review.",
      "Changes whether downstream quotation handoff assumptions can be evaluated safely."
    ],
    commonMistakes: [
      "Assuming pipeline structure can be decided after the lead model is already in use.",
      "Treating stage sequence as a reporting detail instead of a controlled implementation choice."
    ],
    reversibility: "Moderate",
    decisionOwner: "Sales lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "CRM pipeline governance must be explicit before downstream CRM checkpoints are treated as controlled."
  },
  crmSalesTeamOwnership: {
    id: "crm-sales-team-ownership",
    title: "CRM sales-team ownership",
    whatThisIs: "The bounded assignment of which sales team owns the CRM flow for this implementation baseline.",
    whyItMatters: "It determines who is accountable for governed CRM progression and quotation handoff assumptions.",
    downstreamImpact: [
      "Affects approval ownership and who can interpret pipeline decisions.",
      "Changes whether quotation handoff can be treated as controlled."
    ],
    commonMistakes: [
      "Leaving sales-team ownership implied.",
      "Assuming team ownership can be assigned later without changing downstream control."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Project owner with Sales lead input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Sales-team ownership must be explicit before CRM go-live checkpoints are treated as controlled."
  },
  crmQuotationHandoff: {
    id: "crm-quotation-handoff",
    title: "CRM quotation handoff",
    whatThisIs: "The bounded assumption set for how CRM-qualified opportunities hand off into quotation behavior.",
    whyItMatters: "It keeps the downstream commercial impact visible without assuming quotation behavior is already fully governed.",
    downstreamImpact: [
      "Affects Sales quotation-control interpretation and downstream commercial review.",
      "Changes whether handoff assumptions are explicit or guessed."
    ],
    commonMistakes: [
      "Assuming quotation handoff is automatic once pipeline governance exists.",
      "Hiding downstream impact behind a narrow CRM-only view."
    ],
    reversibility: "Moderate",
    decisionOwner: "Sales lead with operations input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Quotation handoff assumptions should be explicit before downstream commercial interpretation is treated as controlled."
  },
  websiteScopeBaseline: {
    id: "website-scope-baseline",
    title: "Website scope baseline",
    whatThisIs: "The bounded rule for which website and eCommerce surfaces are in scope for the implementation baseline.",
    whyItMatters: "It sets the website starting point before catalog publication or customer access design is treated as controlled.",
    downstreamImpact: [
      "Affects catalog publication and customer-access boundary decisions.",
      "Changes whether checkout baseline assumptions can be reviewed as controlled."
    ],
    commonMistakes: [
      "Letting website scope remain implied.",
      "Treating website and eCommerce scope as a later implementation detail."
    ],
    reversibility: "Moderate early, difficult once downstream website checkpoints are active.",
    decisionOwner: "Website lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Website scope baseline must be explicit before downstream website checkpoints are treated as controlled."
  },
  websiteCatalogPublication: {
    id: "website-catalog-publication",
    title: "Website catalog publication",
    whatThisIs: "The bounded rule for which products, pages, and catalog content are published on the website baseline.",
    whyItMatters: "It prevents website publication from relying on assumed catalog visibility or page completeness.",
    downstreamImpact: [
      "Affects customer access boundary and checkout baseline review.",
      "Changes whether publication is treated as controlled or guessed."
    ],
    commonMistakes: [
      "Assuming catalog publication can be decided after website scope is already in use.",
      "Treating product-page visibility as a cosmetic detail instead of controlled scope."
    ],
    reversibility: "Moderate",
    decisionOwner: "Website lead with product owner input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Catalog and product-page publication must be explicit before downstream website checkpoints are treated as controlled."
  },
  websiteCustomerAccessModel: {
    id: "website-customer-access-model",
    title: "Website customer access model",
    whatThisIs: "The bounded customer-access boundary between public browsing, customer-specific access, and controlled ordering paths.",
    whyItMatters: "It prevents website work from assuming a customer-access model that was never agreed.",
    downstreamImpact: [
      "Affects checkout baseline and delivery handoff assumptions.",
      "Changes whether B2B/B2C boundary decisions are explicit."
    ],
    commonMistakes: [
      "Leaving public and customer-specific access boundaries implicit.",
      "Assuming portal or login behavior can be expanded by default."
    ],
    reversibility: "Moderate to difficult",
    decisionOwner: "Website lead with sales owner input",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Customer access boundaries must be explicit before checkout can be treated as controlled."
  },
  websiteCheckoutBaseline: {
    id: "website-checkout-baseline",
    title: "Website checkout baseline",
    whatThisIs: "The bounded ordering and checkout rule set for the website and eCommerce baseline only.",
    whyItMatters: "It defines how controlled ordering is treated before any later payment or shipping decisions are considered.",
    downstreamImpact: [
      "Affects delivery handoff assumptions and downstream fulfillment review.",
      "Changes whether website ordering can be treated as go-live controlled."
    ],
    commonMistakes: [
      "Assuming checkout can be defined before scope, catalog, and access boundaries are clear.",
      "Treating checkout as a generic eCommerce engine decision instead of a controlled baseline."
    ],
    reversibility: "Difficult",
    decisionOwner: "Website lead with finance owner input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Checkout baseline must be explicit before website go-live checkpoints are treated as controlled."
  },
  websiteDeliveryHandoff: {
    id: "website-delivery-handoff",
    title: "Website delivery handoff",
    whatThisIs: "The bounded assumption set for how website orders hand off into delivery or click-and-collect follow-through.",
    whyItMatters: "It keeps downstream impact visible without assuming logistics behavior is already fully governed.",
    downstreamImpact: [
      "Affects operations review of order fulfillment handoff.",
      "Changes whether downstream delivery assumptions are explicit or guessed."
    ],
    commonMistakes: [
      "Assuming delivery handoff is automatic once checkout exists.",
      "Hiding downstream impact behind a narrow website-only view."
    ],
    reversibility: "Moderate",
    decisionOwner: "Website lead with operations input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Delivery handoff assumptions should be explicit before downstream operational interpretation is treated as controlled."
  },
  posSessionControl: {
    id: "pos-session-control",
    title: "POS session control baseline",
    whatThisIs: "The bounded rule set for how POS sessions are opened, closed, and governed during retail operations.",
    whyItMatters: "It prevents cashier access and accounting linkage from being built on an undefined session model.",
    downstreamImpact: [
      "Affects cashier access design and POS accounting journal linkage.",
      "Changes whether POS operations are treated as controlled or guessed."
    ],
    commonMistakes: [
      "Treating POS session policy as an afterthought once other POS decisions are in progress.",
      "Assuming a default Odoo POS session model without explicit baseline decisions."
    ],
    reversibility: "Moderate early, difficult once cashier and accounting decisions follow.",
    decisionOwner: "Retail operations owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "POS session control baseline must be explicit before cashier access and accounting linkage are treated as controlled."
  },
  posCashierAccess: {
    id: "pos-cashier-access",
    title: "POS cashier access design",
    whatThisIs: "The bounded rule for which roles have cashier access and how access is enforced within POS sessions.",
    whyItMatters: "It prevents POS access from being assumed or left to default role configuration without explicit design.",
    downstreamImpact: [
      "Affects POS accounting linkage and go-live operational control.",
      "Changes whether cashier policy is treated as explicit or guessed."
    ],
    commonMistakes: [
      "Assuming cashier access can be defined after session control decisions are in use.",
      "Treating access control as a POS cosmetic setting rather than a security boundary."
    ],
    reversibility: "Moderate",
    decisionOwner: "Retail operations owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Cashier access design must be explicit before POS accounting linkage and go-live review are treated as controlled."
  },
  posAccountingLinkage: {
    id: "pos-accounting-linkage",
    title: "POS accounting linkage baseline",
    whatThisIs: "The bounded assumption set for how POS sales and sessions are linked to accounting journals and reports.",
    whyItMatters: "It prevents POS go-live from relying on assumed journal linkage or unreviewed default account mappings.",
    downstreamImpact: [
      "Affects go-live financial reporting and session closing reconciliation.",
      "Changes whether POS accounting is treated as explicitly governed or guessed."
    ],
    commonMistakes: [
      "Assuming POS accounting linkage is handled automatically once a journal is named.",
      "Treating accounting linkage as a finance detail instead of a go-live prerequisite."
    ],
    reversibility: "Difficult once go-live review begins.",
    decisionOwner: "Retail operations owner with finance lead input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "POS accounting linkage must be explicit before go-live review is treated as controlled."
  },
  projectsStructureBaseline: {
    id: "projects-structure-baseline",
    title: "Project structure baseline",
    whatThisIs: "The bounded rule for how projects, tasks, and stages are structured in this implementation.",
    whyItMatters: "It prevents billing linkage and task flow assumptions from being built on an undefined project model.",
    downstreamImpact: [
      "Affects billing linkage, timesheet design, and downstream project reporting.",
      "Changes whether project execution is treated as controlled or guessed."
    ],
    commonMistakes: [
      "Treating project structure as a setup detail once billing or timesheet decisions are in progress.",
      "Assuming a default Odoo project stage model without explicit baseline decisions."
    ],
    reversibility: "Moderate",
    decisionOwner: "Project owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Project structure baseline must be explicit before billing linkage and ownership decisions are treated as controlled."
  },
  projectsBillingLinkage: {
    id: "projects-billing-linkage",
    title: "Project billing linkage baseline",
    whatThisIs: "The bounded assumption set for how project milestones or timesheets link to invoicing.",
    whyItMatters: "It prevents go-live billing from relying on assumed linkage between project completion and customer invoices.",
    downstreamImpact: [
      "Affects accounts receivable integration and go-live invoicing review.",
      "Changes whether project billing is treated as explicitly governed."
    ],
    commonMistakes: [
      "Assuming billing linkage is automatic once a project type is selected.",
      "Treating billing method as a late project configuration detail."
    ],
    reversibility: "Difficult once project billing goes live.",
    decisionOwner: "Project owner with finance lead input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Project billing linkage must be explicit before go-live review is treated as controlled."
  },
  projectsOwnershipPolicy: {
    id: "projects-ownership-policy",
    title: "Project ownership and execution policy",
    whatThisIs: "The bounded rule for how project and task ownership, assignment, and execution responsibility are defined.",
    whyItMatters: "It prevents execution ambiguity when multiple teams or roles contribute to a shared project.",
    downstreamImpact: [
      "Affects task assignment, deadline governance, and project reporting accuracy.",
      "Changes whether execution accountability is explicit."
    ],
    commonMistakes: [
      "Assuming ownership policies are self-evident once projects exist.",
      "Treating assignment rules as a cosmetic configuration rather than an accountability boundary."
    ],
    reversibility: "Moderate",
    decisionOwner: "Project owner",
    trainingOffer: "Yes",
    checkpointBlocker: false,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Project ownership and execution policy should be explicit before project work is treated as reliably governed."
  },
  hrEmployeeStructure: {
    id: "hr-employee-structure",
    title: "Employee and department structure baseline",
    whatThisIs: "The bounded rule for how employees, departments, and job positions are structured in this implementation.",
    whyItMatters: "It prevents approval relationships, access boundaries, and department reporting from being built on an undefined employee model.",
    downstreamImpact: [
      "Affects manager and approval relationships, employee access, and HR reporting.",
      "Changes whether departmental governance is treated as explicit or guessed."
    ],
    commonMistakes: [
      "Importing employee data before department hierarchy is defined.",
      "Treating department structure as a late HR configuration detail."
    ],
    reversibility: "Moderate early, difficult once employee records are in use.",
    decisionOwner: "HR lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Employee and department structure must be explicit before approval relationships and access design are treated as controlled."
  },
  hrApprovalRelationships: {
    id: "hr-approval-relationships",
    title: "Manager and approval relationships",
    whatThisIs: "The bounded rule for which manager relationships and approval chains are required in this implementation.",
    whyItMatters: "It prevents go-live HR from relying on assumed or missing manager assignments that affect approvals and workflows.",
    downstreamImpact: [
      "Affects leave approval, expense approval, and any HR-linked workflow.",
      "Changes whether manager-dependent decisions are treated as controlled."
    ],
    commonMistakes: [
      "Assuming manager relationships are populated automatically after employee import.",
      "Treating approval chain design as a post-go-live configuration."
    ],
    reversibility: "Moderate to difficult.",
    decisionOwner: "HR lead with project owner input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Manager and approval relationships must be explicit before go-live HR workflows are treated as controlled."
  },
  plmChangeControlBaseline: {
    id: "plm-change-control-baseline",
    title: "Engineering change control baseline",
    whatThisIs: "The bounded rule set for how engineering changes are controlled, reviewed, and applied to BOMs and products.",
    whyItMatters: "It prevents ECO workflows from being built on an assumed or undefined change-control model.",
    downstreamImpact: [
      "Affects BOM revision governance and manufacturing routing accuracy.",
      "Changes whether engineering change processes are treated as controlled."
    ],
    commonMistakes: [
      "Treating PLM change control as a manufacturing add-on rather than a standalone governance decision.",
      "Assuming BOM revision policies are inherited from general manufacturing configuration."
    ],
    reversibility: "Moderate early, difficult once ECOs are in active use.",
    decisionOwner: "Engineering lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Engineering change control baseline must be explicit before ECO approval flow and BOM revision governance are treated as controlled."
  },
  plmApprovalDesign: {
    id: "plm-approval-design",
    title: "ECO approval design",
    whatThisIs: "The bounded rule for which approval stages and approvers are required before an engineering change is applied.",
    whyItMatters: "It prevents engineering changes from being applied to live BOMs without explicit approval governance.",
    downstreamImpact: [
      "Affects BOM consistency in live production and supply planning.",
      "Changes whether engineering release decisions are treated as controlled."
    ],
    commonMistakes: [
      "Assuming approval design can follow after ECO workflows are built.",
      "Treating ECO approval as optional for small manufacturing environments."
    ],
    reversibility: "Difficult once ECOs are approved and applied.",
    decisionOwner: "Engineering lead with manufacturing lead input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "ECO approval design must be explicit before go-live engineering change governance is treated as controlled."
  },
  qualityControlBaseline: {
    id: "quality-control-baseline",
    title: "Quality control baseline",
    whatThisIs: "The bounded rule set for which quality checks are required, at which operations, and what pass/fail handling applies.",
    whyItMatters: "It prevents quality trigger rules from being built on an undefined or assumed control model.",
    downstreamImpact: [
      "Affects production operations control and receipt/delivery quality gate behavior.",
      "Changes whether quality failures block downstream operations or are silently bypassed."
    ],
    commonMistakes: [
      "Treating quality checks as an optional manufacturing add-on without explicit baseline decisions.",
      "Assuming default quality check behavior matches business requirements without review."
    ],
    reversibility: "Moderate early, difficult once production quality gates are active.",
    decisionOwner: "Quality lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Quality control baseline must be explicit before trigger rules and exception policies are treated as controlled."
  },
  qualityTriggerRules: {
    id: "quality-trigger-rules",
    title: "Quality trigger rules",
    whatThisIs: "The bounded rule for which operations trigger quality checks and how non-conformances are escalated.",
    whyItMatters: "It prevents go-live quality operations from relying on undefined or unreviewed trigger logic.",
    downstreamImpact: [
      "Affects production throughput, receipt accuracy, and delivery quality reporting.",
      "Changes whether quality-related operational decisions are treated as controlled."
    ],
    commonMistakes: [
      "Assuming trigger rules can be defined after go-live once quality issues appear.",
      "Treating escalation policy as a configuration detail rather than a governance requirement."
    ],
    reversibility: "Moderate to difficult once trigger rules are applied in live operations.",
    decisionOwner: "Quality lead with operations input",
    trainingOffer: "Role-dependent",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Quality trigger rules must be explicit before go-live quality operations are treated as controlled."
  },
  documentsWorkspaceGovernance: {
    id: "documents-workspace-governance",
    title: "Document workspace governance baseline",
    whatThisIs: "The bounded rule for how document workspaces are structured, owned, and governed in this implementation.",
    whyItMatters: "It prevents access control and operational document linkage from being built on undefined workspace boundaries.",
    downstreamImpact: [
      "Affects document access control, operational linkage, and compliance traceability.",
      "Changes whether document management is treated as explicitly governed."
    ],
    commonMistakes: [
      "Treating document workspace setup as an optional post-go-live configuration.",
      "Assuming workspace ownership policies are self-evident once folders exist."
    ],
    reversibility: "Moderate",
    decisionOwner: "Implementation lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Document workspace governance must be explicit before access control and operational linkage are treated as controlled."
  },
  documentsAccessControl: {
    id: "documents-access-control",
    title: "Document access control",
    whatThisIs: "The bounded rule for which users and roles can access, edit, and share documents in each workspace.",
    whyItMatters: "It prevents uncontrolled document access from bypassing security boundaries defined in other domains.",
    downstreamImpact: [
      "Affects cross-domain document sharing and compliance boundary enforcement.",
      "Changes whether document visibility is treated as controlled or open by default."
    ],
    commonMistakes: [
      "Assuming workspace access inherits from general user roles without explicit review.",
      "Treating document access control as a late-implementation detail."
    ],
    reversibility: "Moderate",
    decisionOwner: "Implementation lead",
    trainingOffer: "Yes",
    checkpointBlocker: false,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Document access control should be explicit before operational document work is treated as reliably governed."
  },
  signTemplateGovernance: {
    id: "sign-template-governance",
    title: "Signature template governance baseline",
    whatThisIs: "The bounded rule for which signature templates are in scope, who controls them, and how they are approved.",
    whyItMatters: "It prevents signature workflows from being built on undefined or unreviewed template governance.",
    downstreamImpact: [
      "Affects signer control, traceability, and legal enforceability of signed documents.",
      "Changes whether signature workflows are treated as explicitly governed."
    ],
    commonMistakes: [
      "Treating signature templates as reusable without explicit governance decisions.",
      "Assuming template approval is handled outside the bounded implementation scope."
    ],
    reversibility: "Moderate",
    decisionOwner: "Implementation lead",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Signature template governance must be explicit before signer control and traceability are treated as controlled."
  },
  signSignerControl: {
    id: "sign-signer-control",
    title: "Signer control and traceability",
    whatThisIs: "The bounded rule for how signers are assigned, notified, and tracked within the signature workflow.",
    whyItMatters: "It ensures signature evidence is traceable and auditable, not assumed from default behavior.",
    downstreamImpact: [
      "Affects audit traceability, legal enforceability, and cross-domain document completion signaling.",
      "Changes whether signer assignments are treated as explicit or default."
    ],
    commonMistakes: [
      "Assuming Odoo Sign notifications and signer tracking are correctly configured by default.",
      "Treating signer assignment as a per-document decision rather than a governed policy."
    ],
    reversibility: "Moderate",
    decisionOwner: "Implementation lead",
    trainingOffer: "Yes",
    checkpointBlocker: false,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Signer control and traceability should be explicit before signature workflows are treated as reliably governed."
  },
  approvalsStructureBaseline: {
    id: "approvals-structure-baseline",
    title: "Approval structure baseline",
    whatThisIs: "The bounded rule for which approval types, categories, and sequences are in scope for this implementation.",
    whyItMatters: "It prevents approver authority and escalation design from being built on an undefined or assumed approval model.",
    downstreamImpact: [
      "Affects approver authority design, delegation policy, and cross-domain approval dependencies.",
      "Changes whether approval governance is treated as explicit or guessed."
    ],
    commonMistakes: [
      "Treating approval categories as self-evident once request types are named.",
      "Assuming approval structure can be defined after authority and delegation decisions are in progress."
    ],
    reversibility: "Moderate early, difficult once approval workflows are active.",
    decisionOwner: "Project owner",
    trainingOffer: "Yes",
    checkpointBlocker: true,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Approval structure baseline must be explicit before approver authority and traceability are treated as controlled."
  },
  approvalsAuthorityControl: {
    id: "approvals-authority-control",
    title: "Approver authority and traceability",
    whatThisIs: "The bounded rule for who holds approver authority in each category, how delegation works, and how decisions are recorded.",
    whyItMatters: "It ensures approval decisions are traceable and not reliant on assumed role behavior.",
    downstreamImpact: [
      "Affects cross-domain approval dependencies and audit traceability.",
      "Changes whether approver assignment is treated as explicit governance."
    ],
    commonMistakes: [
      "Assuming approver authority is automatically inherited from manager relationships.",
      "Treating delegation policy as a cosmetic user configuration rather than an authority boundary."
    ],
    reversibility: "Moderate",
    decisionOwner: "Project owner",
    trainingOffer: "Yes",
    checkpointBlocker: false,
    decisionState: "Unresolved",
    unresolvedDecisionMessage:
      "Approver authority and traceability should be explicit before approval workflows are treated as reliably governed."
  }
};

export function getGuidanceStatusLabel(block) {
  if (block.decisionState === "Unresolved") {
    return "Blocked - decision required";
  }

  if (block.checkpointBlocker) {
    return "Blocking checkpoint";
  }

  return "Guidance available";
}
