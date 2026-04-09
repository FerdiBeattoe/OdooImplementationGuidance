// ---------------------------------------------------------------------------
// Domain Activation Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   Converts persisted discovery_answers into the persisted portion of
//   activated_domains. Output matches createActivatedDomains() /
//   createActivatedDomainRecord() shapes from runtime-state-contract.js.
//
// Governing constraints:
//   - specs/domain_activation_engine.md (primary authority)
//   - specs/discovery_question_framework.md (question-answer definitions)
//   - specs/runtime_state_contract.md §1.4 (activated_domains persisted fields)
//   - docs/03_Authority_Order.md
//
// Hard rules:
//   R1  Every activation traces to a specific question-answer pair. No inference.
//   R2  Missing required answer → domain NOT activated; reason: "missing_required_input"
//   R3  No computed fields (primary_stage, domain_status, etc.) emitted here.
//   R4  No status assignment.
//   R5  Foundation, users_roles, master_data are unconditionally activated.
//   R6  MF-01 is the sole gate for manufacturing. No other question can activate it.
//   R7  Output object shapes match createActivatedDomains() and
//       createActivatedDomainRecord() exactly — persisted fields only.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";
import {
  createActivatedDomains,
  createActivatedDomainRecord,
} from "./runtime-state-contract.js";
import { getIndustryTemplate } from "./industry-templates.js";

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const DOMAIN_ACTIVATION_ENGINE_VERSION = "1.1.0";

// ---------------------------------------------------------------------------
// BM-01 answer constants — canonical values from discovery_question_framework.md
// ---------------------------------------------------------------------------

const BM01_PHYSICAL_ONLY = "Physical products only";
const BM01_SERVICES_ONLY = "Services only";
const BM01_BOTH = "Both physical products and services";
const BM01_SOFTWARE = "Software or digital products only";
const BM01_PLATFORM = "Platform or marketplace (connecting buyers and sellers)";

/**
 * Returns true if BM-01 answer implies physical product handling.
 * Used to reinforce activation of inventory and manufacturing domains.
 */
function bm01ImpliesPhysical(bm01) {
  return bm01 === BM01_PHYSICAL_ONLY || bm01 === BM01_BOTH;
}

/**
 * Returns true if BM-01 answer implies a sales-generating business model.
 * Covers all product/service/software selling modes (not platform/marketplace).
 */
function bm01ImpliesSales(bm01) {
  return (
    bm01 === BM01_PHYSICAL_ONLY ||
    bm01 === BM01_SERVICES_ONLY ||
    bm01 === BM01_BOTH ||
    bm01 === BM01_SOFTWARE
  );
}

/**
 * Returns true if BM-01 answer implies service delivery in scope.
 */
function bm01ImpliesServices(bm01) {
  return bm01 === BM01_SERVICES_ONLY || bm01 === BM01_BOTH;
}

// ---------------------------------------------------------------------------
// Domain IDs — canonical set from specs/domain_activation_engine.md
// Must match id values produced by domains.js DOMAINS array.
// ---------------------------------------------------------------------------

export const DOMAIN_IDS = Object.freeze({
  FOUNDATION: "foundation",
  USERS_ROLES: "users_roles",
  MASTER_DATA: "master_data",
  CRM: "crm",
  SALES: "sales",
  PURCHASE: "purchase",
  INVENTORY: "inventory",
  MANUFACTURING: "manufacturing",
  PLM: "plm",
  ACCOUNTING: "accounting",
  POS: "pos",
  WEBSITE_ECOMMERCE: "website_ecommerce",
  PROJECTS: "projects",
  HR: "hr",
  QUALITY: "quality",
  MAINTENANCE: "maintenance",
  REPAIRS: "repairs",
  DOCUMENTS: "documents",
  SIGN: "sign",
  APPROVALS: "approvals",
  SUBSCRIPTIONS: "subscriptions",
  RENTAL: "rental",
  FIELD_SERVICE: "field_service",
});

// ---------------------------------------------------------------------------
// Answer accessors — safe reads from discovery_answers.answers
// ---------------------------------------------------------------------------

/**
 * Returns the raw answer for a question ID, or undefined if not present.
 * Does NOT infer or default missing answers.
 */
function getAnswer(answers, questionId) {
  if (answers === null || typeof answers !== "object") return undefined;
  return answers[questionId];
}

/**
 * Returns true if a multi-select answer array includes the given value.
 * Returns false (not undefined) when the answer is missing — callers that
 * need to distinguish "not answered" from "answered false" must call
 * isAnswered() first.
 */
function multiSelectIncludes(answers, questionId, value) {
  const answer = getAnswer(answers, questionId);
  if (!Array.isArray(answer)) return false;
  return answer.includes(value);
}

/**
 * Returns true if the answer was provided (not undefined, not null).
 */
function isAnswered(answers, questionId) {
  const answer = getAnswer(answers, questionId);
  return answer !== undefined && answer !== null;
}

