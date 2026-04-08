export const RENTAL_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-rental-product-setup",
    area: "Product setup",
    title: "Rental product baseline defined",
    stageId: "extended-modules",
    domainId: "rental",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Rental operations lead",
    guidanceKey: "rentalProductSetup",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting rental product baseline confirmation",
    initialBlockedReason:
      "Rental product baseline must be explicit before pricing rules and return workflows are treated as controlled."
  },
  {
    id: "checkpoint-rental-pricing-duration",
    area: "Pricing and duration",
    title: "Pricing and duration rules defined",
    stageId: "extended-modules",
    domainId: "rental",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Rental operations lead",
    guidanceKey: "rentalPricingDuration",
    dependencyIds: ["checkpoint-rental-product-setup"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting pricing and duration rules confirmation",
    initialBlockedReason:
      "Pricing and duration rules cannot be treated as controlled before the rental product baseline is explicit."
  },
  {
    id: "checkpoint-rental-return-damage",
    area: "Return and damage",
    title: "Return and damage workflow bounded",
    stageId: "extended-modules",
    domainId: "rental",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Rental operations lead with warehouse input",
    guidanceKey: "rentalReturnDamage",
    dependencyIds: ["checkpoint-rental-pricing-duration"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting return and damage workflow confirmation",
    initialBlockedReason:
      "Return and damage workflow cannot be treated as go-live controlled before pricing and duration rules are explicit."
  }
];

export function isRentalCheckpoint(checkpoint) {
  return checkpoint?.domainId === "rental";
}
