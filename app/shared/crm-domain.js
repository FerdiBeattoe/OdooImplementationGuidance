export const CRM_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-crm-lead-opportunity-model",
    area: "Lead / opportunity model",
    title: "Lead and opportunity model defined",
    stageId: "core-operations",
    domainId: "crm",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Sales lead",
    guidanceKey: "crmLeadOpportunityModel",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting CRM baseline confirmation",
    initialBlockedReason: "CRM lead and opportunity model must be explicit before controlled progression."
  },
  {
    id: "checkpoint-crm-pipeline-governance",
    area: "Pipeline governance",
    title: "Pipeline and stage governance defined",
    stageId: "core-operations",
    domainId: "crm",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Sales lead",
    guidanceKey: "crmPipelineGovernance",
    dependencyIds: ["checkpoint-crm-lead-opportunity-model"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting pipeline governance confirmation",
    initialBlockedReason: "CRM pipeline governance remains blocked until the lead and opportunity model is controlled."
  },
  {
    id: "checkpoint-crm-sales-team-ownership",
    area: "Sales team ownership",
    title: "Sales team ownership defined",
    stageId: "core-operations",
    domainId: "crm",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Sales lead",
    guidanceKey: "crmSalesTeamOwnership",
    dependencyIds: ["checkpoint-crm-lead-opportunity-model", "checkpoint-crm-pipeline-governance"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting sales team ownership confirmation",
    initialBlockedReason: "Sales team ownership cannot be treated as controlled before the CRM baseline and pipeline governance pass."
  },
  {
    id: "checkpoint-crm-quotation-handoff",
    area: "Quotation handoff",
    title: "Quotation handoff assumptions bounded",
    stageId: "core-operations",
    domainId: "crm",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Sales lead with operations input",
    guidanceKey: "crmQuotationHandoff",
    dependencyIds: ["checkpoint-crm-sales-team-ownership"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting quotation handoff decision confirmation",
    initialBlockedReason: ""
  }
];

export function isCrmCheckpoint(checkpoint) {
  return checkpoint?.domainId === "crm";
}
