export const FOUNDATION_DOMAINS = Object.freeze([
  "foundation",
  "users_roles",
  "master_data",
]);

function normalizeDomainId(domainId) {
  if (typeof domainId !== "string") {
    return null;
  }

  const normalized = domainId.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized === "" ? null : normalized;
}

export function isPaidDomain(domainId) {
  const normalizedDomainId = normalizeDomainId(domainId);
  if (!normalizedDomainId) {
    return false;
  }

  return !FOUNDATION_DOMAINS.includes(normalizedDomainId);
}

export async function checkDomainAccess(projectId, domainId) {
  const encodedProjectId = encodeURIComponent(projectId ?? "");
  const encodedDomainId = encodeURIComponent(domainId ?? "");

  try {
    const response = await fetch(`/api/licence/check-domain/${encodedProjectId}/${encodedDomainId}`);
    const payload = await response.json();
    return {
      unlocked: payload.unlocked === true,
      reason: typeof payload.reason === "string" ? payload.reason : "Unable to verify licence access.",
      upgrade_required: payload.unlocked !== true && isPaidDomain(domainId),
    };
  } catch {
    return {
      unlocked: false,
      reason: "Unable to verify licence access.",
      upgrade_required: isPaidDomain(domainId),
    };
  }
}
