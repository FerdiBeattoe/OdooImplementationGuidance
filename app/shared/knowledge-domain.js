export const KNOWLEDGE_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-knowledge-base-structure",
    area: "Base structure",
    title: "Knowledge base structure defined",
    stageId: "extended-modules",
    domainId: "knowledge",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Knowledge lead",
    guidanceKey: "knowledgeBaseStructure",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting knowledge base structure confirmation",
    initialBlockedReason:
      "Knowledge base structure must be explicit before article templates and access rights are treated as controlled."
  },
  {
    id: "checkpoint-knowledge-article-template",
    area: "Article template",
    title: "Article template baseline defined",
    stageId: "extended-modules",
    domainId: "knowledge",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Knowledge lead",
    guidanceKey: "knowledgeArticleTemplate",
    dependencyIds: ["checkpoint-knowledge-base-structure"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting article template baseline confirmation",
    initialBlockedReason:
      "Article template baseline cannot be treated as controlled before the knowledge base structure is explicit."
  },
  {
    id: "checkpoint-knowledge-access-rights",
    area: "Access rights",
    title: "Access rights policy bounded",
    stageId: "extended-modules",
    domainId: "knowledge",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Knowledge lead with IT input",
    guidanceKey: "knowledgeAccessRights",
    dependencyIds: ["checkpoint-knowledge-article-template"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting access rights policy confirmation",
    initialBlockedReason:
      "Access rights policy cannot be treated as go-live controlled before the article template baseline is explicit."
  },
  {
    id: "checkpoint-knowledge-scope",
    area: "Internal vs external scope",
    title: "Internal vs external scope assumptions bounded",
    stageId: "extended-modules",
    domainId: "knowledge",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "Knowledge lead with operations input",
    guidanceKey: "knowledgeScope",
    dependencyIds: ["checkpoint-knowledge-access-rights"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting internal vs external scope decision confirmation",
    initialBlockedReason: ""
  }
];

export function isKnowledgeCheckpoint(checkpoint) {
  return checkpoint?.domainId === "knowledge";
}
