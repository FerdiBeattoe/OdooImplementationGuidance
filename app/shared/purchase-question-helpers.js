// ---------------------------------------------------------------------------
// Purchase question helpers — PI-02 answer normalization
// ---------------------------------------------------------------------------
//
// Purpose:
//   Normalize PI-02 ("Do purchase orders require approval...?") answers so
//   downstream engines can make consistent decisions regardless of whether the
//   answer came from the onboarding wizard (full sentences) or the pipeline
//   view (short labels like "Threshold" / "All orders").
//
// Rules:
//   R1  Input is treated as a string. Non-string values return null tokens.
//   R2  Comparison is case-insensitive and ignores leading/trailing whitespace.
//   R3  Accepts both the long-form onboarding strings and short tokens.
//   R4  Returned tokens are stable constants to avoid ad-hoc string literals.
// ---------------------------------------------------------------------------

const PI02_TOKENS = Object.freeze({
  NO_APPROVAL: "no_approval",
  THRESHOLD: "threshold",
  ALL_ORDERS: "all_orders",
});

function normalizeAnswer(raw) {
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.startsWith("no approval")) {
    return PI02_TOKENS.NO_APPROVAL;
  }
  if (
    normalized.startsWith("approval required above") ||
    normalized.startsWith("threshold")
  ) {
    return PI02_TOKENS.THRESHOLD;
  }
  if (
    normalized.startsWith("all purchase orders") ||
    normalized.startsWith("all orders")
  ) {
    return PI02_TOKENS.ALL_ORDERS;
  }
  return null;
}

export function isPi02NoApproval(raw) {
  return normalizeAnswer(raw) === PI02_TOKENS.NO_APPROVAL;
}

export function isPi02Threshold(raw) {
  return normalizeAnswer(raw) === PI02_TOKENS.THRESHOLD;
}

export function isPi02AllOrders(raw) {
  return normalizeAnswer(raw) === PI02_TOKENS.ALL_ORDERS;
}
