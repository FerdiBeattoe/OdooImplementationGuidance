export const SPREADSHEET_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-spreadsheet-template-baseline",
    area: "Template baseline",
    title: "Spreadsheet template baseline defined",
    stageId: "extended-modules",
    domainId: "spreadsheet",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead",
    guidanceKey: "spreadsheetTemplateBaseline",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting spreadsheet template baseline confirmation",
    initialBlockedReason:
      "Spreadsheet template baseline must be explicit before data source connections and access policies are treated as controlled."
  },
  {
    id: "checkpoint-spreadsheet-data-sources",
    area: "Data source connections",
    title: "Data source connections defined",
    stageId: "extended-modules",
    domainId: "spreadsheet",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead with IT input",
    guidanceKey: "spreadsheetDataSources",
    dependencyIds: ["checkpoint-spreadsheet-template-baseline"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting data source connections confirmation",
    initialBlockedReason:
      "Data source connections cannot be treated as controlled before the spreadsheet template baseline is explicit."
  },
  {
    id: "checkpoint-spreadsheet-access-policy",
    area: "Access policy",
    title: "Shared access policy bounded",
    stageId: "extended-modules",
    domainId: "spreadsheet",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead with IT input",
    guidanceKey: "spreadsheetAccessPolicy",
    dependencyIds: ["checkpoint-spreadsheet-data-sources"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting shared access policy confirmation",
    initialBlockedReason:
      "Shared access policy cannot be treated as go-live controlled before the data source connections are explicit."
  },
  {
    id: "checkpoint-spreadsheet-dashboard",
    area: "Dashboard setup",
    title: "Dashboard setup assumptions bounded",
    stageId: "extended-modules",
    domainId: "spreadsheet",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Operations lead",
    guidanceKey: "spreadsheetDashboard",
    dependencyIds: ["checkpoint-spreadsheet-access-policy"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting dashboard setup decision confirmation",
    initialBlockedReason: ""
  }
];

export function isSpreadsheetCheckpoint(checkpoint) {
  return checkpoint?.domainId === "spreadsheet";
}
