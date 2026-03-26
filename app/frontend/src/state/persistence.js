import { normalizeProjectStorePayload } from "/shared/index.js";

const API_ROOT = "/api/projects";
const CONNECTION_ROOT = "/api/connection";
const DOMAIN_ROOT = "/api/domain";

export async function loadProjectStore() {
  const response = await fetch(API_ROOT);

  if (!response.ok) {
    throw new Error("Failed to load project store.");
  }

  return normalizeProjectStorePayload(await response.json());
}

export async function saveProjectStore(store) {
  const response = await fetch(API_ROOT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(store)
  });

  if (!response.ok) {
    throw new Error("Failed to save project store.");
  }

  return normalizeProjectStorePayload(await response.json());
}

export async function connectProject(project, credentials) {
  const response = await fetch(`${CONNECTION_ROOT}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, credentials })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to connect to Odoo.");
  }

  return payload.project;
}

export async function disconnectProject(project) {
  const response = await fetch(`${CONNECTION_ROOT}/disconnect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to disconnect.");
  }

  return payload.project;
}

export async function inspectDomain(project, domainId) {
  const response = await fetch(`${DOMAIN_ROOT}/inspect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, domainId })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to inspect domain.");
  }

  return payload.project;
}

export async function previewDomain(project, domainId) {
  const response = await fetch(`${DOMAIN_ROOT}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, domainId })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to generate preview.");
  }

  return payload.project;
}

export async function validateConnection(project) {
  const response = await fetch(`${CONNECTION_ROOT}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to validate connection.");
  }

  return payload;
}

export async function executePreview(project, preview, options = {}) {
  const response = await fetch(`${DOMAIN_ROOT}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, preview, options })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || payload.execution?.failureReason || "Failed to execute preview.");
  }

  return payload.project;
}
