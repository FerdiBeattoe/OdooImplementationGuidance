export function getCombinationError({ edition, deployment }) {
  if (deployment === "Odoo.sh" && edition !== "Enterprise") {
    return "Odoo.sh is supported for Enterprise only.";
  }

  return "";
}

export function isCombinationSupported(selection) {
  return getCombinationError(selection) === "";
}

export function requiresBranchTarget(selection) {
  return selection.edition === "Enterprise" && selection.deployment === "Odoo.sh";
}
