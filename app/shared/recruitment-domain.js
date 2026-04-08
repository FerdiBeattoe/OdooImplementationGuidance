export const RECRUITMENT_CHECKPOINT_GROUPS = [
  {
    id: "checkpoint-recruitment-pipeline-stages",
    area: "Pipeline stages",
    title: "Recruitment pipeline stages defined",
    stageId: "extended-modules",
    domainId: "recruitment",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "recruitmentPipelineStages",
    dependencyIds: [],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting recruitment pipeline stages confirmation",
    initialBlockedReason:
      "Recruitment pipeline stages must be explicit before job positions and interview processes are treated as controlled."
  },
  {
    id: "checkpoint-recruitment-job-position",
    area: "Job position",
    title: "Job position baseline defined",
    stageId: "extended-modules",
    domainId: "recruitment",
    checkpointClass: "Domain Required",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead",
    guidanceKey: "recruitmentJobPosition",
    dependencyIds: ["checkpoint-recruitment-pipeline-stages"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting job position baseline confirmation",
    initialBlockedReason:
      "Job position baseline cannot be treated as controlled before the recruitment pipeline stages are explicit."
  },
  {
    id: "checkpoint-recruitment-interview-process",
    area: "Interview process",
    title: "Interview process scope bounded",
    stageId: "extended-modules",
    domainId: "recruitment",
    checkpointClass: "Go-Live",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with hiring manager input",
    guidanceKey: "recruitmentInterviewProcess",
    dependencyIds: ["checkpoint-recruitment-job-position"],
    initialStatus: "Fail",
    initialEvidenceStatus: "Awaiting interview process scope confirmation",
    initialBlockedReason:
      "Interview process scope cannot be treated as go-live controlled before the job position baseline is explicit."
  },
  {
    id: "checkpoint-recruitment-offer-workflow",
    area: "Offer workflow",
    title: "Offer workflow assumptions bounded",
    stageId: "extended-modules",
    domainId: "recruitment",
    checkpointClass: "Recommended",
    validationSource: "User-confirmed",
    writeSafetyClass: "Conditional",
    checkpointOwnerDefault: "HR lead with management input",
    guidanceKey: "recruitmentOfferWorkflow",
    dependencyIds: ["checkpoint-recruitment-interview-process"],
    initialStatus: "Warning",
    initialEvidenceStatus: "Awaiting offer workflow decision confirmation",
    initialBlockedReason: ""
  }
];

export function isRecruitmentCheckpoint(checkpoint) {
  return checkpoint?.domainId === "recruitment";
}
