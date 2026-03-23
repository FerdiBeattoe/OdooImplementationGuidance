export const PURCHASE_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-purchase-process-mode",
    area: "Procurement policy",
    title: "RFQ-to-purchase-order baseline defined",
    stageId: "core-operations",
    domainId: "purchase",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Procurement lead",
    guidanceKey: "purchaseProcessMode",
    dependencyIds: ["checkpoint-project-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting RFQ-to-purchase-order baseline evidence",
    initialBlockedReason:
      "Purchase process mode must be explicit before vendor policy and approval-control decisions are treated as controlled."
  },
  {
    id: "checkpoint-purchase-vendor-pricing-policy",
    area: "Vendor policy",
    title: "Vendor terms and pricing baseline defined",
    stageId: "core-operations",
    domainId: "purchase",
    checkpointClass: "Domain Required",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Procurement lead",
    guidanceKey: "purchaseVendorPricingPolicy",
    dependencyIds: ["checkpoint-purchase-process-mode"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting vendor policy evidence",
    initialBlockedReason:
      "Vendor terms and pricing policy remain blocked until the RFQ-to-purchase-order baseline is controlled."
  },
  {
    id: "checkpoint-purchase-approval-control",
    area: "Order control",
    title: "Purchase approval and order-control baseline defined",
    stageId: "core-operations",
    domainId: "purchase",
    checkpointClass: "Go-Live",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Procurement lead",
    guidanceKey: "purchaseApprovalControl",
    dependencyIds: ["checkpoint-purchase-process-mode", "checkpoint-purchase-vendor-pricing-policy"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting purchase approval-control evidence",
    initialBlockedReason:
      "Purchase approval and order-control rules cannot be treated as go-live controlled before baseline procurement process and vendor policy rules pass."
  },
  {
    id: "checkpoint-purchase-inbound-handoff",
    area: "Inbound handoff",
    title: "Inbound handoff assumptions bounded",
    stageId: "core-operations",
    domainId: "purchase",
    checkpointClass: "Recommended",
    validationSource: "Both",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Procurement lead with operations input",
    guidanceKey: "purchaseInboundHandoff",
    dependencyIds: ["checkpoint-purchase-approval-control"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting inbound handoff decision evidence",
    initialBlockedReason: ""
  }
];

export function isPurchaseCheckpoint(checkpoint) {
  return checkpoint?.domainId === "purchase";
}
