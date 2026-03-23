export function labelValue(label, value) {
  return value ? `${label}: ${value}` : `${label}: Not set`;
}

export function sentenceCase(value) {
  return value || "Not set";
}
