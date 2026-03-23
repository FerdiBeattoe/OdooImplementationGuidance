export const WEBSITE_ECOMMERCE_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-website-scope-baseline",
    area: "Scope baseline",
    title: "Website scope baseline defined",
    stageId: "extended-modules",
    domainId: "website-ecommerce",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Website lead",
    guidanceKey: "websiteScopeBaseline",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting website scope confirmation",
    initialBlockedReason: "Website scope baseline must be explicit before controlled progression."
  },
  {
    id: "checkpoint-website-catalog-publication",
    area: "Catalog publication",
    title: "Catalog and product-page publication baseline defined",
    stageId: "extended-modules",
    domainId: "website-ecommerce",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Website lead",
    guidanceKey: "websiteCatalogPublication",
    dependencyIds: ["checkpoint-website-scope-baseline"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting catalog publication confirmation",
    initialBlockedReason: "Catalog publication remains blocked until the website scope baseline is controlled."
  },
  {
    id: "checkpoint-website-customer-access-model",
    area: "Customer access model",
    title: "Customer access boundary defined",
    stageId: "extended-modules",
    domainId: "website-ecommerce",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Website lead",
    guidanceKey: "websiteCustomerAccessModel",
    dependencyIds: ["checkpoint-website-scope-baseline", "checkpoint-website-catalog-publication"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting customer access confirmation",
    initialBlockedReason: "Customer access boundary cannot be treated as controlled before scope and publication are controlled."
  },
  {
    id: "checkpoint-website-checkout-baseline",
    area: "Checkout baseline",
    title: "Checkout baseline defined",
    stageId: "extended-modules",
    domainId: "website-ecommerce",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Website lead",
    guidanceKey: "websiteCheckoutBaseline",
    dependencyIds: [
      "checkpoint-website-scope-baseline",
      "checkpoint-website-catalog-publication",
      "checkpoint-website-customer-access-model"
    ],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting checkout baseline confirmation",
    initialBlockedReason: "Checkout baseline cannot be treated as controlled before scope, publication, and access controls pass."
  },
  {
    id: "checkpoint-website-delivery-handoff",
    area: "Delivery handoff",
    title: "Delivery handoff assumptions bounded",
    stageId: "extended-modules",
    domainId: "website-ecommerce",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Website lead with operations input",
    guidanceKey: "websiteDeliveryHandoff",
    dependencyIds: ["checkpoint-website-checkout-baseline"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting delivery handoff decision confirmation",
    initialBlockedReason: ""
  }
];

export function isWebsiteEcommerceCheckpoint(checkpoint) {
  return checkpoint?.domainId === "website-ecommerce";
}