/**
 * Returns the numeric answer, or NaN if missing / non-numeric.
 * Normalizes common range-string answers (e.g. "> 10", "1-10", "< 5")
 * to representative numeric values at read time without mutating the
 * stored answer.
 */
function getNumericAnswer(answers, questionId) {
  const answer = getAnswer(answers, questionId);
  if (answer === undefined || answer === null) return NaN;
  const n = Number(answer);
  if (!isNaN(n)) return n;
  // Normalize range strings to representative numbers
  if (typeof answer === "string") {
    const trimmed = answer.trim();
    if (trimmed === "> 50") return 51;
    if (trimmed === "> 10") return 11;
    if (trimmed === "1-10") return 5;
    if (trimmed === "< 5") return 4;
    // Try parseInt as a last resort for other numeric strings
    const parsed = parseInt(trimmed, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return NaN;
}

// ---------------------------------------------------------------------------
// Record builder — wraps createActivatedDomainRecord with activation_reason
// ---------------------------------------------------------------------------

/**
 * Builds a persisted domain record.
 *
 * activation_reason is either:
 *   - a question_id string (the specific question that caused activation)
 *   - "unconditional" (always-on domains)
 *   - "missing_required_input" (required answer was absent; activated = false)
 *   - an array of question_id strings when multiple questions jointly activate
 *
 * Fields emitted match createActivatedDomainRecord() persisted shape only.
 * No computed fields (primary_stage, domain_status, etc.) are set here.
 */
function buildRecord({
  domain_id,
  activated,
  activation_reason,
  priority = null,
  excluded_reason = null,
  activation_question_refs = [],
  deferral_eligible = false,
}) {
  // activation_question_refs must be an array of question IDs
  const refs = Array.isArray(activation_reason)
    ? activation_reason
    : activation_reason === "unconditional" || activation_reason === "missing_required_input"
    ? []
    : [activation_reason];

  // Merge explicit refs with derived refs (deduplicated)
  const mergedRefs = [...new Set([...activation_question_refs, ...refs])];

  return createActivatedDomainRecord({
    domain_id,
    activated,
    excluded_reason: activated ? null : (activation_reason === "missing_required_input" ? null : (excluded_reason ?? activation_reason)),
    priority: activated ? priority : null,
    activation_question_refs: mergedRefs,
    deferral_eligible,
  });
}

// ---------------------------------------------------------------------------
// Per-domain activation rules
// Each function receives the answers map and returns a domain record.
// ---------------------------------------------------------------------------

function activateFoundation(answers) {
  // Unconditional — always activated
  return buildRecord({
    domain_id: DOMAIN_IDS.FOUNDATION,
    activated: true,
    activation_reason: "unconditional",
    priority: "required",
    deferral_eligible: false,
  });
}

function activateUsersRoles(answers) {
  // Unconditional — always activated
  return buildRecord({
    domain_id: DOMAIN_IDS.USERS_ROLES,
    activated: true,
    activation_reason: "unconditional",
    priority: "required",
    deferral_eligible: false,
  });
}

function activateMasterData(answers) {
  // Unconditional — always activated
  return buildRecord({
    domain_id: DOMAIN_IDS.MASTER_DATA,
    activated: true,
    activation_reason: "unconditional",
    priority: "required",
    deferral_eligible: false,
  });
}

function activateCRM(answers) {
  // Activated when: SC-01 = "Yes"
  if (!isAnswered(answers, "SC-01")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.CRM,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const sc01 = getAnswer(answers, "SC-01");
  if (sc01 !== true && sc01 !== "Yes") {
    return buildRecord({
      domain_id: DOMAIN_IDS.CRM,
      activated: false,
      activation_reason: "SC-01",
      excluded_reason: "SC-01=No",
    });
  }
  return buildRecord({
    domain_id: DOMAIN_IDS.CRM,
    activated: true,
    activation_reason: "SC-01",
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateSales(answers) {
  // Activated when ANY of:
  //   RM-01 includes "One-time product sales"
  //   RM-01 includes "One-time service delivery"
  //   RM-01 includes "Online store"
  //   RM-01 includes "Recurring subscriptions or contracts"
  //   RM-01 includes "Rental of assets or equipment"
  //   RM-01 is a string containing "product" or "service" (natural-language match)
  //   PI-05 = "Yes"
  // PI-05=Yes activates Sales independently of RM-01 being answered.
  //
  // BM-01 (optional reinforcement):
  //   If BM-01 is present and implies a sales-generating model (Physical, Services,
  //   Both, Software), it is added to activation_question_refs when Sales activates
  //   via an existing gate. BM-01 does not activate Sales on its own.
  const triggeringRefs = [];

  if (isAnswered(answers, "RM-01")) {
    const rm01 = getAnswer(answers, "RM-01");

    // Standard array-based matching
    if (multiSelectIncludes(answers, "RM-01", "One-time product sales")) triggeringRefs.push("RM-01");
    if (multiSelectIncludes(answers, "RM-01", "One-time service delivery")) {
      if (!triggeringRefs.includes("RM-01")) triggeringRefs.push("RM-01");
    }
    if (multiSelectIncludes(answers, "RM-01", "Online store")) {
      if (!triggeringRefs.includes("RM-01")) triggeringRefs.push("RM-01");
    }
    if (multiSelectIncludes(answers, "RM-01", "Recurring subscriptions or contracts")) {
      if (!triggeringRefs.includes("RM-01")) triggeringRefs.push("RM-01");
    }
    if (multiSelectIncludes(answers, "RM-01", "Rental of assets or equipment")) {
      if (!triggeringRefs.includes("RM-01")) triggeringRefs.push("RM-01");
    }

    // Natural-language string matching: activate when RM-01 is a plain string
    // containing "product" or "service" (case-insensitive)
    if (!triggeringRefs.includes("RM-01") && typeof rm01 === "string") {
      const lower = rm01.toLowerCase();
      if (lower.includes("product") || lower.includes("service")) {
        triggeringRefs.push("RM-01");
      }
    }
  }

  const pi05 = getAnswer(answers, "PI-05");
  if (pi05 === true || pi05 === "Yes") triggeringRefs.push("PI-05");

  if (triggeringRefs.length === 0) {
    // RM-01 not answered and PI-05 not Yes — missing required input
    if (!isAnswered(answers, "RM-01")) {
      return buildRecord({
        domain_id: DOMAIN_IDS.SALES,
        activated: false,
        activation_reason: "missing_required_input",
      });
    }
    return buildRecord({
      domain_id: DOMAIN_IDS.SALES,
      activated: false,
      activation_reason: "RM-01",
      excluded_reason: "no qualifying RM-01 selection and PI-05 not Yes",
    });
  }

  // BM-01 reinforcement: add as a ref if present and consistent with a selling model
  if (isAnswered(answers, "BM-01") && bm01ImpliesSales(getAnswer(answers, "BM-01"))) {
    triggeringRefs.push("BM-01");
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.SALES,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "required",
    deferral_eligible: false,
  });
}

function activatePurchase(answers) {
  // Activated when ANY of:
  //   PI-01 = "Yes"
  //   MF-04 = "Yes" (conditional on MF-01 = Yes — but if MF-04 was answered Yes, it is valid)
  //   PI-05 = "Yes"
  if (!isAnswered(answers, "PI-01")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.PURCHASE,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  const pi01 = getAnswer(answers, "PI-01");
  if (pi01 === true || pi01 === "Yes") triggeringRefs.push("PI-01");

  const pi05 = getAnswer(answers, "PI-05");
  if (pi05 === true || pi05 === "Yes") triggeringRefs.push("PI-05");

  // MF-04 is conditional on MF-01 = Yes; only evaluate if MF-01 is answered Yes
  const mf01ForPurchase = isAnswered(answers, "MF-01") ? getAnswer(answers, "MF-01") : null;
  if ((mf01ForPurchase === true || mf01ForPurchase === "Yes") && isAnswered(answers, "MF-04")) {
    const mf04 = getAnswer(answers, "MF-04");
    if (mf04 === true || mf04 === "Yes") triggeringRefs.push("MF-04");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.PURCHASE,
      activated: false,
      activation_reason: "PI-01",
      excluded_reason: "PI-01=No and no drop-ship or subcontracting trigger",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.PURCHASE,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "required",
    deferral_eligible: false,
  });
}

function activateInventory(answers) {
  // Activated when ANY of:
  //   OP-01 = "Yes"
  //   RM-04 = "Yes"
  //   MF-01 = "Yes"
  //
  // BM-01 (optional reinforcement):
  //   If BM-01 is present and implies physical product handling (Physical products
  //   only, or Both), it is added to activation_question_refs when inventory
  //   activates via an existing gate. BM-01 does not activate inventory on its own.
  if (!isAnswered(answers, "OP-01")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.INVENTORY,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  const op01 = getAnswer(answers, "OP-01");
  if (op01 === true || op01 === "Yes") triggeringRefs.push("OP-01");

  if (isAnswered(answers, "RM-04")) {
    const rm04 = getAnswer(answers, "RM-04");
    if (rm04 === true || rm04 === "Yes") triggeringRefs.push("RM-04");
  }

  // MF-01 is conditional on BM-01; only count if answered
  if (isAnswered(answers, "MF-01")) {
    const mf01 = getAnswer(answers, "MF-01");
    if (mf01 === true || mf01 === "Yes") triggeringRefs.push("MF-01");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.INVENTORY,
      activated: false,
      activation_reason: "OP-01",
      excluded_reason: "OP-01=No and no rental or manufacturing trigger",
    });
  }

  // BM-01 reinforcement: add as a ref if present and implies physical product handling
  if (isAnswered(answers, "BM-01") && bm01ImpliesPhysical(getAnswer(answers, "BM-01"))) {
    triggeringRefs.push("BM-01");
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.INVENTORY,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "go-live",
    deferral_eligible: false,
  });
}

function activateManufacturing(answers) {
  // Hard gate: MF-01 is the ONLY activation trigger (R6).
  // MF-01 is only asked when BM-01 is not "Services only" and not
  // "Software or digital products only". If MF-01 was never asked, it will
  // be absent from answers — domain is excluded.
  //
  // BM-01 (optional reinforcement):
  //   If BM-01 is present and implies physical product handling, it is added
  //   to activation_question_refs alongside MF-01 when manufacturing activates.
  //   BM-01 does not satisfy the MF-01 gate — MF-01 must still be answered Yes.
  if (!isAnswered(answers, "MF-01")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.MANUFACTURING,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const mf01 = getAnswer(answers, "MF-01");
  if (mf01 !== true && mf01 !== "Yes") {
    return buildRecord({
      domain_id: DOMAIN_IDS.MANUFACTURING,
      activated: false,
      activation_reason: "MF-01",
      excluded_reason: "MF-01=No",
    });
  }

  // MF-01=Yes confirmed. Collect refs — MF-01 is mandatory.
  const activationRefs = ["MF-01"];

  // BM-01 reinforcement: add if present and consistent with physical product scope
  if (isAnswered(answers, "BM-01") && bm01ImpliesPhysical(getAnswer(answers, "BM-01"))) {
    activationRefs.push("BM-01");
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.MANUFACTURING,
    activated: true,
    activation_reason: activationRefs,
    priority: "go-live",
    deferral_eligible: true,
  });
}

function activatePLM(answers) {
  // Activated when: MF-01 = "Yes" AND MF-05 = "Yes"
  // MF-05 is only asked when MF-01 = Yes.
  if (!isAnswered(answers, "MF-01")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.PLM,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const mf01 = getAnswer(answers, "MF-01");
  if (mf01 !== true && mf01 !== "Yes") {
    return buildRecord({
      domain_id: DOMAIN_IDS.PLM,
      activated: false,
      activation_reason: "MF-01",
      excluded_reason: "MF-01=No — MF-05 not asked",
    });
  }
  if (!isAnswered(answers, "MF-05")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.PLM,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const mf05 = getAnswer(answers, "MF-05");
  if (mf05 !== true && mf05 !== "Yes") {
    return buildRecord({
      domain_id: DOMAIN_IDS.PLM,
      activated: false,
      activation_reason: "MF-05",
      excluded_reason: "MF-05=No",
    });
  }
  return buildRecord({
    domain_id: DOMAIN_IDS.PLM,
    activated: true,
    activation_reason: ["MF-01", "MF-05"],
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateAccounting(answers) {
  // Activated when: FC-01 = "Full accounting" OR FC-01 = "Invoicing only"
  // Excluded when: FC-01 = "Not using Odoo for financials"
  if (!isAnswered(answers, "FC-01")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.ACCOUNTING,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const fc01 = getAnswer(answers, "FC-01");
  if (fc01 === "Full accounting") {
    return buildRecord({
      domain_id: DOMAIN_IDS.ACCOUNTING,
      activated: true,
      activation_reason: "FC-01",
      priority: "go-live",
      deferral_eligible: false,
    });
  }
  if (fc01 === "Invoicing only") {
    return buildRecord({
      domain_id: DOMAIN_IDS.ACCOUNTING,
      activated: true,
      activation_reason: "FC-01",
      priority: "recommended",
      deferral_eligible: false,
    });
  }
  // "Not using Odoo for financials" or any unrecognised value
  return buildRecord({
    domain_id: DOMAIN_IDS.ACCOUNTING,
    activated: false,
    activation_reason: "FC-01",
    excluded_reason: "FC-01=Not using Odoo for financials",
  });
}

function activatePOS(answers) {
  // Activated when ANY of:
  //   OP-03 = "Yes"
  //   RM-01 includes "Point-of-sale"
  if (!isAnswered(answers, "OP-03")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.POS,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  const op03 = getAnswer(answers, "OP-03");
  if (op03 === true || op03 === "Yes") triggeringRefs.push("OP-03");

  if (isAnswered(answers, "RM-01") && multiSelectIncludes(answers, "RM-01", "Point-of-sale (retail, walk-in, or counter sales)")) {
    triggeringRefs.push("RM-01");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.POS,
      activated: false,
      activation_reason: "OP-03",
      excluded_reason: "OP-03=No and RM-01 does not include Point-of-sale",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.POS,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "go-live",
    deferral_eligible: true,
  });
}

function activateWebsiteEcommerce(answers) {
  // Activated when ANY of:
  //   OP-04 = "Yes"
  //   RM-01 includes "Online store"
  if (!isAnswered(answers, "OP-04")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.WEBSITE_ECOMMERCE,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  const op04 = getAnswer(answers, "OP-04");
  if (op04 === true || op04 === "Yes") triggeringRefs.push("OP-04");

  if (isAnswered(answers, "RM-01") && multiSelectIncludes(answers, "RM-01", "Online store (customers place orders via a website)")) {
    if (!triggeringRefs.includes("RM-01")) triggeringRefs.push("RM-01");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.WEBSITE_ECOMMERCE,
      activated: false,
      activation_reason: "OP-04",
      excluded_reason: "OP-04=No and RM-01 does not include Online store",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.WEBSITE_ECOMMERCE,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateProjects(answers) {
  // Activated when ANY of:
  //   RM-01 includes "Project-based billing"
  //   RM-02 = "Yes"
  //   OP-05 = "Yes"
  //
  // BM-01 (optional reinforcement):
  //   If BM-01 is present and implies service delivery (Services only, or Both),
  //   it is added to activation_question_refs when projects activates via an
  //   existing gate. BM-01 does not activate projects on its own.
  if (!isAnswered(answers, "RM-02")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.PROJECTS,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  if (isAnswered(answers, "RM-01") && multiSelectIncludes(answers, "RM-01", "Project-based billing (time and materials or fixed price)")) {
    triggeringRefs.push("RM-01");
  }

  const rm02 = getAnswer(answers, "RM-02");
  if (rm02 === true || rm02 === "Yes") triggeringRefs.push("RM-02");

  if (isAnswered(answers, "OP-05")) {
    const op05 = getAnswer(answers, "OP-05");
    if (op05 === true || op05 === "Yes") triggeringRefs.push("OP-05");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.PROJECTS,
      activated: false,
      activation_reason: "RM-02",
      excluded_reason: "no qualifying RM-01/RM-02/OP-05 trigger",
    });
  }

  // BM-01 reinforcement: add if present and implies service delivery
  if (isAnswered(answers, "BM-01") && bm01ImpliesServices(getAnswer(answers, "BM-01"))) {
    triggeringRefs.push("BM-01");
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.PROJECTS,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateHR(answers) {
  // Activated when ANY of:
  //   BM-05 > 10
  //   TA-03 includes "HR leave requests"
  //   RM-02 = "Yes"
  //   TA-01 includes "HR Officers vs. HR Managers"
  if (!isAnswered(answers, "BM-05")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.HR,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  const bm05 = getNumericAnswer(answers, "BM-05");
  if (!isNaN(bm05) && bm05 > 10) triggeringRefs.push("BM-05");

  if (isAnswered(answers, "TA-03") && multiSelectIncludes(answers, "TA-03", "HR leave requests")) {
    triggeringRefs.push("TA-03");
  }

  if (isAnswered(answers, "RM-02")) {
    const rm02 = getAnswer(answers, "RM-02");
    if (rm02 === true || rm02 === "Yes") triggeringRefs.push("RM-02");
  }

  if (isAnswered(answers, "TA-01") && multiSelectIncludes(answers, "TA-01", "HR Officers vs. HR Managers")) {
    if (!triggeringRefs.includes("TA-01")) triggeringRefs.push("TA-01");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.HR,
      activated: false,
      activation_reason: "BM-05",
      excluded_reason: "BM-05 <= 10 and no HR-specific trigger answered",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.HR,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateQuality(answers) {
  // Activated when ANY of:
  //   MF-06 includes any option other than "None"
  //   PI-03 = "3 steps" AND MF-06 includes "On receipt from supplier"
  //
  // MF-06 is conditional on MF-01=Yes OR PI-03=3 steps.
  // If MF-06 was never asked, domain is excluded.
  const mf06Answered = isAnswered(answers, "MF-06");
  const pi03Answered = isAnswered(answers, "PI-03");

  if (!mf06Answered) {
    // Check if PI-03 was the trigger path
    if (!pi03Answered) {
      // Neither trigger path has answers — exclude
      return buildRecord({
        domain_id: DOMAIN_IDS.QUALITY,
        activated: false,
        activation_reason: "missing_required_input",
      });
    }
    // PI-03 answered but MF-06 not asked — cannot activate quality
    return buildRecord({
      domain_id: DOMAIN_IDS.QUALITY,
      activated: false,
      activation_reason: "MF-06",
      excluded_reason: "MF-06 not answered",
    });
  }

  const mf06 = getAnswer(answers, "MF-06");
  const mf06Array = Array.isArray(mf06) ? mf06 : [];

  // Empty array means the question was answered but nothing selected — treat as missing
  if (mf06Array.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.QUALITY,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }

  const hasNone = mf06Array.includes("None — quality is managed externally or not required in Odoo");
  const hasNonNone = mf06Array.some(
    (v) => v !== "None — quality is managed externally or not required in Odoo"
  );

  // If answer is only "None", domain is excluded
  if (!hasNonNone) {
    return buildRecord({
      domain_id: DOMAIN_IDS.QUALITY,
      activated: false,
      activation_reason: "MF-06",
      excluded_reason: "MF-06=None",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.QUALITY,
    activated: true,
    activation_reason: "MF-06",
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateMaintenance(answers) {
  // Activated when ALL of:
  //   MF-03 = "Yes" (gate — MF-07 only asked when MF-03 = Yes)
  //   MF-07 = "Yes"
  if (!isAnswered(answers, "MF-03")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.MAINTENANCE,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const mf03 = getAnswer(answers, "MF-03");
  if (mf03 !== true && mf03 !== "Yes") {
    return buildRecord({
      domain_id: DOMAIN_IDS.MAINTENANCE,
      activated: false,
      activation_reason: "MF-03",
      excluded_reason: "MF-03=No — MF-07 not asked",
    });
  }
  if (!isAnswered(answers, "MF-07")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.MAINTENANCE,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const mf07 = getAnswer(answers, "MF-07");
  if (mf07 !== true && mf07 !== "Yes") {
    return buildRecord({
      domain_id: DOMAIN_IDS.MAINTENANCE,
      activated: false,
      activation_reason: "MF-07",
      excluded_reason: "MF-07=No",
    });
  }
  return buildRecord({
    domain_id: DOMAIN_IDS.MAINTENANCE,
    activated: true,
    activation_reason: ["MF-03", "MF-07"],
    priority: "optional",
    deferral_eligible: true,
  });
}

function activateRepairs(answers) {
  // Activated when ALL of:
  //   OP-01 = "Yes"
  //   RM-01 includes "One-time service delivery" OR OP-05 = "Yes"
  if (!isAnswered(answers, "OP-01")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.REPAIRS,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const op01 = getAnswer(answers, "OP-01");
  if (op01 !== true && op01 !== "Yes") {
    return buildRecord({
      domain_id: DOMAIN_IDS.REPAIRS,
      activated: false,
      activation_reason: "OP-01",
      excluded_reason: "OP-01=No",
    });
  }

  // Second condition: service delivery present
  const hasServiceDelivery =
    isAnswered(answers, "RM-01") &&
    multiSelectIncludes(answers, "RM-01", "One-time service delivery");
  const op05Yes =
    isAnswered(answers, "OP-05") &&
    (getAnswer(answers, "OP-05") === true || getAnswer(answers, "OP-05") === "Yes");

  if (!hasServiceDelivery && !op05Yes) {
    // RM-01 must be answered (required question) — check for missing
    if (!isAnswered(answers, "RM-01")) {
      return buildRecord({
        domain_id: DOMAIN_IDS.REPAIRS,
        activated: false,
        activation_reason: "missing_required_input",
      });
    }
    return buildRecord({
      domain_id: DOMAIN_IDS.REPAIRS,
      activated: false,
      activation_reason: "RM-01",
      excluded_reason: "OP-01=Yes but no service delivery mechanism present",
    });
  }

  const triggeringRefs = ["OP-01"];
  if (hasServiceDelivery) triggeringRefs.push("RM-01");
  if (op05Yes) triggeringRefs.push("OP-05");

  return buildRecord({
    domain_id: DOMAIN_IDS.REPAIRS,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "optional",
    deferral_eligible: true,
  });
}

function activateDocuments(answers) {
  // Activated when ANY of:
  //   MF-05 = "Yes"
  //   TA-03 includes "Contract or document signing"
  //   BM-05 > 50
  if (!isAnswered(answers, "BM-05")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.DOCUMENTS,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  const bm05 = getNumericAnswer(answers, "BM-05");
  if (!isNaN(bm05) && bm05 > 50) triggeringRefs.push("BM-05");

  if (isAnswered(answers, "MF-05")) {
    const mf05 = getAnswer(answers, "MF-05");
    if (mf05 === true || mf05 === "Yes") triggeringRefs.push("MF-05");
  }

  if (isAnswered(answers, "TA-03") && multiSelectIncludes(answers, "TA-03", "Contract or document signing")) {
    triggeringRefs.push("TA-03");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.DOCUMENTS,
      activated: false,
      activation_reason: "BM-05",
      excluded_reason: "BM-05 <= 50 and no document-related trigger",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.DOCUMENTS,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateSign(answers) {
  // Activated when: TA-03 includes "Contract or document signing"
  if (!isAnswered(answers, "TA-03")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.SIGN,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  if (!multiSelectIncludes(answers, "TA-03", "Contract or document signing")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.SIGN,
      activated: false,
      activation_reason: "TA-03",
      excluded_reason: "TA-03 does not include Contract or document signing",
    });
  }
  return buildRecord({
    domain_id: DOMAIN_IDS.SIGN,
    activated: true,
    activation_reason: "TA-03",
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateApprovals(answers) {
  // Activated when ANY of:
  //   TA-03 includes any option other than "None"
  //   BM-05 > 50 AND (SC-02 = "Yes" OR PI-02 = "Threshold"/"All orders" OR SC-04 = "Manager approval above threshold")
  if (!isAnswered(answers, "TA-03")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.APPROVALS,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  if (!isAnswered(answers, "BM-05")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.APPROVALS,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }

  const triggeringRefs = [];

  const ta03 = getAnswer(answers, "TA-03");
  const ta03Array = Array.isArray(ta03) ? ta03 : [];
  const ta03NonNone = ta03Array.filter(
    (v) => v !== "None — standard module approvals are sufficient"
  );
  if (ta03NonNone.length > 0) triggeringRefs.push("TA-03");

  const bm05 = getNumericAnswer(answers, "BM-05");
  if (!isNaN(bm05) && bm05 > 50) {
    const sc02 = isAnswered(answers, "SC-02")
      ? getAnswer(answers, "SC-02")
      : null;
    const pi02 = isAnswered(answers, "PI-02")
      ? getAnswer(answers, "PI-02")
      : null;
    const sc04 = isAnswered(answers, "SC-04")
      ? getAnswer(answers, "SC-04")
      : null;

    const sc02Triggers = sc02 === true || sc02 === "Yes";
    const pi02Triggers =
      pi02 === "Approval required above a monetary threshold" ||
      pi02 === "All purchase orders require manager approval";
    const sc04Triggers = sc04 === "Discounts require manager approval above a threshold";

    if (sc02Triggers || pi02Triggers || sc04Triggers) {
      if (!triggeringRefs.includes("BM-05")) triggeringRefs.push("BM-05");
      if (sc02Triggers && !triggeringRefs.includes("SC-02")) triggeringRefs.push("SC-02");
      if (pi02Triggers && !triggeringRefs.includes("PI-02")) triggeringRefs.push("PI-02");
      if (sc04Triggers && !triggeringRefs.includes("SC-04")) triggeringRefs.push("SC-04");
    }
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.APPROVALS,
      activated: false,
      activation_reason: "TA-03",
      excluded_reason: "TA-03=None and no large-org approval triggers",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.APPROVALS,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "recommended",
    deferral_eligible: true,
  });
}

function activateSubscriptions(answers) {
  // Activated when ANY of:
  //   RM-03 = "Yes"
  //   RM-01 includes "Recurring subscriptions or contracts"
  if (!isAnswered(answers, "RM-03")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.SUBSCRIPTIONS,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  const rm03 = getAnswer(answers, "RM-03");
  if (rm03 === true || rm03 === "Yes") triggeringRefs.push("RM-03");

  if (
    isAnswered(answers, "RM-01") &&
    multiSelectIncludes(answers, "RM-01", "Recurring subscriptions or contracts")
  ) {
    if (!triggeringRefs.includes("RM-01")) triggeringRefs.push("RM-01");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.SUBSCRIPTIONS,
      activated: false,
      activation_reason: "RM-03",
      excluded_reason: "RM-03=No and RM-01 does not include Recurring subscriptions",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.SUBSCRIPTIONS,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "optional",
    deferral_eligible: true,
  });
}

function activateRental(answers) {
  // Activated when ANY of:
  //   RM-04 = "Yes"
  //   RM-01 includes "Rental of assets or equipment"
  if (!isAnswered(answers, "RM-04")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.RENTAL,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const triggeringRefs = [];

  const rm04 = getAnswer(answers, "RM-04");
  if (rm04 === true || rm04 === "Yes") triggeringRefs.push("RM-04");

  if (
    isAnswered(answers, "RM-01") &&
    multiSelectIncludes(answers, "RM-01", "Rental of assets or equipment")
  ) {
    if (!triggeringRefs.includes("RM-01")) triggeringRefs.push("RM-01");
  }

  if (triggeringRefs.length === 0) {
    return buildRecord({
      domain_id: DOMAIN_IDS.RENTAL,
      activated: false,
      activation_reason: "RM-04",
      excluded_reason: "RM-04=No and RM-01 does not include Rental",
    });
  }

  return buildRecord({
    domain_id: DOMAIN_IDS.RENTAL,
    activated: true,
    activation_reason: triggeringRefs,
    priority: "optional",
    deferral_eligible: true,
  });
}

function activateFieldService(answers) {
  // Activated when: OP-05 = "Yes"
  if (!isAnswered(answers, "OP-05")) {
    return buildRecord({
      domain_id: DOMAIN_IDS.FIELD_SERVICE,
      activated: false,
      activation_reason: "missing_required_input",
    });
  }
  const op05 = getAnswer(answers, "OP-05");
  if (op05 !== true && op05 !== "Yes") {
    return buildRecord({
      domain_id: DOMAIN_IDS.FIELD_SERVICE,
      activated: false,
      activation_reason: "OP-05",
      excluded_reason: "OP-05=No",
    });
  }
  return buildRecord({
    domain_id: DOMAIN_IDS.FIELD_SERVICE,
    activated: true,
    activation_reason: "OP-05",
    priority: "optional",
    deferral_eligible: true,
  });
}

// ---------------------------------------------------------------------------
// Ordered list of per-domain activators
// Order matches Activation Summary Table in domain_activation_engine.md §1.4
// ---------------------------------------------------------------------------

const DOMAIN_ACTIVATORS = [
  activateFoundation,
  activateUsersRoles,
  activateMasterData,
  activateCRM,
  activateSales,
  activatePurchase,
  activateInventory,
  activateManufacturing,
  activatePLM,
  activateAccounting,
  activatePOS,
  activateWebsiteEcommerce,
  activateProjects,
  activateHR,
  activateQuality,
  activateMaintenance,
  activateRepairs,
  activateDocuments,
  activateSign,
  activateApprovals,
  activateSubscriptions,
  activateRental,
  activateFieldService,
];

// ---------------------------------------------------------------------------
// Main export: computeActivatedDomains
// ---------------------------------------------------------------------------

/**
 * Converts persisted discovery_answers into the persisted portion of
 * activated_domains.
 *
 * Input:
 *   discoveryAnswers — the discovery_answers object from project state
 *                      (shape: { answers: {}, answered_at: {}, ... })
 *
 * Output:
 *   activated_domains persisted object matching createActivatedDomains():
 *     {
 *       domains: [ ...createActivatedDomainRecord() shapes ],
 *       activation_engine_version: string,
 *       activated_at: ISO 8601 timestamp,
 *     }
 *
 * Guarantees:
 *   - No computed fields (primary_stage, domain_status, etc.) are present.
 *   - Every domain record traces to a specific question_id or "unconditional".
 *   - Missing required answers produce activated=false with
 *     activation_reason="missing_required_input".
 *   - No inference. No defaults applied to missing answers.
 */
export function computeActivatedDomains(discoveryAnswers) {
  if (discoveryAnswers === null || typeof discoveryAnswers !== "object") {
    throw new Error(
      "computeActivatedDomains: discoveryAnswers must be a non-null object."
    );
  }

  const answers =
    discoveryAnswers.answers !== undefined && discoveryAnswers.answers !== null
      ? discoveryAnswers.answers
      : {};

  if (typeof answers !== "object" || Array.isArray(answers)) {
    throw new Error(
      "computeActivatedDomains: discoveryAnswers.answers must be a plain object."
    );
  }

  const result = createActivatedDomains();
  result.activation_engine_version = DOMAIN_ACTIVATION_ENGINE_VERSION;
  result.activated_at = new Date().toISOString();

  for (const activator of DOMAIN_ACTIVATORS) {
    const record = activator(answers);
    result.domains.push(record);
  }

  return result;
}

/**
 * Returns the domain record for a given domain_id from a computed
 * activated_domains output, or null if not found.
 */
export function getDomainRecord(activatedDomains, domainId) {
  if (!activatedDomains || !Array.isArray(activatedDomains.domains)) return null;
  return activatedDomains.domains.find((d) => d.domain_id === domainId) ?? null;
}

/**
 * Returns a filtered array of only activated domain records.
 */
export function getActivatedDomains(activatedDomains) {
  if (!activatedDomains || !Array.isArray(activatedDomains.domains)) return [];
  return activatedDomains.domains.filter((d) => d.activated === true);
}

/**
 * Returns a filtered array of only excluded (not activated) domain records.
 */
export function getExcludedDomains(activatedDomains) {
  if (!activatedDomains || !Array.isArray(activatedDomains.domains)) return [];
  return activatedDomains.domains.filter((d) => d.activated === false);
}

// ---------------------------------------------------------------------------
// Industry-template domain activation hints
// ---------------------------------------------------------------------------

/**
 * Returns the recommended domain activation hints for a given industry ID.
 *
 * "Hints" are the recommendedModules list from the industry template —
 * an ordered array of domain IDs that the template recommends activating.
 * This is advisory only; it does not alter computeActivatedDomains() output.
 *
 * Input:
 *   industryId — string key from INDUSTRY_TEMPLATES (e.g. "manufacturing")
 *
 * Output:
 *   {
 *     industryId: string,
 *     industryName: string,
 *     recommendedDomains: string[],   // ordered domain IDs
 *     stageOrder: string[],           // ordered stage sequence from template
 *   }
 *
 * Returns null if the industryId is not recognised.
 */
export function getIndustryDomainHints(industryId) {
  if (typeof industryId !== "string" || industryId.trim() === "") return null;
  const template = getIndustryTemplate(industryId);
  if (!template) return null;
  // getIndustryTemplate falls back to manufacturing for unknown IDs.
  // Only return hints when the template ID matches the requested ID.
  if (template.id !== industryId) return null;
  return {
    industryId: template.id,
    industryName: template.name,
    recommendedDomains: Array.isArray(template.recommendedModules)
      ? template.recommendedModules.slice()
      : [],
    stageOrder: Array.isArray(template.stageOrder)
      ? template.stageOrder.slice()
      : [],
  };
}
