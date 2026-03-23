export const SALES_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-sales-process-mode",
    area: "Commercial policy",
    title: "Quotation-to-order baseline defined",
    stageId: "core-operations",
    domainId: "sales",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Sales lead",
    guidanceKey: "salesProcessMode",
    dependencyIds: ["checkpoint-project-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting sales process baseline evidence",
    initialBlockedReason: "Sales process mode must be explicit before pricing and order-control decisions are treated as controlled."
  },
  {
    id: "checkpoint-sales-pricing-policy",
    area: "Pricing",
    title: "Pricing and pricelist baseline defined",
    stageId: "core-operations",
    domainId: "sales",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Sales lead",
    guidanceKey: "salesPricingPolicy",
    dependencyIds: ["checkpoint-sales-process-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting pricing policy evidence",
    initialBlockedReason: "Pricing policy remains blocked until the quotation-to-order baseline is controlled."
  },
  {
    id: "checkpoint-sales-quotation-control",
    area: "Order control",
    title: "Quotation approval and order-control baseline defined",
    stageId: "core-operations",
    domainId: "sales",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Sales lead",
    guidanceKey: "salesQuotationControl",
    dependencyIds: ["checkpoint-sales-process-mode", "checkpoint-sales-pricing-policy"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting quotation control evidence",
    initialBlockedReason: "Quotation approval and order-control rules cannot be treated as go-live controlled before baseline process and pricing rules pass."
  },
  {
    id: "checkpoint-sales-fulfillment-handoff",
    area: "Fulfillment handoff",
    title: "Order fulfillment handoff assumptions bounded",
    stageId: "core-operations",
    domainId: "sales",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Sales lead with operations input",
    guidanceKey: "salesFulfillmentHandoff",
    dependencyIds: ["checkpoint-sales-quotation-control"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting fulfillment handoff decision evidence",
    initialBlockedReason: ""
  }
];

export function isSalesCheckpoint(checkpoint) {
  return checkpoint?.domainId === "sales";
}
