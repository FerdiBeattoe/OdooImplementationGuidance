import { normalizeProjectStorePayload } from "/shared/index.js";

const API_ROOT = "/api/projects";

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
