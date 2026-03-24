import { deriveConnectionWorkspaceModel } from "../../../shared/index.js";

export const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "project-setup", label: "Project Setup" },
  { id: "connection", label: "Connection" },
  { id: "saved-projects", label: "Saved Projects" },
  { id: "help-limits", label: "Help & Limits" }
];

const DEPLOYMENT_EXPLANATIONS = {
  "Odoo Online":
    "Odoo Online remains application-layer only. This build does not use database, shell, or server-control paths.",
  "Odoo.sh":
    "Odoo.sh remains branch-aware for Enterprise targets. Deployment-sensitive execution stays constrained until the target branch or environment is explicit.",
  "On-Premise":
    "On-Premise remains application-layer only in this build. Database, shell, and SSH-based execution paths are blocked."
};

export function getDashboardSection(sectionId) {
  return DASHBOARD_SECTIONS.find((section) => section.id === sectionId) || DASHBOARD_SECTIONS[0];
}

export function getConnectionWorkspaceModel(project) {
  const connection = deriveConnectionWorkspaceModel(project?.connectionState, project?.projectIdentity);

  return {
    ...connection,
    deploymentExplanation:
      DEPLOYMENT_EXPLANATIONS[project?.projectIdentity?.deployment] ||
      "Deployment type changes connection and execution constraints directly.",
    usableWithoutConnection: [
      "Work through checkpoints, guidance, and readiness review",
      "Capture implementation design inputs",
      "Save, resume, and review blockers",
      "Inspect capability claims and deployment constraints before connecting"
    ]
  };
}
