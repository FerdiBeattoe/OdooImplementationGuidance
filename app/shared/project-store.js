export function getProjectStoreRecordId(record) {
  return typeof record?.projectIdentity?.projectId === "string" ? record.projectIdentity.projectId.trim() : "";
}

export function getProjectStoreRecordLabel(record) {
  const projectId = getProjectStoreRecordId(record);

  if (!projectId) {
    return "";
  }

  const projectName = typeof record?.projectIdentity?.projectName === "string"
    ? record.projectIdentity.projectName.trim()
    : "";

  return projectName || projectId;
}

export function isUsableProjectStoreRecord(record) {
  return Boolean(getProjectStoreRecordId(record));
}

export function normalizeProjectStorePayload(payload) {
  const projects = Array.isArray(payload?.projects)
    ? payload.projects.filter(isUsableProjectStoreRecord)
    : [];

  return {
    projects,
    savedAt: typeof payload?.savedAt === "string" ? payload.savedAt : null
  };
}
